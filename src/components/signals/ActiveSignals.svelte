<script lang="ts">
  import { onMount } from 'svelte';
  import type { SROBACSignal } from '$lib/strategy/types';

  interface Props {
    signals: SROBACSignal[];
  }

  let { signals }: Props = $props();

  function getProgress(signal: SROBACSignal, currentPrice: number): number {
    const range = signal.takeProfit - signal.stopLoss;
    const progress = currentPrice - signal.stopLoss;
    return Math.max(0, Math.min(100, (progress / range) * 100));
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-accent-long';
      case 'BE_REACHED': return 'bg-accent-warning';
      case 'HIT_TP': return 'bg-accent-long';
      case 'HIT_SL': return 'bg-accent-short';
      default: return 'bg-accent-neutral';
    }
  }
</script>

<div class="space-y-3">
  {#if signals.length === 0}
    <div class="card">
      <p class="text-text-muted text-sm">Aucun signal actif. Le système surveille les 8 paires en permanence.</p>
    </div>
  {:else}
    {#each signals as signal}
      <div class="card card-hover">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <span class="badge-long">LONG</span>
            <span class="font-semibold">{signal.pair}</span>
            <span class="text-xs text-text-secondary">{signal.timeframe}</span>
          </div>
          <span class="text-xs text-text-secondary">
            {new Date(signal.createdAt).toLocaleString('fr-FR')}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div>
            <p class="text-xs text-text-secondary">Entry</p>
            <p class="font-mono-price font-semibold">{signal.entryPrice.toFixed(3)}</p>
          </div>
          <div>
            <p class="text-xs text-text-secondary">SL</p>
            <p class="font-mono-price font-semibold text-accent-short">{signal.stopLoss.toFixed(3)}</p>
          </div>
          <div>
            <p class="text-xs text-text-secondary">TP</p>
            <p class="font-mono-price font-semibold text-accent-long">{signal.takeProfit.toFixed(3)}</p>
          </div>
          <div>
            <p class="text-xs text-text-secondary">BE</p>
            <p class="font-mono-price font-semibold text-accent-warning">{signal.breakEvenPrice.toFixed(3)}</p>
          </div>
        </div>

        <div class="w-full bg-bg-tertiary rounded-full h-2">
          <div class="h-2 rounded-full transition-all duration-500 {getStatusColor(signal.status)}"
               style="width: {getProgress(signal, signal.entryPrice)}%">
          </div>
        </div>

        <div class="flex items-center justify-between mt-2">
          <span class="text-xs text-text-secondary">Progression vers TP</span>
          <span class="text-xs font-medium">
            {#if signal.status === 'ACTIVE'}
              En cours
            {:else if signal.status === 'BE_REACHED'}
              BE atteint — SL sécurisé
            {:else if signal.status === 'HIT_TP'}
              TP atteint ✅
            {:else if signal.status === 'HIT_SL'}
              SL atteint 🛑
            {/if}
          </span>
        </div>
      </div>
    {/each}
  {/if}
</div>
