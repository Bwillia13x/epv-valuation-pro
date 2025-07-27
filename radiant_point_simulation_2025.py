#!/usr/bin/env python3
"""
Radiant Point Aesthetics Simulation - Austin, TX
Comprehensive broker-style case analysis with quarterly data
Single-site MedSpa with strong growth trajectory and injectables focus
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
    """Complete Radiant Point Aesthetics case study data structure"""
    case_name: str
    location: str
    site_profile: str
    service_focus: str
    
    # Target overview
    target_overview: Dict[str, any]
    
    # Quarterly financial data
    quarterly_data: pd.DataFrame
    
    # Operating metrics
    operating_metrics: pd.DataFrame
    
    # Balance sheet snapshot
    balance_sheet: Dict[str, float]
    
    # Normalizations and adjustments
    normalizations: Dict[str, Dict[str, any]]
    
    # Service mix breakdown
    service_mix: Dict[str, Dict[str, any]]
    
    # Comparable transactions
    comp_transactions: List[Dict[str, any]]

def create_radiant_point_case() -> RadiantPointCase:
    """
    Create the comprehensive Radiant Point Aesthetics case study
    """
    
    # Target overview
    target_overview = {
        "name": "Radiant Point Aesthetics, LLC",
        "location": "Austin, TX",
        "site_type": "Single-site",
        "treatment_rooms": 6,
        "staff": {
            "injectors": 2,  # MD + NP
            "laser_tech": 1,
            "estheticians": 2,
            "active_patients": 24000
        },
        "equipment": {
            "lasers": 2,  # Purchased 2023
            "rf_microneedling": 1,
            "purchase_year": 2023
        },
        "operational_highlights": [
            "Online booking system",
            "EMR integrated",
            "24k active patient file",
            "Low churn rate",
            "Strong referral flywheel",
            "CRM-driven recalls"
        ],
        "recent_improvements": [
            "Added NP injector (Q3-24)",
            "Expanded operating hours",
            "Revamped pre-consult materials"
        ]
    }
    
    # Quarterly financial data
    quarterly_data = pd.DataFrame({
        'Quarter': ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2'],
        'Revenue': [1470000, 1545000, 1605000, 1685000, 1830000, 1920000],
        'Product_COGS': [213150, 224025, 232725, 244325, 265350, 278400],
        'Provider_COGS': [154350, 162225, 168525, 176925, 192150, 201600],
        'GP': [1102500, 1158750, 1203750, 1263750, 1372500, 1440000],
        'Rent': [78000, 78000, 78000, 78000, 78000, 78000],
        'Marketing': [102900, 108150, 112350, 117950, 128100, 134400],
        'Admin_Salaries': [450000, 450000, 450000, 450000, 450000, 450000],
        'Other_Opex': [176400, 185400, 192600, 202200, 219600, 230400],
        'OneTime': [0, 80000, 40000, 0, 0, 0],
        'EBITDA_Reported': [296700, 257200, 330800, 415600, 497300, 547200]
    })
    
    # Operating metrics
    operating_metrics = pd.DataFrame({
        'Quarter': ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2'],
        'Visits': [2722, 2861, 2972, 3120, 3268, 3429],
        'Avg_Ticket': [540, 540, 540, 540, 560, 560],
        'Injector_Hours': [1300, 1350, 1400, 1450, 1520, 1580],
        'Room_Utilization': [0.70, 0.73, 0.75, 0.78, 0.81, 0.84]
    })
    
    # Balance sheet snapshot (as of Jun-30-2025)
    balance_sheet = {
        "cash": 200000,
        "accounts_receivable": 193000,  # ~10 days sales
        "inventory": 168000,  # ~60 days product COGS
        "accounts_payable": 331000,  # ~35 days total COGS
        "term_debt": 950000,  # 8.5% fixed, maturity 2029
        "capital_leases": 85000,
        "net_debt": 835000,
        "dso_days": 10,
        "dsi_days": 60,
        "dpo_days": 35
    }
    
    # Normalizations and adjustments
    normalizations = {
        "owner_salary_above_market": {
            "amount": 120000,
            "direction": "+",
            "notes": "Replace with market GM compensation"
        },
        "emr_migration": {
            "amount": 80000,
            "direction": "+",
            "notes": "Non-recurring Q2-2024"
        },
        "legal_settlement": {
            "amount": 40000,
            "direction": "+",
            "notes": "Non-recurring Q3-2024"
        },
        "rent_to_market": {
            "amount": 48000,
            "direction": "-",
            "notes": "Recorded $26k/mo; market $30k/mo"
        }
    }
    
    # Service mix breakdown (TTM)
    service_mix = {
        "injectables": {
            "share": 0.72,
            "revenue_ttm": 7040000 * 0.72,
            "notes": "Botox, Dysport, HA fillers"
        },
        "laser_devices": {
            "share": 0.13,
            "revenue_ttm": 7040000 * 0.13,
            "notes": "IPL, laser hair removal, RF microneedling"
        },
        "facials_peels": {
            "share": 0.10,
            "revenue_ttm": 7040000 * 0.10,
            "notes": "Membership program"
        },
        "retail": {
            "share": 0.05,
            "revenue_ttm": 7040000 * 0.05,
            "notes": "Skincare products"
        }
    }
    
    # Comparable transactions
    comp_transactions = [
        {
            "deal_type": "Single-site injectables",
            "size_category": "Sub-$1M EBITDA",
            "ev_ebitda_low": 7.5,
            "ev_ebitda_high": 9.0,
            "comment": "Scale discount typical"
        },
        {
            "deal_type": "2-3 sites regional", 
            "size_category": "$1-3M EBITDA",
            "ev_ebitda_low": 8.5,
            "ev_ebitda_high": 10.0,
            "comment": "Better process maturity"
        }
    ]
    
    return RadiantPointCase(
        case_name="Radiant Point Aesthetics, LLC",
        location="Austin, TX",
        site_profile="Single-site MedSpa",
        service_focus="Injectables-led (72%)",
        target_overview=target_overview,
        quarterly_data=quarterly_data,
        operating_metrics=operating_metrics,
        balance_sheet=balance_sheet,
        normalizations=normalizations,
        service_mix=service_mix,
        comp_transactions=comp_transactions
    )

def calculate_adjusted_ebitda(case: RadiantPointCase) -> Dict[str, float]:
    """
    Calculate EBITDA bridge from reported to adjusted
    """
    
    # Get TTM EBITDA (last 4 quarters)
    ttm_ebitda_reported = case.quarterly_data['EBITDA_Reported'].tail(4).sum()
    
    # Apply normalizations
    adjustments = {}
    adjusted_ebitda = ttm_ebitda_reported
    
    for adj_name, adj_data in case.normalizations.items():
        amount = adj_data['amount']
        direction = adj_data['direction']
        
        if direction == '+':
            adjusted_ebitda += amount
            adjustments[adj_name] = amount
        else:
            adjusted_ebitda -= amount
            adjustments[adj_name] = -amount
    
    # Calculate TTM revenue
    ttm_revenue = case.quarterly_data['Revenue'].tail(4).sum()
    
    return {
        'ttm_revenue': ttm_revenue,
        'ttm_ebitda_reported': ttm_ebitda_reported,
        'adjustments': adjustments,
        'ttm_ebitda_adjusted': adjusted_ebitda,
        'adjusted_margin': adjusted_ebitda / ttm_revenue,
        'ebitda_bridge': {
            'reported': ttm_ebitda_reported,
            'owner_salary_addback': adjustments.get('owner_salary_above_market', 0),
            'emr_migration_addback': adjustments.get('emr_migration', 0),
            'legal_settlement_addback': adjustments.get('legal_settlement', 0),
            'rent_normalization': adjustments.get('rent_to_market', 0),
            'adjusted': adjusted_ebitda
        }
    }

def create_service_lines_from_radiant_point(case: RadiantPointCase) -> List[ServiceLine]:
    """
    Convert Radiant Point data to EPV ServiceLine format
    Based on TTM performance and service mix breakdown
    """
    
    service_lines = []
    ttm_revenue = case.quarterly_data['Revenue'].tail(4).sum()
    
    # Calculate average ticket and volumes from operating metrics
    avg_ticket_recent = case.operating_metrics['Avg_Ticket'].iloc[-1]  # $560
    total_visits_ttm = case.operating_metrics['Visits'].tail(4).sum()  # Last 4 quarters
    
    # Injectables (72% of revenue)
    injectables_revenue = ttm_revenue * 0.72
    # Higher ticket for injectables (estimate $750 avg)
    injectables_avg_ticket = 750
    injectables_volume = int(injectables_revenue / injectables_avg_ticket)
    service_lines.append(ServiceLine(
        id="injectables",
        name="Injectables (Botox/Dysport/Fillers)",
        price=injectables_avg_ticket,
        volume=injectables_volume,
        cogs_pct=0.145,  # 14.5% product COGS
        kind="service",
        growth_rate=0.16  # Strong growth trajectory
    ))
    
    # Laser/Devices (13% of revenue)
    laser_revenue = ttm_revenue * 0.13
    laser_avg_ticket = 850  # Higher ticket for laser treatments
    laser_volume = int(laser_revenue / laser_avg_ticket)
    service_lines.append(ServiceLine(
        id="laser_devices",
        name="Laser & Device Treatments",
        price=laser_avg_ticket,
        volume=laser_volume,
        cogs_pct=0.08,  # Lower COGS for device treatments
        kind="service",
        growth_rate=0.12
    ))
    
    # Facials/Peels (10% of revenue) - Membership program
    facials_revenue = ttm_revenue * 0.10
    facials_avg_ticket = 250  # Lower ticket, membership-based
    facials_volume = int(facials_revenue / facials_avg_ticket)
    service_lines.append(ServiceLine(
        id="facials_peels",
        name="Facials & Peels (Membership)",
        price=facials_avg_ticket,
        volume=facials_volume,
        cogs_pct=0.12,  # Moderate COGS
        kind="service",
        growth_rate=0.10
    ))
    
    # Retail (5% of revenue)
    retail_revenue = ttm_revenue * 0.05
    retail_avg_ticket = 150  # Skincare products
    retail_volume = int(retail_revenue / retail_avg_ticket)
    service_lines.append(ServiceLine(
        id="retail",
        name="Skincare Products",
        price=retail_avg_ticket,
        volume=retail_volume,
        cogs_pct=0.45,  # Higher COGS for retail
        kind="retail",
        growth_rate=0.08
    ))
    
    return service_lines

def calculate_epv_inputs_from_radiant_point(case: RadiantPointCase) -> EPVInputs:
    """
    Convert Radiant Point case to EPV system inputs
    """
    
    service_lines = create_service_lines_from_radiant_point(case)
    ebitda_analysis = calculate_adjusted_ebitda(case)
    
    # Calculate cost structure percentages from actual data
    ttm_data = case.quarterly_data.tail(4)  # Last 4 quarters
    ttm_revenue = ttm_data['Revenue'].sum()
    ttm_provider_comp = ttm_data['Provider_COGS'].sum()
    ttm_marketing = ttm_data['Marketing'].sum()
    ttm_admin = ttm_data['Admin_Salaries'].sum()
    ttm_other_opex = ttm_data['Other_Opex'].sum()
    ttm_rent = ttm_data['Rent'].sum()
    
    # Calculate percentages
    clinical_labor_pct = ttm_provider_comp / ttm_revenue  # 10.5%
    marketing_pct = ttm_marketing / ttm_revenue  # 7%
    admin_pct = (ttm_admin - 120000) / ttm_revenue  # Admin minus owner excess comp
    other_opex_pct = ttm_other_opex / ttm_revenue  # 12%
    
    # Fixed costs
    rent_annual = case.balance_sheet["cash"] * 0.1 + 48000  # Market rent adjustment
    
    # Normalizations
    owner_add_back = case.normalizations["owner_salary_above_market"]["amount"]
    other_add_back = (case.normalizations["emr_migration"]["amount"] + 
                     case.normalizations["legal_settlement"]["amount"]) / 4  # Annualized
    
    return EPVInputs(
        service_lines=service_lines,
        use_real_data=False,
        
        # Cost structure (from actual data)
        clinical_labor_pct=clinical_labor_pct,
        marketing_pct=marketing_pct,
        admin_pct=admin_pct,
        other_opex_pct=other_opex_pct,
        
        # Fixed costs (adjusted for normalizations)
        rent_annual=312000 + 48000,  # Market rent
        med_director_annual=0,  # Included in provider comp
        insurance_annual=45000,  # Estimated from other opex
        software_annual=36000,   # EMR and other systems
        utilities_annual=24000,
        
        # Adjustments
        owner_add_back=owner_add_back,
        other_add_back=other_add_back,
        da_annual=60000,  # Estimated based on CapEx history
        
        # Working capital (from balance sheet)
        dso_days=case.balance_sheet["dso_days"],
        dsi_days=case.balance_sheet["dsi_days"],
        dpo_days=case.balance_sheet["dpo_days"],
        
        # Capital structure
        cash_non_operating=case.balance_sheet["cash"],
        debt_interest_bearing=case.balance_sheet["term_debt"],
        
        # WACC components (Austin market, single-site)
        tax_rate=0.25,
        rf_rate=0.045,  # Current environment
        mrp=0.055,
        beta=1.2,  # Higher beta for single-site
        size_premium=0.045,  # Significant size premium
        specific_premium=0.015,  # Single-site, key person risk
        cost_debt=0.085,  # Given in case
        target_debt_weight=0.40,
        
        # Asset reproduction (single-site MedSpa)
        buildout_improvements=900000,  # Austin market buildout
        equipment_devices=400000,  # 2 lasers + RF device
        ffne=120000,
        startup_intangibles=180000,  # Brand, systems, patient base
        
        # Advanced settings
        epv_method="Owner Earnings"
    )

def calculate_irr_analysis(case: RadiantPointCase, enterprise_value: float) -> Dict:
    """
    Calculate IRR analysis with 5-year hold assumptions
    """
    
    ebitda_analysis = calculate_adjusted_ebitda(case)
    current_ebitda = ebitda_analysis['ttm_ebitda_adjusted']
    
    # Entry assumptions
    entry_multiple = 8.5  # Base case
    entry_ev = current_ebitda * entry_multiple
    equity_investment = entry_ev - case.balance_sheet["net_debt"]
    
    # Debt assumptions (70-75% LTV at SOFR+350 or 8.5% proxy)
    debt_to_ev_ratio = 0.70
    debt_amount = entry_ev * debt_to_ev_ratio
    equity_investment_levered = entry_ev - debt_amount
    
    # 5-year projection assumptions
    growth_rates = [0.15, 0.12, 0.10, 0.08, 0.06]  # Declining growth
    ebitda_projections = []
    current_ebitda_proj = current_ebitda
    
    for growth in growth_rates:
        current_ebitda_proj *= (1 + growth)
        ebitda_projections.append(current_ebitda_proj)
    
    # Exit assumptions (8.0x multiple)
    exit_multiple = 8.0
    exit_ev = ebitda_projections[-1] * exit_multiple
    exit_debt = debt_amount * 0.6  # Assume 40% debt paydown
    exit_equity_value = exit_ev - exit_debt
    
    # Cash flows during hold
    annual_cash_flows = []
    for i, ebitda in enumerate(ebitda_projections):
        # Simplified: EBITDA - Interest - CapEx - Taxes
        interest_expense = debt_amount * 0.085
        maintenance_capex = ebitda * 0.015  # 1.5% maintenance
        taxes = (ebitda - interest_expense - maintenance_capex) * 0.25
        free_cash_flow = ebitda - interest_expense - maintenance_capex - taxes
        annual_cash_flows.append(free_cash_flow)
    
    # IRR calculation
    cash_flows = [-equity_investment_levered] + annual_cash_flows[:-1] + [annual_cash_flows[-1] + exit_equity_value]
    
    # Simple IRR approximation
    total_return = exit_equity_value / equity_investment_levered
    irr_approx = (total_return ** (1/5)) - 1
    
    return {
        'entry_multiple': entry_multiple,
        'entry_ev': entry_ev,
        'debt_amount': debt_amount,
        'equity_investment': equity_investment_levered,
        'ebitda_projections': ebitda_projections,
        'exit_multiple': exit_multiple,
        'exit_ev': exit_ev,
        'exit_equity_value': exit_equity_value,
        'annual_cash_flows': annual_cash_flows,
        'total_cash_flows': cash_flows,
        'irr_approximate': irr_approx,
        'total_return_multiple': total_return
    }

def generate_valuation_matrix(case: RadiantPointCase, adjusted_ebitda: float) -> Dict:
    """
    Generate entry valuation matrix (7-10x range)
    """
    
    multiples = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0]
    net_debt = case.balance_sheet["net_debt"]
    
    valuation_matrix = {}
    for multiple in multiples:
        ev = adjusted_ebitda * multiple
        equity_value = ev - net_debt
        valuation_matrix[f"{multiple}x"] = {
            'enterprise_value': ev,
            'equity_value': equity_value,
            'multiple': multiple
        }
    
    # Base case at 8.5x
    base_case = valuation_matrix["8.5x"]
    
    return {
        'matrix': valuation_matrix,
        'base_case': base_case,
        'net_debt': net_debt,
        'adjusted_ebitda': adjusted_ebitda
    }

def generate_comprehensive_report(case: RadiantPointCase, epv_inputs: EPVInputs, 
                                epv_outputs, ebitda_analysis: Dict, 
                                valuation_matrix: Dict, irr_analysis: Dict) -> str:
    """
    Generate comprehensive broker-style valuation report
    """
    
    report = f"""
