import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed pair configurations
  const pairs = [
    { symbol: 'CAD_JPY', name: 'CAD/JPY', timeframe: 'M45', tpRatio: 3.0, beRatio: 2.0, active: true, isIndex: false },
    { symbol: 'AUD_JPY', name: 'AUD/JPY', timeframe: 'M30', tpRatio: 3.0, beRatio: 2.0, active: true, isIndex: false },
    { symbol: 'CHF_JPY', name: 'CHF/JPY', timeframe: 'H1', tpRatio: 3.5, beRatio: 2.0, active: true, isIndex: false },
    { symbol: 'NZD_JPY', name: 'NZD/JPY', timeframe: 'M30', tpRatio: 3.5, beRatio: 2.0, active: true, isIndex: false },
    { symbol: 'GBP_JPY', name: 'GBP/JPY', timeframe: 'M30', tpRatio: 3.5, beRatio: 2.0, active: true, isIndex: false },
    { symbol: 'USD_JPY', name: 'USD/JPY', timeframe: 'M30', tpRatio: 3.5, beRatio: 2.0, active: true, isIndex: false },
    { symbol: 'EUR_JPY', name: 'EUR/JPY', timeframe: 'M30', tpRatio: 3.0, beRatio: 2.0, active: true, isIndex: false },
    { symbol: 'JP225', name: 'JP225 (Nikkei)', timeframe: 'M30', tpRatio: 3.5, beRatio: 1.0, active: true, isIndex: true },
  ];

  for (const pair of pairs) {
    await prisma.pairConfig.upsert({
      where: { symbol: pair.symbol },
      update: pair,
      create: pair,
    });
  }

  // Seed default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      oandaEnvironment: 'practice',
      riskPerTrade: 1.0,
      januaryPause: true,
      activePairs: pairs.map(p => p.symbol),
      systemStatus: 'RUNNING',
    },
  });

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
