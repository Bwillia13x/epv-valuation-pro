# EPV Valuation Pro Platform

A professional-grade Earnings Power Value (EPV) valuation system with advanced financial modeling capabilities, built with Next.js, TypeScript, and Tailwind CSS.

🚀 **NEW**: Multi-Agent Financial Analysis System with 4 specialized AI analysts providing independent investment recommendations.

## 📊 Recent Case Studies

- **Multi-Service Medispa Analysis**: Complete $3.7M revenue case with 6 service lines
- **Financial Dataset V1**: Normalized and validated medispa financials
- **4-Agent Analysis**: Independent valuations ranging from $1.58M - $10.4M
- **Monte Carlo Modeling**: 10,000+ iteration risk analysis

## 🚀 Features

### Core Valuation Engine

- **Greenwald EPV Methodology**: Proper implementation of Bruce Greenwald's Earnings Power Value approach
- **Multi-Scenario Analysis**: Base, Bull, and Bear case modeling with scenario adjustments
- **Asset Reproduction Value**: Detailed reproduction cost modeling for franchise analysis
- **Advanced WACC Calculation**: CAPM-based cost of capital with size and specific risk premia

### Financial Modeling

- **Service Line Builder**: Granular revenue modeling with individual pricing, volumes, and margins
- **Cost Structure Analysis**: Detailed variable costs, fixed costs, and operating expenses
- **Working Capital Modeling**: DSO/DSI/DPO calculations for cash flow analysis
- **Monte Carlo Simulation**: Configurable risk analysis with distribution statistics

### Advanced Analytics

- **Multi-Agent Analysis**: 4 specialized financial analysts (General, Advanced, Quant, Value Investing)
- **Sensitivity Analysis**: WACC vs EBIT margin valuation sensitivity tables
- **Monte Carlo Simulation**: 10,000+ iteration risk modeling with confidence intervals
- **LBO Modeling**: Deal structuring with transaction costs and exit scenarios
- **Franchise Factor Analysis**: EPV vs Reproduction value comparison
- **Real-time Calculations**: Live updates as inputs change

### User Experience

- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Data Persistence**: Local storage for scenario saving and loading
- **Export Capabilities**: JSON report generation for external analysis
- **Professional UI**: Clean, modern interface suitable for client presentations

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts (optional, for enhanced visualizations)
- **Build Tool**: Next.js with optimized production builds
- **Deployment**: Vercel-ready with zero configuration

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd epv-valuation-pro

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

## 🏗️ Project Structure

```
summit2/
├── components/           # React components
│   └── MedispaEPVProCliPage.tsx  # Main EPV component
├── lib/                 # Shared utilities
│   └── valuationModels.ts         # Monte Carlo and math helpers
├── pages/               # Next.js pages
│   ├── _app.tsx        # App wrapper
│   └── index.tsx       # Home page
├── styles/              # Global styles
│   └── globals.css     # Tailwind imports
├── package.json         # Dependencies and scripts
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

## 🎯 Usage

### Basic Workflow

1. **Input Data**: Enter service line details, costs, and financial parameters
2. **Model Review**: Review the financial model and normalized earnings
3. **Valuation Analysis**: Examine EPV, reproduction value, and franchise factors
4. **Sensitivity Testing**: Explore WACC and margin sensitivity
5. **Risk Analysis**: Run Monte Carlo simulations for distribution analysis
6. **LBO Modeling**: Structure potential leveraged buyout scenarios

### Key Inputs

- **Revenue Lines**: Individual service/retail line items with pricing and volumes
- **Cost Structure**: Clinical labor, marketing, admin, and fixed costs
- **Normalizations**: Owner add-backs, D&A, and maintenance capex
- **Capital Structure**: Cash, debt, and WACC parameters
- **Asset Reproduction**: Buildout, equipment, and startup costs

### Outputs

- **Enterprise EPV**: Core valuation based on normalized earnings
- **Equity Value**: EPV plus cash minus debt
- **Franchise Factor**: EPV divided by reproduction value
- **Sensitivity Tables**: Valuation ranges across WACC and margin scenarios
- **Monte Carlo Statistics**: Mean, median, and percentile distributions

## 🔧 Configuration

### Environment Variables

No environment variables required for basic functionality.

### Customization

- Modify default service lines in `components/MedispaEPVProCliPage.tsx`
- Adjust WACC parameters for different industry sectors
- Customize Monte Carlo simulation parameters in `lib/valuationModels.ts`

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

The application is compatible with any platform supporting Next.js:

- Netlify
- AWS Amplify
- Google Cloud Run
- Docker containers

## 📊 Performance

- **Bundle Size**: ~80KB gzipped (main bundle)
- **Build Time**: ~30 seconds on standard hardware
- **Runtime**: Optimized for real-time calculations
- **Memory**: Efficient React rendering with memoization

## 🧪 Testing

### Development Testing

```bash
# Run linting
npm run lint

# Type checking
npm run type-check

# Build verification
npm run build
```

### Manual Testing Checklist

- [ ] Service line addition/removal
- [ ] Scenario switching (Base/Bull/Bear)
- [ ] Monte Carlo simulation execution
- [ ] Data persistence (save/load)
- [ ] Responsive design on mobile
- [ ] Export functionality

## 📈 Roadmap

### Planned Features

- [ ] Real-time data integration (Yahoo Finance API)
- [ ] Advanced charting with Recharts
- [ ] Multi-location modeling
- [ ] User authentication and cloud storage
- [ ] PDF report generation
- [ ] API endpoints for external integrations

### Technical Improvements

- [ ] Web Workers for Monte Carlo calculations
- [ ] Service Worker for offline functionality
- [ ] Progressive Web App (PWA) features
- [ ] Enhanced accessibility compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This software is for educational and professional analysis purposes only. The valuations and financial models provided are not investment advice. Users should conduct their own due diligence and consult with qualified professionals before making investment decisions.

## 🆘 Support

For technical support or feature requests:

- Create an issue in the GitHub repository
- Review the documentation in `/docs` (if available)
- Check the troubleshooting section below

## 🔍 Troubleshooting

### Common Issues

**Build Errors**

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

**Runtime Errors**

- Ensure all dependencies are installed: `npm install`
- Check browser console for JavaScript errors
- Verify TypeScript compilation: `npm run type-check`

**Performance Issues**

- Reduce Monte Carlo runs for faster simulation
- Use production build for optimal performance
- Check for memory leaks in browser dev tools

---

**Built with ❤️ for professional financial analysis**
