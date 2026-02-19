import { HttpErrorMapper } from '../core/filters/http-error-mapper.js';
import {
  InvalidDataError,
  NotFoundError,
  UnauthorizedError,
  UnexpectedError,
  ValidationError,
} from 'domain-lib';
import { LearningResourceNotFoundError } from '@learning-resource/application';
import { HttpStatus } from '@nestjs/common';

describe('HttpErrorMapper', () => {
  describe('map', () => {
    it('should map InvalidDataError to 400 with validation message', () => {
      const error = new InvalidDataError({
        title: 'Title is required',
        difficulty: 'Invalid difficulty',
      });

      const result = HttpErrorMapper.map(error);

      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toEqual({
        title: 'Title is required',
        difficulty: 'Invalid difficulty',
      });
    });

    it('should map NotFoundError to 404 with context', () => {
      const error = new NotFoundError({
        resource: 'LearningResource',
        id: 'some-uuid',
      });

      const result = HttpErrorMapper.map(error);

      expect(result.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe('Resource not found');
      expect(result.errors).toEqual({
        resource: 'LearningResource',
        id: 'some-uuid',
      });
    });

    it('should map LearningResourceNotFoundError to 404', () => {
      const error = new LearningResourceNotFoundError();

      const result = HttpErrorMapper.map(error);

      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('Learning resource not found');
    });

    it('should map UnauthorizedError to 401', () => {
      const error = new UnauthorizedError({ reason: 'Invalid token' });

      const result = HttpErrorMapper.map(error);

      expect(result.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(result.message).toBe('Unauthorized access');
      expect(result.errors).toEqual({
        reason: 'Invalid token',
      });
    });

    it('should map UnexpectedError to 500', () => {
      const error = new UnexpectedError({ details: 'Something went wrong' });

      const result = HttpErrorMapper.map(error);

      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.errors).toEqual({
        details: 'Something went wrong',
      });
    });

    it('should map ValidationError to 400', () => {
      const error = new ValidationError(
        {
          title: 'Title must be at least 3 characters',
          email: 'Email must be valid',
        },
        { title: 'ab', email: 'invalid' },
      );

      const result = HttpErrorMapper.map(error);

      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toEqual({
        title: 'Title must be at least 3 characters',
        email: 'Email must be valid',
      });
    });

    it('should map unknown Error instances to 500', () => {
      const error = new Error('Random error');

      const result = HttpErrorMapper.map(error);

      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.errors).toEqual({
        details: 'Random error',
      });
    });

    it('should map unknown non-Error values to 500', () => {
      const error = 'string error';

      const result = HttpErrorMapper.map(error);

      expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(result.message).toBe('An unexpected error occurred');
      expect(result.errors).toEqual({
        details: 'Unknown error',
      });
    });

    it('should handle error without context', () => {
      const error = new InvalidDataError();

      const result = HttpErrorMapper.map(error);

      expect(result.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toBeUndefined();
    });
  });

  describe('toHttpResponse', () => {
    it('should create complete HTTP response with all required fields', () => {
      const error = new InvalidDataError({ title: 'Required' });
      const path = '/api/learning-resources';

      const response = HttpErrorMapper.toHttpResponse(error, path);

      expect(response).toMatchObject({
        statusCode: 400,
        message: 'Validation failed',
        errors: { title: 'Required' },
        path: '/api/learning-resources',
      });
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });

    it('should include timestamp in ISO format', () => {
      const error = new NotFoundError();
      const response = HttpErrorMapper.toHttpResponse(error, '/api/test');

      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should preserve the request path', () => {
      const error = new InvalidDataError();
      const path = '/api/learning-resources/123/comments';

      const response = HttpErrorMapper.toHttpResponse(error, path);

      expect(response.path).toBe('/api/learning-resources/123/comments');
    });

    it('should work with different error types', () => {
      const errors = [
        new InvalidDataError({ field: 'error' }),
        new NotFoundError({ id: '123' }),
        new UnauthorizedError(),
        new UnexpectedError(),
      ];

      for (const error of errors) {
        const response = HttpErrorMapper.toHttpResponse(error, '/api/test');

        expect(response).toHaveProperty('statusCode');
        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty('timestamp');
        expect(response).toHaveProperty('path');
        expect(typeof response.statusCode).toBe('number');
        expect(typeof response.message).toBe('string');
      }
    });
  });

  /*   describe('error message mapping', () => {
    it('should return default message for unmapped error names', () => {
      class CustomError extends InvalidDataError {
        constructor() {
          super();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          this.name = 'CUSTOM_UNMAPPED_ERROR' as any;
        }
      }

      const error = new CustomError();
      const result = HttpErrorMapper.map(error);

      expect(result.message).toBe('An error occurred');
    });
  }); */
});
