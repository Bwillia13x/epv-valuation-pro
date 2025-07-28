import pandas as pd
import numpy as np
import json
from datetime import datetime

def run_auroraskin_valuation():
    """Run AuroraSkin & Laser valuation analysis based on broker packet data"""
    
    # Quarterly financial data exactly as provided
    quarterly_data = {
        'Quarter': ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2'],
        'Revenue': [1900000, 2000000, 2050000, 2120000, 2250000, 2330000],
        'Product_COGS': [304000.0, 320000.0, 328000.0, 339200.0, 360000.0, 372800.0],
        'Provider_COGS': [228000.0, 240000.0, 246000.0, 254400.0, 270000.0, 279600.0],
        'GP': [1368000.0, 1440000.0, 1476000.0, 1526400.0, 1620000.0, 1677600.0],
        'Rent': [135000, 135000, 135000, 135000, 135000, 135000],
        'Marketing': [161500.0, 170000.0, 174250.0, 180200.0, 191250.0, 198050.0],
        'Admin_Salaries': [580000, 580000, 580000, 580000, 580000, 580000],
        'Other_Opex': [218500.0, 230000.0, 235750.0, 243800.0, 258750.0, 267950.0],
        'OneTime': [0, 0, 0, 50000, 30000, 0],
        'EBITDA_Reported': [273000.0, 325000.0, 351000.0, 337400.0, 425000.0, 496600.0]
    }
    
    df = pd.DataFrame(quarterly_data)
    
    # TTM calculations (2024-Q3 to 2025-Q2) as specified
    ttm_quarters = ['2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2']
    ttm_data = df[df['Quarter'].isin(ttm_quarters)]
    
    ttm_revenue = ttm_data['Revenue'].sum()  # Should be $8,750,000
    ttm_ebitda_reported = ttm_data['EBITDA_Reported'].sum()  # Should be $1,610,000
    
    # EBITDA Bridge normalization exactly as specified
    owner_addback = 200000  # Owner salary add-back
    onetime_addback = 80000  # Brand/regulatory $50k Q4-2024 + EMR training $30k Q1-2025
    rent_normalization = -84000  # Market rent adjustment (recorded $135k vs market $156k per qtr × 4 qtrs = -$84k)
    
    ttm_ebitda_adjusted = ttm_ebitda_reported + owner_addback + onetime_addback + rent_normalization
    ttm_margin = ttm_ebitda_adjusted / ttm_revenue  # Should be 20.6%
    
    # Valuation matrix (7.0x to 10.0x as provided in orientation)
    multiples = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0]
    net_debt = 2030000  # From balance sheet: Net Debt $2.03m
    
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
    
    # EPV Analysis using provided defaults
    da_expense = 120000  # D&A $120k/year as specified
    ebit = ttm_ebitda_adjusted - da_expense  # Should be $1,686,000
    tax_rate = 0.26  # 26% tax rate
    nopat = ebit * (1 - tax_rate)  # Should be ≈ $1,247,640
    reinvestment_rate = 0.09  # 9% of EBIT as specified
    reinvestment = ebit * reinvestment_rate  # Should be $151,740
    wacc = 0.12  # 12% WACC as specified
    
    epv_fcf = nopat - reinvestment  # Should be $1,095,900
    epv_enterprise_value = epv_fcf / wacc  # Should be $9.133m
    epv_equity_value = epv_enterprise_value - net_debt  # Should be $7.103m
    epv_implied_multiple = epv_enterprise_value / ttm_ebitda_adjusted  # Should be ≈ 5.1x
    
    # LBO Analysis at 8.5x multiple as specified in orientation
    entry_multiple = 8.5
    entry_ev = ttm_ebitda_adjusted * entry_multiple  # Should be $15.351m
    debt_capacity = 0.725  # 72.5% debt financing as specified
    new_debt = entry_ev * debt_capacity  # Should be ≈ $11.13m
    sponsor_equity = entry_ev - new_debt  # Should be $4.22m
    interest_rate = 0.0875  # 8.75% rate as specified
    
    # Working capital assumptions from case data
    ar_days = 11  # A/R: 11 days of sales
    inventory_days = 65  # Inventory: 65 days product COGS
    ap_days = 40  # A/P: 40 days total COGS
    
    # Maintenance CapEx
    maint_capex_rate = 0.018  # 1.8% of revenue as specified
    
    # Growth assumptions for projections
    revenue_growth = 0.08  # 8% EBITDA CAGR implied from orientation
    ebitda_margin = ttm_margin  # Maintain current margin
    
    # 5-year projection for LBO
    projection_years = 5
    current_revenue = ttm_revenue
    debt_balance = new_debt
    fcf_sweep_pct = 0.75  # 75% FCF sweep as specified
    
    projections = []
    for year in range(1, projection_years + 1):
        proj_revenue = current_revenue * (1 + revenue_growth) ** year
        proj_ebitda = proj_revenue * ebitda_margin
        proj_ebit = proj_ebitda - da_expense
        proj_nopat = proj_ebit * (1 - tax_rate)
        
        maint_capex = proj_revenue * maint_capex_rate
        
        # Working capital changes based on growth
        if year == 1:
            # Calculate working capital requirements
            ar_req = (proj_revenue / 365) * ar_days
            inventory_req = ((proj_revenue * 0.16) / 365) * inventory_days  # Product COGS 16%
            ap_credit = (((proj_revenue * 0.16) + (proj_revenue * 0.12)) / 365) * ap_days  # Product + Provider COGS
            net_wc_req = ar_req + inventory_req - ap_credit
            
            # Assume prior year WC was proportional
            prior_net_wc = net_wc_req * (current_revenue / proj_revenue)
            delta_wc = net_wc_req - prior_net_wc
        else:
            # Incremental WC based on revenue growth
            prev_proj_revenue = current_revenue * (1 + revenue_growth) ** (year-1)
            delta_wc = (proj_revenue - prev_proj_revenue) * 0.03  # Simplified 3% of revenue growth
        
        interest_expense = debt_balance * interest_rate
        fcf_before_debt = proj_nopat - maint_capex - delta_wc
        
        # Debt paydown (75% FCF sweep as specified)
        excess_fcf = max(0, fcf_before_debt - interest_expense)
        debt_paydown = excess_fcf * fcf_sweep_pct
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
    
    # Exit assumptions - 8.0x exit multiple as specified
    exit_multiple = 8.0
    exit_ebitda = projections[-1]['ebitda']  # Year 5 EBITDA should be ~$2.65m
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
    
    # Operating KPIs from case data
    operating_kpis = {
        'Quarter': ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2'],
        'Visits': [2900, 3020, 3120, 3260, 3420, 3560],
        'Avg_Ticket': [540, 540, 545, 550, 555, 560],
        'Injector_Hours': [1260, 1310, 1360, 1420, 1480, 1540],
        'Room_Utilization': [70, 71, 73, 76, 80, 83]
    }
    
    # Balance sheet snapshot
    balance_sheet = {
        'cash': 350000,
        'accounts_receivable': 265000,
        'inventory': 250000,
        'accounts_payable': -270000,
        'term_debt': 2200000,
        'finance_leases': 180000,
        'net_debt': 2030000
    }
    
    # Target overview
    target_overview = {
        'name': 'AuroraSkin & Laser, LLC',
        'location': 'Miami, FL',
        'site_type': 'Single-site',
        'treatment_rooms': 6,
        'staff': {
            'injectors': 2,  # MD + PA
            'laser_tech': 1,
            'estheticians': 2
        },
        'payor_mix': '100% cash/credit',
        'service_mix_ttm': {
            'injectables': 0.62,
            'devices': 0.23,
            'memberships_facials': 0.10,
            'retail': 0.05
        }
    }
    
    # Compile comprehensive results
    results = {
        'target_overview': target_overview,
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
            'interest_rate': interest_rate * 100,
            'fcf_sweep_pct': fcf_sweep_pct * 100,
            'exit_multiple': exit_multiple,
            'exit_ebitda': exit_ebitda,
            'exit_equity_proceeds': exit_equity_proceeds,
            'irr': irr,
            'moic': moic
        },
        'projections': projections,
        'operating_kpis': operating_kpis,
        'balance_sheet': balance_sheet,
        'quarterly_data': quarterly_data
    }
    
    return results

