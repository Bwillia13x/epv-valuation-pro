#!/usr/bin/env python3
"""
Comprehensive LBO/EPV Simulation Runner (Simplified)
Executes 200+ parameter combinations across all case files
Uses only standard library modules
"""

import json
import csv
import os
import sys
import time
import math
import random
from datetime import datetime
from pathlib import Path
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed

# Set fixed RNG seed for reproducibility
random.seed(42)

class LBOSimulationRunner:
    def __init__(self, batch_dir):
        self.batch_dir = Path(batch_dir)
        self.results = []
        self.failures = []
        self.cases_dir = Path("../../../cases")
        
        # Parameter grids
        self.entry_multiples = [7.0, 7.5, 8.0, 8.5, 9.0]
        self.exit_multiples = [7.0, 7.5, 8.0, 8.5, 9.0]
        self.debt_pcts = [65, 70, 72.5, 75]
        self.interest_rates = [7.5, 8.5, 9.5, 10.5]
        self.cash_sweeps = [50, 75, 100]
        self.capex_pcts = [1.5, 1.8, 2.0, 2.5]
        self.wc_scenarios = {
            'base': (11, 65, 40),
            'tight': (9, 55, 45),
            'loose': (14, 80, 35)
        }
        self.hold_period = 5
        
        # EPV parameters
        self.wacc_values = [0.11, 0.12, 0.13]
        self.tax_rates = [0.24, 0.26, 0.28]
        self.reinvestment_rates = [0.05, 0.08, 0.10, 0.12, 0.15]
        
        # Edge case parameters
        self.edge_addbacks = ['none', 'double', 'halve']
        self.edge_rent_norm = [1.0, 2.0]
        self.edge_wc_shock = [False, True]
        self.edge_growth_stress = [0.0, 0.04, 0.12]
        self.edge_high_leverage = [(77.5, 10.5), (77.5, 12.0), (80.0, 10.5), (80.0, 12.0)]
        self.edge_low_leverage = [(60.0, 7.5), (60.0, 8.0), (65.0, 7.5), (65.0, 8.0)]

    def load_case(self, case_file):
        """Load case JSON file"""
        with open(self.cases_dir / case_file, 'r') as f:
            return json.load(f)

    def calculate_working_capital(self, revenue, ar_days, inventory_days, ap_days):
        """Calculate working capital components"""
        ar_balance = (revenue / 365) * ar_days
        inventory_balance = (revenue / 365) * inventory_days
        ap_balance = (revenue / 365) * ap_days
        return ar_balance, inventory_balance, ap_balance

    def calculate_delta_wc(self, revenue_prev, revenue_curr, ar_days, inventory_days, ap_days):
        """Calculate working capital delta"""
        ar_prev, inv_prev, ap_prev = self.calculate_working_capital(revenue_prev, ar_days, inventory_days, ap_days)
        ar_curr, inv_curr, ap_curr = self.calculate_working_capital(revenue_curr, ar_days, inventory_days, ap_days)
        
        delta_ar = ar_curr - ar_prev
        delta_inv = inv_curr - inv_prev
        delta_ap = ap_curr - ap_prev
        
        return delta_ar + delta_inv - delta_ap

    def run_lbo_simulation(self, case_data, params):
        """Run single LBO simulation with given parameters"""
        try:
            # Extract base case data
            ttm_ebitda_adj = case_data['ttm_metrics']['ttm_ebitda_adjusted']
            ttm_revenue = case_data['ttm_metrics']['ttm_revenue']
            net_debt = case_data.get('assumptions', {}).get('net_debt', 0)
            revenue_growth = case_data.get('assumptions', {}).get('revenue_growth', 0.07)
            
            # Apply parameter mutations
            entry_multiple = params['entry_multiple']
            exit_multiple = params['exit_multiple']
            debt_pct = params['debt_pct'] / 100
            interest_rate = params['interest_rate'] / 100
            cash_sweep_pct = params['cash_sweep_pct'] / 100
            capex_pct = params['capex_pct'] / 100
            ar_days, inventory_days, ap_days = params['wc_days']
            
            # Apply edge case modifications
            if params.get('edge_addbacks') == 'none':
                ttm_ebitda_adj = case_data['ebitda_bridge']['reported_ebitda']
            elif params.get('edge_addbacks') == 'double':
                ttm_ebitda_adj += case_data['ebitda_bridge']['onetime_addback']
            elif params.get('edge_addbacks') == 'halve':
                ttm_ebitda_adj -= case_data['ebitda_bridge']['onetime_addback'] / 2
            
            if params.get('edge_rent_norm', 1.0) != 1.0:
                rent_adj = case_data['ebitda_bridge']['rent_normalization'] * (params['edge_rent_norm'] - 1.0)
                ttm_ebitda_adj += rent_adj
            
            if params.get('edge_wc_shock', False):
                ar_days += 10
                inventory_days += 15
            
            if 'edge_growth_stress' in params:
                revenue_growth = params['edge_growth_stress']
            
            # Calculate entry metrics
            entry_ev = ttm_ebitda_adj * entry_multiple
            equity_to_seller = entry_ev - net_debt
            new_debt = entry_ev * debt_pct
            sponsor_equity = entry_ev - new_debt
            
            # Validate entry calculations
            if abs(entry_ev - ttm_ebitda_adj * entry_multiple) > entry_ev * 0.005:
                raise ValueError("Entry EV calculation mismatch")
            
            # Project 5-year debt schedule
            debt_balance = new_debt
            revenue = ttm_revenue
            
            for year in range(1, self.hold_period + 1):
                # Revenue growth
                revenue *= (1 + revenue_growth)
                
                # EBITDA projection (assuming margin stays constant)
                ebitda_margin = ttm_ebitda_adj / ttm_revenue
                ebitda = revenue * ebitda_margin
                
                # EBIT (assuming D&A stays constant)
                da_annual = case_data.get('assumptions', {}).get('da_annual', 90000)
                ebit = ebitda - da_annual
                
                # NOPAT
                tax_rate = case_data.get('assumptions', {}).get('tax_rate', 0.26)
                nopat = ebit * (1 - tax_rate)
                
                # Working capital delta
                revenue_prev = revenue / (1 + revenue_growth) if year > 1 else ttm_revenue
                delta_wc = self.calculate_delta_wc(revenue_prev, revenue, ar_days, inventory_days, ap_days)
                
                # Maintenance CapEx
                maint_capex = revenue * capex_pct
                
                # FCF before interest
                fcf_before_interest = nopat + da_annual - delta_wc - maint_capex
                
                # Interest expense
                interest_expense = debt_balance * interest_rate
                
                # FCF after interest
                fcf_after_interest = fcf_before_interest - interest_expense
                
                # Principal payment (cash sweep)
                principal_payment = fcf_after_interest * cash_sweep_pct
                principal_payment = min(principal_payment, debt_balance)  # Can't pay more than debt
                
                # Update debt balance
                debt_balance -= principal_payment
                
                # Coverage ratio check
                coverage = ebitda / interest_expense if interest_expense > 0 else float('inf')
                if coverage < 1.0:
                    raise ValueError(f"Insufficient coverage in year {year}: {coverage:.2f}")
            
            # Exit calculations
            exit_ebitda = ebitda  # Year 5 EBITDA
            exit_ev = exit_ebitda * exit_multiple
            exit_equity = exit_ev - debt_balance
            
            # IRR calculation
            irr = self.calculate_irr(-sponsor_equity, exit_equity, self.hold_period)
            moic = exit_equity / sponsor_equity if sponsor_equity > 0 else 0
            
            # Validation checks
            if abs(exit_equity - (exit_ev - debt_balance)) > exit_ev * 0.005:
                raise ValueError("Exit equity calculation mismatch")
            
            return {
                'success': True,
                'entry_ev': entry_ev,
                'equity_to_seller': equity_to_seller,
                'sponsor_equity': sponsor_equity,
                'exit_ev': exit_ev,
                'exit_equity': exit_equity,
                'debt_y5': debt_balance,
                'irr': irr,
                'moic': moic,
                'coverage_y1': ebitda / (new_debt * interest_rate) if new_debt * interest_rate > 0 else float('inf')
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }

    def calculate_epv(self, case_data, params):
        """Calculate EPV with given parameters"""
        try:
            # Base EPV calculation
            ebit = case_data['ttm_metrics']['ttm_ebitda_adjusted'] - case_data.get('assumptions', {}).get('da_annual', 90000)
            tax_rate = params['epv_tax_rate']
            wacc = params['epv_wacc']
            reinvestment_rate = params['epv_reinvestment_rate']
            
            nopat = ebit * (1 - tax_rate)
            reinvestment = ebit * reinvestment_rate
            fcf = nopat - reinvestment
            
            # EPV calculation
            epv_enterprise = fcf / wacc
            net_debt = case_data.get('assumptions', {}).get('net_debt', 0)
            epv_equity = epv_enterprise - net_debt
            
            return {
                'success': True,
                'epv_enterprise': epv_enterprise,
                'epv_equity': epv_equity
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc()
            }

    def calculate_irr(self, initial_investment, final_value, years):
        """Calculate IRR using Newton-Raphson method"""
        if initial_investment >= 0 or final_value <= 0:
            return 0.0
        
        def npv(rate):
            return initial_investment + final_value / ((1 + rate) ** years)
        
        def npv_derivative(rate):
            return -final_value * years / ((1 + rate) ** (years + 1))
        
        # Newton-Raphson iteration
        rate = 0.1  # Initial guess
        for _ in range(100):
            npv_val = npv(rate)
            if abs(npv_val) < 1e-6:
                break
            derivative = npv_derivative(rate)
            if abs(derivative) < 1e-10:
                break
            rate = rate - npv_val / derivative
        
        return max(rate, -0.99)  # Cap at -99%

    def generate_parameter_sets(self):
        """Generate all parameter combinations"""
        parameter_sets = []
        
        # Load case files
        case_files = [f for f in os.listdir(self.cases_dir) if f.endswith('.json')]
        
        for case_file in case_files:
            case_data = self.load_case(case_file)
            case_name = case_file.replace('.json', '')
            
            # A) Baseline Grid
            for entry_mult in self.entry_multiples:
                for exit_mult in self.exit_multiples:
                    for debt_pct in self.debt_pcts:
                        for rate in self.interest_rates:
                            for sweep in self.cash_sweeps:
                                for capex in self.capex_pcts:
                                    for wc_name, wc_days in self.wc_scenarios.items():
                                        params = {
                                            'case_name': case_name,
                                            'case_file': case_file,
                                            'run_type': 'baseline',
                                            'entry_multiple': entry_mult,
                                            'exit_multiple': exit_mult,
                                            'debt_pct': debt_pct,
                                            'interest_rate': rate,
                                            'cash_sweep_pct': sweep,
                                            'capex_pct': capex,
                                            'wc_days': wc_days,
                                            'wc_scenario': wc_name
                                        }
                                        parameter_sets.append(params)
            
            # B) EPV Parameter Grid
            for wacc in self.wacc_values:
                for tax_rate in self.tax_rates:
                    for reinvest_rate in self.reinvestment_rates:
                        params = {
                            'case_name': case_name,
                            'case_file': case_file,
                            'run_type': 'epv',
                            'epv_wacc': wacc,
                            'epv_tax_rate': tax_rate,
                            'epv_reinvestment_rate': reinvest_rate
                        }
                        parameter_sets.append(params)
            
            # C) Edge Cases
            # Add-backs stress
            for addback_type in self.edge_addbacks:
                params = {
                    'case_name': case_name,
                    'case_file': case_file,
                    'run_type': 'edge_addbacks',
                    'edge_addbacks': addback_type,
                    'entry_multiple': 8.0,  # Base case
                    'exit_multiple': 8.0,
                    'debt_pct': 75,
                    'interest_rate': 8.5,
                    'cash_sweep_pct': 75,
                    'capex_pct': 1.8,
                    'wc_days': self.wc_scenarios['base']
                }
                parameter_sets.append(params)
            
            # Rent normalization stress
            for rent_mult in self.edge_rent_norm:
                params = {
                    'case_name': case_name,
                    'case_file': case_file,
                    'run_type': 'edge_rent_norm',
                    'edge_rent_norm': rent_mult,
                    'entry_multiple': 8.0,
                    'exit_multiple': 8.0,
                    'debt_pct': 75,
                    'interest_rate': 8.5,
                    'cash_sweep_pct': 75,
                    'capex_pct': 1.8,
                    'wc_days': self.wc_scenarios['base']
                }
                parameter_sets.append(params)
            
            # WC shock
            params = {
                'case_name': case_name,
                'case_file': case_file,
                'run_type': 'edge_wc_shock',
                'edge_wc_shock': True,
                'entry_multiple': 8.0,
                'exit_multiple': 8.0,
                'debt_pct': 75,
                'interest_rate': 8.5,
                'cash_sweep_pct': 75,
                'capex_pct': 1.8,
                'wc_days': self.wc_scenarios['base']
            }
            parameter_sets.append(params)
            
            # Growth stress
            for growth_rate in self.edge_growth_stress:
                params = {
                    'case_name': case_name,
                    'case_file': case_file,
                    'run_type': 'edge_growth_stress',
                    'edge_growth_stress': growth_rate,
                    'entry_multiple': 8.0,
                    'exit_multiple': 8.0,
                    'debt_pct': 75,
                    'interest_rate': 8.5,
                    'cash_sweep_pct': 75,
                    'capex_pct': 1.8,
                    'wc_days': self.wc_scenarios['base']
                }
                parameter_sets.append(params)
            
            # High leverage
            for debt_pct, rate in self.edge_high_leverage:
                params = {
                    'case_name': case_name,
                    'case_file': case_file,
                    'run_type': 'edge_high_leverage',
                    'entry_multiple': 8.0,
                    'exit_multiple': 8.0,
                    'debt_pct': debt_pct,
                    'interest_rate': rate,
                    'cash_sweep_pct': 75,
                    'capex_pct': 1.8,
                    'wc_days': self.wc_scenarios['base']
                }
                parameter_sets.append(params)
            
            # Low leverage
            for debt_pct, rate in self.edge_low_leverage:
                params = {
                    'case_name': case_name,
                    'case_file': case_file,
                    'run_type': 'edge_low_leverage',
                    'entry_multiple': 8.0,
                    'exit_multiple': 8.0,
                    'debt_pct': debt_pct,
                    'interest_rate': rate,
                    'cash_sweep_pct': 75,
                    'capex_pct': 1.8,
                    'wc_days': self.wc_scenarios['base']
                }
                parameter_sets.append(params)
        
        return parameter_sets

    def run_single_simulation(self, params):
        """Run a single simulation with timeout"""
        try:
            case_data = self.load_case(params['case_file'])
            
            if params['run_type'] == 'epv':
                result = self.calculate_epv(case_data, params)
            else:
                result = self.run_lbo_simulation(case_data, params)
            
            # Combine params and results
            run_result = {**params, **result}
            run_result['timestamp'] = datetime.now().isoformat()
            
            return run_result
            
        except Exception as e:
            return {
                **params,
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc(),
                'timestamp': datetime.now().isoformat()
            }

    def run_all_simulations(self):
        """Run all simulations with parallel processing"""
        parameter_sets = self.generate_parameter_sets()
        print(f"Generated {len(parameter_sets)} parameter sets")
        
        results = []
        failures = []
        
        # Run simulations with parallel processing
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_params = {executor.submit(self.run_single_simulation, params): params 
                              for params in parameter_sets}
            
            for i, future in enumerate(as_completed(future_to_params)):
                try:
                    result = future.result(timeout=60)  # 60 second timeout
                    if result.get('success', False):
                        results.append(result)
                    else:
                        failures.append(result)
                    
                    if (i + 1) % 50 == 0:
                        print(f"Completed {i + 1}/{len(parameter_sets)} simulations")
                        
                except Exception as e:
                    params = future_to_params[future]
                    failure_result = {
                        **params,
                        'success': False,
                        'error': f"Timeout or execution error: {str(e)}",
                        'timestamp': datetime.now().isoformat()
                    }
                    failures.append(failure_result)
        
        self.results = results
        self.failures = failures
        
        print(f"Completed {len(results)} successful runs, {len(failures)} failures")
        return results, failures

    def save_results(self):
        """Save all results to files"""
        # Save CSV results
        if self.results:
            # Get all unique field names
            all_fields = set()
            for result in self.results:
                all_fields.update(result.keys())
            
            fieldnames = sorted(list(all_fields))
            
            with open(self.batch_dir / 'results.csv', 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for result in self.results:
                    # Fill missing fields with None
                    row = {field: result.get(field, None) for field in fieldnames}
                    writer.writerow(row)
        
        # Save failures log
        if self.failures:
            with open(self.batch_dir / 'failures.log', 'w') as f:
                for failure in self.failures:
                    f.write(f"=== FAILURE ===\n")
                    f.write(f"Case: {failure.get('case_name', 'Unknown')}\n")
                    f.write(f"Run Type: {failure.get('run_type', 'Unknown')}\n")
                    f.write(f"Error: {failure.get('error', 'Unknown error')}\n")
                    f.write(f"Timestamp: {failure.get('timestamp', 'Unknown')}\n")
                    f.write(f"Parameters: {json.dumps(failure, indent=2)}\n")
                    f.write(f"Traceback: {failure.get('traceback', 'No traceback')}\n")
                    f.write(f"\n")
        
        # Generate summary
        self.generate_summary()
        
        # Generate simple visualizations
        self.generate_simple_visualizations()

    def calculate_statistics(self, data, key):
        """Calculate basic statistics for a list of values"""
        if not data or key not in data[0]:
            return None
        
        values = [item[key] for item in data if key in item and item[key] is not None]
        if not values:
            return None
        
        values.sort()
        n = len(values)
        mean = sum(values) / n
        median = values[n//2] if n % 2 == 1 else (values[n//2-1] + values[n//2]) / 2
        
        # Calculate standard deviation
        variance = sum((x - mean) ** 2 for x in values) / n
        std = math.sqrt(variance)
        
        return {
            'count': n,
            'mean': mean,
            'median': median,
            'std': std,
            'min': values[0],
            'max': values[-1],
            'p25': values[n//4] if n >= 4 else values[0],
            'p75': values[3*n//4] if n >= 4 else values[-1]
        }

    def generate_summary(self):
        """Generate summary report"""
        if not self.results:
            return
        
        # Calculate statistics
        pass_rate = len(self.results) / (len(self.results) + len(self.failures)) * 100
        
        irr_stats = self.calculate_statistics(self.results, 'irr')
        moic_stats = self.calculate_statistics(self.results, 'moic')
        
        # IRR thresholds
        irr_values = [r['irr'] for r in self.results if 'irr' in r and r['irr'] is not None]
        irr_20_pct = sum(1 for irr in irr_values if irr >= 0.20) / len(irr_values) * 100 if irr_values else 0
        irr_25_pct = sum(1 for irr in irr_values if irr >= 0.25) / len(irr_values) * 100 if irr_values else 0
        irr_30_pct = sum(1 for irr in irr_values if irr >= 0.30) / len(irr_values) * 100 if irr_values else 0
        
        # Top/bottom runs
        lbo_results = [r for r in self.results if r.get('run_type') != 'epv' and 'irr' in r and r['irr'] is not None]
        if lbo_results:
            lbo_results.sort(key=lambda x: x['irr'], reverse=True)
            top_runs = lbo_results[:10]
            bottom_runs = lbo_results[-10:]
        else:
            top_runs = []
            bottom_runs = []
        
        # Generate summary markdown
        summary = f"""# Simulation Batch Results Summary

## Overview
- **Total Runs**: {len(self.results) + len(self.failures)}
- **Successful Runs**: {len(self.results)}
- **Failed Runs**: {len(self.failures)}
- **Pass Rate**: {pass_rate:.1f}%

## IRR Statistics
"""
        if irr_stats:
            summary += f"""
- **Mean IRR**: {irr_stats['mean']:.1%}
- **Median IRR**: {irr_stats['median']:.1%}
- **Std Dev IRR**: {irr_stats['std']:.1%}
- **Min IRR**: {irr_stats['min']:.1%}
- **Max IRR**: {irr_stats['max']:.1%}

## IRR Thresholds
- **≥20% IRR**: {irr_20_pct:.1f}% of runs
- **≥25% IRR**: {irr_25_pct:.1f}% of runs  
- **≥30% IRR**: {irr_30_pct:.1f}% of runs
"""

        if moic_stats:
            summary += f"""
## MoIC Statistics
- **Mean MoIC**: {moic_stats['mean']:.2f}x
- **Median MoIC**: {moic_stats['median']:.2f}x
- **Min MoIC**: {moic_stats['min']:.2f}x
- **Max MoIC**: {moic_stats['max']:.2f}x
"""

        if top_runs:
            summary += f"""
## Top 10 Best Runs
| Case | Run Type | IRR | MoIC | Entry Mult | Exit Mult | Debt % | Rate % |
|------|----------|-----|------|------------|-----------|--------|--------|
"""
            for run in top_runs:
                summary += f"| {run.get('case_name', 'N/A')} | {run.get('run_type', 'N/A')} | {run.get('irr', 0):.1%} | {run.get('moic', 0):.2f}x | {run.get('entry_multiple', 'N/A')} | {run.get('exit_multiple', 'N/A')} | {run.get('debt_pct', 'N/A')} | {run.get('interest_rate', 'N/A')} |\n"

        if bottom_runs:
            summary += f"""
## Bottom 10 Worst Runs
| Case | Run Type | IRR | MoIC | Entry Mult | Exit Mult | Debt % | Rate % |
|------|----------|-----|------|------------|-----------|--------|--------|
"""
            for run in bottom_runs:
                summary += f"| {run.get('case_name', 'N/A')} | {run.get('run_type', 'N/A')} | {run.get('irr', 0):.1%} | {run.get('moic', 0):.2f}x | {run.get('entry_multiple', 'N/A')} | {run.get('exit_multiple', 'N/A')} | {run.get('debt_pct', 'N/A')} | {run.get('interest_rate', 'N/A')} |\n"

        # Parameter sensitivity analysis
        summary += self.generate_parameter_sensitivity()
        
        with open(self.batch_dir / 'summary.md', 'w') as f:
            f.write(summary)

    def generate_parameter_sensitivity(self):
        """Generate parameter sensitivity analysis"""
        if not self.results:
            return ""
        
        sensitivity = "\n## Parameter Sensitivity Analysis\n\n"
        
        # Group by parameter and calculate average IRR
        lbo_results = [r for r in self.results if r.get('run_type') != 'epv' and 'irr' in r and r['irr'] is not None]
        
        if not lbo_results:
            return sensitivity
        
        # Entry multiple sensitivity
        entry_groups = {}
        for result in lbo_results:
            if 'entry_multiple' in result:
                entry_mult = result['entry_multiple']
                if entry_mult not in entry_groups:
                    entry_groups[entry_mult] = []
                entry_groups[entry_mult].append(result['irr'])
        
        if entry_groups:
            sensitivity += "### Entry Multiple Impact\n"
            sensitivity += "| Multiple | Avg IRR | Count |\n"
            sensitivity += "|----------|---------|-------|\n"
            for mult in sorted(entry_groups.keys()):
                avg_irr = sum(entry_groups[mult]) / len(entry_groups[mult])
                sensitivity += f"| {mult} | {avg_irr:.1%} | {len(entry_groups[mult])} |\n"
            sensitivity += "\n"
        
        # Exit multiple sensitivity
        exit_groups = {}
        for result in lbo_results:
            if 'exit_multiple' in result:
                exit_mult = result['exit_multiple']
                if exit_mult not in exit_groups:
                    exit_groups[exit_mult] = []
                exit_groups[exit_mult].append(result['irr'])
        
        if exit_groups:
            sensitivity += "### Exit Multiple Impact\n"
            sensitivity += "| Multiple | Avg IRR | Count |\n"
            sensitivity += "|----------|---------|-------|\n"
            for mult in sorted(exit_groups.keys()):
                avg_irr = sum(exit_groups[mult]) / len(exit_groups[mult])
                sensitivity += f"| {mult} | {avg_irr:.1%} | {len(exit_groups[mult])} |\n"
            sensitivity += "\n"
        
        # Debt percentage sensitivity
        debt_groups = {}
        for result in lbo_results:
            if 'debt_pct' in result:
                debt_pct = result['debt_pct']
                if debt_pct not in debt_groups:
                    debt_groups[debt_pct] = []
                debt_groups[debt_pct].append(result['irr'])
        
        if debt_groups:
            sensitivity += "### Debt Percentage Impact\n"
            sensitivity += "| Debt % | Avg IRR | Count |\n"
            sensitivity += "|--------|---------|-------|\n"
            for debt in sorted(debt_groups.keys()):
                avg_irr = sum(debt_groups[debt]) / len(debt_groups[debt])
                sensitivity += f"| {debt} | {avg_irr:.1%} | {len(debt_groups[debt])} |\n"
            sensitivity += "\n"
        
        return sensitivity

    def generate_simple_visualizations(self):
        """Generate simple text-based visualizations"""
        if not self.results:
            return
        
        # Create fig directory
        fig_dir = self.batch_dir / 'fig'
        fig_dir.mkdir(exist_ok=True)
        
        # Generate simple histogram data
        lbo_results = [r for r in self.results if r.get('run_type') != 'epv' and 'irr' in r and r['irr'] is not None]
        
        if lbo_results:
            # IRR distribution by case
            case_groups = {}
            for result in lbo_results:
                case = result.get('case_name', 'Unknown')
                if case not in case_groups:
                    case_groups[case] = []
                case_groups[case].append(result['irr'])
            
            # Create simple histogram
            with open(fig_dir / 'irr_distribution.txt', 'w') as f:
                f.write("IRR Distribution by Case\n")
                f.write("=" * 50 + "\n\n")
                
                for case, irrs in case_groups.items():
                    f.write(f"Case: {case}\n")
                    f.write(f"Count: {len(irrs)}\n")
                    f.write(f"Mean IRR: {sum(irrs)/len(irrs):.1%}\n")
                    f.write(f"Min IRR: {min(irrs):.1%}\n")
                    f.write(f"Max IRR: {max(irrs):.1%}\n")
                    f.write("-" * 30 + "\n\n")
            
            # Create parameter impact summary
            with open(fig_dir / 'parameter_impact.txt', 'w') as f:
                f.write("Parameter Impact Analysis\n")
                f.write("=" * 30 + "\n\n")
                
                # Entry multiple impact
                entry_impact = {}
                for result in lbo_results:
                    if 'entry_multiple' in result:
                        mult = result['entry_multiple']
                        if mult not in entry_impact:
                            entry_impact[mult] = []
                        entry_impact[mult].append(result['irr'])
                
                f.write("Entry Multiple Impact:\n")
                for mult in sorted(entry_impact.keys()):
                    avg_irr = sum(entry_impact[mult]) / len(entry_impact[mult])
                    f.write(f"  {mult}x: {avg_irr:.1%} avg IRR\n")
                f.write("\n")
                
                # Exit multiple impact
                exit_impact = {}
                for result in lbo_results:
                    if 'exit_multiple' in result:
                        mult = result['exit_multiple']
                        if mult not in exit_impact:
                            exit_impact[mult] = []
                        exit_impact[mult].append(result['irr'])
                
                f.write("Exit Multiple Impact:\n")
                for mult in sorted(exit_impact.keys()):
                    avg_irr = sum(exit_impact[mult]) / len(exit_impact[mult])
                    f.write(f"  {mult}x: {avg_irr:.1%} avg IRR\n")

    def create_dashboard(self):
        """Create simple HTML dashboard"""
        dashboard_html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Simulation Batch Results Dashboard</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .header {{ background: #f0f0f0; padding: 20px; border-radius: 5px; }}
        .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }}
        .stat-card {{ background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .links {{ margin: 20px 0; }}
        .links a {{ display: inline-block; margin: 10px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }}
        .links a:hover {{ background: #0056b3; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Simulation Batch Results Dashboard</h1>
        <p>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <h3>Total Runs</h3>
            <p>{len(self.results) + len(self.failures)}</p>
        </div>
        <div class="stat-card">
            <h3>Successful Runs</h3>
            <p>{len(self.results)}</p>
        </div>
        <div class="stat-card">
            <h3>Failed Runs</h3>
            <p>{len(self.failures)}</p>
        </div>
        <div class="stat-card">
            <h3>Pass Rate</h3>
            <p>{(len(self.results) / (len(self.results) + len(self.failures)) * 100):.1f}%</p>
        </div>
    </div>
    
    <div class="links">
        <a href="summary.md">Summary Report</a>
        <a href="results.csv">Results CSV</a>
        <a href="failures.log">Failures Log</a>
        <a href="fig/">Visualizations</a>
    </div>
</body>
</html>"""
        
        with open(self.batch_dir / 'index.html', 'w') as f:
            f.write(dashboard_html)

def main():
    """Main execution function"""
    batch_dir = Path("..")
    
    print("Starting comprehensive LBO/EPV simulation batch...")
    print(f"Batch directory: {batch_dir}")
    
    runner = LBOSimulationRunner(batch_dir)
    
    # Run all simulations
    start_time = time.time()
    results, failures = runner.run_all_simulations()
    end_time = time.time()
    
    print(f"Simulation completed in {end_time - start_time:.2f} seconds")
    
    # Save results
    runner.save_results()
    runner.create_dashboard()
    
    print(f"Results saved to: {batch_dir}")
    print(f"Successful runs: {len(results)}")
    print(f"Failed runs: {len(failures)}")
    
    # Print key statistics
    if results:
        irr_values = [r['irr'] for r in results if 'irr' in r and r['irr'] is not None]
        moic_values = [r['moic'] for r in results if 'moic' in r and r['moic'] is not None]
        
        if irr_values:
            print(f"Median IRR: {sorted(irr_values)[len(irr_values)//2]:.1%}")
            print(f"IRR ≥ 20%: {sum(1 for irr in irr_values if irr >= 0.20) / len(irr_values) * 100:.1f}%")
            print(f"IRR ≥ 25%: {sum(1 for irr in irr_values if irr >= 0.25) / len(irr_values) * 100:.1f}%")
            print(f"IRR ≥ 30%: {sum(1 for irr in irr_values if irr >= 0.30) / len(irr_values) * 100:.1f}%")
        
        if moic_values:
            print(f"Median MoIC: {sorted(moic_values)[len(moic_values)//2]:.2f}x")

if __name__ == "__main__":
    main()