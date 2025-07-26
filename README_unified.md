# Unified EPV Valuation System

A sophisticated financial modeling tool that combines the best of both worlds:
- **Granular input control** from summit1 (manual service line modeling)
- **Real financial data integration** from zenit1 (Yahoo Finance API)
- **Advanced analytics** and professional-grade calculations

## Key Features

### 🎯 **Dual Data Sources**
- **Manual Mode**: Build revenue models line-by-line with full control over pricing, volumes, and cost structures
- **Real Data Mode**: Pull actual financial statements from Yahoo Finance for public companies

### 📊 **Comprehensive Modeling**
- **Revenue Builder**: Create detailed service line models with individual pricing, volumes, and margins
- **Cost Structure**: Granular control over variable costs, fixed costs, and operating expenses
- **EPV Calculation**: Proper implementation of Bruce Greenwald's Earnings Power Value methodology
- **Asset Reproduction**: Estimate the cost to replicate the business assets

### 🔧 **Advanced Features**
- **Working Capital Modeling**: DSO, DSI, DPO calculations for cash flow analysis
- **WACC Calculation**: CAPM-based cost of capital with size and specific risk premia
- **Scenario Analysis**: Base, Bull, and Bear case modeling
- **Monte Carlo Simulation**: Risk analysis with configurable distributions

### 📈 **Professional Analytics**
- **Sensitivity Analysis**: Heatmaps and tornado charts
- **Valuation Bridge**: Step-by-step breakdown of value creation
- **Financial Ratios**: EV/Revenue, EV/EBITDA, franchise ratios
- **Working Capital Analysis**: Cash conversion cycle modeling

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements_unified.txt
   ```

2. **Run the Application**:
   ```bash
   streamlit run unified_epv_system.py
   ```

3. **Choose Your Mode**:
   - **Manual Mode**: Build custom revenue models with granular control
   - **Real Data Mode**: Analyze public companies with actual financial data

## Usage Examples

### Manual Mode (Medispa Example)
1. Select "Revenue Builder" tab
2. Add service lines (Injectables, Laser, Aesthetics, etc.)
3. Set pricing, volumes, and cost structures
4. Configure cost structure and valuation parameters
5. View comprehensive valuation results

### Real Data Mode (Public Company)
1. Enable "Use Real Financial Data" in sidebar
2. Enter ticker symbol (e.g., AAPL, MSFT, GOOGL)
3. Review auto-populated financial data
4. Adjust normalization and valuation parameters
5. Analyze results with professional-grade metrics

## Key Advantages

### From Summit1 (Granular Control)
- ✅ **Service Line Modeling**: Individual revenue streams with custom pricing
- ✅ **Cost Structure Control**: Detailed variable and fixed cost modeling
- ✅ **Working Capital**: DSO/DSI/DPO modeling for cash flow analysis
- ✅ **Asset Reproduction**: Detailed asset-by-asset reproduction cost modeling

### From Zenit1 (Professional Features)
- ✅ **Real Financial Data**: Yahoo Finance integration for public companies
- ✅ **Advanced EPV**: Proper Greenwald methodology implementation
- ✅ **Professional Analytics**: Sensitivity analysis, Monte Carlo, tornado charts
- ✅ **Production Ready**: Streamlit web app with proper UI/UX

## Technical Architecture

### Core Components
- **Data Layer**: Yahoo Finance API + manual input handling
- **Modeling Layer**: EPV calculations, WACC, working capital
- **Analytics Layer**: Sensitivity analysis, Monte Carlo simulation
- **UI Layer**: Streamlit with tabbed interface

### Key Functions
- `compute_unified_epv()`: Main valuation engine
- `calculate_cost_structure()`: Comprehensive cost modeling
- `calculate_wacc()`: CAPM-based cost of capital
- `calculate_asset_reproduction()`: Asset replication modeling

## Advanced Features

### Financial Modeling
- **Normalization**: Multi-year historical averaging with method selection
- **Capitalization**: Optional R&D and SG&A capitalization
- **Working Capital**: Industry-specific cash conversion cycle modeling
- **Tax Optimization**: Effective tax rate modeling and adjustments

### Risk Analysis
- **Sensitivity Testing**: Parameter impact analysis
- **Monte Carlo**: Probabilistic outcome modeling
- **Scenario Analysis**: Base/Bull/Bear case modeling
- **Stress Testing**: Extreme scenario analysis

### Professional Outputs
- **Valuation Bridge**: Step-by-step value creation breakdown
- **Financial Ratios**: Industry-standard valuation metrics
- **Working Capital Analysis**: Cash flow optimization insights
- **Asset Reproduction**: Moat and competitive advantage analysis

## Use Cases

### Private Equity
- **Due Diligence**: Comprehensive valuation analysis
- **Deal Modeling**: Scenario analysis and sensitivity testing
- **Portfolio Management**: Ongoing valuation monitoring

### Investment Banking
- **Fairness Opinions**: Professional-grade valuation analysis
- **M&A Advisory**: Deal structuring and valuation support
- **Capital Raising**: Investor presentation materials

### Corporate Finance
- **Strategic Planning**: Business unit valuation
- **Capital Allocation**: Investment decision support
- **Performance Monitoring**: Value creation tracking

## Customization

### Industry-Specific Models
- **Healthcare**: Medispa, dental, veterinary practices
- **Retail**: Multi-location retail chains
- **Manufacturing**: Capital-intensive operations
- **Technology**: R&D-intensive companies

### Geographic Variations
- **US Market**: Standard US GAAP and tax structures
- **International**: Multi-currency and tax regime support
- **Emerging Markets**: Higher risk premia and volatility

## Best Practices

### Data Quality
- Use multiple years of historical data for normalization
- Validate assumptions against industry benchmarks
- Cross-check calculations with alternative methods

### Model Validation
- Compare EPV results with market multiples
- Validate working capital assumptions
- Test sensitivity of key parameters

### Documentation
- Document all assumptions and methodology
- Maintain audit trail of calculations
- Version control for model changes

## Support & Development

This unified system represents a significant advancement in financial modeling tools, combining the best features of both source models while adding new capabilities for professional-grade analysis.

For questions, suggestions, or customizations, please refer to the code comments and documentation within the application. 