// Financial Data Processor for Multi-Year P&L Analysis
// Handles raw dealbook data input, normalization, and trend analysis

export interface PLDataPoint {
  year: number;
  value: number | null;
  isEstimated?: boolean;
  note?: string;
}

export interface PLLineItem {
  id: string;
  name: string;
  category: 'revenue' | 'cogs' | 'opex' | 'other';
  subcategory?: string;
  data: PLDataPoint[];
  isCalculated?: boolean;
  formula?: string;
}

export interface CompanyFinancialData {
  id: string;
  companyName: string;
  industry: string;
  lastUpdated: Date;
  dataSource: 'manual' | 'import' | 'api';
  currency: string;
  fiscalYearEnd: string;
  lineItems: PLLineItem[];
  metadata: {
    dealSource?: string;
    analystNotes?: string;
    dataQuality?: 'high' | 'medium' | 'low';
    normalizationNotes?: string;
  };
}

export interface NormalizationSettings {
  yearsToAnalyze: number;
  outlierThreshold: number; // Percentage threshold for outlier detection
  normalizationMethod: 'average' | 'median' | 'latest' | 'trend';
  adjustments: {
    removeOneTimeItems: boolean;
    normalizeSeasonality: boolean;
    adjustForInflation: boolean;
    inflationRate?: number;
  };
  customAdjustments: Array<{
    year: number;
    item: string;
    adjustment: number;
    reason: string;
  }>;
}

export interface AnalysisResults {
  trends: {
    revenue: {
      cagr: number;
      volatility: number;
      trend: 'growing' | 'declining' | 'stable';
    };
    margins: {
      grossMargin: PLDataPoint[];
      ebitdaMargin: PLDataPoint[];
      netMargin: PLDataPoint[];
    };
    growth: {
      revenueGrowth: PLDataPoint[];
      ebitdaGrowth: PLDataPoint[];
    };
  };
  normalized: {
    revenue: number;
    grossProfit: number;
    ebitda: number;
    ebit: number;
    margins: {
      gross: number;
      ebitda: number;
      ebit: number;
    };
  };
  quality: {
    dataCompleteness: number;
    consistency: number;
    outliers: Array<{
      year: number;
      item: string;
      value: number;
      expectedRange: [number, number];
    }>;
  };
}

// Standard P&L line item templates
export const STANDARD_PL_TEMPLATE: Omit<PLLineItem, 'data'>[] = [
  // Revenue
  {
    id: 'total_revenue',
    name: 'Total Revenue',
    category: 'revenue',
    subcategory: 'total',
  },
  {
    id: 'service_revenue',
    name: 'Service Revenue',
    category: 'revenue',
    subcategory: 'breakdown',
  },
  {
    id: 'product_revenue',
    name: 'Product Revenue',
    category: 'revenue',
    subcategory: 'breakdown',
  },
  {
    id: 'recurring_revenue',
    name: 'Recurring Revenue',
    category: 'revenue',
    subcategory: 'breakdown',
  },
  {
    id: 'other_revenue',
    name: 'Other Revenue',
    category: 'revenue',
    subcategory: 'breakdown',
  },

  // Cost of Goods Sold
  {
    id: 'total_cogs',
    name: 'Total COGS',
    category: 'cogs',
    subcategory: 'total',
  },
  {
    id: 'direct_materials',
    name: 'Direct Materials',
    category: 'cogs',
    subcategory: 'breakdown',
  },
  {
    id: 'direct_labor',
    name: 'Direct Labor',
    category: 'cogs',
    subcategory: 'breakdown',
  },
  {
    id: 'clinical_labor',
    name: 'Clinical Labor',
    category: 'cogs',
    subcategory: 'breakdown',
  },
  {
    id: 'other_cogs',
    name: 'Other COGS',
    category: 'cogs',
    subcategory: 'breakdown',
  },

  // Operating Expenses
  {
    id: 'sales_marketing',
    name: 'Sales & Marketing',
    category: 'opex',
    subcategory: 'sg&a',
  },
  {
    id: 'general_admin',
    name: 'General & Administrative',
    category: 'opex',
    subcategory: 'sg&a',
  },
  {
    id: 'rd_expense',
    name: 'Research & Development',
    category: 'opex',
    subcategory: 'sg&a',
  },
  {
    id: 'depreciation',
    name: 'Depreciation & Amortization',
    category: 'opex',
    subcategory: 'non_cash',
  },
  {
    id: 'rent_facilities',
    name: 'Rent & Facilities',
    category: 'opex',
    subcategory: 'fixed',
  },
  {
    id: 'professional_fees',
    name: 'Professional Fees',
    category: 'opex',
    subcategory: 'variable',
  },
  {
    id: 'insurance',
    name: 'Insurance',
    category: 'opex',
    subcategory: 'fixed',
  },
  {
    id: 'other_opex',
    name: 'Other Operating Expenses',
    category: 'opex',
    subcategory: 'other',
  },

  // Other Items
  {
    id: 'interest_expense',
    name: 'Interest Expense',
    category: 'other',
    subcategory: 'financing',
  },
  {
    id: 'interest_income',
    name: 'Interest Income',
    category: 'other',
    subcategory: 'financing',
  },
  {
    id: 'other_income',
    name: 'Other Income',
    category: 'other',
    subcategory: 'non_operating',
  },
  {
    id: 'tax_expense',
    name: 'Tax Expense',
    category: 'other',
    subcategory: 'tax',
  },
  {
    id: 'one_time_items',
    name: 'One-Time Items',
    category: 'other',
    subcategory: 'adjustments',
  },
];

