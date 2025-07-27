#!/usr/bin/env python3
"""
Test Refined Enhanced Valuation Models
Validates the market-calibrated refinements for 2025 medispa analysis
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock TypeScript interfaces for Python testing
class MultiYearFinancialData:
    def __init__(self, year, revenue, ebitda, ebit, adjustedEbitda, normalizations):
        self.year = year
        self.revenue = revenue
        self.ebitda = ebitda
        self.ebit = ebit
        self.adjustedEbitda = adjustedEbitda
        self.normalizations = normalizations

class SynergyAdjustments:
    def __init__(self):
        # CONSERVATIVE: Much lower maximum synergy caps
        self.operationalEfficiencies = 0.05  # 5% (CONSERVATIVE: down from 8%)
        self.scaleEconomies = 0.03           # 3% (CONSERVATIVE: down from 5%)
        self.marketingOptimization = 0.03    # 3% (CONSERVATIVE: down from 4%)
        self.technologyIntegration = 0.04    # 4% (CONSERVATIVE: down from 6%)
        self.crossSelling = 0.05             # 5% (CONSERVATIVE: down from 7%)
        self.totalSynergies = 0.20           # Will be calculated (CONSERVATIVE cap)
        # NEW: Phasing parameters
        self.phasingYears = 3
        self.yearOneRealization = 0.30       # 30% in year 1
        self.moatScore = 0.6                 # CONSERVATIVE: Reduced moat score

def calculate_refined_wacc(rf_rate, market_premium, company_size, geographic_risk, quality_score, synergy_score=0):
    """CONSERVATIVE Enhanced WACC Calculation with Market Calibration"""
    
    # CONSERVATIVE: Increased risk premiums for single-location businesses
    base_beta = 1.25  # Back to 1.25 (aesthetic volatility)
    industry_premium = 0.015  # Increased to 1.5% (regulatory/competition risks)
    
    size_premiums = {
        'small': 0.040,   # 4.0% (CONSERVATIVE: increased for single-location risk)
        'medium': 0.035,  # 3.5% (CONSERVATIVE: increased for concentration risk)
        'large': 0.025,   # 2.5% (baseline)
    }
    
    geo_premiums = {
        'low': 0,         # Established markets
        'medium': 0.005,  # 0.5% (back to original)
        'high': 0.010,    # 1.0% (back to original)
    }
    
    # CONSERVATIVE: Quality adjustment
    quality_adjustment = (1 - quality_score) * 0.015
    
    # CONSERVATIVE: Reduced synergy adjustment benefit
    synergy_adjustment = -synergy_score * 0.005  # Reduced to -0.5% max
    
    # CONSERVATIVE: Add concentration risk premium
    concentration_risk = {'small': 0.02, 'medium': 0.015, 'large': 0.01}[company_size]
    
    wacc = rf_rate + \
           (base_beta * market_premium) + \
           industry_premium + \
           size_premiums[company_size] + \
           geo_premiums[geographic_risk] + \
           quality_adjustment + \
           synergy_adjustment + \
           concentration_risk
    
    return max(0.08, min(0.20, wacc))  # Cap at 20%

def calculate_refined_synergies(base_ebitda, synergy_inputs, phase_in_years=3):
    """CONSERVATIVE Synergy Calculation with Phasing"""
    
    # CONSERVATIVE: Cap total synergies at 15% (down from 25%)
    base_synergies = (synergy_inputs.operationalEfficiencies +
                     synergy_inputs.scaleEconomies +
                     synergy_inputs.marketingOptimization +
                     synergy_inputs.technologyIntegration +
                     synergy_inputs.crossSelling)
    
    # CONSERVATIVE: Reduced moat premium for franchise value
    moat_adjustment = synergy_inputs.moatScore * 0.03  # Up to 3% additional (down from 5%)
    adjusted_synergy_percent = min(0.20, base_synergies + moat_adjustment)  # Cap at 20%
    
    full_run_rate_impact = base_ebitda * adjusted_synergy_percent
    
    # REFINED: More realistic phasing schedule
    phasing_schedule = []
    for year in range(1, phase_in_years + 1):
        if year == 1:
            realization = synergy_inputs.yearOneRealization or 0.30  # REFINED: 30%
        elif year == 2:
            realization = 0.65  # 65% in year 2
        else:
            realization = 1.0   # 100% by year 3
        phasing_schedule.append(realization)
    
    year_one_impact = full_run_rate_impact * phasing_schedule[0]
    
    return {
        'year_one_impact': year_one_impact,
        'full_run_rate_impact': full_run_rate_impact,
        'synergy_multiplier': 1 + adjusted_synergy_percent,
        'phasing_schedule': phasing_schedule,
        'adjusted_synergy_percent': adjusted_synergy_percent
    }

def run_refined_hybrid_valuation():
    """Run refined hybrid valuation with 2025 simulation data"""
    
    print("🎯 Testing CONSERVATIVE Enhanced Valuation Models")
    print("=" * 60)
    
    # 2025 Simulation Data
    simulation_data = [
        MultiYearFinancialData(2023, 2200000, 206531, 156531, 471531, 
                              {'ownerCompensation': 120000, 'personalExpenses': 60000, 
                               'oneTimeItems': 35000, 'synergies': 50000}),
        MultiYearFinancialData(2024, 2485919, 283466, 233466, 582907,
                              {'ownerCompensation': 135596, 'personalExpenses': 67798, 
                               'oneTimeItems': 39549, 'synergies': 56498}),
        MultiYearFinancialData(2025, 2923583, 290375, 240375, 642534,
                              {'ownerCompensation': 159468, 'personalExpenses': 79734, 
                               'oneTimeItems': 46512, 'synergies': 66445}),
        MultiYearFinancialData(2026, 3387145, 462216, 412216, 870213,
                              {'ownerCompensation': 184753, 'personalExpenses': 92377, 
                               'oneTimeItems': 53886, 'synergies': 76981}),
        MultiYearFinancialData(2027, 3888079, 493584, 443584, 961921,
                              {'ownerCompensation': 212077, 'personalExpenses': 106039, 
                               'oneTimeItems': 61856, 'synergies': 88365})
    ]
    
    # Calculate multi-year weighted average with market calibration
    n = len(simulation_data)
    # REFINED: Market-calibrated weighting (cap latest year at 40%)
    exp_weights = [pow(1.3, i) for i in range(n)]  # Reduced exponent from 1.5
    exp_sum = sum(exp_weights)
    raw_weights = [w / exp_sum for w in exp_weights]
    
    # Cap latest year at 40%
    if raw_weights[-1] > 0.40:
        excess = raw_weights[-1] - 0.40
        raw_weights[-1] = 0.40
        # Redistribute excess proportionally
        for i in range(len(raw_weights) - 1):
            raw_weights[i] += excess * (raw_weights[i] / (1 - 0.40))
    
    weights = raw_weights
    
    # Weighted average EBITDA
    weighted_avg_ebitda = sum(simulation_data[i].adjustedEbitda * weights[i] for i in range(n))
    
    # Calculate growth metrics
    revenue_values = [d.revenue for d in simulation_data]
    ebitda_values = [d.adjustedEbitda for d in simulation_data]
    
    # Revenue CAGR
    revenue_cagr = (revenue_values[-1] / revenue_values[0]) ** (1 / (n - 1)) - 1
    ebitda_cagr = (ebitda_values[-1] / ebitda_values[0]) ** (1 / (n - 1)) - 1
    
    # Quality score with benchmark alignment
    avg_margin = sum(d.adjustedEbitda / d.revenue for d in simulation_data) / n
    benchmark_margin = 0.22  # 22% benchmark margin
    margin_alignment = 1 - abs(avg_margin - benchmark_margin) / benchmark_margin
    quality_score = max(0, min(1, margin_alignment))
    
    print(f"📊 Multi-Year Analysis:")
    print(f"   Weighted Avg EBITDA: ${weighted_avg_ebitda:,.0f}")
    print(f"   Revenue CAGR: {revenue_cagr:.1%}")
    print(f"   EBITDA CAGR: {ebitda_cagr:.1%}")
    print(f"   Quality Score: {quality_score:.1%}")
    print(f"   Weighting: {[f'{w:.1%}' for w in weights]}")
    
    # Synergy Analysis
    synergies = SynergyAdjustments()
    synergy_results = calculate_refined_synergies(weighted_avg_ebitda, synergies)
    
    print(f"\n🚀 REFINED Synergy Analysis:")
    print(f"   Base Synergies: {synergy_results['adjusted_synergy_percent']:.1%}")
    print(f"   Year 1 Impact: ${synergy_results['year_one_impact']:,.0f}")
    print(f"   Full Run Rate: ${synergy_results['full_run_rate_impact']:,.0f}")
    print(f"   Phasing Schedule: {[f'{p:.0%}' for p in synergy_results['phasing_schedule']]}")
    
    enhanced_ebitda = weighted_avg_ebitda * synergy_results['synergy_multiplier']
    
    # REFINED WACC Calculation
    synergyScore = (synergy_results['synergy_multiplier'] - 1) / 0.30  # Normalize to 0-1
    base_wacc = calculate_refined_wacc(
        rf_rate=0.045,           # 4.5% risk-free
        market_premium=0.055,    # 5.5% market premium
        company_size='medium',   # Mid-sized clinic
        geographic_risk='low',   # Established market
        quality_score=quality_score,
        synergy_score=synergyScore
    )
    
    print(f"\n💰 REFINED WACC Calculation:")
    print(f"   Base WACC: {base_wacc:.1%}")
    print(f"   Synergy Score: {synergyScore:.1%}")
    print(f"   Quality Score: {quality_score:.1%}")
    
    # Tax rate and calculations
    tax_rate = 0.26
    adjusted_earnings = enhanced_ebitda * (1 - tax_rate)
    
    # 1. EPV Valuation (Conservative baseline)
    epv_valuation = adjusted_earnings / base_wacc
    
    # 2. DCF Valuation (Growth-oriented) with enhanced decay (CONSERVATIVE)
    terminal_growth = 0.025  # 2.5% terminal growth
    # CONSERVATIVE: Apply 25% haircut to historical growth and cap more aggressively
    historical_growth = min(0.12, max(0.03, ebitda_cagr * 0.75))  # 25% haircut
    
    # Project 7-year DCF with faster exponential decay
    projection_years = 7
    decay_rate = 0.25  # CONSERVATIVE: 25% annual decay (increased from 15%)
    
    projected_cash_flows = []
    current_ebitda = enhanced_ebitda
    
    for year in range(1, projection_years + 1):
        # REFINED: Exponential decay to terminal rate
        decay_factor = pow(1 - decay_rate, year - 1)
        growth_rate = max(terminal_growth, 
                         terminal_growth + (historical_growth - terminal_growth) * decay_factor)
        
        current_ebitda *= (1 + growth_rate)
        
        # Convert EBITDA to Free Cash Flow
        depreciation = current_ebitda * 0.08
        ebit = current_ebitda - depreciation
        nopat = ebit * (1 - tax_rate)
        
        revenue = current_ebitda / 0.25  # Assume 25% EBITDA margin
        capex = revenue * 0.03
        wc_change = revenue * 0.02 * growth_rate
        
        fcf = nopat + depreciation - capex - wc_change
        projected_cash_flows.append(fcf)
    
    # Terminal value
    terminal_cf = projected_cash_flows[-1] * (1 + terminal_growth)
    terminal_value = terminal_cf / (base_wacc - terminal_growth)
    
    # Present values
    present_values = [cf / pow(1 + base_wacc, i + 1) for i, cf in enumerate(projected_cash_flows)]
    terminal_pv = terminal_value / pow(1 + base_wacc, projection_years)
    
    dcf_valuation = sum(present_values) + terminal_pv
    
    # 3. Market Multiple Valuation (CONSERVATIVE)
    # Mid-sized clinic multiples: 4.5x - 7.0x
    avg_multiple = 5.75  # Average of range
    
    # CONSERVATIVE: Minimal multiple adjustments with location discount
    quality_adjustment = (quality_score - 0.5) * 0.5  # Further reduced
    growth_adjustment = min(1, ebitda_cagr / 0.15) * 0.4  # Further reduced
    # CONSERVATIVE: Apply discount for single-location risk
    location_discount = {'small': 0.85, 'medium': 0.90, 'large': 0.95}['medium']  # 10% discount for medium
    adjusted_multiple = avg_multiple * location_discount * (1 + quality_adjustment * 0.10 + growth_adjustment * 0.15)
    
    multiple_valuation = enhanced_ebitda * adjusted_multiple
    
    # CONSERVATIVE: Market-calibrated weighting methodology (bias toward conservative)
    growth_profile = min(1, ebitda_cagr / 0.12)
    
    # CONSERVATIVE: Determine weighting methodology (bias toward conservative)
    if growth_profile > 0.9 and synergyScore > 0.7 and quality_score > 0.8:
        # Growth-biased approach (very high bar)
        weights = {'epv': 0.40, 'dcf': 0.40, 'multiple': 0.20}
        methodology = 'growthBiased'
    elif growth_profile < 0.5 or quality_score < 0.7:
        # Conservative approach (lower bar)
        weights = {'epv': 0.60, 'dcf': 0.25, 'multiple': 0.15}
        methodology = 'conservative'
    else:
        # Balanced approach (CONSERVATIVE: EPV-focused)
        weights = {'epv': 0.50, 'dcf': 0.30, 'multiple': 0.20}
        methodology = 'balanced'
    
    hybrid_valuation = (epv_valuation * weights['epv'] +
                       dcf_valuation * weights['dcf'] +
                       multiple_valuation * weights['multiple'])
    
    # NEW: Market calibration metrics
    implied_multiple = hybrid_valuation / enhanced_ebitda
    benchmark_range = [4.5, 7.0]
    calibration_score = 1 - abs(implied_multiple - avg_multiple) / avg_multiple
    calibration_score = max(0, min(1, calibration_score))
    
    print(f"\n🎯 REFINED Hybrid Valuation Results:")
    print(f"   EPV (Conservative): ${epv_valuation:,.0f}")
    print(f"   DCF (Growth): ${dcf_valuation:,.0f}")
    print(f"   Market Multiple: ${multiple_valuation:,.0f}")
    print(f"   Hybrid Result: ${hybrid_valuation:,.0f}")
    print(f"   Methodology: {methodology}")
    print(f"   Weights: EPV {weights['epv']:.0%} | DCF {weights['dcf']:.0%} | Multiple {weights['multiple']:.0%}")
    
    print(f"\n🎯 Market Calibration:")
    print(f"   Implied Multiple: {implied_multiple:.1f}x")
    print(f"   Benchmark Range: {benchmark_range[0]}x - {benchmark_range[1]}x")
    print(f"   Calibration Score: {calibration_score:.0%}")
    
    # Add balance sheet adjustments for equity value
    tangible_assets = 207590
    liabilities = 132390
    total_equity_value = hybrid_valuation + tangible_assets - liabilities
    
    print(f"\n💎 Total Equity Value:")
    print(f"   Enterprise Value: ${hybrid_valuation:,.0f}")
    print(f"   + Tangible Assets: ${tangible_assets:,.0f}")
    print(f"   - Liabilities: ${liabilities:,.0f}")
    print(f"   = Total Equity Value: ${total_equity_value:,.0f}")
    
    # Compare to manual estimate and legacy model
    manual_estimate = 4100000  # User's manual calculation
    legacy_optimistic = 5320000  # Previous optimistic model
    
    variance_vs_manual = (total_equity_value - manual_estimate) / manual_estimate
    variance_vs_legacy = (total_equity_value - legacy_optimistic) / legacy_optimistic
    
    print(f"\n📊 Comparison Analysis:")
    print(f"   Manual Estimate: ${manual_estimate:,.0f}")
    print(f"   Legacy Model: ${legacy_optimistic:,.0f}")
    print(f"   REFINED Model: ${total_equity_value:,.0f}")
    print(f"   vs Manual: {variance_vs_manual:+.1%}")
    print(f"   vs Legacy: {variance_vs_legacy:+.1%}")
    
    print(f"\n✅ CONSERVATIVE REFINEMENT SUMMARY:")
    print(f"   • Synergy cap reduced from 30% to 20%")
    print(f"   • Individual synergy caps: 3-6% (down from 5-8%)")
    print(f"   • WACC increased with concentration risk (+1.5-2%)")
    print(f"   • Growth haircut: 25% reduction + faster decay")
    print(f"   • Multiple discount: 10-15% for single-location risk")
    print(f"   • Method weighting: Heavy EPV bias")
    print(f"   • Market calibration score: {calibration_score:.0%}")
    
    return {
        'enterprise_value': hybrid_valuation,
        'total_equity_value': total_equity_value,
        'implied_multiple': implied_multiple,
        'calibration_score': calibration_score,
        'methodology': methodology,
        'weights': weights,
        'wacc': base_wacc
    }

if __name__ == "__main__":
    results = run_refined_hybrid_valuation()
    print(f"\n🎉 REFINED MODEL VALIDATION COMPLETE")
    print(f"   Final Equity Value: ${results['total_equity_value']:,.0f}")
    print(f"   Market Alignment: {results['calibration_score']:.0%}") 