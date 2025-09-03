import {
  ApiResponseDto,
  ApiSwaggerDocs,
  CurrentUser,
  PermissionRole,
} from '@idoeasy/common';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser as CurrentUserDecorator } from '../../../common/decorators';
import { PermissionFilterDto } from '../dto/permission-filter.dto';
import { PermissionResponseDto } from '../dto/permission-response.dto';
import { PermissionsService } from '../services/permissions.service';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @PermissionRole('permissions.read')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get all permissions',
      description: 'Retrieves a list of all available permissions',
    },
    responses: [
      {
        status: 200,
        description: 'Permissions retrieved successfully',
        model: PermissionResponseDto,
        type: 'list',
      },
    ],
  })
  async findAll(
    @Query() filterDto: PermissionFilterDto,
    @CurrentUserDecorator() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<PermissionResponseDto[]>> {
    const { permissions, pagination } = await this.permissionsService.findAll(
      filterDto,
      currentUser,
    );

    return ApiResponseDto.successList(
      permissions,
      pagination,
      'Permissions retrieved successfully',
    );
  }
}
