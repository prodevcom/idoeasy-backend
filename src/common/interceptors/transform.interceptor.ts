import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    return next.handle().pipe(
      map((data) => {
        // If data is already an ApiResponseDto, update the path and return
        if (data instanceof ApiResponseDto) {
          data.status.path = path;
          return data;
        }

        // If data is null or undefined, return error response
        if (data === null || data === undefined) {
          return ApiResponseDto.error('No data found', path);
        }

        // Transform data to ApiResponseDto
        return ApiResponseDto.success(data, 'Success', path);
      }),
    );
  }
}