# RADIANT POINT AESTHETICS VALUATION ANALYSIS
## {case.case_name} - {case.location}

### EXECUTIVE SUMMARY
**Target Profile:** {case.site_profile} - {case.service_focus}
**Location:** {case.location}
**Analysis Date:** {datetime.now().strftime('%B %d, %Y')}

### TARGET OVERVIEW
**Operational Highlights:**
- 6 treatment rooms with 2 injectors (MD + NP), 1 laser tech, 2 estheticians
- 24,000 active patient file with strong referral flywheel
- Recent growth drivers: NP addition (Q3-24), expanded hours, CRM optimization
- Equipment: 2 lasers (2023), RF microneedling platform

**Service Mix (TTM):**
- Injectables: 72% (${case.service_mix['injectables']['revenue_ttm']:,.0f})
- Laser/Devices: 13% (${case.service_mix['laser_devices']['revenue_ttm']:,.0f})
- Facials/Peels: 10% (${case.service_mix['facials_peels']['revenue_ttm']:,.0f})
- Retail: 5% (${case.service_mix['retail']['revenue_ttm']:,.0f})

### FINANCIAL PERFORMANCE

**Quarterly Revenue Progression:**
"""
    
    # Add quarterly progression
    for _, row in case.quarterly_data.iterrows():
        report += f"- {row['Quarter']}: ${row['Revenue']:,.0f} revenue, ${row['EBITDA_Reported']:,.0f} EBITDA\n"
    
    # EBITDA Bridge
    bridge = ebitda_analysis['ebitda_bridge']
    report += f"""
