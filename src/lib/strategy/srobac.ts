import type { Candle, ResistanceZone, ThrowbackResult, SROBACSignal, Peak, PairConfig } from './types';
import { PAIR_CONFIGS } from './types';

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const highLow = candles[i].high - candles[i].low;
    const highClose = Math.abs(candles[i].high - candles[i - 1].close);
    const lowClose = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(highLow, highClose, lowClose));
  }

  const atr: number[] = [];
  let sum = 0;
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      sum += tr[i];
      atr.push(sum / (i + 1));
    } else if (i === period - 1) {
      sum += tr[i];
      atr.push(sum / period);
    } else {
      atr.push((atr[i - 1] * (period - 1) + tr[i]) / period);
    }
  }
  return atr;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  let gains = 0, losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  return rsi;
}

/**
 * ÉTAPE 1 : Filtre EMA 100
 * Le prix doit être strictement au-dessus de l'EMA 100
 */
export function checkEMA100Filter(candles: Candle[], ema100: number[]): boolean {
  const lastCandle = candles[candles.length - 1];
  const lastEMA100 = ema100[ema100.length - 1];
  return lastCandle.close > lastEMA100 && lastCandle.low > lastEMA100;
}

/**
 * ÉTAPE 2 : Identification de la Résistance
 * Zone avec 2+ impacts nets espacés d'au moins 15 bougies
 */
export function detectResistanceZone(candles: Candle[]): ResistanceZone | null {
  // Chercher les sommets locaux (local maxima)
  const peaks: Peak[] = [];
  for (let i = 2; i < candles.length - 2; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    // Sommet local : high supérieur aux voisins
    if (curr.high > prev.high && curr.high > next.high &&
        curr.high > candles[i - 2].high && curr.high > candles[i + 2].high) {
      peaks.push({ index: i, high: curr.high, candle: curr });
    }
  }

  // Filtrer les pics espacés d'au moins 15 bougies
  const validPeaks: Peak[] = [];
  for (const peak of peaks) {
    const lastValid = validPeaks[validPeaks.length - 1];
    if (!lastValid || (peak.index - lastValid.index) >= 15) {
      validPeaks.push(peak);
    }
  }

  // Vérifier au moins 2 pics valides
  if (validPeaks.length < 2) return null;

  // Construire la zone de résistance
  const topWick = Math.max(...validPeaks.map(p => p.high));
  const topBodies = Math.max(...validPeaks.map(p =>
    Math.max(p.candle.open, p.candle.close)
  ));

  // Vérifier que la zone n'est pas trop épaisse (max 2x ATR14)
  const zoneThickness = topWick - topBodies;
  const atr14 = calculateATR(candles, 14);
  const lastATR = atr14[atr14.length - 1] || 0;

  if (zoneThickness > lastATR * 2) return null;

  return {
    high: topWick,
    low: topBodies,
    thickness: zoneThickness,
    peaks: validPeaks,
    isActive: true
  };
}

/**
 * ÉTAPE 3 : Cassure (Breakout)
 * Bougie verte clôturant nettement au-dessus de la résistance
 */
export function checkBreakout(candle: Candle, resistance: ResistanceZone, atr14: number): boolean {
  const isGreen = candle.close > candle.open;
  const clearBreak = candle.close > resistance.high + (0.2 * atr14);
  return isGreen && clearBreak;
}

/**
 * ÉTAPE 4 : Le Throwback (Pullback)
 * Bougie baissière revenant toucher la zone sans la traverser
 */
export function checkThrowback(
  candles: Candle[],
  breakoutIndex: number,
  resistance: ResistanceZone
): ThrowbackResult | null {
  // Chercher dans les 10 bougies suivant le breakout
  for (let i = breakoutIndex + 2; i < Math.min(breakoutIndex + 12, candles.length); i++) {
    const candle = candles[i];
    const isRed = candle.close < candle.open;

    // La bougie doit toucher la zone (low <= zone.high ET high >= zone.low)
    const touchesZone = candle.low <= resistance.high && candle.high >= resistance.low;

    // Ne doit pas traverser par le bas
    const noBreakBelow = candle.low >= resistance.low;

    if (isRed && touchesZone && noBreakBelow) {
      return {
        index: i,
        candle: candle,
        type: 'THROWBACK_VALID',
        zoneTouched: true
      };
    }
  }
  return null;
}

/**
 * ÉTAPE 5 : Signal de Confirmation
 * Bougie haussière clôturant au-dessus du high du throwback
 */
