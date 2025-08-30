import { plainToInstance } from 'class-transformer';
import { PermissionResponseDto } from '../dto/permission-response.dto';

export const parsePermissionModel = (
  permission: any,
): PermissionResponseDto => {
  return plainToInstance(PermissionResponseDto, permission, {
    excludeExtraneousValues: true,
  });
};
