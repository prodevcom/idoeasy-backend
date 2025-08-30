import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Permission } from '../schemas/permission.schema';
import { Role } from '../schemas/role.schema';
import { Session } from '../schemas/session.schema';
import { User } from '../schemas/user.schema';

export interface CurrentUser {
  user: User;
  role?: Role;
  permissions?: Permission[];
  session?: Session;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();

    const user = request.currentUser as User;
    const role = request.currentUser?.role as Role;
    const permissions = request.currentUser?.role?.permissions as Permission[];
    const session = request.session as Session;

    return {
      user,
      role,
      permissions,
      session,
    };
  },
);
