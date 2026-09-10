/**
 * Voice & Soundbox IoT Hardware Service
 * ================================================
 * Real-time 4G IoT Soundbox announcements, audio dual-tone
 * chime synthesis metadata, and countertop QR standee stats.
 * 
 * Developed by: Om Chauhan
 */

import { prisma } from '../../config/prisma';
import { logger } from '../../config/logger';
import type {
  SoundboxBroadcastInput,
  RegisterSoundboxInput,
  UpdateSoundboxSettingsInput,
} from './voice.schema';

export class VoiceService {
  /**
   * Register a new soundbox device
   */
  async registerDevice(shopkeeperId: string, input: RegisterSoundboxInput) {
    logger.info(`Registering soundbox ${input.serialNumber} for shopkeeper ${shopkeeperId}`);
    return prisma.soundboxDevice.create({
      data: {
        shopkeeperId,
        serialNumber: input.serialNumber,
        modelName: input.modelName || 'DesiPay Smart 4G IoT Soundbox',
        simNumber: input.simNumber,
        languagePref: input.languagePref || 'hi-IN',
        volumeLevel: input.volumeLevel ?? 80,
        isOnline: true,
        lastPingAt: new Date(),
      },
    });
  }

  /**
   * Get or auto-provision active soundbox device for a shopkeeper
   */
  async getDevice(shopkeeperId: string) {
    let device = await prisma.soundboxDevice.findFirst({
      where: { shopkeeperId },
    });

    if (!device) {
      // Auto-provision initial device for demo shopkeeper
      device = await prisma.soundboxDevice.create({
        data: {
          shopkeeperId,
          serialNumber: `DSP-SB-4G-${Date.now().toString().slice(-4)}`,
          modelName: 'DesiPay Smart 4G IoT Soundbox',
          simNumber: '+919876543210',
          batteryPercent: 92,
          signalStrength: 98,
          languagePref: 'hi-IN',
          volumeLevel: 85,
          isOnline: true,
          lastPingAt: new Date(),
        },
      });
      logger.info(`Auto-provisioned Soundbox device ${device.serialNumber} for shopkeeper ${shopkeeperId}`);
    }

    return device;
  }

  /**
   * Record and broadcast voice payment announcement
   */
  async broadcastPayment(shopkeeperId: string, input: SoundboxBroadcastInput) {
    const device = await this.getDevice(shopkeeperId);

    const lang = input.language || device.languagePref || 'hi-IN';
    const voiceText =
      lang === 'hi-IN'
        ? `देसीपे पर ₹${input.amount} प्राप्त हुए!`
        : `Received ₹${input.amount} on DesiPay!`;

    logger.info(`🔊 Broadcasting Soundbox voice on ${device.serialNumber}: "${voiceText}"`);

    const announcement = await prisma.soundboxAnnouncement.create({
      data: {
        deviceId: device.id,
        paymentId: input.paymentId,
        amount: input.amount,
        language: lang,
        voiceText,
      },
    });

    // Update last ping
    await prisma.soundboxDevice.update({
      where: { id: device.id },
      data: { lastPingAt: new Date() },
    });

    return {
      announcement,
      chime: {
        frequencies: [587.33, 880.0], // D5 -> A5 Indian payment gateway dual-tone
        durationMs: 300,
      },
      speech: {
        text: voiceText,
        lang,
        pitch: 1.05,
        rate: 0.95,
      },
    };
  }

  /**
   * Get announcement history for hardware device
   */
  async getHistory(shopkeeperId: string) {
    const device = await this.getDevice(shopkeeperId);

    return prisma.soundboxAnnouncement.findMany({
      where: { deviceId: device.id },
      orderBy: { broadcastedAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Update device volume or online state
   */
  async updateDeviceSettings(shopkeeperId: string, input: UpdateSoundboxSettingsInput) {
    const device = await this.getDevice(shopkeeperId);

    return prisma.soundboxDevice.update({
      where: { id: device.id },
      data: {
        ...(input.volumeLevel !== undefined && { volumeLevel: input.volumeLevel }),
        ...(input.languagePref && { languagePref: input.languagePref }),
        ...(input.isOnline !== undefined && { isOnline: input.isOnline }),
        lastPingAt: new Date(),
      },
    });
  }

  /**
   * Countertop QR Standee data
   */
  async getQrStandee(shopkeeperId: string) {
    let standee = await prisma.qrStandee.findUnique({
      where: { shopkeeperId },
    });

    if (!standee) {
      standee = await prisma.qrStandee.create({
        data: {
          shopkeeperId,
          shopName: 'Om Kirana & General Store',
          upiId: 'omkirana@desipay',
          standeeType: 'ACRYLIC_A5_SPEAKER_DOCK',
          isVerified: true,
          scansCount: 42,
        },
      });
    }

    return standee;
  }
}

export const voiceService = new VoiceService();