if __name__ == "__main__":
    results = run_auroraskin_valuation()
    
    # Print comprehensive results exactly as requested
    print("=== AURORASKIN & LASER VALUATION ANALYSIS ===\n")
    
    print("TTM METRICS:")
    print(f"Revenue: ${results['ttm_metrics']['ttm_revenue']:,.0f}")
    print(f"Reported EBITDA: ${results['ttm_metrics']['ttm_ebitda_reported']:,.0f}")
    print(f"Adjusted EBITDA: ${results['ttm_metrics']['ttm_ebitda_adjusted']:,.0f}")
    print(f"Margin: {results['ttm_metrics']['ttm_margin']:.1%}")
    
    print(f"\nEBITDA BRIDGE (TTM):")
    bridge = results['ebitda_bridge']
    print(f"${bridge['reported_ebitda']:,.0f} → +${bridge['owner_addback']:,.0f} → +${bridge['onetime_addback']:,.0f} → ${bridge['rent_normalization']:,.0f} → ${bridge['adjusted_ebitda']:,.0f}")
    
    print(f"\nVALUATION MATRIX & EQUITY TO SELLER:")
    print("Multiple  Enterprise Value  Equity to Seller  EV/Revenue")
    print("-" * 60)
    for val in results['valuation_matrix']:
        print(f"{val['multiple']:.1f}x     ${val['enterprise_value']:10,.0f}  ${val['equity_value_to_seller']:12,.0f}    {val['ev_revenue_ratio']:.2f}x")
    
    print(f"\nEPV PANEL:")
    epv = results['epv_analysis']
    print(f"EBIT: ${epv['ebit']:,.0f}")
    print(f"NOPAT: ${epv['nopat']:,.0f}")
    print(f"Reinvestment: ${epv['reinvestment']:,.0f}")
    print(f"EPV FCF: ${epv['epv_fcf']:,.0f}")
    print(f"WACC: {epv['wacc']:.0%}")
    print(f"EPV Enterprise Value: ${epv['epv_enterprise_value']:,.0f}")
    print(f"EPV Equity Value: ${epv['epv_equity_value']:,.0f}")
    print(f"EPV Implied Multiple: {epv['epv_implied_multiple']:.1f}x")
    
    print(f"\nLBO SUMMARY:")
    lbo = results['lbo_analysis']
    print(f"Sources/Uses:")
    print(f"  Entry EV @ {lbo['entry_multiple']:.1f}x: ${lbo['entry_ev']:,.0f}")
    print(f"  New Debt ({lbo['debt_pct']:.1f}%): ${lbo['new_debt']:,.0f}")
    print(f"  Sponsor Equity: ${lbo['sponsor_equity']:,.0f}")
    print(f"Debt Schedule:")
    print(f"  Interest Rate: {lbo['interest_rate']:.2f}%")
    print(f"  FCF Sweep: {lbo['fcf_sweep_pct']:.0f}%")
    print(f"Exit:")
    print(f"  Year 5 EBITDA: ${lbo['exit_ebitda']:,.0f}")
    print(f"  Exit Multiple: {lbo['exit_multiple']:.1f}x")
    print(f"  Exit Equity Proceeds: ${lbo['exit_equity_proceeds']:,.0f}")
    print(f"Returns:")
    print(f"  IRR: {lbo['irr']:.1%}")
    print(f"  MoIC: {lbo['moic']:.1f}x")
    
    # Save to JSON
    output_file = f'auroraskin_laser_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nResults saved to {output_file}") 