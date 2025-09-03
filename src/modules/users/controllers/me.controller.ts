import {
  ApiResponseDto,
  ApiSwaggerDocs,
  CurrentUser,
  PermissionRole,
} from '@idoeasy/common';
import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLogResponseDto } from '../../audit-log/dto/audit-log-response.dto';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { LogoutDto } from '../../auth/dto/logout.dto';
import { SessionResponseDto } from '../../auth/dto/session-response.dto';
import { SessionsService } from '../../auth/services/sessions.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateMeDto } from '../dto/update-me.dto';
import { UpdateUserPreferencesDto } from '../dto/update-user-preferences.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UsersService } from '../services/users.service';

@ApiTags('Me')
@Controller('me')
export class MeController {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get current user profile',
      description: 'Retrieves the current authenticated user profile',
    },
    responses: [
      {
        status: 200,
        description: 'User profile retrieved successfully',
        model: UserResponseDto,
        type: 'single',
      },
    ],
  })
  @PermissionRole('me.read')
  async getMe(
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.findById(currentUser.user._id);
    return ApiResponseDto.success(user, 'User profile retrieved successfully');
  }

  @Patch()
  @ApiSwaggerDocs({
    operation: {
      summary: 'Update current user profile',
      description: 'Updates the current authenticated user profile',
    },
    responses: [
      {
        status: 200,
        description: 'User profile updated successfully',
        model: UserResponseDto,
        type: 'single',
      },
      {
        status: 400,
        description: 'Bad request - Invalid data or email already exists',
      },
    ],
  })
  @PermissionRole('me.update')
  async updateMe(
    @CurrentUser() currentUser: CurrentUser,
    @Body() updateMeDto: UpdateMeDto,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    // Check if email is being updated and if it's already taken
    if (updateMeDto.email && updateMeDto.email !== currentUser.user.email) {
      const existingUser = await this.usersService.findByEmailWithPassword(
        updateMeDto.email,
      );
      if (existingUser && existingUser.id !== currentUser.user._id) {
        throw new Error('Email already exists');
      }
    }

    const updateDto = {
      ...updateMeDto,
      // Keep the same status and role as the current user
      status: currentUser.user.status,
      roleId: currentUser.user.roleId.toString(),
    };

    const user = await this.usersService.update(
      currentUser.user._id,
      updateDto,
      currentUser,
    );
    return ApiResponseDto.success(user, 'User profile updated successfully');
  }

  @Post('change-password')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Change current user password',
      description: 'Changes the current authenticated user password',
    },
    responses: [
      {
        status: 200,
        description: 'Password changed successfully',
      },
      {
        status: 400,
        description: 'Bad request - Invalid data or passwords do not match',
      },
      {
        status: 401,
        description: 'Unauthorized - Current password is incorrect',
      },
    ],
  })
  @PermissionRole('me.change-password')
  async changePassword(
    @CurrentUser() currentUser: CurrentUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponseDto<void>> {
    await this.usersService.changePassword(
      currentUser.user._id,
      changePasswordDto,
      currentUser,
    );
    return ApiResponseDto.success(undefined, 'Password changed successfully');
  }

  @Patch('preferences')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Update user preferences',
      description: 'Updates the current user locale and timezone preferences',
    },
    responses: [
      {
        status: 200,
        description: 'User preferences updated successfully',
        model: UserResponseDto,
        type: 'single',
      },
      {
        status: 400,
        description: 'Bad request - Invalid preferences data',
      },
    ],
  })
  @PermissionRole('me.update')
  async updatePreferences(
    @CurrentUser() currentUser: CurrentUser,
    @Body() preferencesDto: UpdateUserPreferencesDto,
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.usersService.updatePreferences(
      currentUser.user._id,
      preferencesDto,
      currentUser,
    );
    return ApiResponseDto.success(
      user,
      'User preferences updated successfully',
    );
  }

  @Get('sessions')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get current user sessions',
      description: 'Retrieve all active sessions for the current user',
    },
    responses: [
      {
        status: 200,
        model: SessionResponseDto,
        type: 'list',
        description: 'User sessions retrieved successfully',
      },
    ],
  })
  @PermissionRole('me.logout-all-sessions')
  async getMySessions(
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<SessionResponseDto[]>> {
    const sessions = await this.sessionsService.getUserSessions(
      currentUser.user._id,
    );
    return ApiResponseDto.success(
      sessions,
      'User sessions retrieved successfully',
    );
  }

  @Delete('sessions')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Logout from all sessions',
      description: 'Terminate all active sessions for the current user',
    },
    responses: [
      {
        status: 200,
        description: 'All sessions terminated successfully',
      },
    ],
  })
  @PermissionRole('me.logout-all-sessions')
  async logoutAllSessions(
    @CurrentUser() currentUser: CurrentUser,
  ): Promise<ApiResponseDto<null>> {
    await this.sessionsService.logoutAllSessions(currentUser.user._id);
    return ApiResponseDto.success(null, 'All sessions terminated successfully');
  }

  @Delete('sessions/:sessionId')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Terminate specific session',
      description: 'Terminate a specific session for the current user',
    },
    responses: [
      {
        status: 200,
        description: 'Session terminated successfully',
      },
      {
        status: 401,
        description: 'Unauthorized - User not authenticated',
      },
      {
        status: 404,
        description: 'Session not found',
      },
    ],
  })
  @PermissionRole('me.terminate-session')
  async terminateSession(
    @CurrentUser() currentUser: CurrentUser,
    @Body() logoutDto: LogoutDto,
  ): Promise<ApiResponseDto<null>> {
    if (logoutDto.refreshToken) {
      await this.sessionsService.logoutSession(logoutDto.refreshToken);
    }
    return ApiResponseDto.success(null, 'Session terminated successfully');
  }

  @Get('my-logs')
  @ApiSwaggerDocs({
    operation: {
      summary: 'Get current user audit logs',
      description: 'Retrieves audit logs for the current user',
    },
    responses: [
      {
        status: 200,
        description: 'User audit logs retrieved successfully',
      },
    ],
  })
  @PermissionRole('me.audit-logs.read')
  async getMyLogs(
    @CurrentUser() user: CurrentUser,
  ): Promise<ApiResponseDto<AuditLogResponseDto[]>> {
    const logs = await this.auditLogService.getUserLogs(user.user._id);
    return ApiResponseDto.success(
      logs,
      'User audit logs retrieved successfully',
    );
  }
}
