import pandas as pd
import numpy as np
import json
from datetime import datetime

def run_vistabelle_valuation():
    """Run VistaBelle Aesthetics valuation analysis"""
    
    # Quarterly financial data
    quarterly_data = {
        'Quarter': ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2'],
        'Revenue': [1250000, 1320000, 1380000, 1460000, 1540000, 1620000],
        'Product_COGS': [187500.0, 198000.0, 207000.0, 219000.0, 231000.0, 243000.0],
        'Provider_COGS': [143750.0, 151800.0, 158700.0, 167900.0, 177100.0, 186300.0],
        'GP': [918750.0, 970200.0, 1014300.0, 1073100.0, 1131900.0, 1190700.0],
        'Rent': [93000, 93000, 93000, 93000, 93000, 93000],
        'Marketing': [87500.0, 92400.0, 96600.0, 102200.0, 107800.0, 113400.0],
        'Admin_Salaries': [460000, 460000, 460000, 460000, 460000, 460000],
        'Other_Opex': [137500.0, 145200.0, 151800.0, 160600.0, 169400.0, 178200.0],
        'OneTime': [0, 0, 20000, 50000, 0, 0],
        'EBITDA_Reported': [140750.0, 179600.0, 192900.0, 207300.0, 301700.0, 346100.0]
    }
    
    df = pd.DataFrame(quarterly_data)
    
    # TTM calculations (2024-Q3 to 2025-Q2)
    ttm_quarters = ['2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2']
    ttm_data = df[df['Quarter'].isin(ttm_quarters)]
    
    ttm_revenue = ttm_data['Revenue'].sum()
    ttm_ebitda_reported = ttm_data['EBITDA_Reported'].sum()
    
    # EBITDA Bridge normalization
    owner_addback = 130000
    onetime_addback = 70000  # Legal $20k + Rebrand $50k
    rent_normalization = -60000  # Market rent adjustment
    
    ttm_ebitda_adjusted = ttm_ebitda_reported + owner_addback + onetime_addback + rent_normalization
    ttm_margin = ttm_ebitda_adjusted / ttm_revenue
    
    # Valuation matrix (7.0x to 9.5x)
    multiples = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5]
    net_debt = 1170000  # From balance sheet
    
    valuation_matrix = []
    for multiple in multiples:
        enterprise_value = ttm_ebitda_adjusted * multiple
        equity_value = enterprise_value - net_debt
        ev_revenue_ratio = enterprise_value / ttm_revenue
        
        valuation_matrix.append({
            'multiple': multiple,
            'enterprise_value': enterprise_value,
            'equity_value_to_seller': equity_value,
            'ev_revenue_ratio': ev_revenue_ratio
        })
    
    # EPV Analysis
    da_expense = 90000
    ebit = ttm_ebitda_adjusted - da_expense
    tax_rate = 0.26
    nopat = ebit * (1 - tax_rate)
    reinvestment_rate = 0.08
    reinvestment = ebit * reinvestment_rate
    wacc = 0.12
    
    epv_fcf = nopat - reinvestment
    epv_enterprise_value = epv_fcf / wacc
    epv_equity_value = epv_enterprise_value - net_debt
    epv_implied_multiple = epv_enterprise_value / ttm_ebitda_adjusted
    
    # LBO Analysis at 8.5x multiple
    entry_multiple = 8.5
    entry_ev = ttm_ebitda_adjusted * entry_multiple
    debt_capacity = 0.72  # 72% debt financing
    new_debt = entry_ev * debt_capacity
    sponsor_equity = entry_ev - new_debt
    
    # Working capital assumptions
    ar_days = 11
    inventory_days = 60
    ap_days = 38
    
    # Maintenance CapEx
    maint_capex_rate = 0.018
    
    # Growth assumptions for projections
    revenue_growth = 0.08  # 8% annual growth
    ebitda_margin = ttm_margin  # Maintain current margin
    
    # 5-year projection for LBO
    projection_years = 5
    current_revenue = ttm_revenue
    debt_balance = new_debt
    interest_rate = 0.085  # 8.5% interest on debt
    
    projections = []
    for year in range(1, projection_years + 1):
        proj_revenue = current_revenue * (1 + revenue_growth) ** year
        proj_ebitda = proj_revenue * ebitda_margin
        proj_ebit = proj_ebitda - da_expense
        proj_nopat = proj_ebit * (1 - tax_rate)
        
        maint_capex = proj_revenue * maint_capex_rate
        
        # Working capital changes (simplified)
        delta_wc = (proj_revenue - (current_revenue * (1 + revenue_growth) ** (year-1) if year > 1 else ttm_revenue)) * 0.02
        
        interest_expense = debt_balance * interest_rate
        fcf_before_debt = proj_nopat - maint_capex - delta_wc
        
        # Debt paydown (50% of excess FCF)
        excess_fcf = max(0, fcf_before_debt - interest_expense)
        debt_paydown = excess_fcf * 0.5
        debt_balance = max(0, debt_balance - debt_paydown)
        
        projections.append({
            'year': year,
            'revenue': proj_revenue,
            'ebitda': proj_ebitda,
            'ebit': proj_ebit,
            'nopat': proj_nopat,
            'maint_capex': maint_capex,
            'delta_wc': delta_wc,
            'interest': interest_expense,
            'fcf_before_debt': fcf_before_debt,
            'debt_paydown': debt_paydown,
            'debt_balance': debt_balance
        })
    
    # Exit assumptions
    exit_multiple = 8.0
    exit_ebitda = projections[-1]['ebitda']
    exit_ev = exit_ebitda * exit_multiple
    exit_debt = projections[-1]['debt_balance']
    exit_equity_proceeds = exit_ev - exit_debt
    
    # IRR calculation
    cash_flows = [-sponsor_equity]  # Initial investment
    for proj in projections[:-1]:
        cash_flows.append(0)  # No interim distributions
    cash_flows[-1] = exit_equity_proceeds  # Exit proceeds in year 5
    
    # Simple IRR approximation
    total_return = exit_equity_proceeds / sponsor_equity
    irr = (total_return ** (1/projection_years)) - 1
    moic = total_return
    
    # Compile results
    results = {
        'target_name': 'VistaBelle Aesthetics, LLC',
        'analysis_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'ttm_window': '2024-Q3 to 2025-Q2',
        'ttm_metrics': {
            'ttm_revenue': ttm_revenue,
            'ttm_ebitda_reported': ttm_ebitda_reported,
            'ttm_ebitda_adjusted': ttm_ebitda_adjusted,
            'ttm_margin': ttm_margin
        },
        'ebitda_bridge': {
            'reported_ebitda': ttm_ebitda_reported,
            'owner_addback': owner_addback,
            'onetime_addback': onetime_addback,
            'rent_normalization': rent_normalization,
            'adjusted_ebitda': ttm_ebitda_adjusted
        },
        'valuation_matrix': valuation_matrix,
        'epv_analysis': {
            'ebit': ebit,
            'nopat': nopat,
            'reinvestment': reinvestment,
            'epv_fcf': epv_fcf,
            'wacc': wacc,
            'epv_enterprise_value': epv_enterprise_value,
            'epv_equity_value': epv_equity_value,
            'epv_implied_multiple': epv_implied_multiple
        },
        'lbo_analysis': {
            'entry_multiple': entry_multiple,
            'entry_ev': entry_ev,
            'new_debt': new_debt,
            'sponsor_equity': sponsor_equity,
            'debt_pct': debt_capacity * 100,
            'exit_multiple': exit_multiple,
            'exit_equity_proceeds': exit_equity_proceeds,
            'irr': irr,
            'moic': moic
        },
        'projections': projections
    }
    
    return results

