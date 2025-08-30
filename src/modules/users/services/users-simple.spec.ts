/**
 * Simple integration test to verify user hierarchy filtering works
 * This test validates the main feature without complex mocking
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RoleHierarchyService, RoleRepo } from '../../roles';
import { UserRepo } from '../repositories/user.repo';
import { UserHooksService } from './user-hooks.service';
import { UsersService } from './users.service';

describe('UsersService - Hierarchy Filtering (Simple)', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<UserRepo>;
  let roleRepo: jest.Mocked<RoleRepo>;
  let hierarchyHelper: jest.Mocked<RoleHierarchyService>;

  beforeEach(async () => {
    const mockUserRepo = {
      search: jest.fn(),
    };

    const mockRoleRepo = {
      search: jest.fn(),
    };

    const mockHierarchyHelper = {
      getVisibleRoles: jest.fn().mockResolvedValue([]),
    };

    const mockUserHooks = {
      onUserCreated: jest.fn(),
      onUserUpdated: jest.fn(),
      onPasswordChanged: jest.fn(),
      onRoleAssigned: jest.fn(),
      onStatusChanged: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepo, useValue: mockUserRepo },
        { provide: RoleRepo, useValue: mockRoleRepo },
        { provide: RoleHierarchyService, useValue: mockHierarchyHelper },
        { provide: UserHooksService, useValue: mockUserHooks },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(UserRepo);
    roleRepo = module.get(RoleRepo);
    hierarchyHelper = module.get(RoleHierarchyService);
  });

  it('should call hierarchy helper for non-admin users', async () => {
    const mockCurrentUser = {
      email: 'user@example.com',
      role: { isAdmin: false, _id: 'user_role_id' },
      sessionId: 'session1',
    };

    const mockManageableRoles = [{ _id: 'role1', name: 'Role1' }] as any[];

    // Mock the async getVisibleRoles method
    hierarchyHelper.getVisibleRoles.mockResolvedValue(mockManageableRoles);

    userRepo.search.mockResolvedValue({
      users: [],
      total: 0,
    });

    await service.findAll({ page: 1, limit: 25 }, mockCurrentUser as any);

    // Verify that hierarchy helper was called
    expect(hierarchyHelper.getVisibleRoles).toHaveBeenCalledWith(
      mockCurrentUser.role,
    );

    // Verify that user search was called with allowed roles
    expect(userRepo.search).toHaveBeenCalledWith(
      { page: 1, limit: 25 },
      ['role1'], // Only manageable role IDs
    );
  });

  it('should not filter for admin users', async () => {
    const mockAdminUser = {
      email: 'admin@example.com',
      role: { isAdmin: true, _id: 'admin_role_id' },
      sessionId: 'session1',
    };

    userRepo.search.mockResolvedValue({
      users: [],
      total: 0,
    });

    await service.findAll({ page: 1, limit: 25 }, mockAdminUser as any);

    // Admin users should not trigger hierarchy filtering
    expect(hierarchyHelper.getVisibleRoles).not.toHaveBeenCalled();

    // Verify that user search was called with empty allowedRoles
    expect(userRepo.search).toHaveBeenCalledWith(
      { page: 1, limit: 25 },
      [], // Empty allowedRoles for admin users
    );
  });
});
