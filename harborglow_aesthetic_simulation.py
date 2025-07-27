#!/usr/bin/env python3
"""
HarborGlow Aesthetics Valuation Simulation
Based on detailed broker packet with quarterly P&L data
Single-site Nashville, TN MedSpa Analysis
Incorporates all corrected EPV platform fixes
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json

class HarborGlowValidator:
    def __init__(self):
        # TTM Quarterly Data (Q3-2024 through Q2-2025)
        self.ttm_quarters = [
            {'quarter': '2024-Q3', 'revenue': 1750000, 'ebitda_reported': 322500},
            {'quarter': '2024-Q4', 'revenue': 1860000, 'ebitda_reported': 323000},
            {'quarter': '2025-Q1', 'revenue': 1950000, 'ebitda_reported': 387500},
            {'quarter': '2025-Q2', 'revenue': 2050000, 'ebitda_reported': 487500}
        ]
        
        # Complete quarterly dataset for analysis
        self.all_quarters = [
            {'quarter': '2024-Q1', 'revenue': 1600000, 'product_cogs': 248000, 'provider_cogs': 176000, 
             'rent': 120000, 'marketing': 120000, 'admin': 520000, 'other_opex': 176000, 'onetime': 0, 'ebitda_reported': 240000},
            {'quarter': '2024-Q2', 'revenue': 1680000, 'product_cogs': 260400, 'provider_cogs': 184800, 
             'rent': 120000, 'marketing': 126000, 'admin': 520000, 'other_opex': 184800, 'onetime': 0, 'ebitda_reported': 284000},
            {'quarter': '2024-Q3', 'revenue': 1750000, 'product_cogs': 271250, 'provider_cogs': 192500, 
             'rent': 120000, 'marketing': 131250, 'admin': 520000, 'other_opex': 192500, 'onetime': 0, 'ebitda_reported': 322500},
            {'quarter': '2024-Q4', 'revenue': 1860000, 'product_cogs': 288300, 'provider_cogs': 204600, 
             'rent': 120000, 'marketing': 139500, 'admin': 520000, 'other_opex': 204600, 'onetime': 60000, 'ebitda_reported': 323000},
            {'quarter': '2025-Q1', 'revenue': 1950000, 'product_cogs': 302250, 'provider_cogs': 214500, 
             'rent': 120000, 'marketing': 146250, 'admin': 520000, 'other_opex': 214500, 'onetime': 45000, 'ebitda_reported': 387500},
            {'quarter': '2025-Q2', 'revenue': 2050000, 'product_cogs': 317750, 'provider_cogs': 225500, 
             'rent': 120000, 'marketing': 153750, 'admin': 520000, 'other_opex': 225500, 'onetime': 0, 'ebitda_reported': 487500}
        ]
        
        # Operating KPIs
        self.operating_kpis = [
            {'quarter': '2024-Q1', 'visits': 2650, 'avg_ticket': 560, 'injector_hours': 1220, 'room_utilization': 0.70},
            {'quarter': '2024-Q2', 'visits': 2760, 'avg_ticket': 560, 'injector_hours': 1270, 'room_utilization': 0.71},
            {'quarter': '2024-Q3', 'visits': 2910, 'avg_ticket': 565, 'injector_hours': 1330, 'room_utilization': 0.73},
            {'quarter': '2024-Q4', 'visits': 3080, 'avg_ticket': 570, 'injector_hours': 1390, 'room_utilization': 0.77},
            {'quarter': '2025-Q1', 'visits': 3220, 'avg_ticket': 575, 'injector_hours': 1460, 'room_utilization': 0.81},
            {'quarter': '2025-Q2', 'visits': 3380, 'avg_ticket': 580, 'injector_hours': 1520, 'room_utilization': 0.85}
        ]
        
        # TTM normalizations (per broker guidance)
        self.ttm_owner_addback = 180000      # Owner salary above market
        self.ttm_onetime_addback = 105000    # Q4-24 rebrand $60k + Q1-25 CRM $45k
        self.ttm_rent_normalization = -120000 # Rent to market adjustment ($120k to $150k/quarter)
        
        # Balance sheet data (as of Jun-30-2025)
        self.cash = 260000
        self.accounts_receivable = 230000
        self.inventory = 333000
        self.accounts_payable = 420000
        self.term_debt = 2050000
        self.finance_leases = 150000
        self.net_debt = 1940000
        
        # Service mix (TTM)
        self.service_mix = {
            'injectables': 0.60,
            'devices': 0.30,
            'memberships_facials': 0.07,
            'retail': 0.03
        }
        
        # LBO assumptions
        self.entry_debt_pct = 0.72   # 72% debt (standard for this size)
        self.debt_rate = 0.085       # 8.5% debt rate (better terms for larger deal)
        self.exit_multiple = 8.0     # Exit at 8.0x (market multiple)
        self.hold_period = 5
        self.revenue_cagr = 0.08     # 8% revenue growth (strong momentum)
        self.margin_improvement = 0.01  # 100bps over 5 years
        
        # EPV assumptions (per broker defaults)
        self.da_annual = 100000      # D&A assumption per guidance
        self.tax_rate = 0.26         # 26% tax rate
        self.reinvestment_rate = 0.10 # 10% of EBIT reinvestment
        self.wacc = 0.12             # 12% WACC
        
        # Working capital assumptions (per guidance)
        self.ar_days = 11            # 11 days sales
        self.inventory_days = 65     # 65 days COGS
        self.ap_days = 38            # 38 days COGS
        self.product_cogs_pct = 0.155 # 15.5% of revenue
        self.total_cogs_pct = 0.265   # ~26.5% total COGS (product + provider)
        self.maint_capex_pct = 0.02   # 2.0% of revenue

    def calculate_ttm_metrics(self):
        """Calculate TTM financial metrics"""
        ttm_revenue = sum(q['revenue'] for q in self.ttm_quarters)
        ttm_ebitda_reported = sum(q['ebitda_reported'] for q in self.ttm_quarters)
        
        # TTM adjusted EBITDA (per broker guidance)
        ttm_ebitda_adjusted = (ttm_ebitda_reported + 
                             self.ttm_owner_addback + 
                             self.ttm_onetime_addback + 
                             self.ttm_rent_normalization)
        
        ttm_margin = ttm_ebitda_adjusted / ttm_revenue
        
        # Validation checks
        expected_ttm_revenue = 7610000  # Per broker check
        expected_ttm_reported = 1520500  # Per broker check
        expected_ttm_adjusted = 1685500  # Per broker check
        
        print(f"TTM Revenue Check: {ttm_revenue:,.0f} vs Expected {expected_ttm_revenue:,.0f}")
        print(f"TTM Reported Check: {ttm_ebitda_reported:,.0f} vs Expected {expected_ttm_reported:,.0f}")
        print(f"TTM Adjusted Check: {ttm_ebitda_adjusted:,.0f} vs Expected {expected_ttm_adjusted:,.0f}")
        
        return {
            'ttm_revenue': ttm_revenue,
            'ttm_ebitda_reported': ttm_ebitda_reported,
            'ttm_ebitda_adjusted': ttm_ebitda_adjusted,
            'ttm_margin': ttm_margin
        }

    def create_ebitda_bridge(self, ttm_metrics):
        """Create EBITDA bridge showing normalizations"""
        bridge = {
            'reported_ebitda': ttm_metrics['ttm_ebitda_reported'],
            'owner_addback': self.ttm_owner_addback,
            'onetime_addback': self.ttm_onetime_addback,
            'rent_normalization': self.ttm_rent_normalization,
            'adjusted_ebitda': ttm_metrics['ttm_ebitda_adjusted']
        }
        return bridge

    def calculate_valuation_matrix(self, ttm_metrics):
        """Calculate valuation matrix with multiple EV/EBITDA multiples"""
        multiples = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0]
        adjusted_ebitda = ttm_metrics['ttm_ebitda_adjusted']
        revenue = ttm_metrics['ttm_revenue']
        
        matrix = []
        for multiple in multiples:
            enterprise_value = adjusted_ebitda * multiple
            equity_value_to_seller = enterprise_value - self.net_debt
            ev_revenue_ratio = enterprise_value / revenue
            
            matrix.append({
                'multiple': multiple,
                'enterprise_value': enterprise_value,
                'equity_value_to_seller': equity_value_to_seller,
                'ev_revenue_ratio': ev_revenue_ratio
            })
        
        return matrix

    def calculate_lbo_sources_uses(self, ttm_metrics, entry_multiple=8.5):
        """Calculate LBO sources & uses"""
        adjusted_ebitda = ttm_metrics['ttm_ebitda_adjusted']
        
        # Uses
        entry_ev = adjusted_ebitda * entry_multiple
        
        # Sources  
        new_debt = entry_ev * self.entry_debt_pct
        sponsor_equity = entry_ev - new_debt
        
        # Equity to seller (separate from sponsor equity)
        equity_to_seller = entry_ev - self.net_debt
        
        return {
            'entry_ev': entry_ev,
            'new_debt': new_debt,
            'sponsor_equity': sponsor_equity,
            'equity_to_seller': equity_to_seller,
            'debt_pct': self.entry_debt_pct * 100
        }

    def build_debt_schedule(self, ttm_metrics, sources_uses):
        """Build annual debt schedule with FCF and working capital"""
        base_revenue = ttm_metrics['ttm_revenue']
        base_ebitda = ttm_metrics['ttm_ebitda_adjusted']
        
        schedule = []
        debt_balance = sources_uses['new_debt']
        
        for year in range(1, self.hold_period + 1):
            # Revenue and EBITDA projections
            year_revenue = base_revenue * (1 + self.revenue_cagr) ** year
            year_ebitda_margin = (base_ebitda / base_revenue) + (self.margin_improvement * year / self.hold_period)
            year_ebitda = year_revenue * year_ebitda_margin
            year_ebit = year_ebitda - self.da_annual
            year_nopat = year_ebit * (1 - self.tax_rate)
            
            # Working capital calculations
            new_ar = year_revenue * (self.ar_days / 365)
            new_inventory = year_revenue * self.product_cogs_pct * (self.inventory_days / 365)
            new_ap = year_revenue * self.total_cogs_pct * (self.ap_days / 365)
            new_wc = new_ar + new_inventory - new_ap
            
            # Previous year WC
            if year == 1:
                prev_revenue = base_revenue
            else:
                prev_revenue = base_revenue * (1 + self.revenue_cagr) ** (year - 1)
            
            prev_ar = prev_revenue * (self.ar_days / 365)
            prev_inventory = prev_revenue * self.product_cogs_pct * (self.inventory_days / 365)
            prev_ap = prev_revenue * self.total_cogs_pct * (self.ap_days / 365)
            prev_wc = prev_ar + prev_inventory - prev_ap
            
            delta_wc = new_wc - prev_wc
            
            # Maintenance CapEx
            maint_capex = year_revenue * self.maint_capex_pct
            
            # Interest and debt service
            interest = debt_balance * self.debt_rate
            fcf_before_debt = year_nopat - maint_capex - delta_wc
            fcf_after_interest = fcf_before_debt - interest
            
            # Principal payment (80% cash sweep)
            principal_payment = max(0, fcf_after_interest * 0.80)
            debt_balance = max(0, debt_balance - principal_payment)
            
            schedule.append({
                'year': year,
                'revenue': year_revenue,
                'ebitda': year_ebitda,
                'ebit': year_ebit,
                'nopat': year_nopat,
                'maint_capex': maint_capex,
                'delta_wc': delta_wc,
                'interest': interest,
                'fcf_before_debt': fcf_before_debt,
                'fcf_after_interest': fcf_after_interest,
                'principal_payment': principal_payment,
                'debt_balance': debt_balance
            })
        
        return schedule

    def calculate_irr_analysis(self, debt_schedule, sources_uses):
        """Calculate IRR analysis with debt schedule"""
        if not debt_schedule:
            return {'irr': 0, 'moic': 0, 'exit_equity': 0}
        
        final_year = debt_schedule[-1]
        
        # Exit valuation
        exit_ev = final_year['ebitda'] * self.exit_multiple
        exit_equity = exit_ev - final_year['debt_balance']
        
        # IRR calculation
        sponsor_equity = sources_uses['sponsor_equity']
        moic = exit_equity / sponsor_equity if sponsor_equity > 0 else 0
        irr = (moic ** (1 / self.hold_period)) - 1 if sponsor_equity > 0 else 0
        
        return {
            'entry_equity': sponsor_equity,
            'year5_ebitda': final_year['ebitda'],
            'exit_ev': exit_ev,
            'exit_debt': final_year['debt_balance'],
            'exit_equity': exit_equity,
            'moic': moic,
            'irr': irr
        }

    def calculate_epv_analysis(self, ttm_metrics):
        """Calculate EPV as sanity check vs multiple-based valuation"""
        adjusted_ebitda = ttm_metrics['ttm_ebitda_adjusted']
        
        # EPV calculation (per broker defaults)
        ebit = adjusted_ebitda - self.da_annual
        nopat = ebit * (1 - self.tax_rate)
        reinvestment = ebit * self.reinvestment_rate
        fcf = nopat - reinvestment
        
        # EPV (perpetuity value)
        epv_enterprise = fcf / self.wacc
        epv_equity = epv_enterprise - self.net_debt
        
        # Compare to base case multiple
        base_case_ev = adjusted_ebitda * 8.5
        
        return {
            'ebit': ebit,
            'nopat': nopat,
            'reinvestment': reinvestment,
            'fcf': fcf,
            'epv_enterprise': epv_enterprise,
            'epv_equity': epv_equity,
            'epv_vs_multiple_ev': epv_enterprise / base_case_ev,
            'epv_implied_multiple': epv_enterprise / adjusted_ebitda
        }

    def create_epv_sensitivity(self, ttm_metrics):
        """Create 3x3 EPV sensitivity matrix (WACC vs Reinvestment Rate)"""
        wacc_range = [0.11, 0.12, 0.13]
        reinvest_range = [0.05, 0.10, 0.15]  # 5%, 10%, 15% of EBIT
        
        adjusted_ebitda = ttm_metrics['ttm_ebitda_adjusted']
        ebit = adjusted_ebitda - self.da_annual
        
        sensitivity_matrix = []
        
        for wacc in wacc_range:
            row = []
            for reinvest_rate in reinvest_range:
                nopat = ebit * (1 - self.tax_rate)
                reinvestment = ebit * reinvest_rate
                fcf = nopat - reinvestment
                epv_enterprise = fcf / wacc
                epv_equity = epv_enterprise - self.net_debt
                
                row.append({
                    'wacc': wacc,
                    'reinvest_rate': reinvest_rate,
                    'epv_enterprise': epv_enterprise,
                    'epv_equity': epv_equity
                })
            sensitivity_matrix.append(row)
        
        return sensitivity_matrix

    def run_comprehensive_simulation(self):
        """Run complete HarborGlow simulation"""
        print("=" * 80)
        print("HARBORGLOW AESTHETICS - COMPREHENSIVE VALUATION SIMULATION")
        print("Nashville, TN | Single-Site MedSpa")
        print("=" * 80)
        
        # 1. TTM Metrics
        print("\n1. TTM CALCULATIONS")
        print("📅 TTM WINDOW: 2024-Q3 → 2025-Q2")
        print("-" * 50)
        ttm_metrics = self.calculate_ttm_metrics()
        print(f"TTM Revenue: ${ttm_metrics['ttm_revenue']:,.0f}")
        print(f"TTM Reported EBITDA: ${ttm_metrics['ttm_ebitda_reported']:,.0f}")
        print(f"TTM Adjusted EBITDA: ${ttm_metrics['ttm_ebitda_adjusted']:,.0f}")
        print(f"Adjusted EBITDA Margin: {ttm_metrics['ttm_margin']:.1%}")
        
        # 2. EBITDA Bridge
        print("\n2. EBITDA BRIDGE")
        print("📅 TTM WINDOW: 2024-Q3 → 2025-Q2")
        print("-" * 50)
        bridge = self.create_ebitda_bridge(ttm_metrics)
        print(f"Reported EBITDA: ${bridge['reported_ebitda']:,.0f}")
        print(f"+ Owner Add-back: +${bridge['owner_addback']:,.0f}")
        print(f"+ One-time (Rebrand $60k + CRM $45k): +${bridge['onetime_addback']:,.0f}")
        print(f"- Rent Normalization: ${bridge['rent_normalization']:,.0f}")
        print(f"= Adjusted EBITDA: ${bridge['adjusted_ebitda']:,.0f}")
        
        # 3. Valuation Matrix
        print("\n3. VALUATION MATRIX")
        print("📅 TTM WINDOW: 2024-Q3 → 2025-Q2")
        print("-" * 50)
        matrix = self.calculate_valuation_matrix(ttm_metrics)
        print(f"{'Multiple':<10} {'Enterprise Value':<15} {'Equity Value':<15} {'EV/Revenue':<12}")
        print("-" * 60)
        for row in matrix:
            highlight = "🎯" if row['multiple'] == 8.5 else "  "
            print(f"{highlight}{row['multiple']}x{' ':<5} ${row['enterprise_value']:,.0f}{' ':<6} ${row['equity_value_to_seller']:,.0f}{' ':<6} {row['ev_revenue_ratio']:.1f}x")
        
        # 4. LBO SOURCES & USES (8.5x Entry)
        print("\n4. LBO SOURCES & USES (8.5x Entry)")
        print("💼 TRANSACTION STRUCTURE")
        print("-" * 50)
        sources_uses = self.calculate_lbo_sources_uses(ttm_metrics)
        print(f"Entry EV: ${sources_uses['entry_ev']:,.0f}")
        print(f"New Debt ({sources_uses['debt_pct']:.1f}% @ {self.debt_rate:.1%}): ${sources_uses['new_debt']:,.0f}")
        print(f"🏦 Sponsor Equity INVESTED: ${sources_uses['sponsor_equity']:,.0f}")
        print(f"💰 Equity to SELLER: ${sources_uses['equity_to_seller']:,.0f}")
        print(f"    (= EV - Old Net Debt of ${self.net_debt:,.0f})")
        
        # 5. Debt Schedule
        print("\n5. DEBT SCHEDULE & FCF")
        print(f"📊 DEBT TERMS: {self.debt_rate:.1%} Interest Rate | 80% Cash Sweep")
        print("-" * 80)
        debt_schedule = self.build_debt_schedule(ttm_metrics, sources_uses)
        print(f"{'Year':<6} {'Revenue':<12} {'EBITDA':<12} {'Interest':<10} {'CapEx':<10} {'ΔWC':<10} {'Debt Balance':<12}")
        print("-" * 80)
        for year_data in debt_schedule:
            print(f"{year_data['year']:<6} ${year_data['revenue']:,.0f}{' ':<3} ${year_data['ebitda']:,.0f}{' ':<3} "
                  f"${year_data['interest']:,.0f}{' ':<2} ${year_data['maint_capex']:,.0f}{' ':<2} "
                  f"${year_data['delta_wc']:,.0f}{' ':<2} ${year_data['debt_balance']:,.0f}")
        
        # 6. IRR Analysis
        print("\n6. IRR ANALYSIS")
        print(f"🎯 EXIT ASSUMPTIONS: {self.exit_multiple:.1f}× Multiple | 5-Year Hold")
        print("-" * 60)
        irr_results = self.calculate_irr_analysis(debt_schedule, sources_uses)
        
        # Calculate EBITDA CAGR
        base_ebitda = ttm_metrics['ttm_ebitda_adjusted']
        final_ebitda = irr_results['year5_ebitda']
        ebitda_cagr = (final_ebitda / base_ebitda) ** (1/5) - 1
        
        print(f"🏦 Sponsor Equity INVESTED: ${irr_results['entry_equity']:,.0f}")
        print(f"📈 EBITDA Growth: ${base_ebitda:,.0f} → ${final_ebitda:,.0f} ({ebitda_cagr:.1%} CAGR)")
        print(f"Exit EV ({self.exit_multiple:.1f}×): ${irr_results['exit_ev']:,.0f}")
        print(f"Exit Debt: ${irr_results['exit_debt']:,.0f}")
        print(f"💰 Exit Equity to SPONSOR: ${irr_results['exit_equity']:,.0f}")
        print(f"MOIC: {irr_results['moic']:.1f}x")
        print(f"IRR: {irr_results['irr']:.1%}")
        
        # 7. EPV Analysis
        print("\n7. EPV ANALYSIS & ASSUMPTIONS")
        print("🔬 CONSERVATIVE VALUATION FLOOR (Earnings Power Value)")
        print("-" * 60)
        epv_results = self.calculate_epv_analysis(ttm_metrics)
        print(f"EBIT (Adj. EBITDA - D&A): ${epv_results['ebit']:,.0f}")
        print(f"Tax Rate: {self.tax_rate:.1%}")
        print(f"Reinvestment ({self.reinvestment_rate:.1%} of EBIT): ${epv_results['reinvestment']:,.0f}")
        print(f"WACC: {self.wacc:.1%}")
        print(f"Free Cash Flow: ${epv_results['fcf']:,.0f}")
        print(f"💎 EPV Enterprise: ${epv_results['epv_enterprise']:,.0f}")
        print(f"💎 EPV Equity: ${epv_results['epv_equity']:,.0f}")
        print(f"EPV vs Market Multiple: {epv_results['epv_vs_multiple_ev']:.1f}x (conservative floor)")
        print(f"EPV Implied Multiple: {epv_results['epv_implied_multiple']:.1f}x")
        
        # 8. EPV Sensitivity
        print("\n8. EPV SENSITIVITY MATRIX (Enterprise Value)")
        sensitivity = self.create_epv_sensitivity(ttm_metrics)
        print("WACC →   11.0%      12.0%      13.0%")
        print("Reinvest ↓")
        for i, wacc_val in enumerate([0.11, 0.12, 0.13]):
            reinvest_labels = ["5.0%", "10.0%", "15.0%"]
            for j, reinvest_val in enumerate([0.05, 0.10, 0.15]):
                epv_val = sensitivity[j][i]['epv_enterprise']
                if j == 0:
                    print(f"{reinvest_labels[j]}    ${epv_val:,.0f}", end="")
                else:
                    print(f"  ${epv_val:,.0f}", end="")
            print()
        
        print("\n" + "=" * 80)
        print("🎉 HARBORGLOW SIMULATION COMPLETE")
        print("=" * 80)
        
        # Return comprehensive results
        return {
            'ttm_metrics': ttm_metrics,
            'ebitda_bridge': bridge,
            'valuation_matrix': matrix,
            'sources_uses': sources_uses,
            'debt_schedule': debt_schedule,
            'irr_analysis': irr_results,
            'epv_analysis': epv_results,
            'epv_sensitivity': sensitivity,
            'operating_kpis': self.operating_kpis,
            'service_mix': self.service_mix,
            'simulation_timestamp': datetime.now().isoformat()
        }

    def generate_executive_summary(self, results):
        """Generate executive summary for HarborGlow"""
        ttm = results['ttm_metrics']
        base_case = next(row for row in results['valuation_matrix'] if row['multiple'] == 8.5)
        irr = results['irr_analysis']
        epv = results['epv_analysis']
        
        summary = f"""
