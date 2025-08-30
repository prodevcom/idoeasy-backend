import { plainToInstance } from 'class-transformer';
import { RoleResponseDto } from '../dto/role-response.dto';

export const parseRoleModel = (role: any): RoleResponseDto => {
  return plainToInstance(RoleResponseDto, role, {
    excludeExtraneousValues: true,
  });
};
