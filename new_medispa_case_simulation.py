#!/usr/bin/env python3
"""
New Medispa Case Simulation - Summit Model Analysis
Comprehensive valuation analysis based on 2022-2024 financial data
Revenue: $3.7M | Operating Margin: 38.4% | 6 Service Lines
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
from scipy import stats
from sklearn.preprocessing import StandardScaler

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import EPV system components
try:
    from unified_epv_system import EPVInputs, ServiceLine, compute_unified_epv
except ImportError:
    print("Warning: Could not import EPV system. Running in standalone mode.")

@dataclass
class NewMedspaCase:
    """Complete case study data structure for the new medispa case"""
    case_name: str
    analysis_date: str
    historical_data: Dict[str, Dict[str, float]]
    
    # Revenue breakdown by service line
    revenue_by_line: Dict[str, List[float]]  # 2022-2024 data
    cogs_by_line: Dict[str, List[float]]
    
    # Operating expense detail
    operating_expenses: Dict[str, List[float]]
    
    # Key financial metrics
    financial_metrics: Dict[str, List[float]]
    
    # Derived ratios and growth rates
    derived_metrics: Dict[str, float]
    
    # Normalization flags
    normalization_notes: List[str]
    
    def __post_init__(self):
        """Calculate additional derived metrics"""
        self.calculate_normalized_metrics()
    
    def calculate_normalized_metrics(self):
        """Calculate normalized metrics addressing the marketing anomaly"""
        
        # Historical revenue growth
        revenues = self.historical_data['revenue_total']
        self.avg_revenue_growth = np.mean([
            (revenues[1] - revenues[0]) / revenues[0],
            (revenues[2] - revenues[1]) / revenues[1]
        ])
        
        # Normalized marketing expense (using 2022 as baseline)
        revenue_2024 = revenues[2]
        marketing_2022_pct = self.operating_expenses['marketing'][0] / revenues[0]
        self.normalized_marketing_2024 = revenue_2024 * marketing_2022_pct
        
        # Adjusted operating income (removing marketing normalization impact)
        actual_marketing_2024 = self.operating_expenses['marketing'][2]
        self.marketing_normalization_adjustment = self.normalized_marketing_2024 - actual_marketing_2024
        
        # Normalized EBITDA calculation
        operating_income_2024 = self.historical_data['operating_income'][2]
        depreciation_2024 = self.operating_expenses['depreciation'][2]
        interest_2024 = self.operating_expenses['interest_expense'][2]
        
        # EBITDA = Operating Income + D&A (interest is already in operating income per notes)
        self.reported_ebitda_2024 = operating_income_2024 + depreciation_2024
        self.normalized_ebitda_2024 = self.reported_ebitda_2024 - self.marketing_normalization_adjustment


def create_new_medispa_case() -> NewMedspaCase:
    """
    Create the new medispa case study from provided financial data
    """
    
    # Historical P&L data (in $000s)
    historical_data = {
        "revenue_total": [3566, 3620, 3726],
        "cogs_total": [1078, 1072, 1103],
        "gross_profit": [2489, 2549, 2623],
        "salaries_benefits_total": [1308, 1196, 1040],
        "operating_expense_total": [1838, 1418, 1191],
        "operating_income": [650, 1131, 1432],
        "other_income_expense_total": [5, 6, 57],
        "net_income_before_tax": [655, 1137, 1489]
    }
    
    # Revenue by service line (in $000s)
    revenue_by_line = {
        "energy_devices": [318, 270, 246],
        "injectables": [1124, 1045, 930],
        "wellness": [568, 653, 764],
        "weightloss": [617, 636, 718],
        "retail_sales": [323, 332, 335],
        "surgery": [617, 685, 733]
    }
    
    # COGS by service line (in $000s)
    cogs_by_line = {
        "energy_device_supplies": [22, 14, 24],
        "injectables": [371, 327, 278],
        "wellness": [188, 204, 269],
        "weightloss": [261, 253, 267],
        "retail_products": [158, 170, 130],
        "surgical_supplies": [77, 103, 136]
    }
    
    # Operating expense detail (in $000s)
    operating_expenses = {
        "marketing": [499, 253, 37],
        "automobile": [21, 21, 22],
        "credit_card_bank_charges": [111, 97, 93],
        "donations": [1, 1, 1],
        "computer_telephone_utilities": [93, 79, 92],
        "depreciation": [167, 150, 135],
        "dues_subscriptions": [40, 41, 42],
        "education": [23, 26, 25],
        "equipment_rental": [18, 0, 0],
        "insurance": [44, 45, 46],
        "interest_expense": [220, 212, 195],
        "travel_meals_entertainment": [13, 15, 12],
        "rent": [199, 205, 211],
        "office_expenses": [75, 76, 78],
        "professional_fees": [36, 36, 37],
        "repairs_maintenance": [164, 43, 45],
        "local_tax": [36, 36, 37],
        "state_tax": [78, 80, 82]
    }
    
    # Key financial metrics
    financial_metrics = {
        "gross_margin_pct": [69.77, 70.39, 70.40],
        "operating_margin_pct": [18.23, 31.24, 38.43],
        "marketing_pct_revenue": [13.99, 6.99, 0.99],
        "rent_pct_revenue": [5.58, 5.66, 5.66],
        "interest_expense_pct_revenue": [6.17, 5.86, 5.23]
    }
    
    # Derived metrics
    derived_metrics = {
        "revenue_cagr_2022_2024": ((3726/3566)**(1/2) - 1),
        "operating_income_cagr": ((1432/650)**(1/2) - 1),
        "average_gross_margin": np.mean([69.77, 70.39, 70.40]) / 100,
        "peak_marketing_pct": 13.99 / 100,
        "current_marketing_pct": 0.99 / 100,
        "normalized_marketing_pct": 8.0 / 100  # Conservative normalization
    }
    
    # Normalization notes
    normalization_notes = [
        "Marketing fell from 14.0% → 1.0% of revenue (likely reclassification)",
        "Operating margin jump driven largely by marketing drop",
        "Interest expense included in OpEx (not below the line)",
        "Strong revenue diversification across 6 service lines",
        "Stable gross margins ~70% indicate good pricing power"
    ]
    
    case = NewMedspaCase(
        case_name="Multi-Service Medispa Case",
        analysis_date=datetime.now().strftime("%Y-%m-%d"),
        historical_data=historical_data,
        revenue_by_line=revenue_by_line,
        cogs_by_line=cogs_by_line,
        operating_expenses=operating_expenses,
        financial_metrics=financial_metrics,
        derived_metrics=derived_metrics,
        normalization_notes=normalization_notes
    )
    
    return case


def calculate_epv_inputs_from_case(case: NewMedspaCase) -> EPVInputs:
    """
    Convert the medispa case data to EPV system inputs
    Uses 2024 data as baseline with appropriate normalizations
    """
    
    # Calculate 2024 service line data
    revenue_2024 = case.historical_data['revenue_total'][2] * 1000  # Convert to actual dollars
    
    # Create service lines based on 2024 revenue mix
    service_lines = []
    
    # Energy Devices (6.6% of revenue)
    service_lines.append(ServiceLine(
        id="energy_devices",
        name="Energy Device Treatments",
        price=450,  # Average treatment price
        volume=547,  # Calculated from revenue/price
        cogs_pct=0.097,  # 24/246 from data
        kind="service",
        growth_rate=0.05  # Conservative given declining trend
    ))
    
    # Injectables (25.0% of revenue) 
    service_lines.append(ServiceLine(
        id="injectables",
        name="Injectable Treatments",
        price=650,  # Average treatment price
        volume=1431,  # Calculated from revenue/price
        cogs_pct=0.299,  # 278/930 from data
        kind="service",
        growth_rate=0.08  # Moderate growth
    ))
    
    # Wellness (20.5% of revenue)
    service_lines.append(ServiceLine(
        id="wellness",
        name="Wellness Services",
        price=320,  # Average service price
        volume=2388,  # Calculated from revenue/price
        cogs_pct=0.352,  # 269/764 from data
        kind="service",
        growth_rate=0.15  # Strong growth trend
    ))
    
    # Weight Loss (19.3% of revenue)
    service_lines.append(ServiceLine(
        id="weightloss",
        name="Weight Loss Programs",
        price=850,  # Program price
        volume=845,  # Calculated from revenue/price
        cogs_pct=0.372,  # 267/718 from data
        kind="service",
        growth_rate=0.12  # Good growth
    ))
    
    # Retail Sales (9.0% of revenue)
    service_lines.append(ServiceLine(
        id="retail",
        name="Retail Products",
        price=75,  # Average product price
        volume=4467,  # Calculated from revenue/price
        cogs_pct=0.388,  # 130/335 from data
        kind="retail",
        growth_rate=0.03  # Stable
    ))
    
    # Surgery (19.7% of revenue)
    service_lines.append(ServiceLine(
        id="surgery",
        name="Surgical Procedures",
        price=2100,  # Average procedure price
        volume=349,  # Calculated from revenue/price
        cogs_pct=0.186,  # 136/733 from data
        kind="service",
        growth_rate=0.10  # Steady growth
    ))
    
    # Calculate normalized expense percentages
    normalized_marketing_pct = case.derived_metrics['normalized_marketing_pct']
    
    # Fixed costs from 2024 data (convert to actual dollars)
    rent_annual = case.operating_expenses['rent'][2] * 1000
    insurance_annual = case.operating_expenses['insurance'][2] * 1000
    utilities_annual = case.operating_expenses['computer_telephone_utilities'][2] * 1000
    
    # Clinical labor percentage (salaries as % of revenue)
    clinical_labor_pct = case.historical_data['salaries_benefits_total'][2] / case.historical_data['revenue_total'][2]
    
    # Create EPV inputs
    epv_inputs = EPVInputs(
        service_lines=service_lines,
        use_real_data=False,
        
        # Normalization settings
        years=3,  # Use 3-year historical data
        margin_method="median",
        
        # Cost structure (based on normalized 2024 data)
        clinical_labor_pct=clinical_labor_pct,
        marketing_pct=normalized_marketing_pct,
        admin_pct=0.08,  # Administrative expenses
        other_opex_pct=0.03,  # Other operating expenses
        
        # Fixed costs (converted to actual dollars)
        rent_annual=rent_annual,
        med_director_annual=80000,  # Estimated
        insurance_annual=insurance_annual,
        software_annual=30000,  # Estimated
        utilities_annual=utilities_annual,
        
        # Normalizations & adjustments
        owner_add_back=150000,  # Estimated owner compensation
        other_add_back=case.marketing_normalization_adjustment * 1000,  # Marketing normalization
        da_annual=case.operating_expenses['depreciation'][2] * 1000,
        
        # Capital intensity
        maintenance_method="depr_factor",
        maint_factor=1.2,  # 20% above depreciation
        
        # Working capital (estimated for medispa)
        dso_days=8,  # Fast collection
        dsi_days=30,  # Moderate inventory
        dpo_days=25,  # Supplier terms
        
        # Capital structure (estimated based on interest expense)
        cash_non_operating=150000,
        debt_interest_bearing=2300000,  # Estimated from interest expense
        excess_cash_pct=0.8,
        
        # Tax & WACC
        tax_rate=0.25,
        rf_rate=0.045,
        mrp=0.055,
        beta=1.2,  # Healthcare services beta
        size_premium=0.03,  # Small company premium
        specific_premium=0.02,  # Medispa-specific risk
        cost_debt=0.085,  # Based on interest expense/debt
        target_debt_weight=0.40,
        
        # EPV method
        epv_method="Owner Earnings",
        
        # Asset reproduction (estimated for established medispa)
        buildout_improvements=800000,
        equipment_devices=600000,
        ffne=200000,
        startup_intangibles=150000,
        other_repro=50000
    )
    
    return epv_inputs


def run_comprehensive_analysis(case: NewMedspaCase) -> Dict:
    """
    Run comprehensive Summit model analysis
    """
    
    print(f"\n{'='*60}")
    print("COMPREHENSIVE SUMMIT MODEL ANALYSIS")
    print(f"Case: {case.case_name}")
    print(f"Analysis Date: {case.analysis_date}")
    print(f"{'='*60}")
    
    # Convert to EPV inputs
    print("\n1. Processing financial data and normalizations...")
    epv_inputs = calculate_epv_inputs_from_case(case)
    
    print(f"   Service lines configured: {len(epv_inputs.service_lines)}")
    print(f"   Revenue (2024): ${case.historical_data['revenue_total'][2]:,.0f}K")
    print(f"   Normalized EBITDA: ${case.normalized_ebitda_2024:,.0f}K")
    print(f"   Marketing normalization: ${case.marketing_normalization_adjustment:,.0f}K")
    
    # Run EPV calculation
    print("\n2. Running EPV calculation...")
    try:
        epv_outputs = compute_unified_epv(epv_inputs)
        print(f"   ✅ Enterprise EPV: ${epv_outputs.enterprise_epv:,.0f}")
        print(f"   ✅ Equity EPV: ${epv_outputs.equity_epv:,.0f}")
        print(f"   ✅ EV/Revenue Multiple: {epv_outputs.enterprise_epv/(case.historical_data['revenue_total'][2]*1000):.2f}x")
        print(f"   ✅ EV/EBITDA Multiple: {epv_outputs.enterprise_epv/(case.normalized_ebitda_2024*1000):.2f}x")
        
        epv_success = True
        
    except Exception as e:
        print(f"   ❌ Error in EPV calculation: {e}")
        epv_outputs = None
        epv_success = False
    
    # Generate valuation summary
    print("\n3. Generating valuation summary...")
    
    results = {
        "case_data": case,
        "epv_inputs": epv_inputs,
        "epv_outputs": epv_outputs,
        "epv_success": epv_success,
        "financial_summary": {
            "revenue_2024": case.historical_data['revenue_total'][2] * 1000,
            "revenue_cagr": case.derived_metrics['revenue_cagr_2022_2024'],
            "normalized_ebitda": case.normalized_ebitda_2024 * 1000,
            "normalized_ebitda_margin": (case.normalized_ebitda_2024 / case.historical_data['revenue_total'][2]),
            "marketing_adjustment": case.marketing_normalization_adjustment * 1000
        },
        "service_line_analysis": analyze_service_line_performance(case),
        "normalization_impact": calculate_normalization_impact(case),
        "investment_recommendation": generate_investment_recommendation(case, epv_outputs)
    }
    
    return results


def analyze_service_line_performance(case: NewMedspaCase) -> Dict:
    """Analyze performance by service line"""
    
    analysis = {}
    
    for service_line in case.revenue_by_line.keys():
        revenues = case.revenue_by_line[service_line]
        
        # Calculate growth rates
        growth_2023 = (revenues[1] - revenues[0]) / revenues[0] if revenues[0] > 0 else 0
        growth_2024 = (revenues[2] - revenues[1]) / revenues[1] if revenues[1] > 0 else 0
        avg_growth = (growth_2023 + growth_2024) / 2
        
        # Calculate 2024 market share
        total_revenue_2024 = case.historical_data['revenue_total'][2]
        market_share = revenues[2] / total_revenue_2024
        
        analysis[service_line] = {
            "revenue_2024": revenues[2] * 1000,
            "growth_2023": growth_2023,
            "growth_2024": growth_2024,
            "avg_growth": avg_growth,
            "market_share_2024": market_share,
            "trend": "growing" if avg_growth > 0.05 else "stable" if avg_growth > -0.05 else "declining"
        }
    
    return analysis


def calculate_normalization_impact(case: NewMedspaCase) -> Dict:
    """Calculate the impact of normalization adjustments"""
    
    return {
        "marketing_normalization": {
            "reported_marketing_2024": case.operating_expenses['marketing'][2] * 1000,
            "normalized_marketing_2024": case.normalized_marketing_2024 * 1000,
            "adjustment_amount": case.marketing_normalization_adjustment * 1000,
            "ebitda_impact": -case.marketing_normalization_adjustment * 1000
        },
        "interest_treatment": {
            "interest_in_opex": True,
            "interest_amount_2024": case.operating_expenses['interest_expense'][2] * 1000,
            "note": "Interest expense included in operating expenses, not below the line"
        }
    }


def generate_investment_recommendation(case: NewMedspaCase, epv_outputs) -> Dict:
    """Generate investment recommendation based on analysis"""
    
    if not epv_outputs:
        return {"recommendation": "ANALYSIS INCOMPLETE", "reason": "EPV calculation failed"}
    
    # Calculate key metrics for recommendation
    revenue_2024 = case.historical_data['revenue_total'][2] * 1000
    ev_revenue_multiple = epv_outputs.enterprise_epv / revenue_2024
    normalized_ebitda = case.normalized_ebitda_2024 * 1000
    ev_ebitda_multiple = epv_outputs.enterprise_epv / normalized_ebitda
    
    # Investment criteria
    target_ev_revenue = 2.5  # Target multiple
    target_ev_ebitda = 6.0   # Target multiple
    
    recommendation = "PROCEED WITH CONDITIONS"
    risk_factors = []
    strengths = []
    
    # Evaluate strengths
    if case.derived_metrics['average_gross_margin'] > 0.68:
        strengths.append("Strong gross margins (>68%)")
    
    if case.derived_metrics['revenue_cagr_2022_2024'] > 0.02:
        strengths.append("Positive revenue growth")
    
    if len(case.revenue_by_line) >= 6:
        strengths.append("Diversified revenue streams")
    
    # Evaluate risk factors
    if case.operating_expenses['marketing'][2] / case.historical_data['revenue_total'][2] < 0.03:
        risk_factors.append("Abnormally low marketing spend (may not be sustainable)")
    
    if ev_revenue_multiple > target_ev_revenue:
        risk_factors.append(f"High EV/Revenue multiple ({ev_revenue_multiple:.2f}x vs {target_ev_revenue:.2f}x target)")
    
    if ev_ebitda_multiple > target_ev_ebitda:
        risk_factors.append(f"High EV/EBITDA multiple ({ev_ebitda_multiple:.2f}x vs {target_ev_ebitda:.2f}x target)")
    
    # Determine final recommendation
    if len(risk_factors) > 2:
        recommendation = "CAUTION ADVISED"
    elif ev_revenue_multiple < target_ev_revenue and ev_ebitda_multiple < target_ev_ebitda:
        recommendation = "FAVORABLE"
    
    return {
        "recommendation": recommendation,
        "enterprise_value": epv_outputs.enterprise_epv,
        "equity_value": epv_outputs.equity_epv,
        "ev_revenue_multiple": ev_revenue_multiple,
        "ev_ebitda_multiple": ev_ebitda_multiple,
        "strengths": strengths,
        "risk_factors": risk_factors,
        "key_conditions": [
            "Normalize marketing spend to sustainable levels",
            "Verify sustainability of current operating margins",
            "Confirm revenue diversification strategy"
        ]
    }


def generate_executive_summary(results: Dict) -> str:
    """Generate executive summary report"""
    
    case = results["case_data"]
    financial = results["financial_summary"]
    recommendation = results["investment_recommendation"]
    
    summary = f"""
