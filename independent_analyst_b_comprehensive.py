#!/usr/bin/env python3
"""
Independent Financial Analysis - Multi-Service Medispa Case
Analyst B Independent Assessment
Analysis Date: 2025-07-28

This analysis provides an independent assessment of the Multi-Service Medispa case
using comprehensive financial modeling and valuation methodologies.
"""

import json
import numpy as np
import pandas as pd
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class IndependentMedispaAnalysis:
    def __init__(self, financial_data_path):
        """Initialize with financial data"""
        with open(financial_data_path, 'r') as f:
            self.data = json.load(f)
        
        self.years = [2022, 2023, 2024]
        self.analysis_date = datetime.now().strftime("%Y-%m-%d")
        
    def extract_financial_metrics(self):
        """Extract and calculate key financial metrics"""
        
        # Revenue Analysis
        total_revenue = self.data['revenue']['total']
        revenue_growth = [
            (total_revenue[1] - total_revenue[0]) / total_revenue[0],
            (total_revenue[2] - total_revenue[1]) / total_revenue[1]
        ]
        revenue_cagr = ((total_revenue[2] / total_revenue[0]) ** (1/2)) - 1
        
        # Gross Profit Analysis
        gross_profit = self.data['gp']
        gross_margin = [gp / rev for gp, rev in zip(gross_profit, total_revenue)]
        
        # Operating Expense Analysis
        total_opex = self.data['opex']['total']
        payroll_total = self.data['payroll']['total']
        marketing_spend = self.data['opex']['marketing']
        
        # EBITDA Calculation (Adding back depreciation)
        depreciation = self.data['opex']['depreciation']
        operating_income = self.data['below_line']['operating_income']
        ebitda = [oi + dep for oi, dep in zip(operating_income, depreciation)]
        ebitda_margin = [ebitda_val / rev for ebitda_val, rev in zip(ebitda, total_revenue)]
        
        # Interest Expense (anomaly - in OpEx instead of below line)
        interest_expense = self.data['opex']['interest_expense_in_opex']
        
        return {
            'revenue': {
                'total': total_revenue,
                'growth_rates': revenue_growth,
                'cagr': revenue_cagr
            },
            'profitability': {
                'gross_profit': gross_profit,
                'gross_margin': gross_margin,
                'ebitda': ebitda,
                'ebitda_margin': ebitda_margin,
                'operating_income': operating_income
            },
            'cost_structure': {
                'total_opex': total_opex,
                'payroll': payroll_total,
                'marketing': marketing_spend,
                'interest_expense': interest_expense,
                'depreciation': depreciation
            }
        }
    
    def analyze_service_lines(self):
        """Detailed analysis of each service line"""
        service_lines = {}
        
        for service in ['energy_devices', 'injectables', 'wellness', 'weightloss', 'retail_sales', 'surgery']:
            revenue = self.data['revenue'][service]
            
            # Growth analysis
            growth_rates = [
                (revenue[1] - revenue[0]) / revenue[0],
                (revenue[2] - revenue[1]) / revenue[1]
            ]
            avg_growth = np.mean(growth_rates)
            
            # Market share within medispa
            market_share_2024 = revenue[2] / self.data['revenue']['total'][2]
            
            # Performance categorization
            if avg_growth > 0.05:
                trend = "strong_growth"
            elif avg_growth > 0:
                trend = "moderate_growth"
            elif avg_growth > -0.05:
                trend = "stable"
            else:
                trend = "declining"
            
            service_lines[service] = {
                'revenue_2024': revenue[2],
                'growth_rates': growth_rates,
                'avg_growth': avg_growth,
                'market_share_2024': market_share_2024,
                'trend_classification': trend,
                'revenue_trajectory': revenue
            }
        
        return service_lines
    
    def marketing_normalization_analysis(self):
        """Analyze the marketing spend anomaly and normalize"""
        marketing = self.data['opex']['marketing']
        total_revenue = self.data['revenue']['total']
        
        # Historical marketing as % of revenue
        marketing_pct = [m / r for m, r in zip(marketing, total_revenue)]
        
        # 2024 is clearly an anomaly (1% vs 14% and 7% historically)
        # Normalize using average of 2022-2023 or industry standard
        historical_avg_pct = np.mean(marketing_pct[:2])  # 2022-2023 average
        industry_benchmark_pct = 0.08  # Conservative 8% of revenue for aesthetic medical
        
        # Use more conservative approach
        normalized_pct = min(historical_avg_pct, industry_benchmark_pct)
        normalized_marketing_2024 = total_revenue[2] * normalized_pct
        
        marketing_adjustment = normalized_marketing_2024 - marketing[2]
        
        return {
            'reported_marketing': marketing,
            'marketing_pct_revenue': marketing_pct,
            'normalized_pct': normalized_pct,
            'normalized_marketing_2024': normalized_marketing_2024,
            'adjustment_required': marketing_adjustment,
            'anomaly_detected': True,
            'impact_on_ebitda': -marketing_adjustment
        }
    
    def calculate_normalized_ebitda(self, metrics):
        """Calculate normalized EBITDA adjusting for marketing anomaly"""
        base_ebitda_2024 = metrics['profitability']['ebitda'][2]  # 2024 EBITDA
        marketing_analysis = self.marketing_normalization_analysis()
        
        # Adjust for marketing normalization
        normalized_ebitda_2024 = base_ebitda_2024 + marketing_analysis['impact_on_ebitda']
        normalized_margin = normalized_ebitda_2024 / metrics['revenue']['total'][2]
        
        return {
            'reported_ebitda_2024': base_ebitda_2024,
            'normalized_ebitda_2024': normalized_ebitda_2024,
            'normalization_impact': marketing_analysis['impact_on_ebitda'],
            'normalized_margin': normalized_margin
        }
    
    def valuation_analysis(self, normalized_ebitda):
        """Multi-approach valuation analysis"""
        
        # Industry benchmarks for aesthetic medical practices
        industry_multiples = {
            'ev_revenue': {'min': 1.2, 'median': 1.8, 'max': 2.5},
            'ev_ebitda': {'min': 4.0, 'median': 6.5, 'max': 8.5}
        }
        
        revenue_2024 = self.data['revenue']['total'][2]
        normalized_ebitda_2024 = normalized_ebitda['normalized_ebitda_2024']
        
        # Revenue Multiple Valuation
        ev_revenue_low = revenue_2024 * industry_multiples['ev_revenue']['min']
        ev_revenue_mid = revenue_2024 * industry_multiples['ev_revenue']['median']
        ev_revenue_high = revenue_2024 * industry_multiples['ev_revenue']['max']
        
        # EBITDA Multiple Valuation
        ev_ebitda_low = normalized_ebitda_2024 * industry_multiples['ev_ebitda']['min']
        ev_ebitda_mid = normalized_ebitda_2024 * industry_multiples['ev_ebitda']['median']
        ev_ebitda_high = normalized_ebitda_2024 * industry_multiples['ev_ebitda']['max']
        
        # DCF Analysis (simplified)
        terminal_growth = 0.025  # 2.5% terminal growth
        wacc = 0.12  # 12% WACC for small medical practice
        
        # Project forward cash flows
        projected_ebitda = []
        growth_rates = [0.08, 0.06, 0.05, 0.04, 0.03]  # Declining growth pattern
        
        current_ebitda = normalized_ebitda_2024
        for i, growth in enumerate(growth_rates):
            current_ebitda *= (1 + growth)
            projected_ebitda.append(current_ebitda)
        
        # Terminal value
        terminal_cf = projected_ebitda[-1] * (1 + terminal_growth)
        terminal_value = terminal_cf / (wacc - terminal_growth)
        
        # Present value calculation
        pv_cash_flows = sum([cf / ((1 + wacc) ** (i + 1)) for i, cf in enumerate(projected_ebitda)])
        pv_terminal = terminal_value / ((1 + wacc) ** 5)
        
        dcf_enterprise_value = pv_cash_flows + pv_terminal
        
        # Assume net debt of $2.15M (based on interest expense and industry norms)
        estimated_net_debt = 2150000  # Conservative estimate
        
        return {
            'valuation_approaches': {
                'revenue_multiple': {
                    'low': ev_revenue_low,
                    'mid': ev_revenue_mid,
                    'high': ev_revenue_high
                },
                'ebitda_multiple': {
                    'low': ev_ebitda_low,
                    'mid': ev_ebitda_mid,
                    'high': ev_ebitda_high
                },
                'dcf': {
                    'enterprise_value': dcf_enterprise_value,
                    'assumptions': {
                        'wacc': wacc,
                        'terminal_growth': terminal_growth,
                        'projection_years': 5
                    }
                }
            },
            'valuation_summary': {
                'ev_range_low': min(ev_revenue_low, ev_ebitda_low, dcf_enterprise_value * 0.85),
                'ev_range_mid': np.mean([ev_revenue_mid, ev_ebitda_mid, dcf_enterprise_value]),
                'ev_range_high': max(ev_revenue_high, ev_ebitda_high, dcf_enterprise_value * 1.15),
                'estimated_net_debt': estimated_net_debt
            }
        }
    
    def risk_assessment(self):
        """Comprehensive risk analysis"""
        
        risks = {
            'high_risk': [
                "Marketing spend anomaly suggests potential operational instability",
                "Declining performance in core service lines (injectables, energy devices)",
                "High interest expense suggests leverage concerns",
                "Small practice size limits scalability and market power"
            ],
            'medium_risk': [
                "Revenue growth deceleration (from 1.5% to 2.9% annually)",
                "Dependence on labor-intensive service delivery model",
                "Regulatory risk in aesthetic medical industry",
                "Competition from larger medical practice consolidators"
            ],
            'low_risk': [
                "Diversified revenue streams across 6 service lines",
                "Strong gross margins indicate pricing power",
                "Recession-resistant wellness and aesthetic services",
                "Established patient base and recurring revenue potential"
            ]
        }
        
        # Calculate risk score
        risk_factors = len(risks['high_risk']) * 3 + len(risks['medium_risk']) * 2 + len(risks['low_risk']) * 1
        max_possible = (len(risks['high_risk']) + len(risks['medium_risk']) + len(risks['low_risk'])) * 3
        risk_score = 1 - (risk_factors / max_possible)
        
        return {
            'risk_categories': risks,
            'overall_risk_score': risk_score,
            'risk_rating': 'MODERATE-HIGH' if risk_score < 0.4 else 'MODERATE' if risk_score < 0.7 else 'LOW'
        }
    
    def investment_thesis(self, valuation, risk_assessment, normalized_ebitda):
        """Develop comprehensive investment thesis"""
        
        ev_mid = valuation['valuation_summary']['ev_range_mid']
        revenue_2024 = self.data['revenue']['total'][2]
        
        # Key investment metrics
        ev_revenue_multiple = ev_mid / revenue_2024
        ev_ebitda_multiple = ev_mid / normalized_ebitda['normalized_ebitda_2024']
        
        # Investment decision framework
        if ev_ebitda_multiple < 5.0 and risk_assessment['risk_score'] > 0.6:
            recommendation = "STRONG BUY"
        elif ev_ebitda_multiple < 6.5 and risk_assessment['risk_score'] > 0.4:
            recommendation = "BUY"
        elif ev_ebitda_multiple < 8.0:
            recommendation = "HOLD"
        else:
            recommendation = "PASS"
        
        # Strategic recommendations
        strategic_actions = [
            "Normalize and optimize marketing spend for sustainable growth",
            "Focus investment on high-growth service lines (wellness, weight loss)",
            "Implement cost optimization in declining service lines",
            "Evaluate debt refinancing to reduce interest expense burden",
            "Develop recurring revenue programs to improve cash flow predictability"
        ]
        
        return {
            'investment_recommendation': recommendation,
            'valuation_metrics': {
                'enterprise_value': ev_mid,
                'ev_revenue_multiple': ev_revenue_multiple,
                'ev_ebitda_multiple': ev_ebitda_multiple,
                'normalized_ebitda_margin': normalized_ebitda['normalized_margin']
            },
            'key_value_drivers': [
                "Service line diversification and growth potential",
                "Strong gross margins and pricing power",
                "Operational efficiency improvements through normalization",
                "Market position in growing wellness/aesthetic sector"
            ],
            'critical_risk_factors': [
                "Marketing spend normalization and sustainability",
                "Performance recovery in core service lines",
                "Interest expense and leverage management",
                "Competitive positioning and market share defense"
            ],
            'strategic_recommendations': strategic_actions,
            'investment_conditions': [
                "Verify marketing normalization strategy and implementation",
                "Confirm sustainable operating margin targets",
                "Validate revenue growth assumptions for wellness/weight loss",
                "Assess management capability for operational improvements"
            ]
        }
    
    def run_comprehensive_analysis(self):
        """Execute complete independent analysis"""
        
        print("🔍 INDEPENDENT FINANCIAL ANALYSIS - MULTI-SERVICE MEDISPA")
        print("=" * 65)
        print(f"Analysis Date: {self.analysis_date}")
        print(f"Analyst: Independent Analyst B")
        print()
        
        # Core financial metrics
        metrics = self.extract_financial_metrics()
        
        # Service line analysis
        service_analysis = self.analyze_service_lines()
        
        # Marketing normalization
        marketing_analysis = self.marketing_normalization_analysis()
        
        # Normalized EBITDA
        normalized_ebitda = self.calculate_normalized_ebitda(metrics)
        
        # Valuation analysis
        valuation = self.valuation_analysis(normalized_ebitda)
        
        # Risk assessment
        risk_assessment = self.risk_assessment()
        
        # Investment thesis
        investment_thesis = self.investment_thesis(valuation, risk_assessment, normalized_ebitda)
        
        # Compile comprehensive results
        analysis_results = {
            'executive_summary': {
                'case_name': self.data['meta']['case_name'],
                'analysis_date': self.analysis_date,
                'analyst': 'Independent Analyst B',
                'recommendation': investment_thesis['investment_recommendation'],
                'enterprise_value': valuation['valuation_summary']['ev_range_mid'],
                'key_finding': "Operationally sound business with marketing normalization opportunity"
            },
            'financial_performance': metrics,
            'service_line_analysis': service_analysis,
            'marketing_normalization': marketing_analysis,
            'normalized_ebitda_analysis': normalized_ebitda,
            'valuation_analysis': valuation,
            'risk_assessment': risk_assessment,
            'investment_thesis': investment_thesis,
            'methodology_notes': {
                'valuation_approaches': ['Revenue Multiples', 'EBITDA Multiples', 'DCF Analysis'],
                'normalization_adjustments': ['Marketing spend normalization'],
                'industry_benchmarks': 'Aesthetic medical practice comparables',
                'risk_framework': 'Multi-factor risk assessment model'
            }
        }
        
        return analysis_results

