import type { RoleQueryParams } from '@entech/contracts';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, Min } from 'class-validator';

export class RoleFilterDto implements RoleQueryParams {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 100)',
    example: 25,
    minimum: 1,
  })
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number = 25;

  @ApiPropertyOptional({
    description: 'Search term for name or description',
    example: 'admin',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @Type(() => Boolean)
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'name',
    enum: ['name', 'description', 'isActive', 'createdAt', 'updatedAt'],
  })
  @IsString()
  @IsIn(['name', 'description', 'isActive', 'createdAt', 'updatedAt'])
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Date range start for filtering',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'Date range end for filtering',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  dateTo?: Date;

  @ApiPropertyOptional({
    description: 'Status filter',
    example: 'active',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by permission ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  hasPermission?: string;
}
