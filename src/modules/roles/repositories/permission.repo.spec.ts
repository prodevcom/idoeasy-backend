import { CurrentUser, Permission, PermissionDocument } from '@entech/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { PermissionFilterDto } from '../dto/permission-filter.dto';
import { PermissionRepo } from './permission.repo';

describe('PermissionRepo', () => {
  let repo: PermissionRepo;
  let permissionModel: Model<PermissionDocument>;

  const mockPermission: Permission = {
    _id: 'permission-id',
    name: 'users.create',
    description: 'Create user permission',
    module: 'users',
    action: 'create',
    isActive: true,
    isAdminOnly: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminPermission: Permission = {
    _id: 'admin-permission-id',
    name: 'admin.manage',
    description: 'Admin management permission',
    module: 'admin',
    action: 'manage',
    isActive: true,
    isAdminOnly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCurrentUser: CurrentUser = {
    user: {
      _id: 'user123' as any,
      name: 'Test User',
      email: 'user@example.com',
      password: 'hashedpassword',
      status: 'ACTIVE' as any,
      role: 'role123' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    role: {
      _id: 'role123',
      name: 'Test Role',
      description: 'Test role',
      isActive: true,
      isDefault: false,
      isAdmin: false,
      permissions: ['permission-id'] as any, // User has the basic permission
      ancestors: [],
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockAdminUser: CurrentUser = {
    user: {
      _id: 'admin123' as any,
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashedpassword',
      status: 'ACTIVE' as any,
      role: 'adminrole123' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    role: {
      _id: 'adminrole123',
      name: 'Admin Role',
      description: 'Admin role',
      isActive: true,
      isDefault: false,
      isAdmin: true,
      permissions: [],
      ancestors: [],
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockPermissionModel = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionRepo,
        {
          provide: getModelToken(Permission.name),
          useValue: mockPermissionModel,
        },
      ],
    }).compile();

    repo = module.get<PermissionRepo>(PermissionRepo);
    permissionModel = module.get<Model<PermissionDocument>>(
      getModelToken(Permission.name),
    );

    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should filter admin-only permissions for non-admin users', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockQueryResult = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockPermission]),
      };

      mockPermissionModel.find.mockReturnValue(mockQueryResult);
      mockPermissionModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      await repo.search(filterDto, mockCurrentUser);

      expect(mockPermissionModel.find).toHaveBeenCalledWith({
        isAdminOnly: false, // Should filter out admin-only permissions
        _id: { $in: ['permission-id'] }, // Should only show permissions user has
      });
    });

    it('should not filter permissions for admin users', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockQueryResult = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue([mockPermission, mockAdminPermission]),
      };

      mockPermissionModel.find.mockReturnValue(mockQueryResult);
      mockPermissionModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });

      await repo.search(filterDto, mockAdminUser);

      expect(mockPermissionModel.find).toHaveBeenCalledWith({
        // Should not have isAdminOnly filter for admin users
      });
    });

    it('should return empty result when user has no permissions', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
      };

      const userWithNoPermissions: CurrentUser = {
        ...mockCurrentUser,
        role: {
          ...mockCurrentUser.role,
          permissions: [],
        },
      };

      const mockQueryResult = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockPermissionModel.find.mockReturnValue(mockQueryResult);
      mockPermissionModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await repo.search(filterDto, userWithNoPermissions);

      expect(mockPermissionModel.find).toHaveBeenCalledWith({
        isAdminOnly: false,
        _id: { $in: [] }, // Empty array means no permissions visible
      });
    });
  });

  describe('findInvalidPermissionsForUser', () => {
    it('should return permissions that user does not have', async () => {
      const permissionIds = ['permission-id', 'unauthorized-permission'];

      mockPermissionModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            _id: 'unauthorized-permission',
            name: 'unauthorized.action',
            description: 'Unauthorized permission',
            module: 'unauthorized',
            action: 'action',
            isActive: true,
            isAdminOnly: false,
          },
        ]),
      });

      const result = await repo.findInvalidPermissionsForUser(
        permissionIds,
        mockCurrentUser,
      );

      expect(mockPermissionModel.find).toHaveBeenCalledWith({
        _id: { $in: ['unauthorized-permission'] }, // Only the unauthorized one
      });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('unauthorized-permission');
    });

    it('should return empty array for admin users', async () => {
      const permissionIds = ['permission1', 'admin-permission'];

      const result = await repo.findInvalidPermissionsForUser(
        permissionIds,
        mockAdminUser,
      );

      expect(mockPermissionModel.find).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array when no permission IDs provided', async () => {
      const result = await repo.findInvalidPermissionsForUser(
        [],
        mockCurrentUser,
      );

      expect(mockPermissionModel.find).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle user with no permissions', async () => {
      const userWithNoPermissions: CurrentUser = {
        ...mockCurrentUser,
        role: {
          ...mockCurrentUser.role,
          permissions: [],
        },
      };

      const permissionIds = ['some-permission'];

      mockPermissionModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockPermission]),
      });

      const result = await repo.findInvalidPermissionsForUser(
        permissionIds,
        userWithNoPermissions,
      );

      expect(mockPermissionModel.find).toHaveBeenCalledWith({
        _id: { $in: permissionIds }, // All permissions are unauthorized
      });
      expect(result).toHaveLength(1);
    });
  });
});
