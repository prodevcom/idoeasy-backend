import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiSwaggerDocs, JwtAuthGuard, PermissionRole } from '@entech/common';

import { AuditLogsQueryDto } from '../dto/audit-logs-query.dto';
import { AuditLogService } from '../services/audit-log.service';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiSwaggerDocs({
    operation: {
      summary: 'Search audit logs with filters',
      description: 'Searches for audit logs with optional filters',
    },
    responses: [
      {
        status: 200,
        description: 'Audit logs retrieved successfully',
      },
    ],
  })
  @PermissionRole('audit-logs.search')
  async searchLogs(@Query() queryParams: AuditLogsQueryDto) {
    return this.auditLogService.searchLogs(queryParams);
  }
}
