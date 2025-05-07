# Currency Exchange Service

This module provides a robust and flexible currency exchange service that allows the application to fetch exchange rates and perform currency conversions. It's designed with fail-safe mechanisms, caching, and support for multiple providers.

## Features

- 🔄 **Multiple Providers Support**: Easily switch between Fixer.io and ExchangeRate-API
- 🔒 **Graceful Error Handling**: Clear error classification and recovery mechanisms
- 🔁 **Automatic Retry Logic**: Exponential backoff for transient network failures
- ⚡ **Request Caching**: Minimize redundant API calls with in-memory caching
- ⏱️ **Timeout Controls**: Prevent stale requests from blocking the UI
- 🔌 **Provider Fallback**: Automatic fallback to alternate providers when one fails

## Architecture

The currency service follows clean architecture principles:

1. **Models**: Define data structures and types (`/models/currency/currency.model.ts`)
2. **Provider Interface**: Contract for all exchange rate providers (`currency-provider.interface.ts`)
3. **Base Provider**: Abstract class with shared functionality (`base-currency-provider.ts`)
4. **Concrete Providers**: Implementations for specific APIs
   - Fixer.io (`fixer-provider.ts`)
   - ExchangeRate-API (`exchange-rate-api-provider.ts`)
5. **Provider Factory**: Manages provider instances (`currency-provider-factory.ts`)
6. **Currency Service**: Main facade for the application (`currency.service.ts`)
7. **View Model**: Decouples UI from service implementation (`currency.viewmodel.ts`)

## Usage Examples

### Initialize the service

```typescript
import { 
  initializeCurrencyService, 
  ExchangeRateProvider 
} from '@/services/currency/currency.service';

// Initialize with one or more providers
await initializeCurrencyService({
  [ExchangeRateProvider.FIXER]: { apiKey: 'your-fixer-api-key' },
  [ExchangeRateProvider.EXCHANGE_RATE_API]: { apiKey: 'your-exchangerate-api-key' }
});
```

### Get exchange rates

```typescript
import { getLatestExchangeRates } from '@/services/currency/currency.service';

// Get all exchange rates for EUR
const allRates = await getLatestExchangeRates('EUR');

// Get specific exchange rates
const specificRates = await getLatestExchangeRates('USD', ['EUR', 'GBP', 'JPY']);

// Use a specific provider
const fixerRates = await getLatestExchangeRates('EUR', undefined, ExchangeRateProvider.FIXER);
```

### Convert currency

```typescript
import { convertCurrency } from '@/services/currency/currency.service';

// Convert 100 EUR to USD
const result = await convertCurrency(100, 'EUR', 'USD');
console.log(`100 EUR = ${result.convertedAmount} USD (rate: ${result.rate})`);
```

### Change the active provider

```typescript
import { 
  setActiveCurrencyProvider, 
  ExchangeRateProvider 
} from '@/services/currency/currency.service';

// Switch to ExchangeRate-API
setActiveCurrencyProvider(ExchangeRateProvider.EXCHANGE_RATE_API);
```

### Use with React components (via view model)

```typescript
import { useCurrencyViewModel } from '@/viewmodels/currency/currency.viewmodel';

function PriceConverter() {
  const { 
    loading, 
    error, 
    convert,
    clearError 
  } = useCurrencyViewModel();
  
  const [amount, setAmount] = useState(100);
  const [from, setFrom] = useState('EUR');
  const [to, setTo] = useState('USD');
  const [result, setResult] = useState(null);
  
  const handleConvert = async () => {
    const conversion = await convert(amount, from, to);
    if (conversion) {
      setResult(conversion);
    }
  };
  
  // Show error if any
  useEffect(() => {
    if (error) {
      alert(error);
      clearError();
    }
  }, [error, clearError]);
  
  return (
    <div>
      {/* Form elements here */}
      <button onClick={handleConvert} disabled={loading}>
        {loading ? 'Converting...' : 'Convert'}
      </button>
      
      {result && (
        <div>
          {amount} {from} = {result.convertedAmount.toFixed(2)} {to}
        </div>
      )}
    </div>
  );
}
```

## Error Handling

The service has comprehensive error handling:

1. **Provider-specific errors** are mapped to standardized error types
2. **Network errors** trigger automatic retries with exponential backoff
3. **Validation errors** provide clear messages about what went wrong
4. **API rate limiting** is handled gracefully with provider fallback

## Configuration Options

The service can be configured with several options:

- `cacheTtl`: How long to cache exchange rate results (default: 1 hour)
- `maxRetries`: Maximum number of retry attempts for failed requests (default: 3)
- `initialRetryDelay`: Initial delay for exponential backoff (default: 1 second)
- `maxRetryDelay`: Maximum delay between retries (default: 30 seconds)
- `timeout`: Request timeout in milliseconds (default: 10 seconds)

Example:

```typescript
await initializeCurrencyService({
  [ExchangeRateProvider.FIXER]: { 
    apiKey: 'your-api-key',
    cacheTtl: 30 * 60 * 1000, // 30 minutes
    maxRetries: 5,
    timeout: 5000 // 5 seconds
  }
});
``` 