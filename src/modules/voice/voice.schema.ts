/**
 * Voice & Soundbox IoT Hardware Schemas
 * ================================================
 * Developed by: Om Chauhan
 */

import { z } from 'zod';

export const soundboxBroadcastSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  language: z.string().default('hi-IN'),
  paymentId: z.string().optional(),
  deviceId: z.string().optional(),
});

export const registerSoundboxSchema = z.object({
  serialNumber: z.string().min(3),
  modelName: z.string().default('DesiPay Smart 4G IoT Soundbox'),
  simNumber: z.string().optional(),
  languagePref: z.string().default('hi-IN'),
  volumeLevel: z.number().int().min(0).max(100).default(80),
});

export const updateSoundboxSettingsSchema = z.object({
  volumeLevel: z.number().int().min(0).max(100).optional(),
  languagePref: z.string().optional(),
  isOnline: z.boolean().optional(),
});

export type SoundboxBroadcastInput = z.infer<typeof soundboxBroadcastSchema>;
export type RegisterSoundboxInput = z.infer<typeof registerSoundboxSchema>;
export type UpdateSoundboxSettingsInput = z.infer<typeof updateSoundboxSettingsSchema>;