// Medispa-specific line item template
export const MEDISPA_PL_TEMPLATE: Omit<PLLineItem, 'data'>[] = [
  // Revenue breakdown
  {
    id: 'injectables_revenue',
    name: 'Injectables Revenue',
    category: 'revenue',
    subcategory: 'service_lines',
  },
  {
    id: 'laser_revenue',
    name: 'Laser Treatment Revenue',
    category: 'revenue',
    subcategory: 'service_lines',
  },
  {
    id: 'facial_revenue',
    name: 'Facial/Aesthetic Revenue',
    category: 'revenue',
    subcategory: 'service_lines',
  },
  {
    id: 'membership_revenue',
    name: 'Membership Revenue',
    category: 'revenue',
    subcategory: 'service_lines',
  },
  {
    id: 'retail_revenue',
    name: 'Retail Product Revenue',
    category: 'revenue',
    subcategory: 'service_lines',
  },

  // Medispa-specific costs
  {
    id: 'product_cogs',
    name: 'Product COGS',
    category: 'cogs',
    subcategory: 'products',
  },
  {
    id: 'clinical_staff',
    name: 'Clinical Staff Costs',
    category: 'cogs',
    subcategory: 'labor',
  },
  {
    id: 'medical_director',
    name: 'Medical Director Fee',
    category: 'opex',
    subcategory: 'professional',
  },
  {
    id: 'malpractice_insurance',
    name: 'Malpractice Insurance',
    category: 'opex',
    subcategory: 'insurance',
  },
  {
    id: 'equipment_leases',
    name: 'Equipment Leases',
    category: 'opex',
    subcategory: 'equipment',
  },
  {
    id: 'compliance_costs',
    name: 'Regulatory/Compliance',
    category: 'opex',
    subcategory: 'regulatory',
  },
];

