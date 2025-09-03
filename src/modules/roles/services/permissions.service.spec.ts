import { CurrentUser, Permission, PermissionDocument } from '@idoeasy/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { PermissionFilterDto } from '../dto';
import { PermissionRepo } from '../repositories';
import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionModel: Model<PermissionDocument>;
  let permissionRepo: PermissionRepo;

  const mockPermission: Permission = {
    _id: '507f1f77bcf86cd799439021' as any,
    name: 'users.create',
    description: 'Create users',
    module: 'users',
    action: 'create',
    isActive: true,
    isAdminOnly: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminPermission: Permission = {
    _id: '507f1f77bcf86cd799439022' as any,
    name: 'system.admin',
    description: 'System admin permission',
    module: 'system',
    action: 'admin',
    isActive: true,
    isAdminOnly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPermissionDocument = {
    ...mockPermission,
    toObject: jest.fn().mockReturnValue(mockPermission),
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
      permissions: [],
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
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    exec: jest.fn(),
  };

  const mockPermissionRepo = {
    search: jest.fn(),
    findOnlyAdminByIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getModelToken(Permission.name),
          useValue: mockPermissionModel,
        },
        {
          provide: PermissionRepo,
          useValue: mockPermissionRepo,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    permissionModel = module.get<Model<PermissionDocument>>(
      getModelToken(Permission.name),
    );
    permissionRepo = module.get<PermissionRepo>(PermissionRepo);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return permissions with pagination', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockSearchResult = {
        permissions: [mockPermission, mockAdminPermission],
        total: 2,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(permissionRepo.search).toHaveBeenCalledWith(
        filterDto,
        mockCurrentUser,
      );
      expect(result.permissions).toHaveLength(2);
      expect(result.permissions[0]).toMatchObject({
        id: mockPermission._id.toString(),
        name: mockPermission.name,
        description: mockPermission.description,
        module: mockPermission.module,
        action: mockPermission.action,
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should return empty array when no permissions found', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockSearchResult = {
        permissions: [],
        total: 0,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(result.permissions).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should calculate pagination correctly for multiple pages', async () => {
      const filterDto: PermissionFilterDto = {
        page: 2,
        limit: 5,
      };

      const mockSearchResult = {
        permissions: [mockPermission],
        total: 15,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should handle first page pagination correctly', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 5,
      };

      const mockSearchResult = {
        permissions: [mockPermission],
        total: 15,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(result.pagination).toEqual({
        page: 1,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should handle last page pagination correctly', async () => {
      const filterDto: PermissionFilterDto = {
        page: 3,
        limit: 5,
      };

      const mockSearchResult = {
        permissions: [mockPermission],
        total: 15,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(result.pagination).toEqual({
        page: 3,
        limit: 5,
        total: 15,
        totalPages: 3,
        hasNext: false,
        hasPrev: true,
      });
    });

    it('should apply search filter', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
        search: 'users',
      };

      const mockSearchResult = {
        permissions: [mockPermission],
        total: 1,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(permissionRepo.search).toHaveBeenCalledWith(
        filterDto,
        mockCurrentUser,
      );
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].name).toBe('users.create');
    });

    it('should apply module filter', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
        module: 'users',
      };

      const mockSearchResult = {
        permissions: [mockPermission],
        total: 1,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(permissionRepo.search).toHaveBeenCalledWith(
        filterDto,
        mockCurrentUser,
      );
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].module).toBe('users');
    });

    it('should apply action filter', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
        action: 'create',
      };

      const mockSearchResult = {
        permissions: [mockPermission],
        total: 1,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(permissionRepo.search).toHaveBeenCalledWith(
        filterDto,
        mockCurrentUser,
      );
      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].action).toBe('create');
    });

    it('should apply isActive filter', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
        isActive: true,
      };

      const mockSearchResult = {
        permissions: [mockPermission, mockAdminPermission],
        total: 2,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(permissionRepo.search).toHaveBeenCalledWith(
        filterDto,
        mockCurrentUser,
      );
      expect(result.permissions).toHaveLength(2);
      expect(result.permissions.every((p) => p.isActive)).toBe(true);
    });

    it('should apply sortBy and sortOrder filters', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      };

      const mockSearchResult = {
        permissions: [mockAdminPermission, mockPermission],
        total: 2,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(permissionRepo.search).toHaveBeenCalledWith(
        filterDto,
        mockCurrentUser,
      );
      expect(result.permissions).toHaveLength(2);
    });
  });

  describe('transformToPermissionResponse', () => {
    it('should transform permission document with toObject method', () => {
      const result = (service as any).transformToPermissionResponse(
        mockPermissionDocument,
      );

      expect(mockPermissionDocument.toObject).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: mockPermission._id.toString(),
        name: mockPermission.name,
        description: mockPermission.description,
        module: mockPermission.module,
        action: mockPermission.action,
        isActive: mockPermission.isActive,
        isAdminOnly: mockPermission.isAdminOnly,
      });
    });

    it('should transform plain permission object without toObject method', () => {
      const result = (service as any).transformToPermissionResponse(
        mockPermission,
      );

      expect(result).toMatchObject({
        id: mockPermission._id.toString(),
        name: mockPermission.name,
        description: mockPermission.description,
        module: mockPermission.module,
        action: mockPermission.action,
        isActive: mockPermission.isActive,
        isAdminOnly: mockPermission.isAdminOnly,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle zero total correctly', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockSearchResult = {
        permissions: [],
        total: 0,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should handle exact page division', async () => {
      const filterDto: PermissionFilterDto = {
        page: 2,
        limit: 5,
      };

      const mockSearchResult = {
        permissions: [mockPermission],
        total: 10,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle large datasets', async () => {
      const filterDto: PermissionFilterDto = {
        page: 50,
        limit: 100,
      };

      const mockSearchResult = {
        permissions: [mockPermission],
        total: 10000,
      };

      mockPermissionRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(result.pagination.totalPages).toBe(100);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });

  describe('hierarchy filtering', () => {
    it('should filter out admin-only permissions for non-admin users', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
      };

      mockPermissionRepo.search.mockResolvedValue({
        permissions: [mockPermission], // Non-admin permission
        total: 1,
      });

      const result = await service.findAll(filterDto, mockCurrentUser);

      expect(permissionRepo.search).toHaveBeenCalledWith(
        filterDto,
        mockCurrentUser,
      );
      expect(result.permissions).toHaveLength(1);
    });

    it('should allow admin users to see all permissions including admin-only', async () => {
      const filterDto: PermissionFilterDto = {
        page: 1,
        limit: 10,
      };

      const adminOnlyPermission = {
        ...mockPermission,
        _id: 'admin-permission-id',
        name: 'admin.manage',
        isAdminOnly: true,
      };

      mockPermissionRepo.search.mockResolvedValue({
        permissions: [mockPermission, adminOnlyPermission],
        total: 2,
      });

      const result = await service.findAll(filterDto, mockAdminUser);

      expect(permissionRepo.search).toHaveBeenCalledWith(
        filterDto,
        mockAdminUser,
      );
      expect(result.permissions).toHaveLength(2);
    });
  });
});
