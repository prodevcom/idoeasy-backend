import { CurrentUser, Session, SessionDocument, User } from '@entech/common';
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { UserRepo } from '../../users/repositories/user.repo';
import { UserHooksService } from '../../users/services/user-hooks.service';
import { SessionResponseDto } from '../dto/session-response.dto';
import { parseSessionResponse } from '../helpers';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userRepo: UserRepo,
    private userHooks: UserHooksService,
  ) {}

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  async createSession(
    userId: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    session: Session;
  }> {
    const refreshToken = this.generateRefreshToken();

    const jwtExpiresIn = this.configService.get<number>('jwt.expiresIn');
    const expiresInSeconds = jwtExpiresIn * 60;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const payload = {
      sub: userId,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: `${expiresInSeconds}s`,
    });

    const session = new this.sessionModel({
      userId: userId,
      refreshToken,
      accessToken,
      userAgent,
      ipAddress,
      expiresAt,
      lastActivity: new Date(),
    });

    await session.save();

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; session: SessionResponseDto }> {
    const session = await this.sessionModel
      .findOne({
        refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    const jwtExpiresIn = this.configService.get<number>('jwt.expiresIn');
    const expiresInSeconds = jwtExpiresIn * 60;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const payload = {
      sub: session.userId.toString(),
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: `${expiresInSeconds}s`,
    });

    // Update session with new access token and expiration
    session.accessToken = accessToken;
    session.expiresAt = expiresAt;
    await session.save();

    return {
      accessToken,
      session: parseSessionResponse(session),
    };
  }

  async validateSession(accessToken: string): Promise<{
    session: Session;
    user: User;
  }> {
    try {
      if (!accessToken) {
        throw new UnauthorizedException(
          'Invalid access token - no token provided',
        );
      }

      this.jwtService.verify(accessToken);

      const session = await this.sessionModel
        .findOne({
          accessToken,
          isActive: true,
          expiresAt: { $gt: new Date() },
        })
        .exec();

      if (!session) {
        throw new UnauthorizedException('Invalid session');
      }

      const user = await this.userRepo.findWithRoleAndPermissionsById(
        session.userId.toString(),
      );

      // Inactivity window in minutes (default 180 = 3 hours)
      const maxInactiveMinutes = this.configService.get<number>(
        'jwt.maxInactiveMinutes',
      );

      const now = new Date();
      const lastActivity = session.lastActivity;
      const timeInactiveMs = now.getTime() - lastActivity.getTime();
      const timeInactiveMinutes = Math.floor(timeInactiveMs / (1000 * 60));

      if (
        typeof maxInactiveMinutes === 'number' &&
        timeInactiveMinutes > maxInactiveMinutes
      ) {
        // Deactivate session and inform inactivity time
        session.isActive = false;
        await session.save();
        throw new UnauthorizedException(
          `Session expired due to inactivity (${timeInactiveMinutes} minutes).`,
        );
      }

      // Update last activity
      session.lastActivity = now;
      await session.save();

      return { session, user };
    } catch (error: any) {
      this.logger.error(error?.message ?? 'Session validation failed');
      throw new UnauthorizedException(error?.message ?? 'Invalid access token');
    }
  }

  async logoutSession(refreshToken: string): Promise<void> {
    const session = await this.sessionModel
      .findOne({
        refreshToken,
        isActive: true,
      })
      .exec();

    if (session) {
      session.isActive = false;
      await session.save();
    }
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.sessionModel
      .updateMany(
        { userId: new Types.ObjectId(userId), isActive: true },
        { isActive: false },
      )
      .exec();
  }

  async getUserSessions(userId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionModel
      .find({ userId: new Types.ObjectId(userId), isActive: true })
      .sort({ lastActivity: -1 })
      .exec();

    return sessions.map((session) => parseSessionResponse(session));
  }

  async getAllActiveSessions(): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionModel
      .find({ isActive: true })
      .populate('userId', 'name email')
      .sort({ lastActivity: -1 })
      .exec();

    return sessions.map((session) => parseSessionResponse(session));
  }

  async getSessionById(sessionId: string): Promise<SessionResponseDto> {
    const session = await this.sessionModel
      .findById(sessionId)
      .populate('userId', 'name email')
      .exec();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return parseSessionResponse(session);
  }

  async terminateSession(sessionId: string): Promise<void> {
    const session = await this.sessionModel.findById(sessionId).exec();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.isActive = false;
    await session.save();
  }

  async terminateCurrentSession(
    currentUser: CurrentUser,
    accessToken: string,
  ): Promise<void> {
    const userId = currentUser.user._id;
    const session = await this.sessionModel
      .findOne({
        userId,
        accessToken,
        isActive: true,
      })
      .exec();

    if (!session) {
      throw new NotFoundException('Active session not found');
    }

    // Get user data for logout hook
    const user = await this.userRepo.findWithRoleAndPermissionsById(userId);

    if (user) {
      // Trigger user logout hooks
      await this.userHooks.onUserLogout(currentUser, userId, {
        reason: 'user_initiated',
        sessionId: session._id.toString(),
      });
    }

    session.isActive = false;
    await session.save();
  }

  async terminateUserSessions(userId: string): Promise<void> {
    await this.sessionModel
      .updateMany(
        { userId: new Types.ObjectId(userId), isActive: true },
        { isActive: false },
      )
      .exec();
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.sessionModel
      .updateMany(
        { expiresAt: { $lt: new Date() }, isActive: true },
        { isActive: false },
      )
      .exec();

    return result.modifiedCount;
  }

  async getSessionStats(): Promise<{
    totalActive: number;
    totalExpired: number;
    averageInactiveMinutes: number;
  }> {
    const now = new Date();

    const activeSessions = await this.sessionModel.countDocuments({
      isActive: true,
      expiresAt: { $gt: now },
    });

    const expiredSessions = await this.sessionModel.countDocuments({
      isActive: true,
      expiresAt: { $lte: now },
    });

    const activeSessionsData = await this.sessionModel
      .find({ isActive: true, expiresAt: { $gt: now } })
      .select('lastActivity')
      .exec();

    const totalInactiveMinutes = activeSessionsData.reduce((total, session) => {
      const inactiveMinutes = Math.floor(
        (now.getTime() - session.lastActivity.getTime()) / (1000 * 60),
      );
      return total + inactiveMinutes;
    }, 0);

    const averageInactiveMinutes =
      activeSessions > 0
        ? Math.floor(totalInactiveMinutes / activeSessions)
        : 0;

    return {
      totalActive: activeSessions,
      totalExpired: expiredSessions,
      averageInactiveMinutes,
    };
  }
}
