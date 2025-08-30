import {
  ApiResponseDto,
  ApiSwaggerDocs,
  CurrentUser,
  PermissionRole,
} from '@entech/common';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
} from '../dto';
import { UsersService } from '../services/users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @PermissionRole('users.create')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Create a new user',
      description: 'Creates a new user with the provided data',
    },
    responses: [
      {
        status: 201,
        description: 'User created successfully',
        model: UserResponseDto,
        type: 'single',
      },
      {
        status: 400,
        description: 'Bad request - Invalid user data',
      },
    ],
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.create(createUserDto, currentUser);
    return ApiResponseDto.success(user, 'User created successfully');
  }

  @Get()
  @PermissionRole('users.read')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get all users',
      description:
        'Retrieves a paginated list of users with optional filtering',
    },
    responses: [
      {
        status: 200,
        description: 'Users retrieved successfully',
        model: UserResponseDto,
        type: 'list',
      },
    ],
  })
  async findAll(
    @Query() queryDto: UserQueryDto,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<UserResponseDto[]>> {
    const { users, pagination } = await this.usersService.findAll(
      queryDto,
      currentUser,
    );
    return ApiResponseDto.successList(
      users,
      pagination,
      'Users retrieved successfully',
    );
  }

  @Get(':id')
  @PermissionRole('users.read')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get user by ID',
      description: 'Retrieves a specific user by their ID',
    },
    responses: [
      {
        status: 200,
        description: 'User retrieved successfully',
        model: UserResponseDto,
        type: 'single',
      },
      {
        status: 404,
        description: 'User not found',
      },
    ],
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.findById(id);
    return ApiResponseDto.success(user, 'User retrieved successfully');
  }

  @Patch(':id')
  @PermissionRole('users.update')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Update user',
      description: 'Updates an existing user with new data',
    },
    responses: [
      {
        status: 200,
        description: 'User updated successfully',
        model: UserResponseDto,
        type: 'single',
      },
      {
        status: 404,
        description: 'User not found',
      },
    ],
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.update(id, updateUserDto, currentUser);
    return ApiResponseDto.success(user, 'User updated successfully');
  }

  // @Delete(':id')
  // @PermissionRole('users.delete')
  // @ApiSwaggerDocs({
  //   operation: {
  //     summary: 'Delete user',
  //     description: 'Deletes a user by their ID',
  //   },
  //   responses: [
  //     {
  //       status: 200,
  //       description: 'User deleted successfully',
  //     },
  //     {
  //       status: 404,
  //       description: 'User not found',
  //     },
  //   ],
  // })
  // async remove(@Param('id') id: string): Promise<ApiResponseDto<void>> {
  //   await this.usersService.remove(id);
  //   return ApiResponseDto.success(undefined, 'User deleted successfully');
  // }
}
