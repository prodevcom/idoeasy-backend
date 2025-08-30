import { SessionInfo } from '@entech/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session implements Omit<SessionInfo, 'id'> {
  lastActivityAt: Date;
  @ApiProperty({ description: 'Session unique identifier' })
  _id: string;

  @ApiProperty({
    description: 'User ID associated with this session',
    example: '507f1f77bcf86cd799439011',
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId | string;

  @ApiProperty({
    description: 'Refresh token for this session',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Prop({ required: true, unique: true })
  refreshToken: string;

  @ApiProperty({
    description: 'Access token for this session',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Prop({ required: true })
  accessToken: string;

  @ApiProperty({
    description: 'User agent (browser/device info)',
    example:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })
  @Prop({ required: true })
  userAgent: string;

  @ApiProperty({
    description: 'IP address of the session',
    example: '192.168.1.1',
  })
  @Prop({ required: true })
  ipAddress: string;

  @ApiProperty({
    description: 'Whether the session is active',
    example: true,
  })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Session expiration timestamp',
    example: '2025-08-06T05:09:20.045Z',
  })
  @Prop({ required: true })
  expiresAt: Date;

  @ApiProperty({
    description: 'Last activity timestamp',
    example: '2025-08-05T05:09:20.045Z',
  })
  @Prop({ default: Date.now })
  lastActivity: Date;

  @ApiProperty({
    description: 'Session creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Session last update timestamp',
  })
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Add indexes for better performance
SessionSchema.index({ userId: 1, isActive: 1 });
// refreshToken unique index is created by @Prop({ unique: true })
SessionSchema.index({ expiresAt: 1 });
SessionSchema.index({ lastActivity: 1 });
