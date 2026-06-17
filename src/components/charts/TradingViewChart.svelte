<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';
  import type { Candle } from '$lib/strategy/types';

  interface Props {
    candles: Candle[];
    ema100?: number[];
    resistanceZone?: { high: number; low: number } | null;
    height?: number;
  }

  let { candles, ema100 = [], resistanceZone = null, height = 400 }: Props = $props();
  let chartContainer: HTMLDivElement;
  let chart: any;
  let candleSeries: any;
  let emaSeries: any;

  onMount(() => {
    if (!chartContainer) return;

    chart = createChart(chartContainer, {
      layout: {
        background: { color: '#0A0A0F' },
        textColor: '#8A8A9A',
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: '#2A2A3A', style: 2 },
        horzLines: { color: '#2A2A3A', style: 2 },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#8A8A9A', style: 3 },
        horzLine: { color: '#8A8A9A', style: 3 },
      },
      rightPriceScale: {
        borderColor: '#2A2A3A',
      },
      timeScale: {
        borderColor: '#2A2A3A',
        timeVisible: true,
        secondsVisible: false,
      },
      height,
    });

    candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00C853',
      downColor: '#FF5252',
      borderUpColor: '#00C853',
      borderDownColor: '#FF5252',
      wickUpColor: '#00C853',
      wickDownColor: '#FF5252',
    });

    updateData();

    const handleResize = () => {
      if (chartContainer) {
        chart.applyOptions({ width: chartContainer.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  onDestroy(() => {
    if (chart) {
      chart.remove();
    }
  });

  function updateData() {
    if (!candleSeries || candles.length === 0) return;

    const chartData = candles.map(c => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(chartData);

    // Add EMA 100 line
    if (ema100.length > 0) {
      if (emaSeries) {
        chart.removeSeries(emaSeries);
      }
      emaSeries = chart.addSeries(LineSeries, {
        color: '#448AFF',
        lineWidth: 2,
        title: 'EMA 100',
      });

      const emaData = candles.map((c, i) => ({
        time: c.time as any,
        value: ema100[i] || c.close,
      })).filter((_, i) => i >= 99); // EMA starts after 100 periods

      emaSeries.setData(emaData);
    }

    // Add resistance zone
    if (resistanceZone) {
      // Use plugins or primitive overlays for resistance zones
      // Lightweight Charts v5 supports custom plugins
    }

    chart.timeScale().fitContent();
  }

  $effect(() => {
    updateData();
  });
</script>

<div bind:this={chartContainer} class="w-full rounded-lg border border-border" style="height: {height}px;"></div>
