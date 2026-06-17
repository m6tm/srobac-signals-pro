export class TelegramClient {
  private botToken: string;
  private chatId: string;
  private queue: { message: string; retries: number }[] = [];
  private isSending: boolean = false;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  /**
   * Send a message to Telegram
   */
  async sendMessage(message: string, parseMode: 'Markdown' | 'MarkdownV2' | 'HTML' = 'Markdown'): Promise<void> {
    this.queue.push({ message, retries: 0 });
    if (!this.isSending) {
      this.processQueue();
    }
  }

  /**
   * Send signal notification with SROBAC format
   */
  async sendSignal(
    pair: string,
    direction: string,
    entryPrice: number,
    stopLoss: number,
    takeProfit: number,
    breakEvenPrice: number,
    breakEvenRatio: number,
    tpRatio: number,
    timeframe: string,
    ema100: number,
    atr14: number,
    resistanceHigh: number,
    resistanceLow: number
  ): Promise<void> {
    const message = `🚀 *SIGNAL SROBAC — LONG ${pair}*

📊 Timeframe: ${timeframe}
⏰ Détecté à: ${new Date().toLocaleString('fr-FR')}
✅ Confiance: 5/5 étapes validées

💰 *Entry:* ${entryPrice.toFixed(3)}
🛑 *Stop Loss:* ${stopLoss.toFixed(3)}
✅ *Take Profit:* ${takeProfit.toFixed(3)} (${tpRatio}R)
🔒 *Break-even:* ${breakEvenPrice.toFixed(3)} (${breakEvenRatio}R)

📈 EMA 100: ${ema100.toFixed(3)} (prix au-dessus ✅)
📉 ATR 14: ${atr14.toFixed(3)}
📊 R:R = ${tpRatio}:1

*Étapes SROBAC validées:*
✅ Étape 1: Prix au-dessus EMA 100
✅ Étape 2: Résistance identifiée (${resistanceHigh.toFixed(3)} - ${resistanceLow.toFixed(3)})
✅ Étape 3: Breakout confirmé
✅ Étape 4: Throwback validé
✅ Étape 5: Confirmation haussière

⏳ *Signal actif — Suivi en cours*`

    await this.sendMessage(message, 'Markdown');
  }

  /**
   * Send break-even notification
   */
  async sendBreakEven(pair: string, bePrice: number, entryPrice: number, beRatio: number): Promise<void> {
    const message = `🔒 *BREAK-EVEN ATTEINT — ${pair}*

Le prix a atteint ${bePrice.toFixed(3)} (${beRatio}R)
Stop Loss déplacé au prix d'entrée: ${entryPrice.toFixed(3)}

Position sécurisée — risque = 0`;

    await this.sendMessage(message, 'Markdown');
  }

  /**
   * Send take profit notification
   */
  async sendTakeProfit(pair: string, tpPrice: number, tpRatio: number): Promise<void> {
    const message = `🎯 *TAKE PROFIT — ${pair}*

Prix atteint: ${tpPrice.toFixed(3)}
Résultat: +${tpRatio}R ✅

Félicitations, signal clôturé en gain.`;

    await this.sendMessage(message, 'Markdown');
  }

  /**
   * Send stop loss notification
   */
  async sendStopLoss(pair: string, slPrice: number): Promise<void> {
    const message = `🛑 *STOP LOSS — ${pair}*

Prix atteint: ${slPrice.toFixed(3)}
Résultat: -1R

Signal clôturé en perte. Prochain signal dans ~1 mois.`;

    await this.sendMessage(message, 'Markdown');
  }

  /**
   * Send system status notification
   */
  async sendSystemStatus(status: 'STARTED' | 'STOPPED' | 'ERROR', details?: string): Promise<void> {
    const icons: Record<string, string> = {
      STARTED: '🟢',
      STOPPED: '🟡',
      ERROR: '🔴',
    };

    const message = `${icons[status]} *Système SROBAC ${status}*

${details || ''}

${new Date().toLocaleString('fr-FR')}`;

    await this.sendMessage(message, 'Markdown');
  }

  private async processQueue(): Promise<void> {
    if (this.isSending || this.queue.length === 0) return;

    this.isSending = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await this.sendRawMessage(item.message);
        this.queue.shift();
        // Rate limit: max 30 msg/sec, so wait 100ms between messages
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        item.retries++;
        if (item.retries >= 3) {
          console.error('Failed to send Telegram message after 3 retries:', error);
          this.queue.shift();
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * item.retries));
        }
      }
    }

    this.isSending = false;
  }

  private async sendRawMessage(message: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${response.status} ${error}`);
    }
  }
}
