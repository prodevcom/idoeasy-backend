import { CurrentUser, Permission, PermissionDocument } from '@idoeasy/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PermissionFilterDto } from '../dto/permission-filter.dto';

@Injectable()
export class PermissionRepo {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  /**
   * Search for permissions
   *
   * @param filterDto - The filter parameters
   * @returns The permissions and total count
   */
  async search(
    filterDto: PermissionFilterDto,
    currentUser: CurrentUser,
  ): Promise<{
    permissions: Permission[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      module,
      action,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (module) {
      query.module = { $regex: module, $options: 'i' };
    }

    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    // Apply hierarchy-based filtering for permissions
    if (!currentUser.role?.isAdmin) {
      // Non-admin users can only see non-admin permissions
      query.isAdminOnly = false;

      // Additionally, users can only see permissions they actually have
      // This prevents users from assigning permissions they don't possess
      if (
        currentUser.role?.permissions &&
        currentUser.role.permissions.length > 0
      ) {
        query._id = { $in: currentUser.role.permissions };
      } else {
        // If user has no permissions, they can't see any permissions
        query._id = { $in: [] };
      }
    }
    // Admin users can see all permissions (no additional filter needed)
    const [permissions, total] = await Promise.all([
      this.permissionModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .exec(),
      this.permissionModel.countDocuments(query).exec(),
    ]);

    return {
      permissions,
      total,
    };
  }

  /**
   * Find only admin permissions by their IDs
   *
   * @param permissionIds - The permission IDs
   * @returns The permissions
   */
  async findOnlyAdminByIds(permissionIds: string[]) {
    return this.permissionModel
      .find({ _id: { $in: permissionIds }, isAdminOnly: true })
      .exec();
  }

  /**
   * Validate if permissions can be assigned by the current user
   *
   * @param permissionIds - The permission IDs to validate
   * @param currentUser - The current user
   * @returns Array of invalid permission IDs
   */
  async findInvalidPermissionsForUser(
    permissionIds: string[],
    currentUser: CurrentUser,
  ): Promise<Permission[]> {
    if (!permissionIds.length) {
      return [];
    }

    // Admin users can assign any permission
    if (currentUser.role?.isAdmin) {
      return [];
    }

    const userPermissionIds =
      currentUser.role?.permissions?.map((id) => id.toString()) || [];

    const unauthorizedPermissions = permissionIds.filter(
      (permissionId) => !userPermissionIds.includes(permissionId),
    );

    if (!unauthorizedPermissions.length) {
      return [];
    }

    return this.permissionModel
      .find({ _id: { $in: unauthorizedPermissions } })
      .exec();
  }
}