HARBORGLOW AESTHETICS - EXECUTIVE SUMMARY
========================================

TARGET: HarborGlow Aesthetics, LLC
LOCATION: Nashville, TN (Single-Site)
ANALYSIS DATE: {results['simulation_timestamp'][:10]}

BUSINESS PROFILE:
• 6 treatment rooms; 2 injectors (MD + PA), 1 laser tech, 2 estheticians  
• Service Mix: Injectables 60%, Devices 30%, Memberships 7%, Retail 3%
• 100% cash-pay model (no insurance dependency)
• Recent PA addition (Q3-24) & rebrand/CRM migration (Q4-24/Q1-25)

TTM FINANCIALS (Q3-2024 → Q2-2025):
• Revenue: ${ttm['ttm_revenue']:,.0f}
• Reported EBITDA: ${ttm['ttm_ebitda_reported']:,.0f}
• Adjusted EBITDA: ${ttm['ttm_ebitda_adjusted']:,.0f} ({ttm['ttm_margin']:.1%} margin)

VALUATION SUMMARY:
• Base Case (8.5x): EV ${base_case['enterprise_value']:,.0f} | Equity ${base_case['equity_value_to_seller']:,.0f}
• Valuation Range: ${results['valuation_matrix'][0]['equity_value_to_seller']:,.0f} - ${results['valuation_matrix'][-1]['equity_value_to_seller']:,.0f}

