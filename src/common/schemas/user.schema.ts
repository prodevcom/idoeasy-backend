import {
  User as UserContract,
  UserPreferences,
  UserStatus,
} from '@entech/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { Role } from './role.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User implements Omit<UserContract, 'id'> {
  @ApiProperty({ description: 'User unique identifier' })
  _id: string;

  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({
    description: 'User password (hashed)',
    example: 'hashedPassword123',
  })
  @Prop({ required: true })
  password: string;

  @ApiProperty({
    description: 'User status',
    enum: ['ACTIVE', 'INACTIVE', 'PROVISIONED'],
    example: 'ACTIVE',
  })
  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'PROVISIONED'] })
  status: UserStatus;

  @ApiProperty({
    description: 'Role ID associated with this user',
    type: String,
    required: false,
  })
  @Prop({ type: Types.ObjectId, ref: Role.name })
  role?: Types.ObjectId | Role;

  @ApiProperty({
    description: 'User preferences metadata',
    type: Object,
    required: false,
  })
  @Prop({ type: Object, required: false })
  metadata?: UserPreferences;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes for optimal query performance
// UserSchema.index({ email: 1 }); // Unique constraint already creates the index
UserSchema.index({ role: 1 }); // Critical for hierarchy filtering (role.$in queries)
UserSchema.index({ status: 1 }); // For status filtering
UserSchema.index({ name: 1 }); // For name sorting and search
UserSchema.index({ createdAt: -1 }); // For default sorting (newest first)

// Compound indexes for common query patterns
UserSchema.index({ role: 1, status: 1 }); // Role + status filtering (most common)
UserSchema.index({ role: 1, createdAt: -1 }); // Role filtering + sorting by date
UserSchema.index({ status: 1, createdAt: -1 }); // Status filtering + sorting
UserSchema.index({ name: 'text', email: 'text' }); // Text search on name and email
