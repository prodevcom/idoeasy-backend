import { Role } from '@idoeasy/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleRepo } from '../repositories/role.repo';
import { RoleHierarchyService } from './role-hierarchy.service';

describe('RoleHierarchyHelper', () => {
  let service: RoleHierarchyService;
  let roleRepo: jest.Mocked<RoleRepo>;

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
      findById: jest.fn(),
      findDescendants: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleHierarchyService,
        {
          provide: RoleRepo,
          useValue: mockRoleRepo,
        },
      ],
    }).compile();

    service = module.get<RoleHierarchyService>(RoleHierarchyService);
    roleRepo = module.get(RoleRepo);
  });

  describe('computePath', () => {
    it('should return empty ancestors and depth 0 for root role', async () => {
      const result = await service.computePath();

      expect(result).toEqual({
        ancestors: [],
        depth: 0,
      });
    });

    it('should compute path for child role', async () => {
      const parentId = '507f1f77bcf86cd799439011';
      const grandparentId = '507f1f77bcf86cd799439012';

      const parentRole = mockRole(parentId, [grandparentId], 1);
      roleRepo.findById.mockResolvedValue(parentRole as any);

      const result = await service.computePath(parentId);

      expect(result.ancestors).toHaveLength(2);
      expect(result.ancestors[0].toString()).toBe(grandparentId);
      expect(result.ancestors[1].toString()).toBe(parentId);
      expect(result.depth).toBe(2);
    });

    it('should throw NotFoundException for non-existent parent', async () => {
      const parentId = '507f1f77bcf86cd799439011';
      roleRepo.findById.mockResolvedValue(null);

      await expect(service.computePath(parentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateNoCycle', () => {
    it('should pass validation for moving to root', async () => {
      await expect(service.validateNoCycle('role1')).resolves.not.toThrow();
    });

    it('should throw error for self-parent', async () => {
      const roleId = '507f1f77bcf86cd799439011';

      await expect(service.validateNoCycle(roleId, roleId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error for cycle (moving to descendant)', async () => {
      const roleId = '507f1f77bcf86cd799439011';
      const descendantId = '507f1f77bcf86cd799439012';

      const descendants = [mockRole(descendantId, [roleId], 1)];
      roleRepo.findDescendants.mockResolvedValue(descendants);

      await expect(
        service.validateNoCycle(roleId, descendantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should pass validation for valid move', async () => {
      const roleId = '507f1f77bcf86cd799439011';
      const newParentId = '507f1f77bcf86cd799439012';

      roleRepo.findDescendants.mockResolvedValue([]);

      await expect(
        service.validateNoCycle(roleId, newParentId),
      ).resolves.not.toThrow();
    });
  });

  describe('canManageRole', () => {
    it('should allow admin to manage any role', () => {
      const adminRole = mockRole('admin', [], 0, true);
      const targetRole = mockRole('target', [], 0);

      const result = service.canManageRole(adminRole, targetRole);
      expect(result).toBe(true);
    });

    it('should allow user to manage themselves', () => {
      const roleId = '507f1f77bcf86cd799439011';
      const userRole = mockRole(roleId);
      const targetRole = mockRole(roleId);

      const result = service.canManageRole(userRole, targetRole);
      expect(result).toBe(true);
    });

    it('should allow user to manage descendants', () => {
      const userRoleId = '507f1f77bcf86cd799439011';
      const userRole = mockRole(userRoleId);
      const descendantRole = mockRole('descendant', [userRoleId], 1);

      const result = service.canManageRole(userRole, descendantRole);
      expect(result).toBe(true);
    });

    it('should not allow user to manage unrelated roles', () => {
      const userRole = mockRole('user');
      const otherRole = mockRole('other');

      const result = service.canManageRole(userRole, otherRole);
      expect(result).toBe(false);
    });
  });

  describe('canAssignRole', () => {
    it('should use same logic as canManageRole', () => {
      const adminRole = mockRole('admin', [], 0, true);
      const targetRole = mockRole('target', [], 0);

      const result = service.canAssignRole(adminRole, targetRole);
      expect(result).toBe(true);
    });
  });

  describe('buildRoleTree', () => {
    it('should build tree structure from flat roles', () => {
      const rootRole = mockRole('root');
      const child1 = mockRole('child1', ['root'], 1);
      const child2 = mockRole('child2', ['root'], 1);
      const grandchild = mockRole('grandchild', ['root', 'child1'], 2);

      const roles = [rootRole, child1, child2, grandchild];
      const tree = service.buildRoleTree(roles);

      expect(tree).toHaveLength(1);
      expect(tree[0]._id.toString()).toBe('root');
      expect((tree[0] as any).children).toHaveLength(2);
      expect((tree[0] as any).children[0].children).toHaveLength(1);
    });
  });

  describe('getVisibleRoles', () => {
    it('should return all roles for admin', async () => {
      const adminRole = mockRole('admin', [], 0, true);
      const allRoles = [
        mockRole('role1'),
        mockRole('role2'),
        mockRole('role3'),
      ];

      const result = await service.getVisibleRoles(adminRole, allRoles);
      expect(result).toEqual(allRoles);
    });

    it('should filter roles for non-admin users', async () => {
      const userRoleId = '507f1f77bcf86cd799439011';
      const userRole = mockRole(userRoleId);
      const allRoles = [
        userRole,
        mockRole('descendant', [userRoleId], 1),
        mockRole('unrelated'),
      ];

      const result = await service.getVisibleRoles(userRole, allRoles);
      expect(result).toHaveLength(2);
      expect(result.some((r) => r._id.toString() === userRoleId)).toBe(true);
      expect(result.some((r) => r._id.toString() === 'descendant')).toBe(true);
    });
  });
});