### EBITDA BRIDGE (TTM)

**Reported to Adjusted EBITDA:**
- Reported EBITDA: ${bridge['reported']:,.0f}
- Owner Salary Add-back: +${bridge['owner_salary_addback']:,.0f}
- EMR Migration (Non-recurring): +${bridge['emr_migration_addback']:,.0f}
- Legal Settlement (Non-recurring): +${bridge['legal_settlement_addback']:,.0f}
- Rent Normalization (to market): ${bridge['rent_normalization']:,.0f}
- **Adjusted EBITDA: ${bridge['adjusted']:,.0f}**
- **Adjusted Margin: {ebitda_analysis['adjusted_margin']*100:.1f}%**

### OPERATING METRICS PROGRESSION
"""
    
    # Operating metrics
    for _, row in case.operating_metrics.iterrows():
        report += f"- {row['Quarter']}: {row['Visits']:,} visits, ${row['Avg_Ticket']:.0f} avg ticket, {row['Room_Utilization']*100:.0f}% utilization\n"
    
    # EPV Analysis
    report += f"""
### EPV VALUATION ANALYSIS

**Enterprise Valuation:**
- Enterprise EPV: ${epv_outputs.enterprise_epv:,.0f}
- Equity EPV: ${epv_outputs.equity_epv:,.0f}
- EV/Revenue Multiple: {epv_outputs.ev_to_revenue:.2f}x
- EV/EBITDA Multiple: {epv_outputs.ev_to_ebitda:.2f}x
- WACC: {epv_outputs.wacc*100:.2f}%

