# CPP Visual Report Kit — Agent Creation Roadmap

## 🎯 **MISSION STATEMENT**
Create investment-grade visual analysis packs for private equity deal evaluation using the CPP Visual Report Kit system. This roadmap provides step-by-step instructions for agents to generate professional, mathematically accurate, and presentation-ready financial visualizations.

---

## 📋 **PHASE 1: SUMMIT MODEL EXECUTION**

### **1.1 Input Processing**
When user provides a broker packet or case data:

```python
# Create simulation script: {target_name}_simulation.py
# Key components:
- TTM window calculation (specific quarters)
- EBITDA Bridge normalization 
- Valuation Matrix (7.0x - 10.0x multiples)
- EPV Analysis (EBIT, NOPAT, reinvestment, WACC)
- LBO Analysis (Sources/Uses, debt schedule, returns)
- Operating KPIs
- Balance sheet data
```

### **1.2 Required Output Format**
```python
results = {
    'company_info': {
        'name': 'Company Name',
        'location': 'City, State',
        'ttm_window': '2024-Q3 → 2025-Q2'
    },
    'ttm_metrics': {...},
    'ebitda_bridge': {...},
    'valuation_matrix': [...],
    'epv_analysis': {...},
    'sources_uses': {...},
    'irr_analysis': {...},
    'debt_schedule': [...],
    'operating_kpis': {...},
    'monte_carlo': {...},
    'scenario_analysis': {...},
    'sensitivity_analysis': {...},
    'assumptions': {...}
}
```

### **1.3 Critical Validations**
- ✅ TTM calculations sum correctly
- ✅ EBITDA Bridge reconciles (tolerance: 0.5%)
- ✅ EPV Enterprise = EPV FCF / WACC
- ✅ LBO Exit Equity = Exit EV - Final Debt
- ✅ All financial relationships mathematically consistent

---

## 📊 **PHASE 2: JSON CASE FILE PREPARATION**

### **2.1 Schema Alignment**
The JSON case file MUST match the expected schema:

```bash
# Compare your case with working example:
cat cases/vistabelle.json | head -50
cat cases/auroraskin.json | head -50
```

### **2.2 Critical Field Mappings**
**TOP-LEVEL STRUCTURE:**
```json
{
  "company_info": {
    "name": "Company Name",
    "ttm_window": "Period"
  },
  "ttm_metrics": {
    "ttm_revenue": 8750000,
    "ttm_ebitda_adjusted": 1806000
  },
  "ebitda_bridge": {
    "reported_ebitda": 1610000,
    "owner_addback": 200000,
    "onetime_addback": 80000,
    "rent_normalization": -84000,
    "adjusted_ebitda": 1806000
  },
  "valuation_matrix": [...],
  "epv_analysis": {
    "ebit": 1686000,
    "nopat": 1247640,
    "reinvestment": 151740,
    "fcf": 1095900,
    "epv_enterprise": 9132500,
    "epv_equity": 7102500
  }
}
```

### **2.3 Advanced Analytics Requirements**

**OPERATING KPIs** *(for dashboard gauges)*:
```json
"operating_kpis": {
  "revenue_growth": {"current": 8.5, "target": 10.0, "unit": "%"},
  "ebitda_margin": {"current": 20.6, "target": 22.0, "unit": "%"},
  "sponsor_irr": {"current": 22.8, "target": 20.0, "unit": "%"},
  "moic": {"current": 2.8, "target": 2.5, "unit": "x"},
  "debt_to_ebitda": {"current": 6.2, "target": 5.5, "unit": "x"},
  "coverage_ratio": {"current": 1.8, "target": 1.5, "unit": "x"}
}
```

**MONTE CARLO** *(for risk simulation)*:
```json
"monte_carlo": {
  "iterations": 10000,
  "variables": {
    "entry_multiple": {"mean": 8.5, "std": 0.5},
    "exit_multiple": {"mean": 8.0, "std": 0.3},
    "ebitda_margin": {"mean": 20.6, "std": 1.5},
    "revenue_growth": {"mean": 8.0, "std": 2.0}
  },
  "results": {
    "irr_distribution": [12.5, 15.2, 18.1, 20.8, 22.8, 25.1, 27.9, 30.2, 33.1],
    "percentiles": {"p10": 18.5, "p50": 22.8, "p90": 28.1},
    "probability_above_20": 0.78
  }
}
```

