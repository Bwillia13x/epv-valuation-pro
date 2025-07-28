# SapphireDerm EPV Correction Analysis

**Refinement Date:** July 27, 2025

## Methodology Change
- **Prior Method:** Gordon Growth Model with g=2.5%
- **Corrected Method:** Strict EPV with g=0 (EV = OE / WACC)

## EPV Results Comparison

| Scenario | Metric | Prior Value | Corrected Value | Delta | Delta % |
|----------|--------|-------------|-----------------|-------|---------|
| Low | Owner Earnings | $1,193,672 | $1,193,672 | $0 | 0.0% |
| Low | Enterprise Value | $12,879,088 | $9,947,263 | $-2,931,825 | -22.8% |
| Low | Equity Value | $12,029,088 | $9,097,263 | $-2,931,825 | -24.4% |
| Low | Implied Cap Rate | 9.3% | 12.0% | +2.7% | - |
| Base | Owner Earnings | $1,385,079 | $1,385,079 | $0 | 0.0% |
| Base | Enterprise Value | $15,774,514 | $12,044,168 | $-3,730,346 | -23.6% |
| Base | Equity Value | $14,924,514 | $11,194,168 | $-3,730,346 | -25.0% |
| Base | Implied Cap Rate | 8.8% | 11.5% | +2.7% | - |
| High | Owner Earnings | $1,534,398 | $1,534,398 | $-0 | -0.0% |
| High | Enterprise Value | $19,659,472 | $14,613,312 | $-5,046,159 | -25.7% |
| High | Equity Value | $18,809,472 | $13,763,312 | $-5,046,159 | -26.8% |
| High | Implied Cap Rate | 7.8% | 10.5% | +2.7% | - |

## Key Changes Summary

**Impact of g=0 Correction:**
- Eliminates terminal growth assumption
- Pure perpetuity valuation based on normalized owner earnings
- More conservative and mathematically precise approach

**Assertion Validation:**
- **Low Case:** ✅ PASS (Tolerance: 0.00% vs 3.00% threshold)
- **Base Case:** ✅ PASS (Tolerance: 0.00% vs 3.00% threshold)
- **High Case:** ✅ PASS (Tolerance: 0.00% vs 3.00% threshold)
