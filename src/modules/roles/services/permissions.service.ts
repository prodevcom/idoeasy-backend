import {
  CurrentUser,
  PaginationInfo,
  Permission,
  PermissionDocument,
} from '@entech/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { PermissionFilterDto, PermissionResponseDto } from '../dto';
import { parsePermissionModel } from '../helpers';
import { PermissionRepo } from '../repositories';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
    private permissionRepo: PermissionRepo,
  ) {}

  private transformToPermissionResponse(
    permission: Permission,
  ): PermissionResponseDto {
    const plainPermission = (permission as any).toObject
      ? (permission as any).toObject()
      : permission;

    return plainToInstance(PermissionResponseDto, plainPermission, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    filterDto: PermissionFilterDto,
    currentUser: CurrentUser,
  ): Promise<{
    permissions: PermissionResponseDto[];
    pagination: PaginationInfo;
  }> {
    const { permissions, total } = await this.permissionRepo.search(
      filterDto,
      currentUser,
    );
    const { page, limit } = filterDto;

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;

    const pagination: PaginationInfo = {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev: page > 1,
    };

    return {
      permissions: permissions.map((permission) =>
        parsePermissionModel(permission),
      ),
      pagination,
    };
  }
}
