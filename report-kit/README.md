# CPP Visual Report Kit

## 🎯 **Local "Pixel-Perfect" Visuals Generator**

A self-contained report kit that generates institutional-quality CPP visuals from case JSON data using HTML/CSS/JS + ECharts + Puppeteer. Everything runs locally in Cursor IDE with no cloud dependencies.

## 📊 **Generated Outputs**

- **4 High-Resolution PNGs** (1280×720, 300 DPI equivalent)
  - `01_EBITDA_Bridge.png` - Waterfall chart with TTM normalizations
  - `02_Valuation_Matrix.png` - Enhanced table with base case highlight
  - `03_EPV_Panel.png` - Formula + 3×3 sensitivity matrix
  - `04_LBO_Summary.png` - Sources/uses + debt schedule + exit metrics

- **1 Professional PDF**
  - `CPP_OnePager.pdf` - 2×2 grid layout (A4/Letter print-ready)

- **1 Summary Report**
  - `summary.txt` - Key metrics and validation results

## 🚀 **Quick Start**

### **1. Install Dependencies**
```bash
cd report-kit
npm install
```

### **2. Prepare Case Data**
Drop your case JSON file into `cases/` directory:
```bash
# Example: Copy HarborGlow case data
cp ../harborglow_aesthetic_simulation_results.json cases/harborglow.json
```

### **3. Generate Visuals**
```bash
node scripts/render.mjs \
  --case cases/harborglow.json \
  --title "HarborGlow Aesthetics (Nashville)" \
  --ttm "2024-Q3 → 2025-Q2" \
  --out exports
```

### **4. View Results**
Open `/exports` directory to find:
- Four high-resolution PNG charts
- Professional one-pager PDF
- Summary validation report

## 📁 **File Structure**

```
report-kit/
├── README.md                    # This file
├── package.json                 # Dependencies (puppeteer)
├── scripts/
│   ├── render.mjs              # Main CLI renderer
│   └── compare.mjs             # Optional: multi-case comparison
├── templates/
│   ├── onepager.html           # 2×2 grid one-pager
│   ├── bridge.html             # EBITDA Bridge waterfall
│   ├── matrix.html             # Valuation matrix table
│   ├── epv.html                # EPV formula + sensitivity
│   └── lbo.html                # LBO summary panels
├── public/
│   ├── css/report.css          # Print-friendly styling
│   └── js/
│       ├── format.js           # Number formatting utilities
│       └── acceptance.js       # Validation checks
├── vendor/                     # Vendored libraries (no CDN)
│   ├── echarts.min.js
│   ├── katex.min.js
│   └── katex.min.css
├── cases/                      # Input JSON files
│   └── sample.json
└── exports/                    # Generated outputs
    ├── 01_EBITDA_Bridge.png
    ├── 02_Valuation_Matrix.png
    ├── 03_EPV_Panel.png
    ├── 04_LBO_Summary.png
    ├── CPP_OnePager.pdf
    └── summary.txt
```

## 🔧 **CLI Options**

```bash
node scripts/render.mjs [options]

Options:
  --case <path>     Path to case JSON file (required)
  --title <text>    Case title for headers (required)
  --ttm <text>      TTM window description (required)
  --out <dir>       Output directory (default: exports)
  --help           Show this help message

Examples:
  # HarborGlow case
  node scripts/render.mjs \
    --case cases/harborglow.json \
    --title "HarborGlow Aesthetics (Nashville)" \
    --ttm "2024-Q3 → 2025-Q2" \
    --out exports

  # LumiDerm case
  node scripts/render.mjs \
    --case cases/lumiderm.json \
    --title "LumiDerm Aesthetic Group (Scottsdale)" \
    --ttm "2024-Q3 → 2025-Q2" \
    --out lumiderm_exports
```

## ✅ **Acceptance Criteria**

The renderer performs automatic validation with ±0.5% tolerance:

1. **EBITDA Bridge**: `Reported + Owner + One-time + Rent = Adjusted`
2. **Valuation Matrix**: `EV = Adj. EBITDA × Multiple` (base case)
3. **LBO Exit Logic**: `Exit Equity = Exit EV - Exit Debt`
4. **EPV Consistency**: Headline values match JSON data

