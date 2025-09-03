import { AuditLogQueryParams } from '@idoeasy/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class AuditLogsQueryDto implements AuditLogQueryParams {
  @ApiProperty({ required: false })
  @IsOptional()
  module?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  action?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  severity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  sortBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
