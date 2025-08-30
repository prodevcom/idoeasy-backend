import { ApiResponseDto, CurrentUser, UserStatus } from '@entech/common';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserQueryDto } from '../dto/user-query.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UsersService } from '../services/users.service';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: UserResponseDto = {
    id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    email: 'john.doe@example.com',
    status: UserStatus.ACTIVE,
    role: new Types.ObjectId('507f1f77bcf86cd799439012') as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCurrentUser: CurrentUser = {
    user: {
      _id: new Types.ObjectId('507f1f77bcf86cd799439013') as any,
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashedpassword',
      status: UserStatus.ACTIVE,
      role: new Types.ObjectId('507f1f77bcf86cd799439012') as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    role: {
      _id: new Types.ObjectId('507f1f77bcf86cd799439012') as any,
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
    },
  };

  const mockUsers = [mockUser];

  const mockPagination = {
    page: 1,
    limit: 25,
    total: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123',
        role: '507f1f77bcf86cd799439012',
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto, mockCurrentUser);

      expect(service.create).toHaveBeenCalledWith(
        createUserDto,
        mockCurrentUser,
      );
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.status.status).toBe('success');
      expect(result.status.message).toBe('User created successfully');
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      const queryDto: UserQueryDto = {
        page: 1,
        limit: 25,
      };

      jest
        .spyOn(service, 'findAll')
        .mockResolvedValue({ users: mockUsers, pagination: mockPagination });

      const result = await controller.findAll(queryDto, mockCurrentUser);

      expect(service.findAll).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 25,
          search: undefined,
          status: undefined,
          roleId: undefined,
          sortBy: undefined,
          sortOrder: undefined,
        },
        mockCurrentUser,
      );
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.status.status).toBe('success');
      expect(result.status.message).toBe('Users retrieved successfully');
      expect(result.data).toEqual(mockUsers);
      expect(result.pagination).toEqual(mockPagination);
    });

    it('should return empty array when no users found', async () => {
      const queryDto: UserQueryDto = {
        page: 1,
        limit: 25,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue({
        users: [],
        pagination: { ...mockPagination, total: 0 },
      });

      const result = await controller.findAll(queryDto, mockCurrentUser);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = '507f1f77bcf86cd799439011';

      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);

      const result = await controller.findOne(userId);

      expect(service.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.status.status).toBe('success');
      expect(result.status.message).toBe('User retrieved successfully');
      expect(result.data).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';

      jest
        .spyOn(service, 'findById')
        .mockRejectedValue(
          new NotFoundException(`User with ID ${userId} not found`),
        );

      await expect(controller.findOne(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateUserDto: UpdateUserDto = {
        name: 'John Updated',
        email: 'john.updated@example.com',
      };

      const updatedUser: UserResponseDto = {
        ...mockUser,
        name: updateUserDto.name || mockUser.name,
        email: updateUserDto.email || mockUser.email,
      };

      jest.spyOn(service, 'update').mockResolvedValue(updatedUser);

      const result = await controller.update(
        userId,
        updateUserDto,
        mockCurrentUser,
      );

      expect(service.update).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        mockCurrentUser,
      );
      expect(result).toBeInstanceOf(ApiResponseDto);
      expect(result.status.status).toBe('success');
      expect(result.status.message).toBe('User updated successfully');
      expect(result.data && result.data.name).toBe('John Updated');
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateUserDto: UpdateUserDto = {
        name: 'John Updated',
      };

      jest
        .spyOn(service, 'update')
        .mockRejectedValue(
          new NotFoundException(`User with ID ${userId} not found`),
        );

      await expect(
        controller.update(userId, updateUserDto, mockCurrentUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // Remove method is commented out in the controller
});
