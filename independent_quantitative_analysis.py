#!/usr/bin/env python3
"""
INDEPENDENT QUANTITATIVE ANALYSIS - Multi-Service Medispa Case
Advanced Quantitative Finance Modeling and Risk Analysis

This analysis provides an independent, comprehensive quantitative assessment using:
- Statistical analysis and time series modeling
- Monte Carlo simulation and Value-at-Risk calculations
- Advanced DCF modeling with real options valuation
- Portfolio theory and capital allocation optimization
- Sensitivity analysis with confidence intervals

Financial Data: Revenue $3.7M, EBITDA Margin 29.1%, 6 Service Lines
Analyst: Independent Quantitative Finance Team
"""

import numpy as np
import pandas as pd
import scipy.stats as stats
from scipy.optimize import minimize
from scipy.interpolate import interp1d
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import json
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
np.random.seed(42)

@dataclass
class QuantitativeFinancialData:
    """Structured financial data for quantitative analysis"""
    
    # Core financial metrics (in thousands)
    revenues: List[float]  # 2022-2024
    ebitda: List[float]
    operating_income: List[float]
    free_cash_flow: List[float]
    
    # Service line data
    service_line_revenues: Dict[str, List[float]]
    service_line_margins: Dict[str, List[float]]
    
    # Cost structure
    marketing_expenses: List[float]
    fixed_costs: List[float]
    variable_costs: List[float]
    
    # Market data
    risk_free_rate: float = 0.045
    market_risk_premium: float = 0.055
    beta: float = 1.2
    tax_rate: float = 0.25
    
    # Debt structure
    debt_outstanding: float = 2300  # Estimated from interest expense
    interest_rate: float = 0.085

@dataclass 
class QuantitativeResults:
    """Comprehensive quantitative analysis results"""
    
    # Statistical analysis
    revenue_volatility: float
    ebitda_volatility: float
    correlation_matrix: np.ndarray
    
    # Risk metrics
    var_95: float  # 95% Value at Risk
    cvar_95: float  # 95% Conditional Value at Risk
    maximum_drawdown: float
    
    # Valuation results
    dcf_valuation: float
    real_options_value: float
    monte_carlo_valuation: Dict[str, float]
    
    # Portfolio metrics
    sharpe_ratio: float
    information_ratio: float
    tracking_error: float
    
    # Confidence intervals
    valuation_confidence_intervals: Dict[str, Tuple[float, float]]


