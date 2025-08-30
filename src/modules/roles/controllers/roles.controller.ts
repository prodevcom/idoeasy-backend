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
  CreateRoleDto,
  MoveRoleDto,
  RoleFilterDto,
  RoleResponseDto,
  UpdateRoleDto,
} from '../dto';
import { RolesService } from '../services/roles.service';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @PermissionRole('roles.create')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Create a new role',
      description: 'Creates a new role with specified permissions',
    },
    responses: [
      {
        status: 201,
        description: 'Role created successfully',
        model: RoleResponseDto,
        type: 'single',
      },
      {
        status: 400,
        description: 'Bad request - Invalid role data',
      },
    ],
  })
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<RoleResponseDto>> {
    const role = await this.rolesService.create(createRoleDto, currentUser);
    return ApiResponseDto.success(role, 'Role created successfully');
  }

  @Get()
  @PermissionRole('roles.read')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get all roles',
      description:
        'Retrieves a paginated list of roles with optional filtering',
    },
    responses: [
      {
        status: 200,
        description: 'Roles retrieved successfully',
        model: RoleResponseDto,
        type: 'list',
      },
    ],
  })
  async findAll(
    @Query() queryDto: RoleFilterDto,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<RoleResponseDto[]>> {
    const { roles, pagination } = await this.rolesService.findAll(
      queryDto,
      currentUser,
    );
    return ApiResponseDto.successList(
      roles,
      pagination,
      'Roles retrieved successfully',
    );
  }

  @Get(':id')
  @PermissionRole('roles.read')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get role by ID',
      description: 'Retrieves a specific role by its ID',
    },
    responses: [
      {
        status: 200,
        description: 'Role retrieved successfully',
        model: RoleResponseDto,
        type: 'single',
      },
      {
        status: 404,
        description: 'Role not found',
      },
    ],
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<RoleResponseDto>> {
    const role = await this.rolesService.findById(id, currentUser);
    return ApiResponseDto.success(role, 'Role retrieved successfully');
  }

  @Patch(':id')
  @PermissionRole('roles.update')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Update role',
      description: 'Updates an existing role with new data',
    },
    responses: [
      {
        status: 200,
        description: 'Role updated successfully',
        model: RoleResponseDto,
        type: 'single',
      },
      {
        status: 404,
        description: 'Role not found',
      },
    ],
  })
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<RoleResponseDto>> {
    const role = await this.rolesService.update(id, updateRoleDto, currentUser);
    return ApiResponseDto.success(role, 'Role updated successfully');
  }

  @Get('hierarchy')
  @PermissionRole('roles.read')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get role hierarchy',
      description: 'Retrieves the role hierarchy as a tree structure',
    },
    responses: [
      {
        status: 200,
        description: 'Role hierarchy retrieved successfully',
        model: RoleResponseDto,
        type: 'list',
      },
    ],
  })
  async getRoleHierarchy(
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<RoleResponseDto[]>> {
    const hierarchy = await this.rolesService.getRoleHierarchy(currentUser);
    return ApiResponseDto.successList(
      hierarchy,
      {
        page: 1,
        limit: hierarchy.length,
        total: hierarchy.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      'Role hierarchy retrieved successfully',
    );
  }

  @Post('move')
  @PermissionRole('roles.move')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Move role in hierarchy',
      description: 'Moves a role to a new parent in the hierarchy',
    },
    responses: [
      {
        status: 200,
        description: 'Role moved successfully',
      },
      {
        status: 400,
        description: 'Bad request - Invalid move operation',
      },
      {
        status: 404,
        description: 'Role not found',
      },
    ],
  })
  async moveRole(
    @Body() moveRoleDto: MoveRoleDto,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<void>> {
    await this.rolesService.moveRole(moveRoleDto, currentUser);
    return ApiResponseDto.success(undefined, 'Role moved successfully');
  }

  // @Delete(':id')
  // @PermissionRole('roles.delete')
  // @ApiSwaggerDocs({
  //   operation: {
  //     summary: 'Delete role',
  //     description: 'Deletes a role by its ID',
  //   },
  //   responses: [
  //     {
  //       status: 200,
  //       description: 'Role deleted successfully',
  //     },
  //     {
  //       status: 404,
  //       description: 'Role not found',
  //     },
  //   ],
  // })
  // async remove(
  //   @Param('id') id: string,
  //   @CurrentUser() currentUser: CurrentUser,
  // ): Promise<ApiResponseDto<void>> {
  //   await this.rolesService.remove(id, currentUser);
  //   return ApiResponseDto.success(undefined, 'Role deleted successfully');
  // }
}
