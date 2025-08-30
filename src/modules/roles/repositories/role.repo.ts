import { CurrentUser, Role } from '@entech/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { CreateRoleDto, RoleFilterDto, UpdateRoleDto } from '../dto';

@Injectable()
export class RoleRepo {
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {}

  /**
   * Create a role
   *
   * @param createRoleDto - The role data to create
   * @param session - Optional session for transactions
   * @returns The created role
   */
  async create(
    createRoleDto: CreateRoleDto,
    session?: ClientSession,
  ): Promise<Role> {
    return this.roleModel
      .create([createRoleDto], session ? { session } : {})
      .then((roles) => roles[0]);
  }

  /**
   * Search for roles
   *
   * @param filterDto - The filter parameters
   * @param currentUser - The current user
   * @returns The roles and total count
   */
  async search(
    filterDto: RoleFilterDto,
    currentUser: CurrentUser,
    allowedRoles?: string[],
  ): Promise<{
    roles: Role[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 25,
      search,
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

    // Apply hierarchy filtering or admin filtering
    if (allowedRoles && allowedRoles.length > 0) {
      // Use hierarchy-based filtering (allowed role IDs)
      query._id = { $in: allowedRoles.map((id) => new Types.ObjectId(id)) };
    } else if (!currentUser.role?.isAdmin) {
      // Fallback to old admin filtering
      query.isAdmin = false;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Prepare sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [roles, total] = await Promise.all([
      this.roleModel
        .find(query)
        .populate('permissions')
        .skip(skip)
        .limit(limit)
        .sort(sortObject)
        .lean()
        .exec(),
      this.roleModel.countDocuments(query).exec(),
    ]);

    return {
      roles,
      total,
    };
  }

  /**
   * Find one role
   *
   * @param id - The role ID
   * @returns The role
   */
  async findById(id: string) {
    return this.roleModel.findById(id).exec();
  }

  /**
   * Find a role with its permissions
   *
   * @param id - The role ID
   * @returns The role
   */
  async findWithPermissionsById(id: string) {
    return this.roleModel.findById(id).populate('permissions').lean().exec();
  }

  /**
   * Update a role
   *
   * @param id - The role ID
   * @param updateRoleDto - The role data to update
   * @returns The updated role
   */
  async update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.roleModel
      .findByIdAndUpdate(id, updateRoleDto, { new: true })
      .lean()
      .exec();
  }

  /**
   * Find the default role
   *
   * @returns The default role
   */
  async findDefault() {
    return this.roleModel.findOne({ isDefault: true }).lean().exec();
  }

  /**
   * Find all admin roles
   *
   * @returns The admin roles
   */
  async findAdminRoles() {
    return this.roleModel.find({ isAdmin: true }).lean().exec();
  }

  // Hierarchy-specific methods

  /**
   * Find all descendants of a role
   *
   * @param roleId - The parent role ID
   * @returns All descendant roles
   */
  async findDescendants(roleId: string): Promise<Role[]> {
    return this.roleModel
      .find({ ancestors: new Types.ObjectId(roleId) })
      .lean()
      .exec();
  }

  /**
   * Find all roles in a subtree (role + descendants)
   *
   * @param roleId - The root role ID of the subtree
   * @returns All roles in the subtree
   */
  async findSubtree(roleId: string): Promise<Role[]> {
    const objectId = new Types.ObjectId(roleId);
    return this.roleModel
      .find({
        $or: [{ _id: objectId }, { ancestors: objectId }],
      })
      .lean()
      .exec();
  }

  /**
   * Update many roles in a transaction
   *
   * @param updates - Array of role updates
   * @param session - Transaction session
   */
  async updateManyInTransaction(
    updates: Array<{ filter: any; update: any }>,
    session: ClientSession,
  ): Promise<void> {
    for (const { filter, update } of updates) {
      await this.roleModel.updateMany(filter, update, { session });
    }
  }

  /**
   * Find roles by IDs
   *
   * @param roleIds - Array of role IDs
   * @returns The roles
   */
  async findByIds(roleIds: string[]): Promise<Role[]> {
    return this.roleModel
      .find({ _id: { $in: roleIds.map((id) => new Types.ObjectId(id)) } })
      .lean()
      .exec();
  }

  /**
   * Check if a role exists
   *
   * @param roleId - The role ID
   * @returns True if role exists
   */
  async exists(roleId: string): Promise<boolean> {
    const count = await this.roleModel.countDocuments({
      _id: new Types.ObjectId(roleId),
    });
    return count > 0;
  }

  /**
   * Start a database transaction
   *
   * @returns A session for the transaction
   */
  async startTransaction(): Promise<ClientSession> {
    const session = await this.roleModel.db.startSession();
    session.startTransaction();
    return session;
  }

  /**
   * Bulk update roles for migration
   *
   * @param filter - Filter to match roles
   * @param update - Update to apply
   * @returns Update result
   */
  async bulkUpdate(filter: any, update: any) {
    return this.roleModel.updateMany(filter, update);
  }
}
