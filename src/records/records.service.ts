import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { ListRecordsQueryDto } from './dto/list-records-query.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

const VALID_SORT_FIELDS = [
  'transactionDate',
  'amountCents',
  'createdAt',
] as const;

type RecordSortField = (typeof VALID_SORT_FIELDS)[number];

function isRecordSortField(value: string): value is RecordSortField {
  return VALID_SORT_FIELDS.includes(value as RecordSortField);
}

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async create(createRecordDto: CreateRecordDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      return tx.financialRecord.create({
        data: {
          amountCents: createRecordDto.amountCents,
          type: createRecordDto.type,
          category: createRecordDto.category,
          notes: createRecordDto.notes,
          transactionDate: new Date(createRecordDto.transactionDate),
          createdById: userId,
          updatedById: userId,
        },
      });
    });
  }

  async findAll(query: ListRecordsQueryDto) {
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    if (
      minAmount !== undefined &&
      maxAmount !== undefined &&
      minAmount > maxAmount
    ) {
      throw new BadRequestException(
        'minAmount cannot be greater than maxAmount',
      );
    }

    if (!isRecordSortField(sortBy)) {
      throw new BadRequestException(
        `Invalid sortBy field. Allowed: ${VALID_SORT_FIELDS.join(', ')}`,
      );
    }

    const where: Prisma.FinancialRecordWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (startDate || endDate) {
      where.transactionDate = {};

      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }

      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amountCents = {};

      if (minAmount !== undefined) {
        where.amountCents.gte = minAmount;
      }

      if (maxAmount !== undefined) {
        where.amountCents.lte = maxAmount;
      }
    }

    const normalizedSortOrder: Prisma.SortOrder = sortOrder;
    const orderBy: Prisma.FinancialRecordOrderByWithRelationInput =
      sortBy === 'amountCents'
        ? { amountCents: normalizedSortOrder }
        : sortBy === 'createdAt'
          ? { createdAt: normalizedSortOrder }
          : { transactionDate: normalizedSortOrder };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.financialRecord.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.financialRecord.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const record = await this.prisma.financialRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    return record;
  }

  async update(id: string, updateRecordDto: UpdateRecordDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.financialRecord.findUnique({ where: { id } });

      if (!existing) {
        throw new NotFoundException('Record not found');
      }

      const dataToUpdate: Prisma.FinancialRecordUncheckedUpdateInput = {
        updatedById: userId,
      };

      if (updateRecordDto.amountCents !== undefined) {
        dataToUpdate.amountCents = updateRecordDto.amountCents;
      }

      if (updateRecordDto.type !== undefined) {
        dataToUpdate.type = updateRecordDto.type;
      }

      if (updateRecordDto.category !== undefined) {
        dataToUpdate.category = updateRecordDto.category;
      }

      if (updateRecordDto.notes !== undefined) {
        dataToUpdate.notes = updateRecordDto.notes;
      }

      if (updateRecordDto.transactionDate) {
        dataToUpdate.transactionDate = new Date(
          updateRecordDto.transactionDate,
        );
      }

      return tx.financialRecord.update({
        where: { id },
        data: dataToUpdate,
      });
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.financialRecord.findUnique({ where: { id } });

      if (!existing) {
        throw new NotFoundException('Record not found');
      }

      return tx.financialRecord.delete({ where: { id } });
    });
  }
}