# EXECUTIVE SUMMARY - {case.case_name.upper()}

## Key Financial Metrics
- **Revenue (2024):** ${financial['revenue_2024']:,.0f}
- **Revenue CAGR (2022-2024):** {financial['revenue_cagr']*100:.1f}%
- **Normalized EBITDA:** ${financial['normalized_ebitda']:,.0f}
- **EBITDA Margin:** {financial['normalized_ebitda_margin']*100:.1f}%

## Valuation Results
- **Enterprise Value:** ${recommendation['enterprise_value']:,.0f}
- **Equity Value:** ${recommendation['equity_value']:,.0f}
- **EV/Revenue:** {recommendation['ev_revenue_multiple']:.2f}x
- **EV/EBITDA:** {recommendation['ev_ebitda_multiple']:.2f}x

## Investment Recommendation: {recommendation['recommendation']}

### Strengths:
"""
    
    for strength in recommendation['strengths']:
        summary += f"- {strength}\n"
    
    summary += "\n### Risk Factors:\n"
    for risk in recommendation['risk_factors']:
        summary += f"- {risk}\n"
    
    summary += "\n### Key Conditions:\n"
    for condition in recommendation['key_conditions']:
        summary += f"- {condition}\n"
    
    summary += f"""
## Normalization Adjustments
- **Marketing Normalization:** ${financial['marketing_adjustment']:,.0f}
- **Interest Treatment:** Included in operating expenses