export class FinancialDataProcessor {
  static createEmptyDataset(
    yearsBack: number = 5,
    template: 'standard' | 'medispa' = 'standard'
  ): CompanyFinancialData {
    const currentYear = new Date().getFullYear();
    const years = Array.from(
      { length: yearsBack },
      (_, i) => currentYear - yearsBack + i + 1
    );

    const templateItems =
      template === 'medispa'
        ? [...STANDARD_PL_TEMPLATE, ...MEDISPA_PL_TEMPLATE]
        : STANDARD_PL_TEMPLATE;

    const lineItems: PLLineItem[] = templateItems.map((item) => ({
      ...item,
      data: years.map((year) => ({ year, value: null })),
    }));

    return {
      id: `company_${Date.now()}`,
      companyName: 'New Company',
      industry:
        template === 'medispa' ? 'Healthcare - Aesthetic Services' : 'General',
      lastUpdated: new Date(),
      dataSource: 'manual',
      currency: 'USD',
      fiscalYearEnd: 'December',
      lineItems,
      metadata: {
        dataQuality: 'medium',
      },
    };
  }

  static calculateDerivedMetrics(
    data: CompanyFinancialData
  ): CompanyFinancialData {
    const derivedItems: PLLineItem[] = [];

    // Calculate gross profit
    const revenue = data.lineItems.find((item) => item.id === 'total_revenue');
    const cogs = data.lineItems.find((item) => item.id === 'total_cogs');

    if (revenue && cogs) {
      const grossProfitData: PLDataPoint[] = revenue.data.map(
        (revenuePoint) => {
          const cogsPoint = cogs.data.find((c) => c.year === revenuePoint.year);
          if (
            revenuePoint.value !== null &&
            cogsPoint &&
            cogsPoint.value !== null
          ) {
            return {
              year: revenuePoint.year,
              value: revenuePoint.value - cogsPoint.value,
              isEstimated: revenuePoint.isEstimated || cogsPoint.isEstimated,
            };
          }
          return { year: revenuePoint.year, value: null };
        }
      );

      derivedItems.push({
        id: 'gross_profit',
        name: 'Gross Profit',
        category: 'other',
        subcategory: 'calculated',
        data: grossProfitData,
        isCalculated: true,
        formula: 'Total Revenue - Total COGS',
      });
    }

    // Calculate EBITDA
    const grossProfit =
      derivedItems.find((item) => item.id === 'gross_profit') ||
      data.lineItems.find((item) => item.id === 'gross_profit');
    const opexItems = data.lineItems.filter(
      (item) => item.category === 'opex' && item.subcategory !== 'non_cash'
    );

    if (grossProfit && opexItems.length > 0) {
      const ebitdaData: PLDataPoint[] = grossProfit.data.map((gpPoint) => {
        if (gpPoint.value === null) return { year: gpPoint.year, value: null };

        let totalOpex = 0;
        let hasNullValues = false;

        for (const opexItem of opexItems) {
          const opexPoint = opexItem.data.find((p) => p.year === gpPoint.year);
          if (opexPoint?.value === null || opexPoint?.value === undefined) {
            hasNullValues = true;
            break;
          }
          totalOpex += opexPoint.value;
        }

        if (hasNullValues) return { year: gpPoint.year, value: null };

        return {
          year: gpPoint.year,
          value: gpPoint.value - totalOpex,
          isEstimated: gpPoint.isEstimated,
        };
      });

      derivedItems.push({
        id: 'ebitda',
        name: 'EBITDA',
        category: 'other',
        subcategory: 'calculated',
        data: ebitdaData,
        isCalculated: true,
        formula: 'Gross Profit - Operating Expenses (ex. D&A)',
      });
    }

    return {
      ...data,
      lineItems: [...data.lineItems, ...derivedItems],
    };
  }

