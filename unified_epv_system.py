import streamlit as st
import yfinance as yf
import pandas as pd
import numpy as np
import altair as alt
from dataclasses import dataclass
from typing import Optional, Dict, Tuple, List
import json

st.set_page_config(
    page_title="Unified EPV Valuation System",
    page_icon="💹",
    layout="wide",
)

# =============================================================================
# CORE DATA STRUCTURES
# =============================================================================

@dataclass
class ServiceLine:
    """Individual revenue line item with detailed modeling"""
    id: str
    name: str
    price: float
    volume: float
    cogs_pct: float
    kind: str  # "service" or "retail"
    growth_rate: float = 0.0
    margin_adjustment: float = 0.0

@dataclass
class EPVInputs:
    """Comprehensive input structure for EPV calculation"""
    # Revenue modeling
    service_lines: List[ServiceLine]
    use_real_data: bool = False
    ticker: str = ""
    
    # Normalization settings
    years: int = 5
    margin_method: str = "median"
    normalized_margin: Optional[float] = None
    
    # Cost structure
    clinical_labor_pct: float = 0.28
    marketing_pct: float = 0.08
    admin_pct: float = 0.12
    other_opex_pct: float = 0.02
    
    # Fixed costs
    rent_annual: float = 156000
    med_director_annual: float = 36000
    insurance_annual: float = 18000
    software_annual: float = 24000
    utilities_annual: float = 18000
    
    # Normalizations & adjustments
    owner_add_back: float = 120000
    other_add_back: float = 0
    da_annual: float = 80000
    
    # Capital intensity
    maintenance_method: str = "depr_factor"
    maint_factor: float = 1.0
    capital_intensity_years: int = 5
    maintenance_capex_amount: float = 120000
    
    # Working capital
    dso_days: float = 5
    dsi_days: float = 40
    dpo_days: float = 30
    
    # Capital structure
    cash_non_operating: float = 200000
    debt_interest_bearing: float = 1200000
    excess_cash_pct: float = 1.0
    
    # Tax & WACC
    tax_rate: float = 0.25
    rf_rate: float = 0.042
    mrp: float = 0.055
    beta: float = 1.1
    size_premium: float = 0.02
    specific_premium: float = 0.0
    cost_debt: float = 0.085
    target_debt_weight: float = 0.35
    wacc_override: Optional[float] = None
    
    # EPV method
    epv_method: str = "Owner Earnings"  # "Owner Earnings" or "NOPAT"
    
    # Asset reproduction
    buildout_improvements: float = 700000
    equipment_devices: float = 500000
    ffne: float = 150000
    startup_intangibles: float = 120000
    other_repro: float = 0
    
    # Advanced options
    rd_capitalize: bool = False
    rd_years: int = 5
    sga_capitalize: bool = False
    sga_years: int = 5
    other_adjustments: float = 0
    
    # Scenario
    scenario: str = "Base"  # "Base", "Bull", "Bear"
    
    # Monte Carlo
    mc_runs: int = 500

@dataclass
class EPVOutputs:
    """Comprehensive output structure"""
    # Revenue & earnings
    total_revenue: float
    service_revenue: float
    retail_revenue: float
    gross_profit: float
    ebitda_reported: float
    ebitda_normalized: float
    ebit_normalized: float
    ebit_margin: float
    
    # EPV calculation
    nopat: float
    owner_earnings: float
    adjusted_earnings: float
    maintenance_capex: float
    
    # Capital structure
    wacc: float
    enterprise_epv: float
    equity_epv: float
    
    # Asset reproduction
    enterprise_repro: float
    equity_repro: float
    franchise_ratio: float
    
    # Working capital
    ar: float
    inv: float
    ap: float
    nwc_required: float
    
    # Valuation metrics
    ev_to_revenue: float
    ev_to_ebitda: float
    recommended_equity: float
    
    # Scenario adjustments
    scenario_revenue: float
    scenario_ebit: float
    scenario_epv: float

# =============================================================================
# DATA FETCHING & PROCESSING
# =============================================================================

