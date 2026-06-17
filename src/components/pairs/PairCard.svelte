<script lang="ts">
  import { onMount } from 'svelte';
  import type { PairConfig } from '$lib/strategy/types';
  import TradingViewChart from '../charts/TradingViewChart.svelte';

  interface Props {
    pair: PairConfig;
  }

  let { pair }: Props = $props();
  let currentPrice = $state(0);
  let priceChange = $state(0);
  let isAboveEMA100 = $state(false);

  // Simulate price updates (will be replaced with real OANDA data)
  onMount(() => {
    const interval = setInterval(() => {
      // Mock price updates
      currentPrice = 100 + Math.random() * 50;
      priceChange = (Math.random() - 0.5) * 2;
      isAboveEMA100 = Math.random() > 0.3;
    }, 5000);

    return () => clearInterval(interval);
  });
</script>

<div class="card card-hover">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <span class="font-semibold text-sm">{pair.name}</span>
      <span class="text-xs text-text-secondary">{pair.timeframe}</span>
    </div>
    <div class="flex items-center gap-2">
      {#if isAboveEMA100}
        <span class="badge-long">Au-dessus EMA100</span>
      {:else}
        <span class="badge-short">Sous EMA100</span>
      {/if}
      <span class="badge-neutral">Actif</span>
    </div>
  </div>

  <div class="flex items-baseline gap-2 mb-2">
    <span class="text-2xl font-bold font-mono-price">
      {currentPrice > 0 ? currentPrice.toFixed(3) : '--'}
    </span>
    <span class="text-sm font-mono-price {priceChange >= 0 ? 'price-up' : 'price-down'}">
      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
    </span>
  </div>

  <div class="grid grid-cols-3 gap-2 text-xs mb-3">
    <div class="bg-bg-tertiary rounded px-2 py-1">
      <span class="text-text-secondary">TP</span>
      <span class="font-mono-price ml-1 text-accent-long">{pair.tpRatio}R</span>
    </div>
    <div class="bg-bg-tertiary rounded px-2 py-1">
      <span class="text-text-secondary">BE</span>
      <span class="font-mono-price ml-1 text-accent-warning">{pair.beRatio}R</span>
    </div>
    <div class="bg-bg-tertiary rounded px-2 py-1">
      <span class="text-text-secondary">Signal</span>
      <span class="font-mono-price ml-1 text-text-muted">~1/mois</span>
    </div>
  </div>

  <!-- Mini chart placeholder -->
  <div class="h-32 bg-bg-primary rounded border border-border overflow-hidden">
    <!-- TradingView chart will be integrated here -->
    <div class="flex items-center justify-center h-full text-text-muted text-xs">
      Chart {pair.name} — {pair.timeframe}
    </div>
  </div>
</div>
