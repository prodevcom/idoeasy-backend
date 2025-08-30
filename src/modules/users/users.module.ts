import { Role, RoleSchema, User, UserSchema } from '@entech/common';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { RolesModule } from '../roles/roles.module';
import { MeController } from './controllers/me.controller';
import { UsersController } from './controllers/users.controller';
import { UserRepo } from './repositories/user.repo';
import { UserHooksService, UsersService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    forwardRef(() => AuthModule),
    RolesModule,
  ],
  controllers: [UsersController, MeController],
  providers: [UsersService, UserHooksService, UserRepo],
  exports: [UsersService, UserHooksService, UserRepo],
})
export class UsersModule {}
