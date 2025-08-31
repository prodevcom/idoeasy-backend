import type { AuditLog as AuditLogContract } from '@entech/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { Session } from './session.schema';
import { User } from './user.schema';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog implements Omit<AuditLogContract, 'id'> {
  @ApiProperty({ description: 'Audit log unique identifier' })
  _id: string;

  @ApiProperty({
    description: 'User who performed the action',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId | string;

  @ApiProperty({
    description: 'Module where the action was performed',
    example: 'auth',
  })
  @Prop({ required: true })
  module: string;

  @ApiProperty({
    description: 'Action that was performed',
    example: 'login',
  })
  @Prop({ required: true })
  action: string;

  @ApiProperty({
    description: 'Description of the action',
    example: 'User logged in successfully',
  })
  @Prop({ required: true })
  description: string;

  @ApiProperty({
    description: 'Additional metadata about the action',
    example: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0...' },
  })
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Session ID associated with the action',
    type: String,
  })
  @Prop({ type: Types.ObjectId, ref: Session.name })
  sessionId?: Types.ObjectId | string;

  @ApiProperty({
    description: 'Severity level of the action',
    enum: ['info', 'warning', 'error', 'critical'],
    example: 'info',
  })
  @Prop({
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
  })
  severity: 'info' | 'warning' | 'error' | 'critical';

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Add indexes for optimal query performance with ObjectId userId
AuditLogSchema.index({ userId: 1, createdAt: -1 }); // Primary index for user logs by date (covers userId: 1)
AuditLogSchema.index({ module: 1, action: 1, createdAt: -1 }); // Module/action queries
AuditLogSchema.index({ severity: 1, createdAt: -1 }); // Severity filtering
AuditLogSchema.index({ createdAt: -1 }); // General date sorting
AuditLogSchema.index({ sessionId: 1 }); // Session-specific logs
