import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ActiveUserGuard } from '../common/guards/active-user.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateRecordDto } from './dto/create-record.dto';
import { ListRecordsQueryDto } from './dto/list-records-query.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { RecordsService } from './records.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('records')
@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createRecordDto: CreateRecordDto, @CurrentUser() user: User) {
    return this.recordsService.create(createRecordDto, user.id);
  }

  @Get()
  @Roles('ADMIN', 'ANALYST')
  findAll(@Query() query: ListRecordsQueryDto) {
    return this.recordsService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'ANALYST')
  findOne(@Param('id') id: string) {
    return this.recordsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordDto,
    @CurrentUser() user: User,
  ) {
    return this.recordsService.update(id, updateRecordDto, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.recordsService.remove(id);
  }
}
