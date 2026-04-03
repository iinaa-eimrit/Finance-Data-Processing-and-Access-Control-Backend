import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CategoryBreakdownItem = {
  income: number;
  expense: number;
  net: number;
};

type TrendBucket = {
  income: number;
  expense: number;
  net: number;
};

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [incomeAgg, expenseAgg, count] = await Promise.all([
      this.prisma.financialRecord.aggregate({
        _sum: { amountCents: true },
        where: { type: 'INCOME' },
      }),
      this.prisma.financialRecord.aggregate({
        _sum: { amountCents: true },
        where: { type: 'EXPENSE' },
      }),
      this.prisma.financialRecord.count(),
    ]);

    const totalIncome = incomeAgg._sum.amountCents || 0;
    const totalExpenses = expenseAgg._sum.amountCents || 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      totalRecords: count,
    };
  }

  async getCategoryBreakdown() {
    const breakdown = await this.prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      _sum: {
        amountCents: true,
      },
    });

    const result: Record<string, CategoryBreakdownItem> = {};

    for (const item of breakdown) {
      if (!result[item.category]) {
        result[item.category] = { income: 0, expense: 0, net: 0 };
      }

      const amount = item._sum.amountCents || 0;

      if (item.type === 'INCOME') {
        result[item.category].income += amount;
      } else {
        result[item.category].expense += amount;
      }

      result[item.category].net =
        result[item.category].income - result[item.category].expense;
    }

    return result;
  }

  async getTrends(months: number) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months + 1);
    cutoffDate.setDate(1);
    cutoffDate.setHours(0, 0, 0, 0);

    const records = await this.prisma.financialRecord.findMany({
      where: {
        transactionDate: { gte: cutoffDate },
      },
      select: {
        amountCents: true,
        type: true,
        transactionDate: true,
      },
    });

    const buckets: Record<string, TrendBucket> = {};

    for (const record of records) {
      const year = record.transactionDate.getUTCFullYear();
      const month = String(record.transactionDate.getUTCMonth() + 1).padStart(
        2,
        '0',
      );
      const bucketKey = `${year}-${month}`;

      if (!buckets[bucketKey]) {
        buckets[bucketKey] = { income: 0, expense: 0, net: 0 };
      }

      if (record.type === 'INCOME') {
        buckets[bucketKey].income += record.amountCents;
      } else {
        buckets[bucketKey].expense += record.amountCents;
      }

      buckets[bucketKey].net =
        buckets[bucketKey].income - buckets[bucketKey].expense;
    }

    return Object.keys(buckets)
      .sort()
      .map((key) => ({
        month: key,
        ...buckets[key],
      }));
  }

  async getRecentActivity(limit: number = 10) {
    const MAX_LIMIT = 50;
    const take = Math.min(limit, MAX_LIMIT);

    return this.prisma.financialRecord.findMany({
      take,
      orderBy: { transactionDate: 'desc' },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });
  }
}
