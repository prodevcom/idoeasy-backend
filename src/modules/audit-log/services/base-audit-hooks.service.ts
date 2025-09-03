import { CurrentUser } from '@idoeasy/common';
import { capitalizeWords } from '@idoeasy/common/helpers';
import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditLogService } from './audit-log.service';

export interface BaseChangeEvent {
  type: string;
  targetId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface AuditLogOptions {
  module: string;
  action: string;
  description?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  targetField?: string; // field name to use for targetId (e.g., 'targetUserId', 'targetRoleId')
}

@Injectable()
export abstract class BaseAuditHooksService {
  protected abstract readonly logger: Logger;
  protected abstract readonly moduleName: string;

  constructor(protected readonly auditLogService: AuditLogService) {}

  /**
   * Centralized audit logging with smart metadata handling
   */
  protected async logChange(
    currentUser: CurrentUser,
    event: BaseChangeEvent,
    options: AuditLogOptions,
  ): Promise<void> {
    const {
      module,
      action,
      severity = 'info',
      targetField = 'targetId',
    } = options;

    let { description } = options;

    // Build metadata with common fields
    const metadata: Record<string, any> = {
      event: event.type,
      [targetField]: new Types.ObjectId(event.targetId),
      ...event.metadata,
    };

    // Handle UPDATE events with old/new values
    if (event.type.includes('UPDATE') && event.oldValues && event.newValues) {
      const changes = this.getChangedFields(event.oldValues, event.newValues);

      if (Object.keys(changes).length > 0) {
        // metadata.oldValues = event.oldValues;
        // metadata.newValues = event.newValues;
        metadata.changes = changes;

        // Auto-generate description if not provided
        if (!description) {
          const changedFields = Object.keys(changes).join(', ');
          description = `Updated ${this.getEntityName()}: ${changedFields}`;
        }
      }
    }

    // Auto-generate description for other events if not provided
    if (!description) {
      description = this.generateDefaultDescription(event, action);
    }

    // Log with appropriate severity
    await this.logWithSeverity(
      currentUser,
      module,
      action,
      description,
      metadata,
      severity,
    );

    this.logger.log(
      `Processed ${event.type} for ${this.getEntityName()}: ${event.targetId}`,
    );
  }

  /**
   * Get changed fields between old and new values
   */
  protected getChangedFields(
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): Record<string, { old: any; new: any }> {
    if (!oldValues || !newValues) return {};

    const changes: Record<string, { old: any; new: any }> = {};
    Object.keys(newValues).forEach((key) => {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = {
          old: oldValues[key],
          new: newValues[key],
        };
      }
    });
    return changes;
  }

  /**
   * Log with appropriate severity level
   */
  protected async logWithSeverity(
    currentUser: CurrentUser,
    module: string,
    action: string,
    description: string,
    metadata: Record<string, any>,
    severity: 'info' | 'warning' | 'error' | 'critical',
  ): Promise<void> {
    const userId = currentUser.user._id;
    const sessionId = currentUser.session?._id;

    switch (severity) {
      case 'info':
        await this.auditLogService.logInfo(
          userId,
          module,
          action,
          description,
          sessionId,
          metadata,
        );
        break;
      case 'warning':
        await this.auditLogService.logWarning(
          userId,
          module,
          action,
          description,
          sessionId,
          metadata,
        );
        break;
      case 'error':
        await this.auditLogService.logError(
          userId,
          module,
          action,
          description,
          sessionId,
          metadata,
        );
        break;
      case 'critical':
        await this.auditLogService.logCritical(
          userId,
          module,
          action,
          description,
          sessionId,
          metadata,
        );
        break;
    }
  }

  /**
   * Format changes for human-readable description
   */
  protected formatChanges(
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): string {
    if (!oldValues || !newValues) return '';

    const changes: string[] = [];
    Object.keys(newValues).forEach((key) => {
      if (oldValues[key] !== newValues[key]) {
        changes.push(`${key}: ${oldValues[key]} → ${newValues[key]}`);
      }
    });
    return changes.join(', ');
  }

  /**
   * Get entity name for descriptions (override in subclasses)
   */
  protected getEntityName(): string {
    return this.moduleName.slice(0, -1); // Remove 's' from module name
  }

