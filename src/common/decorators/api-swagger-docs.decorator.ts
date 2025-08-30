import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiProduces,
  ApiProperty,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ListResponseWrapper,
  ResponseWrapper,
  StatusInfo,
} from '../dto/response-wrapper.dto';

type ResponseType = 'single' | 'list';

interface ValidationError {
  field: string;
  errors: string[];
}

class StatusError {
  @ApiProperty({ example: 'error' })
  message: string;
}

export class DefaultErrorResponse {
  @ApiProperty({ type: StatusError })
  status: StatusError;

  @ApiProperty({ example: 'Error message or validation errors' })
  error: string | ValidationError[];
}

interface WrappedApiResponse<TModel extends Type<any>> {
  status: number;
  model?: TModel;
  type?: ResponseType;
  description?: string;
}

interface WrappedApiOperation<TModel extends Type<any>> {
  operation?: {
    summary: string;
    description?: string;
    deprecated?: boolean;
    tags?: string[];
  };
  responses: WrappedApiResponse<TModel>[];
  authentication?: boolean;
}

export function ApiSwaggerDocs<TModel extends Type<any>>(
  config: WrappedApiOperation<TModel>,
) {
  const decorators: MethodDecorator[] = [];

  // Apply ApiOperation if provided
  if (config.operation) {
    decorators.push(ApiOperation(config.operation));
  }

  // Add response wrappers
  config.responses.forEach((resp) => {
    const wrapper =
      resp.type === 'list' ? ListResponseWrapper : ResponseWrapper;

    // Add produces decorator
    decorators.push(ApiProduces('application/json'));

    // Add extra models decorator
    decorators.push(ApiExtraModels(wrapper, resp.model ?? StatusInfo));

    // Add response decorator
    decorators.push(
      ApiResponse({
        status: resp.status,
        description: resp.description ?? 'Successful response',
        schema:
          resp.status >= 400
            ? { $ref: getSchemaPath(DefaultErrorResponse) }
            : {
                allOf: [
                  { $ref: getSchemaPath(wrapper) },
                  {
                    properties: {
                      data: resp.model
                        ? resp.type === 'list'
                          ? {
                              type: 'array',
                              items: { $ref: getSchemaPath(resp.model) },
                            }
                          : { $ref: getSchemaPath(resp.model) }
                        : {},
                    },
                  },
                ],
              },
      }),
    );

    if (resp.status >= 400) {
      decorators.push(ApiExtraModels(DefaultErrorResponse));
    }

    // Add authentication decorator and standardized 403 if secured
    if (config.authentication ?? true) {
      decorators.push(ApiBearerAuth('JWT-auth'));
      decorators.push(
        ApiResponse({
          status: 403,
          description: 'Forbidden - Insufficient permissions',
          schema: { $ref: getSchemaPath(DefaultErrorResponse) },
        }),
      );
    }
  });

  return applyDecorators(...decorators);
}
