#!/usr/bin/env python3
"""
INDEPENDENT QUANTITATIVE ANALYSIS - Multi-Service Medispa Case
Simplified Version - Advanced Quantitative Finance Results

This analysis provides key quantitative metrics and recommendations:
- Statistical analysis and risk modeling  
- Monte Carlo valuation with confidence intervals
- Portfolio optimization and sensitivity analysis
- Investment recommendation with supporting mathematics

Financial Data: Revenue $3.7M, EBITDA Margin 29.1%, 6 Service Lines
"""

import numpy as np
import pandas as pd
import scipy.stats as stats
from scipy.optimize import minimize
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
np.random.seed(42)

class SimplifiedQuantitativeAnalyzer:
    """Streamlined quantitative analysis for medispa valuation"""
    
    def __init__(self):
        # Financial data (in thousands)
        self.revenues = np.array([3566, 3620, 3726])
        self.operating_income = np.array([650, 1131, 1432])
        self.ebitda = np.array([817, 1281, 1567])  # OI + D&A
        
        # Service line data
        self.service_lines = {
            "energy_devices": [318, 270, 246],
            "injectables": [1124, 1045, 930], 
            "wellness": [568, 653, 764],
            "weightloss": [617, 636, 718],
            "retail_sales": [323, 332, 335],
            "surgery": [617, 685, 733]
        }
        
        # Market parameters
        self.risk_free_rate = 0.045
        self.market_risk_premium = 0.055
        self.beta = 1.2
        self.wacc = self.risk_free_rate + self.beta * self.market_risk_premium
        self.tax_rate = 0.25
        
    def run_analysis(self):
        """Execute comprehensive quantitative analysis"""
        
        print("🎯 INDEPENDENT QUANTITATIVE ANALYSIS")
        print("Multi-Service Medispa Case - Quantitative Finance Model")
        print("=" * 65)
        
        results = {
            "analysis_metadata": {
                "analysis_date": datetime.now().isoformat(),
                "analyst": "Independent Quantitative Finance Team",
                "methodology": "Advanced Statistical & Monte Carlo Analysis"
            }
        }
        
        # 1. Statistical Analysis
        print("\n1️⃣  STATISTICAL ANALYSIS")
        statistical_results = self._statistical_analysis()
        results["statistical_analysis"] = statistical_results
        
        # 2. Risk Analysis  
        print("\n2️⃣  RISK MODELING")
        risk_results = self._risk_analysis()
        results["risk_analysis"] = risk_results
        
        # 3. Valuation Analysis
        print("\n3️⃣  VALUATION MODELING")
        valuation_results = self._valuation_analysis()
        results["valuation_analysis"] = valuation_results
        
        # 4. Monte Carlo Analysis
        print("\n4️⃣  MONTE CARLO SIMULATION")
        monte_carlo_results = self._monte_carlo_analysis()
        results["monte_carlo_analysis"] = monte_carlo_results
        
        # 5. Portfolio Analysis
        print("\n5️⃣  PORTFOLIO OPTIMIZATION")
        portfolio_results = self._portfolio_analysis()
        results["portfolio_analysis"] = portfolio_results
        
        # 6. Sensitivity Analysis
        print("\n6️⃣  SENSITIVITY ANALYSIS")
        sensitivity_results = self._sensitivity_analysis()
        results["sensitivity_analysis"] = sensitivity_results
        
        # 7. Investment Recommendation
        print("\n7️⃣  INVESTMENT RECOMMENDATION")
        recommendation = self._generate_recommendation(results)
        results["investment_recommendation"] = recommendation
        
        return results
    
    def _statistical_analysis(self):
        """Core statistical analysis"""
        
        # Growth rates and volatility
        revenue_growth = np.diff(self.revenues) / self.revenues[:-1]
        ebitda_growth = np.diff(self.ebitda) / self.ebitda[:-1]
        
        revenue_volatility = np.std(revenue_growth)
        ebitda_volatility = np.std(ebitda_growth)
        
        # Service line correlation
        service_df = pd.DataFrame(self.service_lines)
        correlation_matrix = service_df.corr()
        avg_correlation = correlation_matrix.values[np.triu_indices_from(correlation_matrix.values, k=1)].mean()
        
        # Trend analysis
        years = np.array([0, 1, 2])
        revenue_slope, _, revenue_r2, _, _ = stats.linregress(years, self.revenues)
        ebitda_slope, _, ebitda_r2, _, _ = stats.linregress(years, self.ebitda)
        
        print(f"   ✓ Revenue Growth Volatility: {revenue_volatility:.2%}")
        print(f"   ✓ EBITDA Growth Volatility: {ebitda_volatility:.2%}")
        print(f"   ✓ Average Service Line Correlation: {avg_correlation:.3f}")
        print(f"   ✓ Revenue Trend: ${revenue_slope:.0f}K/year (R² = {revenue_r2:.3f})")
        print(f"   ✓ EBITDA Trend: ${ebitda_slope:.0f}K/year (R² = {ebitda_r2:.3f})")
        
        return {
            "revenue_growth_volatility": float(revenue_volatility),
            "ebitda_growth_volatility": float(ebitda_volatility),
            "average_service_correlation": float(avg_correlation),
            "revenue_trend_slope": float(revenue_slope),
            "revenue_trend_r2": float(revenue_r2),
            "ebitda_trend_slope": float(ebitda_slope),
            "ebitda_trend_r2": float(ebitda_r2),
            "revenue_growth_rates": revenue_growth.tolist(),
            "ebitda_growth_rates": ebitda_growth.tolist()
        }
    
    def _risk_analysis(self):
        """Risk modeling and VaR calculations"""
        
        # Value at Risk calculations
        revenue_growth = np.diff(self.revenues) / self.revenues[:-1]
        ebitda_growth = np.diff(self.ebitda) / self.ebitda[:-1]
        
        # Historical VaR (5th percentile)
        revenue_var_95 = np.percentile(revenue_growth, 5)
        ebitda_var_95 = np.percentile(ebitda_growth, 5)
        
        # Conditional VaR (Expected Shortfall)
        revenue_cvar_95 = np.mean(revenue_growth[revenue_growth <= revenue_var_95])
        ebitda_cvar_95 = np.mean(ebitda_growth[ebitda_growth <= ebitda_var_95])
        
        # Monte Carlo VaR
        n_sim = 5000
        mc_revenue_growth = np.random.normal(np.mean(revenue_growth), np.std(revenue_growth), n_sim)
        mc_var_95 = np.percentile(mc_revenue_growth, 5)
        
        # Stress testing scenarios
        current_revenue = self.revenues[-1]
        current_ebitda = self.ebitda[-1]
        
        stress_scenarios = {
            "recession": {
                "revenue_impact": -0.25,
                "ebitda_impact": -0.35,
                "probability": 0.10
            },
            "competition": {
                "revenue_impact": -0.15,
                "ebitda_impact": -0.20,
                "probability": 0.20
            },
            "marketing_normalization": {
                "revenue_impact": -0.05,
                "ebitda_impact": -0.15,
                "probability": 0.70
            }
        }
        
        stressed_values = {}
        for scenario, params in stress_scenarios.items():
            stressed_revenue = current_revenue * (1 + params["revenue_impact"])
            stressed_ebitda = current_ebitda * (1 + params["ebitda_impact"])
            stressed_values[scenario] = {
                "revenue": float(stressed_revenue),
                "ebitda": float(stressed_ebitda),
                "probability": params["probability"]
            }
        
        print(f"   ✓ Revenue VaR (95%): {revenue_var_95:.2%}")
        print(f"   ✓ EBITDA VaR (95%): {ebitda_var_95:.2%}")
        print(f"   ✓ Monte Carlo VaR (95%): {mc_var_95:.2%}")
        print(f"   ✓ Stress scenarios: {len(stress_scenarios)} cases")
        
        return {
            "value_at_risk_95": {
                "revenue_var": float(revenue_var_95),
                "ebitda_var": float(ebitda_var_95),
                "revenue_cvar": float(revenue_cvar_95),
                "ebitda_cvar": float(ebitda_cvar_95),
                "monte_carlo_var": float(mc_var_95)
            },
            "stress_scenarios": stressed_values,
            "risk_metrics": {
                "revenue_volatility": float(np.std(revenue_growth)),
                "ebitda_volatility": float(np.std(ebitda_growth))
            }
        }
    
    def _valuation_analysis(self):
        """Advanced DCF and valuation analysis"""
        
        base_revenue = self.revenues[-1]
        base_ebitda = self.ebitda[-1]
        
        # Scenario-based DCF
        scenarios = {
            "conservative": {"growth": [0.02, 0.02, 0.015, 0.015, 0.01], "margin": 0.20},
            "base_case": {"growth": [0.05, 0.04, 0.035, 0.03, 0.025], "margin": 0.25},
            "optimistic": {"growth": [0.08, 0.07, 0.06, 0.05, 0.045], "margin": 0.30}
        }
        
        dcf_results = {}
        
        for scenario_name, params in scenarios.items():
            # Project revenues
            revenues = [base_revenue]
            for growth in params["growth"]:
                revenues.append(revenues[-1] * (1 + growth))
            
            # Project EBITDA and FCF
            terminal_growth = 0.025
            projected_fcf = []
            
            for i, revenue in enumerate(revenues[1:], 1):
                ebitda = revenue * params["margin"] 
                nopat = ebitda * (1 - self.tax_rate)
                capex = revenue * 0.03  # 3% maintenance capex
                fcf = nopat - capex
                projected_fcf.append(fcf)
            
            # Terminal value
            terminal_fcf = projected_fcf[-1] * (1 + terminal_growth)
            terminal_value = terminal_fcf / (self.wacc - terminal_growth)
            
            # Present value calculation
            discount_factors = [(1 + self.wacc) ** -i for i in range(1, 6)]
            pv_fcf = sum(fcf * df for fcf, df in zip(projected_fcf, discount_factors))
            pv_terminal = terminal_value * discount_factors[-1]
            
            enterprise_value = pv_fcf + pv_terminal
            equity_value = enterprise_value - 2300  # Estimated debt
            
            dcf_results[scenario_name] = {
                "enterprise_value": float(enterprise_value),
                "equity_value": float(equity_value),
                "terminal_value": float(terminal_value),
                "pv_fcf": float(pv_fcf)
            }
        
        # Weighted valuation
        weights = {"conservative": 0.25, "base_case": 0.50, "optimistic": 0.25}
        weighted_ev = sum(dcf_results[s]["enterprise_value"] * w for s, w in weights.items())
        weighted_equity = sum(dcf_results[s]["equity_value"] * w for s, w in weights.items())
        
        # Real options value (expansion opportunity)
        expansion_option_value = self._black_scholes_option(
            S=base_revenue * 0.3,  # Potential market size
            K=800,  # Investment required
            T=3,    # Time to expiration
            r=self.risk_free_rate,
            sigma=0.35  # Volatility of opportunity
        )
        
        print(f"   ✓ DCF Enterprise Value (Base): ${dcf_results['base_case']['enterprise_value']:,.0f}K")
        print(f"   ✓ Weighted Enterprise Value: ${weighted_ev:,.0f}K")
        print(f"   ✓ Expansion Option Value: ${expansion_option_value:.0f}K")
        print(f"   ✓ EV/Revenue Multiple: {weighted_ev/base_revenue:.2f}x")
        print(f"   ✓ EV/EBITDA Multiple: {weighted_ev/base_ebitda:.2f}x")
        
        return {
            "dcf_scenarios": dcf_results,
            "weighted_valuation": {
                "enterprise_value": float(weighted_ev),
                "equity_value": float(weighted_equity),
                "weights": weights
            },
            "real_options": {
                "expansion_option_value": float(expansion_option_value)
            },
            "valuation_multiples": {
                "ev_revenue": float(weighted_ev / base_revenue),
                "ev_ebitda": float(weighted_ev / base_ebitda)
            },
            "assumptions": {
                "wacc": float(self.wacc),
                "terminal_growth": 0.025,
                "tax_rate": float(self.tax_rate)
            }
        }
    
    def _black_scholes_option(self, S, K, T, r, sigma):
        """Black-Scholes option valuation for real options"""
        
        d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        
        call_value = S*stats.norm.cdf(d1) - K*np.exp(-r*T)*stats.norm.cdf(d2)
        return max(call_value, 0)
    
    def _monte_carlo_analysis(self):
        """Monte Carlo simulation for valuation uncertainty"""
        
        n_simulations = 10000
        base_revenue = self.revenues[-1]
        base_ebitda = self.ebitda[-1]
        
        # Define probability distributions
        # Revenue growth: Historical mean and std
        growth_rates = np.diff(self.revenues) / self.revenues[:-1]
        growth_mean = np.mean(growth_rates)
        growth_std = np.std(growth_rates)
        
        # EBITDA margin: Current with uncertainty
        current_margin = base_ebitda / base_revenue
        
        # Simulation
        enterprise_values = []
        equity_values = []
        
        for _ in range(n_simulations):
            # Sample variables
            future_growth = np.random.normal(growth_mean, growth_std)
            ebitda_margin = np.random.normal(current_margin, 0.05)  # 5% margin uncertainty
            ev_multiple = np.random.normal(6.0, 1.2)  # Market multiple uncertainty
            debt = np.random.normal(2300, 300)  # Debt uncertainty
            
            # Bound variables
            future_growth = np.clip(future_growth, -0.15, 0.20)
            ebitda_margin = np.clip(ebitda_margin, 0.15, 0.45)
            ev_multiple = np.clip(ev_multiple, 3.5, 10.0)
            debt = max(debt, 0)
            
            # 3-year projection
            projected_revenue = base_revenue * (1 + future_growth)**3
            projected_ebitda = projected_revenue * ebitda_margin
            
            # Valuation
            enterprise_value = projected_ebitda * ev_multiple
            equity_value = enterprise_value - debt
            
            enterprise_values.append(enterprise_value)
            equity_values.append(equity_value)
        
        # Calculate statistics
        ev_array = np.array(enterprise_values)
        equity_array = np.array(equity_values)
        
        # Confidence intervals
        ev_percentiles = {
            "p5": np.percentile(ev_array, 5),
            "p10": np.percentile(ev_array, 10),
            "p25": np.percentile(ev_array, 25),
            "p50": np.percentile(ev_array, 50),
            "p75": np.percentile(ev_array, 75),
            "p90": np.percentile(ev_array, 90),
            "p95": np.percentile(ev_array, 95)
        }
        
        equity_percentiles = {
            "p5": np.percentile(equity_array, 5),
            "p25": np.percentile(equity_array, 25),
            "p50": np.percentile(equity_array, 50),
            "p75": np.percentile(equity_array, 75),
            "p95": np.percentile(equity_array, 95)
        }
        
        # Risk probabilities
        prob_positive_equity = np.mean(equity_array > 0)
        prob_ev_above_5000 = np.mean(ev_array > 5000)
        
        print(f"   ✓ Simulations: {n_simulations:,}")
        print(f"   ✓ Enterprise Value P50: ${ev_percentiles['p50']:,.0f}K")
        print(f"   ✓ Equity Value P50: ${equity_percentiles['p50']:,.0f}K")
        print(f"   ✓ 90% Confidence Interval: ${ev_percentiles['p5']:,.0f}K - ${ev_percentiles['p95']:,.0f}K")
        print(f"   ✓ Probability Positive Equity: {prob_positive_equity:.1%}")
        
        return {
            "simulation_parameters": {
                "n_simulations": n_simulations,
                "growth_mean": float(growth_mean),
                "growth_std": float(growth_std)
            },
            "enterprise_value_results": {
                "mean": float(np.mean(ev_array)),
                "std": float(np.std(ev_array)),
                "percentiles": {k: float(v) for k, v in ev_percentiles.items()},
                "confidence_intervals": {
                    "90_percent": (float(ev_percentiles['p5']), float(ev_percentiles['p95'])),
                    "50_percent": (float(ev_percentiles['p25']), float(ev_percentiles['p75']))
                }
            },
            "equity_value_results": {
                "mean": float(np.mean(equity_array)),
                "std": float(np.std(equity_array)),
                "percentiles": {k: float(v) for k, v in equity_percentiles.items()},
                "confidence_intervals": {
                    "90_percent": (float(equity_percentiles['p5']), float(equity_percentiles['p95']))
                }
            },
            "risk_probabilities": {
                "probability_positive_equity": float(prob_positive_equity),
                "probability_ev_above_5000": float(prob_ev_above_5000)
            }
        }
    
    def _portfolio_analysis(self):
        """Portfolio theory application to service lines"""
        
        # Service line performance analysis
        service_data = pd.DataFrame(self.service_lines)
        
        # Calculate returns for each service line
        returns_data = service_data.pct_change().dropna()
        
        # Current weights (2024 revenue share)
        total_revenue_2024 = sum(revenues[-1] for revenues in self.service_lines.values())
        weights = np.array([revenues[-1]/total_revenue_2024 for revenues in self.service_lines.values()])
        
        # Portfolio metrics
        mean_returns = returns_data.mean().values
        cov_matrix = returns_data.cov().values
        
        # Current portfolio return and risk
        portfolio_return = np.dot(weights, mean_returns)
        portfolio_variance = np.dot(weights, np.dot(cov_matrix, weights))
        portfolio_volatility = np.sqrt(portfolio_variance)
        
        # Sharpe ratio
        excess_return = portfolio_return - self.risk_free_rate/12  # Monthly approximation
        sharpe_ratio = excess_return / portfolio_volatility if portfolio_volatility > 0 else 0
        
        # Optimization for minimum variance portfolio
        n_assets = len(self.service_lines)
        constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        bounds = tuple((0, 1) for _ in range(n_assets))
        
        def portfolio_variance_obj(w):
            return np.dot(w, np.dot(cov_matrix, w))
        
        result = minimize(portfolio_variance_obj, weights, method='SLSQP',
                         bounds=bounds, constraints=constraints)
        
        if result.success:
            optimal_weights = result.x
            optimal_return = np.dot(optimal_weights, mean_returns)
            optimal_volatility = np.sqrt(result.fun)
        else:
            optimal_weights = weights
            optimal_return = portfolio_return
            optimal_volatility = portfolio_volatility
        
        # Diversification metrics
        weighted_avg_vol = np.sqrt(np.dot(weights**2, np.diag(cov_matrix)))
        diversification_ratio = portfolio_volatility / weighted_avg_vol
        effective_assets = 1 / np.sum(weights**2)
        
        print(f"   ✓ Current Portfolio Return: {portfolio_return:.2%}")
        print(f"   ✓ Current Portfolio Volatility: {portfolio_volatility:.2%}")
        print(f"   ✓ Sharpe Ratio: {sharpe_ratio:.3f}")
        print(f"   ✓ Diversification Ratio: {diversification_ratio:.3f}")
        print(f"   ✓ Effective Number of Assets: {effective_assets:.1f}")
        
        return {
            "current_portfolio": {
                "weights": {list(self.service_lines.keys())[i]: float(w) 
                           for i, w in enumerate(weights)},
                "return": float(portfolio_return),
                "volatility": float(portfolio_volatility),
                "sharpe_ratio": float(sharpe_ratio)
            },
            "optimal_portfolio": {
                "weights": {list(self.service_lines.keys())[i]: float(w) 
                           for i, w in enumerate(optimal_weights)},
                "return": float(optimal_return),
                "volatility": float(optimal_volatility)
            },
            "diversification_metrics": {
                "diversification_ratio": float(diversification_ratio),
                "effective_number_assets": float(effective_assets),
                "concentration_risk": float(np.max(weights))
            }
        }
    
    def _sensitivity_analysis(self):
        """Comprehensive sensitivity analysis"""
        
        base_ebitda = self.ebitda[-1]
        base_multiple = 6.0
        base_ev = base_ebitda * base_multiple
        
        # Define sensitivity variables
        variables = {
            "ebitda_multiple": {"range": np.linspace(4.0, 9.0, 21), "base": 6.0},
            "ebitda_margin": {"range": np.linspace(0.15, 0.40, 21), "base": base_ebitda/self.revenues[-1]},
            "revenue_growth": {"range": np.linspace(-0.05, 0.15, 21), "base": 0.04},
            "marketing_pct": {"range": np.linspace(0.03, 0.15, 21), "base": 0.08}
        }
        
        sensitivity_results = {}
        
        for var_name, var_config in variables.items():
            enterprise_values = []
            
            for value in var_config["range"]:
                if var_name == "ebitda_multiple":
                    ev = base_ebitda * value
                elif var_name == "ebitda_margin":
                    adjusted_ebitda = self.revenues[-1] * value
                    ev = adjusted_ebitda * base_multiple
                elif var_name == "revenue_growth":
                    projected_revenue = self.revenues[-1] * (1 + value)**3
                    projected_ebitda = projected_revenue * (base_ebitda/self.revenues[-1])
                    ev = projected_ebitda * base_multiple
                elif var_name == "marketing_pct":
                    marketing_adjustment = (value - 0.08) * self.revenues[-1]
                    adjusted_ebitda = base_ebitda - marketing_adjustment
                    ev = adjusted_ebitda * base_multiple
                
                enterprise_values.append(ev)
            
            # Calculate impact metrics
            ev_range = max(enterprise_values) - min(enterprise_values)
            impact = ev_range / base_ev
            
            sensitivity_results[var_name] = {
                "base_value": float(var_config["base"]),
                "ev_range": float(ev_range),
                "impact_percentage": float(impact),
                "enterprise_values": enterprise_values
            }
        
        # Rank by impact
        ranked_variables = sorted(sensitivity_results.items(), 
                                key=lambda x: x[1]["impact_percentage"], reverse=True)
        
        print(f"   ✓ Base Enterprise Value: ${base_ev:,.0f}K")
        print(f"   ✓ Most Sensitive: {ranked_variables[0][0]} ({ranked_variables[0][1]['impact_percentage']:.1%} impact)")
        print(f"   ✓ Sensitivity Variables: {len(variables)}")
        
        return {
            "base_enterprise_value": float(base_ev),
            "sensitivity_results": sensitivity_results,
            "ranked_impact": [(var, data["impact_percentage"]) 
                            for var, data in ranked_variables],
            "tornado_chart_data": {
                "variables": [var for var, _ in ranked_variables],
                "impacts": [data["impact_percentage"] for _, data in ranked_variables]
            }
        }
    
    def _generate_recommendation(self, results):
        """Generate investment recommendation based on quantitative analysis"""
        
        # Extract key metrics
        weighted_ev = results["valuation_analysis"]["weighted_valuation"]["enterprise_value"]
        weighted_equity = results["valuation_analysis"]["weighted_valuation"]["equity_value"]
        mc_ev_median = results["monte_carlo_analysis"]["enterprise_value_results"]["percentiles"]["p50"]
        prob_positive_equity = results["monte_carlo_analysis"]["risk_probabilities"]["probability_positive_equity"]
        
        # Risk metrics
        revenue_var = results["risk_analysis"]["value_at_risk_95"]["revenue_var"]
        ebitda_var = results["risk_analysis"]["value_at_risk_95"]["ebitda_var"]
        
        # Portfolio metrics
        sharpe_ratio = results["portfolio_analysis"]["current_portfolio"]["sharpe_ratio"]
        diversification_ratio = results["portfolio_analysis"]["diversification_metrics"]["diversification_ratio"]
        
        # Decision criteria
        ev_revenue_multiple = weighted_ev / self.revenues[-1]
        ev_ebitda_multiple = weighted_ev / self.ebitda[-1]
        
        # Generate recommendation
        if (prob_positive_equity > 0.85 and 
            ev_revenue_multiple < 2.0 and 
            ev_ebitda_multiple < 7.0 and
            sharpe_ratio > 2.0):
            recommendation = "STRONG BUY"
            confidence = "HIGH"
        elif (prob_positive_equity > 0.70 and 
              ev_revenue_multiple < 2.5 and 
              ev_ebitda_multiple < 8.0):
            recommendation = "BUY"
            confidence = "MODERATE"
        elif (prob_positive_equity > 0.60 and 
              ev_revenue_multiple < 3.0):
            recommendation = "CONDITIONAL BUY"
            confidence = "MODERATE"
        else:
            recommendation = "HOLD/CAUTION"
            confidence = "LOW"
        
        # Key risks and strengths
        strengths = []
        risks = []
        
        if sharpe_ratio > 3.0:
            strengths.append("Excellent risk-adjusted returns")
        if diversification_ratio < 0.5:
            strengths.append("Well-diversified revenue streams")
        if results["statistical_analysis"]["revenue_trend_r2"] > 0.9:
            strengths.append("Strong revenue growth trend")
        
        if abs(revenue_var) > 0.10:
            risks.append("High revenue volatility")
        if abs(ebitda_var) > 0.20:
            risks.append("High EBITDA volatility")
        if prob_positive_equity < 0.80:
            risks.append("Significant equity risk")
        
        print(f"   ✓ Investment Recommendation: {recommendation}")
        print(f"   ✓ Confidence Level: {confidence}")
        print(f"   ✓ Enterprise Value: ${weighted_ev:,.0f}K")
        print(f"   ✓ Probability Positive Equity: {prob_positive_equity:.1%}")
        
        return {
            "recommendation": recommendation,
            "confidence_level": confidence,
            "target_enterprise_value": float(weighted_ev),
            "target_equity_value": float(weighted_equity),
            "monte_carlo_median_ev": float(mc_ev_median),
            "valuation_multiples": {
                "ev_revenue": float(ev_revenue_multiple),
                "ev_ebitda": float(ev_ebitda_multiple)
            },
            "risk_return_profile": {
                "probability_positive_equity": float(prob_positive_equity),
                "sharpe_ratio": float(sharpe_ratio),
                "revenue_var_95": float(revenue_var),
                "ebitda_var_95": float(ebitda_var)
            },
            "strengths": strengths,
            "risks": risks,
            "key_conditions": [
                "Marketing expense normalization is critical",
                "EBITDA margin sustainability must be verified",
                "Service line diversification should be maintained",
                "Regular monitoring of competitive dynamics required"
            ]
        }


