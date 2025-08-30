import { CurrentUser, PaginationInfo } from '@entech/common';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateRoleDto,
  MoveRoleDto,
  RoleFilterDto,
  RoleResponseDto,
  UpdateRoleDto,
} from '../dto';
import { parseRoleModel } from '../helpers';
import { PermissionRepo, RoleRepo } from '../repositories';
import { RoleHierarchyHooksService, RoleHierarchyService } from './';

@Injectable()
export class RolesService {
  constructor(
    private roleRepo: RoleRepo,
    private permissionRepo: PermissionRepo,
    private hierarchyHelper: RoleHierarchyService,
    private hierarchyHooks: RoleHierarchyHooksService,
  ) {}

  /**
   * Create a role
   *
   * @param createRoleDto - The role data to create
   * @param currentUser - The current user
   * @returns The created role
   */
  async create(
    createRoleDto: CreateRoleDto,
    currentUser: CurrentUser,
  ): Promise<RoleResponseDto> {
    // Verify if the user has access to the permissions
    await this.verifyPermissionAccess(
      currentUser,
      createRoleDto.permissions || [],
    );

    // Verify parent role access if specified
    if (createRoleDto.parentId) {
      await this.verifyParentRoleAccess(currentUser, createRoleDto.parentId);
    }

    // Compute hierarchy path
    const { ancestors, depth } = await this.hierarchyHelper.computePath(
      createRoleDto.parentId,
    );

    // Create role with hierarchy fields
    const roleData = {
      ...createRoleDto,
      ancestors,
      depth,
    };
    delete (roleData as any).parentId; // Remove parentId from creation data

    const createdRole = await this.roleRepo.create(roleData);

    // Trigger hierarchy hooks
    await this.hierarchyHooks.onRoleCreated(
      currentUser,
      createdRole,
      createRoleDto.parentId,
    );

    return parseRoleModel(createdRole);
  }

