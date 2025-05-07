/**
 * Error Service
 * 
 * This file provides centralized error handling functionality.
 * Following the Single Responsibility Principle, this file only handles
 * error management and reporting.
 */

/**
 * Custom error types for domain-specific errors
 */
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  UNEXPECTED = 'unexpected'
}

/**
 * Structured error object for consistent error handling
 */
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  originalError?: unknown;
}

/**
 * Error tracking options
 */
interface ErrorTrackingOptions {
  /** Whether to log the error to console */
  logToConsole?: boolean;
  /** Whether to report the error to a monitoring service */
  reportToMonitoring?: boolean;
}

/**
 * Default options for error tracking
 */
const defaultOptions: ErrorTrackingOptions = {
  logToConsole: true,
  reportToMonitoring: true
};

/**
 * Handle and track an error
 * 
 * @param error - The error to handle
 * @param options - Options for error tracking
 */
export const handleError = (error: AppError | Error | unknown, options: ErrorTrackingOptions = {}): AppError => {
  const combinedOptions = { ...defaultOptions, ...options };
  
  // Convert to AppError if not already
  const appError = convertToAppError(error);
  
  // Log to console if enabled
  if (combinedOptions.logToConsole) {
    logError(appError);
  }
  
  // Report to monitoring service if enabled
  if (combinedOptions.reportToMonitoring) {
    reportError(appError);
  }
  
  return appError;
};

/**
 * Convert any error to a structured AppError
 * 
 * @param error - The error to convert
 * @returns A structured AppError object
 */
const convertToAppError = (error: unknown): AppError => {
  // If it's already an AppError, return it as is
  if (typeof error === 'object' && error !== null && 'type' in error && 'message' in error) {
    return error as AppError;
  }
  
  // If it's a standard Error object
  if (error instanceof Error) {
    // Try to determine error type from message or stack
    let type = ErrorType.UNEXPECTED;
    
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      type = ErrorType.PERMISSION;
    } else if (error.message.includes('network') || error.message.includes('connection')) {
      type = ErrorType.NETWORK;
    } else if (error.message.includes('auth') || error.message.includes('login')) {
      type = ErrorType.AUTHENTICATION;
    } else if (error.message.includes('database') || error.message.includes('firestore')) {
      type = ErrorType.DATABASE;
    } else if (error.message.includes('valid') || error.message.includes('required')) {
      type = ErrorType.VALIDATION;
    }
    
    return {
      type,
      message: error.message,
      originalError: error
    };
  }
  
  // For string errors
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNEXPECTED,
      message: error
    };
  }
  
  // For anything else
  return {
    type: ErrorType.UNEXPECTED,
    message: 'An unexpected error occurred',
    originalError: error
  };
};

/**
 * Log an error to the console
 * 
 * @param error - The error to log
 */
const logError = (error: AppError): void => {
  console.error(`[${error.type.toUpperCase()}] ${error.message}`, error.originalError || '');
};

/**
 * Report an error to a monitoring service
 * 
 * @param error - The error to report
 */
const reportError = (error: AppError): void => {
  // In production, this would send to a service like Sentry, LogRocket, etc.
  // For now, we're just logging to console in a different format
  if (process.env.NODE_ENV === 'production') {
    console.log(`[ERROR REPORTING] Would report error to monitoring service: ${error.type} - ${error.message}`);
    // Example implementation:
    // monitoringService.captureError({
    //   type: error.type,
    //   message: error.message,
    //   code: error.code,
    //   originalError: error.originalError
    // });
  }
};

/**
 * Create an error object with the specified type and message
 * 
 * @param type - The type of error
 * @param message - The error message
 * @param code - Optional error code
 * @param originalError - Optional original error
 * @returns A structured AppError object
 */
export const createError = (
  type: ErrorType,
  message: string,
  code?: string,
  originalError?: unknown
): AppError => {
  return {
    type,
    message,
    code,
    originalError
  };
};

/**
 * Common error messages for reuse
 */
export const ErrorMessages = {
  NETWORK: {
    OFFLINE: 'You appear to be offline. Please check your connection.',
    TIMEOUT: 'The request timed out. Please try again.'
  },
  AUTH: {
    REQUIRED: 'You must be logged in to perform this action.',
    INVALID: 'Invalid login credentials.',
    EXPIRED: 'Your session has expired. Please log in again.'
  },
  DATABASE: {
    READ_FAILED: 'Failed to retrieve data. Please try again.',
    WRITE_FAILED: 'Failed to save data. Please try again.',
    NOT_FOUND: 'The requested data could not be found.'
  },
  PERMISSION: {
    DENIED: 'You do not have permission to perform this action.'
  }
};

/**
 * Handle Firebase errors by converting them to AppErrors
 * 
 * @param error - The Firebase error to handle
 * @returns A structured AppError object
 */
export const handleFirebaseError = (error: unknown): AppError => {
  // Firebase auth errors typically have a code property
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    const fbError = error as { code: string; message?: string };
    
    // Auth errors
    if (fbError.code.startsWith('auth/')) {
      return createError(
        ErrorType.AUTHENTICATION,
        fbError.message || `Authentication error: ${fbError.code}`,
        fbError.code,
        error
      );
    }
    
    // Firestore errors
    if (fbError.code.startsWith('firestore/')) {
      return createError(
        ErrorType.DATABASE,
        fbError.message || `Database error: ${fbError.code}`,
        fbError.code,
        error
      );
    }
    
    // Storage errors
    if (fbError.code.startsWith('storage/')) {
      return createError(
        ErrorType.PERMISSION,
        fbError.message || `Storage error: ${fbError.code}`,
        fbError.code,
        error
      );
    }
  }
  
  // For any other Firebase errors
  return convertToAppError(error);
}; 