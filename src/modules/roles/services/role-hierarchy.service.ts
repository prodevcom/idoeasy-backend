import { Role } from '@entech/common';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { RoleRepo } from '../repositories/role.repo';

export interface ComputedPath {
  ancestors: Types.ObjectId[];
  depth: number;
}

@Injectable()
export class RoleHierarchyService {
  constructor(private roleRepo: RoleRepo) {}

  /**
   * Compute the materialized path for a role based on its parent
   *
   * @param parentId - The parent role ID (optional for root roles)
   * @returns The computed ancestors array and depth
   */
  async computePath(parentId?: string): Promise<ComputedPath> {
    if (!parentId) {
      // Root role
      return {
        ancestors: [],
        depth: 0,
      };
    }

    const parent = await this.roleRepo.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Parent role with ID ${parentId} not found`);
    }

    return {
      ancestors: [...parent.ancestors, new Types.ObjectId(parentId)],
      depth: parent.depth + 1,
    };
  }

  /**
   * Validate that moving a role won't create a cycle
   *
   * @param roleId - The role being moved
   * @param newParentId - The new parent role ID
   */
  async validateNoCycle(roleId: string, newParentId?: string): Promise<void> {
    if (!newParentId) {
      return; // Moving to root, no cycle possible
    }

    if (roleId === newParentId) {
      throw new BadRequestException('A role cannot be its own parent');
    }

    // Check if the new parent is a descendant of the role being moved
    const descendants = await this.roleRepo.findDescendants(roleId);
    const descendantIds = descendants.map((d) => d._id.toString());

    if (descendantIds.includes(newParentId)) {
      throw new BadRequestException(
        'Cannot move role to one of its descendants (would create a cycle)',
      );
    }
  }

  /**
   * Check if a user can manage a role based on hierarchy
   *
   * @param userRole - The user's role
   * @param targetRole - The target role to manage
   * @returns True if user can manage the role
   */
  canManageRole(userRole: Role, targetRole: Role): boolean {
    // Admins can manage everything
    if (userRole.isAdmin) {
      return true;
    }

    // Users can manage themselves
    if (userRole._id.toString() === targetRole._id.toString()) {
      return true;
    }

    // Users can manage their descendants
    return targetRole.ancestors.some(
      (ancestorId) => ancestorId.toString() === userRole._id.toString(),
    );
  }

  /**
   * Check if a user can assign a role based on hierarchy
   *
   * @param userRole - The user's role
   * @param roleToAssign - The role to assign
   * @returns True if user can assign the role
   */
  canAssignRole(userRole: Role, roleToAssign: Role): boolean {
    // Admins can assign everything
    if (userRole.isAdmin) {
      return true;
    }

    // Users can assign roles they can manage
    return this.canManageRole(userRole, roleToAssign);
  }

  /**
   * Build a tree structure from flat role list
   *
   * @param roles - Flat list of roles
   * @returns Tree structure with children
   */
  buildRoleTree(roles: Role[]): (Role & { children: Role[] })[] {
    const roleMap = new Map<string, Role & { children: Role[] }>();
    const rootRoles: (Role & { children: Role[] })[] = [];

    // Initialize all roles with children array
    roles.forEach((role) => {
      roleMap.set(role._id.toString(), { ...role, children: [] });
    });

    // Build tree structure
    roles.forEach((role) => {
      const roleWithChildren = roleMap.get(role._id.toString());

      if (role.depth === 0) {
        // Root role
        rootRoles.push(roleWithChildren);
      } else {
        // Find parent and add as child
        const parentId = role.ancestors[role.ancestors.length - 1]?.toString();
        const parent = roleMap.get(parentId);
        if (parent) {
          parent.children.push(roleWithChildren);
        }
      }
    });

    return rootRoles;
  }

  /**
   * Get all roles that a user can see based on hierarchy
   *
   * @param userRole - The user's role
   * @param allRoles - All available roles
   * @returns Roles the user can see
   */
  async getVisibleRoles(userRole: Role, myRoles?: Role[]): Promise<Role[]> {
    const allRoles = myRoles
      ? myRoles
      : (
          await this.roleRepo.search(
            { page: 1, limit: 1000 }, // Get all roles
            { role: { isAdmin: true } } as any,
          )
        ).roles;

    if (userRole.isAdmin) {
      return allRoles; // Admins see everything
    }

    return allRoles.filter((role) => this.canManageRole(userRole, role));
  }
}
