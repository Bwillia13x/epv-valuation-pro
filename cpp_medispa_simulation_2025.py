#!/usr/bin/env python3
"""
CPP Medical Aesthetic Clinic Simulation - 2025 Focus
Comprehensive valuation analysis of hypothetical mid-sized medispa 
Based on rigorous benchmarking and Monte Carlo uncertainty modeling
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
class CPPMedspaCase:
    """Complete case study data structure"""
    case_name: str
    location: str
    physician_owned: bool
    target_profile: str
    
    # Financial projections (2023-2027)
    revenue_projections: Dict[int, Dict[str, float]]
    expense_projections: Dict[int, Dict[str, float]]
    cpp_adjustments: Dict[int, Dict[str, float]]
    
    # Market benchmarks
    industry_multiples: Dict[str, Tuple[float, float]]  # (min, max)
    industry_margins: Dict[str, Tuple[float, float]]
    growth_benchmarks: Dict[str, float]
    
    # Synergy potential
    synergy_profile: Dict[str, float]
    
    # Monte Carlo parameters
    monte_carlo_runs: int = 1000
    confidence_interval: float = 0.95

def create_cpp_medispa_case() -> CPPMedspaCase:
    """
    Create the comprehensive medispa case study based on user's detailed analysis
    """
    
    # Revenue projections by category (from user's data)
    revenue_projections = {
        2023: {
            "injectables": 1125000,
            "lasers_treatments": 625000,
            "memberships": 500000,
            "other_services": 250000,
            "total": 2500000
        },
        2024: {
            "injectables": 1280625,
            "lasers_treatments": 711458,
            "memberships": 569167,
            "other_services": 284583,
            "total": 2845833
        },
        2025: {
            "injectables": 1473844,
            "lasers_treatments": 819358,
            "memberships": 655486,
            "other_services": 327743,
            "total": 3276431
        },
        2026: {
            "injectables": 1674253,
            "lasers_treatments": 930140,
            "memberships": 744112,
            "other_services": 372056,
            "total": 3720561
        },
        2027: {
            "injectables": 1922390,
            "lasers_treatments": 1067994,
            "memberships": 854395,
            "other_services": 427198,
            "total": 4271977
        }
    }
    
    # Expense projections (from user's data)
    expense_projections = {
        2023: {
            "cogs_supplies": 612500,
            "salaries_benefits": 700000,
            "rent_utilities": 250000,
            "marketing": 300000,
            "administrative": 200000,
            "other_expenses": 175000,
            "total": 2237500
        },
        2024: {
            "cogs_supplies": 711458,
            "salaries_benefits": 796633,
            "rent_utilities": 284583,
            "marketing": 341500,
            "administrative": 227667,
            "other_expenses": 199208,
            "total": 2561049
        },
        2025: {
            "cogs_supplies": 819358,
            "salaries_benefits": 917401,
            "rent_utilities": 327743,
            "marketing": 393172,
            "administrative": 262145,
            "other_expenses": 229350,
            "total": 2949169
        },
        2026: {
            "cogs_supplies": 930140,
            "salaries_benefits": 1041757,
            "rent_utilities": 372056,
            "marketing": 446467,
            "administrative": 297645,
            "other_expenses": 260439,
            "total": 3348504
        },
        2027: {
            "cogs_supplies": 1067994,
            "salaries_benefits": 1196153,
            "rent_utilities": 427198,
            "marketing": 512637,
            "administrative": 341758,
            "other_expenses": 299038,
            "total": 3844778
        }
    }
    
    # CPP-style adjustments (from user's data)
    cpp_adjustments = {
        2023: {
            "owner_compensation_addback": 125000,
            "personal_expenses": 62500,
            "one_time_costs": 37500,
            "synergies_network": 62500,
            "total": 287500
        },
        2024: {
            "owner_compensation_addback": 142292,
            "personal_expenses": 71146,
            "one_time_costs": 42687,
            "synergies_network": 71146,
            "total": 327271
        },
        2025: {
            "owner_compensation_addback": 163822,
            "personal_expenses": 81911,
            "one_time_costs": 49146,
            "synergies_network": 81911,
            "total": 376790
        },
        2026: {
            "owner_compensation_addback": 186028,
            "personal_expenses": 93014,
            "one_time_costs": 55808,
            "synergies_network": 93014,
            "total": 427864
        },
        2027: {
            "owner_compensation_addback": 213599,
            "personal_expenses": 106799,
            "one_time_costs": 64080,
            "synergies_network": 106799,
            "total": 491277
        }
    }
    
    # Industry benchmarks (from user's research)
    industry_multiples = {
        "ev_ebitda": (5.0, 8.0),  # 5-8x EBITDA for mid-sized medspas
        "ev_revenue": (1.5, 3.2),  # Typical revenue multiples
        "price_earnings": (12.0, 18.0)
    }
    
    industry_margins = {
        "gross_margin": (0.71, 0.75),  # 71-75% gross margins
        "ebitda_margin": (0.20, 0.25),  # 20-25% EBITDA margins
        "adjusted_ebitda_margin": (0.22, 0.26)  # 22-26% after adjustments
    }
    
    growth_benchmarks = {
        "cagr_range_low": 0.11,  # 11% CAGR (low end)
        "cagr_range_high": 0.15,  # 15% CAGR (high end)
        "medp_growth": 0.14,  # MEDP benchmark growth
        "avg_industry_growth": 0.13  # Average industry growth
    }
    
    # Synergy potential under CPP ownership
    synergy_profile = {
        "operational_efficiencies": 0.08,  # 8% from network efficiencies
        "bulk_purchasing": 0.05,  # 5% from volume discounts
        "marketing_optimization": 0.04,  # 4% from shared marketing
        "technology_integration": 0.06,  # 6% from EMR/systems
        "cross_selling": 0.07,  # 7% from service expansion
        "total_potential": 0.30  # 30% total synergies
    }
    
    return CPPMedspaCase(
        case_name="Hypothetical Mid-Sized Medical Aesthetic Clinic",
        location="Urban US Location (Physician-Owned)",
        physician_owned=True,
        target_profile="CPP Acquisition Target - Profitable Growth",
        revenue_projections=revenue_projections,
        expense_projections=expense_projections,
        cpp_adjustments=cpp_adjustments,
        industry_multiples=industry_multiples,
        industry_margins=industry_margins,
        growth_benchmarks=growth_benchmarks,
        synergy_profile=synergy_profile,
        monte_carlo_runs=1000,
        confidence_interval=0.95
    )

def create_service_lines_from_case(case: CPPMedspaCase) -> List[ServiceLine]:
    """
    Convert case study data to EPV ServiceLine format
    Based on 2025 projections (middle year)
    """
    
    # Use 2025 as base year for service line configuration
    base_year = 2025
    revenue_2025 = case.revenue_projections[base_year]
    
    # Calculate implied volumes based on industry pricing benchmarks
    service_lines = []
    
    # Injectables (45% of revenue)
    injectables_revenue = revenue_2025["injectables"]
    # Assume $650 average per treatment (Botox + Fillers combined)
    injectables_volume = int(injectables_revenue / 650)
    service_lines.append(ServiceLine(
        id="injectables",
        name="Injectables (Botox/Fillers)",
        price=650,
        volume=injectables_volume,
        cogs_pct=0.28,  # High-margin injectables
        kind="service",
        growth_rate=0.14  # 14% annual growth
    ))
    
    # Laser and Treatments (25% of revenue)
    laser_revenue = revenue_2025["lasers_treatments"]
    # Assume $1200 average per laser treatment
    laser_volume = int(laser_revenue / 1200)
    service_lines.append(ServiceLine(
        id="lasers",
        name="Laser & Advanced Treatments",
        price=1200,
        volume=laser_volume,
        cogs_pct=0.22,  # Lower COGS for laser treatments
        kind="service",
        growth_rate=0.12  # 12% annual growth
    ))
    
    # Memberships (20% of revenue)
    membership_revenue = revenue_2025["memberships"]
    # Assume $299 annual membership
    membership_volume = int(membership_revenue / 299)
    service_lines.append(ServiceLine(
        id="memberships",
        name="Annual Memberships",
        price=299,
        volume=membership_volume,
        cogs_pct=0.10,  # Very low COGS for memberships
        kind="service",
        growth_rate=0.15  # 15% growth (highest margin)
    ))
    
    # Other Services (10% of revenue)
    other_revenue = revenue_2025["other_services"]
    # Assume $450 average for consultations/other services
    other_volume = int(other_revenue / 450)
    service_lines.append(ServiceLine(
        id="other_services",
        name="Consultations & Other Services",
        price=450,
        volume=other_volume,
        cogs_pct=0.15,  # Moderate COGS
        kind="service",
        growth_rate=0.10  # 10% growth
    ))
    
    return service_lines

def calculate_epv_inputs_from_case(case: CPPMedspaCase) -> EPVInputs:
    """
    Convert case study to EPV system inputs
    """
    
    service_lines = create_service_lines_from_case(case)
    
    # Calculate weighted averages from 5-year projections
    total_revenue_avg = np.mean([case.revenue_projections[year]["total"] for year in range(2023, 2028)])
    total_expenses_avg = np.mean([case.expense_projections[year]["total"] for year in range(2023, 2028)])
    total_adjustments_avg = np.mean([case.cpp_adjustments[year]["total"] for year in range(2023, 2028)])
    
    # Derive cost structure percentages
    avg_salaries = np.mean([case.expense_projections[year]["salaries_benefits"] for year in range(2023, 2028)])
    avg_marketing = np.mean([case.expense_projections[year]["marketing"] for year in range(2023, 2028)])
    avg_admin = np.mean([case.expense_projections[year]["administrative"] for year in range(2023, 2028)])
    avg_other = np.mean([case.expense_projections[year]["other_expenses"] for year in range(2023, 2028)])
    
    clinical_labor_pct = avg_salaries / total_revenue_avg
    marketing_pct = avg_marketing / total_revenue_avg
    admin_pct = avg_admin / total_revenue_avg
    other_opex_pct = avg_other / total_revenue_avg
    
    # Fixed costs (derived from rent_utilities category)
    avg_rent_utilities = np.mean([case.expense_projections[year]["rent_utilities"] for year in range(2023, 2028)])
    
    # Owner add-backs
    avg_owner_addback = np.mean([case.cpp_adjustments[year]["owner_compensation_addback"] for year in range(2023, 2028)])
    avg_other_addback = np.mean([
        case.cpp_adjustments[year]["personal_expenses"] + 
        case.cpp_adjustments[year]["one_time_costs"] for year in range(2023, 2028)
    ])
    
    # Asset base for mid-sized clinic
    buildout_improvements = 850000  # Higher than default for mid-sized
    equipment_devices = 650000     # Significant laser/equipment investment
    
    return EPVInputs(
        service_lines=service_lines,
        use_real_data=False,
        
        # Cost structure (derived from case data)
        clinical_labor_pct=clinical_labor_pct,
        marketing_pct=marketing_pct,
        admin_pct=admin_pct,
        other_opex_pct=other_opex_pct,
        
        # Fixed costs
        rent_annual=avg_rent_utilities,
        med_director_annual=45000,  # Estimated for mid-sized clinic
        insurance_annual=24000,
        software_annual=30000,  # Higher for integrated systems
        utilities_annual=18000,
        
        # Adjustments
        owner_add_back=avg_owner_addback,
        other_add_back=avg_other_addback,
        da_annual=95000,  # Estimated D&A for mid-sized clinic
        
        # Working capital (optimized for aesthetic clinic)
        dso_days=8,   # Slightly higher for payment plans
        dsi_days=35,  # Inventory for supplies
        dpo_days=25,  # Vendor payment terms
        
        # Capital structure
        cash_non_operating=180000,  # Working capital buffer
        debt_interest_bearing=950000,  # Moderate debt level
        
        # WACC components (adjusted for mid-sized medispa)
        tax_rate=0.25,
        rf_rate=0.042,
        mrp=0.055,
        beta=1.15,  # Slightly higher beta for mid-sized
        size_premium=0.035,  # Medium-sized premium
        specific_premium=0.005,  # Low specific risk (physician-owned)
        cost_debt=0.075,
        target_debt_weight=0.30,
        
        # Asset reproduction (higher for mid-sized)
        buildout_improvements=buildout_improvements,
        equipment_devices=equipment_devices,
        ffne=180000,
        startup_intangibles=150000,
        
        # Advanced settings
        epv_method="Owner Earnings"
    )

def run_monte_carlo_analysis(case: CPPMedspaCase, base_inputs: EPVInputs) -> Dict:
    """
    Run Monte Carlo simulation with uncertainty parameters
    """
    
    np.random.seed(42)  # For reproducible results
    results = []
    
    print(f"Running Monte Carlo simulation with {case.monte_carlo_runs} iterations...")
    
    for i in range(case.monte_carlo_runs):
        # Create variation in key parameters
        varied_inputs = EPVInputs(**asdict(base_inputs))
        
        # Revenue variance (±3%)
        revenue_factor = np.random.uniform(0.97, 1.03)
        varied_inputs.service_lines = [
            ServiceLine(
                id=sl.id,
                name=sl.name,
                price=sl.price * revenue_factor,
                volume=sl.volume,
                cogs_pct=sl.cogs_pct * np.random.uniform(0.95, 1.05),  # COGS variance
                kind=sl.kind,
                growth_rate=sl.growth_rate
            ) for sl in base_inputs.service_lines
        ]
        
        # Cost structure variance (±2%)
        varied_inputs.clinical_labor_pct *= np.random.uniform(0.98, 1.02)
        varied_inputs.marketing_pct *= np.random.uniform(0.98, 1.02)
        varied_inputs.admin_pct *= np.random.uniform(0.98, 1.02)
        
        # WACC variance (±0.5%)
        varied_inputs.beta *= np.random.uniform(0.95, 1.05)
        varied_inputs.size_premium *= np.random.uniform(0.9, 1.1)
        
        try:
            # Run EPV calculation
            outputs = compute_unified_epv(varied_inputs)
            
            results.append({
                'enterprise_epv': outputs.enterprise_epv,
                'equity_epv': outputs.equity_epv,
                'ebitda_normalized': outputs.ebitda_normalized,
                'ev_ebitda_multiple': outputs.ev_to_ebitda,
                'franchise_ratio': outputs.franchise_ratio,
                'total_revenue': outputs.total_revenue
            })
            
        except Exception as e:
            print(f"Error in iteration {i}: {e}")
            continue
    
    # Calculate statistics
    df_results = pd.DataFrame(results)
    
    confidence_level = case.confidence_interval
    alpha = (1 - confidence_level) / 2
    
    stats = {}
    for column in df_results.columns:
        values = df_results[column].dropna()
        if len(values) > 0:
            stats[column] = {
                'mean': values.mean(),
                'median': values.median(),
                'std': values.std(),
                'min': values.min(),
                'max': values.max(),
                'ci_lower': values.quantile(alpha),
                'ci_upper': values.quantile(1 - alpha),
                'cv': values.std() / values.mean() if values.mean() != 0 else 0
            }
    
    return {
        'raw_results': df_results,
        'statistics': stats,
        'successful_runs': len(results),
        'total_runs': case.monte_carlo_runs
    }

def calculate_multiples_valuation(case: CPPMedspaCase) -> Dict:
    """
    Calculate valuation using industry multiples
    """
    
    # Use 3-year average adjusted EBITDA
    years = [2025, 2026, 2027]  # Forward-looking
    avg_revenue = np.mean([case.revenue_projections[year]["total"] for year in years])
    
    # Calculate raw EBITDA
    avg_raw_ebitda = np.mean([
        case.revenue_projections[year]["total"] - case.expense_projections[year]["total"]
        for year in years
    ])
    
    # Add adjustments for normalized EBITDA
    avg_adjustments = np.mean([case.cpp_adjustments[year]["total"] for year in years])
    avg_adjusted_ebitda = avg_raw_ebitda + avg_adjustments
    
    # Apply industry multiples
    multiples_val = {}
    
    # EV/EBITDA range
    ev_ebitda_low = avg_adjusted_ebitda * case.industry_multiples["ev_ebitda"][0]
    ev_ebitda_high = avg_adjusted_ebitda * case.industry_multiples["ev_ebitda"][1]
    ev_ebitda_mid = avg_adjusted_ebitda * np.mean(case.industry_multiples["ev_ebitda"])
    
    multiples_val["ev_ebitda"] = {
        "low": ev_ebitda_low,
        "mid": ev_ebitda_mid,
        "high": ev_ebitda_high,
        "multiple_low": case.industry_multiples["ev_ebitda"][0],
        "multiple_high": case.industry_multiples["ev_ebitda"][1]
    }
    
    # EV/Revenue range
    ev_revenue_low = avg_revenue * case.industry_multiples["ev_revenue"][0]
    ev_revenue_high = avg_revenue * case.industry_multiples["ev_revenue"][1]
    ev_revenue_mid = avg_revenue * np.mean(case.industry_multiples["ev_revenue"])
    
    multiples_val["ev_revenue"] = {
        "low": ev_revenue_low,
        "mid": ev_revenue_mid,
        "high": ev_revenue_high,
        "multiple_low": case.industry_multiples["ev_revenue"][0],
        "multiple_high": case.industry_multiples["ev_revenue"][1]
    }
    
    # Summary metrics
    multiples_val["summary"] = {
        "avg_revenue": avg_revenue,
        "avg_raw_ebitda": avg_raw_ebitda,
        "avg_adjusted_ebitda": avg_adjusted_ebitda,
        "avg_adjustments": avg_adjustments,
        "ebitda_margin": avg_adjusted_ebitda / avg_revenue,
        "years_analyzed": years
    }
    
    return multiples_val

def generate_comprehensive_report(case: CPPMedspaCase, epv_inputs: EPVInputs, 
                                epv_outputs, monte_carlo_results: Dict, 
                                multiples_valuation: Dict) -> str:
    """
    Generate comprehensive valuation report
    """
    
    report = f"""
