import { Permission, Role, User } from '@entech/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPreferencesDto,
  UserQueryDto,
} from '../dto';

@Injectable()
export class UserRepo {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /**
   * Create a user
   *
   * @param createUserDto - The user data to create
   * @returns The created user
   */
  async create(
    createUserDto: CreateUserDto,
    hashedPassword: string,
    role: Role,
  ): Promise<User> {
    return this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
      role: role._id,
    });
  }

  /**
   * Search for users
   *
   * @param queryDto - The query parameters
   * @returns The users and pagination information
   */
  async search(
    queryDto: UserQueryDto,
    allowedRoles: string[] = [],
  ): Promise<{ users: User[]; total: number }> {
    const {
      page = 1,
      limit = 25,
      search,
      status,
      roleId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;
    const skip = (page - 1) * limit;
    const query: any = {};

    // Apply role filtering based on hierarchy
    if (allowedRoles.length > 0) {
      // User can only see users with roles they can manage
      query.role = { $in: allowedRoles };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status !== undefined) {
      query.status = status;
    }

    if (roleId) {
      query.role = new Types.ObjectId(roleId);
    }

    const sortField = ['name', 'email', 'createdAt'].includes(sortBy)
      ? sortBy
      : 'createdAt';

    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .populate({
          path: 'role',
          select: 'name description isActive isDefault isAdmin',
        })
        .skip(skip)
        .limit(limit)
        .sort({ [sortField]: sortDirection })
        .lean()
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return {
      users,
      total,
    };
  }

  /**
   * Find a user by their ID
   *
   * @param id - The user ID
   * @returns The user
   */
  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  /**
   * Find a user by their email with their role and permissions
   *
   * @param email - The user email
   * @returns The user
   */
  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Find a user with their role and permissions
   *
   * @param id - The user ID
   * @returns The user
   */
  async findWithRoleAndPermissionsById(id: string) {
    return this.userModel
      .findById(id)
      .populate({
        path: 'role',
        model: Role.name,
        populate: {
          path: 'permissions',
          model: Permission.name,
        },
      })
      .lean()
      .exec();
  }

  /**
   * Update a user
   *
   * @param id - The user ID
   * @param updateUserDto - The user data to update
   * @returns The updated user
   */
  async update(
    id: string,
    updateDto: UpdateUserDto,
    role: Role,
  ): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(id, { ...updateDto, role: role._id }, { new: true })
      .lean()
      .exec();
  }

  /**
   * Update a user's password
   *
   * @param id - The user ID
   * @param password - The new password
   * @returns The updated user
   */
  async updatePassword(id: string, password: string): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(id, { password }, { new: true })
      .lean()
      .exec();
  }

  /**
   * Update a user's preferences
   *
   * @param id - The user ID
   * @param preferences - The preferences data to update
   * @returns The updated user
   */
  async updatePreferences(
    id: string,
    preferences: UpdateUserPreferencesDto,
  ): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: { metadata: preferences } }, { new: true })
      .populate({
        path: 'role',
        model: Role.name,
        populate: {
          path: 'permissions',
          model: Permission.name,
        },
      })
      .lean()
      .exec();
  }
}
