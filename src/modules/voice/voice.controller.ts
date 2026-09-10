/**
 * Voice & Soundbox IoT Controller
 * ================================================
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { voiceService } from './voice.service';
import type { SoundboxBroadcastInput, UpdateSoundboxSettingsInput } from './voice.schema';

export class VoiceController {
  /**
   * GET /api/v1/voice/device
   */
  async getDevice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const device = await voiceService.getDevice(req.user!.userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { device },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/voice/broadcast
   */
  async broadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: SoundboxBroadcastInput = req.body;
      const result = await voiceService.broadcastPayment(req.user!.userId, input);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: `🔊 Soundbox broadcast queued: "${result.speech.text}"`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/voice/history
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await voiceService.getHistory(req.user!.userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/voice/device/settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: UpdateSoundboxSettingsInput = req.body;
      const device = await voiceService.updateDeviceSettings(req.user!.userId, input);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Soundbox settings updated',
        data: { device },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/voice/standee
   */
  async getStandee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const standee = await voiceService.getQrStandee(req.user!.userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { standee },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const voiceController = new VoiceController();
