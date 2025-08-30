import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    // --- 1) DUPLICATE KEY (MongoDB/Mongoose) ---
    const maybeMongo: any = exception;
    if (
      maybeMongo &&
      (maybeMongo.code === 11000 ||
        (typeof maybeMongo.message === 'string' &&
          maybeMongo.message.includes('E11000 duplicate key error')))
    ) {
      status = HttpStatus.CONFLICT;

      let field = 'resource';
      let value: unknown = undefined;

      if (maybeMongo.keyValue && typeof maybeMongo.keyValue === 'object') {
        const [k] = Object.keys(maybeMongo.keyValue);
        field = k ?? field;
        value = maybeMongo.keyValue?.[k];
      } else if (typeof maybeMongo.message === 'string') {
        const m = maybeMongo.message.match(
          /dup key:\s*\{\s*([^:]+):\s*"([^"]+)"\s*\}/,
        );
        if (m) {
          field = m[1].trim();
          value = m[2];
        }
      }

      let safeValue: string | undefined;

      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        safeValue = String(value);
      } else if (value && typeof value === 'object') {
        try {
          safeValue = JSON.stringify(value);
        } catch {
          safeValue = undefined;
        }
      }

      //`${field} already exists${safeValue ? `: ${safeValue}` : ''}`,
      this.logger.debug(`${field} already exists`, safeValue);
      message = [`${field} already exists`] as string[];
    }

    // --- 2) HTTP EXCEPTIONS (Nest) ---
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const messages = (exceptionResponse as any).message;
        message = Array.isArray(messages) ? messages : String(messages);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log
    this.logger.error(
      `Exception occurred: ${Array.isArray(message) ? message.join(', ') : message}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        path: request.url,
        method: request.method,
        status,
        timestamp: new Date().toISOString(),
      },
    );

    const normalized = Array.isArray(message) ? message.join(', ') : message;

    const errorResponse = {
      success: false,
      path: request.url,
      message: normalized,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json({
      status: errorResponse,
      error: 'An error occurred while processing your request',
    });
  }
}
