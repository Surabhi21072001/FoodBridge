/**
 * Response Utility Functions
 * Standardized response helpers for API endpoints
 */

import { Response } from 'express';

export interface SuccessResponse {
  success: true;
  data: any;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}

/**
 * Send a successful response
 */
export function sendSuccess(
  res: Response,
  statusCode: number,
  message: string,
  data?: any
): void {
  const response: any = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  error?: string
): void {
  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  res.status(statusCode).json(response);
}

/**
 * Send a successful response (alternative signature)
 */
export function successResponse(
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a paginated response
 */
export function paginatedResponse(
  res: Response,
  data: any[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Success',
  statusCode: number = 200
): void {
  const total_pages = Math.ceil(total / limit);
  
  res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      total_pages,
    },
  });
}