## Service Line Performance
"""
    
    service_analysis = results["service_line_analysis"]
    for line, data in service_analysis.items():
        summary += f"- **{line.replace('_', ' ').title()}:** ${data['revenue_2024']:,.0f} ({data['market_share_2024']*100:.1f}% share, {data['trend']})\n"
    
    return summary


def main():
    """
    Main execution function for new medispa case analysis
    """
    
    print("🏥 NEW MEDISPA CASE - SUMMIT MODEL ANALYSIS")
    print("=" * 60)
    
    # Create case study
    print("\n📊 Loading financial data...")
    case = create_new_medispa_case()
    
    # Run comprehensive analysis
    results = run_comprehensive_analysis(case)
    
    # Generate and save executive summary
    print("\n📝 Generating executive summary...")
    executive_summary = generate_executive_summary(results)
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"new_medispa_results_{timestamp}.json"
    summary_file = f"new_medispa_summary_{timestamp}.md"
    
    # Save JSON results
    json_results = {
        "case_name": case.case_name,
        "analysis_date": case.analysis_date,
        "financial_summary": results["financial_summary"],
        "investment_recommendation": results["investment_recommendation"],
        "service_line_analysis": results["service_line_analysis"],
        "normalization_impact": results["normalization_impact"]
    }
    
    with open(results_file, 'w') as f:
        json.dump(json_results, f, indent=2, default=str)
    
    # Save executive summary
    with open(summary_file, 'w') as f:
        f.write(executive_summary)
    
    print(f"\n✅ Analysis complete!")
    print(f"   📄 Results saved: {results_file}")
    print(f"   📋 Summary saved: {summary_file}")
    print(f"\n{executive_summary}")
    
    return results


@dataclass
class SensitivityAnalysis:
    """Comprehensive sensitivity analysis for medispa valuation"""
    
    # Sensitivity ranges
    marketing_pct_range: Tuple[float, float] = (0.05, 0.15)  # 5% to 15%
    ev_ebitda_range: Tuple[float, float] = (4.5, 8.5)       # 4.5x to 8.5x
    debt_scenarios: List[str] = None                          # Current vs Normalized
    
    # Monte Carlo parameters
    n_simulations: int = 10000
    confidence_levels: List[float] = None
    
    def __post_init__(self):
        if self.debt_scenarios is None:
            self.debt_scenarios = ["current_debt", "normalized_debt", "zero_debt"]
        if self.confidence_levels is None:
            self.confidence_levels = [0.10, 0.25, 0.50, 0.75, 0.90]


def build_sensitivity_framework(case: NewMedspaCase) -> Dict:
    """
    Build comprehensive sensitivity analysis framework for key valuation drivers
    
    Returns sensitivity matrices, Monte Carlo inputs, and tornado chart data
    """
    
    print("\n" + "="*60)
    print("BUILDING SENSITIVITY ANALYSIS FRAMEWORK")
    print("="*60)
    
    # Initialize sensitivity analysis
    sensitivity = SensitivityAnalysis()
    
    # Get base case metrics
    base_revenue_2024 = case.historical_data['revenue_total'][2] * 1000
    base_normalized_ebitda = case.normalized_ebitda_2024 * 1000
    base_debt = case.operating_expenses['interest_expense'][2] * 1000 / 0.085  # Estimated from interest/rate
    
    print(f"Base Revenue (2024): ${base_revenue_2024:,.0f}")
    print(f"Base Normalized EBITDA: ${base_normalized_ebitda:,.0f}")
    print(f"Estimated Current Debt: ${base_debt:,.0f}")
    
    # Build sensitivity matrices
    print("\n1. Building Marketing Sensitivity Matrix...")
    marketing_sensitivity = build_marketing_sensitivity_matrix(case, sensitivity)
    
    print("2. Building EV/EBITDA Multiple Sensitivity Matrix...")
    multiple_sensitivity = build_multiple_sensitivity_matrix(case, sensitivity)
    
    print("3. Building Debt Scenario Analysis...")
    debt_sensitivity = build_debt_scenario_analysis(case, sensitivity)
    
    print("4. Generating Monte Carlo Input Distributions...")
    monte_carlo_inputs = generate_monte_carlo_distributions(case, sensitivity)
    
    print("5. Building Tornado Chart Analysis...")
    tornado_data = build_tornado_analysis(case, sensitivity)
    
    # Compile comprehensive results
    results = {
        "sensitivity_config": sensitivity,
        "base_case_metrics": {
            "revenue_2024": base_revenue_2024,
            "normalized_ebitda": base_normalized_ebitda,
            "estimated_debt": base_debt,
            "marketing_normalized_pct": case.derived_metrics['normalized_marketing_pct'],
            "current_marketing_pct": case.financial_metrics['marketing_pct_revenue'][2] / 100
        },
        "marketing_sensitivity": marketing_sensitivity,
        "multiple_sensitivity": multiple_sensitivity,
        "debt_sensitivity": debt_sensitivity,
        "monte_carlo_inputs": monte_carlo_inputs,
        "tornado_analysis": tornado_data,
        "summary_statistics": calculate_sensitivity_summary_stats(
            marketing_sensitivity, multiple_sensitivity, debt_sensitivity
        )
    }
    
    print("\n✅ Sensitivity Analysis Framework Complete!")
    return results


def build_marketing_sensitivity_matrix(case: NewMedspaCase, sensitivity: SensitivityAnalysis) -> Dict:
    """
    Build marketing expense sensitivity analysis (5% to 15% of revenue)
    """
    
    # Create marketing percentage range
    marketing_range = np.linspace(
        sensitivity.marketing_pct_range[0], 
        sensitivity.marketing_pct_range[1], 
        11  # 11 points from 5% to 15%
    )
    
    base_revenue = case.historical_data['revenue_total'][2] * 1000
    base_ebitda = case.normalized_ebitda_2024 * 1000
    base_marketing_normalized = case.normalized_marketing_2024 * 1000
    
    # Build sensitivity matrix
    sensitivity_matrix = []
    enterprise_values = []
    
    for marketing_pct in marketing_range:
        # Calculate adjusted EBITDA
        marketing_expense = base_revenue * marketing_pct
        marketing_delta = marketing_expense - base_marketing_normalized
        adjusted_ebitda = base_ebitda - marketing_delta
        
        # Calculate enterprise value at different multiples
        ev_multiples = np.linspace(4.5, 8.5, 9)  # 4.5x to 8.5x
        ev_range = adjusted_ebitda * ev_multiples
        
        sensitivity_matrix.append({
            "marketing_pct": marketing_pct,
            "marketing_expense": marketing_expense,
            "adjusted_ebitda": adjusted_ebitda,
            "ebitda_margin": adjusted_ebitda / base_revenue,
            "ev_range": ev_range.tolist(),
            "ev_multiples": ev_multiples.tolist()
        })
        
        # Store mid-point EV for summary
        enterprise_values.append(adjusted_ebitda * 6.5)  # Mid-point multiple
    
    return {
        "marketing_range": marketing_range.tolist(),
        "sensitivity_matrix": sensitivity_matrix,
        "enterprise_values": enterprise_values,
        "base_case": {
            "marketing_pct": case.derived_metrics['normalized_marketing_pct'],
            "marketing_expense": base_marketing_normalized,
            "ebitda": base_ebitda
        },
        "sensitivity_stats": {
            "min_ev": min(enterprise_values),
            "max_ev": max(enterprise_values),
            "ev_range": max(enterprise_values) - min(enterprise_values),
            "ev_volatility": np.std(enterprise_values)
        }
    }


def build_multiple_sensitivity_matrix(case: NewMedspaCase, sensitivity: SensitivityAnalysis) -> Dict:
    """
    Build EV/EBITDA multiple sensitivity analysis (4.5x to 8.5x)
    """
    
    # Multiple range
    multiple_range = np.linspace(
        sensitivity.ev_ebitda_range[0],
        sensitivity.ev_ebitda_range[1],
        17  # 4.5x to 8.5x in 0.25x increments
    )
    
    base_ebitda = case.normalized_ebitda_2024 * 1000
    
    # Build matrix for different EBITDA scenarios
    ebitda_scenarios = {
        "conservative": base_ebitda * 0.85,  # 15% reduction
        "base_case": base_ebitda,
        "optimistic": base_ebitda * 1.15     # 15% increase
    }
    
    sensitivity_matrix = {}
    
    for scenario_name, ebitda_value in ebitda_scenarios.items():
        enterprise_values = ebitda_value * multiple_range
        
        sensitivity_matrix[scenario_name] = {
            "ebitda": ebitda_value,
            "multiples": multiple_range.tolist(),
            "enterprise_values": enterprise_values.tolist(),
            "statistics": {
                "min_ev": float(np.min(enterprise_values)),
                "max_ev": float(np.max(enterprise_values)),
                "median_ev": float(np.median(enterprise_values)),
                "ev_at_6x": float(ebitda_value * 6.0)
            }
        }
    
    return {
        "multiple_range": multiple_range.tolist(),
        "ebitda_scenarios": ebitda_scenarios,
        "sensitivity_matrix": sensitivity_matrix,
        "cross_sensitivity": build_cross_sensitivity_table(multiple_range, ebitda_scenarios)
    }


def build_cross_sensitivity_table(multiples: np.ndarray, ebitda_scenarios: Dict) -> Dict:
    """Build cross-sensitivity table for multiples vs EBITDA scenarios"""
    
    cross_table = {}
    
    for scenario_name, ebitda_value in ebitda_scenarios.items():
        cross_table[scenario_name] = {}
        
        # Key multiple points
        key_multiples = [4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5]
        
        for multiple in key_multiples:
            cross_table[scenario_name][f"{multiple}x"] = ebitda_value * multiple
    
    return cross_table


def build_debt_scenario_analysis(case: NewMedspaCase, sensitivity: SensitivityAnalysis) -> Dict:
    """
    Build debt scenario analysis (current vs normalized capital structure)
    """
    
    # Estimate current debt from interest expense
    interest_expense = case.operating_expenses['interest_expense'][2] * 1000
    estimated_cost_of_debt = 0.085  # 8.5% based on current market
    current_debt = interest_expense / estimated_cost_of_debt
    
    # Define debt scenarios
    debt_scenarios = {
        "current_debt": {
            "debt_amount": current_debt,
            "interest_expense": interest_expense,
            "description": "Current debt level based on interest expense"
        },
        "normalized_debt": {
            "debt_amount": case.normalized_ebitda_2024 * 1000 * 3.5,  # 3.5x EBITDA leverage
            "interest_expense": case.normalized_ebitda_2024 * 1000 * 3.5 * estimated_cost_of_debt,
            "description": "Normalized leverage at 3.5x EBITDA"
        },
        "optimal_debt": {
            "debt_amount": case.normalized_ebitda_2024 * 1000 * 2.5,  # 2.5x EBITDA leverage
            "interest_expense": case.normalized_ebitda_2024 * 1000 * 2.5 * estimated_cost_of_debt,
            "description": "Optimal leverage at 2.5x EBITDA"
        },
        "zero_debt": {
            "debt_amount": 0,
            "interest_expense": 0,
            "description": "Debt-free scenario"
        }
    }
    
    # Calculate enterprise and equity values under each scenario
    base_ebitda = case.normalized_ebitda_2024 * 1000
    target_multiple = 6.0  # Base case multiple
    
    for scenario_name, scenario_data in debt_scenarios.items():
        # Adjusted EBITDA (add back interest expense difference)
        interest_delta = scenario_data["interest_expense"] - interest_expense
        adjusted_ebitda = base_ebitda + interest_delta
        
        # Enterprise value
        enterprise_value = adjusted_ebitda * target_multiple
        
        # Equity value
        equity_value = enterprise_value - scenario_data["debt_amount"]
        
        # Update scenario with valuations
        scenario_data.update({
            "adjusted_ebitda": adjusted_ebitda,
            "enterprise_value": enterprise_value,
            "equity_value": equity_value,
            "debt_to_ebitda": scenario_data["debt_amount"] / base_ebitda if base_ebitda > 0 else 0,
            "interest_coverage": adjusted_ebitda / scenario_data["interest_expense"] if scenario_data["interest_expense"] > 0 else float('inf')
        })
    
    return {
        "scenarios": debt_scenarios,
        "base_assumptions": {
            "cost_of_debt": estimated_cost_of_debt,
            "target_multiple": target_multiple,
            "base_ebitda": base_ebitda
        },
        "scenario_comparison": compare_debt_scenarios(debt_scenarios)
    }


def compare_debt_scenarios(debt_scenarios: Dict) -> Dict:
    """Compare key metrics across debt scenarios"""
    
    comparison = {
        "equity_values": {},
        "debt_ratios": {},
        "interest_coverage": {}
    }
    
    for scenario_name, data in debt_scenarios.items():
        comparison["equity_values"][scenario_name] = data["equity_value"]
        comparison["debt_ratios"][scenario_name] = data["debt_to_ebitda"]
        comparison["interest_coverage"][scenario_name] = data["interest_coverage"]
    
    # Calculate ranges and spreads
    equity_values = list(comparison["equity_values"].values())
    comparison["equity_value_range"] = max(equity_values) - min(equity_values)
    comparison["equity_value_volatility"] = np.std(equity_values)
    
    return comparison


def generate_monte_carlo_distributions(case: NewMedspaCase, sensitivity: SensitivityAnalysis) -> Dict:
    """
    Generate Monte Carlo input distributions for key variables
    """
    
    # Define probability distributions for key variables
    distributions = {
        "marketing_pct": {
            "distribution": "normal",
            "mean": case.derived_metrics['normalized_marketing_pct'],
            "std": 0.02,  # 2% standard deviation
            "min_clip": 0.03,  # Minimum 3%
            "max_clip": 0.18   # Maximum 18%
        },
        "ebitda_multiple": {
            "distribution": "normal",
            "mean": 6.0,      # Target multiple
            "std": 0.75,      # Market variation
            "min_clip": 4.0,
            "max_clip": 9.0
        },
        "revenue_growth": {
            "distribution": "normal",
            "mean": case.derived_metrics['revenue_cagr_2022_2024'],
            "std": 0.05,      # 5% standard deviation
            "min_clip": -0.10,
            "max_clip": 0.25
        },
        "ebitda_margin": {
            "distribution": "normal",
            "mean": case.normalized_ebitda_2024 / case.historical_data['revenue_total'][2],
            "std": 0.03,      # 3% standard deviation
            "min_clip": 0.20,
            "max_clip": 0.50
        },
        "debt_to_ebitda": {
            "distribution": "uniform",
            "low": 2.0,
            "high": 4.5
        },
        "cost_of_debt": {
            "distribution": "normal",
            "mean": 0.085,
            "std": 0.015,
            "min_clip": 0.04,
            "max_clip": 0.15
        }
    }
    
    # Generate sample distributions
    np.random.seed(42)  # For reproducibility
    
    samples = {}
    for var_name, params in distributions.items():
        if params["distribution"] == "normal":
            sample = np.random.normal(
                params["mean"], 
                params["std"], 
                sensitivity.n_simulations
            )
            sample = np.clip(sample, params["min_clip"], params["max_clip"])
        
        elif params["distribution"] == "uniform":
            sample = np.random.uniform(
                params["low"], 
                params["high"], 
                sensitivity.n_simulations
            )
        
        samples[var_name] = sample
        
        # Calculate sample statistics
        distributions[var_name]["sample_stats"] = {
            "mean": float(np.mean(sample)),
            "std": float(np.std(sample)),
            "min": float(np.min(sample)),
            "max": float(np.max(sample)),
            "percentiles": {
                f"p{int(p*100)}": float(np.percentile(sample, p*100))
                for p in sensitivity.confidence_levels
            }
        }
    
    return {
        "distributions": distributions,
        "samples": {k: v.tolist() for k, v in samples.items()},
        "correlation_matrix": calculate_correlation_matrix(samples),
        "simulation_config": {
            "n_simulations": sensitivity.n_simulations,
            "random_seed": 42
        }
    }


def calculate_correlation_matrix(samples: Dict[str, np.ndarray]) -> Dict:
    """Calculate correlation matrix between variables"""
    
    # Convert to DataFrame for easier correlation calculation
    df = pd.DataFrame(samples)
    correlation_matrix = df.corr()
    
    return {
        "matrix": correlation_matrix.to_dict(),
        "strong_correlations": identify_strong_correlations(correlation_matrix)
    }


def identify_strong_correlations(corr_matrix: pd.DataFrame, threshold: float = 0.5) -> List[Dict]:
    """Identify strong correlations above threshold"""
    
    strong_corrs = []
    
    for i in range(len(corr_matrix.columns)):
        for j in range(i+1, len(corr_matrix.columns)):
            correlation = corr_matrix.iloc[i, j]
            if abs(correlation) > threshold:
                strong_corrs.append({
                    "var1": corr_matrix.columns[i],
                    "var2": corr_matrix.columns[j],
                    "correlation": float(correlation),
                    "strength": "strong" if abs(correlation) > 0.7 else "moderate"
                })
    
    return strong_corrs


def build_tornado_analysis(case: NewMedspaCase, sensitivity: SensitivityAnalysis) -> Dict:
    """
    Build tornado chart analysis ranking variables by impact magnitude
    """
    
    # Base case enterprise value
    base_ebitda = case.normalized_ebitda_2024 * 1000
    base_multiple = 6.0
    base_enterprise_value = base_ebitda * base_multiple
    
    # Define variable ranges for tornado analysis
    variable_impacts = []
    
    # Marketing percentage impact
    marketing_low = base_enterprise_value * (1 - (0.15 - case.derived_metrics['normalized_marketing_pct']) / 0.30)
    marketing_high = base_enterprise_value * (1 - (0.05 - case.derived_metrics['normalized_marketing_pct']) / 0.30)
    marketing_impact = (marketing_high - marketing_low) / 2
    
    variable_impacts.append({
        "variable": "Marketing % of Revenue",
        "low_value": 0.05,
        "high_value": 0.15,
        "low_ev": marketing_low,
        "high_ev": marketing_high,
        "impact_range": marketing_impact,
        "impact_pct": marketing_impact / base_enterprise_value
    })
    
    # EV/EBITDA multiple impact
    multiple_low = base_ebitda * 4.5
    multiple_high = base_ebitda * 8.5
    multiple_impact = (multiple_high - multiple_low) / 2
    
    variable_impacts.append({
        "variable": "EV/EBITDA Multiple",
        "low_value": 4.5,
        "high_value": 8.5,
        "low_ev": multiple_low,
        "high_ev": multiple_high,
        "impact_range": multiple_impact,
        "impact_pct": multiple_impact / base_enterprise_value
    })
    
    # EBITDA margin impact
    ebitda_margin_low = (case.normalized_ebitda_2024 / case.historical_data['revenue_total'][2] - 0.05) * case.historical_data['revenue_total'][2] * 1000 * base_multiple
    ebitda_margin_high = (case.normalized_ebitda_2024 / case.historical_data['revenue_total'][2] + 0.05) * case.historical_data['revenue_total'][2] * 1000 * base_multiple
    ebitda_margin_impact = (ebitda_margin_high - ebitda_margin_low) / 2
    
    variable_impacts.append({
        "variable": "EBITDA Margin",
        "low_value": (case.normalized_ebitda_2024 / case.historical_data['revenue_total'][2]) - 0.05,
        "high_value": (case.normalized_ebitda_2024 / case.historical_data['revenue_total'][2]) + 0.05,
        "low_ev": ebitda_margin_low,
        "high_ev": ebitda_margin_high,
        "impact_range": ebitda_margin_impact,
        "impact_pct": ebitda_margin_impact / base_enterprise_value
    })
    
    # Revenue growth impact (3-year forward impact)
    revenue_low = case.historical_data['revenue_total'][2] * 1000 * (1 + 0.00)**3 * (case.normalized_ebitda_2024 / case.historical_data['revenue_total'][2]) * base_multiple
    revenue_high = case.historical_data['revenue_total'][2] * 1000 * (1 + 0.10)**3 * (case.normalized_ebitda_2024 / case.historical_data['revenue_total'][2]) * base_multiple
    revenue_impact = (revenue_high - revenue_low) / 2
    
    variable_impacts.append({
        "variable": "Revenue Growth Rate",
        "low_value": 0.00,
        "high_value": 0.10,
        "low_ev": revenue_low,
        "high_ev": revenue_high,
        "impact_range": revenue_impact,
        "impact_pct": revenue_impact / base_enterprise_value
    })
    
    # Sort by impact magnitude
    variable_impacts.sort(key=lambda x: x["impact_range"], reverse=True)
    
    return {
        "base_enterprise_value": base_enterprise_value,
        "variable_impacts": variable_impacts,
        "tornado_chart_data": prepare_tornado_chart_data(variable_impacts, base_enterprise_value),
        "sensitivity_ranking": [v["variable"] for v in variable_impacts]
    }


def prepare_tornado_chart_data(variable_impacts: List[Dict], base_value: float) -> Dict:
    """Prepare data for tornado chart visualization"""
    
    chart_data = {
        "variables": [],
        "low_deviations": [],
        "high_deviations": [],
        "impact_percentages": []
    }
    
    for impact in variable_impacts:
        chart_data["variables"].append(impact["variable"])
        chart_data["low_deviations"].append(impact["low_ev"] - base_value)
        chart_data["high_deviations"].append(impact["high_ev"] - base_value)
        chart_data["impact_percentages"].append(impact["impact_pct"] * 100)
    
    return chart_data


def calculate_sensitivity_summary_stats(marketing_sens: Dict, multiple_sens: Dict, debt_sens: Dict) -> Dict:
    """Calculate summary statistics across all sensitivity analyses"""
    
    # Extract enterprise value ranges
    marketing_evs = marketing_sens["enterprise_values"]
    
    # Multiple sensitivity EVs (using base case EBITDA)
    base_ebitda = multiple_sens["sensitivity_matrix"]["base_case"]["ebitda"]
    multiple_evs = multiple_sens["sensitivity_matrix"]["base_case"]["enterprise_values"]
    
    # Debt sensitivity EVs
    debt_evs = [scenario["enterprise_value"] for scenario in debt_sens["scenarios"].values()]
    
    # Combined statistics
    all_evs = marketing_evs + multiple_evs + debt_evs
    
    return {
        "overall_statistics": {
            "min_enterprise_value": min(all_evs),
            "max_enterprise_value": max(all_evs),
            "enterprise_value_range": max(all_evs) - min(all_evs),
            "coefficient_of_variation": np.std(all_evs) / np.mean(all_evs)
        },
        "sensitivity_comparison": {
            "marketing_sensitivity": {
                "ev_range": marketing_sens["sensitivity_stats"]["ev_range"],
                "volatility": marketing_sens["sensitivity_stats"]["ev_volatility"]
            },
            "multiple_sensitivity": {
                "ev_range": max(multiple_evs) - min(multiple_evs),
                "volatility": np.std(multiple_evs)
            },
            "debt_sensitivity": {
                "ev_range": max(debt_evs) - min(debt_evs),
                "volatility": np.std(debt_evs)
            }
        },
        "risk_metrics": {
            "downside_scenario_5th_percentile": np.percentile(all_evs, 5),
            "upside_scenario_95th_percentile": np.percentile(all_evs, 95),
            "median_enterprise_value": np.median(all_evs),
            "interquartile_range": np.percentile(all_evs, 75) - np.percentile(all_evs, 25)
        }
    }


def generate_sensitivity_report(sensitivity_results: Dict, case: NewMedspaCase) -> str:
    """Generate comprehensive sensitivity analysis report"""
    
    base_metrics = sensitivity_results["base_case_metrics"]
    summary_stats = sensitivity_results["summary_statistics"]
    tornado_data = sensitivity_results["tornado_analysis"]
    
    report = f"""
