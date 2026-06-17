// Types pour la stratégie SROBAC

export interface Candle {
  time: number; // timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Peak {
  index: number;
  high: number;
  candle: Candle;
}

export interface ResistanceZone {
  high: number;
  low: number;
  thickness: number;
  peaks: Peak[];
  isActive: boolean;
}

export interface ThrowbackResult {
  index: number;
  candle: Candle;
  type: 'THROWBACK_VALID' | 'THROWBACK_INVALID';
  zoneTouched: boolean;
}

export interface SROBACSignal {
  pair: string;
  direction: 'LONG';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  breakEvenPrice: number;
  breakEvenRatio: number;
  timeframe: string;
  ema100AtSignal: number;
  atr14AtSignal: number;
  resistanceZone: ResistanceZone;
  breakoutTimestamp: number;
  throwbackTimestamp: number;
  confirmationTimestamp: number;
  status: 'ACTIVE' | 'HIT_SL' | 'HIT_TP' | 'BE_REACHED' | 'EXPIRED';
  createdAt: Date;
}

export interface PairConfig {
  symbol: string;
  name: string;
  timeframe: string;
  tpRatio: number;
  beRatio: number;
  active: boolean;
  isIndex: boolean;
}

export const PAIR_CONFIGS: Record<string, PairConfig> = {
  'CAD_JPY': { symbol: 'CAD_JPY', name: 'CAD/JPY', timeframe: 'M45', tpRatio: 3.0, beRatio: 2.0, active: true, isIndex: false },
  'AUD_JPY': { symbol: 'AUD_JPY', name: 'AUD/JPY', timeframe: 'M30', tpRatio: 3.0, beRatio: 2.0, active: true, isIndex: false },
  'CHF_JPY': { symbol: 'CHF_JPY', name: 'CHF/JPY', timeframe: 'H1', tpRatio: 3.5, beRatio: 2.0, active: true, isIndex: false },
  'NZD_JPY': { symbol: 'NZD_JPY', name: 'NZD/JPY', timeframe: 'M30', tpRatio: 3.5, beRatio: 2.0, active: true, isIndex: false },
  'GBP_JPY': { symbol: 'GBP_JPY', name: 'GBP/JPY', timeframe: 'M30', tpRatio: 3.5, beRatio: 2.0, active: true, isIndex: false },
  'USD_JPY': { symbol: 'USD_JPY', name: 'USD/JPY', timeframe: 'M30', tpRatio: 3.5, beRatio: 2.0, active: true, isIndex: false },
  'EUR_JPY': { symbol: 'EUR_JPY', name: 'EUR/JPY', timeframe: 'M30', tpRatio: 3.0, beRatio: 2.0, active: true, isIndex: false },
  'JP225': { symbol: 'JP225', name: 'JP225 (Nikkei)', timeframe: 'M30', tpRatio: 3.5, beRatio: 1.0, active: true, isIndex: true },
};

export const OANDA_TIMEFRAME_MAP: Record<string, string> = {
  'M30': 'M30',
  'M45': 'M45',
  'H1': 'H1',
};
