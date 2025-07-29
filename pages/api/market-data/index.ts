// EPV Valuation Pro - Market Data API
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '../../../lib/middleware/auth';
import { MarketDataService } from '../../../lib/services/MarketDataService';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getMarketData(req, res);
    case 'POST':
      return refreshMarketData(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

// GET /api/market-data - Get market data
async function getMarketData(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { symbols, dataTypes, startDate, endDate, source } = req.query;

    if (!symbols) {
      return res.status(400).json({
        error: 'symbols parameter is required',
      });
    }

    const symbolsList =
      typeof symbols === 'string'
        ? symbols.split(',').map((s) => s.trim())
        : Array.isArray(symbols)
          ? symbols
          : [];

    const query = {
      symbols: symbolsList,
      dataTypes: dataTypes
        ? typeof dataTypes === 'string'
          ? dataTypes.split(',')
          : dataTypes
        : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      source: source as string,
    };

    const data = await MarketDataService.getMarketData(query);

    res.status(200).json({
      data,
      count: data.length,
      symbols: symbolsList,
      query,
    });
  } catch (error) {
    console.error('Get market data error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}

// POST /api/market-data - Refresh market data
async function refreshMarketData(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        error: 'symbols array is required in request body',
      });
    }

    const result = await MarketDataService.refreshMarketData(symbols);

    res.status(200).json({
      message: 'Market data refresh completed',
      ...result,
    });
  } catch (error) {
    console.error('Refresh market data error:', error);
    res.status(500).json({ error: 'Failed to refresh market data' });
  }
}

export default withAuth(handler);
