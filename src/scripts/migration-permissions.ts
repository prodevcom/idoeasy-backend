import {
  Permission,
  PermissionDocument,
  Role,
  RoleDocument,
  User,
  UserDocument,
} from '@entech/common';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('InitPermissions');

  const permissionModel = app.get<Model<PermissionDocument>>(
    getModelToken(Permission.name),
  );
  const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  logger.log('🚀 Initializing permissions, roles and admin user...');

  // Create basic permissions
  const permissions = [
    // User permissions
    {
      name: 'users.create',
      description: 'Create new users',
      module: 'users',
      action: 'create',
      isAdminOnly: false,
    },
    {
      name: 'users.read',
      description: 'Read user information',
      module: 'users',
      action: 'read',
      isAdminOnly: false,
    },
    {
      name: 'users.update',
      description: 'Update user information',
      module: 'user',
      action: 'update',
      isAdminOnly: false,
    },
    {
      name: 'users.delete',
      description: 'Delete users',
      module: 'users',
      action: 'delete',
      isAdminOnly: false,
    },
    {
      name: 'users.change-password',
      description: 'Change user password',
      module: 'users',
      action: 'change-password',
      isAdminOnly: false,
    },

    // Role permissions
    {
      name: 'roles.create',
      description: 'Create new roles',
      module: 'roles',
      action: 'create',
      isAdminOnly: false,
    },
    {
      name: 'roles.read',
      description: 'Read role information',
      module: 'roles',
      action: 'read',
      isAdminOnly: false,
    },
    {
      name: 'roles.update',
      description: 'Update role information',
      module: 'roles',
      action: 'update',
      isAdminOnly: false,
    },
    {
      name: 'roles.delete',
      description: 'Delete roles',
      module: 'roles',
      action: 'delete',
      isAdminOnly: true,
    },
    {
      name: 'roles.move',
      description: 'Move roles',
      module: 'roles',
      action: 'move',
      isAdminOnly: true,
    },

    // Permission permissions
    {
      name: 'permissions.read',
      description: 'Read permission information',
      module: 'permissions',
      action: 'read',
      isAdminOnly: false,
    },

    // Session permissions
    {
      name: 'sessions.read',
      description: 'Read session information',
      module: 'sessions',
      action: 'read',
      isAdminOnly: false,
    },
    {
      name: 'sessions.terminate',
      description: 'Terminate user sessions',
      module: 'sessions',
      action: 'terminate',
      isAdminOnly: false,
    },

    // Me permissions
    {
      name: 'me.read',
      description: 'Read me information',
      module: 'me',
      action: 'read',
      isAdminOnly: false,
    },
    {
      name: 'me.update',
      description: 'Update me information',
      module: 'me',
      action: 'update',
      isAdminOnly: false,
    },
    {
      name: 'me.change-password',
      description: 'Change me password',
      module: 'me',
      action: 'change-password',
      isAdminOnly: false,
    },
    {
      name: 'me.logout-all-sessions',
      description: 'Logout all user sessions',
      module: 'me',
      action: 'logout-all-sessions',
      isAdminOnly: false,
    },
    {
      name: 'me.terminate-session',
      description: 'Terminate user session',
      module: 'me',
      action: 'terminate-session',
      isAdminOnly: false,
    },
    {
      name: 'me.audit-logs.read',
      description: 'Read me audit logs',
      module: 'me',
      action: 'audit-logs.read',
      isAdminOnly: false,
    },

    // Client permissions
    {
      name: 'clients.read',
      description: 'Read clients information',
      module: 'clients',
      action: 'read',
      isAdminOnly: false,
    },
    {
      name: 'clients.create',
      description: 'Create new clients',
      module: 'clients',
      action: 'create',
      isAdminOnly: false,
    },
    {
      name: 'clients.read',
      description: 'Read clients',
      module: 'clients',
      action: 'read',
      isAdminOnly: false,
    },
    {
      name: 'clients.update',
      description: 'Update clients',
      module: 'clients',
      action: 'update',
      isAdminOnly: false,
    },
    {
      name: 'clients.delete',
      description: 'Delete clients',
      module: 'clients',
      action: 'delete',
      isAdminOnly: true,
    },
  ];

  const createdPermissions = [];

  for (const perm of permissions) {
    const existingPermission = await permissionModel
      .findOne({ name: perm.name })
      .exec();

    if (!existingPermission) {
      const newPermission = new permissionModel(perm);
      const savedPermission = await newPermission.save();
      createdPermissions.push(savedPermission);
      logger.log(`✅ Created permission: ${perm.name}`);
    } else {
      await permissionModel
        .findByIdAndUpdate(existingPermission._id, {
          ...perm,
        })
        .exec();

      createdPermissions.push(existingPermission);
      logger.log(`⏭️  Permission already exists: ${perm.name}`);
    }
  }

  // Create Admin role with all permissions
  const adminRole = await roleModel.findOne({ isAdmin: true }).exec();

  if (!adminRole) {
    const newAdminRole = new roleModel({
      name: 'Admin',
      description: 'Administrator with full access to all features',
      isActive: true,
      isAdmin: true,
    });

    await newAdminRole.save();
    logger.log('✅ Created Admin role with all permissions');
  } else {
    logger.log('⏭️  Admin role already exists');
  }

  // Create User role without permissions (basic role)
  const userRole = await roleModel.findOne({ isDefault: true }).exec();

  if (!userRole) {
    const newUserRole = new roleModel({
      name: 'User',
      description: 'Standard user without special permissions',
      isActive: true,
      isDefault: true, // Mark as default role
      permissions: [], // No permissions for basic users
    });

    await newUserRole.save();
    logger.log('✅ Created User role without permissions (default role)');
  } else {
    // Update existing User role to be default if not already
    if (!userRole.isDefault) {
      await roleModel.findByIdAndUpdate(userRole._id, { isDefault: true });
      logger.log('✅ Updated User role to be default');
    } else {
      logger.log('⏭️  User role already exists and is default');
    }
  }

  // Create first admin user
  const adminEmail = configService.get<string>('admin.email');
  const adminPassword = configService.get<string>('admin.password');

  const existingAdmin = await userModel.findOne({ role: adminRole._id }).exec();

  if (!existingAdmin) {
    if (!adminRole) {
      logger.error('❌ Admin role not found for user creation');
      await app.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const newAdminUser = new userModel({
      name: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      isActive: true,
      role: adminRole._id,
    });

    await newAdminUser.save();
    logger.log(`✅ Created admin user: ${adminEmail}`);
    logger.log(`🔑 Admin password: ${adminPassword}`);
  } else {
    logger.log(`⏭️  Admin user already exists: ${adminEmail}`);
  }

  logger.log('🎉 Permissions, roles and admin user initialization completed!');

  await app.close();
}

bootstrap().catch(console.error);
