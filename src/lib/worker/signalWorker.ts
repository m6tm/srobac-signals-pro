import { OandaClient } from '../oanda/client';
import { TelegramClient } from '../telegram/client';
import { detectSROBACSignal, checkSignalStatus, isJanuaryPause, calculateEMA } from '../strategy/srobac';
import { PAIR_CONFIGS } from '../strategy/types';
import type { Candle, SROBACSignal } from '../strategy/types';

export class SignalWorker {
  private oanda: OandaClient;
  private telegram: TelegramClient | null = null;
  private activeSignals: Map<string, SROBACSignal> = new Map();
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number = 5000; // 5 seconds

  constructor(
    oandaApiKey: string,
    oandaAccountId: string,
    oandaEnvironment: 'practice' | 'live' = 'practice',
    telegramBotToken?: string,
    telegramChatId?: string
  ) {
    this.oanda = new OandaClient(oandaApiKey, oandaAccountId, oandaEnvironment);
    
    if (telegramBotToken && telegramChatId) {
      this.telegram = new TelegramClient(telegramBotToken, telegramChatId);
    }
  }

  /**
   * Start the signal monitoring worker
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 SROBAC Signal Worker started');
    
    this.telegram?.sendSystemStatus('STARTED', 'Surveillance des 8 paires JPY activée');
    
    // Run immediately, then every 5 seconds
    this.runCheck();
    this.intervalId = setInterval(() => this.runCheck(), this.checkInterval);
  }

  /**
   * Stop the worker
   */
  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('🛑 SROBAC Signal Worker stopped');
    this.telegram?.sendSystemStatus('STOPPED');
  }

  /**
   * Main check loop
   */
  private async runCheck(): Promise<void> {
    if (!this.isRunning) return;

    // Check January pause
    if (isJanuaryPause()) {
      console.log('⏸️ January pause active — no trading');
      return;
    }

    const activePairs = Object.values(PAIR_CONFIGS).filter(p => p.active);

    for (const pair of activePairs) {
      try {
        await this.checkPair(pair.symbol);
      } catch (error) {
        console.error(`Error checking ${pair.symbol}:`, error);
      }
    }
  }

  /**
   * Check a single pair for signals and updates
   */
  private async checkPair(symbol: string): Promise<void> {
    const pairConfig = PAIR_CONFIGS[symbol];
    if (!pairConfig) return;

    const oandaSymbol = OandaClient.toOandaFormat(symbol);
    const granularity = this.mapTimeframeToOanda(pairConfig.timeframe);

    // 1. Check active signal status
    const activeSignal = this.activeSignals.get(symbol);
    if (activeSignal) {
      const pricing = await this.oanda.getPricing([oandaSymbol]);
      const currentPrice = parseFloat(pricing.prices[0].closeoutBid);

      const statusUpdate = checkSignalStatus(activeSignal, currentPrice);
      
      if (statusUpdate) {
        // Update signal status
        activeSignal.status = statusUpdate.status as any;
        
        // Notify
        if (statusUpdate.status === 'HIT_TP') {
          await this.telegram?.sendTakeProfit(
            pairConfig.name,
            statusUpdate.price,
            pairConfig.tpRatio
          );
        } else if (statusUpdate.status === 'HIT_SL') {
          await this.telegram?.sendStopLoss(
            pairConfig.name,
            statusUpdate.price
          );
        } else if (statusUpdate.status === 'BE_REACHED') {
          await this.telegram?.sendBreakEven(
            pairConfig.name,
            statusUpdate.price,
            activeSignal.entryPrice,
            pairConfig.beRatio
          );
        }

        // Remove from active signals if resolved
        if (statusUpdate.status === 'HIT_TP' || statusUpdate.status === 'HIT_SL') {
          this.activeSignals.delete(symbol);
        }

        return; // Don't check for new signals if we just resolved one
      }
    }

    // 2. Check for new signal (only if no active signal on this pair)
    if (this.activeSignals.has(symbol)) return;

    // Fetch candles
    const candles = await this.oanda.getCandles(oandaSymbol, granularity, 200);
    
    if (candles.length < 110) {
      console.warn(`Not enough candles for ${symbol}: ${candles.length}`);
      return;
    }

    // Detect SROBAC signal
    const signal = detectSROBACSignal(candles, symbol);
    
    if (signal) {
      console.log(`🚀 SIGNAL detected on ${symbol}!`);
      
      // Store as active signal
      this.activeSignals.set(symbol, signal);

      // Send Telegram notification
      await this.telegram?.sendSignal(
        pairConfig.name,
        signal.direction,
        signal.entryPrice,
        signal.stopLoss,
        signal.takeProfit,
        signal.breakEvenPrice,
        signal.breakEvenRatio,
        pairConfig.tpRatio,
        signal.timeframe,
        signal.ema100AtSignal,
        signal.atr14AtSignal,
        signal.resistanceZone.high,
        signal.resistanceZone.low
      );
    }
  }

  /**
   * Map internal timeframe to OANDA granularity
   */
  private mapTimeframeToOanda(timeframe: string): string {
    const map: Record<string, string> = {
      'M30': 'M30',
      'M45': 'M45',
      'H1': 'H1',
    };
    return map[timeframe] || 'M30';
  }

  /**
   * Get active signals
   */
  getActiveSignals(): SROBACSignal[] {
    return Array.from(this.activeSignals.values());
  }

  /**
   * Check if worker is running
   */
  getStatus(): boolean {
    return this.isRunning;
  }
}
