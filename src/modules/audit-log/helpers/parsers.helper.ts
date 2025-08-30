import { AuditLog } from '@entech/common';
import { plainToInstance } from 'class-transformer';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';

export const parseAuditLog = (auditLog: AuditLog): AuditLogResponseDto => {
  return plainToInstance(AuditLogResponseDto, auditLog, {
    excludeExtraneousValues: true,
  });
};
