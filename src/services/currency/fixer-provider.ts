/**
 * Fixer.io Currency Provider
 * 
 * Concrete implementation of the currency provider interface for Fixer.io API.
 */

import { 
  CurrencyCode, 
  ExchangeRateResult, 
  ExchangeRateProvider,
  CurrencyErrorType
} from '@/models/currency/currency.model';

import { 
  CurrencyProviderConfig 
} from './currency-provider.interface';

import { BaseCurrencyProvider } from './base-currency-provider';
import { ErrorType, createError } from '@/services/error/error.service';

/**
 * Fixer.io API response interface
 */
interface FixerApiResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: { [key: string]: number };
  error?: {
    code: string;
    type: string;
    info: string;
  };
}

/**
 * Default Fixer.io API configuration
 */
const DEFAULT_FIXER_CONFIG: Partial<CurrencyProviderConfig> = {
  baseUrl: 'https://data.fixer.io/api'
};

/**
 * Fixer.io currency provider implementation
 */
export class FixerProvider extends BaseCurrencyProvider {
  readonly provider = ExchangeRateProvider.FIXER;
  
  /**
   * Constructor for the Fixer provider
   * 
   * @param config - Provider configuration with API key
   */
  constructor(config: CurrencyProviderConfig) {
    super({
      ...DEFAULT_FIXER_CONFIG,
      ...config
    });
  }
  
  /**
   * Fetch the latest exchange rates from Fixer.io
   * 
   * @param base - Base currency code
   * @param symbols - Optional specific currencies to get rates for
   * @returns Promise with exchange rate result
   */
  protected async fetchLatestRates(base: CurrencyCode, symbols?: CurrencyCode[]): Promise<ExchangeRateResult> {
    // Build request URL
    let url = `${this.config.baseUrl}/latest?access_key=${this.config.apiKey}&base=${base}`;
    
    // Add symbols if provided
    if (symbols && symbols.length > 0) {
      url += `&symbols=${symbols.join(',')}`;
    }
    
    try {
      // Fetch data from Fixer.io
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw createError(
          ErrorType.NETWORK,
          `Fixer API returned ${response.status} ${response.statusText}`,
          CurrencyErrorType.PROVIDER_ERROR
        );
      }
      
      const data: FixerApiResponse = await response.json();
      
      // Check for API-level errors
      if (!data.success) {
        this.handleFixerError(data.error);
      }
      
      // Transform the response to our standard format
      return {
        base: data.base,
        date: data.date,
        rates: data.rates,
        provider: this.provider,
        timestamp: data.timestamp * 1000 // Convert to milliseconds
      };
    } catch (error) {
      // For any fetch errors, transform them
      if (!(error instanceof Error) || !('type' in error)) {
        throw this.handleProviderError(error);
      }
      throw error;
    }
  }
  
  /**
   * Test the connection to Fixer.io API
   * 
   * @returns Promise resolving to true if connection works
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch EUR/USD as a simple test
      await this.getLatestRates('EUR', ['USD']);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Handle Fixer.io specific error responses
   * 
   * @param error - Fixer API error object
   */
  private handleFixerError(error?: FixerApiResponse['error']): never {
    if (!error) {
      throw createError(
        ErrorType.UNEXPECTED,
        'Unknown Fixer API error',
        CurrencyErrorType.PROVIDER_ERROR
      );
    }
    
    switch (error.code) {
      case '101':
        throw createError(
          ErrorType.AUTHENTICATION,
          'Invalid Fixer API access key',
          CurrencyErrorType.INVALID_API_KEY,
          error
        );
      
      case '105':
        throw createError(
          ErrorType.VALIDATION,
          'Invalid base currency',
          CurrencyErrorType.INVALID_BASE_CURRENCY,
          error
        );
      
      case '201':
        throw createError(
          ErrorType.VALIDATION,
          'Invalid currency symbols',
          CurrencyErrorType.UNSUPPORTED_CURRENCY,
          error
        );
        
      case '104':
        throw createError(
          ErrorType.PERMISSION,
          'Your subscription plan doesn\'t support this API endpoint',
          CurrencyErrorType.PROVIDER_ERROR,
          error
        );
        
      case '103':
        throw createError(
          ErrorType.VALIDATION,
          'Your subscription plan doesn\'t support this base currency',
          CurrencyErrorType.INVALID_BASE_CURRENCY,
          error
        );
      
      case '429':
        throw createError(
          ErrorType.PERMISSION,
          'You have exceeded your API request quota',
          CurrencyErrorType.RATE_LIMIT_EXCEEDED,
          error
        );
          
      default:
        throw createError(
          ErrorType.UNEXPECTED,
          error.info || 'Fixer API error',
          CurrencyErrorType.PROVIDER_ERROR,
          error
        );
    }
  }
} 