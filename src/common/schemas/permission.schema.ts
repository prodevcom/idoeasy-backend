import type { Permission as PermissionContract } from '@idoeasy/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument } from 'mongoose';

export type PermissionDocument = Permission & Document;
export type PermissionDoc = HydratedDocument<Permission>;

@Schema({ timestamps: true })
export class Permission
  implements Omit<PermissionContract, 'id' | 'createdAt' | 'updatedAt'>
{
  @ApiProperty({ description: 'Permission unique identifier' })
  _id: string;

  @ApiProperty({
    description: 'Permission name (e.g., user.read, user.write)',
    example: 'user.read',
  })
  @Prop({ required: true, unique: true })
  name: string;

  @ApiProperty({
    description: 'Permission description',
    example: 'Read user information',
  })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'Permission module/category', example: 'user' })
  @Prop({ required: true })
  module: string;

  @ApiProperty({ description: 'Permission action', example: 'read' })
  @Prop({ required: true })
  action: string;

  @ApiProperty({
    description: 'Whether the permission is active',
    example: true,
  })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the permission is admin only',
    example: false,
  })
  @Prop({ default: false })
  isAdminOnly: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

// Add compound unique index for module and action
PermissionSchema.index({ module: 1, action: 1 }, { unique: true });
