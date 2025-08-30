import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PERMISSION_KEY } from '../decorators/permission-role.decorator';
import { Permission, PermissionDoc } from '../schemas/permission.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const currentUser = request.currentUser as User;

    const role = currentUser.role as Role & { permissions: Permission[] };
    if (role.isAdmin) return true;

    const permissions = role.permissions || ([] as PermissionDoc[]);

    // Check if user has the required permission
    const hasPermission = permissions.some(
      (permission: PermissionDoc) =>
        permission.name === requiredPermission && permission.isActive,
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Insufficient permissions.`);
    }

    return true;
  }
}
