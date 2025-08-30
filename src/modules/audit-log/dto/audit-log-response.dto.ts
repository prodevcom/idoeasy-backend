import { TransformDate, TransformObjectId } from '@entech/common';
import type { AuditLog as AuditLogContract } from '@entech/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuditLogResponseDto implements AuditLogContract {
  @ApiProperty({ description: 'Audit log unique identifier' })
  @TransformObjectId('_id')
  @Expose()
  id: string;

  @ApiProperty({ description: 'User ID who performed the action' })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Module where the action was performed',
    example: 'auth',
  })
  @Expose()
  module: string;

  @ApiProperty({
    description: 'Action that was performed',
    example: 'login',
  })
  @Expose()
  action: string;

  @ApiProperty({
    description: 'Description of the action',
    example: 'User logged in successfully',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Additional metadata about the action',
    example: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0...' },
  })
  @Expose()
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'IP address of the user',
    example: '127.0.0.1',
  })
  @Expose()
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent string',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  })
  @Expose()
  userAgent?: string;

  @ApiProperty({
    description: 'Session ID associated with the action',
    example: 'sess_123456789',
  })
  @Expose()
  sessionId?: string;

  @ApiProperty({
    description: 'Severity level of the action',
    enum: ['info', 'warning', 'error', 'critical'],
    example: 'info',
  })
  @Expose()
  severity: 'info' | 'warning' | 'error' | 'critical';

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  @TransformDate()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  @TransformDate()
  updatedAt: Date;
}