# CPP MEDICAL AESTHETIC CLINIC VALUATION ANALYSIS
## {case.case_name}

### EXECUTIVE SUMMARY
**Target Profile:** {case.target_profile}
**Location:** {case.location}
**Analysis Date:** {datetime.now().strftime('%B %d, %Y')}

### FINANCIAL OVERVIEW (5-Year Projections)

**Revenue Growth Analysis:**
"""
    
    # Add revenue growth analysis
    for year in range(2023, 2028):
        if year in case.revenue_projections:
            rev_data = case.revenue_projections[year]
            report += f"- {year}: ${rev_data['total']:,.0f} total revenue\n"
            if year > 2023:
                prev_year = case.revenue_projections[year-1]['total']
                growth = (rev_data['total'] / prev_year - 1) * 100
                report += f"  • YoY Growth: {growth:.1f}%\n"
    
    # Add EBITDA analysis
    report += f"\n**Profitability Analysis:**\n"
    for year in range(2023, 2028):
        if year in case.revenue_projections and year in case.expense_projections:
            revenue = case.revenue_projections[year]["total"]
            expenses = case.expense_projections[year]["total"]
            raw_ebitda = revenue - expenses
            adjustments = case.cpp_adjustments[year]["total"]
            adj_ebitda = raw_ebitda + adjustments
            
            report += f"- {year}: Raw EBITDA ${raw_ebitda:,.0f} ({raw_ebitda/revenue*100:.1f}%), "
            report += f"Adjusted EBITDA ${adj_ebitda:,.0f} ({adj_ebitda/revenue*100:.1f}%)\n"
    
    # EPV Analysis
    report += f"""
