import { CurrentUser, PaginationInfo, Role, User } from '@idoeasy/common';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { RoleHierarchyService, RoleRepo } from '../../roles';
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPreferencesDto,
  UserQueryDto,
  UserResponseDto,
} from '../dto';
import { parseUserModel } from '../helpers';
import { UserRepo } from '../repositories/user.repo';
import { UserHooksService } from './user-hooks.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly roleRepo: RoleRepo,
    private readonly hierarchyHelper: RoleHierarchyService,
    private readonly userHooks: UserHooksService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    currentUser: CurrentUser,
  ): Promise<UserResponseDto> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const role = await this.performRoleSelection(createUserDto, currentUser);
    const createdUser = await this.userRepo.create(
      createUserDto,
      hashedPassword,
      role,
    );

    // Trigger user creation hooks
    await this.userHooks.onUserCreated(currentUser, createdUser);

    return parseUserModel(createdUser);
  }

  /**
   * Find all users with their role and permissions
   *
   * @param queryDto - The query parameters
   * @param currentUser - The current user
   * @returns The users and pagination information
   */
  async findAll(
    queryDto: UserQueryDto,
    currentUser: CurrentUser,
  ): Promise<{ users: UserResponseDto[]; pagination: PaginationInfo }> {
    let allowedRoles: string[] = [];

    if (currentUser.role?.isAdmin) {
      // Admin users can see all users - no filtering needed
      allowedRoles = [];
    } else {
      // Filter roles the current user can manage (based on hierarchy)
      const manageableRoles = await this.hierarchyHelper.getVisibleRoles(
        currentUser.role,
      );
      // Convert to ObjectId strings for query
      allowedRoles = manageableRoles.map((role) => role._id);
    }

    // Search for users
    const { users, total } = await this.userRepo.search(queryDto, allowedRoles);

    // Get pagination information
    const { page, limit } = queryDto;
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
      users: users.map((user) => parseUserModel(user)),
      pagination,
    };
  }

  /**
   * Find a user by their ID with their role and permissions
   *
   * @param id - The user ID
   * @returns The user
   */
  async findById(id: string): Promise<UserResponseDto> {
    // Find the user with their role and permissions
    const user = await this.userRepo.findWithRoleAndPermissionsById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // Parse the user
    return parseUserModel(user);
  }

  /**
   * Update a user
   *
   * @param id - The user ID
   * @param updateDto - The user data to update
   * @param currentUser - The current user
   * @returns The updated user
   */
  async update(
    id: string,
    updateDto: UpdateUserDto,
    currentUser: CurrentUser,
  ): Promise<UserResponseDto> {
    // Find the user with their role and permissions
    const user = await this.userRepo.findWithRoleAndPermissionsById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // Store old values for audit
    const oldValues = {
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.roleId.toString(),
    };

    // Perform role selection and update the user
    const role = await this.performRoleSelection(updateDto, currentUser, user);
    const updatedUser = await this.userRepo.update(id, updateDto, role);

    // Store new values for audit
    const newValues = {
      name: updatedUser.name ?? user.name,
      email: updatedUser.email ?? user.email,
      status: updatedUser.status ?? user.status,
      role: updatedUser.roleId?.toString() ?? user.roleId.toString(),
    };

    // Trigger user update hooks
    await this.userHooks.onUserUpdated(currentUser, id, oldValues, newValues);

    // Check for specific changes that need additional hooks
    if (oldValues.role.toString() !== newValues.role.toString()) {
      await this.userHooks.onRoleAssigned(
        currentUser,
        id,
        oldValues.role.toString(),
        newValues.role.toString(),
      );
    }

    // Parse the updated user
    return parseUserModel(updatedUser);
  }

  /**
   * Find a user by their email with their password
   *
   * @param email - The user email
   * @returns The user
   */
  async findByEmailWithPassword(email: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findByEmail(email);
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);

    return parseUserModel(user);
  }

  /**
   * Change a user's password
   *
   * @param userId - The user ID
   * @param changePasswordDto - The change password data
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    currentUser: CurrentUser,
  ): Promise<void> {
    // Validate password confirmation
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation do not match',
      );
    }
    // Get user with password for validation
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Validate current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }
    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );
    await this.userRepo.updatePassword(userId, hashedNewPassword);

    // Trigger password change hooks
    await this.userHooks.onPasswordChanged(currentUser, userId);
  }

  /**
   * Update user preferences (locale and timezone)
   *
   * @param userId - The user ID
   * @param preferencesDto - The preferences data to update
   * @param currentUser - The current user
   * @returns The updated user
   */
  async updatePreferences(
    userId: string,
    preferencesDto: UpdateUserPreferencesDto,
    currentUser: CurrentUser,
  ): Promise<UserResponseDto> {
    // Get the user
    const user = await this.userRepo.findWithRoleAndPermissionsById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Store old preferences for audit
    const oldPreferences = user.metadata || {};

    // Update user preferences
    const updatedUser = await this.userRepo.updatePreferences(
      userId,
      preferencesDto,
    );

    // Store new preferences for audit
    const newPreferences = updatedUser.metadata || {};

    // Trigger user preferences update hooks
    await this.userHooks.onUserPreferencesUpdated(
      currentUser,
      userId,
      oldPreferences,
      newPreferences,
    );

    // Parse the updated user
    return parseUserModel(updatedUser);
  }

  /**
   * Perform the role selection for the user
   *
   * @param upsertDto - The upsert data
   * @param currentUser - The current user
   * @param userToBeUpdated - The user to update
   * @returns The role ID
   */
  private async performRoleSelection(
    upsertDto: CreateUserDto | UpdateUserDto,
    currentUser: CurrentUser,
    userToBeUpdated?: User,
  ): Promise<Role> {
    const role = await this.resolveTargetRole(upsertDto.roleId);
    this.assertRoleActionAllowed(role, currentUser, userToBeUpdated);
    return role;
  }

  /**
   * Resolve the target role
   *
   * @param roleId - The role ID
   * @returns The role
   */
  private async resolveTargetRole(
    roleId?: string | Types.ObjectId,
  ): Promise<Role> {
    const role = roleId
      ? await this.roleRepo.findById(roleId.toString())
      : await this.roleRepo.findDefault();

    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  /**
   * Check if the current user can perform the role action
   *
   * @param targetRole - The role
   * @param currentUser - The current user
   * @param userToBeUpdated - The user to update
   */
  private async assertRoleActionAllowed(
    targetRole: Role,
    currentUser: CurrentUser,
    userToBeUpdated?: User,
  ) {
    const currentRole = currentUser.role;
    if (currentRole?.isAdmin) return;

    const targetUserRole = await this.roleRepo.findById(
      targetRole._id.toString(),
    );

    if (targetUserRole?.isAdmin) {
      throw new ForbiddenException(
        'You are not authorized to update this user (admin users can only be updated by admins).',
      );
    }

    if (currentUser.user._id === userToBeUpdated?._id) {
      throw new ForbiddenException(
        'You are not authorized to update your own role.',
      );
    }
  }
}
