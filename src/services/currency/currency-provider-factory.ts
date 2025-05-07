/**
 * Currency Provider Factory
 * 
 * This factory class manages currency exchange providers and allows
 * dynamically selecting or switching providers at runtime.
 */

import { ExchangeRateProvider } from '@/models/currency/currency.model';
import { 
  ICurrencyProvider,
  CurrencyProviderConfig
} from './currency-provider.interface';
import { ExchangeRateApiProvider } from './exchange-rate-api-provider';

/**
 * Currency provider factory class
 */
export class CurrencyProviderFactory {
  private static instance: CurrencyProviderFactory;
  private providers: Map<ExchangeRateProvider, ICurrencyProvider> = new Map();
  private activeProvider: ExchangeRateProvider | null = null;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CurrencyProviderFactory {
    if (!CurrencyProviderFactory.instance) {
      CurrencyProviderFactory.instance = new CurrencyProviderFactory();
    }
    return CurrencyProviderFactory.instance;
  }
  
  /**
   * Initialize a provider with config
   * 
   * @param provider - Provider type to initialize
   * @param config - Provider configuration
   * @returns The provider instance
   */
  public initializeProvider(provider: ExchangeRateProvider, config: CurrencyProviderConfig): ICurrencyProvider {
    let providerInstance: ICurrencyProvider;
    
    // Create the provider instance based on type
    switch (provider) {
      case ExchangeRateProvider.EXCHANGE_RATE_API:
        providerInstance = new ExchangeRateApiProvider(config);
        break;
      default:
        // Instead of throwing an error for unknown providers, log a warning and fallback to default
        console.warn(`Unknown provider type: ${provider}. Falling back to ExchangeRate-API provider.`);
        providerInstance = new ExchangeRateApiProvider(config);
    }
    
    // Store the provider in the map
    this.providers.set(provider, providerInstance);
    
    // If no active provider is set yet, make this one active
    if (this.activeProvider === null) {
      this.activeProvider = provider;
    }
    
    return providerInstance;
  }
  
  /**
   * Set the active provider
   * 
   * @param provider - Provider type to make active
   * @throws Error if the provider has not been initialized
   */
  public setActiveProvider(provider: ExchangeRateProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} has not been initialized`);
    }
    this.activeProvider = provider;
  }
  
  /**
   * Get the active provider
   * 
   * @returns The active provider instance
   * @throws Error if no providers have been initialized
   */
  public getActiveProvider(): ICurrencyProvider {
    if (this.activeProvider === null || !this.providers.has(this.activeProvider)) {
      throw new Error('No active currency provider available');
    }
    return this.providers.get(this.activeProvider) as ICurrencyProvider;
  }
  
  /**
   * Get a specific provider by type
   * 
   * @param provider - Provider type to get
   * @returns The provider instance
   * @throws Error if the provider has not been initialized
   */
  public getProvider(provider: ExchangeRateProvider): ICurrencyProvider {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} has not been initialized`);
    }
    return this.providers.get(provider) as ICurrencyProvider;
  }
  
  /**
   * Check if a provider has been initialized
   * 
   * @param provider - Provider type to check
   * @returns True if the provider is initialized
   */
  public hasProvider(provider: ExchangeRateProvider): boolean {
    return this.providers.has(provider);
  }
  
  /**
   * Get all initialized providers
   * 
   * @returns Array of provider types that are initialized
   */
  public getAvailableProviders(): ExchangeRateProvider[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Test all initialized providers and select the first working one
   * 
   * @returns Promise resolving to true if a working provider was found
   */
  public async autoSelectProvider(): Promise<boolean> {
    const providers = this.getAvailableProviders();
    
    for (const provider of providers) {
      try {
        const instance = this.getProvider(provider);
        const isWorking = await instance.testConnection();
        
        if (isWorking) {
          this.setActiveProvider(provider);
          return true;
        }
      } catch (error) {
        console.error(`Error testing provider ${provider}:`, error);
      }
    }
    
    return false;
  }
} 