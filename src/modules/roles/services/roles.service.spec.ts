import { CurrentUser, Permission, Role } from '@idoeasy/common';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateRoleDto, RoleFilterDto, UpdateRoleDto } from '../dto';
import { PermissionRepo, RoleRepo } from '../repositories';
import { RoleHierarchyHooksService } from './role-hierarchy-hooks.service';
import { RoleHierarchyService } from './role-hierarchy.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let roleRepo: RoleRepo;
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

  const mockRole: Role = {
    _id: '507f1f77bcf86cd799439012' as any,
    name: 'Admin',
    description: 'Admin role',
    isActive: true,
    isDefault: false,
    isAdmin: true,
    permissions: [mockPermission._id] as any,
    ancestors: [],
    depth: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRoleWithPermissions = {
    ...mockRole,
    permissions: [mockPermission],
  };

  const mockAdminUser: CurrentUser = {
    user: {
      _id: '507f1f77bcf86cd799439013' as any,
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashedpassword',
      status: 'ACTIVE' as any,
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

  const mockNonAdminUser: CurrentUser = {
    user: {
      _id: '507f1f77bcf86cd799439015' as any,
      name: 'Regular User',
      email: 'user@example.com',
      password: 'hashedpassword',
      status: 'ACTIVE' as any,
      role: mockNonAdminRole._id as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    role: mockNonAdminRole,
  };

  const mockRoleRepo = {
    create: jest.fn(),
    search: jest.fn(),
    findById: jest.fn(),
    findWithPermissionsById: jest.fn(),
    update: jest.fn(),
  };

  const mockPermissionRepo = {
    findOnlyAdminByIds: jest.fn(),
    findInvalidPermissionsForUser: jest.fn(),
  };

  const mockHierarchyHelper = {
    getVisibleRoles: jest.fn().mockResolvedValue([]),
    canManageRole: jest.fn().mockReturnValue(true),
    computePath: jest.fn().mockResolvedValue({ ancestors: [], depth: 0 }),
    validateNoCycle: jest.fn().mockResolvedValue(undefined),
    buildRoleTree: jest.fn().mockReturnValue([]),
  };

  const mockHierarchyHooksService = {
    onRoleCreated: jest.fn(),
    onRoleUpdated: jest.fn(),
    onRoleMoved: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: RoleRepo,
          useValue: mockRoleRepo,
        },
        {
          provide: PermissionRepo,
          useValue: mockPermissionRepo,
        },
        {
          provide: RoleHierarchyService,
          useValue: mockHierarchyHelper,
        },
        {
          provide: RoleHierarchyHooksService,
          useValue: mockHierarchyHooksService,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    roleRepo = module.get<RoleRepo>(RoleRepo);
    permissionRepo = module.get<PermissionRepo>(PermissionRepo);

    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock returns
    mockPermissionRepo.findInvalidPermissionsForUser.mockResolvedValue([]);
    mockPermissionRepo.findOnlyAdminByIds.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new role successfully', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Test Role',
        description: 'Test role description',
        permissions: [mockPermission._id.toString()],
        isActive: true,
        isAdmin: false,
      };

      mockRoleRepo.create.mockResolvedValue(mockRole);

      const result = await service.create(createRoleDto, mockAdminUser);

      // Admin users bypass permission checks, so findOnlyAdminByIds shouldn't be called
      expect(roleRepo.create).toHaveBeenCalledWith({
        ...createRoleDto,
        ancestors: [],
        depth: 0,
      });
      expect(result).toMatchObject({
        id: mockRole._id.toString(),
        name: mockRole.name,
        description: mockRole.description,
      });
    });

    it('should throw ForbiddenException when non-admin tries to assign admin permissions', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Test Role',
        description: 'Test role description',
        permissions: [mockAdminPermission._id.toString()],
        isActive: true,
        isAdmin: false,
      };

      // Configure mock to return admin permissions for non-admin user
      mockPermissionRepo.findInvalidPermissionsForUser.mockResolvedValue([
        mockAdminPermission,
      ]);

      await expect(
        service.create(createRoleDto, mockNonAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to assign admin permissions', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Test Role',
        description: 'Test role description',
        permissions: [mockAdminPermission._id.toString()],
        isActive: true,
        isAdmin: false,
      };

      mockPermissionRepo.findOnlyAdminByIds.mockResolvedValue([
        mockAdminPermission,
      ]);
      mockRoleRepo.create.mockResolvedValue(mockRole);

      const result = await service.create(createRoleDto, mockAdminUser);

      expect(roleRepo.create).toHaveBeenCalledWith({
        ...createRoleDto,
        ancestors: [],
        depth: 0,
      });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return roles with pagination', async () => {
      const filterDto: RoleFilterDto = {
        page: 1,
        limit: 25,
      };

      const mockSearchResult = {
        roles: [mockRoleWithPermissions],
        total: 1,
      };

      mockRoleRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockAdminUser);

      expect(roleRepo.search).toHaveBeenCalledWith(
        filterDto,
        mockAdminUser,
        undefined,
      );
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0]).toMatchObject({
        id: mockRole._id.toString(),
        name: mockRole.name,
        description: mockRole.description,
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

    it('should return empty array when no roles found', async () => {
      const filterDto: RoleFilterDto = {
        page: 1,
        limit: 25,
      };

      const mockSearchResult = {
        roles: [],
        total: 0,
      };

      mockRoleRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockAdminUser);

      expect(result.roles).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should calculate pagination correctly', async () => {
      const filterDto: RoleFilterDto = {
        page: 2,
        limit: 10,
      };

      const mockSearchResult = {
        roles: [mockRoleWithPermissions],
        total: 25,
      };

      mockRoleRepo.search.mockResolvedValue(mockSearchResult);

      const result = await service.findAll(filterDto, mockAdminUser);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });
  });

  describe('findById', () => {
    it('should return a role by id', async () => {
      const roleId = mockRole._id.toString();

      mockRoleRepo.findWithPermissionsById.mockResolvedValue(
        mockRoleWithPermissions,
      );

      const result = await service.findById(roleId, mockAdminUser);

      expect(roleRepo.findWithPermissionsById).toHaveBeenCalledWith(roleId);
      expect(result).toMatchObject({
        id: mockRole._id.toString(),
        name: mockRole.name,
        description: mockRole.description,
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      const roleId = 'nonexistent-role-id';

      mockRoleRepo.findWithPermissionsById.mockResolvedValue(null);

      await expect(service.findById(roleId, mockAdminUser)).rejects.toThrow(
        `Role with ID ${roleId} not found`,
      );
    });

    it('should throw ForbiddenException when non-admin tries to access admin role', async () => {
      const roleId = mockRole._id.toString();

      mockRoleRepo.findWithPermissionsById.mockResolvedValue(
        mockRoleWithPermissions,
      );

      await expect(service.findById(roleId, mockNonAdminUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a role successfully', async () => {
      const roleId = mockRole._id.toString();
      const updateRoleDto: UpdateRoleDto = {
        name: 'Updated Role',
        description: 'Updated role description',
        permissions: [mockPermission._id.toString()],
      };

      const updatedRole = {
        ...mockRole,
        name: updateRoleDto.name,
        description: updateRoleDto.description,
      };

      mockRoleRepo.findById.mockResolvedValue(mockRole);

      mockPermissionRepo.findOnlyAdminByIds.mockResolvedValue([]);
      mockRoleRepo.update.mockResolvedValue(updatedRole);

      const result = await service.update(roleId, updateRoleDto, mockAdminUser);

      // Admin users bypass permission checks
      expect(roleRepo.update).toHaveBeenCalledWith(roleId, updateRoleDto);
      expect(result).toMatchObject({
        id: updatedRole._id.toString(),
        name: updateRoleDto.name,
        description: updateRoleDto.description,
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      const roleId = 'nonexistent-role-id';
      const updateRoleDto: UpdateRoleDto = {
        name: 'Updated Role',
      };

      mockPermissionRepo.findOnlyAdminByIds.mockResolvedValue([]);
      mockRoleRepo.update.mockResolvedValue(null);

      await expect(
        service.update(roleId, updateRoleDto, mockAdminUser),
      ).rejects.toThrow(`Role with ID ${roleId} not found`);
    });

    it('should throw ForbiddenException when non-admin tries to set admin flag', async () => {
      const roleId = mockRole._id.toString();
      const updateRoleDto: UpdateRoleDto = {
        name: 'Updated Role',
        isAdmin: true,
      };

      mockRoleRepo.findById.mockResolvedValue(mockRole);

      await expect(
        service.update(roleId, updateRoleDto, mockNonAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when non-admin tries to assign admin permissions', async () => {
      const roleId = mockRole._id.toString();
      const updateRoleDto: UpdateRoleDto = {
        name: 'Updated Role',
        permissions: [mockAdminPermission._id.toString()],
      };

      mockRoleRepo.findById.mockResolvedValue(mockRole);
      mockRoleRepo.update.mockResolvedValue(mockRole); // Need to return a role for update to succeed
      // Configure mock to return admin permissions for non-admin user
      mockPermissionRepo.findInvalidPermissionsForUser.mockResolvedValue([
        mockAdminPermission,
      ]);

      await expect(
        service.update(roleId, updateRoleDto, mockNonAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyRoleAdminAccess', () => {
    it('should allow admin to access admin roles', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Admin Role',
        description: 'Admin role',
        permissions: [],
        isActive: true,
        isAdmin: true,
      };

      mockPermissionRepo.findOnlyAdminByIds.mockResolvedValue([]);
      mockRoleRepo.create.mockResolvedValue(mockRole);

      // Should not throw
      await expect(
        service.create(createRoleDto, mockAdminUser),
      ).resolves.toBeDefined();
    });

    it('should allow non-admin to create non-admin roles', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'User Role',
        description: 'User role',
        permissions: [],
        isActive: true,
        isAdmin: false,
      };

      mockPermissionRepo.findOnlyAdminByIds.mockResolvedValue([]);
      mockRoleRepo.create.mockResolvedValue(mockNonAdminRole);

      const result = await service.create(createRoleDto, mockNonAdminUser);

      expect(result).toBeDefined();
    });
  });

  describe('verifyPermissionAccess', () => {
    it('should allow access to non-admin permissions for any user', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'User Role',
        description: 'User role',
        permissions: [mockPermission._id.toString()],
        isActive: true,
        isAdmin: false,
      };

      mockPermissionRepo.findOnlyAdminByIds.mockResolvedValue([]);
      mockRoleRepo.create.mockResolvedValue(mockRole);

      // Should not throw
      await expect(
        service.create(createRoleDto, mockNonAdminUser),
      ).resolves.toBeDefined();
    });

    it('should deny non-admin access to admin permissions', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Role with Admin Permission',
        description: 'Role with admin permission',
        permissions: [mockAdminPermission._id.toString()],
        isActive: true,
        isAdmin: false,
      };

      // Configure mock to return admin permissions for non-admin user
      mockPermissionRepo.findInvalidPermissionsForUser.mockResolvedValue([
        mockAdminPermission,
      ]);

      await expect(
        service.create(createRoleDto, mockNonAdminUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