### EPV VALUATION ANALYSIS

**Enterprise Valuation:**
- Enterprise EPV: ${epv_outputs.enterprise_epv:,.0f}
- Equity EPV: ${epv_outputs.equity_epv:,.0f}
- EV/Revenue Multiple: {epv_outputs.ev_to_revenue:.2f}x
- EV/EBITDA Multiple: {epv_outputs.ev_to_ebitda:.2f}x
- Franchise Ratio: {epv_outputs.franchise_ratio:.2f}

**Key Metrics:**
- Total Revenue: ${epv_outputs.total_revenue:,.0f}
- Normalized EBITDA: ${epv_outputs.ebitda_normalized:,.0f}
- EBIT Margin: {epv_outputs.ebit_margin*100:.1f}%
- WACC: {epv_outputs.wacc*100:.2f}%
"""
    
    # Monte Carlo Results
    if monte_carlo_results['successful_runs'] > 0:
        mc_stats = monte_carlo_results['statistics']
        epv_stats = mc_stats.get('enterprise_epv', {})
        
        report += f"""
### MONTE CARLO RISK ANALYSIS
**Simulation Results:** {monte_carlo_results['successful_runs']:,} successful runs

**Enterprise Value Distribution:**
- Mean: ${epv_stats.get('mean', 0):,.0f}
- Median: ${epv_stats.get('median', 0):,.0f}
- Standard Deviation: ${epv_stats.get('std', 0):,.0f}
- {case.confidence_interval*100:.0f}% Confidence Interval: ${epv_stats.get('ci_lower', 0):,.0f} - ${epv_stats.get('ci_upper', 0):,.0f}
- Coefficient of Variation: {epv_stats.get('cv', 0)*100:.1f}%
"""
    
    # Industry Multiples Analysis
    multiples_summary = multiples_valuation['summary']
    ev_ebitda_mult = multiples_valuation['ev_ebitda']
    
    report += f"""
