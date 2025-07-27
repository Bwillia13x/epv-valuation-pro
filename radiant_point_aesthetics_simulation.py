#!/usr/bin/env python3
"""
Radiant Point Aesthetics Valuation Simulation
Based on detailed broker packet with quarterly P&L data
Single-site Austin, TX MedSpa Analysis
"""

import sys
import os
import numpy as np
import pandas as pd
import json
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple
import matplotlib.pyplot as plt
import seaborn as sns

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import EPV system components
try:
    from unified_epv_system import EPVInputs, ServiceLine, compute_unified_epv
except ImportError:
    print("Warning: Could not import EPV system. Running in standalone mode.")

@dataclass
class RadiantPointCase:
    """Radiant Point Aesthetics case data structure"""
    case_name: str
    location: str
    footprint: str
    service_mix_ttm: Dict[str, float]
    
    # Quarterly financial data
    quarterly_data: pd.DataFrame
    operating_metrics: pd.DataFrame
    
    # Balance sheet
    balance_sheet: Dict[str, float]
    
    # Normalizations
    adjustments: Dict[str, float]
    
    # Market data
    comps_data: Dict[str, Tuple[float, float]]

def create_radiant_point_case() -> RadiantPointCase:
    """
    Create the Radiant Point Aesthetics case study from broker packet data
    """
    
    # Quarterly P&L data exactly as provided
    quarterly_data = pd.DataFrame([
        {
            'Quarter': '2024-Q1',
            'Revenue': 1470000,
            'Product_COGS': 213150,
            'Provider_COGS': 154350,
            'GP': 1102500,
            'Rent': 78000,
            'Marketing': 102900,
            'Admin_Salaries': 450000,
            'Other_Opex': 176400,
            'OneTime': 0,
            'EBITDA_Reported': 296700
        },
        {
            'Quarter': '2024-Q2',
            'Revenue': 1545000,
            'Product_COGS': 224025,
            'Provider_COGS': 162225,
            'GP': 1158750,
            'Rent': 78000,
            'Marketing': 108150,
            'Admin_Salaries': 450000,
            'Other_Opex': 185400,
            'OneTime': 80000,
            'EBITDA_Reported': 257200
        },
        {
            'Quarter': '2024-Q3',
            'Revenue': 1605000,
            'Product_COGS': 232725,
            'Provider_COGS': 168525,
            'GP': 1203750,
            'Rent': 78000,
            'Marketing': 112350,
            'Admin_Salaries': 450000,
            'Other_Opex': 192600,
            'OneTime': 40000,
            'EBITDA_Reported': 330800
        },
        {
            'Quarter': '2024-Q4',
            'Revenue': 1685000,
            'Product_COGS': 244325,
            'Provider_COGS': 176925,
            'GP': 1263750,
            'Rent': 78000,
            'Marketing': 117950,
            'Admin_Salaries': 450000,
            'Other_Opex': 202200,
            'OneTime': 0,
            'EBITDA_Reported': 415600
        },
        {
            'Quarter': '2025-Q1',
            'Revenue': 1830000,
            'Product_COGS': 265350,
            'Provider_COGS': 192150,
            'GP': 1372500,
            'Rent': 78000,
            'Marketing': 128100,
            'Admin_Salaries': 450000,
            'Other_Opex': 219600,
            'OneTime': 0,
            'EBITDA_Reported': 497300
        },
        {
            'Quarter': '2025-Q2',
            'Revenue': 1920000,
            'Product_COGS': 278400,
            'Provider_COGS': 201600,
            'GP': 1440000,
            'Rent': 78000,
            'Marketing': 134400,
            'Admin_Salaries': 450000,
            'Other_Opex': 230400,
            'OneTime': 0,
            'EBITDA_Reported': 547200
        }
    ])
    
    # Operating metrics by quarter
    operating_metrics = pd.DataFrame([
        {'Quarter': '2024-Q1', 'Visits': 2722, 'Avg_Ticket': 540, 'Injector_Hours': 1300, 'Room_Utilization': 0.70},
        {'Quarter': '2024-Q2', 'Visits': 2861, 'Avg_Ticket': 540, 'Injector_Hours': 1350, 'Room_Utilization': 0.73},
        {'Quarter': '2024-Q3', 'Visits': 2972, 'Avg_Ticket': 540, 'Injector_Hours': 1400, 'Room_Utilization': 0.75},
        {'Quarter': '2024-Q4', 'Visits': 3120, 'Avg_Ticket': 540, 'Injector_Hours': 1450, 'Room_Utilization': 0.78},
        {'Quarter': '2025-Q1', 'Visits': 3268, 'Avg_Ticket': 560, 'Injector_Hours': 1520, 'Room_Utilization': 0.81},
        {'Quarter': '2025-Q2', 'Visits': 3429, 'Avg_Ticket': 560, 'Injector_Hours': 1580, 'Room_Utilization': 0.84}
    ])
    
    # Balance sheet as of Jun-30-2025
    balance_sheet = {
        'cash': 200000,
        'ar': 193000,
        'inventory': 168000,
        'ap': 331000,
        'term_debt': 950000,
        'capital_leases': 85000,
        'net_debt': 835000
    }
    
    # Add-backs and normalizations
    adjustments = {
        'owner_salary_addback': 120000,  # Owner salary above market
        'emr_migration': 80000,          # Q2-2024 EMR costs (one-time)
        'legal_settlement': 40000,       # Q3-2024 legal costs (one-time)
        'rent_to_market': -48000,        # Rent normalization (26k to 30k/mo)
        'total_addbacks': 192000         # Net positive adjustments
    }
    
    # Service mix (TTM)
    service_mix_ttm = {
        'injectables': 0.72,
        'laser_devices': 0.13,
        'facials_peels': 0.10,
        'retail': 0.05
    }
    
    # Industry comps data
    comps_data = {
        'single_site_sub1m': (7.5, 9.0),    # EV/EBITDA for sub-$1M EBITDA
        'multi_site_1to3m': (8.5, 10.0),    # EV/EBITDA for $1-3M EBITDA
        'target_multiple': 8.5               # Base case multiple
    }
    
    return RadiantPointCase(
        case_name="Radiant Point Aesthetics, LLC",
        location="Austin, TX",
        footprint="6 treatment rooms; 2 injectors (MD+NP), 1 laser tech, 2 estheticians",
        service_mix_ttm=service_mix_ttm,
        quarterly_data=quarterly_data,
        operating_metrics=operating_metrics,
        balance_sheet=balance_sheet,
        adjustments=adjustments,
        comps_data=comps_data
    )

