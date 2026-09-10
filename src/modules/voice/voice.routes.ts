/**
 * Voice & Soundbox IoT Routes
 * ================================================
 * Developed by: Om Chauhan
 */

import { Router } from 'express';
import { voiceController } from './voice.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  soundboxBroadcastSchema,
  updateSoundboxSettingsSchema,
} from './voice.schema';

const router = Router();

// Get active soundbox device
router.get(
  '/device',
  authenticate,
  voiceController.getDevice.bind(voiceController)
);

// Broadcast speech payment announcement
router.post(
  '/broadcast',
  authenticate,
  validate({ body: soundboxBroadcastSchema }),
  voiceController.broadcast.bind(voiceController)
);

// Announcement history
router.get(
  '/history',
  authenticate,
  voiceController.getHistory.bind(voiceController)
);

// Update soundbox device settings
router.patch(
  '/device/settings',
  authenticate,
  validate({ body: updateSoundboxSettingsSchema }),
  voiceController.updateSettings.bind(voiceController)
);

// Countertop QR Standee info
router.get(
  '/standee',
  authenticate,
  voiceController.getStandee.bind(voiceController)
);

export default router;
