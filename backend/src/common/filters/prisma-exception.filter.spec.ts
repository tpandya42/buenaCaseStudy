import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as any;
  });

  describe('PrismaClientKnownRequestError', () => {
    it('should handle P2002 (unique constraint) as CONFLICT', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', meta: { target: ['email'] }, clientVersion: '5.0.0' },
      );

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Unique constraint violation'),
      });
    });

    it('should handle P2025 (record not found) as NOT_FOUND', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '5.0.0' },
      );

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Record not found',
      });
    });

    it('should handle P2003 (FK constraint) as BAD_REQUEST', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.0.0' },
      );

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Foreign key constraint failed',
      });
    });

    it('should handle unknown error codes as INTERNAL_SERVER_ERROR', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Some error',
        { code: 'P9999', clientVersion: '5.0.0' },
      );

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  });

  describe('PrismaClientInitializationError', () => {
    it('should return SERVICE_UNAVAILABLE', () => {
      const error = new Prisma.PrismaClientInitializationError(
        'Connection refused',
        '5.0.0',
      );

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Database connection failed' }),
      );
    });
  });

  describe('PrismaClientValidationError', () => {
    it('should return BAD_REQUEST', () => {
      const error = new Prisma.PrismaClientValidationError('Invalid field', {
        clientVersion: '5.0.0',
      });

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid query' }),
      );
    });
  });
});