def calculate_ttm_metrics(case: RadiantPointCase) -> Dict[str, float]:
    """Calculate TTM (trailing twelve months) financial metrics"""
    
    # Get last 4 quarters (Q3-2024 through Q2-2025)
    ttm_quarters = case.quarterly_data.tail(4)
    
    ttm_metrics = {
        'ttm_revenue': ttm_quarters['Revenue'].sum(),
        'ttm_product_cogs': ttm_quarters['Product_COGS'].sum(),
        'ttm_provider_cogs': ttm_quarters['Provider_COGS'].sum(),
        'ttm_gross_profit': ttm_quarters['GP'].sum(),
        'ttm_rent': ttm_quarters['Rent'].sum(),
        'ttm_marketing': ttm_quarters['Marketing'].sum(),
        'ttm_admin_salaries': ttm_quarters['Admin_Salaries'].sum(),
        'ttm_other_opex': ttm_quarters['Other_Opex'].sum(),
        'ttm_onetime': ttm_quarters['OneTime'].sum(),
        'ttm_ebitda_reported': ttm_quarters['EBITDA_Reported'].sum()
    }
    
    # Calculate adjusted EBITDA
    ttm_metrics['ttm_ebitda_adjusted'] = (
        ttm_metrics['ttm_ebitda_reported'] + 
        case.adjustments['owner_salary_addback'] +
        case.adjustments['emr_migration'] +
        case.adjustments['legal_settlement'] +
        case.adjustments['rent_to_market']
    )
    
    # Key margins
    ttm_metrics['gross_margin'] = ttm_metrics['ttm_gross_profit'] / ttm_metrics['ttm_revenue']
    ttm_metrics['ebitda_margin_reported'] = ttm_metrics['ttm_ebitda_reported'] / ttm_metrics['ttm_revenue']
    ttm_metrics['ebitda_margin_adjusted'] = ttm_metrics['ttm_ebitda_adjusted'] / ttm_metrics['ttm_revenue']
    
    return ttm_metrics

def create_ebitda_bridge(case: RadiantPointCase, ttm_metrics: Dict[str, float]) -> Dict[str, float]:
    """Create EBITDA bridge from reported to adjusted"""
    
    bridge = {
        'reported_ebitda': ttm_metrics['ttm_ebitda_reported'],
        'owner_salary_addback': case.adjustments['owner_salary_addback'],
        'emr_onetime_addback': case.adjustments['emr_migration'],
        'legal_onetime_addback': case.adjustments['legal_settlement'],
        'rent_normalization': case.adjustments['rent_to_market'],
        'adjusted_ebitda': ttm_metrics['ttm_ebitda_adjusted']
    }
    
    return bridge

