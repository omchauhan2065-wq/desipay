/**
 * Session Management Service
 * ================================================
 * Redis-backed session management with concurrent
 * session limits, device tracking, and token rotation.
 * Persists to PostgreSQL for audit durability with in-memory fallback.
 * 
 * Developed by: Om Chauhan
 */

import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();
import { getRedisClient } from '../../config/redis';
import { prisma } from '../../config/prisma';
import { logger, securityLogger } from '../../config/logger';
import { SECURITY } from '../../config/security';

const SESSION_PREFIX = 'session:';
const USER_SESSIONS_PREFIX = 'user_sessions:';

export interface SessionData {
  sessionId: string;
  userId: string;
  refreshToken: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
}

// In-memory fallback
const memorySessions = new Map<string, SessionData>();
const memoryUserSessions = new Map<string, Set<string>>();

export class SessionService {
  /**
   * Create a new session
   * Enforces max concurrent sessions per user
   */
  async createSession(
    userId: string,
    refreshToken: string,
    userAgent: string,
    ipAddress: string
  ): Promise<SessionData> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sessionData: SessionData = {
      sessionId,
      userId,
      refreshToken,
      userAgent: userAgent || 'unknown',
      ipAddress: ipAddress || 'unknown',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Check and enforce concurrent session limit
    await this.enforceSessionLimit(userId);

    // 1. Store session in Redis
    try {
      const redis = getRedisClient();
      const sessionKey = `${SESSION_PREFIX}${sessionId}`;
      const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
      await redis.setex(sessionKey, ttl, JSON.stringify(sessionData));

      const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
      await redis.sadd(userSessionsKey, sessionId);
      await redis.expire(userSessionsKey, ttl);
    } catch {
      logger.warn('Redis unavailable, using memory store for session');
    }

    // Always keep memory map updated for immediate fallback
    memorySessions.set(sessionId, sessionData);
    if (!memoryUserSessions.has(userId)) {
      memoryUserSessions.set(userId, new Set());
    }
    memoryUserSessions.get(userId)!.add(sessionId);

    // 2. Persist to PostgreSQL if connected
    try {
      await prisma.session.create({
        data: {
          id: sessionId,
          userId,
          refreshToken,
          userAgent: userAgent || 'unknown',
          ipAddress: ipAddress || 'unknown',
          expiresAt,
        },
      });
    } catch (error) {
      logger.warn('Failed to persist session to DB (Redis/memory is authoritative)', { error });
    }

    logger.debug('Session created', { sessionId, userId });
    return sessionData;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const redis = getRedisClient();
      const key = `${SESSION_PREFIX}${sessionId}`;
      const data = await redis.get(key);
      if (data) return JSON.parse(data) as SessionData;
    } catch {
      // Fallback
    }

    const mem = memorySessions.get(sessionId);
    if (mem && new Date(mem.expiresAt) > new Date()) {
      return mem;
    }

    try {
      const dbSession = await prisma.session.findUnique({
        where: { id: sessionId, isActive: true },
      });
      if (dbSession && dbSession.expiresAt > new Date()) {
        return {
          sessionId: dbSession.id,
          userId: dbSession.userId,
          refreshToken: dbSession.refreshToken,
          userAgent: dbSession.userAgent || 'unknown',
          ipAddress: dbSession.ipAddress || 'unknown',
          createdAt: dbSession.createdAt.toISOString(),
          expiresAt: dbSession.expiresAt.toISOString(),
        };
      }
    } catch {
      // Ignore DB error
    }

