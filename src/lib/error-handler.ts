// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-2026 Datadog, Inc.

/**
 * Error handling for Datadog API interactions
 */

export class DatadogApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiResponse?: any,
    public requestId?: string
  ) {
    super(message);
    this.name = 'DatadogApiError';
  }

  toJSON(): object {
    return {
      error: true,
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      requestId: this.requestId,
      ...(this.apiResponse && { details: this.apiResponse }),
    };
  }
}

export class RateLimitError extends DatadogApiError {
  constructor(
    message: string,
    public retryAfter?: number,
    statusCode?: number
  ) {
    super(message, statusCode);
    this.name = 'RateLimitError';
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
      suggestion: this.retryAfter
        ? `Please wait ${this.retryAfter} seconds before retrying.`
        : 'Please wait before retrying.',
    };
  }
}

export class AuthenticationError extends DatadogApiError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      suggestion:
        'Please check your DD_API_KEY and DD_APP_KEY environment variables. ' +
        'You can find your keys at https://app.datadoghq.com/account/settings#api',
    };
  }
}

export class PermissionError extends DatadogApiError {
  constructor(message: string) {
    super(message, 403);
    this.name = 'PermissionError';
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      suggestion:
        'Your API or Application key may not have sufficient permissions for this operation. ' +
        'Please check the required scopes at https://docs.datadoghq.com/account_management/api-app-keys/',
    };
  }
}

export class NotFoundError extends DatadogApiError {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Error handler for Datadog API calls
 */
export class ErrorHandler {
  /**
   * Handles errors from Datadog API calls and converts them to appropriate error types
   * @param error The error to handle
   * @throws {DatadogApiError} A structured error with appropriate type
   */
  static handle(error: any): never {
    // Handle HTTP response errors from the Datadog client
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      const data = error.response.data;
      const requestId = error.response.headers?.['x-ratelimit-reset'];

      // Extract error message from response
      let message = `Datadog API Error: ${statusText}`;
      if (data?.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map((e: any) => e.detail || e.title).filter(Boolean);
        if (errorMessages.length > 0) {
          message = errorMessages.join('; ');
        }
      } else if (data?.error) {
        message = data.error;
      }

      // Map status codes to specific error types
      switch (status) {
        case 401:
          throw new AuthenticationError(message);
        case 403:
          throw new PermissionError(message);
        case 404:
          throw new DatadogApiError(message, 404, data, requestId);
        case 429:
          const retryAfter = error.response.headers?.['x-ratelimit-reset']
            ? parseInt(error.response.headers['x-ratelimit-reset'])
            : undefined;
          throw new RateLimitError(message, retryAfter, 429);
        default:
          throw new DatadogApiError(message, status, data, requestId);
      }
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new DatadogApiError(
        'Cannot connect to Datadog API. Please check your DD_SITE configuration and network connection.',
        undefined,
        { code: error.code }
      );
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      throw new DatadogApiError(
        'Request to Datadog API timed out. Please try again.',
        undefined,
        { code: error.code }
      );
    }

    // Handle generic errors
    if (error instanceof Error) {
      throw new DatadogApiError(error.message);
    }

    // Handle unknown errors
    throw new DatadogApiError('An unknown error occurred', undefined, error);
  }

  /**
   * Formats an error for output
   * @param error The error to format
   * @returns A formatted error string
   */
  static format(error: Error): string {
    if (error instanceof DatadogApiError) {
      return JSON.stringify(error.toJSON(), null, 2);
    }
    return JSON.stringify(
      {
        error: true,
        name: error.name,
        message: error.message,
      },
      null,
      2
    );
  }
}