def run_valuation_matrix(ttm_metrics: Dict[str, float], case: RadiantPointCase) -> Dict[str, Dict[str, float]]:
    """Run valuation matrix with multiple scenarios"""
    
    adjusted_ebitda = ttm_metrics['ttm_ebitda_adjusted']
    net_debt = case.balance_sheet['net_debt']
    
    # Multiple range: 7.0x to 10.0x
    multiples = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0]
    
    valuation_matrix = {}
    
    for multiple in multiples:
        enterprise_value = adjusted_ebitda * multiple
        equity_value = enterprise_value - net_debt
        
        valuation_matrix[f"{multiple}x"] = {
            'multiple': multiple,
            'enterprise_value': enterprise_value,
            'equity_value': equity_value,
            'ev_revenue_implied': enterprise_value / ttm_metrics['ttm_revenue']
        }
    
    return valuation_matrix

def calculate_irr_analysis(case: RadiantPointCase, ttm_metrics: Dict[str, float]) -> Dict[str, float]:
    """Calculate IRR analysis with 5-year hold assumption"""
    
    # Base case assumptions
    base_multiple = 8.5
    exit_multiple = 8.0
    debt_financing = 0.725  # 72.5% debt
    cost_of_debt = 0.085    # 8.5% (SOFR + 350 or fixed proxy)
    hold_period = 5
    
    # Entry valuation
    adjusted_ebitda = ttm_metrics['ttm_ebitda_adjusted']
    entry_ev = adjusted_ebitda * base_multiple
    entry_equity = entry_ev - case.balance_sheet['net_debt']
    
    # Growth assumptions
    revenue_cagr = 0.08     # 8% revenue growth
    margin_improvement = 0.01  # 100bps margin improvement over 5 years
    
    # Year 5 projections
    year5_revenue = ttm_metrics['ttm_revenue'] * (1 + revenue_cagr) ** hold_period
    year5_ebitda_margin = ttm_metrics['ebitda_margin_adjusted'] + margin_improvement
    year5_ebitda = year5_revenue * year5_ebitda_margin
    
    # Exit valuation
    exit_ev = year5_ebitda * exit_multiple
    
    # Debt paydown (assume 20% of excess cash flow goes to debt paydown)
    debt_paydown_rate = 0.20
    annual_debt_paydown = adjusted_ebitda * debt_paydown_rate
    remaining_debt = max(0, case.balance_sheet['net_debt'] - (annual_debt_paydown * hold_period))
    
    exit_equity = exit_ev - remaining_debt
    
    # IRR calculation
    irr = (exit_equity / entry_equity) ** (1/hold_period) - 1
    
    # Money on money multiple
    mom_multiple = exit_equity / entry_equity
    
    irr_analysis = {
        'entry_ev': entry_ev,
        'entry_equity': entry_equity,
        'debt_amount': entry_ev * debt_financing,
        'year5_revenue': year5_revenue,
        'year5_ebitda': year5_ebitda,
        'exit_ev': exit_ev,
        'exit_equity': exit_equity,
        'irr': irr,
        'mom_multiple': mom_multiple,
        'hold_period': hold_period
    }
    
    return irr_analysis

def run_epv_sanity_check(case: RadiantPointCase, ttm_metrics: Dict[str, float]) -> Dict[str, float]:
    """Run EPV calculation as sanity check vs multiple-based valuation"""
    
    # EPV parameters
    wacc = 0.12  # 12% WACC
    reinvestment_rate = 0.10  # 10% of EBIT reinvestment
    
    # Calculate EBIT (assume D&A of $60k annually)
    da_annual = 60000
    ebit = ttm_metrics['ttm_ebitda_adjusted'] - da_annual
    
    # Tax rate assumption
    tax_rate = 0.25  # 25% effective tax rate
    nopat = ebit * (1 - tax_rate)
    
    # Reinvestment
    reinvestment = ebit * reinvestment_rate
    
    # Free cash flow
    fcf = nopat - reinvestment
    
    # EPV calculation (perpetuity value)
    epv_enterprise = fcf / wacc
    epv_equity = epv_enterprise - case.balance_sheet['net_debt']
    
    # Compare to multiple-based valuation
    base_case_ev = ttm_metrics['ttm_ebitda_adjusted'] * 8.5
    
    epv_results = {
        'ebit': ebit,
        'nopat': nopat,
        'reinvestment': reinvestment,
        'fcf': fcf,
        'epv_enterprise': epv_enterprise,
        'epv_equity': epv_equity,
        'epv_vs_multiple_ev': epv_enterprise / base_case_ev,
        'implied_multiple': epv_enterprise / ttm_metrics['ttm_ebitda_adjusted']
    }
    
    return epv_results

