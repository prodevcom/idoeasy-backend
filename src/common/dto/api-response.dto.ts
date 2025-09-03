import { PaginationInfo as PaginationInfoContract } from '@idoeasy/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class StatusInfo {
  @ApiProperty({ example: 'success' })
  @Expose()
  status: string;

  @ApiProperty({ example: 'Operation completed successfully' })
  @Expose()
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  @Transform(
    ({ value }: { value: string }) => value || new Date().toISOString(),
  )
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users' })
  @Expose()
  path: string;
}

export class PaginationInfo implements PaginationInfoContract {
  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 25 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 100 })
  @Expose()
  total: number;

  @ApiProperty({ example: 4 })
  @Expose()
  totalPages: number;

  @ApiProperty({ example: true })
  @Expose()
  hasNext: boolean;

  @ApiProperty({ example: false })
  @Expose()
  hasPrev: boolean;
}

export class ApiResponseDto<T = any> {
  @ApiProperty({ type: StatusInfo })
  @Expose()
  status: StatusInfo;

  @ApiProperty()
  @Expose()
  data?: T;

  @ApiProperty({ type: PaginationInfo, required: false })
  @Expose()
  pagination?: PaginationInfo;

  constructor(
    status: string,
    message: string,
    data?: T,
    path?: string,
    pagination?: PaginationInfo,
  ) {
    this.status = {
      status,
      message,
      timestamp: new Date().toISOString(),
      path: path || '',
    };
    this.data = data;
    this.pagination = pagination;
  }

  static success<T>(
    data: T,
    message = 'Operation completed successfully',
    path?: string,
  ): ApiResponseDto<T> {
    return new ApiResponseDto('success', message, data, path);
  }

  static successList<T>(
    data: T[],
    pagination: PaginationInfo,
    message = 'List retrieved successfully',
    path?: string,
  ): ApiResponseDto<T[]> {
    return new ApiResponseDto('success', message, data, path, pagination);
  }

  static error(message: string, path?: string): ApiResponseDto {
    return new ApiResponseDto('error', message, undefined, path);
  }
}
