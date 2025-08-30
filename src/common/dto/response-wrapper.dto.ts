import { ApiProperty } from '@nestjs/swagger';

export class StatusInfo {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users' })
  path: string;
}

export class PaginationInfo {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 25 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 4 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrev: boolean;
}

export class ResponseWrapper<T = any> {
  @ApiProperty({ type: StatusInfo })
  status: StatusInfo;

  @ApiProperty()
  data: T;
}

export class ListResponseWrapper<T = any> {
  @ApiProperty({ type: StatusInfo })
  status: StatusInfo;

  @ApiProperty({ type: [Object] })
  data: T[];

  @ApiProperty({ type: PaginationInfo })
  pagination: PaginationInfo;
}
