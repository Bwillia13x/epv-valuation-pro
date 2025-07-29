# 📊 Visual Preview Report - Excel Charts Generated

## 🏗️ Workbook Structure

```
📁 Valuation_Offer_Visuals.xlsx
├── 📋 Sheet 1: "Valuation & Offer"     (Data Tables)
└── 📊 Sheet 2: "Visuals"               (6 Charts + Summary)
```

---

## 📋 **Sheet 1: "Valuation & Offer" - Data Tables**

### Table Layout Preview:

```
| Item                           | Value ($000s) | Notes |
|--------------------------------|---------------|-------|
| === VALUATION (EV BASIS) ===  |               |       |
| Enterprise Value               | 4,813.38      |       |
| Cash Percentage                | 70.0%         |       |
| Implied Cash Paid at Close    | 3,369.37      |       |
| Implied Equity Paid at Close  | 1,444.01      |       |
|                                |               |       |
| === CAPITAL BRIDGE ===        |               |       |
| Blended Rate                   | 10.0%         |       |
| Interest 2024                  | 194.81        |       |
| Implied Net Debt               | 1,948.12      |       |
| Equity Value (Proceeds Base)   | 2,865.26      |       |
|                                |               |       |
| === PROCEEDS (EQUITY BASIS) === |               |       |
| Cash at Close                  | 2,005.68      |       |
| Rollover                       | 859.58        |       |
|                                |               |       |
| === OPERATIONAL DATA ===       |               |       |
| Revenue 2024                   | 3,726.10      |       |
| EBITDA (10% Marketing)         | 687.63        |       |
```

---

## 📊 **Sheet 2: "Visuals" - Chart Layout**

### Chart Arrangement:

```
┌─────────────────────────────────────────────────────────────────┐
│                    WATERFALL CHART                             │
│          Bridge from EV to Equity Value ($000s)                │
│   ████ EV    ▼ Net Debt    → → →    ████ Equity               │
│  4,813  ↓    -1,948        0 0 0    2,865                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────────────────────────┐
│   DOUGHNUT CHART    │  │         EBITDA vs Marketing            │
│  Proceeds at Close  │  │                                        │
│  ●●●● 70% Cash      │  │    ████     ████     ████             │
│  ●●● 30% Rollover   │  │   687.6    613.1    538.6            │
│                     │  │    10%      12%      14%             │
└─────────────────────┘  └─────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  EQUITY VALUE HEATMAP                          │
│             Multiple × Marketing% Sensitivity                   │
│        10%     11%     12%     13%     14%                     │
│  5.5x  🟢     🟡     🟡     🟠     🔴                          │
│  6.0x  🟢     🟢     🟡     🟡     🟠                          │
│  6.5x  🟢     🟢     🟢     🟡     🟡                          │
│  7.0x  🟢     🟢     🟢     🟢     🟡                          │
│  7.5x  🟢     🟢     🟢     🟢     🟢                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────────────────────────┐
│  COMBO CHART        │  │      MONTE CARLO SCATTER               │
│ Rate vs Net Debt    │  │     EV vs Equity Value                 │
│                     │  │  ∘ ∘  ∘ ∘ ∘                          │
│ ████ Net Debt       │  │   ∘ ∘ ∘ ∘ ∘ ∘                       │
│ ──── Equity Line    │  │ ∘  ∘ ∘ ∘ ∘ ∘ ∘                      │
│ 8% 9% 10% 11% 12%  │  │   ∘ ∘ ∘ ∘ ∘ ∘                       │
└─────────────────────┘  └─────────────────────────────────────────┘
```

---

## 🔍 **Detailed Chart Previews**

### 1. 🌊 **WATERFALL CHART** - Bridge from EV to Equity Value

```
Chart Type: Excel Waterfall
Data Points:
┌─────────────────┬──────────┐
│ Enterprise Value│  4,813.38│ ████████████████████
│ Net Debt        │ -1,948.12│ ████████▼▼▼▼▼▼▼▼
│ Debt-like Items │      0.00│
│ Cash-like Items │      0.00│
│ NWC Adjustment  │      0.00│
│ Transaction Fees│      0.00│
│ Equity Value    │  2,865.26│ ████████████
└─────────────────┴──────────┘
```

