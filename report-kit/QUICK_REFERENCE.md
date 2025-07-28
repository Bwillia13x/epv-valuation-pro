# CPP Visual Report Kit — Quick Reference

## 🚀 **ESSENTIAL COMMANDS**

### **1. Generate Visuals**
```bash
cd report-kit
node scripts/render.mjs --case cases/{target}.json --title "Company Name" --ttm "TTM Window" --out {target}_exports
```

### **2. Create PDF**
```bash
python3 create_fixed_charts_pdf.py {export_directory} "Company Name" {output_filename}.pdf
```

### **3. Fix Empty Charts**
```bash
python3 fix_chart_data.py  # For KPIs, Monte Carlo, Tornado
```

---

## 🔧 **INSTANT FIXES**

### **JSON Schema Issues**
```bash
# Compare with working example:
diff cases/vistabelle.json cases/{your_case}.json

# Check required fields:
grep -r "reported_ebitda\|ttm_revenue\|epv_enterprise" templates/
```

### **Empty Chart Fixes**
```json
// KPI Dashboard (0% issue):
"operating_kpis": {
  "revenue_growth": {"current": 8.5, "target": 10.0, "unit": "%"}
}

// Monte Carlo (empty):
"monte_carlo": {
  "results": {
    "irr_distribution": [18.5, 20.2, 22.8, 25.6, 28.1],
    "percentiles": {"p10": 18.5, "p50": 22.8, "p90": 28.1}
  }
}

// Tornado (empty):
"sensitivity_analysis": {
  "base_irr": 22.8,
  "variables": [{"name": "Entry Multiple", "low_irr": 27.2, "high_irr": 18.4}]
}
```

---

## ✅ **SUCCESS VALIDATION**

```bash
# Check outputs:
ls -la {target}_exports/*.png | wc -l    # Should be 8
du -h {target}_exports/                  # Should be ~2-3MB

# Verify PDF:
open {target}_exports/{filename}.pdf
```

---

## 🆘 **EMERGENCY TROUBLESHOOTING**

| **Problem** | **Quick Fix** |
|-------------|---------------|
| Browser launch failed | Continue anyway (fallback mode) |
| Acceptance checks fail | Fix JSON field names/values |
| Charts empty | Update data structures |
| PDF blank charts | Run `create_fixed_charts_pdf.py` |
| Wrong colors | Check CSS variables in `public/css/report.css` |

---

**🎯 SUCCESS = 8/8 charts + 9/9 acceptance checks + working PDF** 