def analyze_risks_mitigants(case: RadiantPointCase) -> Dict[str, List[str]]:
    """Analyze key risks and mitigants"""
    
    risks_and_mitigants = {
        'key_risks': [
            'Single-clinician dependency (MD + NP injector model)',
            'Related-party lease re-pricing risk at renewal',
            'Injector hiring pipeline and retention challenges',
            'Market saturation in Austin injectables market',
            'Regulatory changes affecting aesthetic procedures',
            'Economic sensitivity of discretionary spending'
        ],
        'mitigants': [
            'Strong referral flywheel and 24k active patient base',
            'Diversified service mix beyond just injectables',
            'Proven ability to scale (added NP in Q3-24)',
            'Strong operational metrics (84% room utilization)',
            'Established EMR and online booking systems',
            'Cash-pay model reduces payor concentration risk'
        ],
        'value_drivers': [
            'Room utilization expansion potential (current 84%)',
            'Average ticket growth ($540 to $560 achieved)',
            'Service mix optimization opportunities',
            'Operational leverage on fixed cost base',
            'Geographic expansion potential in Austin MSA'
        ]
    }
    
    return risks_and_mitigants

def generate_comprehensive_report(case: RadiantPointCase) -> Dict:
    """Generate comprehensive valuation report"""
    
    print(f"\n{'='*80}")
    print(f"RADIANT POINT AESTHETICS VALUATION ANALYSIS")
    print(f"Comprehensive EPV Platform Simulation")
    print(f"{'='*80}")
    
    # Calculate TTM metrics
    print("\n1. Calculating TTM Financial Metrics...")
    ttm_metrics = calculate_ttm_metrics(case)
    
    # EBITDA Bridge
    print("\n2. Creating EBITDA Bridge...")
    ebitda_bridge = create_ebitda_bridge(case, ttm_metrics)
    
    # Valuation Matrix
    print("\n3. Running Valuation Matrix...")
    valuation_matrix = run_valuation_matrix(ttm_metrics, case)
    
    # IRR Analysis
    print("\n4. Calculating IRR Analysis...")
    irr_analysis = calculate_irr_analysis(case, ttm_metrics)
    
    # EPV Sanity Check
    print("\n5. Running EPV Sanity Check...")
    epv_results = run_epv_sanity_check(case, ttm_metrics)
    
    # Risk Analysis
    print("\n6. Analyzing Risks & Mitigants...")
    risk_analysis = analyze_risks_mitigants(case)
    
    # Compile comprehensive results
    comprehensive_results = {
        'case_summary': {
            'name': case.case_name,
            'location': case.location,
            'footprint': case.footprint,
            'service_mix': case.service_mix_ttm
        },
        'ttm_metrics': ttm_metrics,
        'ebitda_bridge': ebitda_bridge,
        'valuation_matrix': valuation_matrix,
        'irr_analysis': irr_analysis,
        'epv_results': epv_results,
        'risk_analysis': risk_analysis
    }
    
    return comprehensive_results