# COMPREHENSIVE SENSITIVITY ANALYSIS REPORT
## {case.case_name.upper()}

### Base Case Assumptions
- **Revenue (2024):** ${base_metrics['revenue_2024']:,.0f}
- **Normalized EBITDA:** ${base_metrics['normalized_ebitda']:,.0f}
- **EBITDA Margin:** {base_metrics['normalized_ebitda']/base_metrics['revenue_2024']*100:.1f}%
- **Marketing % (Normalized):** {base_metrics['marketing_normalized_pct']*100:.1f}%
- **Estimated Debt:** ${base_metrics['estimated_debt']:,.0f}

### Enterprise Value Sensitivity Ranges

#### Overall Statistics
- **Minimum EV:** ${summary_stats['overall_statistics']['min_enterprise_value']:,.0f}
- **Maximum EV:** ${summary_stats['overall_statistics']['max_enterprise_value']:,.0f}
- **Total Range:** ${summary_stats['overall_statistics']['enterprise_value_range']:,.0f}
- **Coefficient of Variation:** {summary_stats['overall_statistics']['coefficient_of_variation']:.2f}

#### Risk Scenarios
- **5th Percentile (Downside):** ${summary_stats['risk_metrics']['downside_scenario_5th_percentile']:,.0f}
- **Median Enterprise Value:** ${summary_stats['risk_metrics']['median_enterprise_value']:,.0f}
- **95th Percentile (Upside):** ${summary_stats['risk_metrics']['upside_scenario_95th_percentile']:,.0f}
- **Interquartile Range:** ${summary_stats['risk_metrics']['interquartile_range']:,.0f}

