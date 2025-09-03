import {
  User as UserContract,
  UserPreferences,
  UserStatus,
} from '@idoeasy/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';
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
  roleId?: Types.ObjectId;

  @ApiProperty({
    description: 'Populated role',
    required: false,
    type: () => Role,
  })
  role?: Role;

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

// Virtual that exposes `role` from `roleId`
UserSchema.virtual('role', {
  ref: Role.name,
  localField: 'roleId',
  foreignField: '_id',
  justOne: true,
});

// Enable virtual in toJSON/toObject
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

UserSchema.plugin(mongooseLeanVirtuals);

// Compound indexes for common query patterns (cover single-field queries too)
UserSchema.index({ role: 1, status: 1, createdAt: -1 }); // Role + status + date (covers role: 1, status: 1, role+status)
UserSchema.index({ createdAt: -1 }); // For default sorting (newest first)
UserSchema.index({ name: 'text', email: 'text' }); // Text search on name and email
