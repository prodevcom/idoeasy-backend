import {
  ApiResponseDto,
  ApiSwaggerDocs,
  CurrentUser,
  PermissionRole,
} from '@entech/common';
import { Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionResponseDto } from '../dto/session-response.dto';
import { SessionsService } from '../services/sessions.service';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @PermissionRole('sessions.read')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get all active sessions',
      description: 'Retrieve all active sessions (admin only)',
    },
    responses: [
      {
        status: 200,
        model: SessionResponseDto,
        type: 'list',
        description: 'Sessions retrieved successfully',
      },
    ],
  })
  async getAllSessions(): Promise<ApiResponseDto<SessionResponseDto[]>> {
    const sessions = await this.sessionsService.getAllActiveSessions();
    return ApiResponseDto.success(sessions, 'Sessions retrieved successfully');
  }

  @Get('stats')
  @PermissionRole('sessions.read')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get session statistics',
      description: 'Retrieve session statistics (admin only)',
    },
    responses: [
      {
        status: 200,
        description: 'Session statistics retrieved successfully',
      },
    ],
  })
  async getSessionStats(): Promise<
    ApiResponseDto<{
      totalActive: number;
      totalExpired: number;
      averageInactiveMinutes: number;
    }>
  > {
    const stats = await this.sessionsService.getSessionStats();
    return ApiResponseDto.success(
      stats,
      'Session statistics retrieved successfully',
    );
  }

  @Get('user/:userId')
  @PermissionRole('sessions.read')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get user sessions',
      description: 'Retrieve all active sessions for a specific user',
    },
    responses: [
      {
        status: 200,
        model: SessionResponseDto,
        type: 'list',
        description: 'User sessions retrieved successfully',
      },

      {
        status: 404,
        description: 'User not found',
      },
    ],
  })
  async getUserSessions(
    @Param('userId') userId: string,
  ): Promise<ApiResponseDto<SessionResponseDto[]>> {
    const sessions = await this.sessionsService.getUserSessions(userId);
    return ApiResponseDto.success(
      sessions,
      'User sessions retrieved successfully',
    );
  }

  @Get(':id')
  @PermissionRole('sessions.read')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get session by ID',
      description: 'Retrieve a specific session by ID',
    },
    responses: [
      {
        status: 200,
        model: SessionResponseDto,
        type: 'single',
        description: 'Session retrieved successfully',
      },

      {
        status: 404,
        description: 'Session not found',
      },
    ],
  })
  async getSessionById(
    @Param('id') sessionId: string,
  ): Promise<ApiResponseDto<SessionResponseDto>> {
    const session = await this.sessionsService.getSessionById(sessionId);
    return ApiResponseDto.success(session, 'Session retrieved successfully');
  }

  @Delete(':id')
  @PermissionRole('sessions.terminate')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Terminate session',
      description: 'Terminate a specific session',
    },
    responses: [
      {
        status: 200,
        description: 'Session terminated successfully',
      },

      {
        status: 404,
        description: 'Session not found',
      },
    ],
  })
  async terminateSession(
    @Param('id') sessionId: string,
  ): Promise<ApiResponseDto<null>> {
    await this.sessionsService.terminateSession(sessionId);
    return ApiResponseDto.success(null, 'Session terminated successfully');
  }

  @Delete('user/:userId')
  @PermissionRole('sessions.terminate')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Terminate all user sessions',
      description: 'Terminate all active sessions for a specific user',
    },
    responses: [
      {
        status: 200,
        description: 'User sessions terminated successfully',
      },
    ],
  })
  async terminateUserSessions(
    @Param('userId') userId: string,
  ): Promise<ApiResponseDto<null>> {
    await this.sessionsService.terminateUserSessions(userId);
    return ApiResponseDto.success(
      null,
      'User sessions terminated successfully',
    );
  }

  @Delete('cleanup/expired')
  @PermissionRole('sessions.terminate')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Cleanup expired sessions',
      description: 'Terminate all expired sessions',
    },
    responses: [
      {
        status: 200,
        description: 'Expired sessions cleaned up successfully',
      },
    ],
  })
  async cleanupExpiredSessions(): Promise<
    ApiResponseDto<{ terminatedCount: number }>
  > {
    const terminatedCount = await this.sessionsService.cleanupExpiredSessions();
    return ApiResponseDto.success(
      { terminatedCount },
      'Expired sessions cleaned up successfully',
    );
  }

  @Post('logout')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Logout current session',
      description:
        'Terminates the session that matches the provided Bearer access token',
    },
    responses: [
      { status: 200, description: 'Current session terminated' },
      { status: 404, description: 'Active session not found' },
    ],
  })
  async logoutCurrentSession(
    @Headers('authorization') authorization: string,
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<null>> {
    const token = (authorization || '').replace(/^Bearer\s+/i, '').trim();
    await this.sessionsService.terminateCurrentSession(currentUser, token);
    return ApiResponseDto.success(null, 'Current session terminated');
  }
}