**EPV vs. Market Multiples:**
- EPV Enterprise Value: ${epv_outputs.enterprise_epv:,.0f}
- Market Range (7.5-9.0x): ${ebitda_analysis['ttm_ebitda_adjusted']*7.5:,.0f} - ${ebitda_analysis['ttm_ebitda_adjusted']*9.0:,.0f}
- EPV Multiple: {epv_outputs.enterprise_epv/ebitda_analysis['ttm_ebitda_adjusted']:.2f}x
"""
    
    # Valuation Matrix
    base_case = valuation_matrix['base_case']
    report += f"""
### VALUATION MATRIX

**Entry Multiples (7.0x - 10.0x):**
"""
    for multiple_str, data in valuation_matrix['matrix'].items():
        report += f"- {multiple_str}: EV ${data['enterprise_value']:,.0f}, Equity ${data['equity_value']:,.0f}\n"
    
    report += f"""
**Base Case (8.5x):**
- Enterprise Value: ${base_case['enterprise_value']:,.0f}
- Less: Net Debt: ${valuation_matrix['net_debt']:,.0f}
- Equity Value: ${base_case['equity_value']:,.0f}
"""
    
    # IRR Analysis
    report += f"""
### IRR ANALYSIS (5-Year Hold)

**Entry Assumptions:**
- Entry Multiple: {irr_analysis['entry_multiple']:.1f}x
- Enterprise Value: ${irr_analysis['entry_ev']:,.0f}
- Debt (70% LTV): ${irr_analysis['debt_amount']:,.0f}
- Equity Investment: ${irr_analysis['equity_investment']:,.0f}

