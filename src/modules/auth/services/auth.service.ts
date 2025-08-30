import { CurrentUser, User } from '@entech/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { UserRepo } from '../../users/repositories/user.repo';
import { UserHooksService } from '../../users/services/user-hooks.service';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { SessionsService } from './sessions.service';

@Injectable()
export class AuthService {
  constructor(
    private userRepo: UserRepo,
    private configService: ConfigService,
    private sessionsService: SessionsService,
    private auditLogService: AuditLogService,
    private userHooks: UserHooksService,
  ) {}

  /**
   * Login a user
   *
   * @param loginDto - The login data
   * @param userAgent - The user agent
   * @param ipAddress - The IP address
   * @returns The user
   */
  async login(
    loginDto: LoginDto,
    userAgent: string,
    ipAddress: string,
  ): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create session
    const { accessToken, refreshToken, session } =
      await this.sessionsService.createSession(user._id, userAgent, ipAddress);

    const jwtExpiresIn = this.configService.get<number>('jwt.expiresIn');
    const expiresInSeconds = jwtExpiresIn * 60;

    const userResponse = await this.userRepo.findWithRoleAndPermissionsById(
      user._id,
    );

    const currentUser: CurrentUser = {
      user: userResponse,
      session,
    };

    // Trigger user login hooks
    await this.userHooks.onUserLogin(currentUser, user._id, {
      userAgent,
      ipAddress,
      sessionId: session._id.toString(),
    });

    const authData = {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
      user: userResponse,
    };

    return plainToInstance(AuthResponseDto, authData, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Refresh a token
   *
   * @param refreshToken - The refresh token
   * @returns The user
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    const { accessToken } =
      await this.sessionsService.refreshAccessToken(refreshToken);

    const jwtExpiresIn = this.configService.get<number>('jwt.expiresIn');
    const expiresInSeconds = jwtExpiresIn * 60;

    const authData = {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
      user: null,
    };

    return plainToInstance(AuthResponseDto, authData, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Logout a user
   *
   * @param refreshToken - The refresh token
   * @param userId - The user ID
   */
  async logout(refreshToken?: string, userId?: string): Promise<void> {
    if (refreshToken) {
      await this.sessionsService.logoutSession(refreshToken);
    } else if (userId) {
      await this.sessionsService.logoutAllSessions(userId);
    }
  }

  /**
   * Validate a user by their email and password
   *
   * @param email - The user email
   * @param password - The user password
   * @returns The user
   */
  private async validateUser(
    email: string,
    password: string,
  ): Promise<User | undefined> {
    const user = await this.userRepo.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return;
  }
}
