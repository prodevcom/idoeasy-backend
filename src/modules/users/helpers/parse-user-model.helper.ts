import { User } from '@idoeasy/common';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../dto/user-response.dto';

export const parseUserModel = (user: User): UserResponseDto => {
  return plainToInstance(UserResponseDto, user, {
    excludeExtraneousValues: true,
  });
};
