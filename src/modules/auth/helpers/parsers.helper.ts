import { SessionInfo, User } from '@entech/contracts';
import { plainToInstance } from 'class-transformer';
import { SessionResponseDto } from '../dto/session-response.dto';

/**
 * Parse the auth response
 *
 * @param session - The session
 * @param user - The user
 * @returns The auth response
 */
export const parseAuthResponse = (session: SessionInfo, user: User) => {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    tokenType: 'Bearer',
    expiresAt: session.expiresAt.getTime(),
    user,
  };
};

/**
 * Parse the session response
 *
 * @param session - The session
 * @returns The session response
 */
export const parseSessionResponse = (session: SessionInfo) => {
  return plainToInstance(SessionResponseDto, session, {
    excludeExtraneousValues: true,
  });
};
