import { CurrentUser, User } from '@idoeasy/common';
import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
  AuditLogOptions,
  BaseAuditHooksService,
  BaseChangeEvent,
} from '../../audit-log/services/base-audit-hooks.service';

export interface UserChangeEvent extends BaseChangeEvent {
  type:
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DELETED'
    | 'USER_PASSWORD_CHANGED'
    | 'USER_ROLE_ASSIGNED'
    | 'USER_STATUS_CHANGED'
    | 'USER_PREFERENCES_UPDATED'
    | 'USER_LOGIN'
    | 'USER_LOGOUT';
  targetId: string; // userId - inherited but aliased for clarity
}

@Injectable()
export class UserHooksService extends BaseAuditHooksService {
  protected readonly logger = new Logger(UserHooksService.name);
  protected readonly moduleName = 'users';

  constructor(auditLogService: AuditLogService) {
    super(auditLogService);
  }

  // =============================================
  // BASE METHODS (Override from BaseAuditHooksService)
  // =============================================

  /**
   * Override: Handle user creation
   */
  async onCreated(currentUser: CurrentUser, user: User): Promise<void> {
    const event: UserChangeEvent = {
      type: 'USER_CREATED',
      targetId: user._id.toString(),
      newValues: this.extractUserValues(user),
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'users',
      action: 'USER_CREATED',
      description: `Created user: ${user.name} (${user.email})`,
      targetField: 'targetUserId',
    });
  }

  /**
   * Override: Handle user update
   */
  async onUpdated(
    currentUser: CurrentUser,
    userId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): Promise<void> {
    const event: UserChangeEvent = {
      type: 'USER_UPDATED',
      targetId: userId,
      oldValues,
      newValues,
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'users',
      action: 'USER_UPDATED',
      targetField: 'targetUserId',
    });
  }

  /**
   * Override: Handle user deletion
   */
  async onDeleted(
    currentUser: CurrentUser,
    userId: string,
    deletedUser?: User,
  ): Promise<void> {
    const event: UserChangeEvent = {
      type: 'USER_DELETED',
      targetId: userId,
      oldValues: deletedUser
        ? this.extractUserValues(deletedUser)
        : { id: userId },
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'users',
      action: 'USER_DELETED',
      description: `Deleted user`,
      severity: 'critical',
      targetField: 'targetUserId',
    });
  }

  // =============================================
  // CUSTOM USER-SPECIFIC METHODS
  // =============================================

  /**
   * Handle user creation with detailed values
   */
  async onUserCreated(currentUser: CurrentUser, user: User): Promise<void> {
    const event: UserChangeEvent = {
      type: 'USER_CREATED',
      targetId: user._id.toString(),
      newValues: {
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
      },
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'users',
      action: 'USER_CREATED',
      description: `Created user: ${user.name} (${user.email})`,
      targetField: 'targetUserId',
    });
  }

  /**
   * Handle user update with detailed tracking
   */
  async onUserUpdated(
    currentUser: CurrentUser,
    userId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
  ): Promise<void> {
    const event: UserChangeEvent = {
      type: 'USER_UPDATED',
      targetId: userId,
      oldValues,
      newValues,
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'users',
      action: 'USER_UPDATED',
      targetField: 'targetUserId',
    });
  }

  /**
   * Handle password change
   */
  async onPasswordChanged(
    currentUser: CurrentUser,
    userId: string,
  ): Promise<void> {
    const event: UserChangeEvent = {
      type: 'USER_PASSWORD_CHANGED',
      targetId: userId,
      metadata: {
        changedBy: currentUser.user._id.toString(),
        isSelfChange: currentUser.user._id.toString() === userId,
      },
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'users',
      action: 'PASSWORD_CHANGED',
      severity: 'warning',
      targetField: 'targetUserId',
    });
  }

  /**
   * Handle role assignment
   */
  async onRoleAssigned(
    currentUser: CurrentUser,
    userId: string,
    oldRole: string,
    newRole: string,
  ): Promise<void> {
    const event: UserChangeEvent = {
      type: 'USER_ROLE_ASSIGNED',
      targetId: userId,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'users',
      action: 'ROLE_ASSIGNED',
      severity: 'warning',
      targetField: 'targetUserId',
    });
  }

  /**
   * Handle user login
   */
  async onUserLogin(
    currentUser: CurrentUser,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const event: UserChangeEvent = {
      type: 'USER_LOGIN',
      targetId: userId,
      metadata,
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'users',
      action: 'USER_LOGIN',
      severity: 'info',
      targetField: 'targetUserId',
    });
  }

  /**
   * Handle user logout
   */
  async onUserLogout(
    currentUser: CurrentUser,
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const event: UserChangeEvent = {
      type: 'USER_LOGOUT',
      targetId: userId,
      metadata,
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'users',
      action: 'USER_LOGOUT',
      severity: 'info',
      targetField: 'targetUserId',
    });
  }

  /**
   * Handle user preferences update
   */
  async onUserPreferencesUpdated(
    currentUser: CurrentUser,
    userId: string,
    oldPreferences: Record<string, any>,
    newPreferences: Record<string, any>,
  ): Promise<void> {
    const event: UserChangeEvent = {
      type: 'USER_PREFERENCES_UPDATED',
      targetId: userId,
      oldValues: oldPreferences,
      newValues: newPreferences,
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'users',
      action: 'PREFERENCES_UPDATED',
      severity: 'info',
      targetField: 'targetUserId',
    });
  }

  // =============================================
  // PROTECTED OVERRIDES (BaseAuditHooksService)
  // =============================================

  /**
   * Override: Custom change detection for users with smart field tracking
   */
  protected async logChange(
    currentUser: CurrentUser,
    event: UserChangeEvent,
    options: AuditLogOptions,
  ): Promise<void> {
    const {
      module,
      action,
      severity = 'info',
      targetField = 'targetUserId',
    } = options;

    let { description } = options;

    // Build metadata with common fields
    const metadata: Record<string, any> = {
      event: event.type,
      [targetField]: new Types.ObjectId(event.targetId),
      ...event.metadata,
    };

    // Smart user-specific UPDATE handling
    if (event.type === 'USER_UPDATED' && event.oldValues && event.newValues) {
      const userChanges = this.getDetailedUserChanges(
        event.oldValues,
        event.newValues,
      );

      if (userChanges.hasChanges) {
        metadata.changes = userChanges.basicChanges;

        // Handle sensitive changes
        if (userChanges.hasSensitiveChanges) {
          metadata.sensitiveChanges = userChanges.sensitiveChanges;
        }

        // Build smart description
        if (!description) {
          const changesSummary: string[] = [];
          changesSummary.push(
            `user: ${event.newValues.name || event.newValues.email}`,
          );

          if (Object.keys(userChanges.basicChanges).length > 0) {
            changesSummary.push(
              `fields: ${Object.keys(userChanges.basicChanges).join(', ')}`,
            );
          }

          if (userChanges.hasSensitiveChanges) {
            const sensitiveFields = Object.keys(userChanges.sensitiveChanges);
            changesSummary.push(`sensitive: ${sensitiveFields.join(', ')}`);
          }

          description = `Updated ${changesSummary.join(', ')}`;
        }
      }
    }

    // Handle password changes with special security level
    if (event.type === 'USER_PASSWORD_CHANGED') {
      metadata.securityEvent = true;
      metadata.isSelfChange = event.metadata?.isSelfChange || false;

      if (!description) {
        description = event.metadata?.isSelfChange
          ? 'User changed their own password'
          : 'Password changed by administrator';
      }
    }

    // Handle role assignments with role change tracking
    if (
      event.type === 'USER_ROLE_ASSIGNED' &&
      event.oldValues &&
      event.newValues
    ) {
      const oldRole = event.oldValues.role;
      const newRole = event.newValues.role;

      metadata.roleChange = {
        oldRole: oldRole ? new Types.ObjectId(oldRole) : null,
        newRole: newRole ? new Types.ObjectId(newRole) : null,
      };

      if (!description) {
        description = `Role changed from ${oldRole || 'none'} to ${newRole || 'none'}`;
      }
    }

    // Auto-generate description for other events if not provided
    if (!description) {
      description = this.generateDefaultDescription(event, action);
    }

    // Determine severity based on event type
    const finalSeverity = this.determineUserEventSeverity(event.type, severity);

    // Log with appropriate severity
    await this.logWithSeverity(
      currentUser,
      module,
      action,
      description,
      metadata,
      finalSeverity,
    );

    this.logger.log(
      `Processed ${event.type} for ${this.getEntityName()}: ${event.targetId}`,
    );
  }

  /**
   * Override: Get entity name for user-specific descriptions
   */
  protected getEntityName(): string {
    return 'user';
  }

  /**
   * Override: Handle user-specific security events
   */
  protected handleSecurityEvents(event: UserChangeEvent): void {
    const securityEvents = [
      'USER_PASSWORD_CHANGED',
      'USER_ROLE_ASSIGNED',
      'USER_STATUS_CHANGED',
      'USER_LOGIN',
      'USER_DELETED',
    ];

    if (securityEvents.includes(event.type)) {
      this.logger.debug(`Handling user security event: ${event.type}`);
      // TODO: Implement user-specific security features:
      // - Rate limiting for failed login attempts
      // - Suspicious activity detection for role changes
      // - Force logout for status/role changes
      // - Compliance logging for GDPR/audit requirements
    }
  }

  /**
   * Override: Handle user-specific cache updates
   */
  protected updateCaches(event: UserChangeEvent): void {
    this.logger.debug(`Updating user caches for event: ${event.type}`);
    // TODO: Implement user-specific cache logic:
    // - User profile caches
    // - Permission/role caches for the user
    // - Session data updates
    // - Menu/navigation caches
  }

  /**
   * Override: Handle user-specific session invalidation
   */
  protected invalidateSessionCaches(event: UserChangeEvent): void {
    this.logger.debug(
      `Invalidating user session caches for event: ${event.type}`,
    );
    // TODO: Implement user-specific session logic:
    // - Force re-authentication for role/permission changes
    // - Clear session data for deleted/disabled users
    // - Update session data for profile changes
    // - Invalidate JWT tokens for security events
  }

  /**
   * Override: Handle user-specific client notifications
   */
  protected notifyClients(event: UserChangeEvent): void {
    this.logger.debug(`Notifying clients about user event: ${event.type}`);
    // TODO: Implement user-specific notifications:
    // - WebSocket notifications to user dashboards
    // - Email notifications for security events
    // - Push notifications for mobile apps
    // - Real-time profile updates
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  /**
   * Extract user values for logging
   */
  private extractUserValues(user: User): Record<string, any> {
    return {
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role,
    };
  }

  /**
   * Get detailed user changes with smart field categorization
   */
  private getDetailedUserChanges(
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
  ): {
    hasChanges: boolean;
    basicChanges: Record<string, { old: any; new: any }>;
    hasSensitiveChanges: boolean;
    sensitiveChanges: Record<string, { old: any; new: any }>;
  } {
    const basicChanges: Record<string, { old: any; new: any }> = {};
    const sensitiveChanges: Record<string, { old: any; new: any }> = {};

    // Basic fields (non-sensitive)
    const basicFields = ['name', 'email'];

    // Sensitive fields (require special attention)
    const sensitiveFields = ['status', 'role', 'isActive'];

    basicFields.forEach((field) => {
      if (oldValues[field] !== newValues[field]) {
        basicChanges[field] = {
          old: oldValues[field],
          new: newValues[field],
        };
      }
    });

    sensitiveFields.forEach((field) => {
      if (oldValues[field] !== newValues[field]) {
        sensitiveChanges[field] = {
          old: oldValues[field],
          new: newValues[field],
        };
      }
    });

    const hasChanges =
      Object.keys(basicChanges).length > 0 ||
      Object.keys(sensitiveChanges).length > 0;
    const hasSensitiveChanges = Object.keys(sensitiveChanges).length > 0;

    return {
      hasChanges,
      basicChanges,
      hasSensitiveChanges,
      sensitiveChanges,
    };
  }

  /**
   * Determine appropriate severity level for user events
   */
  private determineUserEventSeverity(
    eventType: string,
    defaultSeverity: 'info' | 'warning' | 'error' | 'critical',
  ): 'info' | 'warning' | 'error' | 'critical' {
    switch (eventType) {
      case 'USER_PASSWORD_CHANGED':
      case 'USER_ROLE_ASSIGNED':
      case 'USER_STATUS_CHANGED':
        return 'warning';
      case 'USER_DELETED':
        return 'critical';
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
      case 'USER_PREFERENCES_UPDATED':
        return 'info';
      default:
        return defaultSeverity;
    }
  }
}