    return null;
  }

  /**
   * Get session by refresh token
   */
  async getSessionByRefreshToken(refreshToken: string): Promise<SessionData | null> {
    // Check memory first
    for (const session of memorySessions.values()) {
      if (session.refreshToken === refreshToken && new Date(session.expiresAt) > new Date()) {
        return session;
      }
    }

    // Check DB
    try {
      const dbSession = await prisma.session.findUnique({
        where: { refreshToken, isActive: true },
      });

      if (!dbSession || dbSession.expiresAt < new Date()) return null;

      const sessionData: SessionData = {
        sessionId: dbSession.id,
        userId: dbSession.userId,
        refreshToken: dbSession.refreshToken,
        userAgent: dbSession.userAgent || 'unknown',
        ipAddress: dbSession.ipAddress || 'unknown',
        createdAt: dbSession.createdAt.toISOString(),
        expiresAt: dbSession.expiresAt.toISOString(),
      };

      memorySessions.set(sessionData.sessionId, sessionData);
      return sessionData;
    } catch (error) {
      logger.error('Error looking up session by refresh token', { error });
      return null;
    }
  }

  /**
   * Invalidate a specific session
   */
  async destroySession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    try {
      const redis = getRedisClient();
      await redis.del(`${SESSION_PREFIX}${sessionId}`);
      if (session) {
        await redis.srem(`${USER_SESSIONS_PREFIX}${session.userId}`, sessionId);
      }
    } catch {
      // Ignore redis error
    }

    // Memory clean
    if (session) {
      memoryUserSessions.get(session.userId)?.delete(sessionId);
    }
    memorySessions.delete(sessionId);

    // Database mark inactive
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false },
      });
    } catch (error) {
      logger.warn('Failed to deactivate session in DB', { error });
    }

    logger.debug('Session destroyed', { sessionId });
  }

  /**
   * Invalidate ALL sessions for a user (nuclear security revocation)
   */
  async destroyAllUserSessions(userId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
      const sessionIds = await redis.smembers(userSessionsKey);

      for (const sessionId of sessionIds) {
        await redis.del(`${SESSION_PREFIX}${sessionId}`);
      }
      await redis.del(userSessionsKey);
    } catch {
      // Ignore redis error
    }

    // Memory clean
    const memUserSessions = memoryUserSessions.get(userId);
    if (memUserSessions) {
      for (const sid of memUserSessions) {
        memorySessions.delete(sid);
      }
      memoryUserSessions.delete(userId);
    }

    // Database mark all inactive
    try {
      await prisma.session.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
    } catch (error) {
      logger.warn('Failed to deactivate sessions in DB', { error });
    }

    securityLogger.warn('All sessions destroyed for user', { userId });
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    const sessions: SessionData[] = [];
    const seenIds = new Set<string>();

    try {
      const redis = getRedisClient();
      const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;
      const sessionIds = await redis.smembers(userSessionsKey);

      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
          seenIds.add(session.sessionId);
        }
      }
    } catch {
      // Redis unavailable
    }

    const memIds = memoryUserSessions.get(userId);
    if (memIds) {
      for (const sid of memIds) {
        if (!seenIds.has(sid)) {
          const s = memorySessions.get(sid);
          if (s && new Date(s.expiresAt) > new Date()) {
            sessions.push(s);
            seenIds.add(sid);
          }
        }
      }
    }

    return sessions;
  }

  /**
   * Enforce maximum concurrent sessions per user
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);

    if (sessions.length >= SECURITY.SESSION.MAX_CONCURRENT_SESSIONS) {
      sessions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const sessionsToRemove = sessions.slice(0, sessions.length - SECURITY.SESSION.MAX_CONCURRENT_SESSIONS + 1);
      for (const session of sessionsToRemove) {
        await this.destroySession(session.sessionId);
        logger.info('Evicted oldest session due to concurrency limit', {
          userId,
          sessionId: session.sessionId,
        });
      }
    }
  }

  /**
   * Update session with new refresh token (rotation)
   */
  async rotateRefreshToken(
    oldSessionId: string,
    newRefreshToken: string
  ): Promise<SessionData | null> {
    const session = await this.getSession(oldSessionId);
    if (!session) return null;

    session.refreshToken = newRefreshToken;

    // Redis update
    try {
      const redis = getRedisClient();
      const sessionKey = `${SESSION_PREFIX}${oldSessionId}`;
      const ttl = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);
      if (ttl > 0) {
        await redis.setex(sessionKey, ttl, JSON.stringify(session));
      }
    } catch {
      // Ignore
    }

    memorySessions.set(oldSessionId, session);

    // DB update
    try {
      await prisma.session.update({
        where: { id: oldSessionId },
        data: { refreshToken: newRefreshToken },
      });
    } catch (error) {
      logger.warn('Failed to update session refresh token in DB', { error });
    }

    return session;
  }
}

export const sessionService = new SessionService();
