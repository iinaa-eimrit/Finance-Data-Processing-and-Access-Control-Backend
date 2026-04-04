import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(['VIEWER', 'ANALYST', 'ADMIN'])
  role?: string;
}