**If any validation fails, the script exits with error code 1 and shows differences.**

## 🎨 **Visual Design Features**

### **Color Scheme (CPP Convention)**
- **Blue (#2563eb)**: Input values and user assumptions
- **Black (#1f2937)**: Linked/calculated values
- **Green (#16a34a)**: Output results and final values
- **Light Grey (#f8f9fa)**: Neutral backgrounds

### **Typography & Layout**
- **System font stack** for cross-platform consistency
- **Grid-based layouts** with consistent spacing
- **Print-optimized CSS** for high-quality PDF output
- **Responsive scaling** for different output sizes

### **Chart Specifications**
- **EBITDA Bridge**: Floating waterfall bars with connecting lines
- **Valuation Matrix**: Professional table with highlighted base case
- **EPV Panel**: Split layout with KaTeX formula + color-coded sensitivity
- **LBO Summary**: Multi-panel with debt schedule line chart

## 🔍 **Data Requirements**

Your case JSON must include these fields:

```json
{
  "ttm_metrics": {
    "ttm_revenue": 7610000,
    "ttm_ebitda_reported": 1520500,
    "ttm_ebitda_adjusted": 1685500,
    "ttm_margin": 0.221
  },
  "ebitda_bridge": {
    "reported_ebitda": 1520500,
    "owner_addback": 180000,
    "onetime_addback": 105000,
    "rent_normalization": -120000,
    "adjusted_ebitda": 1685500
  },
  "valuation_matrix": [
    {
      "multiple": 8.5,
      "enterprise_value": 14326750,
      "equity_value_to_seller": 12386750,
      "ev_revenue_ratio": 1.88
    }
  ],
  "sources_uses": { ... },
  "debt_schedule": [ ... ],
  "irr_analysis": { ... },
  "epv_analysis": { ... },
  "epv_sensitivity": [ ... ]
}
```

## 🛠 **Development**

### **Adding New Chart Types**
1. Create new template in `templates/`
2. Add ECharts configuration
3. Update renderer script to include new template
4. Test with sample data

### **Customizing Styling**
- Edit `public/css/report.css` for layout changes
- Modify chart options in individual templates
- Update color scheme in CSS variables

### **Testing Locally**
```bash
# Test with sample data
node scripts/render.mjs \
  --case cases/sample.json \
  --title "Test Case" \
  --ttm "2024-Q3 → 2025-Q2" \
  --out test_exports

# Validate outputs
ls -la test_exports/
```

## 📋 **Troubleshooting**

### **Common Issues**

1. **"Cannot find module 'puppeteer'"**
   ```bash
   npm install puppeteer
   ```

2. **Charts not rendering**
   - Check that all vendor files are present
   - Verify case JSON structure matches requirements
   - Check browser console for JavaScript errors

3. **PDF export fails**
   - Ensure sufficient memory for Puppeteer
   - Check file permissions in output directory
   - Verify all templates load without errors

4. **Acceptance checks fail**
   - Review JSON data for calculation errors
   - Check tolerance settings in acceptance.js
   - Verify bridge reconciliation manually

### **Performance Tips**
- Use `--out` to specify different directories for concurrent runs
- Close other applications during PDF generation for better performance
- Consider increasing Node.js memory limit for large datasets

## 🎯 **Quality Standards**

This report kit meets institutional requirements:

✅ **Mathematical Accuracy**: All calculations validated to ±0.5%  
✅ **Professional Design**: CPP color convention and typography  
✅ **Print Quality**: 300 DPI equivalent resolution  
✅ **Audit Ready**: Full transparency and validation  
✅ **Self-Contained**: No external dependencies or cloud services  

## 📞 **Support**

For issues or feature requests:
1. Check this README for common solutions
2. Verify your case JSON structure
3. Test with provided sample data
4. Review acceptance check failures

---

*Generated for CPP Private Equity Analysis*  
*Quality: Investment Grade | Status: Production Ready* 