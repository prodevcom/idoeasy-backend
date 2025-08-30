import { PaginationInfo } from '@entech/common';
import type {
  AuditLog as AuditLogContract,
  CreateAuditLogRequest,
  PaginatedResponse,
} from '@entech/contracts';
import { Injectable } from '@nestjs/common';
import { AuditLogResponseDto, AuditLogsQueryDto } from '../dto/';
import { parseAuditLog } from '../helpers';
import { AuditLogRepo } from '../repositories';

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepo: AuditLogRepo) {}

  /**
   * Create a new audit log entry
   *
   * @param data - The audit log data
   * @returns The created audit log
   */
  async createLog(data: CreateAuditLogRequest): Promise<AuditLogResponseDto> {
    const createdLog = await this.auditLogRepo.create(data);

    return parseAuditLog(createdLog);
  }

  /**
   * Convenience method for logging actions
   *
   * @param userId - The user ID
   * @param module - The module
   * @param action - The action
   * @param description - The description
   * @param options - The options
   * @returns The created audit log
   */
  async log(
    userId: string,
    module: string,
    action: string,
    description: string,
    sessionId?: string,
    options?: {
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      severity?: 'info' | 'warning' | 'error' | 'critical';
    },
  ): Promise<AuditLogContract> {
    return this.createLog({
      userId,
      module,
      action,
      description,
      sessionId,
      ...options,
    });
  }

  /**
   * Quick logging methods for different severity levels
   *
   * @param userId - The user ID
   * @param module - The module
   * @param action - The action
   * @param description - The description
   * @param metadata - The metadata
   * @returns The created audit log
   */
  async logInfo(
    userId: string,
    module: string,
    action: string,
    description: string,
    sessionId?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLogContract> {
    return this.log(userId, module, action, description, sessionId, {
      severity: 'info',
      metadata,
    });
  }

  async logWarning(
    userId: string,
    module: string,
    action: string,
    description: string,
    sessionId?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLogContract> {
    return this.log(userId, module, action, description, sessionId, {
      severity: 'warning',
      metadata,
    });
  }

  async logError(
    userId: string,
    module: string,
    action: string,
    description: string,
    sessionId?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLogContract> {
    return this.log(userId, module, action, description, sessionId, {
      severity: 'error',
      metadata,
    });
  }

  async logCritical(
    userId: string,
    module: string,
    action: string,
    description: string,
    sessionId?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLogContract> {
    return this.log(userId, module, action, description, sessionId, {
      severity: 'critical',
      metadata,
    });
  }

  /**
   * Search audit logs with filters
   *
   * @param params - The query parameters
   * @returns The audit logs
   */
  async searchLogs(
    params: AuditLogsQueryDto,
  ): Promise<PaginatedResponse<AuditLogContract>> {
    const { logs, total } = await this.auditLogRepo.search(params);

    // Get pagination information
    const { page, limit } = params;
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const pagination: PaginationInfo = {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };

    return {
      data: logs.map((log) => parseAuditLog(log)),
      pagination,
    };
  }

  /**
   * Get audit logs for a specific user
   *
   * @param userId - The user ID
   * @returns The audit logs
   */
  async getUserLogs(userId: string): Promise<AuditLogResponseDto[]> {
    const logs = await this.auditLogRepo.findByUserId(userId);

    return logs.map(parseAuditLog);
  }
}
