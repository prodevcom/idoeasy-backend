import {
  HttpExceptionFilter,
  JwtAuthGuard,
  JwtStrategy,
  PermissionGuard,
  TransformInterceptor,
  ValidationInterceptor,
} from '@entech/common';
import {
  AuditLogModule,
  AuthModule,
  ConfigModule,
  DatabaseModule,
  HealthModule,
  RolesModule,
  UsersModule,
} from '@entech/modules';
import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
// Session activity is now handled in JwtAuthGuard; removing extra guard

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    HealthModule,
    AuthModule,
    RolesModule,
    AuditLogModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ValidationInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_PIPE, useClass: ValidationPipe },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    JwtStrategy,
  ],
})
export class AppModule {}