@st.cache_data(show_spinner=False, ttl=60 * 60)
def fetch_yf_statements(ticker: str) -> Dict[str, pd.DataFrame]:
    """Fetch financial data from Yahoo Finance"""
    try:
        t = yf.Ticker(ticker)
        info = t.info if hasattr(t, "info") else {}
        
        # Get financial statements
        income = t.financials or pd.DataFrame()
        balance = t.balance_sheet or pd.DataFrame()
        cashflow = t.cashflow or pd.DataFrame()
        
        # Sort by date (oldest to newest)
        for df in [income, balance, cashflow]:
            if not df.empty:
                df.columns = pd.to_datetime(df.columns)
                df.sort_index(axis=1, inplace=True)
        
        # Extract key metrics
        price = info.get("currentPrice") or info.get("regularMarketPrice") or np.nan
        shares = info.get("sharesOutstanding") or np.nan
        market_cap = info.get("marketCap") or np.nan
        beta = info.get("beta") or 1.0
        
        # Extract debt and cash
        total_debt = 0.0
        cash_st = 0.0
        if not balance.empty:
            debt_candidates = ["Total Debt", "Short Long Term Debt", "Long Term Debt"]
            cash_candidates = ["Cash", "Cash And Cash Equivalents"]
            
            for c in debt_candidates:
                if c in balance.index:
                    total_debt += balance.loc[c].iloc[-1]
            for c in cash_candidates:
                if c in balance.index:
                    cash_st = max(cash_st, balance.loc[c].iloc[-1])
        
        return {
            "info": info,
            "price": price,
            "income": income,
            "balance": balance,
            "cashflow": cashflow,
            "shares": shares,
            "market_cap": market_cap,
            "beta": beta,
            "total_debt": total_debt if total_debt > 0 else None,
            "cash": cash_st if cash_st > 0 else None,
        }
    except Exception as e:
        st.error(f"Error fetching data for {ticker}: {str(e)}")
        return {}

def get_line(df: pd.DataFrame, names: list[str]) -> Optional[pd.Series]:
    """Extract line item from financial statement"""
    if df is None or df.empty:
        return None
    for name in names:
        if name in df.index:
            return df.loc[name]
    return None

def safe_avg(series: pd.Series, years: int, method: str = "median") -> float:
    """Calculate safe average with method selection"""
    if series is None or series.empty:
        return np.nan
    s = series.dropna().tail(years)
    if s.empty:
        return np.nan
    
    if method == "mean":
        return float(s.mean())
    elif method == "trimmed":
        if len(s) >= 5:
            trim = int(len(s) * 0.2)
            return float(s.sort_values().iloc[trim:-trim].mean())
        else:
            return float(s.mean())
    return float(s.median())

# =============================================================================
# CORE EPV CALCULATIONS
# =============================================================================

def calculate_revenue_from_service_lines(service_lines: List[ServiceLine]) -> Tuple[float, float, float]:
    """Calculate revenue breakdown from service lines"""
    total_revenue = sum(line.price * line.volume for line in service_lines)
    retail_revenue = sum(line.price * line.volume for line in service_lines if line.kind == "retail")
    service_revenue = total_revenue - retail_revenue
    return total_revenue, service_revenue, retail_revenue

def calculate_cost_structure(
    service_lines: List[ServiceLine],
    service_revenue: float,
    clinical_labor_pct: float,
    marketing_pct: float,
    admin_pct: float,
    other_opex_pct: float,
    total_revenue: float,
    fixed_costs: Dict[str, float]
) -> Tuple[float, float, float, float]:
    """Calculate comprehensive cost structure"""
    # COGS by line
    total_cogs = sum(line.price * line.volume * line.cogs_pct for line in service_lines)
    
    # Clinical labor (applied to services only)
    clinical_labor_cost = clinical_labor_pct * service_revenue
    
    # Gross profit
    gross_profit = total_revenue - total_cogs - clinical_labor_cost
    
    # Operating expenses
    marketing_cost = marketing_pct * total_revenue
    admin_cost = admin_pct * total_revenue
    other_opex_cost = other_opex_pct * total_revenue
    
    # Fixed costs
    fixed_costs_total = sum(fixed_costs.values())
    
    # Total opex
    opex_total = marketing_cost + admin_cost + fixed_costs_total + other_opex_cost
    
    return gross_profit, opex_total, clinical_labor_cost, total_cogs

def calculate_epv_earnings(
    ebitda_normalized: float,
    da_annual: float,
    maintenance_capex: float,
    epv_method: str
) -> Tuple[float, float, float]:
    """Calculate EPV earnings components"""
    ebit_normalized = ebitda_normalized - da_annual
    nopat = ebit_normalized * (1 - 0.25)  # Using default tax rate for now
    owner_earnings = nopat + da_annual - maintenance_capex
    
    if epv_method == "Owner Earnings":
        adjusted_earnings = owner_earnings
    else:
        adjusted_earnings = nopat
    
    return nopat, owner_earnings, adjusted_earnings

