import { TransformDate, TransformObjectId } from '@idoeasy/common';
import type { Permission } from '@idoeasy/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PermissionResponseDto implements Permission {
  @ApiProperty({
    description: 'Permission unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  @TransformObjectId('_id')
  @Expose()
  id: string;

  @ApiProperty({ description: 'Permission name', example: 'user.create' })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Permission description',
    example: 'Create new users',
  })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Module name', example: 'user' })
  @Expose()
  module: string;

  @ApiProperty({ description: 'Action name', example: 'create' })
  @Expose()
  action: string;

  @ApiProperty({ description: 'Is active', example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Is admin only', example: false })
  @Expose()
  isAdminOnly: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  @TransformDate()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  @TransformDate()
  updatedAt: Date;
}