### INDUSTRY MULTIPLES VALUATION

**Market Comparables Analysis:**
- 3-Year Avg Revenue: ${multiples_summary['avg_revenue']:,.0f}
- 3-Year Avg Adjusted EBITDA: ${multiples_summary['avg_adjusted_ebitda']:,.0f}
- EBITDA Margin: {multiples_summary['ebitda_margin']*100:.1f}%

**EV/EBITDA Valuation Range:**
- Low ({ev_ebitda_mult['multiple_low']:.1f}x): ${ev_ebitda_mult['low']:,.0f}
- Mid ({np.mean([ev_ebitda_mult['multiple_low'], ev_ebitda_mult['multiple_high']]):.1f}x): ${ev_ebitda_mult['mid']:,.0f}
- High ({ev_ebitda_mult['multiple_high']:.1f}x): ${ev_ebitda_mult['high']:,.0f}
"""
    
    # Synergy Analysis
    report += f"""
### CPP SYNERGY POTENTIAL

**Network Integration Benefits:**
- Operational Efficiencies: {case.synergy_profile['operational_efficiencies']*100:.0f}%
- Bulk Purchasing Power: {case.synergy_profile['bulk_purchasing']*100:.0f}%
- Marketing Optimization: {case.synergy_profile['marketing_optimization']*100:.0f}%
- Technology Integration: {case.synergy_profile['technology_integration']*100:.0f}%
- Cross-Selling Opportunities: {case.synergy_profile['cross_selling']*100:.0f}%

