#!/usr/bin/env python3
"""
VistaBelle Aesthetics Simulation
Denver, CO MedSpa Case Study
TTM Window: 2024-Q3 → 2025-Q2
"""

import json
from datetime import datetime

class VistaBelleSimulation:
    def __init__(self):
        # Basic case information
        self.company_name = "VistaBelle Aesthetics, LLC"
        self.location = "Denver, CO"
        self.ttm_window = "2024-Q3 → 2025-Q2"
        
        # TTM Financial Data (from quarterly detail)
        self.ttm_revenue = 6000000  # Q3-24 + Q4-24 + Q1-25 + Q2-25
        self.ttm_ebitda_reported = 1048000  # Sum of TTM quarters
        
        # Normalization adjustments
        self.owner_addback = 130000
        self.onetime_addback = 70000  # Legal $20k + Rebrand $50k
        self.rent_normalization = -60000  # Below market rent adjustment
        
        # Calculate adjusted EBITDA
        self.ttm_ebitda_adjusted = (self.ttm_ebitda_reported + 
                                   self.owner_addback + 
                                   self.onetime_addback + 
                                   self.rent_normalization)
        
        # Balance sheet
        self.net_debt = 1170000
        
        # Working capital policy (days)
        self.ar_days = 11
        self.inventory_days = 60
        self.ap_days = 38
        
        # Operating assumptions
        self.maintenance_capex_pct = 0.018  # 1.8% of revenue
        self.da_annual = 90000
        self.tax_rate = 0.26
        self.reinvestment_rate = 0.08  # 8% of EBIT
        self.wacc = 0.12
        
        # LBO assumptions
        self.debt_pct = 0.75  # 75% debt
        self.debt_rate = 0.085  # 8.5% debt rate
        self.exit_multiple = 8.0  # Exit at 8.0x
        
        # Growth assumptions
        self.revenue_growth = 0.07  # 7% annual revenue growth
        self.ebitda_margin_improvement = 0.005  # 50 bps annual improvement
        
    def calculate_ttm_metrics(self):
        """Calculate TTM metrics and margin"""
        ttm_margin = self.ttm_ebitda_adjusted / self.ttm_revenue
        
        return {
            "ttm_revenue": self.ttm_revenue,
            "ttm_ebitda_reported": self.ttm_ebitda_reported,
            "ttm_ebitda_adjusted": self.ttm_ebitda_adjusted,
            "ttm_margin": ttm_margin
        }
    
    def calculate_ebitda_bridge(self):
        """Generate EBITDA bridge components"""
        return {
            "reported_ebitda": self.ttm_ebitda_reported,
            "owner_addback": self.owner_addback,
            "onetime_addback": self.onetime_addback,
            "rent_normalization": self.rent_normalization,
            "adjusted_ebitda": self.ttm_ebitda_adjusted
        }
    
    def calculate_valuation_matrix(self):
        """Generate valuation matrix across multiple ranges"""
        multiples = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5]
        matrix = []
        
        for multiple in multiples:
            enterprise_value = self.ttm_ebitda_adjusted * multiple
            equity_value_to_seller = enterprise_value - self.net_debt
            ev_revenue_ratio = enterprise_value / self.ttm_revenue
            
            matrix.append({
                "multiple": multiple,
                "enterprise_value": enterprise_value,
                "equity_value_to_seller": equity_value_to_seller,
                "ev_revenue_ratio": ev_revenue_ratio
            })
        
        return matrix
    
    def calculate_sources_uses(self):
        """Calculate LBO sources and uses"""
        entry_ev = self.ttm_ebitda_adjusted * 8.5 # Assuming base multiple is 8.5
        new_debt = entry_ev * self.debt_pct
        sponsor_equity = entry_ev - new_debt
        equity_to_seller = entry_ev - self.net_debt
        
        return {
            "entry_ev": entry_ev,
            "new_debt": new_debt,
            "sponsor_equity": sponsor_equity,
            "equity_to_seller": equity_to_seller,
            "debt_pct": self.debt_pct * 100
        }
    
    def calculate_debt_schedule(self, sources_uses):
        """Generate 5-year debt schedule with cash sweep"""
        years = []
        opening_debt = sources_uses["new_debt"]
        
        for year in range(1, 6):
            # Project revenue and EBITDA
            revenue = self.ttm_revenue * (1 + self.revenue_growth) ** year
            ebitda_margin = (self.ttm_ebitda_adjusted / self.ttm_revenue + 
                           self.ebitda_margin_improvement * year)
            ebitda = revenue * ebitda_margin
            
            # Calculate EBIT and taxes
            ebit = ebitda - self.da_annual
            taxes = ebit * self.tax_rate
            nopat = ebit - taxes
            
            # Working capital calculation
            product_cogs = revenue * 0.15  # 15% from case data
            total_cogs = revenue * 0.265   # Product + Provider COGS
            
            ar_balance = (revenue / 365) * self.ar_days
            inventory_balance = (product_cogs / 365) * self.inventory_days
            ap_balance = (total_cogs / 365) * self.ap_days
            net_working_capital = ar_balance + inventory_balance - ap_balance
            
            # Change in working capital (simplified)
            if year == 1:
                prev_nwc = (self.ttm_revenue / 365) * self.ar_days + \
                          (self.ttm_revenue * 0.15 / 365) * self.inventory_days - \
                          (self.ttm_revenue * 0.265 / 365) * self.ap_days
            else:
                prev_revenue = self.ttm_revenue * (1 + self.revenue_growth) ** (year - 1)
                prev_nwc = (prev_revenue / 365) * self.ar_days + \
                          (prev_revenue * 0.15 / 365) * self.inventory_days - \
                          (prev_revenue * 0.265 / 365) * self.ap_days
            
            delta_wc = net_working_capital - prev_nwc
            
            # Maintenance CapEx
            maint_capex = revenue * self.maintenance_capex_pct
            
            # Free cash flow calculation
            fcf_before_interest = nopat - delta_wc - maint_capex
            
            # Interest calculation (average balance)
            if year == 1:
                avg_debt = (sources_uses["new_debt"] + opening_debt) / 2
            else:
                avg_debt = (years[year-2]["debt_balance"] + opening_debt) / 2
            
            interest_expense = avg_debt * self.debt_rate
            fcf_after_interest = fcf_before_interest - interest_expense
            
            # Principal payment (cash sweep - assume 80% of FCF after interest)
            cash_sweep_pct = 0.80
            principal_payment = max(0, min(opening_debt, fcf_after_interest * cash_sweep_pct))
            closing_debt = opening_debt - principal_payment
            
            year_data = {
                "year": year,
                "revenue": revenue,
                "ebitda": ebitda,
                "ebit": ebit,
                "nopat": nopat,
                "delta_wc": delta_wc,
                "maint_capex": maint_capex,
                "fcf_before_interest": fcf_before_interest,
                "interest_expense": interest_expense,
                "fcf_after_interest": fcf_after_interest,
                "principal_payment": principal_payment,
                "debt_balance": closing_debt
            }
            
            years.append(year_data)
            opening_debt = closing_debt
        
        return years
    
    def calculate_irr_analysis(self, sources_uses, debt_schedule):
        """Calculate IRR and exit metrics"""
        year5 = debt_schedule[-1]
        year5_ebitda = year5["ebitda"]
        
        # Exit calculations
        exit_ev = year5_ebitda * self.exit_multiple
        exit_debt = year5["debt_balance"]
        exit_equity = exit_ev - exit_debt
        
        # Cash flows to equity (simplified)
        initial_equity = -sources_uses["sponsor_equity"]
        
        # Assume no interim distributions, just exit
        cash_flows = [initial_equity, 0, 0, 0, 0, exit_equity]
        
        # Calculate IRR using custom function
        irr = self._calculate_irr(cash_flows)
        
        # Calculate MOIC
        moic = exit_equity / sources_uses["sponsor_equity"]
        
        return {
            "year5_ebitda": year5_ebitda,
            "exit_ev": exit_ev,
            "exit_debt": exit_debt,
            "exit_equity": exit_equity,
            "irr": irr,
            "moic": moic,
            "exit_multiple": self.exit_multiple
        }
    
    def _calculate_irr(self, cash_flows, guess=0.1):
        """Simple IRR calculation using Newton-Raphson method"""
        for _ in range(100):  # max iterations
            npv = sum(cf / (1 + guess) ** i for i, cf in enumerate(cash_flows))
            dnpv = sum(-i * cf / (1 + guess) ** (i + 1) for i, cf in enumerate(cash_flows))
            
            if abs(dnpv) < 1e-10:
                break
                
            new_guess = guess - npv / dnpv
            
            if abs(new_guess - guess) < 1e-10:
                break
                
            guess = new_guess
        
        return guess
    
    def calculate_epv_analysis(self):
        """Calculate Earnings Power Value"""
        ebit = self.ttm_ebitda_adjusted - self.da_annual
        nopat = ebit * (1 - self.tax_rate)
        reinvestment = ebit * self.reinvestment_rate
        fcf = nopat - reinvestment
        
        epv_enterprise = fcf / self.wacc
        epv_equity = epv_enterprise - self.net_debt
        epv_implied_multiple = epv_enterprise / self.ttm_ebitda_adjusted
        
        return {
            "ebit": ebit,
            "nopat": nopat,
            "reinvestment": reinvestment,
            "fcf": fcf,
            "epv_enterprise": epv_enterprise,
            "epv_equity": epv_equity,
            "epv_implied_multiple": epv_implied_multiple,
            "tax_rate": self.tax_rate,
            "wacc": self.wacc,
            "reinvestment_rate": self.reinvestment_rate
        }
    
    def calculate_epv_sensitivity(self):
        """Generate 3x3 EPV sensitivity matrix"""
        wacc_scenarios = [0.11, 0.12, 0.13]
        reinvest_scenarios = [0.05, 0.08, 0.15]
        
        sensitivity = []
        ebit = self.ttm_ebitda_adjusted - self.da_annual
        
        for wacc in wacc_scenarios:
            wacc_row = []
            for reinvest_rate in reinvest_scenarios:
                nopat = ebit * (1 - self.tax_rate)
                reinvestment = ebit * reinvest_rate
                fcf = nopat - reinvestment
                epv_enterprise = fcf / wacc
                epv_equity = epv_enterprise - self.net_debt
                
                wacc_row.append({
                    "wacc": wacc,
                    "reinvestment_rate": reinvest_rate,
                    "epv_enterprise": epv_enterprise,
                    "epv_equity": epv_equity
                })
            
            sensitivity.append(wacc_row)
        
        return sensitivity
    
    def run_full_simulation(self):
        """Execute complete simulation and return results"""
        print(f"🏥 {self.company_name}")
        print(f"📍 {self.location}")
        print(f"📅 TTM Window: {self.ttm_window}")
        print("=" * 60)
        
        # 1. TTM Metrics
        ttm_metrics = self.calculate_ttm_metrics()
        print(f"\n💰 TTM Financial Metrics:")
        print(f"TTM Revenue: ${ttm_metrics['ttm_revenue']:,.0f}")
        print(f"TTM EBITDA (Reported): ${ttm_metrics['ttm_ebitda_reported']:,.0f}")
        print(f"TTM EBITDA (Adjusted): ${ttm_metrics['ttm_ebitda_adjusted']:,.0f}")
        print(f"EBITDA Margin: {ttm_metrics['ttm_margin']:.1%}")
        
        # 2. EBITDA Bridge
        bridge = self.calculate_ebitda_bridge()
        print(f"\n🌉 EBITDA Bridge:")
        print(f"Reported EBITDA: ${bridge['reported_ebitda']:,.0f}")
        print(f"+ Owner Add-back: ${bridge['owner_addback']:,.0f}")
        print(f"+ One-time Items: ${bridge['onetime_addback']:,.0f}")
        print(f"- Rent Normalization: ${abs(bridge['rent_normalization']):,.0f}")
        print(f"= Adjusted EBITDA: ${bridge['adjusted_ebitda']:,.0f}")
        
        # 3. Valuation Matrix
        valuation_matrix = self.calculate_valuation_matrix()
        print(f"\n📊 Valuation Matrix:")
        for row in valuation_matrix:
            print(f"{row['multiple']:.1f}×: EV ${row['enterprise_value']:,.0f} | "
                  f"Equity to Seller ${row['equity_value_to_seller']:,.0f}")
        
        # 4. Sources & Uses
        sources_uses = self.calculate_sources_uses()
        print(f"\n💼 LBO Sources & Uses (8.5× Entry):")
        print(f"Entry EV: ${sources_uses['entry_ev']:,.0f}")
        print(f"New Debt ({sources_uses['debt_pct']:.0f}%): ${sources_uses['new_debt']:,.0f}")
        print(f"🏦 Sponsor Equity INVESTED: ${sources_uses['sponsor_equity']:,.0f}")
        print(f"💰 Equity to SELLER: ${sources_uses['equity_to_seller']:,.0f}")
        
        # 5. Debt Schedule
        debt_schedule = self.calculate_debt_schedule(sources_uses)
        print(f"\n📈 5-Year Debt Schedule:")
        for year_data in debt_schedule:
            print(f"Year {year_data['year']}: Revenue ${year_data['revenue']:,.0f} | "
                  f"EBITDA ${year_data['ebitda']:,.0f} | "
                  f"Debt ${year_data['debt_balance']:,.0f}")
        
        # 6. IRR Analysis
        irr_analysis = self.calculate_irr_analysis(sources_uses, debt_schedule)
        print(f"\n🎯 Exit & Returns Analysis:")
        print(f"Year 5 EBITDA: ${irr_analysis['year5_ebitda']:,.0f}")
        print(f"Exit Multiple: {irr_analysis['exit_multiple']:.1f}×")
        print(f"Exit EV: ${irr_analysis['exit_ev']:,.0f}")
        print(f"Exit Debt: ${irr_analysis['exit_debt']:,.0f}")
        print(f"Exit Equity: ${irr_analysis['exit_equity']:,.0f}")
        print(f"MOIC: {irr_analysis['moic']:.1f}×")
        print(f"IRR: {irr_analysis['irr']:.1%}")
        
        # 7. EPV Analysis
        epv_analysis = self.calculate_epv_analysis()
        print(f"\n⚡ EPV Analysis:")
        print(f"EBIT: ${epv_analysis['ebit']:,.0f}")
        print(f"NOPAT: ${epv_analysis['nopat']:,.0f}")
        print(f"Reinvestment: ${epv_analysis['reinvestment']:,.0f}")
        print(f"FCF: ${epv_analysis['fcf']:,.0f}")
        print(f"EPV Enterprise: ${epv_analysis['epv_enterprise']:,.0f}")
        print(f"EPV Equity: ${epv_analysis['epv_equity']:,.0f}")
        print(f"EPV Implied Multiple: {epv_analysis['epv_implied_multiple']:.1f}×")
        
        # 8. EPV Sensitivity
        epv_sensitivity = self.calculate_epv_sensitivity()
        print(f"\n🔍 EPV Sensitivity Matrix:")
        print("WACC\\Reinvest   5.0%      8.0%     15.0%")
        for i, wacc_row in enumerate(epv_sensitivity):
            wacc_val = [0.11, 0.12, 0.13][i]
            row_str = f"    {wacc_val:.0%}     "
            for scenario in wacc_row:
                row_str += f"${scenario['epv_enterprise']/1e6:.1f}M   "
            print(row_str)
        
        # Compile results for JSON export
        results = {
            "company_info": {
                "name": self.company_name,
                "location": self.location,
                "ttm_window": self.ttm_window
            },
            "ttm_metrics": ttm_metrics,
            "ebitda_bridge": bridge,
            "valuation_matrix": valuation_matrix,
            "sources_uses": sources_uses,
            "debt_schedule": debt_schedule,
            "irr_analysis": irr_analysis,
            "epv_analysis": epv_analysis,
            "epv_sensitivity": epv_sensitivity,
            "assumptions": {
                "net_debt": self.net_debt,
                "ar_days": self.ar_days,
                "inventory_days": self.inventory_days,
                "ap_days": self.ap_days,
                "maintenance_capex_pct": self.maintenance_capex_pct,
                "da_annual": self.da_annual,
                "tax_rate": self.tax_rate,
                "reinvestment_rate": self.reinvestment_rate,
                "wacc": self.wacc,
                "debt_pct": self.debt_pct,
                "debt_rate": self.debt_rate,
                "exit_multiple": self.exit_multiple,
                "revenue_growth": self.revenue_growth
            }
        }
        
        return results

def main():
    print("🎯 VistaBelle Aesthetics Simulation")
    print("Denver, CO MedSpa Analysis")
    print("=" * 50)
    
    # Initialize and run simulation
    simulation = VistaBelleSimulation()
    results = simulation.run_full_simulation()
    
    # Export results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_filename = f"vistabelle_aesthetics_results_{timestamp}.json"
    
    with open(json_filename, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📁 Results exported to: {json_filename}")
    print("\n🎉 VistaBelle Simulation Complete!")
    
    return results

if __name__ == "__main__":
    main() 