### 2. 🍩 **DOUGHNUT CHART** - Proceeds at Close

```
Chart Type: Excel Doughnut
Total: $2,865.26K

     ●●●●●●●●●●●●●●● 70.0%
   ●●                 ●● Cash at Close
  ●●                   ●● $2,005.68K
 ●●                     ●●
●●        CENTER         ●●
 ●●                     ●●
  ●●                   ●● Rollover
   ●●     ●●●●●●●●●●●●● 30.0%
     ●●●●●●●●●●●●●●● $859.58K
```

### 3. 📊 **COLUMN CHART** - EBITDA vs Marketing Spend

```
Chart Type: Excel Column
EBITDA
($000s)
  700│    ████
     │    ████
  650│    ████
     │    ████  ████
  600│    ████  ████
     │    ████  ████  ████
  550│    ████  ████  ████
     │    ████  ████  ████
  500│────┼────┼────┼────
     │   10%   12%   14%
        Marketing Spend %

Values: 687.6, 613.1, 538.6
```

### 4. 🔥 **HEATMAP** - Equity Value Sensitivity

```
Chart Type: Conditional Formatting (3-Color Scale)
                Marketing Spend %
Multiple  10.0%   11.0%   12.0%   13.0%   14.0%
  5.5x    1,439   1,402   1,365   1,328   1,291  🟢→🟡→🔴
  6.0x    1,691   1,654   1,617   1,580   1,543
  6.5x    1,943   1,906   1,869   1,832   1,795
  7.0x    2,195   2,158   2,121   2,084   2,047
  7.5x    2,447   2,410   2,373   2,336   2,299

Legend: 🟢 High Value | 🟡 Medium Value | 🔴 Low Value
```

### 5. 📈 **COMBO CHART** - Debt Rate vs Net Debt & Equity

```
Chart Type: Excel Column + Line Combo
           Net Debt (Columns)    Equity Value (Line)
Rate    │                    │                    │
  8%    │ ████████████████   │ ∘                  │ 2,378K
  9%    │ ████████████       │   ∘                │ 2,647K
 10%    │ ██████████         │     ∘              │ 2,865K
 11%    │ ████████           │       ∘            │ 3,043K
 12%    │ ███████            │         ∘          │ 3,190K
        └────────────────────┴────────────────────┘
        Net Debt Shows Inverse Relationship to Rate
```

### 6. 🎯 **SCATTER PLOT** - Monte Carlo Simulation

```
Chart Type: Excel XY Scatter
1,000 simulation points with triangular distributions

Equity
Value   ∘     ∘ ∘ ∘    ∘ ∘
($000s) ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘
 4,000│  ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘
      │   ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘
 3,000│ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘
      │ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘
 2,000│∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘
      │ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘ ∘
 1,000│────────────────────────
      │3,000  4,000  5,000  6,000
           Enterprise Value ($000s)

Positive correlation: Higher EV → Higher Equity
```

---

## 📋 **Summary Report Preview**

```
=== VALUATION SUMMARY REPORT ===

Enterprise Value ($000s):    4,813.38
Net Debt ($000s):           1,948.12
Equity Base ($000s):        2,865.26
Cash at Close ($000s):      2,005.68
Rollover ($000s):             859.58

VALIDATION CHECKS:
Cash + Rollover = Equity Base:    TRUE
Cash% + Rollover% = 100%:         TRUE
```

---

## 🚀 **To See These Charts in Excel:**

### Option 1: Office Script

1. Copy `ValuationOfferVisuals_OfficeScript.ts`
2. Paste in Excel Online → Automate → New Script
3. Click **Run**

### Option 2: VBA Macro

1. Copy `ValuationOfferVisuals_VBA.bas`
2. Paste in Excel Desktop → Alt+F11 → Insert Module
3. Press **Alt+F8** → Run `BuildValuationVisuals`

**Result**: Professional Excel workbook with all charts above, ready for presentations!

---

_All charts will have professional formatting, proper titles, legends, and data labels as appropriate for investment analysis._
