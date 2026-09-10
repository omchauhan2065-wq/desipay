/**
 * Session Service Unit Tests
 * ================================================
 * Developed by: Om Chauhan
 */

import { sessionService } from '../../src/modules/auth/session.service';
import { SECURITY } from '../../src/config/security';

describe('SessionService', () => {
  const userId = 'user-session-test-01';

  it('should create and retrieve a session', async () => {
    const session = await sessionService.createSession(
      userId,
      'test-refresh-token-01',
      'Mozilla/5.0 (iPhone)',
      '192.168.1.1'
    );

    expect(session.sessionId).toBeDefined();
    expect(session.userId).toBe(userId);
    expect(session.userAgent).toBe('Mozilla/5.0 (iPhone)');
    expect(session.ipAddress).toBe('192.168.1.1');

    const fetched = await sessionService.getSession(session.sessionId);
    expect(fetched).toBeDefined();
    expect(fetched?.sessionId).toBe(session.sessionId);
  });

  it('should rotate refresh token for an existing session', async () => {
    const session = await sessionService.createSession(
      userId,
      'old-refresh-token',
      'Chrome Browser',
      '192.168.1.2'
    );

    const updated = await sessionService.rotateRefreshToken(
      session.sessionId,
      'new-refresh-token-rotated'
    );

    expect(updated).toBeDefined();
    expect(updated?.refreshToken).toBe('new-refresh-token-rotated');

    const retrieved = await sessionService.getSession(session.sessionId);
    expect(retrieved?.refreshToken).toBe('new-refresh-token-rotated');
  });

  it('should destroy a specific session upon logout', async () => {
    const session = await sessionService.createSession(
      userId,
      'token-to-destroy',
      'Firefox',
      '10.0.0.1'
    );

    await sessionService.destroySession(session.sessionId);

    const fetched = await sessionService.getSession(session.sessionId);
    expect(fetched).toBeNull();
  });

  it('should enforce max concurrent session limits', async () => {
    const multiSessionUser = 'user-multi-session';
    const limit = SECURITY.SESSION.MAX_CONCURRENT_SESSIONS;

    // Create limit + 2 sessions
    for (let i = 0; i < limit + 2; i++) {
      await sessionService.createSession(
        multiSessionUser,
        `token-${i}`,
        `Device ${i}`,
        `10.0.0.${i}`
      );
    }

    const activeSessions = await sessionService.getUserSessions(multiSessionUser);
    expect(activeSessions.length).toBeLessThanOrEqual(limit);
  });

  it('should destroy all sessions for a user upon security breach', async () => {
    const breachUser = 'user-breached-99';
    await sessionService.createSession(breachUser, 'tok-1', 'App 1', '1.1.1.1');
    await sessionService.createSession(breachUser, 'tok-2', 'App 2', '2.2.2.2');

    await sessionService.destroyAllUserSessions(breachUser);

    const active = await sessionService.getUserSessions(breachUser);
    expect(active.length).toBe(0);
  });
});
