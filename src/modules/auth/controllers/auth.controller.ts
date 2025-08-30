import { ApiResponseDto, ApiSwaggerDocs, Public } from '@entech/common';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { LogoutDto } from '../dto/logout.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiSwaggerDocs({
    operation: {
      summary: 'User login',
      description: 'Authenticate user and return JWT token with session',
    },
    responses: [
      {
        status: 200,
        model: AuthResponseDto,
        type: 'single',
        description: 'Login successful',
      },
      {
        status: 401,
        description: 'Invalid credentials',
      },
    ],
    authentication: false, // This endpoint doesn't require authentication
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const ipAddress =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'Unknown';

    const result = await this.authService.login(loginDto, userAgent, ipAddress);
    return ApiResponseDto.success(result, 'Login successful');
  }

  @Post('refresh')
  @Public()
  @ApiSwaggerDocs({
    operation: {
      summary: 'Refresh access token',
      description: 'Get new access token using refresh token',
    },
    responses: [
      {
        status: 200,
        model: AuthResponseDto,
        type: 'single',
        description: 'Token refreshed successfully',
      },
      {
        status: 401,
        description: 'Invalid refresh token',
      },
    ],
    authentication: false,
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<ApiResponseDto<AuthResponseDto>> {
    const result = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );
    return ApiResponseDto.success(result, 'Token refreshed successfully');
  }

  @Post('logout')
  @ApiSwaggerDocs({
    operation: {
      summary: 'User logout',
      description: 'Logout from current session or all sessions',
    },
    responses: [
      {
        status: 200,
        description: 'Logout successful',
      },
      {
        status: 401,
        description: 'Unauthorized',
      },
    ],
  })
  async logout(@Body() logoutDto: LogoutDto): Promise<ApiResponseDto<null>> {
    await this.authService.logout(logoutDto.refreshToken);
    return ApiResponseDto.success(null, 'Logout successful');
  }
}