  static normalizeData(
    data: CompanyFinancialData,
    settings: NormalizationSettings
  ): AnalysisResults {
    // Get key metrics
    const revenue = data.lineItems.find((item) => item.id === 'total_revenue');
    const grossProfit = data.lineItems.find(
      (item) => item.id === 'gross_profit'
    );
    const ebitda = data.lineItems.find((item) => item.id === 'ebitda');

    if (!revenue) {
      throw new Error('Total revenue data is required for normalization');
    }

    // Calculate trends
    const revenueValues = revenue.data
      .filter((d) => d.value !== null)
      .map((d) => d.value as number);

    const revenueCagr = this.calculateCAGR(revenueValues);
    const revenueVolatility = this.calculateVolatility(revenueValues);

    // Calculate normalized values based on method
    const normalizedRevenue = this.normalizeValue(
      revenueValues,
      settings.normalizationMethod
    );
    const normalizedGrossProfit = grossProfit
      ? this.normalizeValue(
          grossProfit.data
            .filter((d) => d.value !== null)
            .map((d) => d.value as number),
          settings.normalizationMethod
        )
      : 0;
    const normalizedEbitda = ebitda
      ? this.normalizeValue(
          ebitda.data
            .filter((d) => d.value !== null)
            .map((d) => d.value as number),
          settings.normalizationMethod
        )
      : 0;

    // Calculate margins
    const marginData = revenue.data.map((revenuePoint) => {
      const gpPoint = grossProfit?.data.find(
        (p) => p.year === revenuePoint.year
      );
      const ebitdaPoint = ebitda?.data.find(
        (p) => p.year === revenuePoint.year
      );

      return {
        year: revenuePoint.year,
        grossMargin:
          revenuePoint.value && gpPoint?.value
            ? gpPoint.value / revenuePoint.value
            : null,
        ebitdaMargin:
          revenuePoint.value && ebitdaPoint?.value
            ? ebitdaPoint.value / revenuePoint.value
            : null,
      };
    });

    // Data quality assessment
    const totalDataPoints = data.lineItems.reduce(
      (sum, item) => sum + item.data.length,
      0
    );
    const filledDataPoints = data.lineItems.reduce(
      (sum, item) => sum + item.data.filter((d) => d.value !== null).length,
      0
    );
    const dataCompleteness = filledDataPoints / totalDataPoints;

    return {
      trends: {
        revenue: {
          cagr: revenueCagr,
          volatility: revenueVolatility,
          trend: this.getTrendDirection(revenueValues),
        },
        margins: {
          grossMargin: marginData.map((d) => ({
            year: d.year,
            value: d.grossMargin,
          })),
          ebitdaMargin: marginData.map((d) => ({
            year: d.year,
            value: d.ebitdaMargin,
          })),
          netMargin: [], // TODO: Implement net margin calculation
        },
        growth: {
          revenueGrowth: this.calculateGrowthRates(
            revenueValues,
            revenue.data.map((d) => d.year)
          ),
          ebitdaGrowth: ebitda
            ? this.calculateGrowthRates(
                ebitda.data
                  .filter((d) => d.value !== null)
                  .map((d) => d.value as number),
                ebitda.data.filter((d) => d.value !== null).map((d) => d.year)
              )
            : [],
        },
      },
      normalized: {
        revenue: normalizedRevenue,
        grossProfit: normalizedGrossProfit,
        ebitda: normalizedEbitda,
        ebit: normalizedEbitda, // Approximation - would need D&A for exact calculation
        margins: {
          gross:
            normalizedRevenue > 0
              ? normalizedGrossProfit / normalizedRevenue
              : 0,
          ebitda:
            normalizedRevenue > 0 ? normalizedEbitda / normalizedRevenue : 0,
          ebit:
            normalizedRevenue > 0 ? normalizedEbitda / normalizedRevenue : 0,
        },
      },
      quality: {
        dataCompleteness,
        consistency: this.calculateConsistency(data),
        outliers: this.detectOutliers(data, settings.outlierThreshold),
      },
    };
  }

