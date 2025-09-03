import { TransformDate, TransformObjectId } from '@idoeasy/common';
import type { Role } from '@idoeasy/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { PermissionResponseDto } from './permission-response.dto';

export class RoleResponseDto implements Role {
  @ApiProperty({ description: 'Role unique identifier' })
  @TransformObjectId('_id')
  @Expose()
  id: string;

  @ApiProperty({ description: 'Role name', example: 'Admin' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Administrator with full access',
  })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Whether the role is active', example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Whether this role is the default role for new users',
    example: false,
  })
  @Expose()
  isDefault: boolean;

  @ApiProperty({
    description: 'Whether this role is the admin role',
    example: false,
  })
  @Expose()
  isAdmin: boolean;

  @ApiProperty({
    description: 'Array of permission IDs',
    type: [PermissionResponseDto],
  })
  @Type(() => PermissionResponseDto)
  @Expose()
  permissions: Types.ObjectId[];

  @ApiProperty({
    description: 'Array of ancestor role IDs for hierarchy',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @Expose()
  ancestors: Types.ObjectId[];

  @ApiProperty({
    description: 'Depth in the role hierarchy (0 for root roles)',
    example: 1,
  })
  @Expose()
  depth: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  @TransformDate()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  @TransformDate()
  updatedAt: Date;
}
