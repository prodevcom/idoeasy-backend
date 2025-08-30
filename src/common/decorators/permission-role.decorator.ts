import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const PermissionRole = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