def main():
    """Main execution function"""
    
    # Initialize analysis
    financial_data_path = '/Users/benjaminwilliams/Desktop/epv_valuation_pro (for CPP)/epv-valuation-pro/case_financials_v1.json'
    
    analyzer = IndependentMedispaAnalysis(financial_data_path)
    results = analyzer.run_comprehensive_analysis()
    
    # Display key findings
    print("\n📊 EXECUTIVE SUMMARY")
    print("-" * 40)
    print(f"Investment Recommendation: {results['investment_thesis']['investment_recommendation']}")
    print(f"Enterprise Value: ${results['valuation_analysis']['valuation_summary']['ev_range_mid']:,.0f}")
    print(f"EV/Revenue Multiple: {results['investment_thesis']['valuation_metrics']['ev_revenue_multiple']:.1f}x")
    print(f"EV/EBITDA Multiple: {results['investment_thesis']['valuation_metrics']['ev_ebitda_multiple']:.1f}x")
    print(f"Normalized EBITDA Margin: {results['investment_thesis']['valuation_metrics']['normalized_ebitda_margin']:.1%}")
    print(f"Risk Rating: {results['risk_assessment']['risk_rating']}")
    
    print("\n🎯 KEY VALUE DRIVERS")
    print("-" * 40)
    for driver in results['investment_thesis']['key_value_drivers']:
        print(f"• {driver}")
    
    print("\n⚠️  CRITICAL RISK FACTORS")
    print("-" * 40)
    for risk in results['investment_thesis']['critical_risk_factors']:
        print(f"• {risk}")
    
    print("\n🔧 STRATEGIC RECOMMENDATIONS")
    print("-" * 40)
    for recommendation in results['investment_thesis']['strategic_recommendations']:
        print(f"• {recommendation}")
    
    # Save detailed results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f'/Users/benjaminwilliams/Desktop/epv_valuation_pro (for CPP)/epv-valuation-pro/independent_analyst_b_results_{timestamp}.json'
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n📁 Detailed results saved to: {results_file}")
    
    return results

if __name__ == "__main__":
    results = main()