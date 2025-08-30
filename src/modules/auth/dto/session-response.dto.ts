import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class SessionResponseDto {
  @ApiProperty({ description: 'Session unique identifier' })
  @Expose()
  _id: string;

  @ApiProperty({
    description: 'User ID associated with this session',
    example: '507f1f77bcf86cd799439011',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'User agent (browser/device info)',
    example:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })
  @Expose()
  userAgent: string;

  @ApiProperty({
    description: 'IP address of the session',
    example: '192.168.1.1',
  })
  @Expose()
  ipAddress: string;

  @ApiProperty({
    description: 'Whether the session is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Session expiration timestamp',
    example: '2025-08-06T05:09:20.045Z',
  })
  @Expose()
  @Transform(({ value }) => value || new Date())
  expiresAt: Date;

  @ApiProperty({
    description: 'Last activity timestamp',
    example: '2025-08-05T05:09:20.045Z',
  })
  @Expose()
  @Transform(({ value }) => value || new Date())
  lastActivity: Date;

  @ApiProperty({
    description: 'Session creation timestamp',
  })
  @Expose()
  @Transform(({ value }) => value || new Date())
  createdAt: Date;

  @ApiProperty({
    description: 'Session last update timestamp',
  })
  @Expose()
  @Transform(({ value }) => value || new Date())
  updatedAt: Date;

  @ApiProperty({
    description: 'Time since last activity in minutes',
    example: 15,
  })
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.lastActivity) return 0;
    const now = new Date();
    const lastActivity = new Date(obj.lastActivity);
    return Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
  })
  inactiveMinutes: number;
}
