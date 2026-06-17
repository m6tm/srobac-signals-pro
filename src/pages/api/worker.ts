import type { APIRoute } from 'astro';
import { SignalWorker } from '../../lib/worker/signalWorker';

let worker: SignalWorker | null = null;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'start') {
    const oandaKey = import.meta.env.OANDA_API_KEY;
    const oandaAccount = import.meta.env.OANDA_ACCOUNT_ID;
    const oandaEnv = import.meta.env.OANDA_ENVIRONMENT || 'practice';
    const telegramToken = import.meta.env.TELEGRAM_BOT_TOKEN;
    const telegramChat = import.meta.env.TELEGRAM_CHAT_ID;

    if (!oandaKey || !oandaAccount) {
      return new Response(JSON.stringify({ error: 'OANDA credentials not configured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (worker) {
      worker.stop();
    }

    worker = new SignalWorker(
      oandaKey,
      oandaAccount,
      oandaEnv as 'practice' | 'live',
      telegramToken,
      telegramChat
    );

    worker.start();

    return new Response(JSON.stringify({ status: 'started' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'stop') {
    if (worker) {
      worker.stop();
      worker = null;
    }

    return new Response(JSON.stringify({ status: 'stopped' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'status') {
    return new Response(JSON.stringify({
      running: worker?.getStatus() || false,
      activeSignals: worker?.getActiveSignals().length || 0,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