def main():
    """Execute independent quantitative analysis"""
    
    analyzer = SimplifiedQuantitativeAnalyzer()
    results = analyzer.run_analysis()
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"independent_quantitative_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Generate executive summary
    print("\n" + "="*65)
    print("📊 INDEPENDENT QUANTITATIVE ANALYSIS - EXECUTIVE SUMMARY")
    print("="*65)
    
    rec = results["investment_recommendation"]
    val = results["valuation_analysis"]
    mc = results["monte_carlo_analysis"]
    
    print(f"\n🎯 INVESTMENT RECOMMENDATION: {rec['recommendation']}")
    print(f"   Confidence Level: {rec['confidence_level']}")
    print(f"   Target Enterprise Value: ${rec['target_enterprise_value']:,.0f}K")
    print(f"   Target Equity Value: ${rec['target_equity_value']:,.0f}K")
    
    print(f"\n💰 VALUATION MULTIPLES:")
    print(f"   EV/Revenue: {rec['valuation_multiples']['ev_revenue']:.2f}x")
    print(f"   EV/EBITDA: {rec['valuation_multiples']['ev_ebitda']:.2f}x")
    
    print(f"\n📈 MONTE CARLO RESULTS:")
    print(f"   Median Enterprise Value: ${mc['enterprise_value_results']['percentiles']['p50']:,.0f}K")
    print(f"   90% Confidence Interval: ${mc['enterprise_value_results']['confidence_intervals']['90_percent'][0]:,.0f}K - ${mc['enterprise_value_results']['confidence_intervals']['90_percent'][1]:,.0f}K")
    print(f"   Probability Positive Equity: {mc['risk_probabilities']['probability_positive_equity']:.1%}")
    
    print(f"\n⚡ KEY STRENGTHS:")
    for strength in rec['strengths']:
        print(f"   • {strength}")
    
    print(f"\n⚠️  KEY RISKS:")
    for risk in rec['risks']:
        print(f"   • {risk}")
    
    print(f"\n🔑 KEY CONDITIONS:")
    for condition in rec['key_conditions']:
        print(f"   • {condition}")
    
    print(f"\n✅ Analysis Complete! Results saved to: {results_file}")
    
    return results


if __name__ == "__main__":
    results = main()