/**
 * Khata Service
 * ================================================
 * Digital Khata Book (Udhar/Nagdi) business logic.
 * Manages shopkeeper↔customer credit ledger with
 * running balance, settlements, and reminders.
 * 
 * Developed by: Om Chauhan
 */

import { prisma } from '../../config/prisma';
import { logger } from '../../config/logger';
import { AuditAction } from '../../config/security';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notification/notification.service';
import {
  BadRequestError,
} from '../../shared/errors';
import type {
  CreateKhataEntryInput,
  SettleKhataInput,
  KhataListQuery,
  SendReminderInput,
} from './khata.schema';

export class KhataService {
  /**
   * Create a Khata entry (Udhar or Nagdi)
   * Computes running balance automatically
   */
  async createEntry(shopkeeperId: string, input: CreateKhataEntryInput): Promise<any> {
    // 1. Get current balance for this shopkeeper↔customer pair
    const currentBalance = await this.computeBalance(shopkeeperId, input.customerId);

    // 2. Calculate new balance
    //    CREDIT = shopkeeper gave credit (udhar diya) → balance increases
    //    DEBIT = customer paid back → balance decreases
    const newBalance = input.entryType === 'CREDIT'
      ? currentBalance + input.amount
      : currentBalance - input.amount;

    // 3. Create the entry
    const entry = await prisma.khataEntry.create({
      data: {
        shopkeeperId,
        customerId: input.customerId,
        entryType: input.entryType,
        amount: input.amount,
        balanceAfter: newBalance,
        description: input.description,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
      },
    });

    // 4. Create linked Transaction
    await prisma.transaction.create({
      data: {
        senderId: input.entryType === 'CREDIT' ? shopkeeperId : input.customerId,
        receiverId: input.entryType === 'CREDIT' ? input.customerId : shopkeeperId,
        amount: input.amount,
        type: input.entryType === 'CREDIT' ? 'UDHAR' : 'REPAYMENT',
        status: 'COMPLETED',
        paymentMethod: 'CASH',
        description: input.description || `Khata ${input.entryType.toLowerCase()} entry`,
      },
    });

    // 5. Notify customer
    const notifTitle = input.entryType === 'CREDIT'
      ? '📒 Udhar Recorded'
      : '✅ Payment Recorded';
    const notifMessage = input.entryType === 'CREDIT'
      ? `₹${input.amount.toFixed(2)} credit added. Outstanding: ₹${newBalance.toFixed(2)}`
      : `₹${input.amount.toFixed(2)} payment recorded. Remaining: ₹${Math.max(0, newBalance).toFixed(2)}`;

    await notificationService.send({
      userId: input.customerId,
      channel: 'PUSH',
      title: notifTitle,
      message: notifMessage,
      metadata: { khataEntryId: entry.id, balance: newBalance },
    });

    // 6. Audit log
    await auditService.log({
      userId: shopkeeperId,
      action: input.entryType === 'CREDIT' ? AuditAction.UDHAR_CREATED : 'PAYMENT_RECORDED',
      resourceType: 'KHATA',
      resourceId: entry.id,
      metadata: { customerId: input.customerId, amount: input.amount, balance: newBalance },
    });

    logger.info('Khata entry created', {
      entryId: entry.id,
      type: input.entryType,
      amount: input.amount,
      balance: newBalance,
    });

    return entry;
  }