LBO ANALYSIS (5-Year Hold):
• Sponsor Equity: ${irr['entry_equity']:,.0f}
• IRR: {irr['irr']:.1%} | MOIC: {irr['moic']:.1f}x
• Exit Strategy: 8.0x multiple (market rate)

EPV SANITY CHECK:
• EPV Enterprise: ${epv['epv_enterprise']:,.0f}
• EPV vs Market: {epv['epv_vs_multiple_ev']:.1f}x (conservative floor)

KEY STRENGTHS:
✓ Strong operational momentum (room utilization: 73% → 85%)
✓ Nashville market positioning with growth potential
✓ Proven scaling capability with PA addition
✓ Technology investments positioning for efficiency

INVESTMENT HIGHLIGHTS:
✓ Visit growth acceleration: 2,910 → 3,380 visits (Q3-24 to Q2-25)
✓ Average ticket expansion: $565 → $580
✓ Strong margin profile post-normalization (22.2%)
✓ Operational leverage on expanding capacity utilization

Generated: {datetime.now().strftime("%B %d, %Y")}
        """
        return summary

def main():
    """Run HarborGlow simulation and generate reports"""
    validator = HarborGlowValidator()
    results = validator.run_comprehensive_simulation()
    
    # Save detailed results
    with open('harborglow_aesthetic_simulation_results.json', 'w') as f:
        # Convert numpy types for JSON serialization
        def convert_types(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, dict):
                return {k: convert_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_types(item) for item in obj]
            return obj
        
        json.dump(convert_types(results), f, indent=2)
    
    # Generate executive summary
    summary = validator.generate_executive_summary(results)
    print(summary)
    
    with open('harborglow_aesthetic_executive_summary.txt', 'w') as f:
        f.write(summary)
    
    print(f"\n📄 Detailed results saved to: harborglow_aesthetic_simulation_results.json")
    print(f"📄 Executive summary saved to: harborglow_aesthetic_executive_summary.txt")

if __name__ == "__main__":
    main() 