def print_detailed_results(results: Dict):
    """Print detailed formatted results"""
    
    print(f"\n{'='*60}")
    print("EXECUTIVE SUMMARY")
    print(f"{'='*60}")
    
    ttm = results['ttm_metrics']
    bridge = results['ebitda_bridge']
    
    print(f"\nTarget: {results['case_summary']['name']}")
    print(f"Location: {results['case_summary']['location']}")
    print(f"TTM Revenue: ${ttm['ttm_revenue']:,.0f}")
    print(f"TTM Adjusted EBITDA: ${ttm['ttm_ebitda_adjusted']:,.0f}")
    print(f"Adjusted EBITDA Margin: {ttm['ebitda_margin_adjusted']:.1%}")
    
    print(f"\n{'='*60}")
    print("EBITDA BRIDGE (TTM)")
    print(f"{'='*60}")
    
    print(f"Reported EBITDA:          ${bridge['reported_ebitda']:,.0f}")
    print(f"+ Owner Salary Add-back:  ${bridge['owner_salary_addback']:,.0f}")
    print(f"+ EMR One-time:           ${bridge['emr_onetime_addback']:,.0f}")
    print(f"+ Legal One-time:         ${bridge['legal_onetime_addback']:,.0f}")
    print(f"- Rent Normalization:     ${bridge['rent_normalization']:,.0f}")
    print(f"{'-'*40}")
    print(f"ADJUSTED EBITDA:          ${bridge['adjusted_ebitda']:,.0f}")
    
    print(f"\n{'='*60}")
    print("VALUATION MATRIX")
    print(f"{'='*60}")
    
    print(f"{'Multiple':<10} {'Enterprise Value':<15} {'Equity Value':<15} {'EV/Revenue':<10}")
    print(f"{'-'*55}")
    
    for multiple_key, val_data in results['valuation_matrix'].items():
        print(f"{multiple_key:<10} ${val_data['enterprise_value']:,.0f}        ${val_data['equity_value']:,.0f}       {val_data['ev_revenue_implied']:.1f}x")
    
    # Highlight base case
    base_case = results['valuation_matrix']['8.5x']
    print(f"\nBASE CASE (8.5x): Enterprise Value ${base_case['enterprise_value']:,.0f} | Equity Value ${base_case['equity_value']:,.0f}")
    
    print(f"\n{'='*60}")
    print("IRR ANALYSIS (5-Year Hold)")
    print(f"{'='*60}")
    
    irr = results['irr_analysis']
    print(f"Entry Equity Value:       ${irr['entry_equity']:,.0f}")
    print(f"Debt Financing (72.5%):   ${irr['debt_amount']:,.0f}")
    print(f"Year 5 Revenue:           ${irr['year5_revenue']:,.0f}")
    print(f"Year 5 EBITDA:            ${irr['year5_ebitda']:,.0f}")
    print(f"Exit Enterprise Value:    ${irr['exit_ev']:,.0f}")
    print(f"Exit Equity Value:        ${irr['exit_equity']:,.0f}")
    print(f"IRR:                      {irr['irr']:.1%}")
    print(f"Money-on-Money Multiple:  {irr['mom_multiple']:.1f}x")
    
    print(f"\n{'='*60}")
    print("EPV SANITY CHECK")
    print(f"{'='*60}")
    
    epv = results['epv_results']
    print(f"EBIT:                     ${epv['ebit']:,.0f}")
    print(f"NOPAT:                    ${epv['nopat']:,.0f}")
    print(f"Free Cash Flow:           ${epv['fcf']:,.0f}")
    print(f"EPV Enterprise Value:     ${epv['epv_enterprise']:,.0f}")
    print(f"EPV Equity Value:         ${epv['epv_equity']:,.0f}")
    print(f"EPV vs Multiple EV:       {epv['epv_vs_multiple_ev']:.1f}x")
    print(f"EPV Implied Multiple:     {epv['implied_multiple']:.1f}x")
    
    print(f"\n{'='*60}")
    print("KEY RISKS & MITIGANTS")
    print(f"{'='*60}")
    
    risks = results['risk_analysis']
    print("\nKey Risks:")
    for i, risk in enumerate(risks['key_risks'], 1):
        print(f"{i}. {risk}")
    
    print("\nMitigants:")
    for i, mitigant in enumerate(risks['mitigants'], 1):
        print(f"{i}. {mitigant}")
    
    print("\nValue Drivers:")
    for i, driver in enumerate(risks['value_drivers'], 1):
        print(f"{i}. {driver}")

def save_results(results: Dict, filename: str = None):
    """Save results to JSON file"""
    
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"radiant_point_valuation_{timestamp}.json"
    
    # Convert numpy types to native Python types for JSON serialization
    def convert_numpy_types(obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {key: convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [convert_numpy_types(item) for item in obj]
        return obj
    
    serializable_results = convert_numpy_types(results)
    
    with open(filename, 'w') as f:
        json.dump(serializable_results, f, indent=2)
    
    print(f"\nResults saved to: {filename}")

def main():
    """Main execution function"""
    
    print("Loading Radiant Point Aesthetics case data...")
    case = create_radiant_point_case()
    
    print("Running comprehensive valuation analysis...")
    results = generate_comprehensive_report(case)
    
    print_detailed_results(results)
    
    # Save results
    save_results(results)
    
    print(f"\n{'='*80}")
    print("SIMULATION COMPLETE")
    print(f"{'='*80}")

if __name__ == "__main__":
    main() 