**Total Synergy Potential: {case.synergy_profile['total_potential']*100:.0f}%**

**Pro Forma Synergized EBITDA:**
- Current 3-Year Avg: ${multiples_summary['avg_adjusted_ebitda']:,.0f}
- With Full Synergies: ${multiples_summary['avg_adjusted_ebitda'] * (1 + case.synergy_profile['total_potential']):,.0f}
- Synergy Value Creation: ${multiples_summary['avg_adjusted_ebitda'] * case.synergy_profile['total_potential']:,.0f}
"""
    
    # Investment Recommendation
    avg_ev_ebitda = np.mean([ev_ebitda_mult['low'], ev_ebitda_mult['high']])
    epv_premium_discount = (epv_outputs.enterprise_epv / avg_ev_ebitda - 1) * 100
    
    report += f"""
### INVESTMENT RECOMMENDATION

**Valuation Summary:**
- EPV Enterprise Value: ${epv_outputs.enterprise_epv:,.0f}
- Industry Multiple Range: ${ev_ebitda_mult['low']:,.0f} - ${ev_ebitda_mult['high']:,.0f}
- EPV vs. Multiples: {epv_premium_discount:+.1f}% difference to midpoint

**Key Investment Merits:**
✓ Physician-owned clinic with established patient base
✓ Strong growth trajectory ({case.growth_benchmarks['avg_industry_growth']*100:.0f}% industry CAGR)
✓ High-margin service mix (injectables {(case.revenue_projections[2025]['injectables']/case.revenue_projections[2025]['total'])*100:.0f}%)
✓ Significant synergy potential under CPP platform
✓ Positioned in defensive healthcare aesthetic market