  /**
   * Generate default description based on event type
   */
  protected generateDefaultDescription(
    event: BaseChangeEvent,
    action: string,
  ): string {
    const entityName = capitalizeWords(this.getEntityName());

    if (event.type.includes('CREATE')) {
      return `Created ${entityName}`;
    } else if (event.type.includes('UPDATE')) {
      return `Updated ${entityName}`;
    } else if (event.type.includes('DELETE')) {
      return `Deleted ${entityName}`;
    } else if (event.type.includes('LOGIN')) {
      return `${entityName} logged in`;
    } else if (event.type.includes('LOGOUT')) {
      return `${entityName} logged out`;
    }

    return action;
  }

  /**
   * Base implementation: Handle entity creation (can be overridden)
   */
  async onCreated(currentUser: CurrentUser, entity: any): Promise<void> {
    const event: BaseChangeEvent = {
      type: `${this.getEntityName().toUpperCase()}_CREATED`,
      targetId: entity._id.toString(),
      newValues: this.extractEntityValues
        ? this.extractEntityValues(entity)
        : entity,
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: this.moduleName,
      action: `${this.getEntityName().toUpperCase()}_CREATED`,
      description: `Created ${this.getEntityName()}`,
      targetField: `target${this.getEntityName().charAt(0).toUpperCase() + this.getEntityName().slice(1)}Id`,
    });
  }

  /**
   * Base implementation: Handle entity update (can be overridden)
   */
  async onUpdated(
    currentUser: CurrentUser,
    entityId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): Promise<void> {
    const event: BaseChangeEvent = {
      type: `${this.getEntityName().toUpperCase()}_UPDATED`,
      targetId: entityId,
      oldValues,
      newValues,
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: this.moduleName,
      action: `${this.getEntityName().toUpperCase()}_UPDATED`,
      targetField: `target${this.getEntityName().charAt(0).toUpperCase() + this.getEntityName().slice(1)}Id`,
    });
  }

  /**
   * Base implementation: Handle entity deletion (can be overridden)
   */
  async onDeleted(
    currentUser: CurrentUser,
    entityId: string,
    deletedEntity?: any,
  ): Promise<void> {
    const event: BaseChangeEvent = {
      type: `${this.getEntityName().toUpperCase()}_DELETED`,
      targetId: entityId,
      oldValues: deletedEntity || { id: entityId },
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: this.moduleName,
      action: `${this.getEntityName().toUpperCase()}_DELETED`,
      description: `Deleted ${this.getEntityName()}`,
      severity: 'warning',
      targetField: `target${this.getEntityName().charAt(0).toUpperCase() + this.getEntityName().slice(1)}Id`,
    });
  }

  /**
   * Optional: Extract entity values for logging (can be overridden)
   */
  protected extractEntityValues?(entity: any): Record<string, any>;

  /**
   * Trigger cache updates (override in subclasses for specific logic)
   */
  protected updateCaches(event: BaseChangeEvent): void {
    this.logger.debug(`Updating caches for event: ${event.type}`);
    // Override in subclasses for specific cache logic
  }

  /**
   * Invalidate session caches (override in subclasses for specific logic)
   */
  protected invalidateSessionCaches(event: BaseChangeEvent): void {
    this.logger.debug(`Invalidating session caches for event: ${event.type}`);
    // Override in subclasses for specific session cache logic
  }

  /**
   * Notify clients of changes (override in subclasses for specific logic)
   */
  protected notifyClients(event: BaseChangeEvent): void {
    this.logger.debug(`Notifying clients for event: ${event.type}`);
    // Override in subclasses for real-time notifications
  }

  /**
   * Handle security-related events (override in subclasses for specific logic)
   */
  protected handleSecurityEvents(event: BaseChangeEvent): void {
    this.logger.debug(`Handling security events for event: ${event.type}`);
    // Override in subclasses for security-specific logic
  }

  /**
   * Main processing method that handles the full workflow
   */
  protected async processEvent(
    currentUser: CurrentUser,
    event: BaseChangeEvent,
    options: AuditLogOptions,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing ${event.type} for ${this.getEntityName()}: ${event.targetId}`,
      );

      // Log the change
      await this.logChange(currentUser, event, options);

      // Trigger side effects
      this.updateCaches(event);
      this.invalidateSessionCaches(event);
      this.notifyClients(event);
      this.handleSecurityEvents(event);

      this.logger.log(
        `Successfully processed ${event.type} for ${this.getEntityName()}: ${event.targetId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process ${event.type} for ${this.getEntityName()}: ${event.targetId}`,
        error,
      );
      throw error;
    }
  }
}
