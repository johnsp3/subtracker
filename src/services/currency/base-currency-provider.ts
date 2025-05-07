/**
 * Base Currency Provider
 * 
 * Abstract base class that implements common functionality for all currency providers,
 * including retry logic, caching, and error handling.
 */

import { 
  CurrencyCode,
  ExchangeRateResult,
  CurrencyConversionResult,
  ExchangeRateProvider,
  ExchangeRateCache,
  CurrencyErrorType
} from '@/models/currency/currency.model';

import {
  ICurrencyProvider,
  CurrencyProviderConfig,
  DEFAULT_PROVIDER_CONFIG
} from './currency-provider.interface';

import { 
  ErrorType, 
  createError, 
  handleError 
} from '@/services/error/error.service';

/**
 * Abstract base class for currency providers
 */
export abstract class BaseCurrencyProvider implements ICurrencyProvider {
  /** The provider type */
  abstract readonly provider: ExchangeRateProvider;
  
  /** Configuration for this provider */
  protected config: CurrencyProviderConfig;
  
  /** In-memory cache for exchange rates */
  private rateCache: Map<string, ExchangeRateCache> = new Map();
  
  /**
   * Constructor for the base provider
   * 
   * @param config - Provider configuration
   */
  constructor(config: CurrencyProviderConfig) {
    this.config = {
      ...DEFAULT_PROVIDER_CONFIG,
      ...config
    };
  }
  
  /**
   * Get the latest exchange rates for a base currency
   * 
   * @param base - Base currency code
   * @param symbols - Optional specific currencies to get rates for
   * @returns Promise with exchange rate result
   */
  async getLatestRates(base: CurrencyCode, symbols?: CurrencyCode[]): Promise<ExchangeRateResult> {
    // Create a cache key based on the request parameters
    const cacheKey = this.createCacheKey(base, symbols);
    
    // Check if we have a valid cached result
    const cachedResult = this.getCachedRates(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // If not in cache, fetch from API with retry logic
    try {
      const result = await this.executeWithRetry(() => this.fetchLatestRates(base, symbols));
      
      // Cache the result before returning
      this.cacheRates(cacheKey, result);
      
      return result;
    } catch (error) {
      // Transform and rethrow the error
      throw this.handleProviderError(error);
    }
  }
  
  /**
   * Convert an amount from one currency to another
   * 
   * @param amount - Amount to convert
   * @param from - Source currency code
   * @param to - Target currency code
   * @returns Promise with conversion result
   */
  async convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): Promise<CurrencyConversionResult> {
    try {
      // If currencies are the same, return immediately
      if (from === to) {
        return {
          amount,
          from,
          to,
          convertedAmount: amount,
          rate: 1,
          date: new Date().toISOString(),
          provider: this.provider
        };
      }
      
      // Get the latest rates using the 'from' currency as base
      const rates = await this.getLatestRates(from, [to]);
      
      // Calculate the converted amount
      const rate = rates.rates[to];
      if (!rate) {
        throw createError(
          ErrorType.VALIDATION,
          `Currency ${to} not found in exchange rates`,
          CurrencyErrorType.UNSUPPORTED_CURRENCY
        );
      }
      
      const convertedAmount = amount * rate;
      
      return {
        amount,
        from,
        to,
        convertedAmount,
        rate,
        date: rates.date,
        provider: this.provider
      };
    } catch (error) {
      throw this.handleProviderError(error);
    }
  }
  
  /**
   * Abstract method to be implemented by specific providers
   * for fetching the latest exchange rates
   */
  protected abstract fetchLatestRates(base: CurrencyCode, symbols?: CurrencyCode[]): Promise<ExchangeRateResult>;
  
  /**
   * Abstract method to check if the provider is available and API key is valid
   */
  abstract testConnection(): Promise<boolean>;
  
  /**
   * Create a cache key from request parameters
   */
  private createCacheKey(base: CurrencyCode, symbols?: CurrencyCode[]): string {
    return `${this.provider}_${base}_${symbols ? symbols.sort().join('_') : 'all'}`;
  }
  
  /**
   * Retrieve cached rates if available and not expired
   */
  private getCachedRates(cacheKey: string): ExchangeRateResult | null {
    const cached = this.rateCache.get(cacheKey);
    
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < cached.ttl) {
        return cached.data;
      } else {
        // Remove expired cache entry
        this.rateCache.delete(cacheKey);
      }
    }
    
    return null;
  }
  
  /**
   * Cache exchange rate results
   */
  private cacheRates(cacheKey: string, data: ExchangeRateResult): void {
    this.rateCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTtl as number
    });
  }
  
  /**
   * Execute a function with exponential backoff retry
   */
  protected async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= (this.config.maxRetries as number); attempt++) {
      try {
        // Attempt to execute the function
        return await this.executeWithTimeout(fn);
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (only network/server errors)
        if (this.isClientError(error)) {
          throw error;
        }
        
        // If this was the last attempt, throw the error
        if (attempt >= (this.config.maxRetries as number)) {
          throw error;
        }
        
        // Calculate backoff delay using exponential backoff with jitter
        const delay = this.calculateBackoffDelay(attempt);
        
        // Wait before the next retry
        await this.wait(delay);
      }
    }
    
    // This should never happen as the loop should either return or throw
    throw lastError;
  }
  
  /**
   * Execute a function with a timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(createError(
          ErrorType.NETWORK,
          'Request timed out',
          CurrencyErrorType.NETWORK_ERROR
        ));
      }, this.config.timeout);
    });
    
    return Promise.race([fn(), timeoutPromise]);
  }
  
  /**
   * Calculate the backoff delay for retries with exponential backoff
   */
  private calculateBackoffDelay(attempt: number): number {
    const initialDelay = this.config.initialRetryDelay as number;
    const maxDelay = this.config.maxRetryDelay as number;
    
    // Exponential backoff: initialDelay * 2^attempt
    const exponentialDelay = initialDelay * Math.pow(2, attempt);
    
    // Add jitter: random value between 0 and 1 * 1000ms
    const jitter = Math.random() * 1000;
    
    // Cap at maxDelay
    return Math.min(exponentialDelay + jitter, maxDelay);
  }
  
  /**
   * Wait for a specified duration
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Determine if an error is a client error (e.g., bad API key)
   * rather than a transient network/server error
   */
  private isClientError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const errorCode = (error as { code?: string }).code;
      
      // These are client-side errors that won't be resolved by retrying
      return [
        CurrencyErrorType.INVALID_API_KEY,
        CurrencyErrorType.INVALID_BASE_CURRENCY,
        CurrencyErrorType.UNSUPPORTED_CURRENCY
      ].includes(errorCode as CurrencyErrorType);
    }
    
    return false;
  }
  
  /**
   * Handle and transform provider errors
   */
  protected handleProviderError(error: unknown): Error {
    // If it's already an Error instance, just return it
    if (error instanceof Error) {
      return error;
    }
    
    // Create a proper Error from the AppError
    const appError = handleError(createError(
      ErrorType.NETWORK,
      'Currency exchange service unavailable',
      CurrencyErrorType.NETWORK_ERROR,
      error
    ));
    
    // Convert AppError to a standard Error object
    const standardError = new Error(appError.message);
    standardError.name = appError.type;
    
    return standardError;
  }
} 