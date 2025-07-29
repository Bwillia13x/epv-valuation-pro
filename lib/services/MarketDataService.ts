// EPV Valuation Pro - Market Data Integration Service
import { prisma } from '../database';
import { AuditService } from './AuditService';

export interface MarketDataPoint {
  symbol: string;
  dataType: string;
  value: number;
  currency: string;
  date: Date;
  source: string;
}

export interface MarketDataQuery {
  symbols: string[];
  dataTypes?: string[];
  startDate?: Date;
  endDate?: Date;
  source?: string;
}

export class MarketDataService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get market data for symbols
   */
  static async getMarketData(
    query: MarketDataQuery
  ): Promise<MarketDataPoint[]> {
    try {
      const where: any = {
        symbol: { in: query.symbols },
      };

      if (query.dataTypes && query.dataTypes.length > 0) {
        where.dataType = { in: query.dataTypes };
      }

      if (query.startDate || query.endDate) {
        where.date = {};
        if (query.startDate) where.date.gte = query.startDate;
        if (query.endDate) where.date.lte = query.endDate;
      }

      if (query.source) {
        where.source = query.source;
      }

      const data = await prisma.marketData.findMany({
        where,
        orderBy: [{ symbol: 'asc' }, { dataType: 'asc' }, { date: 'desc' }],
      });

      return data.map((item) => ({
        symbol: item.symbol,
        dataType: item.dataType,
        value: parseFloat(item.value.toString()),
        currency: item.currency,
        date: item.date,
        source: item.source,
      }));
    } catch (error) {
      console.error('Get market data error:', error);
      throw new Error('Failed to fetch market data');
    }
  }

  /**
   * Store market data
   */
  static async storeMarketData(dataPoints: MarketDataPoint[]): Promise<number> {
    try {
      let storedCount = 0;

      for (const point of dataPoints) {
        await prisma.marketData.upsert({
          where: {
            symbol_dataType_date: {
              symbol: point.symbol,
              dataType: point.dataType,
              date: point.date,
            },
          },
          update: {
            value: point.value.toString(),
            currency: point.currency,
            source: point.source,
            updatedAt: new Date(),
          },
          create: {
            symbol: point.symbol,
            dataType: point.dataType,
            value: point.value.toString(),
            currency: point.currency,
            date: point.date,
            source: point.source,
          },
        });

        storedCount++;
      }

      // Log market data update
      await AuditService.logSystemEvent(
        'MARKET_DATA_UPDATE',
        'MarketData',
        undefined,
        {
          count: storedCount,
          symbols: [...new Set(dataPoints.map((p) => p.symbol))],
          sources: [...new Set(dataPoints.map((p) => p.source))],
        }
      );

      return storedCount;
    } catch (error) {
      console.error('Store market data error:', error);
      throw new Error('Failed to store market data');
    }
  }

  /**
   * Fetch data from Alpha Vantage
   */
  static async fetchFromAlphaVantage(
    symbols: string[]
  ): Promise<MarketDataPoint[]> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.warn('Alpha Vantage API key not configured');
      return [];
    }

    const dataPoints: MarketDataPoint[] = [];

    try {
      for (const symbol of symbols) {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data['Global Quote']) {
          const quote = data['Global Quote'];

          dataPoints.push({
            symbol,
            dataType: 'price',
            value: parseFloat(quote['05. price']),
            currency: 'USD',
            date: new Date(quote['07. latest trading day']),
            source: 'Alpha Vantage',
          });

          dataPoints.push({
            symbol,
            dataType: 'change_percent',
            value: parseFloat(quote['10. change percent'].replace('%', '')),
            currency: 'USD',
            date: new Date(quote['07. latest trading day']),
            source: 'Alpha Vantage',
          });
        }

        // Rate limiting - Alpha Vantage allows 5 calls per minute for free tier
        await new Promise((resolve) => setTimeout(resolve, 12000)); // 12 second delay
      }
    } catch (error) {
      console.error('Alpha Vantage fetch error:', error);
      throw new Error('Failed to fetch data from Alpha Vantage');
    }

    return dataPoints;
  }

  /**
   * Fetch data from Finnhub
   */
  static async fetchFromFinnhub(symbols: string[]): Promise<MarketDataPoint[]> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      console.warn('Finnhub API key not configured');
      return [];
    }

    const dataPoints: MarketDataPoint[] = [];

    try {
      for (const symbol of symbols) {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.c) {
          // Current price
          dataPoints.push({
            symbol,
            dataType: 'price',
            value: data.c,
            currency: 'USD',
            date: new Date(data.t * 1000), // Unix timestamp
            source: 'Finnhub',
          });

          dataPoints.push({
            symbol,
            dataType: 'change',
            value: data.d,
            currency: 'USD',
            date: new Date(data.t * 1000),
            source: 'Finnhub',
          });

          dataPoints.push({
            symbol,
            dataType: 'change_percent',
            value: data.dp,
            currency: 'USD',
            date: new Date(data.t * 1000),
            source: 'Finnhub',
          });
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      }
    } catch (error) {
      console.error('Finnhub fetch error:', error);
      throw new Error('Failed to fetch data from Finnhub');
    }

    return dataPoints;
  }

  /**
   * Get industry benchmarks
   */
  static async getIndustryBenchmarks(
    industry: string
  ): Promise<MarketDataPoint[]> {
    try {
      // For now, return static benchmarks - in production this would come from external APIs
      const benchmarks: MarketDataPoint[] = [
        {
          symbol: industry.toUpperCase(),
          dataType: 'pe_ratio',
          value: industry === 'Healthcare Services' ? 15.5 : 12.8,
          currency: 'USD',
          date: new Date(),
          source: 'Industry Average',
        },
        {
          symbol: industry.toUpperCase(),
          dataType: 'ev_ebitda',
          value: industry === 'Healthcare Services' ? 8.2 : 7.5,
          currency: 'USD',
          date: new Date(),
          source: 'Industry Average',
        },
        {
          symbol: industry.toUpperCase(),
          dataType: 'gross_margin',
          value: industry === 'Healthcare Services' ? 0.72 : 0.65,
          currency: 'USD',
          date: new Date(),
          source: 'Industry Average',
        },
      ];

      // Store benchmarks in database
      await this.storeMarketData(benchmarks);

      return benchmarks;
    } catch (error) {
      console.error('Get industry benchmarks error:', error);
      throw new Error('Failed to get industry benchmarks');
    }
  }

  /**
   * Refresh market data from all sources
   */
  static async refreshMarketData(symbols: string[]): Promise<{
    totalFetched: number;
    sources: string[];
    errors: string[];
  }> {
    const allDataPoints: MarketDataPoint[] = [];
    const sources: string[] = [];
    const errors: string[] = [];

    try {
      // Fetch from Alpha Vantage
      if (process.env.ALPHA_VANTAGE_API_KEY) {
        try {
          const alphaData = await this.fetchFromAlphaVantage(symbols);
          allDataPoints.push(...alphaData);
          if (alphaData.length > 0) sources.push('Alpha Vantage');
        } catch (error) {
          errors.push(`Alpha Vantage: ${error.message}`);
        }
      }

      // Fetch from Finnhub
      if (process.env.FINNHUB_API_KEY) {
        try {
          const finnhubData = await this.fetchFromFinnhub(symbols);
          allDataPoints.push(...finnhubData);
          if (finnhubData.length > 0) sources.push('Finnhub');
        } catch (error) {
          errors.push(`Finnhub: ${error.message}`);
        }
      }

      // Store all data
      const totalFetched =
        allDataPoints.length > 0
          ? await this.storeMarketData(allDataPoints)
          : 0;

      return {
        totalFetched,
        sources,
        errors,
      };
    } catch (error) {
      console.error('Refresh market data error:', error);
      throw new Error('Failed to refresh market data');
    }
  }

  /**
   * Clean up old market data
   */
  static async cleanupOldData(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await prisma.marketData.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      await AuditService.logSystemEvent(
        'MARKET_DATA_CLEANUP',
        'MarketData',
        undefined,
        {
          deletedRecords: result.count,
          retentionDays,
          cutoffDate,
        }
      );

      return result.count;
    } catch (error) {
      console.error('Cleanup old market data error:', error);
      return 0;
    }
  }
}

export default MarketDataService;
