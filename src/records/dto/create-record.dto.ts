import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRecordDto {
  @IsInt()
  @Min(1, { message: 'Amount must be a positive integer (cents)' })
  amountCents!: number;

  @IsEnum(['INCOME', 'EXPENSE'])
  type!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  transactionDate!: string;
}