  /**
   * Settle outstanding entries for a customer
   */
  async settleEntries(shopkeeperId: string, input: SettleKhataInput): Promise<{
    settled: number;
    remainingBalance: number;
  }> {
    const balance = await this.computeBalance(shopkeeperId, input.customerId);

    if (balance <= 0) {
      throw new BadRequestError('No outstanding balance to settle');
    }

    const settleAmount = Math.min(input.amount, balance);

    // Get unsettled entries (oldest first)
    const unsettled = await prisma.khataEntry.findMany({
      where: {
        shopkeeperId,
        customerId: input.customerId,
        isSettled: false,
        entryType: 'CREDIT',
      },
      orderBy: { createdAt: 'asc' },
    });

    let remaining = settleAmount;
    let settledCount = 0;

    for (const entry of unsettled) {
      if (remaining <= 0) break;

      if (remaining >= entry.amount) {
        // Fully settle this entry
        await prisma.khataEntry.update({
          where: { id: entry.id },
          data: { isSettled: true, settledAt: new Date() },
        });
        remaining -= entry.amount;
        settledCount++;
      } else {
        // Partial settlement — mark partially and create new reduced entry
        // For simplicity, just mark as settled and create a new credit entry for the remainder
        await prisma.khataEntry.update({
          where: { id: entry.id },
          data: { isSettled: true, settledAt: new Date() },
        });

        const remainderAmount = entry.amount - remaining;
        const newBal = await this.computeBalance(shopkeeperId, input.customerId);
        await prisma.khataEntry.create({
          data: {
            shopkeeperId,
            customerId: input.customerId,
            entryType: 'CREDIT',
            amount: remainderAmount,
            balanceAfter: newBal,
            description: `Remainder from partial settlement`,
          },
        });

        remaining = 0;
        settledCount++;
      }
    }

    // Create settlement DEBIT entry
    const finalBalance = await this.computeBalance(shopkeeperId, input.customerId);
    await prisma.khataEntry.create({
      data: {
        shopkeeperId,
        customerId: input.customerId,
        entryType: 'DEBIT',
        amount: settleAmount,
        balanceAfter: finalBalance - settleAmount,
        description: input.description || `Settlement via ${input.paymentMethod}`,
        isSettled: true,
        settledAt: new Date(),
      },
    });

    // Create linked transaction
    await prisma.transaction.create({
      data: {
        senderId: input.customerId,
        receiverId: shopkeeperId,
        amount: settleAmount,
        type: 'SETTLEMENT',
        status: 'COMPLETED',
        paymentMethod: input.paymentMethod as any,
        description: `Khata settlement: ₹${settleAmount.toFixed(2)}`,
      },
    });

    await auditService.log({
      userId: shopkeeperId,
      action: AuditAction.UDHAR_SETTLED,
      resourceType: 'KHATA',
      metadata: {
        customerId: input.customerId,
        settledAmount: settleAmount,
        settledEntries: settledCount,
      },
    });

    const remainingBalance = await this.computeBalance(shopkeeperId, input.customerId);

    return { settled: settledCount, remainingBalance };
  }

