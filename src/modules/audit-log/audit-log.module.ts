import { forwardRef, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  AuditLog,
  AuditLogSchema,
} from '../../common/schemas/audit-log.schema';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditLogRepo } from './repositories';
import { AuditLogService } from './services';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    forwardRef(() => AuthModule),
    UsersModule,
  ],
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditLogRepo],
  exports: [AuditLogService],
})
export class AuditLogModule {}
