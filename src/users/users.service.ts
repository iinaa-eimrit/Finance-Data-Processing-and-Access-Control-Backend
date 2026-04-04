import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private excludePassword(user: User): Omit<User, 'passwordHash'> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async create(createUserDto: CreateUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      const user = await tx.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          passwordHash: hashedPassword,
          role: createUserDto.role,
        },
      });

      return this.excludePassword(user);
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map((user) => this.excludePassword(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.excludePassword(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({ where: { id } });

      if (!targetUser) {
        throw new NotFoundException('User not found');
      }

      // Rule: Prevent deactivating or downgrading the last active admin
      const isCurrentlyActiveAdmin =
        targetUser.role === 'ADMIN' && targetUser.status === 'ACTIVE';
      const isDowngradingOrDeactivating =
        (updateUserDto.role && updateUserDto.role !== 'ADMIN') ||
        (updateUserDto.status && updateUserDto.status !== 'ACTIVE');

      if (isCurrentlyActiveAdmin && isDowngradingOrDeactivating) {
        const activeAdminsCount = await tx.user.count({
          where: { role: 'ADMIN', status: 'ACTIVE' },
        });

        if (activeAdminsCount <= 1) {
          throw new BadRequestException(
            'Cannot downgrade or deactivate the last active admin',
          );
        }
      }

      const updatedUser = await tx.user.update({
        where: { id },
        data: updateUserDto,
      });

      return this.excludePassword(updatedUser);
    });
  }
}