  static parseCSVData(
    csvText: string,
    hasHeaders: boolean = true
  ): Partial<CompanyFinancialData> {
    const lines = csvText.trim().split('\n');
    const headers = hasHeaders ? lines[0].split(',') : [];
    const dataLines = hasHeaders ? lines.slice(1) : lines;

    // Extract years from headers (assuming format like "2019", "2020", etc.)
    const yearColumns = headers
      .slice(1)
      .map((header, index) => {
        const year = parseInt(header.trim());
        return isNaN(year) ? null : { year, index: index + 1 };
      })
      .filter((col) => col !== null) as Array<{ year: number; index: number }>;

    const lineItems: PLLineItem[] = dataLines.map((line, lineIndex) => {
      const values = line.split(',');
      const itemName = values[0]?.trim() || `Item ${lineIndex + 1}`;

      const data: PLDataPoint[] = yearColumns.map(({ year, index }) => {
        const rawValue = values[index]?.trim().replace(/[$,()]/g, '');
        let value: number | null = null;

        if (rawValue && rawValue !== '-' && rawValue !== '') {
          // Handle negative values in parentheses
          const isNegative = rawValue.includes('(') || rawValue.includes(')');
          const numericValue = parseFloat(rawValue.replace(/[()]/g, ''));
          value = isNaN(numericValue)
            ? null
            : isNegative
              ? -numericValue
              : numericValue;
        }

        return { year, value };
      });

      return {
        id: `item_${lineIndex}`,
        name: itemName,
        category: this.categorizeLineItem(itemName),
        data,
      };
    });

    return {
      lineItems,
      dataSource: 'import' as const,
      lastUpdated: new Date(),
    };
  }

  private static calculateCAGR(values: number[]): number {
    if (values.length < 2) return 0;
    const startValue = values[0];
    const endValue = values[values.length - 1];
    const years = values.length - 1;
    return Math.pow(endValue / startValue, 1 / years) - 1;
  }

  private static calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const growthRates = [];
    for (let i = 1; i < values.length; i++) {
      growthRates.push(values[i] / values[i - 1] - 1);
    }
    const mean =
      growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const variance =
      growthRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) /
      growthRates.length;
    return Math.sqrt(variance);
  }

  private static getTrendDirection(
    values: number[]
  ): 'growing' | 'declining' | 'stable' {
    const cagr = this.calculateCAGR(values);
    if (cagr > 0.02) return 'growing';
    if (cagr < -0.02) return 'declining';
    return 'stable';
  }

  private static normalizeValue(
    values: number[],
    method: 'average' | 'median' | 'latest' | 'trend'
  ): number {
    if (values.length === 0) return 0;

    switch (method) {
      case 'average':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'median':
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
      case 'latest':
        return values[values.length - 1];
      case 'trend':
        // Use linear regression to project latest trend
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return intercept + slope * (n - 1);
      default:
        return values[values.length - 1];
    }
  }

  private static calculateGrowthRates(
    values: number[],
    years: number[]
  ): PLDataPoint[] {
    const growthRates: PLDataPoint[] = [];
    for (let i = 1; i < values.length; i++) {
      growthRates.push({
        year: years[i],
        value: values[i] / values[i - 1] - 1,
      });
    }
    return growthRates;
  }

  private static calculateConsistency(data: CompanyFinancialData): number {
    // Simplified consistency metric based on data completeness and outlier frequency
    const totalItems = data.lineItems.length;
    const completeItems = data.lineItems.filter((item) =>
      item.data.every((d) => d.value !== null)
    ).length;

    return completeItems / totalItems;
  }

  private static detectOutliers(
    data: CompanyFinancialData,
    threshold: number
  ): Array<{
    year: number;
    item: string;
    value: number;
    expectedRange: [number, number];
  }> {
    // Simplified outlier detection - would implement more sophisticated methods in production
    return [];
  }

  private static categorizeLineItem(
    itemName: string
  ): 'revenue' | 'cogs' | 'opex' | 'other' {
    const name = itemName.toLowerCase();

    if (
      name.includes('revenue') ||
      name.includes('sales') ||
      name.includes('income')
    ) {
      return 'revenue';
    }
    if (
      name.includes('cogs') ||
      name.includes('cost of') ||
      name.includes('direct cost')
    ) {
      return 'cogs';
    }
    if (
      name.includes('operating') ||
      name.includes('sg&a') ||
      name.includes('admin') ||
      name.includes('marketing') ||
      name.includes('expense')
    ) {
      return 'opex';
    }
    return 'other';
  }
}
