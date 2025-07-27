#!/usr/bin/env python3
"""
2025 Medispa Simulation - Enhanced Valuation Analysis
Running comprehensive multi-year P&L data through hybrid valuation models
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock the enhanced valuation models for standalone execution
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
        self.operationalEfficiencies = 0.08  # 8% from CPP network efficiencies
        self.scaleEconomies = 0.05  # 5% from volume discounts
        self.marketingOptimization = 0.04  # 4% from shared marketing
        self.technologyIntegration = 0.06  # 6% from EMR/systems integration
        self.crossSelling = 0.07  # 7% from service expansion
        self.totalSynergies = 0.30  # 30% total potential

# Enhanced calculation functions (simplified versions)
def calculate_wacc(rf_rate, market_premium, company_size, geographic_risk, quality_score):
    """Calculate enhanced WACC with industry adjustments"""
    beta = 1.25  # Medispa industry beta
    size_premiums = {'small': 0.042, 'medium': 0.035, 'large': 0.021}
    geo_premiums = {'low': 0, 'medium': 0.005, 'high': 0.010}
    quality_adjustment = (1 - quality_score) * 0.02
    
    wacc = (rf_rate + 
            beta * market_premium + 
            0.015 +  # Industry premium
            size_premiums[company_size] + 
            geo_premiums[geographic_risk] + 
            quality_adjustment)
    
    return max(0.08, min(0.25, wacc))

def calculate_dcf_value(multi_year_data, wacc, terminal_growth=0.03):
    """Calculate DCF valuation with projections"""
    projection_years = 7
    current_ebitda = multi_year_data[-1].adjustedEbitda
    
    # Calculate growth trend
    years = [d.year for d in multi_year_data]
    ebitdas = [d.adjustedEbitda for d in multi_year_data]
    
    if len(ebitdas) > 1:
        growth_rate = (ebitdas[-1] / ebitdas[0]) ** (1/(len(ebitdas)-1)) - 1
        growth_rate = min(0.20, max(0.05, growth_rate))  # Cap between 5-20%
    else:
        growth_rate = 0.12  # Default 12%
    
    print(f"📈 Calculated Historical Growth Rate: {growth_rate:.1%}")
    
    # Project future cash flows
    projected_cf = []
    for year in range(1, projection_years + 1):
        # Declining growth rate
        year_growth = growth_rate - ((growth_rate - terminal_growth) * (year - 1) / (projection_years - 1))
        year_ebitda = current_ebitda * ((1 + year_growth) ** year)
        
        # Convert to free cash flow (simplified)
        tax_rate = 0.26
        depreciation = year_ebitda * 0.08
        ebit = year_ebitda - depreciation
        nopat = ebit * (1 - tax_rate)
        capex = year_ebitda * 0.03  # 3% of EBITDA
        working_capital_change = year_ebitda * 0.02 * year_growth  # WC impact
        
        free_cash_flow = nopat + depreciation - capex - working_capital_change
        projected_cf.append(free_cash_flow)
    
    # Calculate present values
    present_values = [cf / ((1 + wacc) ** (i + 1)) for i, cf in enumerate(projected_cf)]
    
    # Terminal value
    terminal_cf = projected_cf[-1] * (1 + terminal_growth)
    terminal_value = terminal_cf / (wacc - terminal_growth)
    terminal_pv = terminal_value / ((1 + wacc) ** projection_years)
    
    enterprise_value = sum(present_values) + terminal_pv
    
    return {
        'enterprise_value': enterprise_value,
        'projected_cash_flows': projected_cf,
        'present_values': present_values,
        'terminal_value': terminal_value,
        'terminal_pv': terminal_pv
    }

def run_simulation():
    """Run the 2025 medispa simulation"""
    
    print("=" * 80)
    print("🏥 2025 MEDISPA SIMULATION - ENHANCED VALUATION ANALYSIS")
    print("=" * 80)
    
    # Input the provided simulation data
    simulation_data = [
        {
            'year': 2023,
            'revenue': 2200000,
            'raw_ebitda': 206531,
            'adjustments': {
                'owner_compensation': 120000,
                'personal_expenses': 60000,
                'one_time_items': 35000,
                'synergies': 50000
            }
        },
        {
            'year': 2024,
            'revenue': 2485919,
            'raw_ebitda': 283466,
            'adjustments': {
                'owner_compensation': 135596,
                'personal_expenses': 67798,
                'one_time_items': 39549,
                'synergies': 56498
            }
        },
        {
            'year': 2025,
            'revenue': 2923583,
            'raw_ebitda': 290375,
            'adjustments': {
                'owner_compensation': 159468,
                'personal_expenses': 79734,
                'one_time_items': 46512,
                'synergies': 66445
            }
        },
        {
            'year': 2026,
            'revenue': 3387145,
            'raw_ebitda': 462216,
            'adjustments': {
                'owner_compensation': 184753,
                'personal_expenses': 92377,
                'one_time_items': 53886,
                'synergies': 76981
            }
        },
        {
            'year': 2027,
            'revenue': 3888079,
            'raw_ebitda': 493584,
            'adjustments': {
                'owner_compensation': 212077,
                'personal_expenses': 106039,
                'one_time_items': 61856,
                'synergies': 88365
            }
        }
    ]
    
    # Convert to MultiYearFinancialData objects
    multi_year_data = []
    for data in simulation_data:
        total_adjustments = sum(data['adjustments'].values())
        adjusted_ebitda = data['raw_ebitda'] + total_adjustments
        
        financial_data = MultiYearFinancialData(
            year=data['year'],
            revenue=data['revenue'],
            ebitda=data['raw_ebitda'],
            ebit=data['raw_ebitda'] - (data['revenue'] * 0.08),  # Assume 8% D&A
            adjustedEbitda=adjusted_ebitda,
            normalizations=data['adjustments']
        )
        multi_year_data.append(financial_data)
    
    print("📊 MULTI-YEAR FINANCIAL DATA PROCESSED")
    print("-" * 50)
    for data in multi_year_data:
        print(f"{data.year}: Revenue ${data.revenue:,.0f} | Raw EBITDA ${data.ebitda:,.0f} | Adj EBITDA ${data.adjustedEbitda:,.0f}")
    
    # Calculate key metrics
    print("\n💡 KEY FINANCIAL METRICS")
    print("-" * 50)
    
    revenues = [d.revenue for d in multi_year_data]
    adj_ebitdas = [d.adjustedEbitda for d in multi_year_data]
    
    revenue_cagr = (revenues[-1] / revenues[0]) ** (1/(len(revenues)-1)) - 1
    ebitda_cagr = (adj_ebitdas[-1] / adj_ebitdas[0]) ** (1/(len(adj_ebitdas)-1)) - 1
    
    avg_3yr_ebitda = sum(adj_ebitdas[:3]) / 3
    avg_5yr_ebitda = sum(adj_ebitdas) / 5
    
    print(f"📈 Revenue CAGR (2023-2027): {revenue_cagr:.1%}")
    print(f"📈 Adj EBITDA CAGR (2023-2027): {ebitda_cagr:.1%}")
    print(f"💰 3-Year Avg Adj EBITDA (2023-2025): ${avg_3yr_ebitda:,.0f}")
    print(f"💰 5-Year Avg Adj EBITDA (2023-2027): ${avg_5yr_ebitda:,.0f}")
    
    latest_year = multi_year_data[-1]
    ebitda_margin_2027 = latest_year.adjustedEbitda / latest_year.revenue
    print(f"📊 2027 Adj EBITDA Margin: {ebitda_margin_2027:.1%}")
    
    # Company profile for enhanced WACC
    company_size = 'medium'  # $2-5M revenue range
    geographic_risk = 'medium'  # Secondary markets
    
    # Data quality assessment
    data_completeness = 1.0  # All data provided
    revenue_growth_consistency = 1.0 - (0.15 * 0.5)  # Moderate volatility
    quality_score = (data_completeness + revenue_growth_consistency) / 2
    
    print(f"🏢 Company Size Classification: {company_size.title()}")
    print(f"🌍 Geographic Risk Profile: {geographic_risk.title()}")
    print(f"📊 Data Quality Score: {quality_score:.1%}")
    
    # Enhanced WACC calculation
    rf_rate = 0.045  # 4.5% risk-free rate
    market_premium = 0.065  # 6.5% market risk premium
    
    enhanced_wacc = calculate_wacc(rf_rate, market_premium, company_size, geographic_risk, quality_score)
    
    print(f"\n💹 ENHANCED WACC CALCULATION")
    print("-" * 50)
    print(f"Risk-Free Rate: {rf_rate:.1%}")
    print(f"Market Risk Premium: {market_premium:.1%}")
    print(f"Industry Beta: 1.25")
    print(f"Size Premium ({company_size}): {0.035:.1%}")
    print(f"Geographic Premium ({geographic_risk}): {0.005:.1%}")
    print(f"Industry Premium: 1.5%")
    print(f"Quality Adjustment: {(1-quality_score)*0.02:.1%}")
    print(f"🎯 Enhanced WACC: {enhanced_wacc:.1%}")
    
    # Synergy Analysis
    synergies = SynergyAdjustments()
    base_ebitda = avg_5yr_ebitda
    synergy_value = base_ebitda * synergies.totalSynergies
    
    print(f"\n🚀 SYNERGY ANALYSIS")
    print("-" * 50)
    print(f"Operational Efficiencies: {synergies.operationalEfficiencies:.1%}")
    print(f"Scale Economies: {synergies.scaleEconomies:.1%}")
    print(f"Marketing Optimization: {synergies.marketingOptimization:.1%}")
    print(f"Technology Integration: {synergies.technologyIntegration:.1%}")
    print(f"Cross-Selling: {synergies.crossSelling:.1%}")
    print(f"🎯 Total Synergies: {synergies.totalSynergies:.1%}")
    print(f"💰 Synergy Value: ${synergy_value:,.0f}")
    print(f"📈 Enhanced EBITDA: ${base_ebitda + synergy_value:,.0f}")
    
    # Hybrid Valuation Calculation
    print(f"\n🎯 HYBRID VALUATION CALCULATION")
    print("=" * 50)
    
    # 1. EPV Calculation (Conservative)
    tax_rate = 0.26
    adjusted_earnings = (base_ebitda + synergy_value) * (1 - tax_rate)
    epv_valuation = adjusted_earnings / enhanced_wacc
    
    print(f"💼 EPV METHOD (Conservative)")
    print(f"   Base EBITDA: ${base_ebitda:,.0f}")
    print(f"   Synergy Value: ${synergy_value:,.0f}")
    print(f"   Enhanced EBITDA: ${base_ebitda + synergy_value:,.0f}")
    print(f"   After-Tax Earnings: ${adjusted_earnings:,.0f}")
    print(f"   WACC: {enhanced_wacc:.1%}")
    print(f"   🎯 EPV Valuation: ${epv_valuation:,.0f}")
    
    # 2. DCF Calculation (Growth-oriented)
    dcf_results = calculate_dcf_value(multi_year_data, enhanced_wacc)
    dcf_valuation = dcf_results['enterprise_value']
    
    print(f"\n📈 DCF METHOD (Growth-oriented)")
    print(f"   7-Year Projection Period")
    print(f"   Terminal Growth Rate: 3.0%")
    print(f"   Discount Rate: {enhanced_wacc:.1%}")
    print(f"   Interim Cash Flows PV: ${sum(dcf_results['present_values']):,.0f}")
    print(f"   Terminal Value PV: ${dcf_results['terminal_pv']:,.0f}")
    print(f"   🎯 DCF Valuation: ${dcf_valuation:,.0f}")
    
    # 3. Market Multiple Approach
    # Based on 2025 medispa benchmarks: medium-sized clinics 4.5-7.0x EBITDA
    exit_multiple_low = 4.5
    exit_multiple_high = 7.0
    exit_multiple_mid = (exit_multiple_low + exit_multiple_high) / 2
    
    multiple_valuation = (base_ebitda + synergy_value) * exit_multiple_mid
    
    print(f"\n📊 MARKET MULTIPLE METHOD")
    print(f"   Enhanced EBITDA: ${base_ebitda + synergy_value:,.0f}")
    print(f"   Industry Multiple Range: {exit_multiple_low:.1f}x - {exit_multiple_high:.1f}x")
    print(f"   Applied Multiple: {exit_multiple_mid:.1f}x")
    print(f"   🎯 Multiple Valuation: ${multiple_valuation:,.0f}")
    
    # 4. Hybrid Weighting
    # Weight based on data quality and growth profile
    data_quality = quality_score
    growth_profile = min(1.0, ebitda_cagr / 0.12)  # Normalize to 12% benchmark
    
    weights = {
        'epv': 0.4 - (data_quality * 0.2) - (growth_profile * 0.1),
        'dcf': 0.4 + (data_quality * 0.15) + (growth_profile * 0.15),
        'multiple': 0.2 + (data_quality * 0.05) - (growth_profile * 0.05)
    }
    
    # Normalize weights
    total_weight = sum(weights.values())
    for key in weights:
        weights[key] /= total_weight
    
    hybrid_valuation = (epv_valuation * weights['epv'] + 
                       dcf_valuation * weights['dcf'] + 
                       multiple_valuation * weights['multiple'])
    
    print(f"\n⚖️ HYBRID VALUATION WEIGHTING")
    print("-" * 50)
    print(f"Data Quality Factor: {data_quality:.1%}")
    print(f"Growth Profile Factor: {growth_profile:.1%}")
    print(f"EPV Weight: {weights['epv']:.1%}")
    print(f"DCF Weight: {weights['dcf']:.1%}")
    print(f"Multiple Weight: {weights['multiple']:.1%}")
    
    print(f"\n🎯 FINAL HYBRID VALUATION: ${hybrid_valuation:,.0f}")
    
    # Balance Sheet Adjustments
    tangible_assets = 207590  # 2027 value from simulation
    liabilities = 132390
    
    equity_value = hybrid_valuation + tangible_assets - liabilities
    
    print(f"\n🏦 BALANCE SHEET ADJUSTMENTS")
    print("-" * 50)
    print(f"Enterprise Value: ${hybrid_valuation:,.0f}")
    print(f"+ Tangible Assets: ${tangible_assets:,.0f}")
    print(f"- Liabilities: ${liabilities:,.0f}")
    print(f"🎯 Total Equity Value: ${equity_value:,.0f}")
    
    # Comparison with Manual Calculations
    print(f"\n📋 COMPARISON WITH MANUAL CALCULATIONS")
    print("=" * 50)
    
    manual_multiple_low = avg_3yr_ebitda * 3.0  # Using their 3-year avg
    manual_multiple_high = avg_3yr_ebitda * 8.0
    manual_hybrid_estimate = 4100000  # Their $4.10M hybrid estimate
    
    print(f"Manual 3-Year Multiple Range: ${manual_multiple_low:,.0f} - ${manual_multiple_high:,.0f}")
    print(f"Manual Hybrid Estimate: ${manual_hybrid_estimate:,.0f}")
    print(f"Enhanced Platform Result: ${equity_value:,.0f}")
    
    variance_pct = ((equity_value - manual_hybrid_estimate) / manual_hybrid_estimate) * 100
    print(f"Variance vs Manual: {variance_pct:+.1f}%")
    
    # Sensitivity Analysis
    print(f"\n📊 SENSITIVITY ANALYSIS")
    print("-" * 50)
    
    # WACC sensitivity
    wacc_low = enhanced_wacc * 0.85
    wacc_high = enhanced_wacc * 1.15
    
    epv_low = adjusted_earnings / wacc_low
    epv_high = adjusted_earnings / wacc_high
    
    print(f"WACC Sensitivity:")
    print(f"  Low WACC (-15%): ${epv_low:,.0f}")
    print(f"  Base WACC: ${epv_valuation:,.0f}")
    print(f"  High WACC (+15%): ${epv_high:,.0f}")
    
    # Growth sensitivity
    print(f"Growth Sensitivity:")
    print(f"  Conservative (-15%): ${hybrid_valuation * 0.85:,.0f}")
    print(f"  Base Case: ${hybrid_valuation:,.0f}")
    print(f"  Aggressive (+25%): ${hybrid_valuation * 1.25:,.0f}")
    
    # Scenario Analysis
    bear_case = min(epv_valuation, hybrid_valuation * 0.75)
    bull_case = max(dcf_valuation, hybrid_valuation * 1.3)
    
    print(f"\n🎭 SCENARIO ANALYSIS")
    print("-" * 50)
    print(f"🐻 Bear Case: ${bear_case:,.0f}")
    print(f"📊 Base Case: ${hybrid_valuation:,.0f}")
    print(f"🚀 Bull Case: ${bull_case:,.0f}")
    
    print(f"\n" + "=" * 80)
    print("✅ SIMULATION COMPLETE - ENHANCED VALUATION ANALYSIS")
    print("=" * 80)
    
    return {
        'hybrid_valuation': hybrid_valuation,
        'equity_value': equity_value,
        'epv_valuation': epv_valuation,
        'dcf_valuation': dcf_valuation,
        'multiple_valuation': multiple_valuation,
        'enhanced_wacc': enhanced_wacc,
        'synergy_value': synergy_value,
        'weights': weights
    }

if __name__ == "__main__":
    results = run_simulation() 