### Sensitivity Ranking (Tornado Analysis)

Variables ranked by valuation impact magnitude:
"""
    
    for i, variable in enumerate(tornado_data["sensitivity_ranking"], 1):
        impact_data = next(v for v in tornado_data["variable_impacts"] if v["variable"] == variable)
        report += f"{i}. **{variable}:** ±${impact_data['impact_range']:,.0f} ({impact_data['impact_pct']*100:.1f}% impact)\n"
    
    report += f"""

### Marketing Sensitivity Analysis
- **Range Tested:** 5.0% to 15.0% of revenue
- **Enterprise Value Range:** ±${sensitivity_results['marketing_sensitivity']['sensitivity_stats']['ev_range']:,.0f}
- **Key Insight:** Marketing normalization critical - every 1% change impacts EV by ~${sensitivity_results['marketing_sensitivity']['sensitivity_stats']['ev_range']/10:,.0f}

### EV/EBITDA Multiple Sensitivity
- **Range Tested:** 4.5x to 8.5x EBITDA
- **Base Case Multiple:** 6.0x
- **Enterprise Value Range:** ${summary_stats['sensitivity_comparison']['multiple_sensitivity']['ev_range']:,.0f}

### Debt Structure Impact
- **Current Debt Scenario:** ${sensitivity_results['debt_sensitivity']['scenarios']['current_debt']['enterprise_value']:,.0f} EV
- **Optimal Leverage (2.5x):** ${sensitivity_results['debt_sensitivity']['scenarios']['optimal_debt']['enterprise_value']:,.0f} EV
- **Debt-Free Scenario:** ${sensitivity_results['debt_sensitivity']['scenarios']['zero_debt']['enterprise_value']:,.0f} EV