**Risk Factors:**
• Regulatory changes in medical aesthetics
• Competition from franchise/corporate chains
• Key person dependency (physician owner)
• Market saturation in core services
• Economic sensitivity of discretionary spending

**Recommendation:** PROCEED with due diligence. Target represents attractive CPP acquisition profile with strong fundamentals and meaningful synergy upside.
"""
    
    return report

def main():
    """
    Main execution function for CPP medispa simulation
    """
    
    print("=" * 60)
    print("CPP MEDICAL AESTHETIC CLINIC SIMULATION")
    print("Comprehensive Valuation Analysis - 2025 Focus")
    print("=" * 60)
    
    # Create case study
    print("\n1. Loading case study data...")
    case = create_cpp_medispa_case()
    print(f"   Case: {case.case_name}")
    print(f"   Profile: {case.target_profile}")
    
    # Convert to EPV inputs
    print("\n2. Converting to EPV system format...")
    epv_inputs = calculate_epv_inputs_from_case(case)
    print(f"   Service lines configured: {len(epv_inputs.service_lines)}")
    
    # Run base EPV calculation
    print("\n3. Running EPV calculation...")
    try:
        epv_outputs = compute_unified_epv(epv_inputs)
        print(f"   Enterprise EPV: ${epv_outputs.enterprise_epv:,.0f}")
        print(f"   EV/EBITDA Multiple: {epv_outputs.ev_to_ebitda:.2f}x")
    except Exception as e:
        print(f"   Error in EPV calculation: {e}")
        return
    
    # Run Monte Carlo analysis
    print("\n4. Running Monte Carlo simulation...")
    monte_carlo_results = run_monte_carlo_analysis(case, epv_inputs)
    mc_success_rate = monte_carlo_results['successful_runs'] / monte_carlo_results['total_runs'] * 100
    print(f"   Successful runs: {monte_carlo_results['successful_runs']:,} ({mc_success_rate:.1f}%)")
    
    if monte_carlo_results['successful_runs'] > 0:
        epv_stats = monte_carlo_results['statistics'].get('enterprise_epv', {})
        print(f"   Mean Enterprise Value: ${epv_stats.get('mean', 0):,.0f}")
        print(f"   95% Confidence Interval: ${epv_stats.get('ci_lower', 0):,.0f} - ${epv_stats.get('ci_upper', 0):,.0f}")
    
    # Calculate multiples valuation
    print("\n5. Calculating industry multiples valuation...")
    multiples_valuation = calculate_multiples_valuation(case)
    ev_ebitda_range = multiples_valuation['ev_ebitda']
    print(f"   EV/EBITDA Range: ${ev_ebitda_range['low']:,.0f} - ${ev_ebitda_range['high']:,.0f}")
    print(f"   Midpoint: ${ev_ebitda_range['mid']:,.0f}")
    
    # Generate comprehensive report
    print("\n6. Generating comprehensive report...")
    report = generate_comprehensive_report(
        case, epv_inputs, epv_outputs, monte_carlo_results, multiples_valuation
    )
    
    # Save report
    report_filename = f"cpp_medispa_valuation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(report_filename, 'w') as f:
        f.write(report)
    
    print(f"   Report saved as: {report_filename}")
    
    # Save detailed results
    results_data = {
        'case_study': asdict(case),
        'epv_inputs': asdict(epv_inputs),
        'epv_outputs': {
            'enterprise_epv': epv_outputs.enterprise_epv,
            'equity_epv': epv_outputs.equity_epv,
            'total_revenue': epv_outputs.total_revenue,
            'ebitda_normalized': epv_outputs.ebitda_normalized,
            'ev_to_ebitda': epv_outputs.ev_to_ebitda,
            'ev_to_revenue': epv_outputs.ev_to_revenue,
            'franchise_ratio': epv_outputs.franchise_ratio,
            'wacc': epv_outputs.wacc
        },
        'monte_carlo_statistics': monte_carlo_results['statistics'],
        'multiples_valuation': multiples_valuation
    }
    
    results_filename = f"cpp_medispa_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_filename, 'w') as f:
        json.dump(results_data, f, indent=2, default=str)
    
    print(f"   Detailed results saved as: {results_filename}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("VALUATION SUMMARY")
    print("=" * 60)
    print(f"Enterprise EPV:          ${epv_outputs.enterprise_epv:,.0f}")
    print(f"Equity EPV:              ${epv_outputs.equity_epv:,.0f}")
    print(f"EV/EBITDA Multiple:      {epv_outputs.ev_to_ebitda:.2f}x")
    print(f"Industry Range:          ${ev_ebitda_range['low']:,.0f} - ${ev_ebitda_range['high']:,.0f}")
    
    if monte_carlo_results['successful_runs'] > 0:
        epv_stats = monte_carlo_results['statistics'].get('enterprise_epv', {})
        print(f"Monte Carlo Mean:        ${epv_stats.get('mean', 0):,.0f}")
        print(f"95% Confidence Interval: ${epv_stats.get('ci_lower', 0):,.0f} - ${epv_stats.get('ci_upper', 0):,.0f}")
    
    print("\nAnalysis complete. Review generated reports for detailed findings.")

if __name__ == "__main__":
    main() 