export function checkConfirmation(
  throwbackCandle: Candle,
  nextCandle: Candle
): boolean {
  const isGreen = nextCandle.close > nextCandle.open;
  const closesAboveThrowbackHigh = nextCandle.close > throwbackCandle.high;
  return isGreen && closesAboveThrowbackHigh;
}

/**
 * Algorithme complet SROBAC
 * Détecte un signal LONG si les 5 étapes sont validées
 */
export function detectSROBACSignal(candles: Candle[], pair: string): SROBACSignal | null {
  if (candles.length < 110) return null; // Besoin de 100+ bougies pour EMA 100

  // 1. Calculer EMA 100
  const ema100 = calculateEMA(candles.map(c => c.close), 100);

  // ÉTAPE 1 : Filtre EMA 100
  if (!checkEMA100Filter(candles, ema100)) return null;

  // ÉTAPE 2 : Détection résistance
  const resistance = detectResistanceZone(candles.slice(0, candles.length - 5));
  if (!resistance) return null;

  // ÉTAPE 3 : Rechercher le breakout
  const atr14 = calculateATR(candles, 14);
  const lastATR = atr14[atr14.length - 1] || 0;

  let breakoutIndex = -1;
  for (let i = resistance.peaks[resistance.peaks.length - 1].index + 1; i < candles.length - 4; i++) {
    if (checkBreakout(candles[i], resistance, lastATR)) {
      breakoutIndex = i;
      break;
    }
  }
  if (breakoutIndex === -1) return null;

  // ÉTAPE 4 : Rechercher le throwback
  const throwback = checkThrowback(candles, breakoutIndex, resistance);
  if (!throwback) return null;

  // ÉTAPE 5 : Confirmation
  const confirmationIndex = throwback.index + 1;
  if (confirmationIndex >= candles.length) return null;

  const confirmationCandle = candles[confirmationIndex];
  if (!checkConfirmation(throwback.candle, confirmationCandle)) return null;

  // SIGNAL VALIDÉ — Calculer les niveaux
  const entryPrice = confirmationCandle.close;
  const stopLoss = resistance.low - (0.5 * lastATR); // Marge sous la zone
  const risk = entryPrice - stopLoss;

  // Récupérer le R:R de la paire
  const pairConfig = PAIR_CONFIGS[pair];
  if (!pairConfig) return null;

  const takeProfit = entryPrice + (risk * pairConfig.tpRatio);
  const breakEvenPrice = entryPrice + (risk * pairConfig.beRatio);

  return {
    pair,
    direction: 'LONG',
    entryPrice,
    stopLoss,
    takeProfit,
    breakEvenPrice,
    breakEvenRatio: pairConfig.beRatio,
    timeframe: pairConfig.timeframe,
    ema100AtSignal: ema100[ema100.length - 1],
    atr14AtSignal: lastATR,
    resistanceZone: resistance,
    breakoutTimestamp: candles[breakoutIndex].time,
    throwbackTimestamp: throwback.candle.time,
    confirmationTimestamp: confirmationCandle.time,
    status: 'ACTIVE',
    createdAt: new Date()
  };
}

/**
 * Vérifier si un signal actif a atteint SL, BE ou TP
 */
export function checkSignalStatus(
  signal: SROBACSignal,
  currentPrice: number
): { status: string; price: number; message: string } | null {
  // Vérifier SL
  if (currentPrice <= signal.stopLoss) {
    return {
      status: 'HIT_SL',
      price: currentPrice,
      message: `🛑 STOP LOSS — ${signal.pair}\nPrix atteint : ${currentPrice.toFixed(3)}\nRésultat : -1R`
    };
  }

  // Vérifier TP
  if (currentPrice >= signal.takeProfit) {
    return {
      status: 'HIT_TP',
      price: currentPrice,
      message: `🎯 TAKE PROFIT — ${signal.pair}\nPrix atteint : ${currentPrice.toFixed(3)}\nRésultat : +${PAIR_CONFIGS[signal.pair]?.tpRatio || 3}R ✅`
    };
  }

  // Vérifier BE (si SL pas encore déplacé)
  if (currentPrice >= signal.breakEvenPrice && signal.status === 'ACTIVE') {
    return {
      status: 'BE_REACHED',
      price: currentPrice,
      message: `🔒 BREAK-EVEN ATTEINT — ${signal.pair}\nPrix : ${currentPrice.toFixed(3)} (${signal.breakEvenRatio}R)\nStop Loss déplacé au prix d'entrée`
    };
  }

  return null;
}

/**
 * Vérifier si on est en janvier (pause saisonnière)
 */
export function isJanuaryPause(): boolean {
  return new Date().getMonth() === 0; // Janvier = 0
}