**SENSITIVITY ANALYSIS** *(for tornado chart)*:
```json
"sensitivity_analysis": {
  "base_irr": 22.8,
  "variables": [
    {
      "name": "Entry Multiple",
      "base_value": 8.5,
      "low_value": 7.5,
      "high_value": 9.5,
      "low_irr": 27.2,
      "high_irr": 18.4,
      "impact": 4.4
    }
  ]
}
```

---

## 🎨 **PHASE 3: VISUAL GENERATION**

### **3.1 Standard Generation Command**
```bash
cd report-kit
node scripts/render.mjs --case cases/{target}.json --title "Company Name (Location)" --ttm "TTM Window" --out {target}_exports
```

### **3.2 Expected Outputs**
```
{target}_exports/
├── 01_EBITDA_Bridge.png      # Waterfall with reconciliation
├── 02_Valuation_Matrix.png   # 7.0x-10.0x comprehensive grid  
├── 03_EPV_Panel.png          # 3×3 sensitivity with intrinsic value
├── 04_LBO_Summary.png        # Sources/uses, debt schedule, returns
├── 05_KPI_Dashboard.png      # Performance gauges
├── 06_Monte_Carlo.png        # 10K-iteration risk simulation
├── 07_Scenario_Analysis.png  # Base/downside/upside modeling
├── 08_Sensitivity_Tornado.png # IRR impact ranking
└── CPP_OnePager.pdf          # Executive summary
```

### **3.3 Acceptance Checks**
The system runs 9 automatic validation checks:
- EBITDA Bridge Reconciliation
- Valuation Matrix (8.5× Multiple)
- LBO Exit Equity Calculation
- EPV Calculation Consistency
- Revenue Growth Consistency
- EBITDA Margin Reasonableness
- IRR Reasonableness
- Base Matrix Calculation
- EPV Equity Calculation

**ALL CHECKS MUST PASS** before proceeding.

---

## 🔧 **PHASE 4: TROUBLESHOOTING GUIDE**

### **4.1 Common JSON Schema Errors**

**Error:** `Cannot read properties of undefined (reading 'reported_ebitda')`
**Fix:** Field name mismatch. Check:
```bash
grep -r "reported_ebitda" templates/
# Ensure your JSON uses exact field names
```

**Error:** `Waiting failed: 10000ms exceeded`
**Fix:** Missing required data arrays. Add:
- `debt_schedule` array
- `epv_sensitivity` matrix
- Complete `assumptions` object

### **4.2 Empty Chart Issues**

**KPI Dashboard showing 0%:**
```python
# Fix with proper gauge data structure:
"operating_kpis": {
  "metric_name": {
    "current": 22.8,
    "target": 20.0, 
    "unit": "%"
  }
}
```

**Monte Carlo empty:**
```python
# Add complete simulation results:
"monte_carlo": {
  "results": {
    "irr_distribution": [array_of_values],
    "percentiles": {"p10": X, "p50": Y, "p90": Z}
  }
}
```

**Tornado Chart empty:**
```python
# Use sensitivity_analysis (not sensitivity_variables):
"sensitivity_analysis": {
  "base_irr": 22.8,
  "variables": [detailed_array]
}
```

### **4.3 Chart Enhancement Script**
If charts render but need improvement, use:
```python
# Create fix_chart_data.py with:
- create_kpi_dashboard_data()
- create_monte_carlo_chart() 
- create_tornado_chart()
# Then replace original charts
```

---

## 📄 **PHASE 5: PDF COMPILATION**

### **5.1 Standard PDF Creation**
```bash
python3 create_fixed_charts_pdf.py {export_directory} "Company Name" {output_filename}.pdf
```

### **5.2 Image Compatibility Fix**
If charts don't render in PDF:
```python
# The script includes convert_png_for_pdf() function:
- Converts RGBA to RGB format
- Adds white background
- Resizes if too large (max 1920x1080)
- Optimizes for ReportLab compatibility
```