class IndependentQuantitativeAnalyzer:
    """Advanced quantitative finance analyzer for medispa valuation"""
    
    def __init__(self, financial_data: QuantitativeFinancialData):
        self.data = financial_data
        self.results = None
        
    def run_comprehensive_analysis(self) -> Dict:
        """Execute comprehensive quantitative analysis"""
        
        print("🔬 INDEPENDENT QUANTITATIVE ANALYSIS")
        print("=" * 60)
        print(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Methodology: Advanced Quantitative Finance Models")
        print("=" * 60)
        
        # 1. Statistical Analysis
        print("\n1️⃣  STATISTICAL ANALYSIS & TIME SERIES MODELING")
        statistical_results = self._perform_statistical_analysis()
        
        # 2. Risk Modeling
        print("\n2️⃣  RISK MODELING & VALUE-AT-RISK CALCULATIONS")
        risk_results = self._perform_risk_analysis()
        
        # 3. Advanced DCF Modeling
        print("\n3️⃣  ADVANCED DCF & REAL OPTIONS VALUATION")
        valuation_results = self._perform_advanced_valuation()
        
        # 4. Monte Carlo Simulation
        print("\n4️⃣  MONTE CARLO SIMULATION FRAMEWORK")
        monte_carlo_results = self._perform_monte_carlo_analysis()
        
        # 5. Portfolio Theory Application
        print("\n5️⃣  PORTFOLIO THEORY & CAPITAL ALLOCATION")
        portfolio_results = self._perform_portfolio_analysis()
        
        # 6. Sensitivity Analysis with Confidence Intervals
        print("\n6️⃣  SENSITIVITY ANALYSIS & CONFIDENCE BANDS")
        sensitivity_results = self._perform_sensitivity_analysis()
        
        # Compile comprehensive results
        comprehensive_results = {
            "analysis_metadata": {
                "analysis_date": datetime.now().isoformat(),
                "methodology": "Independent Quantitative Finance Analysis",
                "analyst": "Advanced Quantitative Modeling Team",
                "confidence_level": 0.95
            },
            "statistical_analysis": statistical_results,
            "risk_analysis": risk_results,
            "valuation_analysis": valuation_results,
            "monte_carlo_analysis": monte_carlo_results,
            "portfolio_analysis": portfolio_results,
            "sensitivity_analysis": sensitivity_results,
            "executive_summary": self._generate_executive_summary(
                statistical_results, risk_results, valuation_results,
                monte_carlo_results, portfolio_results, sensitivity_results
            )
        }
        
        return comprehensive_results
    
    def _perform_statistical_analysis(self) -> Dict:
        """Advanced statistical analysis and time series modeling"""
        
        # Revenue and margin analysis
        revenues = np.array(self.data.revenues)
        ebitda = np.array(self.data.ebitda)
        
        # Calculate growth rates and volatility
        revenue_growth_rates = np.diff(revenues) / revenues[:-1]
        ebitda_growth_rates = np.diff(ebitda) / ebitda[:-1]
        
        # Volatility calculations (annualized)
        revenue_volatility = np.std(revenue_growth_rates) * np.sqrt(252/365)  # Annualized
        ebitda_volatility = np.std(ebitda_growth_rates) * np.sqrt(252/365)
        
        print(f"   ✓ Revenue Volatility (annualized): {revenue_volatility:.2%}")
        print(f"   ✓ EBITDA Volatility (annualized): {ebitda_volatility:.2%}")
        
        # Service line correlation analysis
        service_line_data = pd.DataFrame(self.data.service_line_revenues)
        correlation_matrix = service_line_data.corr().values
        
        # Principal Component Analysis for dimensionality reduction
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(service_line_data.T)  # Transpose for features
        pca = PCA()
        pca_components = pca.fit_transform(scaled_data)
        
        # Explained variance
        explained_variance_ratio = pca.explained_variance_ratio_
        
        print(f"   ✓ First PC explains {explained_variance_ratio[0]:.1%} of variance")
        print(f"   ✓ Top 3 PCs explain {np.sum(explained_variance_ratio[:3]):.1%} of variance")
        
        # Trend analysis using linear regression
        years = np.array([0, 1, 2])  # 2022=0, 2023=1, 2024=2
        
        # Revenue trend
        revenue_slope, revenue_intercept, revenue_r_value, _, _ = stats.linregress(years, revenues)
        
        # EBITDA trend  
        ebitda_slope, ebitda_intercept, ebitda_r_value, _, _ = stats.linregress(years, ebitda)
        
        print(f"   ✓ Revenue trend: ${revenue_slope:.0f}K/year (R² = {revenue_r_value**2:.3f})")
        print(f"   ✓ EBITDA trend: ${ebitda_slope:.0f}K/year (R² = {ebitda_r_value**2:.3f})")
        
        # Forecasting using ARIMA-like approach (simplified)
        revenue_forecast_2025 = revenue_intercept + revenue_slope * 3
        revenue_forecast_2026 = revenue_intercept + revenue_slope * 4
        
        # Statistical tests
        # Normality test on growth rates (only if we have enough data points)
        if len(revenue_growth_rates) >= 3:
            revenue_shapiro_stat, revenue_shapiro_p = stats.shapiro(revenue_growth_rates)
        else:
            # With only 2 data points, we can't perform meaningful normality tests
            revenue_shapiro_stat, revenue_shapiro_p = np.nan, np.nan
        
        return {
            "volatility_metrics": {
                "revenue_volatility": float(revenue_volatility),
                "ebitda_volatility": float(ebitda_volatility),
                "revenue_growth_rates": revenue_growth_rates.tolist(),
                "ebitda_growth_rates": ebitda_growth_rates.tolist()
            },
            "correlation_analysis": {
                "service_line_correlation_matrix": correlation_matrix.tolist(),
                "average_correlation": float(np.mean(correlation_matrix[np.triu_indices_from(correlation_matrix, k=1)])),
                "max_correlation": float(np.max(correlation_matrix[np.triu_indices_from(correlation_matrix, k=1)])),
                "min_correlation": float(np.min(correlation_matrix[np.triu_indices_from(correlation_matrix, k=1)]))
            },
            "principal_component_analysis": {
                "explained_variance_ratio": explained_variance_ratio.tolist(),
                "cumulative_variance_explained": np.cumsum(explained_variance_ratio).tolist(),
                "first_pc_loadings": pca.components_[0].tolist()
            },
            "trend_analysis": {
                "revenue_trend": {
                    "slope": float(revenue_slope),
                    "r_squared": float(revenue_r_value**2),
                    "forecast_2025": float(revenue_forecast_2025),
                    "forecast_2026": float(revenue_forecast_2026)
                },
                "ebitda_trend": {
                    "slope": float(ebitda_slope),
                    "r_squared": float(ebitda_r_value**2)
                }
            },
            "statistical_tests": {
                "revenue_growth_normality": {
                    "shapiro_statistic": float(revenue_shapiro_stat) if not np.isnan(revenue_shapiro_stat) else None,
                    "p_value": float(revenue_shapiro_p) if not np.isnan(revenue_shapiro_p) else None,
                    "is_normal": revenue_shapiro_p > 0.05 if not np.isnan(revenue_shapiro_p) else None,
                    "note": "Insufficient data points for normality test" if np.isnan(revenue_shapiro_p) else "Normal distribution test performed"
                }
            }
        }
    
    def _perform_risk_analysis(self) -> Dict:
        """Advanced risk modeling including VaR and stress testing"""
        
        # Historical simulation for VaR calculation
        revenues = np.array(self.data.revenues)
        ebitda = np.array(self.data.ebitda)
        
        # Calculate returns for VaR analysis
        revenue_returns = np.diff(revenues) / revenues[:-1]
        ebitda_returns = np.diff(ebitda) / ebitda[:-1]
        
        # Historical VaR (95% confidence)
        revenue_var_95 = np.percentile(revenue_returns, 5)
        ebitda_var_95 = np.percentile(ebitda_returns, 5)
        
        # Conditional VaR (Expected Shortfall)
        revenue_cvar_95 = np.mean(revenue_returns[revenue_returns <= revenue_var_95])
        ebitda_cvar_95 = np.mean(ebitda_returns[ebitda_returns <= ebitda_var_95])
        
        print(f"   ✓ Revenue VaR (95%): {revenue_var_95:.2%}")
        print(f"   ✓ EBITDA VaR (95%): {ebitda_var_95:.2%}")
        print(f"   ✓ Revenue CVaR (95%): {revenue_cvar_95:.2%}")
        print(f"   ✓ EBITDA CVaR (95%): {ebitda_cvar_95:.2%}")
        
        # Maximum Drawdown Analysis
        cumulative_returns = np.cumprod(1 + revenue_returns)
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdown = (cumulative_returns - running_max) / running_max
        max_drawdown = np.min(drawdown)
        
        print(f"   ✓ Maximum Drawdown: {max_drawdown:.2%}")
        
        # Monte Carlo VaR using parametric approach
        n_simulations = 10000
        
        # Estimate parameters from historical data
        revenue_mean = np.mean(revenue_returns)
        revenue_std = np.std(revenue_returns)
        
        # Generate Monte Carlo scenarios
        mc_revenue_returns = np.random.normal(revenue_mean, revenue_std, n_simulations)
        mc_var_95 = np.percentile(mc_revenue_returns, 5)
        mc_cvar_95 = np.mean(mc_revenue_returns[mc_revenue_returns <= mc_var_95])
        
        print(f"   ✓ Monte Carlo VaR (95%): {mc_var_95:.2%}")
        print(f"   ✓ Monte Carlo CVaR (95%): {mc_cvar_95:.2%}")
        
        # Stress Testing Scenarios
        stress_scenarios = {
            "recession": {
                "revenue_impact": -0.25,  # 25% revenue decline
                "margin_compression": -0.05,  # 5pp margin compression
                "description": "Economic recession scenario"
            },
            "competition": {
                "revenue_impact": -0.15,  # 15% revenue decline
                "margin_compression": -0.03,  # 3pp margin compression  
                "description": "Increased competition scenario"
            },
            "marketing_normalization": {
                "revenue_impact": -0.08,  # 8% revenue decline
                "margin_compression": -0.08,  # 8pp margin compression from marketing increase
                "description": "Marketing expense normalization"
            }
        }
        
        stress_results = {}
        base_revenue_2024 = revenues[-1]
        base_ebitda_2024 = ebitda[-1]
        
        for scenario_name, scenario in stress_scenarios.items():
            stressed_revenue = base_revenue_2024 * (1 + scenario["revenue_impact"])
            stressed_margin = (base_ebitda_2024 / base_revenue_2024) + scenario["margin_compression"]
            stressed_ebitda = stressed_revenue * max(stressed_margin, 0.1)  # Floor at 10% margin
            
            stress_results[scenario_name] = {
                "stressed_revenue": float(stressed_revenue),
                "stressed_ebitda": float(stressed_ebitda),
                "revenue_change": scenario["revenue_impact"],
                "ebitda_change": float((stressed_ebitda - base_ebitda_2024) / base_ebitda_2024),
                "description": scenario["description"]
            }
        
        print(f"   ✓ Stress scenarios calculated: {len(stress_scenarios)} cases")
        
        # Risk-adjusted return calculations
        current_ebitda_margin = base_ebitda_2024 / base_revenue_2024
        risk_adjusted_ebitda = base_ebitda_2024 * (1 + revenue_cvar_95) * (current_ebitda_margin + revenue_cvar_95 * 0.5)
        
        return {
            "value_at_risk": {
                "historical_var_95": float(revenue_var_95),
                "historical_cvar_95": float(revenue_cvar_95),
                "monte_carlo_var_95": float(mc_var_95),
                "monte_carlo_cvar_95": float(mc_cvar_95),
                "confidence_level": 0.95
            },
            "ebitda_risk_metrics": {
                "ebitda_var_95": float(ebitda_var_95),
                "ebitda_cvar_95": float(ebitda_cvar_95),
                "ebitda_volatility": float(np.std(ebitda_returns))
            },
            "drawdown_analysis": {
                "maximum_drawdown": float(max_drawdown),
                "average_drawdown": float(np.mean(drawdown[drawdown < 0])),
                "drawdown_periods": len(drawdown[drawdown < 0])
            },
            "stress_testing": {
                "scenarios": stress_results,
                "worst_case_revenue": min([s["stressed_revenue"] for s in stress_results.values()]),
                "worst_case_ebitda": min([s["stressed_ebitda"] for s in stress_results.values()])
            },
            "risk_adjusted_metrics": {
                "risk_adjusted_ebitda": float(risk_adjusted_ebitda),
                "risk_adjustment_factor": float(risk_adjusted_ebitda / base_ebitda_2024)
            }
        }
    
    def _perform_advanced_valuation(self) -> Dict:
        """Advanced DCF modeling with real options valuation"""
        
        # Base case assumptions
        base_revenue_2024 = self.data.revenues[-1]
        base_ebitda_2024 = self.data.ebitda[-1]
        
        # DCF Model Parameters
        forecast_years = 5
        terminal_growth = 0.025
        wacc = self.data.risk_free_rate + self.data.beta * self.data.market_risk_premium
        
        print(f"   ✓ WACC: {wacc:.2%}")
        print(f"   ✓ Terminal Growth Rate: {terminal_growth:.2%}")
        
        # Revenue projections with multiple scenarios
        revenue_scenarios = {
            "conservative": {"growth_rates": [0.02, 0.02, 0.015, 0.015, 0.01]},
            "base_case": {"growth_rates": [0.05, 0.045, 0.04, 0.035, 0.03]},
            "optimistic": {"growth_rates": [0.08, 0.07, 0.06, 0.05, 0.045]}
        }
        
        dcf_valuations = {}
        
        for scenario_name, scenario in revenue_scenarios.items():
            # Project revenues
            projected_revenues = [base_revenue_2024]
            for growth_rate in scenario["growth_rates"]:
                projected_revenues.append(projected_revenues[-1] * (1 + growth_rate))
            
            # Project EBITDA (assuming gradual margin normalization)
            base_margin = base_ebitda_2024 / base_revenue_2024
            normalized_margin = 0.22  # Target normalized margin after marketing adjustment
            
            projected_ebitda = []
            for i, revenue in enumerate(projected_revenues[1:], 1):
                # Gradual margin convergence
                margin_convergence = base_margin + (normalized_margin - base_margin) * (i / forecast_years)
                projected_ebitda.append(revenue * margin_convergence)
            
            # Project Free Cash Flow
            tax_rate = self.data.tax_rate
            capex_pct_revenue = 0.03  # 3% of revenue for maintenance capex
            working_capital_change = 0.01  # 1% of revenue change
            
            projected_fcf = []
            for i, (revenue, ebitda) in enumerate(zip(projected_revenues[1:], projected_ebitda)):
                nopat = ebitda * (1 - tax_rate)  # Simplified (EBITDA ≈ EBIT for this analysis)
                capex = revenue * capex_pct_revenue
                wc_change = (revenue - projected_revenues[i]) * working_capital_change if i > 0 else 0
                fcf = nopat - capex - wc_change
                projected_fcf.append(fcf)
            
            # Terminal Value
            terminal_fcf = projected_fcf[-1] * (1 + terminal_growth)
            terminal_value = terminal_fcf / (wacc - terminal_growth)
            
            # Discount to present value
            discount_factors = [(1 + wacc) ** -i for i in range(1, forecast_years + 1)]
            terminal_discount_factor = (1 + wacc) ** -forecast_years
            
            pv_fcf = sum(fcf * df for fcf, df in zip(projected_fcf, discount_factors))
            pv_terminal = terminal_value * terminal_discount_factor
            
            enterprise_value = pv_fcf + pv_terminal
            equity_value = enterprise_value - self.data.debt_outstanding
            
            dcf_valuations[scenario_name] = {
                "projected_revenues": projected_revenues[1:],
                "projected_ebitda": projected_ebitda,
                "projected_fcf": projected_fcf,
                "terminal_value": float(terminal_value),
                "enterprise_value": float(enterprise_value),
                "equity_value": float(equity_value),
                "pv_fcf": float(pv_fcf),
                "pv_terminal": float(pv_terminal)
            }
        
        print(f"   ✓ DCF Scenarios calculated: {len(dcf_valuations)}")
        
        # Real Options Valuation (Expansion Option)
        # Model the option to expand into adjacent markets
        expansion_option = self._calculate_expansion_option_value(base_revenue_2024, wacc)
        
        print(f"   ✓ Expansion Option Value: ${expansion_option:.0f}K")
        
        # Weighted average valuation
        scenario_weights = {"conservative": 0.25, "base_case": 0.50, "optimistic": 0.25}
        weighted_enterprise_value = sum(
            dcf_valuations[scenario]["enterprise_value"] * weight 
            for scenario, weight in scenario_weights.items()
        )
        weighted_equity_value = sum(
            dcf_valuations[scenario]["equity_value"] * weight 
            for scenario, weight in scenario_weights.items()
        )
        
        return {
            "dcf_scenarios": dcf_valuations,
            "real_options": {
                "expansion_option_value": float(expansion_option),
                "option_methodology": "Black-Scholes adaptation for growth options"
            },
            "weighted_valuation": {
                "enterprise_value": float(weighted_enterprise_value),
                "equity_value": float(weighted_equity_value),
                "scenario_weights": scenario_weights
            },
            "valuation_multiples": {
                "ev_revenue_2024": float(weighted_enterprise_value / base_revenue_2024),
                "ev_ebitda_2024": float(weighted_enterprise_value / base_ebitda_2024),
                "equity_value_per_dollar_revenue": float(weighted_equity_value / base_revenue_2024)
            },
            "model_assumptions": {
                "wacc": float(wacc),
                "terminal_growth": float(terminal_growth),
                "tax_rate": float(tax_rate),
                "forecast_years": forecast_years
            }
        }
    
    def _calculate_expansion_option_value(self, base_revenue: float, wacc: float) -> float:
        """Calculate real option value for expansion opportunity using Black-Scholes framework"""
        
        # Option parameters
        S = base_revenue * 0.3  # Current "asset value" - estimated expansion potential
        K = 800  # "Strike price" - estimated expansion investment required
        T = 3    # Time to expiration (3 years to decide on expansion)
        r = self.data.risk_free_rate
        sigma = 0.35  # Volatility of expansion opportunity
        
        # Black-Scholes calculation adapted for real options
        d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        
        call_value = S*stats.norm.cdf(d1) - K*np.exp(-r*T)*stats.norm.cdf(d2)
        
        return max(call_value, 0)  # Option value cannot be negative
    
    def _perform_monte_carlo_analysis(self) -> Dict:
        """Monte Carlo simulation for valuation uncertainty"""
        
        n_simulations = 10000
        base_revenue = self.data.revenues[-1]
        base_ebitda = self.data.ebitda[-1]
        
        print(f"   ✓ Running {n_simulations:,} Monte Carlo simulations...")
        
        # Define probability distributions for key variables
        # Revenue growth: Normal distribution based on historical data
        historical_growth_rates = np.diff(self.data.revenues) / np.array(self.data.revenues[:-1])
        growth_mean = np.mean(historical_growth_rates)
        growth_std = np.std(historical_growth_rates)
        
        # EBITDA margin: Beta distribution (bounded between 0 and 1)
        current_margin = base_ebitda / base_revenue
        margin_alpha = 15  # Shape parameters for beta distribution
        margin_beta = 40
        
        # Multiple: Normal distribution
        multiple_mean = 6.0
        multiple_std = 1.2
        
        # Debt: Normal distribution around current estimate
        debt_mean = self.data.debt_outstanding
        debt_std = 300  # Uncertainty in debt estimation
        
        # Run Monte Carlo simulation
        enterprise_values = []
        equity_values = []
        revenue_projections = []
        ebitda_projections = []
        
        for i in range(n_simulations):
            # Sample random variables
            revenue_growth = np.random.normal(growth_mean, growth_std)
            ebitda_margin = np.random.beta(margin_alpha, margin_beta) * 0.4 + 0.1  # Scale to reasonable range
            ev_multiple = np.random.normal(multiple_mean, multiple_std)
            debt_level = np.random.normal(debt_mean, debt_std)
            
            # Bound the variables to reasonable ranges
            revenue_growth = np.clip(revenue_growth, -0.15, 0.20)
            ebitda_margin = np.clip(ebitda_margin, 0.15, 0.45)
            ev_multiple = np.clip(ev_multiple, 3.5, 10.0)
            debt_level = max(debt_level, 0)
            
            # Project 3-year forward values
            projected_revenue = base_revenue * (1 + revenue_growth)**3
            projected_ebitda = projected_revenue * ebitda_margin
            
            # Calculate enterprise and equity values
            enterprise_value = projected_ebitda * ev_multiple
            equity_value = enterprise_value - debt_level
            
            enterprise_values.append(enterprise_value)
            equity_values.append(equity_value)
            revenue_projections.append(projected_revenue)
            ebitda_projections.append(projected_ebitda)
        
        # Calculate statistics
        enterprise_values = np.array(enterprise_values)
        equity_values = np.array(equity_values)
        
        # Percentile analysis
        percentiles = [5, 10, 25, 50, 75, 90, 95]
        ev_percentiles = {f"p{p}": np.percentile(enterprise_values, p) for p in percentiles}
        equity_percentiles = {f"p{p}": np.percentile(equity_values, p) for p in percentiles}
        
        print(f"   ✓ Enterprise Value P50: ${np.median(enterprise_values):,.0f}K")
        print(f"   ✓ Equity Value P50: ${np.median(equity_values):,.0f}K")
        print(f"   ✓ Enterprise Value 90% CI: ${ev_percentiles['p5']:,.0f}K - ${ev_percentiles['p95']:,.0f}K")
        
        # Risk metrics
        probability_positive_equity = np.mean(equity_values > 0)
        probability_ev_above_debt = np.mean(enterprise_values > debt_mean)
        
        return {
            "simulation_parameters": {
                "n_simulations": n_simulations,
                "revenue_growth_mean": float(growth_mean),
                "revenue_growth_std": float(growth_std),
                "margin_distribution": "Beta(15, 40) scaled to [0.1, 0.5]",
                "multiple_mean": multiple_mean,
                "multiple_std": multiple_std
            },
            "enterprise_value_results": {
                "mean": float(np.mean(enterprise_values)),
                "median": float(np.median(enterprise_values)),
                "std": float(np.std(enterprise_values)),
                "percentiles": {k: float(v) for k, v in ev_percentiles.items()},
                "confidence_intervals": {
                    "90_percent": (float(ev_percentiles['p5']), float(ev_percentiles['p95'])),
                    "80_percent": (float(ev_percentiles['p10']), float(ev_percentiles['p90'])),
                    "50_percent": (float(ev_percentiles['p25']), float(ev_percentiles['p75']))
                }
            },
            "equity_value_results": {
                "mean": float(np.mean(equity_values)),
                "median": float(np.median(equity_values)),
                "std": float(np.std(equity_values)),
                "percentiles": {k: float(v) for k, v in equity_percentiles.items()},
                "confidence_intervals": {
                    "90_percent": (float(equity_percentiles['p5']), float(equity_percentiles['p95'])),
                    "80_percent": (float(equity_percentiles['p10']), float(equity_percentiles['p90'])),
                    "50_percent": (float(equity_percentiles['p25']), float(equity_percentiles['p75']))
                }
            },
            "risk_probabilities": {
                "probability_positive_equity": float(probability_positive_equity),
                "probability_ev_exceeds_debt": float(probability_ev_above_debt),
                "probability_ev_below_4000": float(np.mean(enterprise_values < 4000))
            },
            "scenario_analysis": {
                "bear_case_p10": {
                    "enterprise_value": float(ev_percentiles['p10']),
                    "equity_value": float(equity_percentiles['p10'])
                },
                "base_case_p50": {
                    "enterprise_value": float(ev_percentiles['p50']),
                    "equity_value": float(equity_percentiles['p50'])
                },
                "bull_case_p90": {
                    "enterprise_value": float(ev_percentiles['p90']),
                    "equity_value": float(equity_percentiles['p90'])
                }
            }
        }
    
    def _perform_portfolio_analysis(self) -> Dict:
        """Portfolio theory application and capital allocation analysis"""
        
        # Service line analysis as portfolio components
        service_lines = list(self.data.service_line_revenues.keys())
        
        # Calculate returns for each service line
        service_line_returns = {}
        service_line_weights = {}
        total_revenue_2024 = sum(revenues[-1] for revenues in self.data.service_line_revenues.values())
        
        for service_line in service_lines:
            revenues = np.array(self.data.service_line_revenues[service_line])
            returns = np.diff(revenues) / revenues[:-1]
            service_line_returns[service_line] = returns
            service_line_weights[service_line] = revenues[-1] / total_revenue_2024
        
        # Create returns matrix
        returns_matrix = np.array([service_line_returns[sl] for sl in service_lines])
        weights = np.array([service_line_weights[sl] for sl in service_lines])
        
        # Portfolio metrics
        portfolio_return = np.sum(weights * np.mean(returns_matrix, axis=1))
        
        # Covariance matrix
        cov_matrix = np.cov(returns_matrix)
        portfolio_variance = np.dot(weights, np.dot(cov_matrix, weights))
        portfolio_volatility = np.sqrt(portfolio_variance)
        
        # Sharpe ratio (using risk-free rate)
        excess_return = portfolio_return - self.data.risk_free_rate/12  # Monthly approximation
        sharpe_ratio = excess_return / portfolio_volatility if portfolio_volatility > 0 else 0
        
        print(f"   ✓ Portfolio Return: {portfolio_return:.2%}")
        print(f"   ✓ Portfolio Volatility: {portfolio_volatility:.2%}")
        print(f"   ✓ Sharpe Ratio: {sharpe_ratio:.3f}")
        
        # Efficient frontier analysis (simplified)
        # Find minimum variance portfolio
        n_assets = len(service_lines)
        constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        bounds = tuple((0, 1) for _ in range(n_assets))
        
        def portfolio_variance_objective(weights):
            return np.dot(weights, np.dot(cov_matrix, weights))
        
        # Optimize for minimum variance
        min_var_result = minimize(
            portfolio_variance_objective,
            weights,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints
        )
        
        if min_var_result.success:
            optimal_weights = min_var_result.x
            optimal_variance = min_var_result.fun
            optimal_volatility = np.sqrt(optimal_variance)
            optimal_return = np.sum(optimal_weights * np.mean(returns_matrix, axis=1))
            
            print(f"   ✓ Minimum Variance Portfolio Volatility: {optimal_volatility:.2%}")
            print(f"   ✓ Minimum Variance Portfolio Return: {optimal_return:.2%}")
        else:
            optimal_weights = weights
            optimal_variance = portfolio_variance
            optimal_volatility = portfolio_volatility
            optimal_return = portfolio_return
        
        # Diversification benefit
        weighted_avg_volatility = np.sum(weights * np.sqrt(np.diag(cov_matrix)))
        diversification_ratio = portfolio_volatility / weighted_avg_volatility
        
        # Risk contribution analysis
        marginal_contributions = np.dot(cov_matrix, weights) / portfolio_volatility
        risk_contributions = weights * marginal_contributions / portfolio_volatility
        
        print(f"   ✓ Diversification Ratio: {diversification_ratio:.3f}")
        
        return {
            "current_portfolio": {
                "weights": {sl: float(w) for sl, w in zip(service_lines, weights)},
                "expected_return": float(portfolio_return),
                "volatility": float(portfolio_volatility),
                "sharpe_ratio": float(sharpe_ratio)
            },
            "optimal_portfolio": {
                "weights": {sl: float(w) for sl, w in zip(service_lines, optimal_weights)},
                "expected_return": float(optimal_return),
                "volatility": float(optimal_volatility),
                "optimization_success": min_var_result.success
            },
            "risk_analysis": {
                "diversification_ratio": float(diversification_ratio),
                "risk_contributions": {sl: float(rc) for sl, rc in zip(service_lines, risk_contributions)},
                "correlation_matrix": cov_matrix.tolist()
            },
            "portfolio_metrics": {
                "tracking_error": float(np.std(returns_matrix.T @ weights - portfolio_return)),
                "information_ratio": float(sharpe_ratio),  # Simplified
                "maximum_weight": float(np.max(weights)),
                "effective_number_of_assets": float(1 / np.sum(weights**2))
            }
        }
    
    def _perform_sensitivity_analysis(self) -> Dict:
        """Comprehensive sensitivity analysis with confidence intervals"""
        
        base_revenue = self.data.revenues[-1]
        base_ebitda = self.data.ebitda[-1]
        base_ev_multiple = 6.0
        base_enterprise_value = base_ebitda * base_ev_multiple
        
        print(f"   ✓ Base Enterprise Value: ${base_enterprise_value:,.0f}K")
        
        # Define sensitivity variables and ranges
        sensitivity_variables = {
            "revenue_growth": {
                "base": 0.04,
                "range": np.linspace(-0.05, 0.15, 21),
                "description": "Annual revenue growth rate"
            },
            "ebitda_margin": {
                "base": base_ebitda / base_revenue,
                "range": np.linspace(0.15, 0.40, 26),
                "description": "EBITDA margin"
            },
            "ev_multiple": {
                "base": base_ev_multiple,
                "range": np.linspace(4.0, 9.0, 26),
                "description": "EV/EBITDA multiple"
            },
            "marketing_pct": {
                "base": 0.08,  # Normalized marketing percentage
                "range": np.linspace(0.03, 0.15, 25),
                "description": "Marketing as % of revenue"
            }
        }
        
        # One-way sensitivity analysis
        sensitivity_results = {}
        
        for var_name, var_config in sensitivity_variables.items():
            enterprise_values = []
            
            for var_value in var_config["range"]:
                if var_name == "revenue_growth":
                    # 3-year projected revenue
                    projected_revenue = base_revenue * (1 + var_value)**3
                    projected_ebitda = projected_revenue * (base_ebitda / base_revenue)
                    ev = projected_ebitda * base_ev_multiple
                
                elif var_name == "ebitda_margin":
                    projected_ebitda = base_revenue * var_value
                    ev = projected_ebitda * base_ev_multiple
                
                elif var_name == "ev_multiple":
                    ev = base_ebitda * var_value
                
                elif var_name == "marketing_pct":
                    # Adjust EBITDA for marketing expense change
                    marketing_delta = (var_value - 0.08) * base_revenue  # vs normalized
                    adjusted_ebitda = base_ebitda - marketing_delta
                    ev = adjusted_ebitda * base_ev_multiple
                
                enterprise_values.append(ev)
            
            # Calculate sensitivity statistics
            ev_range = max(enterprise_values) - min(enterprise_values)
            ev_volatility = np.std(enterprise_values)
            
            # Find impact per unit change
            var_range = max(var_config["range"]) - min(var_config["range"])
            impact_per_unit = ev_range / var_range
            
            sensitivity_results[var_name] = {
                "description": var_config["description"],
                "base_value": float(var_config["base"]),
                "test_range": var_config["range"].tolist(),
                "enterprise_values": enterprise_values,
                "ev_range": float(ev_range),
                "ev_volatility": float(ev_volatility),
                "impact_per_unit": float(impact_per_unit),
                "elasticity": float((ev_range / base_enterprise_value) / (var_range / var_config["base"]))
            }
        
        # Two-way sensitivity analysis (Revenue Growth vs EBITDA Margin)
        revenue_growth_range = np.linspace(0.00, 0.10, 11)
        ebitda_margin_range = np.linspace(0.20, 0.35, 16)
        
        two_way_matrix = np.zeros((len(revenue_growth_range), len(ebitda_margin_range)))
        
        for i, growth in enumerate(revenue_growth_range):
            for j, margin in enumerate(ebitda_margin_range):
                projected_revenue = base_revenue * (1 + growth)**3
                projected_ebitda = projected_revenue * margin
                ev = projected_ebitda * base_ev_multiple
                two_way_matrix[i, j] = ev
        
        # Tornado chart analysis
        tornado_impacts = []
        for var_name, result in sensitivity_results.items():
            tornado_impacts.append({
                "variable": var_name,
                "description": result["description"],
                "impact_range": result["ev_range"],
                "impact_percentage": result["ev_range"] / base_enterprise_value,
                "elasticity": abs(result["elasticity"])
            })
        
        # Sort by impact magnitude
        tornado_impacts.sort(key=lambda x: x["impact_range"], reverse=True)
        
        print(f"   ✓ Most sensitive variable: {tornado_impacts[0]['variable']}")
        print(f"   ✓ Tornado analysis complete: {len(tornado_impacts)} variables")
        
        # Monte Carlo for confidence intervals
        n_mc_simulations = 5000
        mc_enterprise_values = []
        
        for _ in range(n_mc_simulations):
            # Sample from normal distributions centered on base values
            growth = np.random.normal(0.04, 0.03)  # 4% ± 3%
            margin = np.random.normal(base_ebitda/base_revenue, 0.03)  # ± 3pp
            multiple = np.random.normal(6.0, 1.0)  # 6.0x ± 1.0x
            
            # Bound the variables
            growth = np.clip(growth, -0.10, 0.20)
            margin = np.clip(margin, 0.10, 0.50)
            multiple = np.clip(multiple, 3.0, 10.0)
            
            # Calculate enterprise value
            projected_revenue = base_revenue * (1 + growth)**3
            projected_ebitda = projected_revenue * margin
            ev = projected_ebitda * multiple
            
            mc_enterprise_values.append(ev)
        
        mc_enterprise_values = np.array(mc_enterprise_values)
        
        # Confidence intervals
        confidence_intervals = {
            "90_percent": (float(np.percentile(mc_enterprise_values, 5)), 
                          float(np.percentile(mc_enterprise_values, 95))),
            "80_percent": (float(np.percentile(mc_enterprise_values, 10)),
                          float(np.percentile(mc_enterprise_values, 90))),
            "68_percent": (float(np.percentile(mc_enterprise_values, 16)),
                          float(np.percentile(mc_enterprise_values, 84)))
        }
        
        return {
            "one_way_sensitivity": sensitivity_results,
            "two_way_analysis": {
                "revenue_growth_range": revenue_growth_range.tolist(),
                "ebitda_margin_range": ebitda_margin_range.tolist(),
                "enterprise_value_matrix": two_way_matrix.tolist(),
                "max_value": float(np.max(two_way_matrix)),
                "min_value": float(np.min(two_way_matrix))
            },
            "tornado_analysis": {
                "ranked_impacts": tornado_impacts,
                "most_sensitive_variable": tornado_impacts[0]["variable"],
                "least_sensitive_variable": tornado_impacts[-1]["variable"]
            },
            "confidence_intervals": {
                "base_enterprise_value": float(base_enterprise_value),
                "confidence_bands": confidence_intervals,
                "monte_carlo_mean": float(np.mean(mc_enterprise_values)),
                "monte_carlo_std": float(np.std(mc_enterprise_values))
            }
        }
    
    def _generate_executive_summary(self, statistical_results, risk_results, 
                                   valuation_results, monte_carlo_results,
                                   portfolio_results, sensitivity_results) -> Dict:
        """Generate comprehensive executive summary"""
        
        # Key findings
        base_revenue = self.data.revenues[-1]
        base_ebitda = self.data.ebitda[-1]
        
        # Valuation ranges
        dcf_enterprise_value = valuation_results["weighted_valuation"]["enterprise_value"]
        mc_median_ev = monte_carlo_results["enterprise_value_results"]["median"]
        mc_90_ci = monte_carlo_results["enterprise_value_results"]["confidence_intervals"]["90_percent"]
        
        # Risk metrics
        revenue_var_95 = risk_results["value_at_risk"]["historical_var_95"]
        max_drawdown = risk_results["drawdown_analysis"]["maximum_drawdown"]
        
        # Portfolio metrics
        current_sharpe = portfolio_results["current_portfolio"]["sharpe_ratio"]
        diversification_ratio = portfolio_results["risk_analysis"]["diversification_ratio"]
        
        return {
            "investment_thesis": {
                "recommendation": "CONDITIONAL PROCEED",
                "confidence_level": "MODERATE",
                "key_driver": "Marketing expense normalization critical to valuation"
            },
            "valuation_summary": {
                "dcf_enterprise_value": float(dcf_enterprise_value),
                "monte_carlo_median_ev": float(mc_median_ev),
                "valuation_range_90_ci": mc_90_ci,
                "ev_revenue_multiple": float(dcf_enterprise_value / base_revenue),
                "ev_ebitda_multiple": float(dcf_enterprise_value / base_ebitda)
            },
            "risk_assessment": {
                "revenue_var_95": float(revenue_var_95),
                "maximum_drawdown": float(max_drawdown),
                "probability_positive_equity": float(monte_carlo_results["risk_probabilities"]["probability_positive_equity"]),
                "risk_rating": "MODERATE-HIGH"
            },
            "portfolio_characteristics": {
                "current_sharpe_ratio": float(current_sharpe),
                "diversification_benefit": float(1 - diversification_ratio),
                "effective_number_of_assets": float(portfolio_results["portfolio_metrics"]["effective_number_of_assets"]),
                "portfolio_quality": "WELL-DIVERSIFIED"
            },
            "key_sensitivities": {
                "most_sensitive_variable": sensitivity_results["tornado_analysis"]["most_sensitive_variable"],
                "top_3_risks": [impact["variable"] for impact in sensitivity_results["tornado_analysis"]["ranked_impacts"][:3]]
            },
            "critical_assumptions": {
                "marketing_normalization": "Essential - 8% of revenue assumed",
                "ebitda_margin_sustainability": "Key risk - current 29% may not be sustainable",
                "growth_trajectory": "Moderate growth assumed - 4% annually",
                "market_multiple": "6.0x EBITDA - within reasonable range"
            }
        }


def create_medispa_financial_data() -> QuantitativeFinancialData:
    """Create structured financial data for quantitative analysis"""
    
    # Historical financial data (in thousands)
    revenues = [3566, 3620, 3726]
    
    # Calculate EBITDA (Operating Income + D&A)
    operating_income = [650, 1131, 1432]
    depreciation = [167, 150, 135]
    ebitda = [oi + da for oi, da in zip(operating_income, depreciation)]
    
    # Approximate Free Cash Flow (simplified)
    tax_rate = 0.25
    capex_estimate = [200, 180, 165]  # Estimated based on depreciation
    free_cash_flow = [oi * (1 - tax_rate) - capex for oi, capex in zip(operating_income, capex_estimate)]
    
    # Service line revenues
    service_line_revenues = {
        "energy_devices": [318, 270, 246],
        "injectables": [1124, 1045, 930],
        "wellness": [568, 653, 764],
        "weightloss": [617, 636, 718],
        "retail_sales": [323, 332, 335],
        "surgery": [617, 685, 733]
    }
    
    # Estimate service line margins (simplified)
    service_line_margins = {
        "energy_devices": [0.93, 0.95, 0.90],  # High margin
        "injectables": [0.67, 0.69, 0.70],     # Good margin
        "wellness": [0.67, 0.69, 0.65],        # Moderate margin
        "weightloss": [0.58, 0.60, 0.63],      # Lower margin
        "retail_sales": [0.51, 0.49, 0.61],    # Variable margin
        "surgery": [0.88, 0.85, 0.81]          # High margin
    }
    
    # Cost structure
    marketing_expenses = [499, 253, 37]  # The anomaly
    fixed_costs = [800, 850, 900]  # Estimated fixed costs
    variable_costs = [r - fc for r, fc in zip(revenues, fixed_costs)]  # Residual
    
    return QuantitativeFinancialData(
        revenues=revenues,
        ebitda=ebitda,
        operating_income=operating_income,
        free_cash_flow=free_cash_flow,
        service_line_revenues=service_line_revenues,
        service_line_margins=service_line_margins,
        marketing_expenses=marketing_expenses,
        fixed_costs=fixed_costs,
        variable_costs=variable_costs
    )


def main():
    """Execute comprehensive independent quantitative analysis"""
    
    print("🎯 INDEPENDENT QUANTITATIVE ANALYSIS")
    print("Multi-Service Medispa Case - Advanced Financial Modeling")
    print("=" * 80)
    
    # Create financial data structure
    financial_data = create_medispa_financial_data()
    
    # Initialize quantitative analyzer
    analyzer = IndependentQuantitativeAnalyzer(financial_data)
    
    # Run comprehensive analysis
    results = analyzer.run_comprehensive_analysis()
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"independent_quantitative_analysis_{timestamp}.json"
    
    # Convert numpy arrays to lists for JSON serialization
    def convert_numpy(obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        return obj
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=convert_numpy)
    
    # Print executive summary
    exec_summary = results["executive_summary"]
    
    print("\n" + "="*80)
    print("🎯 EXECUTIVE SUMMARY - QUANTITATIVE ANALYSIS RESULTS")
    print("="*80)
    
    print(f"\n📊 INVESTMENT RECOMMENDATION: {exec_summary['investment_thesis']['recommendation']}")
    print(f"Confidence Level: {exec_summary['investment_thesis']['confidence_level']}")
    print(f"Key Driver: {exec_summary['investment_thesis']['key_driver']}")
    
    print(f"\n💰 VALUATION SUMMARY:")
    print(f"   DCF Enterprise Value: ${exec_summary['valuation_summary']['dcf_enterprise_value']:,.0f}K")
    print(f"   Monte Carlo Median EV: ${exec_summary['valuation_summary']['monte_carlo_median_ev']:,.0f}K")
    print(f"   90% Confidence Interval: ${exec_summary['valuation_summary']['valuation_range_90_ci'][0]:,.0f}K - ${exec_summary['valuation_summary']['valuation_range_90_ci'][1]:,.0f}K")
    print(f"   EV/Revenue Multiple: {exec_summary['valuation_summary']['ev_revenue_multiple']:.2f}x")
    print(f"   EV/EBITDA Multiple: {exec_summary['valuation_summary']['ev_ebitda_multiple']:.2f}x")
    
    print(f"\n⚠️  RISK ASSESSMENT:")
    print(f"   Revenue VaR (95%): {exec_summary['risk_assessment']['revenue_var_95']:.2%}")
    print(f"   Maximum Drawdown: {exec_summary['risk_assessment']['maximum_drawdown']:.2%}")
    print(f"   Probability Positive Equity: {exec_summary['risk_assessment']['probability_positive_equity']:.1%}")
    print(f"   Risk Rating: {exec_summary['risk_assessment']['risk_rating']}")
    
    print(f"\n📈 PORTFOLIO CHARACTERISTICS:")
    print(f"   Current Sharpe Ratio: {exec_summary['portfolio_characteristics']['current_sharpe_ratio']:.3f}")
    print(f"   Diversification Benefit: {exec_summary['portfolio_characteristics']['diversification_benefit']:.1%}")
    print(f"   Effective # of Assets: {exec_summary['portfolio_characteristics']['effective_number_of_assets']:.1f}")
    print(f"   Portfolio Quality: {exec_summary['portfolio_characteristics']['portfolio_quality']}")
    
    print(f"\n🎯 KEY SENSITIVITIES:")
    print(f"   Most Sensitive Variable: {exec_summary['key_sensitivities']['most_sensitive_variable']}")
    print(f"   Top 3 Risk Factors: {', '.join(exec_summary['key_sensitivities']['top_3_risks'])}")
    
    print(f"\n⚡ CRITICAL ASSUMPTIONS:")
    for assumption, description in exec_summary['critical_assumptions'].items():
        print(f"   {assumption.replace('_', ' ').title()}: {description}")
    
    print(f"\n✅ Analysis Complete!")
    print(f"📁 Detailed Results Saved: {results_file}")
    print(f"📊 Total Analysis Components: {len(results) - 2}")  # Excluding metadata and summary
    
    return results


if __name__ == "__main__":
    results = main()