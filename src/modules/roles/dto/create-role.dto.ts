import type { CreateRoleRequest } from '@idoeasy/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRoleDto implements CreateRoleRequest {
  @ApiProperty({ description: 'Role name', example: 'Admin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Administrator with full access',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Array of permission IDs',
    type: [String],
    example: ['507f1f77bcf86cd799439011'],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({ description: 'Whether the role is active', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @ApiProperty({ description: 'Whether the role is admin', example: false })
  @IsBoolean()
  @IsNotEmpty()
  isAdmin: boolean;

  @ApiPropertyOptional({
    description: 'Parent role ID for hierarchy (leave empty for root role)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsOptional()
  parentId?: string;
}
