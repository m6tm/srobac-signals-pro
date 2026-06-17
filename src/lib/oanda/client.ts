import type { Candle } from '../strategy/types';

const OANDA_PRACTICE_URL = 'https://api-fxpractice.oanda.com';
const OANDA_LIVE_URL = 'https://api-fxtrade.oanda.com';

export class OandaClient {
  private apiKey: string;
  private accountId: string;
  private baseUrl: string;

  constructor(apiKey: string, accountId: string, environment: 'practice' | 'live' = 'practice') {
    this.apiKey = apiKey;
    this.accountId = accountId;
    this.baseUrl = environment === 'live' ? OANDA_LIVE_URL : OANDA_PRACTICE_URL;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OANDA API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Get current pricing for instruments
   */
  async getPricing(instruments: string[]): Promise<any> {
    const instrumentList = instruments.join(',');
    return this.request(`/v3/accounts/${this.accountId}/pricing?instruments=${encodeURIComponent(instrumentList)}`);
  }

  /**
   * Get historical candles for an instrument
   */
  async getCandles(
    instrument: string,
    granularity: string = 'M30',
    count: number = 200,
    price: 'M' | 'B' | 'A' = 'M'
  ): Promise<Candle[]> {
    const endpoint = `/v3/instruments/${instrument}/candles?granularity=${granularity}&count=${count}&price=${price}`;
    const data = await this.request(endpoint);

    if (!data.candles || !Array.isArray(data.candles)) {
      throw new Error('Invalid candles response from OANDA');
    }

    return data.candles.map((candle: any) => ({
      time: new Date(candle.time).getTime() / 1000,
      open: parseFloat(candle.mid.o),
      high: parseFloat(candle.mid.h),
      low: parseFloat(candle.mid.l),
      close: parseFloat(candle.mid.c),
      volume: candle.volume,
    }));
  }

  /**
   * Get account information
   */
  async getAccount(): Promise<any> {
    return this.request(`/v3/accounts/${this.accountId}`);
  }

  /**
   * Convert pair symbol to OANDA format
   * e.g., "CAD_JPY" -> "CAD_JPY"
   */
  static toOandaFormat(symbol: string): string {
    return symbol.replace('/', '_');
  }
}
