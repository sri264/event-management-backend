import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | StreamableFile
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | StreamableFile> {
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE_KEY, context.getHandler()) ??
      'Success';

    return next
      .handle()
      .pipe(
        map(data =>
          data instanceof StreamableFile
            ? data
            : { success: true as const, message, data: data ?? null },
        ),
      );
  }
}
