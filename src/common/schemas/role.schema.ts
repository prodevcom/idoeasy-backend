import type { Role as RoleContract } from '@idoeasy/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument, Types } from 'mongoose';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';
import { Permission } from './permission.schema';

export type RoleDocument = Role & Document;
export type RoleDoc = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role implements Omit<RoleContract, 'id'> {
  @ApiProperty({ description: 'Role unique identifier' })
  _id: string;

  @ApiProperty({ description: 'Role name', example: 'Admin' })
  @Prop({ required: true, unique: true })
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Administrator with full access',
  })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'Whether the role is active', example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether this role is the default role for new users',
    example: false,
  })
  @Prop({ default: false })
  isDefault: boolean;

  @ApiProperty({
    description:
      'Whether this role is the admin role, no permissions are needed',
    example: false,
  })
  @Prop({ default: false })
  isAdmin: boolean;

  @ApiProperty({
    description: 'Array of permission IDs associated with this role',
    type: [Types.ObjectId],
  })
  @Prop({ type: [{ type: Types.ObjectId, ref: Permission.name }], default: [] })
  permissionIds: Types.ObjectId[];

  @ApiProperty({
    description: 'Array of permissions associated with this role',
    type: [Permission],
  })
  permissions: Permission[];

  @ApiProperty({
    description: 'Array of ancestor role IDs for hierarchy materialized path',
    type: [Types.ObjectId],
  })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
  ancestors: Types.ObjectId[];

  @ApiProperty({
    description: 'Depth in the role hierarchy (0 for root roles)',
    example: 0,
  })
  @Prop({ default: 0, min: 0 })
  depth: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Virtual that exposes `permissions` from `permissionsIds`
RoleSchema.virtual('permissions', {
  ref: Permission.name,
  localField: 'permissionIds',
  foreignField: '_id',
  justOne: false,
});

// Enable virtual in toJSON/toObject
RoleSchema.set('toObject', { virtuals: true });
RoleSchema.set('toJSON', { virtuals: true });

RoleSchema.plugin(mongooseLeanVirtuals);

// Add indexes for hierarchy queries
RoleSchema.index({ depth: 1 }); // For depth-based queries
RoleSchema.index({ ancestors: 1, depth: 1 }); // Compound index for subtree queries (covers ancestors queries too)
RoleSchema.index({ name: 1, description: 1 }); // For name-based queries
