import { Authentication } from '@entech/contracts';
import { UserResponseDto } from '@entech/modules/users/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class AuthResponseDto implements Authentication {
  expiresAt: number;
  rolesSyncedAt?: number;
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token for getting new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  @Expose()
  tokenType: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  @Expose()
  expiresIn: number;

  @ApiProperty({
    description: 'User information',
  })
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;
}
