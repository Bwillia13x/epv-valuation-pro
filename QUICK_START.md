# 🚀 QUICK START GUIDE - EPV Valuation Pro

Get up and running with professional financial analysis in under 5 minutes.

## 📋 Prerequisites

- Node.js 18+ installed
- Basic understanding of financial valuation concepts
- Financial data for your target company

## ⚡ Installation & Setup

```bash
# Clone and setup
git clone <repository-url>
cd epv-valuation-pro
npm install

# Start development server
npm run dev
# Open http://localhost:3000
```

## 🎯 Your First Analysis

### Step 1: Prepare Financial Data
Create a JSON file with your company's financials:

```json
{
  "case_name": "Your Company Name",
  "periods": {"2022": "2022-12-31", "2023": "2023-12-31", "2024": "2024-12-31"},
  "revenue": {
    "service_line_1": [1000000, 1100000, 1200000],
    "service_line_2": [500000, 550000, 600000],
    "total": [1500000, 1650000, 1800000]
  },
  "cogs": {
    "total": [450000, 495000, 540000]
  },
  "opex": {
    "marketing": [150000, 165000, 180000],
    "rent": [120000, 124800, 129792],
    "total": [800000, 860000, 920000]
  }
}
```

### Step 2: Run Multi-Agent Analysis
Load the EPV Platform and use the 4-agent analysis system:

1. **Financial Analyst**: General analysis and EBITDA normalization
2. **Financial Analyst-B**: Advanced business model assessment  
3. **Quantitative Modeler**: Monte Carlo risk analysis
4. **Value Investing Analyst**: Conservative valuation approach

### Step 3: Review Consensus Results
The platform automatically synthesizes all 4 agent recommendations into:
- **Enterprise Value Range**: Minimum to maximum estimates
- **Investment Recommendation**: Consensus buy/hold/sell decision
- **Key Risk Factors**: Prioritized list of concerns
- **Value Creation Plan**: Specific improvement initiatives

## 🏥 Example: Medispa Case Study

**Input**: $3.7M revenue healthcare services business with 6 service lines
**Output**: 
- Enterprise values ranging $1.58M - $10.4M
- 4 independent agent analyses
- Marketing normalization ($484K adjustment identified)
- Monte Carlo modeling with 89.5% probability of positive returns

## 📊 Key Features Demo

### EPV Calculation
```javascript
// The platform automatically calculates:
Enterprise_Value = Normalized_EBITDA / WACC
Equity_Value = Enterprise_Value - Net_Debt
```

### Risk Modeling
- **Monte Carlo**: 10,000 simulation runs
- **Sensitivity Analysis**: Tornado charts for key variables
- **Scenario Planning**: Bull/Base/Bear case modeling

### Professional Reporting
- Investment committee presentations
- Executive summaries with key metrics
- Detailed analysis with supporting calculations

## 🛠️ Customization

### Add New Service Lines
```typescript
const newServiceLine: ServiceLine = {
  id: "new_service",
  name: "New Service",
  price: 500,
  volume: 100,
  cogsPct: 0.3,
  kind: "service"
};
```

### Modify WACC Assumptions
```typescript
const waccInputs = {
  riskFreeRate: 0.045,
  marketRisk: 0.065,
  beta: 1.2,
  sizePremium: 0.02,
  specificRisk: 0.03
};
```

## 🔍 Troubleshooting

**Build Issues**:
```bash
rm -rf node_modules .next
npm install
npm run build
```

**Performance Issues**:
- Reduce Monte Carlo iterations for faster simulation
- Use production build: `npm run build && npm start`

**Data Issues**:
- Ensure all financial data ties out (revenue = sum of service lines)
- Validate that EBITDA = Operating Income + D&A
- Check for missing required fields

## 📚 Next Steps

1. **Advanced Features**: Explore LBO modeling and franchise factor analysis
2. **Case Studies**: Review existing medispa and healthcare analyses
3. **Customization**: Adapt for your specific industry sector
4. **Integration**: Connect with your existing financial data sources

## 💡 Pro Tips

- **Data Quality**: Spend time on accurate data normalization - it drives 80% of valuation accuracy
- **Agent Consensus**: Pay attention when all 4 agents agree - high confidence signal
- **Risk Assessment**: Use Monte Carlo results to set appropriate margins of safety
- **Documentation**: Save detailed analysis notes for future reference

## 🆘 Support

- Check the main README.md for detailed technical documentation
- Review existing case studies in the `/archive` folder
- For specific questions, create detailed analysis scenarios and test

**Ready to analyze your first deal? Let's go! 🚀**