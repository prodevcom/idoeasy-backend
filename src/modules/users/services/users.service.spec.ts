import { CurrentUser, Role, User, UserStatus } from '@idoeasy/common';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { RoleHierarchyService, RoleRepo } from '../../roles';
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from '../dto';
import { UserRepo } from '../repositories/user.repo';
import { UserHooksService } from './user-hooks.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: UserRepo;
  let roleRepo: RoleRepo;
  let hierarchyHelper: RoleHierarchyService;

  const mockRole: Role = {
    _id: '507f1f77bcf86cd799439012' as any,
    name: 'Admin',
    description: 'Admin role',
    isActive: true,
    isDefault: false,
    isAdmin: true,
    permissions: [],
    ancestors: [],
    depth: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    _id: '507f1f77bcf86cd799439011' as any,
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'hashedpassword123',
    status: UserStatus.ACTIVE,
    role: mockRole._id as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithRole = {
    ...mockUser,
    role: mockRole,
  };

  const mockCurrentUser: CurrentUser = {
    user: {
      _id: '507f1f77bcf86cd799439013' as any,
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashedpassword',
      status: UserStatus.ACTIVE,
      role: mockRole._id as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    role: mockRole,
  };

  const mockNonAdminRole: Role = {
    _id: '507f1f77bcf86cd799439014' as any,
    name: 'User',
    description: 'Regular user role',
    isActive: true,
    isDefault: true,
    isAdmin: false,
    permissions: [],
    ancestors: [],
    depth: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser: CurrentUser = {
    user: {
      _id: '507f1f77bcf86cd799439013' as any,
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashedpassword',
      status: UserStatus.ACTIVE,
      role: mockRole._id as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    role: mockRole,
  };

  const mockNonAdminUser: CurrentUser = {
    user: {
      _id: '507f1f77bcf86cd799439015' as any,
      name: 'Regular User',
      email: 'user@example.com',
      password: 'hashedpassword',
      status: UserStatus.ACTIVE,
      role: mockNonAdminRole._id as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    role: mockNonAdminRole,
  };

  const mockUserRepo = {
    create: jest.fn(),
    search: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findWithRoleAndPermissionsById: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockRoleRepo = {
    findById: jest.fn(),
    findDefault: jest.fn(),
    findAdminRoles: jest.fn(),
    search: jest.fn(),
  };

  const mockHierarchyHelper = {
    getVisibleRoles: jest.fn().mockResolvedValue([]),
    canManageRole: jest.fn(),
  };

  const mockUserHooks = {
    onUserCreated: jest.fn(),
    onUserUpdated: jest.fn(),
    onPasswordChanged: jest.fn(),
    onRoleAssigned: jest.fn(),
    onStatusChanged: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepo,
          useValue: mockUserRepo,
        },
        {
          provide: RoleRepo,
          useValue: mockRoleRepo,
        },
        {
          provide: RoleHierarchyService,
          useValue: mockHierarchyHelper,
        },
        {
          provide: UserHooksService,
          useValue: mockUserHooks,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get<UserRepo>(UserRepo);
    roleRepo = module.get<RoleRepo>(RoleRepo);
    hierarchyHelper = module.get<RoleHierarchyService>(RoleHierarchyService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123',
        role: undefined,
      };

      const hashedPassword = 'hashedpassword123';
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));

      mockRoleRepo.findDefault.mockResolvedValue(mockRole);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto, mockCurrentUser);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(roleRepo.findDefault).toHaveBeenCalled();
      expect(userRepo.create).toHaveBeenCalledWith(
        createUserDto,
        hashedPassword,
        mockRole,
      );
      expect(result).toMatchObject({
        id: mockUser._id.toString(),
        name: mockUser.name,
        email: mockUser.email,
        status: mockUser.status,
      });
    });

    it('should use provided role when specified', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123',
        role: mockRole._id.toString(),
      };

      const hashedPassword = 'hashedpassword123';
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));

      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto, mockCurrentUser);

      expect(roleRepo.findById).toHaveBeenCalledWith(mockRole._id.toString());
      expect(userRepo.create).toHaveBeenCalledWith(
        createUserDto,
        hashedPassword,
        mockRole,
      );
    });

    it('should throw NotFoundException when role not found', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123',
        role: 'nonexistent-role-id',
      };

      mockRoleRepo.findById.mockResolvedValue(null);
      mockRoleRepo.findDefault.mockResolvedValue(null);

      await expect(
        service.create(createUserDto, mockCurrentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow non-admin to assign non-admin role', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123',
        role: mockNonAdminRole._id.toString(),
      };

      const hashedPassword = 'hashedpassword123';
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));

      mockRoleRepo.findById.mockResolvedValue(mockNonAdminRole);
      mockUserRepo.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto, mockNonAdminUser);

      expect(roleRepo.findById).toHaveBeenCalledWith(
        mockNonAdminRole._id.toString(),
      );
      expect(userRepo.create).toHaveBeenCalledWith(
        createUserDto,
        hashedPassword,
        mockNonAdminRole,
      );
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return users with pagination for admin user', async () => {
      const queryDto: UserQueryDto = {
        page: 1,
        limit: 25,
      };

      const mockSearchResult = {
        users: [mockUserWithRole],
        total: 1,
      };

      mockUserRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(queryDto, mockCurrentUser);

      expect(userRepo.search).toHaveBeenCalledWith(queryDto, []);
      expect(result.users).toHaveLength(1);
      expect(result.users[0]).toMatchObject({
        id: mockUser._id.toString(),
        name: mockUser.name,
        email: mockUser.email,
        status: mockUser.status,
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 25,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should return empty array when no users found', async () => {
      const queryDto: UserQueryDto = {
        page: 1,
        limit: 25,
      };

      const mockSearchResult = {
        users: [],
        total: 0,
      };

      mockUserRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(queryDto, mockCurrentUser);

      expect(result.users).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should calculate pagination correctly', async () => {
      const queryDto: UserQueryDto = {
        page: 2,
        limit: 10,
      };

      const mockSearchResult = {
        users: [mockUserWithRole],
        total: 25,
      };

      mockUserRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(queryDto, mockCurrentUser);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should filter users based on role hierarchy for non-admin users', async () => {
      const queryDto: UserQueryDto = {
        page: 1,
        limit: 25,
      };

      const allRoles = [
        mockRole,
        {
          _id: '507f1f77bcf86cd799439020',
          name: 'Manager',
          description: 'Manager role',
          isActive: true,
          isDefault: false,
          isAdmin: false,
          permissions: [],
          ancestors: [],
          depth: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const manageableRoles = [allRoles[1]]; // Non-admin can only manage their own role level

      const mockSearchResult = {
        users: [mockUserWithRole],
        total: 1,
      };

      mockRoleRepo.search.mockResolvedValue({
        roles: allRoles,
        total: allRoles.length,
      });
      mockHierarchyHelper.getVisibleRoles.mockResolvedValue(manageableRoles);
      mockUserRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(queryDto, mockNonAdminUser);

      expect(hierarchyHelper.getVisibleRoles).toHaveBeenCalledWith(
        mockNonAdminUser.role,
      );
      expect(userRepo.search).toHaveBeenCalledWith(queryDto, [
        '507f1f77bcf86cd799439020',
      ]);
      expect(result.users).toHaveLength(1);
    });

    it('should not filter admin roles for admin users', async () => {
      const queryDto: UserQueryDto = {
        page: 1,
        limit: 25,
      };

      const mockSearchResult = {
        users: [mockUserWithRole],
        total: 1,
      };

      mockUserRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(queryDto, mockCurrentUser);

      expect(roleRepo.findAdminRoles).not.toHaveBeenCalled();
      expect(userRepo.search).toHaveBeenCalledWith(queryDto, []);
      expect(result.users).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const userId = mockUser._id.toString();

      mockUserRepo.findWithRoleAndPermissionsById.mockResolvedValue(
        mockUserWithRole,
      );

      const result = await service.findById(userId);

      expect(userRepo.findWithRoleAndPermissionsById).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toMatchObject({
        id: mockUser._id.toString(),
        name: mockUser.name,
        email: mockUser.email,
        status: mockUser.status,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'nonexistent-user-id';

      mockUserRepo.findWithRoleAndPermissionsById.mockResolvedValue(null);

      await expect(service.findById(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );
    });
  });

  describe('findByEmailWithPassword', () => {
    it('should return a user by email', async () => {
      const email = 'john.doe@example.com';

      mockUserRepo.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmailWithPassword(email);

      expect(userRepo.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toMatchObject({
        id: mockUser._id.toString(),
        name: mockUser.name,
        email: mockUser.email,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const email = 'nonexistent@example.com';

      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(service.findByEmailWithPassword(email)).rejects.toThrow(
        `User with email ${email} not found`,
      );
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const userId = mockUser._id.toString();
      const updateUserDto: UpdateUserDto = {
        name: 'John Updated',
        email: 'john.updated@example.com',
      };

      const updatedUser = {
        ...mockUser,
        name: updateUserDto.name,
        email: updateUserDto.email,
        role: mockRole,
      };

      mockUserRepo.findWithRoleAndPermissionsById.mockResolvedValue(
        mockUserWithRole,
      );
      mockRoleRepo.findDefault.mockResolvedValue(mockRole);
      mockUserRepo.update.mockResolvedValue(updatedUser);

      const result = await service.update(
        userId,
        updateUserDto,
        mockCurrentUser,
      );

      expect(userRepo.findWithRoleAndPermissionsById).toHaveBeenCalledWith(
        userId,
      );
      expect(userRepo.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        mockRole,
      );
      expect(result).toMatchObject({
        id: updatedUser._id.toString(),
        name: updateUserDto.name,
        email: updateUserDto.email,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'nonexistent-user-id';
      const updateUserDto: UpdateUserDto = {
        name: 'John Updated',
      };

      mockUserRepo.findWithRoleAndPermissionsById.mockResolvedValue(null);

      await expect(
        service.update(userId, updateUserDto, mockCurrentUser),
      ).rejects.toThrow(`User with ID ${userId} not found`);
    });

    it('should throw ForbiddenException when non-admin tries to update admin user', async () => {
      const userId = mockUser._id.toString();
      const updateUserDto: UpdateUserDto = {
        name: 'John Updated',
      };

      const mockAdminUser = {
        ...mockUserWithRole,
        role: mockRole,
      };

      mockUserRepo.findWithRoleAndPermissionsById.mockResolvedValue(
        mockAdminUser,
      );

      await expect(
        service.update(userId, updateUserDto, mockNonAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user tries to update their own role', async () => {
      const userId = mockNonAdminUser.user._id.toString();
      const updateUserDto: UpdateUserDto = {
        role: mockRole._id.toString(), // Try to change to admin role
      };

      // Create a user that matches the non-admin user ID
      const currentUserData = {
        ...mockUser,
        _id: mockNonAdminUser.user._id, // Same ID as current user to trigger self-update check
        role: mockNonAdminRole, // Non-admin role for the user being updated
      };

      mockUserRepo.findWithRoleAndPermissionsById.mockResolvedValue(
        currentUserData,
      );
      mockRoleRepo.findById.mockResolvedValue(mockRole);

      await expect(
        service.update(userId, updateUserDto, mockNonAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException when passwords do not match', async () => {
      const userId = mockUser._id.toString();
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword',
      };

      await expect(
        service.changePassword(userId, changePasswordDto, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'nonexistent-user-id';
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        service.changePassword(userId, changePasswordDto, mockAdminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should complete password validation when user exists and passwords match', async () => {
      const userId = mockUser._id.toString();
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      mockUserRepo.findById.mockResolvedValue(mockUser);

      // Mock bcrypt.compare to return true (passwords match)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      // Mock bcrypt.hash for the new password
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashedNewPassword' as never);

      // Should not throw any error
      await expect(
        service.changePassword(userId, changePasswordDto, mockAdminUser),
      ).resolves.toBeUndefined();

      expect(userRepo.findById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'oldpassword',
        mockUser.password,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(userRepo.updatePassword).toHaveBeenCalledWith(
        userId,
        'hashedNewPassword',
      );
    });
  });
});
