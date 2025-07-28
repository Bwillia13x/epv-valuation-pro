# 📖 HOW TO USE CLAUDE SUBAGENT PROMPT

**File:** `CLAUDE_SUBAGENT_ANALYSIS_PROMPT.md`  
**Purpose:** Enable other Claude instances to conduct medispa investment analysis  
**Model:** Summit EPV Valuation System v2.0  

---

## 🎯 **QUICK START GUIDE**

### **For Claude Subagents:**

1. **Copy the entire prompt** from `CLAUDE_SUBAGENT_ANALYSIS_PROMPT.md`
2. **Add your specific financial data** in the JSON format specified
3. **Execute the analysis** following the 4-phase methodology
4. **Generate deliverables** matching the expected format

### **For Human Users:**

1. **Prepare financial data** in the specified JSON format
2. **Copy the prompt + your data** to a new Claude conversation
3. **Request analysis** using this format:

```
Please analyze this medispa investment opportunity using the provided framework.

[PASTE THE ENTIRE PROMPT HERE]

Here is the financial data to analyze:
{
  "units": "$000s",
  "period_end_dates": ["2022-12-31", "2023-12-31", "2024-12-31"],
  "pnl_summary": {
    "revenue_total": [YOUR_DATA_HERE],
    // ... rest of your financial data
  }
}

Please provide a complete investment analysis with recommendation.
```

---

## 📊 **DATA PREPARATION CHECKLIST**

Before using the prompt, ensure your data includes:

- ✅ **3-year P&L summary** (revenue, COGS, operating expenses, income)
- ✅ **Revenue by service line** (detailed breakdown by business segment)
- ✅ **COGS by service line** (cost structure by revenue stream)
- ✅ **Operating expense detail** (marketing, rent, salaries, etc.)
- ✅ **Derived metrics** (margins, growth rates, ratios)

### **Data Quality Standards:**
- All values in consistent units (preferably $000s)
- Complete 3-year historical data (minimum)
- Accurate service line classifications
- Proper expense categorization

---

## 🎯 **EXPECTED OUTCOMES**

### **Analysis Quality:**
- **Professional-grade** investment recommendation
- **Quantitative valuation** using EPV methodology
- **Risk assessment** with mitigation strategies
- **Implementation roadmap** with monitoring framework

### **Deliverable Standards:**
- **Executive summary** (2-3 pages)
- **Detailed JSON results** (machine-readable)
- **Python implementation** (reusable code)
- **Professional formatting** (investment committee ready)

---

## ⚙️ **TECHNICAL REQUIREMENTS**

### **For Subagent Environment:**
- Access to Python 3.9+ environment
- Ability to import existing Summit EPV files
- File creation/editing capabilities
- JSON and Markdown output generation

### **Model Dependencies:**
```python
# Required imports
from unified_epv_system import EPVInputs, ServiceLine, compute_unified_epv
import numpy as np
import pandas as pd
import json
from dataclasses import dataclass
```

---

## 🔄 **ITERATIVE IMPROVEMENT**

### **Version Control:**
- **v1.0:** Initial comprehensive prompt (current)
- **Future versions:** Based on subagent feedback and results

### **Feedback Loop:**
1. **Monitor subagent outputs** for quality and consistency
2. **Identify common errors** or improvement opportunities
3. **Refine prompt** with additional guidance or examples
4. **Update technical requirements** as model evolves

---

## 📈 **SUCCESS METRICS**

### **Analysis Quality Indicators:**
- ✅ **Accurate EPV calculations** (cross-validated)
- ✅ **Proper normalization adjustments** (justified)
- ✅ **Realistic valuation multiples** (industry benchmarked)
- ✅ **Clear investment recommendation** (actionable)

### **Output Consistency:**
- ✅ **Standard deliverable format** (matches examples)
- ✅ **Professional presentation** (investment-grade)
- ✅ **Complete documentation** (methodology transparent)
- ✅ **Reproducible results** (consistent calculations)

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

**Problem:** Subagent can't import EPV system  
**Solution:** Ensure all Summit EPV files are available in workspace

**Problem:** Inconsistent valuation results  
**Solution:** Check data normalization steps and methodology adherence

**Problem:** Missing service line analysis  
**Solution:** Verify revenue breakdown data is complete and properly formatted

**Problem:** Unclear investment recommendation  
**Solution:** Review risk assessment framework and decision criteria

---

## 📚 **REFERENCE MATERIALS**

### **Study These Examples:**
- **`COMPREHENSIVE_MEDISPA_INVESTMENT_ANALYSIS_REPORT.md`** - Target output quality
- **`new_medispa_case_simulation.py`** - Code implementation pattern
- **`new_medispa_results_20250728_063232.json`** - JSON output format

### **Methodology References:**
- **Summit EPV Framework** - Core valuation approach
- **Greenwald EPV Method** - Theoretical foundation
- **Healthcare Services Benchmarks** - Industry context

---

## 🎉 **DEPLOYMENT READY**

The prompt is now **production-ready** for:

- ✅ **Investment committee analysis**
- ✅ **Due diligence support**
- ✅ **Portfolio company evaluation**
- ✅ **Educational case studies**
- ✅ **Comparative analysis projects**

**Simply copy, paste, add data, and execute!**

---

**Created:** July 28, 2025  
**Model Version:** Summit EPV v2.0  
**Prompt Status:** Ready for deployment  

*The framework has been validated through multiple successful medispa analyses including the comprehensive case study in this workspace.* 