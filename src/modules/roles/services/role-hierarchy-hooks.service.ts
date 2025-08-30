import { CurrentUser, Role } from '@entech/common';
import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import {
  AuditLogOptions,
  BaseAuditHooksService,
  BaseChangeEvent,
} from '../../audit-log/services/base-audit-hooks.service';

export interface RoleHierarchyChangeEvent extends BaseChangeEvent {
  type: 'ROLE_CREATED' | 'ROLE_MOVED' | 'ROLE_UPDATED' | 'ROLE_DELETED';
  targetId: string; // roleId - inherited but aliased for clarity
  oldParentId?: string;
  newParentId?: string;
  affectedRoleIds: string[]; // All roles affected by the change (including descendants)
}

@Injectable()
export class RoleHierarchyHooksService extends BaseAuditHooksService {
  protected readonly logger = new Logger(RoleHierarchyHooksService.name);
  protected readonly moduleName = 'roles';

  constructor(auditLogService: AuditLogService) {
    super(auditLogService);
  }

  // =============================================
  // BASE METHODS (Override from BaseAuditHooksService)
  // =============================================

  /**
   * Override: Handle role creation
   */
  async onCreated(currentUser: CurrentUser, role: Role): Promise<void> {
    const event: RoleHierarchyChangeEvent = {
      type: 'ROLE_CREATED',
      targetId: role._id.toString(),
      newValues: this.extractRoleValues(role),
      affectedRoleIds: [role._id.toString()],
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'roles',
      action: 'ROLE_CREATED',
      description: `Created role: ${role.name}`,
      targetField: 'targetRoleId',
    });
  }

  /**
   * Override: Handle role update
   */
  async onUpdated(
    currentUser: CurrentUser,
    roleId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): Promise<void> {
    const event: RoleHierarchyChangeEvent = {
      type: 'ROLE_UPDATED',
      targetId: roleId,
      oldValues,
      newValues,
      affectedRoleIds: [roleId],
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'roles',
      action: 'ROLE_UPDATED',
      targetField: 'targetRoleId',
    });
  }

  /**
   * Override: Handle role deletion
   */
  async onDeleted(
    currentUser: CurrentUser,
    roleId: string,
    deletedRole?: Role,
  ): Promise<void> {
    const event: RoleHierarchyChangeEvent = {
      type: 'ROLE_DELETED',
      targetId: roleId,
      oldValues: deletedRole
        ? this.extractRoleValues(deletedRole)
        : { id: roleId },
      affectedRoleIds: [roleId],
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'roles',
      action: 'ROLE_DELETED',
      description: `Deleted role`,
      severity: 'critical',
      targetField: 'targetRoleId',
    });
  }

  // =============================================
  // CUSTOM ROLE-SPECIFIC METHODS
  // =============================================

  /**
   * Handle role creation in hierarchy with parent
   */
  async onRoleCreated(
    currentUser: CurrentUser,
    role: Role,
    parentId?: string,
  ): Promise<void> {
    const event: RoleHierarchyChangeEvent = {
      type: 'ROLE_CREATED',
      targetId: role._id.toString(),
      newParentId: parentId,
      newValues: this.extractRoleValues(role),
      affectedRoleIds: [role._id.toString()],
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'roles',
      action: 'ROLE_CREATED',
      description: `Created role: ${role.name}${parentId ? ` under parent: ${parentId}` : ' as root role'}`,
      targetField: 'targetRoleId',
    });
  }

  /**
   * Handle role movement in hierarchy
   */
  async onRoleMoved(
    currentUser: CurrentUser,
    roleId: string,
    oldParentId: string | undefined,
    newParentId: string | undefined,
    affectedDescendants: string[],
  ): Promise<void> {
    const event: RoleHierarchyChangeEvent = {
      type: 'ROLE_MOVED',
      targetId: roleId,
      oldParentId,
      newParentId,
      affectedRoleIds: [roleId, ...affectedDescendants],
      timestamp: new Date(),
    };

    await this.processEvent(currentUser, event, {
      module: 'roles',
      action: 'ROLE_MOVED',
      description: `Moved role from ${oldParentId || 'root'} to ${newParentId || 'root'}`,
      severity: 'warning',
      targetField: 'targetRoleId',
    });
  }

  /**
   * Handle role update with detailed tracking
   */
  async onRoleUpdated(
    currentUser: CurrentUser,
    role: Role,
    oldRole?: Role,
  ): Promise<void> {
    // If we have old role data, use detailed tracking
    if (oldRole) {
      const event: RoleHierarchyChangeEvent = {
        type: 'ROLE_UPDATED',
        targetId: role._id.toString(),
        oldValues: this.extractRoleValues(oldRole),
        newValues: this.extractRoleValues(role),
        affectedRoleIds: [role._id.toString()],
        timestamp: new Date(),
      };
      await this.processEvent(currentUser, event, {
        module: 'roles',
        action: 'ROLE_UPDATED',
        targetField: 'targetRoleId',
      });
    } else {
      // Fallback to simple update
      await this.onUpdated(
        currentUser,
        role._id.toString(),
        undefined,
        this.extractRoleValues(role),
      );
    }
  }

  // =============================================
  // PROTECTED OVERRIDES (BaseAuditHooksService)
  // =============================================

  /**
   * Override: Custom change detection for roles with smart permission tracking
   */
  protected async logChange(
    currentUser: CurrentUser,
    event: RoleHierarchyChangeEvent,
    options: AuditLogOptions,
  ): Promise<void> {
    const {
      module,
      action,
      severity = 'info',
      targetField = 'targetRoleId',
    } = options;

    let { description } = options;

    // Build metadata with common fields
    const metadata: Record<string, any> = {
      event: event.type,
      [targetField]: new Types.ObjectId(event.targetId),
      ...event.metadata,
    };

    // Smart role-specific UPDATE handling
    if (event.type === 'ROLE_UPDATED' && event.oldValues && event.newValues) {
      const roleChanges = this.getDetailedRoleChanges(
        event.oldValues,
        event.newValues,
      );

      if (roleChanges.hasChanges) {
        metadata.changes = roleChanges.basicChanges;

        // Smart permission tracking - only log additions/removals
        if (roleChanges.permissionChanges) {
          metadata.permissionChanges = {
            added: roleChanges.permissionChanges.added.map(
              (p) => new Types.ObjectId(p),
            ),
            removed: roleChanges.permissionChanges.removed.map(
              (p) => new Types.ObjectId(p),
            ),
            addedCount: roleChanges.permissionChanges.added.length,
            removedCount: roleChanges.permissionChanges.removed.length,
          };
        }

        // Build smart description
        if (!description) {
          const changesSummary: string[] = [];
          changesSummary.push(`role: ${event.newValues.name}`);

          if (Object.keys(roleChanges.basicChanges).length > 0) {
            changesSummary.push(
              `fields: ${Object.keys(roleChanges.basicChanges).join(', ')}`,
            );
          }

          if (roleChanges.permissionChanges?.added.length > 0) {
            changesSummary.push(
              `+${roleChanges.permissionChanges.added.length} permissions`,
            );
          }

          if (roleChanges.permissionChanges?.removed.length > 0) {
            changesSummary.push(
              `-${roleChanges.permissionChanges.removed.length} permissions`,
            );
          }

          description = `Updated ${changesSummary.join(', ')}`;
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
   * Override: Get entity name for role-specific descriptions
   */
  protected getEntityName(): string {
    return 'role';
  }

  /**
   * Override: Handle role-specific cache updates
   */
  protected updateCaches(event: RoleHierarchyChangeEvent): void {
    this.logger.debug(`Updating role caches for event: ${event.type}`);
    // TODO: Implement role-specific cache logic:
    // - Role hierarchy caches
    // - Permission inheritance caches
    // - User permission caches for affected roles
    // - Menu/navigation caches
  }

  /**
   * Override: Handle role-specific session invalidation
   */
  protected invalidateSessionCaches(event: RoleHierarchyChangeEvent): void {
    this.logger.debug(
      `Invalidating role session caches for roles: ${event.affectedRoleIds.join(', ')}`,
    );
    // TODO: Implement role-specific session logic:
    // - Force re-authentication for users with affected roles
    // - Clear permission caches for affected users
    // - Update session data for role changes
    // - Invalidate JWT tokens for security events
  }

  /**
   * Override: Handle role-specific client notifications
   */
  protected notifyClients(event: RoleHierarchyChangeEvent): void {
    this.logger.debug(`Notifying clients about role event: ${event.type}`);
    // TODO: Implement role-specific notifications:
    // - WebSocket notifications to admin interfaces
    // - Real-time permission updates for affected users
    // - Hierarchy tree updates in UI
    // - Permission matrix updates
  }

  /**
   * Override: Handle role-specific security events
   */
  protected handleSecurityEvents(event: RoleHierarchyChangeEvent): void {
    const criticalEvents = ['ROLE_DELETED', 'ROLE_MOVED'];
    if (criticalEvents.includes(event.type)) {
      this.logger.debug(`Handling role security event: ${event.type}`);
      // TODO: Implement role-specific security features:
      // - Alert on admin role changes
      // - Log hierarchy modifications for compliance
      // - Suspicious activity detection for mass changes
      // - Backup critical role configurations
    }
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  /**
   * Extract role values for comparison
   */
  private extractRoleValues(role: Role): Record<string, any> {
    return {
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      isDefault: role.isDefault,
      isAdmin: role.isAdmin,
      permissions: role.permissions.map((p) =>
        typeof p === 'string' ? p : p._id?.toString() || p.toString(),
      ),
    };
  }

  /**
   * Get detailed role changes with smart permission tracking
   */
  private getDetailedRoleChanges(
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
  ): {
    hasChanges: boolean;
    basicChanges: Record<string, { old: any; new: any }>;
    permissionChanges?: { added: string[]; removed: string[] };
  } {
    const basicChanges: Record<string, { old: any; new: any }> = {};
    let permissionChanges: { added: string[]; removed: string[] } | undefined;

    // Track basic field changes (excluding permissions)
    const basicFields = [
      'name',
      'description',
      'isActive',
      'isDefault',
      'isAdmin',
    ];

    basicFields.forEach((field) => {
      if (oldValues[field] !== newValues[field]) {
        basicChanges[field] = {
          old: oldValues[field],
          new: newValues[field],
        };
      }
    });

    // Smart permission tracking
    if (oldValues.permissions && newValues.permissions) {
      permissionChanges = this.getPermissionChanges(
        oldValues.permissions,
        newValues.permissions,
      );
    }

    const hasChanges =
      Object.keys(basicChanges).length > 0 ||
      (permissionChanges &&
        (permissionChanges.added.length > 0 ||
          permissionChanges.removed.length > 0));

    return {
      hasChanges,
      basicChanges,
      permissionChanges:
        permissionChanges &&
        (permissionChanges.added.length > 0 ||
          permissionChanges.removed.length > 0)
          ? permissionChanges
          : undefined,
    };
  }

  /**
   * Compare permission arrays and return added/removed permissions
   */
  private getPermissionChanges(
    oldPermissions: any[],
    newPermissions: any[],
  ): { added: string[]; removed: string[] } {
    const oldIds = oldPermissions.map((p) =>
      typeof p === 'string'
        ? p
        : ((p._id?.toString() || p.toString()) as string),
    );
    const newIds = newPermissions.map((p) =>
      typeof p === 'string'
        ? p
        : ((p._id?.toString() || p.toString()) as string),
    );

    const added = newIds.filter((id) => !oldIds.includes(id));
    const removed = oldIds.filter((id) => !newIds.includes(id));

    return { added, removed };
  }
}