if __name__ == "__main__":
    results = run_vistabelle_valuation()
    
    # Print key results
    print("=== VISTABELLE AESTHETICS VALUATION ANALYSIS ===\n")
    
    print("TTM METRICS:")
    print(f"Revenue: ${results['ttm_metrics']['ttm_revenue']:,.0f}")
    print(f"Reported EBITDA: ${results['ttm_metrics']['ttm_ebitda_reported']:,.0f}")
    print(f"Adjusted EBITDA: ${results['ttm_metrics']['ttm_ebitda_adjusted']:,.0f}")
    print(f"Margin: {results['ttm_metrics']['ttm_margin']:.1%}")
    
    print(f"\nEBITDA BRIDGE:")
    bridge = results['ebitda_bridge']
    print(f"Reported EBITDA: ${bridge['reported_ebitda']:,.0f}")
    print(f"+ Owner Add-back: ${bridge['owner_addback']:,.0f}")
    print(f"+ One-time Add-back: ${bridge['onetime_addback']:,.0f}")
    print(f"- Rent Normalization: ${bridge['rent_normalization']:,.0f}")
    print(f"= Adjusted EBITDA: ${bridge['adjusted_ebitda']:,.0f}")
    
    print(f"\nVALUATION MATRIX:")
    print("Multiple  Enterprise Value  Equity to Seller  EV/Revenue")
    print("-" * 55)
    for val in results['valuation_matrix']:
        print(f"{val['multiple']:.1f}x     ${val['enterprise_value']:9,.0f}  ${val['equity_value_to_seller']:11,.0f}    {val['ev_revenue_ratio']:.2f}x")
    
    print(f"\nEPV ANALYSIS:")
    epv = results['epv_analysis']
    print(f"EBIT: ${epv['ebit']:,.0f}")
    print(f"NOPAT: ${epv['nopat']:,.0f}")
    print(f"EPV Enterprise Value: ${epv['epv_enterprise_value']:,.0f}")
    print(f"EPV Equity Value: ${epv['epv_equity_value']:,.0f}")
    print(f"EPV Implied Multiple: {epv['epv_implied_multiple']:.1f}x")
    
    print(f"\nLBO SUMMARY:")
    lbo = results['lbo_analysis']
    print(f"Entry Multiple: {lbo['entry_multiple']:.1f}x")
    print(f"Entry EV: ${lbo['entry_ev']:,.0f}")
    print(f"New Debt: ${lbo['new_debt']:,.0f} ({lbo['debt_pct']:.0f}%)")
    print(f"Sponsor Equity: ${lbo['sponsor_equity']:,.0f}")
    print(f"Exit Equity Proceeds: ${lbo['exit_equity_proceeds']:,.0f}")
    print(f"IRR: {lbo['irr']:.1%}")
    print(f"MoIC: {lbo['moic']:.1f}x")
    
    # Save to JSON
    output_file = 'vistabelle_valuation_results.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nResults saved to {output_file}")