### **5.3 Quality Validation**
- ✅ All 8 charts display properly
- ✅ High resolution (charts should be >150KB each)
- ✅ Mathematical accuracy confirmed
- ✅ Professional formatting consistent

---

## 🎯 **PHASE 6: STYLING STANDARDS**

### **6.1 CPP Color Palette**
```css
--color-input: #2563eb;      /* Blue for inputs */
--color-linked: #1e293b;     /* Dark slate for linked */
--color-output: #16a34a;     /* Green for outputs */
--color-negative: #dc2626;   /* Red for negatives */
--color-neutral: #64748b;    /* Gray for neutral */
```

### **6.2 Typography Requirements**
```css
--font-family: system-ui;
--font-size-base: 14px;      /* Standard text */
--font-size-caption: 12px;   /* Small labels */
--font-size-lg: 18px;        /* Headings */
```

### **6.3 Currency Formatting**
```javascript
// Use $X.XXM format consistently
__FORMAT__.moneyM(value, 2)  // Results in "$15.35M"
__FORMAT__.pct(value, 1)     // Results in "20.6%"
__FORMAT__.multiple(value, 1) // Results in "8.5×"
```

---

## 🚀 **PHASE 7: FINAL DELIVERABLE**

### **7.1 Complete Package Contents**
```
📁 {target}_complete_exports/
├── 📊 01_EBITDA_Bridge.png
├── 📊 02_Valuation_Matrix.png  
├── 📊 03_EPV_Panel.png
├── 📊 04_LBO_Summary.png
├── 📊 05_KPI_Dashboard.png
├── 📊 06_Monte_Carlo.png
├── 📊 07_Scenario_Analysis.png
├── 📊 08_Sensitivity_Tornado.png
├── 📄 CPP_OnePager.pdf
└── 📄 {Company}_Complete_Analysis.pdf
```

### **7.2 Quality Checklist**
- [ ] All 9 acceptance checks passed
- [ ] 8/8 charts rendered successfully  
- [ ] PDF opens and displays all charts
- [ ] Mathematical calculations validated
- [ ] Professional styling applied
- [ ] High-resolution quality (300 DPI)
- [ ] Investment committee ready

### **7.3 Success Metrics**
- **File sizes:** PNGs ~150-200KB each, PDF ~1.5-2MB
- **Resolution:** 300 DPI for presentation quality
- **Accuracy:** 0.5% tolerance on all calculations
- **Completeness:** All 8 chart types with data

---

## ⚠️ **CRITICAL SUCCESS FACTORS**

1. **Schema Adherence:** JSON structure must EXACTLY match vistabelle.json pattern
2. **Data Completeness:** All advanced analytics (KPIs, Monte Carlo, Sensitivity) required
3. **Mathematical Validation:** Acceptance checks are non-negotiable
4. **Professional Quality:** Investment committee presentation standards
5. **Error Recovery:** Use fix scripts for chart-specific issues

---

## 📞 **EMERGENCY PROCEDURES**

**If visual generation completely fails:**
1. Check JSON schema against working example
2. Run acceptance checks manually
3. Generate problematic charts with Python fallbacks
4. Use create_fixed_charts_pdf.py for final compilation

**If charts are blank/empty:**
1. Verify data structure matches templates
2. Check for missing required arrays
3. Run chart-specific fix functions
4. Regenerate with corrected data

**If PDF won't open/display:**
1. Check PNG format compatibility  
2. Use convert_png_for_pdf() function
3. Verify file sizes are reasonable
4. Test with different PDF readers

---

## ✅ **FINAL VALIDATION**

Before delivering to user:
```bash
# Verify complete package:
ls -la {target}_exports/*.png | wc -l    # Should be 8
ls -la {target}_exports/*.pdf | wc -l    # Should be 1+
du -h {target}_exports/                  # Should be ~2-3MB total

# Open PDF to confirm:
open {target}_exports/{Company}_Analysis.pdf
```

**SUCCESS CRITERIA:** User receives investment-grade visual analysis pack with all charts working, mathematically accurate, and presentation-ready.

---

*This roadmap ensures consistent, high-quality deliverables for all CPP visual analysis projects.* 