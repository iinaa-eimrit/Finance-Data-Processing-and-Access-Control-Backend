import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RecordsModule } from './records/records.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, RecordsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
