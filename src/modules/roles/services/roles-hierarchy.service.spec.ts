import { CurrentUser, Role } from '@idoeasy/common';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateRoleDto, MoveRoleDto } from '../dto';
import { PermissionRepo } from '../repositories/permission.repo';
import { RoleRepo } from '../repositories/role.repo';
import { RoleHierarchyHooksService } from './role-hierarchy-hooks.service';
import { RoleHierarchyService } from './role-hierarchy.service';
import { RolesService } from './roles.service';

describe('RolesService - Hierarchy Features', () => {
  let service: RolesService;
  let roleRepo: jest.Mocked<RoleRepo>;
  let permissionRepo: jest.Mocked<PermissionRepo>;
  let hierarchyHelper: jest.Mocked<RoleHierarchyService>;
  let hierarchyHooks: jest.Mocked<RoleHierarchyHooksService>;

  const mockCurrentUser: CurrentUser = {
    user: {
      _id: 'user123' as any,
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashedpassword',
      status: 'ACTIVE' as any,
      role: '507f1f77bcf86cd799439011' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    role: {
      _id: '507f1f77bcf86cd799439011',
      name: 'Admin',
      description: 'Administrator',
      permissions: [],
      isActive: true,
      isDefault: false,
      isAdmin: true,
      ancestors: [],
      depth: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockRole = (
    id: string,
    ancestors: string[] = [],
    depth: number = 0,
    isAdmin: boolean = false,
  ): Role => ({
    _id: id,
    name: `Role ${id}`,
    description: `Description for role ${id}`,
    permissions: [],
    isActive: true,
    isDefault: false,
    isAdmin,
    ancestors: ancestors as any,
    depth,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const mockRoleRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findDescendants: jest.fn(),
      startTransaction: jest.fn(),
      updateManyInTransaction: jest.fn(),
      search: jest.fn(),
    };

    const mockPermissionRepo = {
      findOnlyAdminByIds: jest.fn().mockResolvedValue([]),
    };

    const mockHierarchyHelper = {
      computePath: jest.fn(),
      validateNoCycle: jest.fn(),
      canManageRole: jest.fn(),
      buildRoleTree: jest.fn(),
      getVisibleRoles: jest.fn(),
    };

    const mockHierarchyHooks = {
      onRoleCreated: jest.fn(),
      onRoleMoved: jest.fn(),
      onRoleUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: RoleRepo, useValue: mockRoleRepo },
        { provide: PermissionRepo, useValue: mockPermissionRepo },
        { provide: RoleHierarchyService, useValue: mockHierarchyHelper },
        { provide: RoleHierarchyHooksService, useValue: mockHierarchyHooks },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    roleRepo = module.get(RoleRepo);
    permissionRepo = module.get(PermissionRepo);
    hierarchyHelper = module.get(RoleHierarchyService);
    hierarchyHooks = module.get(RoleHierarchyHooksService);
  });

  describe('create with hierarchy', () => {
    it('should create root role when no parentId provided', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Root Role',
        description: 'A root role',
        permissions: [],
        isActive: true,
        isAdmin: false,
      };

      const expectedPath = { ancestors: [], depth: 0 };
      hierarchyHelper.computePath.mockResolvedValue(expectedPath);

      const createdRole = mockRole('newrole');
      roleRepo.create.mockResolvedValue(createdRole);

      await service.create(createRoleDto, mockCurrentUser);

      expect(hierarchyHelper.computePath).toHaveBeenCalledWith(undefined);
      expect(roleRepo.create).toHaveBeenCalledWith({
        ...createRoleDto,
        ancestors: [],
        depth: 0,
      });
      expect(hierarchyHooks.onRoleCreated).toHaveBeenCalledWith(
        mockCurrentUser,
        createdRole,
        undefined,
      );
    });

    it('should create child role with parentId', async () => {
      const parentId = '507f1f77bcf86cd799439011';
      const createRoleDto: CreateRoleDto = {
        name: 'Child Role',
        description: 'A child role',
        permissions: [],
        isActive: true,
        isAdmin: false,
        parentId,
      };

      const parentRole = mockRole(parentId);
      roleRepo.findById.mockResolvedValue(parentRole as any);
      hierarchyHelper.canManageRole.mockReturnValue(true);

      const expectedPath = {
        ancestors: [parentId] as any,
        depth: 1,
      };
      hierarchyHelper.computePath.mockResolvedValue(expectedPath);

      const createdRole = mockRole('newrole', [parentId], 1);
      roleRepo.create.mockResolvedValue(createdRole);

      await service.create(createRoleDto, mockCurrentUser);

      expect(hierarchyHelper.computePath).toHaveBeenCalledWith(parentId);
      expect(roleRepo.create).toHaveBeenCalledWith({
        name: 'Child Role',
        description: 'A child role',
        permissions: [],
        isActive: true,
        isAdmin: false,
        ancestors: expectedPath.ancestors,
        depth: expectedPath.depth,
      });
      expect(hierarchyHooks.onRoleCreated).toHaveBeenCalledWith(
        mockCurrentUser,
        createdRole,
        parentId,
      );
    });

    it('should throw error if parent role not found', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'Child Role',
        description: 'A child role',
        permissions: [],
        isActive: true,
        isAdmin: false,
        parentId: 'nonexistent',
      };

      roleRepo.findById.mockResolvedValue(null);

      await expect(
        service.create(createRoleDto, mockCurrentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if user cannot manage parent role', async () => {
      const parentId = '507f1f77bcf86cd799439011';
      const createRoleDto: CreateRoleDto = {
        name: 'Child Role',
        description: 'A child role',
        permissions: [],
        isActive: true,
        isAdmin: false,
        parentId,
      };

      const parentRole = mockRole(parentId);
      roleRepo.findById.mockResolvedValue(parentRole as any);
      hierarchyHelper.canManageRole.mockReturnValue(false);

      await expect(
        service.create(createRoleDto, mockCurrentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('moveRole', () => {
    it('should move role to new parent', async () => {
      const roleId = '507f1f77bcf86cd799439011';
      const newParentId = '507f1f77bcf86cd799439012';
      const moveRoleDto: MoveRoleDto = { roleId, newParentId };

      const roleToMove = mockRole(roleId);
      const newParent = mockRole(newParentId);
      const descendants = [mockRole('child', [roleId], 1)];

      roleRepo.findById.mockImplementation((id) => {
        if (id === roleId) return Promise.resolve(roleToMove);
        if (id === newParentId) return Promise.resolve(newParent);
        return Promise.resolve(null);
      });

      hierarchyHelper.canManageRole.mockReturnValue(true);
      hierarchyHelper.validateNoCycle.mockResolvedValue();
      hierarchyHelper.computePath.mockResolvedValue({
        ancestors: [newParentId] as any,
        depth: 1,
      });

      roleRepo.findDescendants.mockResolvedValue(descendants);

      const mockSession = {
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      roleRepo.startTransaction.mockResolvedValue(mockSession as any);
      roleRepo.updateManyInTransaction.mockResolvedValue();

      await service.moveRole(moveRoleDto, mockCurrentUser);

      expect(hierarchyHelper.validateNoCycle).toHaveBeenCalledWith(
        roleId,
        newParentId,
      );
      expect(roleRepo.updateManyInTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(hierarchyHooks.onRoleMoved).toHaveBeenCalled();
    });

    it('should throw error if role to move not found', async () => {
      const moveRoleDto: MoveRoleDto = {
        roleId: 'nonexistent',
        newParentId: '507f1f77bcf86cd799439012',
      };

      roleRepo.findById.mockResolvedValue(null);

      await expect(
        service.moveRole(moveRoleDto, mockCurrentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if user cannot manage role', async () => {
      const roleId = '507f1f77bcf86cd799439011';
      const moveRoleDto: MoveRoleDto = {
        roleId,
        newParentId: '507f1f77bcf86cd799439012',
      };

      const roleToMove = mockRole(roleId);
      roleRepo.findById.mockResolvedValue(roleToMove as any);
      hierarchyHelper.canManageRole.mockReturnValue(false);

      await expect(
        service.moveRole(moveRoleDto, mockCurrentUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle transaction rollback on error', async () => {
      const roleId = '507f1f77bcf86cd799439011';
      const moveRoleDto: MoveRoleDto = { roleId };

      const roleToMove = mockRole(roleId);
      roleRepo.findById.mockResolvedValue(roleToMove as any);
      hierarchyHelper.canManageRole.mockReturnValue(true);
      hierarchyHelper.validateNoCycle.mockResolvedValue();
      hierarchyHelper.computePath.mockResolvedValue({
        ancestors: [],
        depth: 0,
      });
      roleRepo.findDescendants.mockResolvedValue([]);

      const mockSession = {
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      roleRepo.startTransaction.mockResolvedValue(mockSession as any);
      roleRepo.updateManyInTransaction.mockRejectedValue(new Error('DB Error'));

      await expect(
        service.moveRole(moveRoleDto, mockCurrentUser),
      ).rejects.toThrow('DB Error');
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe('getRoleHierarchy', () => {
    it('should return role hierarchy tree', async () => {
      const roles = [mockRole('root'), mockRole('child', ['root'], 1)];

      roleRepo.search.mockResolvedValue({ roles, total: 2 });
      hierarchyHelper.getVisibleRoles.mockResolvedValue(roles);

      const result = await service.getRoleHierarchy(mockCurrentUser);

      expect(hierarchyHelper.getVisibleRoles).toHaveBeenCalledWith(
        mockCurrentUser.role,
        roles,
      );
      expect(result).toHaveLength(2);
    });
  });
});
