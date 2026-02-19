import {
  BaseError,
  InvalidDataError,
  NotFoundError,
  UnauthorizedError,
  UnexpectedError,
  ValidationError,
} from 'domain-lib';
import { LearningResourceNotFoundError } from '@learning-resource/application';
import { HttpStatus } from '@nestjs/common';

export interface HttpErrorResponse {
  statusCode: number;
  message: string;
  errors?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

export interface MappedError {
  statusCode: number;
  message: string;
  errors?: Record<string, unknown>;
}

/**
 * Maps domain/application errors to HTTP errors.
 * Automatically converts domain or application errors to the appropriate HTTP format,
 * maintaining consistency in responses.
 *
 * @example
 * // Map a domain error
 * const error = new InvalidDataError({ title: 'Title is required' });
 * const mapped = HttpErrorMapper.map(error);
 * // mapped = { statusCode: 400, message: 'Validation failed', errors: { title: 'Title is required' } }
 *
 * @example
 * // Create complete HTTP response
 * const response = HttpErrorMapper.toHttpResponse(error, '/api/resources');
 * // response includes statusCode, message, errors, timestamp, and path
 */
export class HttpErrorMapper {
  /**
   * @param error - Error to map (can be BaseError, ValidationError, or any other type)
   * @returns Mapped error with statusCode, message, and errors
   */
  static map(error: unknown): MappedError {
    // Domain/application errors (BaseError)
    if (error instanceof BaseError) {
      return this.mapDomainError(error);
    }

    // Validation errors
    if (error instanceof ValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: error.errors,
      };
    }

    // Unknown errors
    return this.mapUnknownError(error);
  }

  /**
   * Maps errors that inherit from BaseError.
   * Domain errors already include the appropriate statusCode, we just need to extract and format the information.
   *
   * @param error - Domain/application error
   * @returns Mapped error
   */
  private static mapDomainError(error: BaseError): MappedError {
    // StatusCode is already defined in BaseError
    const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.getErrorMessage(error);
    const errors = error.context;

    return {
      statusCode,
      message,
      errors,
    };
  }

  /**
   * Gets the appropriate message based on error type.
   *
   * @param error - Domain/application error
   * @returns Descriptive error message
   */
  private static getErrorMessage(error: BaseError): string {
    // Custom messages by error type
    const messageMap: Record<string, string> = {
      INVALID_DATA_ERROR: 'Validation failed',
      NOT_FOUND_ERROR: 'Resource not found',
      UNAUTHORIZED_ERROR: 'Unauthorized access',
      UNEXPECTED_ERROR: 'An unexpected error occurred',
      LEARNING_RESOURCE_NOT_FOUND_ERROR: 'Learning resource not found',
      VALIDATION_ERROR: 'Validation failed',
    };

    return messageMap[error.name] || 'An error occurred';
  }

  /**
   * Maps unknown errors to HTTP 500.
   *
   * @param error - Unknown error
   * @returns Error mapped as 500 Internal Server Error
   */
  private static mapUnknownError(error: unknown): MappedError {
    // Logs error for debugging (in production, this should use a proper logger)
    console.error('Unknown error:', error);

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      errors: {
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }

  /**
   * Creates the complete HTTP response with all required fields.
   *
   * @param error - Error to convert
   * @param path - Request path that generated the error
   * @returns Complete HTTP response ready to return to client
   */
  static toHttpResponse(error: unknown, path: string): HttpErrorResponse {
    const mapped = this.map(error);

    return {
      statusCode: mapped.statusCode,
      message: mapped.message,
      errors: mapped.errors,
      timestamp: new Date().toISOString(),
      path,
    };
  }
}
