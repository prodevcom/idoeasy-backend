import { TransformDate, TransformObjectId } from '@idoeasy/common';
import { User, UserPreferences, UserStatus } from '@idoeasy/contracts';
import { RoleResponseDto } from '@idoeasy/modules/roles/dto/role-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { Types } from 'mongoose';

export class UserResponseDto implements Omit<User, 'password'> {
  @ApiProperty({
    description: 'User unique identifier',
    example: '507f1f77bcf86cd799439011',
  })
  @TransformObjectId('_id')
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User account status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @Expose()
  status: UserStatus;

  @ApiProperty({
    description: 'User role information',
    type: RoleResponseDto,
    required: false,
  })
  @Expose()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @Type(() => RoleResponseDto)
  role?: Types.ObjectId;

  @ApiProperty({
    description: 'User metadata',
    required: false,
  })
  @Expose()
  metadata?: UserPreferences;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  @TransformDate()
  createdAt: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  @TransformDate()
  updatedAt: Date;
}
