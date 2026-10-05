import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorBody {
  success: false;
  statusCode: number;
  message: string;
  errors?: unknown;
  path: string;
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong. Please try again.';
    let errors: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        const body = res as Record<string, unknown>;
        message = Array.isArray(body.message)
          ? String(body.message[0])
          : String(body.message ?? body.error ?? message);
        errors = body.errors;
      }
    } else if (exception instanceof QueryFailedError) {
      const driverError = (exception as QueryFailedError & { code?: string })
        .driverError as { code?: string } | undefined;
      if (driverError?.code === 'ER_DUP_ENTRY') {
        statusCode = HttpStatus.CONFLICT;
        message = 'A record with the same value already exists.';
      } else {
        this.logger.error(exception.message, exception.stack);
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    const body: ErrorBody = {
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    if (errors) body.errors = errors;

    response.status(statusCode).json(body);
  }
}
