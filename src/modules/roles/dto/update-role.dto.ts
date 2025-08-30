import type { UpdateRoleRequest } from '@entech/contracts';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString } from 'class-validator';

export class UpdateRoleDto implements UpdateRoleRequest {
  @ApiPropertyOptional({ description: 'Role name', example: 'Admin' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Administrator with full access',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Whether the role is active',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Array of permission IDs',
    type: [String],
    example: ['507f1f77bcf86cd799439011'],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional({
    description: 'Whether this role is the admin role',
    example: false,
  })
  @IsBoolean()
  isAdmin: boolean;

  @ApiPropertyOptional({
    description:
      'Parent role ID for moving in hierarchy (null/undefined to move to root)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  parentId: string;
}
