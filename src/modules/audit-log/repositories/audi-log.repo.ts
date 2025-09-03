import { AuditLog } from '@idoeasy/common';
import { CreateAuditLogRequest } from '@idoeasy/contracts';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLogsQueryDto } from '../dto/audit-logs-query.dto';

@Injectable()
export class AuditLogRepo {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  /**
   * Create a new audit log
   *
   * @param auditLog - The audit log data
   * @returns The created audit log
   */
  async create(auditLog: CreateAuditLogRequest): Promise<AuditLog> {
    const newAuditLog = new this.auditLogModel({
      ...auditLog,
      severity: auditLog.severity || 'info',
      metadata: auditLog.metadata || {},
    });

    return newAuditLog.save();
  }

  /**
   * Search for audit logs
   *
   * @param params - The query parameters
   * @returns The audit logs
   */
  async search(
    params: AuditLogsQueryDto,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      userId,
      module,
      action,
      severity,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const filter: any = {};

    if (userId) filter.userId = userId;
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (severity) filter.severity = severity;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { metadata: { $regex: search, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .populate('userId', 'name email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return {
      logs,
      total,
    };
  }

  /**
   * Find audit logs by user ID
   *
   * @param userId - The user ID
   * @returns The audit logs
   */
  async findByUserId(userId: string, limit = 30): Promise<AuditLog[]> {
    return this.auditLogModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }
}
