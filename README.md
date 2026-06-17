# OANDA Signals Pro — SROBAC Strategy

Système de signaux de trading automatisé basé sur la stratégie SROBAC (Support, Résistance, Order Block, And Confirmation) appliquée aux paires JPY.

## Stack technique

- **Framework** : Astro 6.4.7 + Svelte 5
- **UI** : shadcn/ui + Tailwind CSS 4
- **Charts** : TradingView Lightweight Charts 5.2.0
- **Database** : Supabase (PostgreSQL) + Prisma 7.8.0
- **API Broker** : OANDA v20 REST API
- **Notifications** : Telegram Bot API
- **Package Manager** : pnpm

## Paires surveillées (8 actifs JPY)

| Paire | Timeframe | TP (R:R) | BE (R) |
|-------|-----------|----------|--------|
| CAD/JPY | M45 | 3.0 | 2.0 |
| AUD/JPY | M30 | 3.0 | 2.0 |
| CHF/JPY | 1H | 3.5 | 2.0 |
| NZD/JPY | M30 | 3.5 | 2.0 |
| GBP/JPY | M30 | 3.5 | 2.0 |
| USD/JPY | M30 | 3.5 | 2.0 |
| EUR/JPY | M30 | 3.0 | 2.0 |
| JP225 | M30 | 3.5 | 1.0 |

## Stratégie SROBAC — 5 étapes

1. **Filtre EMA 100** : Prix strictement au-dessus de l'EMA 100
2. **Résistance** : Zone avec 2+ impacts espacés de 15+ bougies
3. **Breakout** : Bougie verte clôturant au-dessus de la résistance
4. **Throwback** : Bougie baissière revenant toucher la zone (devenue support)
5. **Confirmation** : Bougie haussière clôturant au-dessus du high du throwback

## Installation

```bash
pnpm install
```

## Configuration

Copier `.env.example` en `.env` et remplir les variables.

## Développement

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Auteur

M6TM Trading Systems
