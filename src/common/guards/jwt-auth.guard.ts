import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { SessionsService } from '../../modules/auth/services/sessions.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SESSION_SERVICE } from '../tokens/session.tokens';
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Inject(SESSION_SERVICE) private readonly sessionsService: SessionsService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const activated = (await super.canActivate(context)) as boolean;
    if (!activated) return false;

    // Touch session lastActivity if token present
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined =
      request.headers['authorization'] || request.headers['Authorization'];
    if (authHeader && typeof authHeader === 'string') {
      const [scheme, token] = authHeader.split(' ');
      if (scheme?.toLowerCase() === 'bearer' && token) {
        const { session, user } =
          await this.sessionsService.validateSession(token);
        request.session = session;
        request.currentUser = user;
        request.user = String(user._id);
      }
    }

    return true;
  }
}
