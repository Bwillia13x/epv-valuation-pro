# Valuation & Offer Visuals Generator

This project provides two methods to automatically generate a comprehensive Excel workbook with valuation analysis and visual charts based on the provided financial data.

## 📊 Generated Output

The scripts create an Excel workbook (`Valuation_Offer_Visuals.xlsx`) with:

### Sheet 1: "Valuation & Offer"

- **Valuation (EV Basis)**: Enterprise Value, Cash %, Implied payments
- **Capital Bridge**: Interest rates, Net Debt calculations
- **Proceeds (Equity Basis)**: Cash at close, Rollover amounts
- **Operational Data**: Revenue, EBITDA metrics

### Sheet 2: "Visuals"

Six professionally formatted charts:

1. **Waterfall Chart**: Bridge from EV ($4,813K) to Equity Value ($2,865K)
2. **Doughnut Chart**: Proceeds split (70% Cash / 30% Rollover)
3. **Column Chart**: EBITDA vs Marketing Spend (10%, 12%, 14%)
4. **Heatmap**: Equity Value sensitivity (Multiple × Marketing%)
5. **Combo Chart**: Debt Rate impact on Net Debt & Equity
6. **Scatter Plot**: Monte Carlo simulation (EV vs Equity)

## 🚀 Usage Options

### Option 1: Office Script (Recommended)

**For Excel Online/Microsoft 365:**

1. Open Excel Online or Excel desktop with Microsoft 365
2. Go to **Automate** tab → **New Script**
3. Copy the entire contents of `ValuationOfferVisuals_OfficeScript.ts`
4. Paste into the script editor
5. Click **Run**
6. The workbook will be automatically created with all data and charts

### Option 2: VBA Macro (Desktop Excel)

**For Excel Desktop (any version):**

1. Open Excel desktop application
2. Press `Alt+F11` to open VBA Editor
3. Go to **Insert** → **Module**
4. Copy the entire contents of `ValuationOfferVisuals_VBA.bas`
5. Paste into the module
6. Close VBA Editor (`Alt+Q`)
7. Press `Alt+F8`, select `BuildValuationVisuals`, click **Run**
8. The workbook will be created and saved automatically

## 📈 Key Financial Data

### Core Assumptions ($000s)

- **Revenue 2024**: $3,726
- **EBITDA (10% Marketing)**: $688
- **EV/EBITDA Multiple**: 7.0x
- **Enterprise Value**: $4,813
- **Interest Expense**: $195
- **Blended Rate**: 10.0%
- **Net Debt**: $1,948
- **Equity Value**: $2,865

### Transaction Structure

- **Cash at Close**: 70% ($2,006K)
- **Rollover**: 30% ($860K)

## ✅ Validation Checks

The scripts include automatic validation:

- ✓ **Waterfall**: Final bar = $2,865K (Equity Base)
- ✓ **Proceeds**: Cash + Rollover = Equity Base
- ✓ **EBITDA Sensitivity**:
  - 10% Marketing: $688K
  - 12% Marketing: $613K
  - 14% Marketing: $539K
- ✓ **Rate Analysis**: Higher rates → Lower Net Debt
- ✓ **Monte Carlo**: Positive correlation (EV ↑ → Equity ↑)

## 🔧 Customization

To modify the financial assumptions:

### Office Script

Edit the constants section at the top:

```typescript
const REV_2024 = 3726.102;
const EBITDA10 = 687.626;
const MULT = 7.0;
// ... etc
```

### VBA

Edit the constants section at the top:

```vba
Const REV_2024 As Double = 3726.102
Const EBITDA10 As Double = 687.626
Const MULT As Double = 7#
' ... etc
```

## 📋 Chart Details

### 1. Waterfall Chart

Shows the bridge from Enterprise Value to Equity Value, deducting Net Debt and other adjustments.

### 2. Doughnut Chart

Visualizes the 70/30 split between cash payment and rollover equity at transaction close.

### 3. EBITDA vs Marketing

Demonstrates how increased marketing spend reduces EBITDA (linear relationship).

### 4. Equity Value Heatmap

Color-coded matrix showing sensitivity to both valuation multiple (5.5x - 7.5x) and marketing spend (10% - 14%).

### 5. Debt Rate Combo Chart

Shows inverse relationship between interest rates and implied net debt using Method A (Interest/Rate).

### 6. Monte Carlo Scatter

1,000 simulation points using triangular distributions for marketing %, multiple, and interest rate.

## 🎯 Business Use Cases

- **Investment Committee Presentations**
- **Client Valuation Reviews**
- **Deal Structure Analysis**
- **Sensitivity Testing**
- **Risk Assessment**
- **Transaction Documentation**

## 📊 Expected Results Summary

| Metric           | Value ($000s) |
| ---------------- | ------------- |
| Enterprise Value | 4,813.38      |
| Net Debt         | 1,948.12      |
| Equity Base      | 2,865.26      |
| Cash at Close    | 2,005.68      |
| Rollover         | 859.58        |

**Validation**: Both cash + rollover should equal equity base, and percentages should sum to 100%.

## 🔍 Troubleshooting

### Office Script Issues

- Ensure you're using Excel Online or Microsoft 365
- Check that scripts are enabled in your tenant
- Verify chart creation permissions

### VBA Issues

- Enable macros if prompted
- Ensure Excel has chart creation permissions
- Check for any missing VBA references

### Performance Notes

- Office Script: Limited to 1,000 Monte Carlo points for performance
- VBA: Limited to 500 Monte Carlo points for performance
- Charts auto-size but can be manually adjusted

## 📄 Files Included

1. `ValuationOfferVisuals_OfficeScript.ts` - Office Script (TypeScript)
2. `ValuationOfferVisuals_VBA.bas` - VBA Module
3. `Valuation_Visuals_README.md` - This documentation

## 💡 Tips

- Both scripts create identical outputs with slightly different performance characteristics
- Office Script is preferred for cloud-based workflows
- VBA is better for offline/desktop-heavy environments
- Charts can be copied to PowerPoint or other applications
- Named ranges allow for easy formula references

---

_Generated with precision financial modeling for investment analysis workflows._
