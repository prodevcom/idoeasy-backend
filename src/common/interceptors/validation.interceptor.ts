import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof BadRequestException) {
          const response = error.getResponse() as any;

          if (response.message && Array.isArray(response.message)) {
            // Format validation errors
            const formattedErrors = response.message.map((msg: string) => {
              if (typeof msg === 'string') {
                return msg;
              }
              return 'Validation failed';
            });

            throw new BadRequestException(formattedErrors.join(', '));
          }
        }

        throw error;
      }),
    );
  }
}