**Exit Assumptions:**
- Exit Multiple: {irr_analysis['exit_multiple']:.1f}x
- Exit EBITDA: ${irr_analysis['ebitda_projections'][-1]:,.0f}
- Exit Enterprise Value: ${irr_analysis['exit_ev']:,.0f}
- Exit Equity Value: ${irr_analysis['exit_equity_value']:,.0f}

**Returns:**
- Total Return Multiple: {irr_analysis['total_return_multiple']:.2f}x
- Approximate IRR: {irr_analysis['irr_approximate']*100:.1f}%
"""
    
    # Risk Assessment
    report += f"""
### RISK ASSESSMENT & MITIGANTS

**Key Risks:**
• **Single-clinician dependency**: Heavy reliance on MD/NP injectors
• **Lease re-pricing risk**: Related-party lease may face market adjustment
• **Injector hiring pipeline**: Talent acquisition in competitive Austin market
• **Competition**: Corporate chains and franchise expansion
• **Regulatory**: Texas medical aesthetics oversight

**Mitigants:**
✓ **Strong patient base**: 24k active files with low churn
✓ **Diversified service mix**: Not solely injectables-dependent
✓ **Growth trajectory**: Consistent quarterly improvement
✓ **Market position**: Austin premium demographics
✓ **Operational systems**: EMR, online booking, CRM in place