  /**
   * Find all roles
   *
   * @param filterDto - The filter parameters
   * @param currentUser - The current user
   * @returns The roles and pagination information
   */
  async findAll(
    filterDto: RoleFilterDto,
    currentUser: CurrentUser,
  ): Promise<{ roles: RoleResponseDto[]; pagination: PaginationInfo }> {
    let allowedRoleIds: string[] = [];

    // For non-admin users, determine which roles they can see
    if (!currentUser.role?.isAdmin) {
      // Filter roles user can see based on hierarchy
      const visibleRoles = await this.hierarchyHelper.getVisibleRoles(
        currentUser.role,
      );
      allowedRoleIds = visibleRoles.map((role) => role._id.toString());
    }

    // Get roles with proper pagination (repository handles filtering)
    const { roles, total } = await this.roleRepo.search(
      filterDto,
      currentUser,
      allowedRoleIds.length > 0 ? allowedRoleIds : undefined,
    );

    const { page, limit } = filterDto;
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
      roles: roles.map((role) => parseRoleModel(role)),
      pagination,
    };
  }

  /**
   * Find a role by its ID
   *
   * @param id - The role ID
   * @param currentUser - The current user
   * @returns The role
   */
  async findById(
    id: string,
    currentUser: CurrentUser,
  ): Promise<RoleResponseDto> {
    const role = await this.roleRepo.findWithPermissionsById(id);
    if (!role) throw new NotFoundException(`Role with ID ${id} not found`);

    // Verify if the user has access to the role
    this.verifyRoleAdminAccess(currentUser, role.isAdmin);

    return parseRoleModel(role);
  }

  /**
   * Update a role
   *
   * @param id - The role ID
   * @param updateRoleDto - The role data to update
   * @param currentUser - The current user
   * @returns The updated role
   */
  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
    currentUser: CurrentUser,
  ): Promise<RoleResponseDto> {
    // Get current role for validation
    const currentRole = await this.roleRepo.findById(id);
    if (!currentRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Verify user can manage this role
    if (!this.hierarchyHelper.canManageRole(currentUser.role, currentRole)) {
      throw new ForbiddenException(
        'You are not authorized to update this role',
      );
    }

    // Security checks
    this.verifyRoleAdminAccess(currentUser, updateRoleDto.isAdmin);
    await this.verifyPermissionAccess(
      currentUser,
      updateRoleDto.permissions || [],
    );

    const updatedRole = await this.roleRepo.update(id, updateRoleDto);
    if (!updatedRole)
      throw new NotFoundException(`Role with ID ${id} not found`);

    // Trigger hierarchy hooks for non-movement updates
    if (Object.keys(updateRoleDto).length > 0) {
      await this.hierarchyHooks.onRoleUpdated(
        currentUser,
        updatedRole,
        currentRole,
      );
    }

    return parseRoleModel(updatedRole);
  }

  // async remove(id: string, currentUser: CurrentUser): Promise<void> {
  //   const role = await this.roleModel.findById(id).exec();
  //   if (!role) {
  //     throw new NotFoundException(`Role with ID ${id} not found`);
  //   }

  //   // Security checks
  //   this.verifyRoleAdminAccess(currentUser, role.isAdmin);

  //   const deletedRole = await this.roleModel.findByIdAndDelete(id).exec();
  //   if (!deletedRole) {
  //     throw new NotFoundException(`Role with ID ${id} not found`);
  //   }
  // }

  /**
   * Move a role in the hierarchy
   *
   * @param moveRoleDto - The move role data
   * @param currentUser - The current user
   */
  async moveRole(
    moveRoleDto: MoveRoleDto,
    currentUser: CurrentUser,
  ): Promise<void> {
    const { roleId, newParentId } = moveRoleDto;

    // Get the role being moved
    const roleToMove = await this.roleRepo.findById(roleId);
    if (!roleToMove) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Verify user can manage this role
    if (!this.hierarchyHelper.canManageRole(currentUser.role, roleToMove)) {
      throw new ForbiddenException('You are not authorized to move this role');
    }

    // Verify parent role access if specified
    if (newParentId) {
      await this.verifyParentRoleAccess(currentUser, newParentId);
    }

    // Validate no cycle would be created
    await this.hierarchyHelper.validateNoCycle(roleId, newParentId);

    // Start transaction
    const session = await this.roleRepo.startTransaction();

    try {
      // Compute new path for the role
      const { ancestors: newAncestors, depth: newDepth } =
        await this.hierarchyHelper.computePath(newParentId);

      // Update the role itself
      await this.roleRepo.updateManyInTransaction(
        [
          {
            filter: { _id: roleId },
            update: { ancestors: newAncestors, depth: newDepth },
          },
        ],
        session,
      );

      // Update all descendants
      const descendants = await this.roleRepo.findDescendants(roleId);
      const descendantUpdates = descendants.map((descendant) => {
        // Remove old role path and add new one
        const oldAncestors = descendant.ancestors;
        const roleIndexInPath = oldAncestors.findIndex(
          (id) => id.toString() === roleId,
        );

        let updatedAncestors: any[];
        if (roleIndexInPath >= 0) {
          // Keep ancestors before the moved role, then add the new path including the moved role
          const ancestorsBeforeRole = oldAncestors.slice(0, roleIndexInPath);
          updatedAncestors = [...newAncestors, roleId, ...ancestorsBeforeRole];
        } else {
          // This shouldn't happen, but handle gracefully
          updatedAncestors = [...newAncestors, roleId];
        }

        return {
          filter: { _id: descendant._id },
          update: {
            ancestors: updatedAncestors,
            depth: updatedAncestors.length,
          },
        };
      });

      if (descendantUpdates.length > 0) {
        await this.roleRepo.updateManyInTransaction(descendantUpdates, session);
      }

      await session.commitTransaction();

      // Trigger hierarchy hooks after successful transaction
      const affectedDescendantIds = descendants.map((d) => d._id.toString());
      await this.hierarchyHooks.onRoleMoved(
        currentUser,
        roleId,
        roleToMove.ancestors.length > 0
          ? roleToMove.ancestors[roleToMove.ancestors.length - 1].toString()
          : undefined,
        newParentId,
        affectedDescendantIds,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get role hierarchy tree
   *
   * @param currentUser - The current user
   * @returns Role hierarchy tree
   */
  async getRoleHierarchy(currentUser: CurrentUser): Promise<RoleResponseDto[]> {
    // Get all roles
    const allRoles = await this.roleRepo.search(
      { page: 1, limit: 1000 }, // Get all roles (adjust limit as needed)
      currentUser,
    );

    // Filter roles user can see
    const visibleRoles = await this.hierarchyHelper.getVisibleRoles(
      currentUser.role,
      allRoles.roles,
    );

    // Return visible roles sorted by depth and name for hierarchy display
    const sortedRoles = visibleRoles.sort((a, b) => {
      if (a.depth !== b.depth) {
        return a.depth - b.depth; // Sort by depth first
      }
      return a.name.localeCompare(b.name); // Then by name
    });

    return sortedRoles.map((role) => parseRoleModel(role));
  }

  // Security checks

  /**
   * Verify if the user has admin access to the role
   *
   * @param currentUser - The current user
   * @param hasAdminFlag - Whether the role has admin flag
   */
  private verifyRoleAdminAccess(
    currentUser: CurrentUser,
    hasAdminFlag: boolean,
  ): void {
    if (!currentUser.role?.isAdmin && hasAdminFlag) {
      throw new ForbiddenException(
        'You are not authorized to access this role',
      );
    }
  }

  /**
   * Verify if the user has access to the permissions
   *
   * @param currentUser - The current user
   * @param permissionIds - The permission IDs
   */
  private async verifyPermissionAccess(
    currentUser: CurrentUser,
    permissionIds: string[],
  ): Promise<void> {
    if (currentUser.role?.isAdmin) {
      return;
    }

    const invalidPermissions =
      await this.permissionRepo.findInvalidPermissionsForUser(
        permissionIds,
        currentUser,
      );

    if (invalidPermissions.length > 0) {
      throw new ForbiddenException(
        `You are not authorized to assign the following admin-only permissions: ${invalidPermissions.map((permission) => permission.name).join(', ')}`,
      );
    }
  }

  /**
   * Verify if the user has access to the parent role
   *
   * @param currentUser - The current user
   * @param parentId - The parent role ID
   */
  private async verifyParentRoleAccess(
    currentUser: CurrentUser,
    parentId: string,
  ): Promise<void> {
    const parentRole = await this.roleRepo.findById(parentId);
    if (!parentRole) {
      throw new NotFoundException(`Parent role with ID ${parentId} not found`);
    }

    if (!this.hierarchyHelper.canManageRole(currentUser.role, parentRole)) {
      throw new ForbiddenException(
        'You are not authorized to create roles under this parent',
      );
    }
  }
}
