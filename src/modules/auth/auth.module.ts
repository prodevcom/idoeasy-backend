import { Session, SESSION_SERVICE, SessionSchema } from '@entech/common';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { SessionsController } from './controllers/sessions.controller';
import { AuthService } from './services/auth.service';
import { SessionsService } from './services/sessions.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const jwtExpiresIn = configService.get<number>('jwt.expiresIn');
        const expiresInSeconds = jwtExpiresIn * 60; // Convert minutes to seconds

        return {
          secret: configService.get<string>('jwt.secret'),
          signOptions: {
            expiresIn: `${expiresInSeconds}s`,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, SessionsController],
  providers: [
    AuthService,
    SessionsService,
    { provide: SESSION_SERVICE, useExisting: SessionsService },
  ],
  exports: [AuthService, SessionsService, SESSION_SERVICE],
})
export class AuthModule {}