def calculate_wacc(
    rf_rate: float,
    mrp: float,
    beta: float,
    size_premium: float,
    specific_premium: float,
    cost_debt: float,
    tax_rate: float,
    target_debt_weight: float,
    wacc_override: Optional[float]
) -> float:
    """Calculate WACC using CAPM"""
    if wacc_override is not None:
        return wacc_override
    
    cost_equity = rf_rate + beta * mrp + size_premium + specific_premium
    after_tax_cost_debt = cost_debt * (1 - tax_rate)
    
    wacc = (target_debt_weight * after_tax_cost_debt + 
            (1 - target_debt_weight) * cost_equity)
    
    return max(0.03, min(0.35, wacc))

def calculate_asset_reproduction(
    buildout_improvements: float,
    equipment_devices: float,
    ffne: float,
    startup_intangibles: float,
    other_repro: float,
    nwc_required: float
) -> float:
    """Calculate asset reproduction value"""
    return (buildout_improvements + equipment_devices + ffne + 
            startup_intangibles + other_repro + nwc_required)

# =============================================================================
# MAIN EPV COMPUTATION
# =============================================================================

def compute_unified_epv(inputs: EPVInputs, fin_data: Dict = None) -> EPVOutputs:
    """Main EPV computation function"""
    
    # Revenue calculation
    if inputs.use_real_data and fin_data:
        # Use real financial data
        income = fin_data.get("income", pd.DataFrame())
        revenue_series = get_line(income, ["Total Revenue", "Revenue", "TotalRevenue"])
        if revenue_series is not None:
            total_revenue = safe_avg(revenue_series, inputs.years, inputs.margin_method)
            service_revenue = total_revenue * 0.8  # Estimate
            retail_revenue = total_revenue * 0.2
        else:
            total_revenue = service_revenue = retail_revenue = 0
    else:
        # Use service lines
        total_revenue, service_revenue, retail_revenue = calculate_revenue_from_service_lines(inputs.service_lines)
    
    # Fixed costs dictionary
    fixed_costs = {
        "rent": inputs.rent_annual,
        "med_director": inputs.med_director_annual,
        "insurance": inputs.insurance_annual,
        "software": inputs.software_annual,
        "utilities": inputs.utilities_annual,
    }
    
    # Cost structure
    gross_profit, opex_total, clinical_labor_cost, total_cogs = calculate_cost_structure(
        inputs.service_lines, service_revenue, inputs.clinical_labor_pct,
        inputs.marketing_pct, inputs.admin_pct, inputs.other_opex_pct,
        total_revenue, fixed_costs
    )
    
    # EBITDA and EBIT
    ebitda_reported = gross_profit - opex_total
    ebitda_normalized = ebitda_reported + inputs.owner_add_back + inputs.other_add_back
    ebit_normalized = ebitda_normalized - inputs.da_annual
    ebit_margin = ebit_normalized / total_revenue if total_revenue > 0 else 0
    
    # Maintenance capex
    if inputs.maintenance_method == "depr_factor":
        maintenance_capex = inputs.da_annual * inputs.maint_factor
    else:
        maintenance_capex = inputs.maintenance_capex_amount
    
    # EPV earnings
    nopat, owner_earnings, adjusted_earnings = calculate_epv_earnings(
        ebitda_normalized, inputs.da_annual, maintenance_capex, inputs.epv_method
    )
    
    # WACC
    wacc = calculate_wacc(
        inputs.rf_rate, inputs.mrp, inputs.beta, inputs.size_premium,
        inputs.specific_premium, inputs.cost_debt, inputs.tax_rate,
        inputs.target_debt_weight, inputs.wacc_override
    )
    
    # Enterprise EPV
    enterprise_epv = adjusted_earnings / wacc if wacc > 0 else 0
    
    # Working capital
    cogs_for_wc = total_cogs + clinical_labor_cost
    ar = total_revenue * (inputs.dso_days / 365)
    inv = cogs_for_wc * (inputs.dsi_days / 365)
    ap = cogs_for_wc * (inputs.dpo_days / 365)
    nwc_required = max(0, ar + inv - ap)
    
    # Asset reproduction
    enterprise_repro = calculate_asset_reproduction(
        inputs.buildout_improvements, inputs.equipment_devices,
        inputs.ffne, inputs.startup_intangibles, inputs.other_repro, nwc_required
    )
    
    # Equity values
    equity_epv = enterprise_epv + inputs.cash_non_operating - inputs.debt_interest_bearing
    equity_repro = enterprise_repro + inputs.cash_non_operating - inputs.debt_interest_bearing
    
    # Franchise ratio
    franchise_ratio = enterprise_epv / enterprise_repro if enterprise_repro > 0 else 0
    
    # Valuation metrics
    ev_to_revenue = enterprise_epv / total_revenue if total_revenue > 0 else 0
    ev_to_ebitda = enterprise_epv / ebitda_normalized if ebitda_normalized > 0 else 0
    
    # Recommended equity (using EPV for now)
    recommended_equity = equity_epv
    
    # Scenario adjustments
    scenario_multipliers = {
        "Base": (1.0, 1.0, 1.0),
        "Bull": (1.08, 1.05, 0.99),
        "Bear": (0.92, 0.95, 1.01)
    }
    rev_mult, ebit_mult, wacc_adj = scenario_multipliers.get(inputs.scenario, (1.0, 1.0, 1.0))
    
    scenario_revenue = total_revenue * rev_mult
    scenario_ebit = ebit_normalized * ebit_mult * rev_mult
    scenario_epv = (scenario_ebit * (1 - inputs.tax_rate)) / (wacc + wacc_adj)
    
    return EPVOutputs(
        total_revenue=total_revenue,
        service_revenue=service_revenue,
        retail_revenue=retail_revenue,
        gross_profit=gross_profit,
        ebitda_reported=ebitda_reported,
        ebitda_normalized=ebitda_normalized,
        ebit_normalized=ebit_normalized,
        ebit_margin=ebit_margin,
        nopat=nopat,
        owner_earnings=owner_earnings,
        adjusted_earnings=adjusted_earnings,
        maintenance_capex=maintenance_capex,
        wacc=wacc,
        enterprise_epv=enterprise_epv,
        equity_epv=equity_epv,
        enterprise_repro=enterprise_repro,
        equity_repro=equity_repro,
        franchise_ratio=franchise_ratio,
        ar=ar,
        inv=inv,
        ap=ap,
        nwc_required=nwc_required,
        ev_to_revenue=ev_to_revenue,
        ev_to_ebitda=ev_to_ebitda,
        recommended_equity=recommended_equity,
        scenario_revenue=scenario_revenue,
        scenario_ebit=scenario_ebit,
        scenario_epv=scenario_epv
    )