  /**
   * Get customer-specific ledger
   */
  async getCustomerLedger(shopkeeperId: string, customerId: string, query: KhataListQuery): Promise<{
    entries: any[];
    total: number;
    balance: number;
    page: number;
    totalPages: number;
  }> {
    const where: any = { shopkeeperId, customerId };

    if (query.isSettled !== undefined) {
      where.isSettled = query.isSettled === 'true';
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [entries, total] = await Promise.all([
      prisma.khataEntry.findMany({
        where,
        orderBy: { createdAt: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          customer: { select: { id: true, fullName: true, phone: true } },
        },
      }),
      prisma.khataEntry.count({ where }),
    ]);

    const balance = await this.computeBalance(shopkeeperId, customerId);

    return {
      entries,
      total,
      balance,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /**
   * Get outstanding balance for a shopkeeper↔customer pair
   */
  async getBalance(shopkeeperId: string, customerId: string): Promise<{
    balance: number;
    totalCredit: number;
    totalDebit: number;
    entriesCount: number;
  }> {
    const aggregation = await prisma.khataEntry.groupBy({
      by: ['entryType'],
      where: { shopkeeperId, customerId },
      _sum: { amount: true },
      _count: true,
    });

    let totalCredit = 0;
    let totalDebit = 0;
    let entriesCount = 0;

    for (const group of aggregation) {
      if (group.entryType === 'CREDIT') {
        totalCredit = group._sum.amount || 0;
      } else {
        totalDebit = group._sum.amount || 0;
      }
      entriesCount += group._count;
    }

    return {
      balance: totalCredit - totalDebit,
      totalCredit,
      totalDebit,
      entriesCount,
    };
  }

  /**
   * Shopkeeper dashboard summary
   */
  async getDashboard(shopkeeperId: string): Promise<{
    totalOutstanding: number;
    totalCollected: number;
    customersWithDues: number;
    topDebtors: any[];
    recentEntries: any[];
  }> {
    // Total outstanding across all customers
    const allEntries = await prisma.khataEntry.groupBy({
      by: ['customerId', 'entryType'],
      where: { shopkeeperId },
      _sum: { amount: true },
    });

    const customerBalances: Record<string, number> = {};
    for (const entry of allEntries) {
      const current = customerBalances[entry.customerId] || 0;
      customerBalances[entry.customerId] = entry.entryType === 'CREDIT'
        ? current + (entry._sum.amount || 0)
        : current - (entry._sum.amount || 0);
    }

    const totalOutstanding = Object.values(customerBalances)
      .filter((b) => b > 0)
      .reduce((sum, b) => sum + b, 0);

    const totalCollected = Object.values(customerBalances)
      .filter((b) => b <= 0)
      .reduce((sum, b) => sum + Math.abs(b), 0);

    const customersWithDues = Object.values(customerBalances).filter((b) => b > 0).length;

    // Top 5 debtors
    const sortedDebtors = Object.entries(customerBalances)
      .filter(([, b]) => b > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const topDebtorIds = sortedDebtors.map(([id]) => id);
    const debtorUsers = await prisma.user.findMany({
      where: { id: { in: topDebtorIds } },
      select: { id: true, fullName: true, phone: true },
    });

    const topDebtors = sortedDebtors.map(([id, balance]) => ({
      ...debtorUsers.find((u) => u.id === id),
      balance,
    }));

    // Recent 10 entries
    const recentEntries = await prisma.khataEntry.findMany({
      where: { shopkeeperId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
      },
    });

    return {
      totalOutstanding,
      totalCollected,
      customersWithDues,
      topDebtors,
      recentEntries,
    };
  }

  /**
   * Customer view — see my own outstanding credit
   */
  async getMyUdhar(customerId: string, query: KhataListQuery): Promise<{
    entries: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where: any = { customerId };
    if (query.isSettled !== undefined) where.isSettled = query.isSettled === 'true';

    const [entries, total] = await Promise.all([
      prisma.khataEntry.findMany({
        where,
        orderBy: { createdAt: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          shopkeeper: {
            select: { id: true, fullName: true },
          },
        },
      }),
      prisma.khataEntry.count({ where }),
    ]);

    return {
      entries,
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /**
   * Send payment reminder to customer
   */
  async sendReminder(shopkeeperId: string, input: SendReminderInput): Promise<void> {
    const balance = await this.computeBalance(shopkeeperId, input.customerId);

    if (balance <= 0) {
      throw new BadRequestError('No outstanding balance — no reminder needed');
    }

    const shopkeeper = await prisma.user.findUnique({
      where: { id: shopkeeperId },
      select: { fullName: true },
    });

    const defaultMessage = `Hi! This is a reminder from ${shopkeeper?.fullName || 'your shopkeeper'}. You have an outstanding balance of ₹${balance.toFixed(2)}. Please settle at your earliest convenience.`;

    await notificationService.send({
      userId: input.customerId,
      channel: input.channel,
      title: '📬 Payment Reminder',
      message: input.message || defaultMessage,
      metadata: { shopkeeperId, balance, type: 'khata_reminder' },
    });

    // Increment reminder count on unsettled entries
    await prisma.khataEntry.updateMany({
      where: {
        shopkeeperId,
        customerId: input.customerId,
        isSettled: false,
      },
      data: {
        reminderSent: true,
        reminderCount: { increment: 1 },
      },
    });

    logger.info('Khata reminder sent', {
      shopkeeperId,
      customerId: input.customerId,
      balance,
    });
  }

  /**
   * Compute current balance between shopkeeper and customer
   * Balance = SUM(CREDIT amounts) - SUM(DEBIT amounts)
   */
  private async computeBalance(shopkeeperId: string, customerId: string): Promise<number> {
    const result = await prisma.khataEntry.aggregate({
      where: { shopkeeperId, customerId, entryType: 'CREDIT' },
      _sum: { amount: true },
    });
    const totalCredit = result._sum.amount || 0;

    const debitResult = await prisma.khataEntry.aggregate({
      where: { shopkeeperId, customerId, entryType: 'DEBIT' },
      _sum: { amount: true },
    });
    const totalDebit = debitResult._sum.amount || 0;

    return totalCredit - totalDebit;
  }
}

export const khataService = new KhataService();
