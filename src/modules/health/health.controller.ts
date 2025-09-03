import { ApiResponseDto, Public } from '@idoeasy/common';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the current health status of the application',
  })
  @ApiOkResponse({
    description: 'Application is healthy',
    type: ApiResponseDto,
    schema: {
      example: {
        status: {
          status: 'success',
          message: 'Health check successful',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        data: {
          status: 'OK',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      },
    },
  })
  getHealth(): ApiResponseDto<{ status: string; timestamp: string }> {
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
    return ApiResponseDto.success(healthData, 'Health check successful');
  }
}