# =============================================================================
# STREAMLIT UI
# =============================================================================

def main():
    st.title("Unified EPV Valuation System")
    st.markdown("Combines sophisticated financial modeling with granular input control")
    
    # Sidebar for data source selection
    with st.sidebar:
        st.subheader("Data Source")
        use_real_data = st.checkbox("Use Real Financial Data", value=False)
        ticker = ""
        if use_real_data:
            ticker = st.text_input("Ticker Symbol", value="AAPL").upper().strip()
        
        st.markdown("---")
        st.subheader("Quick Actions")
        if st.button("Load Default Medispa Model"):
            st.session_state.load_default = True
        if st.button("Clear All Data"):
            st.session_state.clear_data = True
    
    # Initialize session state
    if 'service_lines' not in st.session_state:
        st.session_state.service_lines = [
            ServiceLine("inj", "Injectables", 575, 2200, 0.28, "service"),
            ServiceLine("laser", "Laser / Devices", 350, 1800, 0.10, "service"),
            ServiceLine("aesth", "Aesthetics / Facials", 200, 1200, 0.15, "service"),
            ServiceLine("retail", "Retail / Skincare", 90, 3000, 0.55, "retail"),
            ServiceLine("memb", "Memberships (annual)", 1188, 400, 0.05, "service"),
            ServiceLine("other", "Other", 150, 400, 0.10, "service"),
        ]
    
    # Fetch real data if requested
    fin_data = None
    if use_real_data and ticker:
        with st.spinner(f"Fetching data for {ticker}..."):
            fin_data = fetch_yf_statements(ticker)
            if not fin_data:
                st.error(f"Could not fetch data for {ticker}")
                return
    
    # Main tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "Revenue Builder", "Cost Structure", "Valuation", "Analytics", "Data"
    ])
    
    with tab1:
        st.subheader("Revenue Builder")
        
        # Service lines management
        col1, col2 = st.columns([3, 1])
        with col1:
            st.markdown("**Service Lines**")
            for i, line in enumerate(st.session_state.service_lines):
                with st.container():
                    cols = st.columns(6)
                    with cols[0]:
                        line.name = st.text_input(f"Name {i+1}", value=line.name, key=f"name_{i}")
                    with cols[1]:
                        line.kind = st.selectbox(f"Type {i+1}", ["service", "retail"], 
                                               index=0 if line.kind == "service" else 1, key=f"kind_{i}")
                    with cols[2]:
                        line.price = st.number_input(f"Price {i+1}", value=float(line.price), 
                                                   step=1.0, key=f"price_{i}")
                    with cols[3]:
                        line.volume = st.number_input(f"Volume {i+1}", value=float(line.volume), 
                                                    step=1.0, key=f"volume_{i}")
                    with cols[4]:
                        line.cogs_pct = st.number_input(f"COGS% {i+1}", value=float(line.cogs_pct), 
                                                      min_value=0.0, max_value=1.0, step=0.01, key=f"cogs_{i}")
                    with cols[5]:
                        if st.button("Remove", key=f"remove_{i}"):
                            st.session_state.service_lines.pop(i)
                            st.rerun()
        
        with col2:
            st.markdown("**Add Line**")
            new_name = st.text_input("Name", key="new_name")
            new_kind = st.selectbox("Type", ["service", "retail"], key="new_kind")
            new_price = st.number_input("Price", value=100.0, step=1.0, key="new_price")
            new_volume = st.number_input("Volume", value=100, step=1, key="new_volume")
            new_cogs = st.number_input("COGS%", value=0.1, min_value=0.0, max_value=1.0, step=0.01, key="new_cogs")
            
            if st.button("Add Service Line"):
                new_id = f"line_{len(st.session_state.service_lines)}"
                st.session_state.service_lines.append(
                    ServiceLine(new_id, new_name, new_price, new_volume, new_cogs, new_kind)
                )
                st.rerun()
    
    with tab2:
        st.subheader("Cost Structure")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Variable Costs (% of Revenue)**")
            clinical_labor_pct = st.slider("Clinical Labor %", 0.0, 1.0, 0.28, 0.01)
            marketing_pct = st.slider("Marketing %", 0.0, 0.5, 0.08, 0.01)
            admin_pct = st.slider("Admin %", 0.0, 0.5, 0.12, 0.01)
            other_opex_pct = st.slider("Other Opex %", 0.0, 0.2, 0.02, 0.01)
        
        with col2:
            st.markdown("**Fixed Costs (Annual)**")
            rent_annual = st.number_input("Rent", value=156000, step=1000)
            med_director_annual = st.number_input("Medical Director", value=36000, step=1000)
            insurance_annual = st.number_input("Insurance", value=18000, step=1000)
            software_annual = st.number_input("Software", value=24000, step=1000)
            utilities_annual = st.number_input("Utilities", value=18000, step=1000)
    
    with tab3:
        st.subheader("Valuation Parameters")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown("**Normalizations**")
            owner_add_back = st.number_input("Owner Add-backs", value=120000, step=1000)
            other_add_back = st.number_input("Other Add-backs", value=0, step=1000)
            da_annual = st.number_input("D&A Annual", value=80000, step=1000)
            
            st.markdown("**Capital Structure**")
            cash_non_operating = st.number_input("Cash & Equivalents", value=200000, step=1000)
            debt_interest_bearing = st.number_input("Interest-bearing Debt", value=1200000, step=1000)
        
        with col2:
            st.markdown("**WACC Components**")
            rf_rate = st.number_input("Risk-free Rate", value=0.042, step=0.001, format="%.3f")
            mrp = st.number_input("Market Risk Premium", value=0.055, step=0.001, format="%.3f")
            beta = st.number_input("Beta", value=1.1, step=0.05)
            cost_debt = st.number_input("Cost of Debt", value=0.085, step=0.001, format="%.3f")
            target_debt_weight = st.slider("Target Debt Weight", 0.0, 1.0, 0.35, 0.01)
        
        with col3:
            st.markdown("**Asset Reproduction**")
            buildout_improvements = st.number_input("Buildout & Improvements", value=700000, step=1000)
            equipment_devices = st.number_input("Equipment & Devices", value=500000, step=1000)
            ffne = st.number_input("FF&E", value=150000, step=1000)
            startup_intangibles = st.number_input("Startup Intangibles", value=120000, step=1000)
    
    # Create inputs object
    inputs = EPVInputs(
        service_lines=st.session_state.service_lines,
        use_real_data=use_real_data,
        ticker=ticker,
        clinical_labor_pct=clinical_labor_pct,
        marketing_pct=marketing_pct,
        admin_pct=admin_pct,
        other_opex_pct=other_opex_pct,
        rent_annual=rent_annual,
        med_director_annual=med_director_annual,
        insurance_annual=insurance_annual,
        software_annual=software_annual,
        utilities_annual=utilities_annual,
        owner_add_back=owner_add_back,
        other_add_back=other_add_back,
        da_annual=da_annual,
        cash_non_operating=cash_non_operating,
        debt_interest_bearing=debt_interest_bearing,
        rf_rate=rf_rate,
        mrp=mrp,
        beta=beta,
        cost_debt=cost_debt,
        target_debt_weight=target_debt_weight,
        buildout_improvements=buildout_improvements,
        equipment_devices=equipment_devices,
        ffne=ffne,
        startup_intangibles=startup_intangibles,
    )
    
    # Compute EPV
    outputs = compute_unified_epv(inputs, fin_data)
    
    # Display results
    with tab4:
        st.subheader("Valuation Results")
        
        # Key metrics
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Revenue", f"${outputs.total_revenue:,.0f}")
        col2.metric("EBIT Margin", f"{outputs.ebit_margin:.1%}")
        col3.metric("Enterprise EPV", f"${outputs.enterprise_epv:,.0f}")
        col4.metric("Equity Value", f"${outputs.equity_epv:,.0f}")
        
        # Detailed breakdown
        st.markdown("**Financial Model**")
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Income Statement**")
            st.write(f"Revenue: ${outputs.total_revenue:,.0f}")
            st.write(f"Gross Profit: ${outputs.gross_profit:,.0f}")
            st.write(f"EBITDA (reported): ${outputs.ebitda_reported:,.0f}")
            st.write(f"EBITDA (normalized): ${outputs.ebitda_normalized:,.0f}")
            st.write(f"EBIT (normalized): ${outputs.ebit_normalized:,.0f}")
        
        with col2:
            st.markdown("**EPV Calculation**")
            st.write(f"NOPAT: ${outputs.nopat:,.0f}")
            st.write(f"Owner Earnings: ${outputs.owner_earnings:,.0f}")
            st.write(f"Adjusted Earnings: ${outputs.adjusted_earnings:,.0f}")
            st.write(f"WACC: {outputs.wacc:.1%}")
            st.write(f"Maintenance Capex: ${outputs.maintenance_capex:,.0f}")
        
        # Asset reproduction
        st.markdown("**Asset Reproduction**")
        col1, col2 = st.columns(2)
        
        with col1:
            st.write(f"Enterprise Reproduction: ${outputs.enterprise_repro:,.0f}")
            st.write(f"Equity Reproduction: ${outputs.equity_repro:,.0f}")
        
        with col2:
            st.write(f"Franchise Ratio: {outputs.franchise_ratio:.2f}x")
            st.write(f"EV/Revenue: {outputs.ev_to_revenue:.2f}x")
            st.write(f"EV/EBITDA: {outputs.ev_to_ebitda:.2f}x")
    
    with tab5:
        st.subheader("Data & Analytics")
        
        if fin_data and use_real_data:
            st.markdown("**Real Financial Data**")
            st.write(f"Ticker: {ticker}")
            st.write(f"Price: ${fin_data.get('price', 'N/A')}")
            st.write(f"Market Cap: ${fin_data.get('market_cap', 'N/A'):,.0f}")
            
            # Show financial statements
            if not fin_data.get('income').empty:
                st.markdown("**Income Statement**")
                st.dataframe(fin_data['income'].tail(10))
        
        # Working capital analysis
        st.markdown("**Working Capital Analysis**")
        col1, col2, col3 = st.columns(3)
        col1.metric("Accounts Receivable", f"${outputs.ar:,.0f}")
        col2.metric("Inventory", f"${outputs.inv:,.0f}")
        col3.metric("Accounts Payable", f"${outputs.ap:,.0f}")
        st.metric("Net Working Capital Required", f"${outputs.nwc_required:,.0f}")

if __name__ == "__main__":
    main() 