### Monte Carlo Distribution Parameters
"""
    
    mc_inputs = sensitivity_results["monte_carlo_inputs"]
    for var_name, dist_data in mc_inputs["distributions"].items():
        stats = dist_data["sample_stats"]
        report += f"- **{var_name.replace('_', ' ').title()}:** {dist_data['distribution'].title()} distribution, μ={stats['mean']:.3f}, σ={stats['std']:.3f}\n"
    
    report += f"""

### Key Risk Factors Identified
1. **Marketing Expense Normalization** - Highest impact variable
2. **Market Multiple Assumptions** - Significant range sensitivity  
3. **EBITDA Margin Sustainability** - Critical profitability driver
4. **Capital Structure Optimization** - Moderate impact on equity value

### Recommended Scenario Analysis
- **Conservative:** 95th percentile marketing (12%), 4.5x multiple, current debt
- **Base Case:** 8% marketing, 6.0x multiple, optimized debt structure  
- **Aggressive:** 5% marketing, 8.0x multiple, minimal debt

*Analysis Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}*
"""
    
    return report


if __name__ == "__main__":
    results = main()
    
    # Run sensitivity analysis if main analysis succeeded
    if results.get("epv_success", False):
        print("\n" + "="*60)
        print("RUNNING COMPREHENSIVE SENSITIVITY ANALYSIS")
        print("="*60)
        
        sensitivity_results = build_sensitivity_framework(results["case_data"])
        
        # Generate sensitivity report
        sensitivity_report = generate_sensitivity_report(sensitivity_results, results["case_data"])
        
        # Save sensitivity results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        sensitivity_file = f"medispa_sensitivity_analysis_{timestamp}.json"
        sensitivity_report_file = f"medispa_sensitivity_report_{timestamp}.md"
        
        # Save detailed JSON results
        sensitivity_json = {
            "analysis_type": "comprehensive_sensitivity_analysis",
            "case_name": results["case_data"].case_name,
            "analysis_date": datetime.now().isoformat(),
            "base_case_metrics": sensitivity_results["base_case_metrics"],
            "marketing_sensitivity": sensitivity_results["marketing_sensitivity"],
            "multiple_sensitivity": sensitivity_results["multiple_sensitivity"],
            "debt_sensitivity": sensitivity_results["debt_sensitivity"],
            "monte_carlo_inputs": sensitivity_results["monte_carlo_inputs"],
            "tornado_analysis": sensitivity_results["tornado_analysis"],
            "summary_statistics": sensitivity_results["summary_statistics"]
        }
        
        with open(sensitivity_file, 'w') as f:
            json.dump(sensitivity_json, f, indent=2, default=str)
        
        # Save report
        with open(sensitivity_report_file, 'w') as f:
            f.write(sensitivity_report)
        
        print(f"\n✅ Sensitivity Analysis Complete!")
        print(f"   📊 Detailed results: {sensitivity_file}")
        print(f"   📋 Executive report: {sensitivity_report_file}")
        print(sensitivity_report)
    
    else:
        print("\n❌ Skipping sensitivity analysis - EPV calculation failed") 