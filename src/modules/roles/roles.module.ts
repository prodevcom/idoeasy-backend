import {
  Permission,
  PermissionSchema,
  Role,
  RoleSchema,
} from '@idoeasy/common';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionsController, RolesController } from './controllers';
import { PermissionRepo, RoleRepo } from './repositories';
import {
  PermissionsService,
  RoleHierarchyHooksService,
  RoleHierarchyService,
  RolesService,
} from './services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
  ],
  controllers: [RolesController, PermissionsController],
  providers: [
    RolesService,
    PermissionsService,
    RoleRepo,
    PermissionRepo,
    RoleHierarchyService,
    RoleHierarchyHooksService,
  ],
  exports: [
    RolesService,
    PermissionsService,
    RoleRepo,
    PermissionRepo,
    RoleHierarchyService,
    RoleHierarchyHooksService,
  ],
})
export class RolesModule {}