### INVESTMENT RECOMMENDATION

**Strengths:**
- Premium Austin market location
- Strong injectables focus (72%) with high margins
- Consistent growth trajectory and improving utilization
- Established patient base with referral flywheel
- Recent operational improvements (NP addition, expanded hours)

**Valuation Summary:**
- EPV: ${epv_outputs.enterprise_epv:,.0f} ({epv_outputs.enterprise_epv/ebitda_analysis['ttm_ebitda_adjusted']:.1f}x)
- Market Range: ${ebitda_analysis['ttm_ebitda_adjusted']*7.5:,.0f} - ${ebitda_analysis['ttm_ebitda_adjusted']*9.0:,.0f}
- Base Case: ${base_case['enterprise_value']:,.0f} (8.5x)
- Projected IRR: {irr_analysis['irr_approximate']*100:.1f}%

**Recommendation:** PROCEED with acquisition. Target represents attractive single-site opportunity with strong fundamentals, defensible market position, and clear value creation path through operational optimization and potential add-on acquisitions.
"""
    
    return report

def main():
    """
    Main execution function for Radiant Point Aesthetics simulation
    """
    
    print("=" * 70)
    print("RADIANT POINT AESTHETICS VALUATION ANALYSIS")
    print("Comprehensive Broker-Style Case Analysis")
    print("=" * 70)
    
    # Create case study
    print("\n1. Loading broker case packet...")
    case = create_radiant_point_case()
    print(f"   Target: {case.case_name}")
    print(f"   Location: {case.location}")
    print(f"   Profile: {case.site_profile}")
    
    # Calculate EBITDA analysis
    print("\n2. Processing EBITDA bridge and normalizations...")
    ebitda_analysis = calculate_adjusted_ebitda(case)
    print(f"   TTM Revenue: ${ebitda_analysis['ttm_revenue']:,.0f}")
    print(f"   Reported EBITDA: ${ebitda_analysis['ttm_ebitda_reported']:,.0f}")
    print(f"   Adjusted EBITDA: ${ebitda_analysis['ttm_ebitda_adjusted']:,.0f} ({ebitda_analysis['adjusted_margin']*100:.1f}%)")
    
    # Convert to EPV inputs
    print("\n3. Converting to EPV system format...")
    epv_inputs = calculate_epv_inputs_from_radiant_point(case)
    print(f"   Service lines configured: {len(epv_inputs.service_lines)}")
    print(f"   Clinical labor %: {epv_inputs.clinical_labor_pct*100:.1f}%")
    print(f"   Marketing %: {epv_inputs.marketing_pct*100:.1f}%")
    
    # Run EPV calculation
    print("\n4. Running EPV calculation...")
    try:
        epv_outputs = compute_unified_epv(epv_inputs)
        print(f"   Enterprise EPV: ${epv_outputs.enterprise_epv:,.0f}")
        print(f"   Equity EPV: ${epv_outputs.equity_epv:,.0f}")
        print(f"   EV/EBITDA Multiple: {epv_outputs.ev_to_ebitda:.2f}x")
    except Exception as e:
        print(f"   Error in EPV calculation: {e}")
        return
    
    # Generate valuation matrix
    print("\n5. Generating valuation matrix...")
    valuation_matrix = generate_valuation_matrix(case, ebitda_analysis['ttm_ebitda_adjusted'])
    base_case = valuation_matrix['base_case']
    print(f"   Valuation range: ${valuation_matrix['matrix']['7.0x']['enterprise_value']:,.0f} - ${valuation_matrix['matrix']['10.0x']['enterprise_value']:,.0f}")
    print(f"   Base case (8.5x): ${base_case['enterprise_value']:,.0f}")
    
    # Calculate IRR analysis
    print("\n6. Running IRR analysis...")
    irr_analysis = calculate_irr_analysis(case, epv_outputs.enterprise_epv)
    print(f"   Entry equity investment: ${irr_analysis['equity_investment']:,.0f}")
    print(f"   Exit equity value: ${irr_analysis['exit_equity_value']:,.0f}")
    print(f"   Approximate IRR: {irr_analysis['irr_approximate']*100:.1f}%")
    
    # Generate comprehensive report
    print("\n7. Generating comprehensive report...")
    report = generate_comprehensive_report(
        case, epv_inputs, epv_outputs, ebitda_analysis, valuation_matrix, irr_analysis
    )
    
    # Save report
    report_filename = f"radiant_point_valuation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(report_filename, 'w') as f:
        f.write(report)
    
    print(f"   Report saved as: {report_filename}")
    
    # Save detailed results
    results_data = {
        'case_study': asdict(case),
        'ebitda_analysis': ebitda_analysis,
        'epv_inputs': asdict(epv_inputs),
        'epv_outputs': {
            'enterprise_epv': epv_outputs.enterprise_epv,
            'equity_epv': epv_outputs.equity_epv,
            'total_revenue': epv_outputs.total_revenue,
            'ebitda_normalized': epv_outputs.ebitda_normalized,
            'ev_to_ebitda': epv_outputs.ev_to_ebitda,
            'wacc': epv_outputs.wacc
        },
        'valuation_matrix': valuation_matrix,
        'irr_analysis': irr_analysis
    }
    
    results_filename = f"radiant_point_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(results_filename, 'w') as f:
        json.dump(results_data, f, indent=2, default=str)
    
    print(f"   Detailed results saved as: {results_filename}")
    
    # Print executive summary
    print("\n" + "=" * 70)
    print("EXECUTIVE SUMMARY")
    print("=" * 70)
    print(f"Target:                  {case.case_name}")
    print(f"TTM Revenue:             ${ebitda_analysis['ttm_revenue']:,.0f}")
    print(f"Adjusted EBITDA:         ${ebitda_analysis['ttm_ebitda_adjusted']:,.0f} ({ebitda_analysis['adjusted_margin']*100:.1f}%)")
    print(f"Enterprise EPV:          ${epv_outputs.enterprise_epv:,.0f} ({epv_outputs.ev_to_ebitda:.1f}x)")
    print(f"Market Range (7.5-9.0x): ${ebitda_analysis['ttm_ebitda_adjusted']*7.5:,.0f} - ${ebitda_analysis['ttm_ebitda_adjusted']*9.0:,.0f}")
    print(f"Base Case (8.5x):        ${base_case['enterprise_value']:,.0f}")
    print(f"Projected IRR:           {irr_analysis['irr_approximate']*100:.1f}%")
    print(f"Net Debt:                ${case.balance_sheet['net_debt']:,.0f}")
    
    print("\nAnalysis complete. Target represents attractive single-site acquisition opportunity.")

if __name__ == "__main__":
    main() 