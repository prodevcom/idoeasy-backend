import type { MoveRoleRequest } from '@idoeasy/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MoveRoleDto implements MoveRoleRequest {
  @ApiProperty({
    description: 'Role ID to move',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @ApiPropertyOptional({
    description: 'New parent role ID (null/undefined to move to root)',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsOptional()
  newParentId?: string;
}
