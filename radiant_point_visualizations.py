#!/usr/bin/env python3
"""
Radiant Point Aesthetics Visualization Suite
Generate professional charts for investment committee presentation
"""

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from datetime import datetime
import matplotlib.ticker as ticker
import warnings
warnings.filterwarnings('ignore')

# Set professional styling
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

def create_quarterly_revenue_chart():
    """Create quarterly revenue growth chart"""
    
    # Quarterly data
    quarters = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2']
    revenue = [1470, 1545, 1605, 1685, 1830, 1920]  # in thousands
    
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))
    
    # Revenue trend
    ax1.plot(quarters, revenue, marker='o', linewidth=3, markersize=8, color='#2E86AB')
    ax1.fill_between(quarters, revenue, alpha=0.3, color='#2E86AB')
    ax1.set_title('Quarterly Revenue Growth', fontsize=16, fontweight='bold', pad=20)
    ax1.set_ylabel('Revenue ($000)', fontsize=12)
    ax1.grid(True, alpha=0.3)
    
    # Format y-axis
    ax1.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: f'${x:,.0f}K'))
    
    # Add growth annotations
    for i in range(1, len(revenue)):
        growth = ((revenue[i] / revenue[i-1]) - 1) * 100
        ax1.annotate(f'+{growth:.1f}%', 
                    xy=(quarters[i], revenue[i]), 
                    xytext=(5, 10), 
                    textcoords='offset points',
                    fontsize=10, 
                    color='green',
                    fontweight='bold')
    
    # YoY Growth comparison
    yoy_quarters = ['2025-Q1', '2025-Q2']
    yoy_growth = [24.5, 24.3]  # YoY growth rates
    
    ax2.bar(yoy_quarters, yoy_growth, color='#F18F01', alpha=0.8, width=0.5)
    ax2.set_title('Year-over-Year Growth Rate', fontsize=16, fontweight='bold', pad=20)
    ax2.set_ylabel('YoY Growth (%)', fontsize=12)
    ax2.grid(True, alpha=0.3)
    
    # Add value labels on bars
    for i, v in enumerate(yoy_growth):
        ax2.text(i, v + 0.5, f'{v:.1f}%', ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('radiant_point_revenue_growth.png', dpi=300, bbox_inches='tight')
    plt.show()

def create_ebitda_bridge_chart():
    """Create EBITDA bridge waterfall chart"""
    
    # EBITDA bridge data
    categories = ['Reported\nEBITDA', 'Owner Salary\nAdd-back', 'EMR\nOne-time', 
                 'Legal\nOne-time', 'Rent\nNormalization', 'Adjusted\nEBITDA']
    values = [1790.9, 120, 80, 40, -48, 1982.9]  # in thousands
    
    # Calculate cumulative for waterfall
    cumulative = [values[0]]
    for i in range(1, len(values)-1):
        cumulative.append(cumulative[-1] + values[i])
    cumulative.append(values[-1])
    
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # Colors for bars
    colors = ['#2E86AB', '#F18F01', '#F18F01', '#F18F01', '#C5282F', '#2E86AB']
    
    # Create bars
    bars = []
    for i, (cat, val) in enumerate(zip(categories, values)):
        if i == 0 or i == len(categories)-1:  # First and last bars
            bar = ax.bar(cat, val, color=colors[i], alpha=0.8)
        else:  # Middle bars (adjustments)
            if val > 0:
                bottom = cumulative[i-1]
                bar = ax.bar(cat, val, bottom=bottom, color=colors[i], alpha=0.8)
            else:
                bottom = cumulative[i-1] + val
                bar = ax.bar(cat, abs(val), bottom=bottom, color=colors[i], alpha=0.8)
        bars.append(bar)
    
    # Add connecting lines
    for i in range(len(categories)-2):
        if i == 0:
            start_y = values[0]
        else:
            start_y = cumulative[i]
        end_y = cumulative[i] if values[i+1] > 0 else cumulative[i] + values[i+1]
        
        ax.plot([i+0.4, i+1-0.4], [start_y, end_y], 'k--', alpha=0.5, linewidth=1)
    
    # Add value labels
    for i, (cat, val) in enumerate(zip(categories, values)):
        if i == 0 or i == len(categories)-1:
            label_y = val/2
        else:
            if val > 0:
                label_y = cumulative[i-1] + val/2
            else:
                label_y = cumulative[i-1] + val/2
        
        ax.text(i, label_y, f'${abs(val):,.0f}K', ha='center', va='center', 
                fontweight='bold', fontsize=11, 
                bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8))
    
    ax.set_title('EBITDA Bridge Analysis (TTM)', fontsize=16, fontweight='bold', pad=20)
    ax.set_ylabel('EBITDA ($000)', fontsize=12)
    ax.grid(True, alpha=0.3)
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: f'${x:,.0f}K'))
    
    # Rotate x-axis labels
    plt.xticks(rotation=45, ha='right')
    
    plt.tight_layout()
    plt.savefig('radiant_point_ebitda_bridge.png', dpi=300, bbox_inches='tight')
    plt.show()

def create_valuation_matrix_chart():
    """Create valuation matrix visualization"""
    
    # Valuation data
    multiples = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0]
    enterprise_values = [13880, 14872, 15863, 16855, 17846, 18838, 19829]  # in thousands
    equity_values = [13045, 14037, 15028, 16020, 17011, 18003, 18994]  # in thousands
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
    
    # Enterprise Value chart
    bars1 = ax1.bar([f'{m}x' for m in multiples], enterprise_values, 
                   color='#2E86AB', alpha=0.8, width=0.6)
    
    # Highlight base case
    bars1[3].set_color('#F18F01')  # 8.5x multiple
    
    ax1.set_title('Enterprise Value by Multiple', fontsize=14, fontweight='bold', pad=15)
    ax1.set_ylabel('Enterprise Value ($000)', fontsize=12)
    ax1.grid(True, alpha=0.3)
    ax1.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: f'${x:,.0f}K'))
    
    # Add value labels
    for bar, val in zip(bars1, enterprise_values):
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height + 200,
                f'${val:,.0f}K', ha='center', va='bottom', fontsize=10)
    
    # Equity Value chart
    bars2 = ax2.bar([f'{m}x' for m in multiples], equity_values, 
                   color='#A23B72', alpha=0.8, width=0.6)
    
    # Highlight base case
    bars2[3].set_color('#F18F01')  # 8.5x multiple
    
    ax2.set_title('Equity Value by Multiple', fontsize=14, fontweight='bold', pad=15)
    ax2.set_ylabel('Equity Value ($000)', fontsize=12)
    ax2.grid(True, alpha=0.3)
    ax2.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: f'${x:,.0f}K'))
    
    # Add value labels
    for bar, val in zip(bars2, equity_values):
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height + 200,
                f'${val:,.0f}K', ha='center', va='bottom', fontsize=10)
    
    # Add base case annotation
    ax2.annotate('Base Case\n8.5x', xy=(3, equity_values[3]), xytext=(3, equity_values[3] + 2000),
                arrowprops=dict(arrowstyle='->', color='red', lw=2),
                fontsize=12, fontweight='bold', ha='center', color='red')
    
    plt.tight_layout()
    plt.savefig('radiant_point_valuation_matrix.png', dpi=300, bbox_inches='tight')
    plt.show()

def create_operational_kpis_chart():
    """Create operational KPIs dashboard"""
    
    quarters = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2']
    visits = [2722, 2861, 2972, 3120, 3268, 3429]
    avg_ticket = [540, 540, 540, 540, 560, 560]
    room_util = [70, 73, 75, 78, 81, 84]
    
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
    
    # Patient Visits
    ax1.plot(quarters, visits, marker='o', linewidth=3, markersize=8, color='#2E86AB')
    ax1.fill_between(quarters, visits, alpha=0.3, color='#2E86AB')
    ax1.set_title('Patient Visits per Quarter', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Number of Visits', fontsize=10)
    ax1.grid(True, alpha=0.3)
    ax1.tick_params(axis='x', rotation=45)
    
    # Average Ticket
    ax2.plot(quarters, avg_ticket, marker='s', linewidth=3, markersize=8, color='#F18F01')
    ax2.fill_between(quarters, avg_ticket, alpha=0.3, color='#F18F01')
    ax2.set_title('Average Ticket Size', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Average Ticket ($)', fontsize=10)
    ax2.grid(True, alpha=0.3)
    ax2.tick_params(axis='x', rotation=45)
    ax2.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: f'${x:,.0f}'))
    
    # Room Utilization
    bars = ax3.bar(quarters, room_util, color='#A23B72', alpha=0.8)
    ax3.set_title('Room Utilization Rate', fontsize=12, fontweight='bold')
    ax3.set_ylabel('Utilization (%)', fontsize=10)
    ax3.grid(True, alpha=0.3)
    ax3.tick_params(axis='x', rotation=45)
    
    # Add percentage labels on bars
    for bar, val in zip(bars, room_util):
        height = bar.get_height()
        ax3.text(bar.get_x() + bar.get_width()/2., height + 1,
                f'{val}%', ha='center', va='bottom', fontsize=9)
    
    # Revenue per Visit (calculated)
    revenue_per_visit = [r/1000 for r in [1470, 1545, 1605, 1685, 1830, 1920]]  # Revenue in millions
    revenue_per_visit_calc = [r*1000/v for r, v in zip(revenue_per_visit, visits)]
    
    ax4.plot(quarters, revenue_per_visit_calc, marker='^', linewidth=3, markersize=8, color='#C5282F')
    ax4.fill_between(quarters, revenue_per_visit_calc, alpha=0.3, color='#C5282F')
    ax4.set_title('Revenue per Visit', fontsize=12, fontweight='bold')
    ax4.set_ylabel('Revenue per Visit ($)', fontsize=10)
    ax4.grid(True, alpha=0.3)
    ax4.tick_params(axis='x', rotation=45)
    ax4.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: f'${x:,.0f}'))
    
    plt.suptitle('Operational KPIs Dashboard', fontsize=16, fontweight='bold', y=0.98)
    plt.tight_layout()
    plt.savefig('radiant_point_operational_kpis.png', dpi=300, bbox_inches='tight')
    plt.show()

def create_irr_sensitivity_analysis():
    """Create IRR sensitivity analysis heatmap"""
    
    # Sensitivity parameters
    exit_multiples = np.arange(7.0, 9.5, 0.5)
    revenue_cagrs = np.arange(0.04, 0.13, 0.01)
    
    # Base parameters
    entry_multiple = 8.5
    adj_ebitda = 1982.9
    net_debt = 835
    hold_period = 5
    
    # Calculate IRR matrix
    irr_matrix = np.zeros((len(revenue_cagrs), len(exit_multiples)))
    
    for i, revenue_cagr in enumerate(revenue_cagrs):
        for j, exit_multiple in enumerate(exit_multiples):
            # Entry calculation
            entry_ev = adj_ebitda * entry_multiple
            entry_equity = entry_ev - net_debt
            
            # Exit calculation (simplified)
            year5_revenue = 7040 * (1 + revenue_cagr) ** hold_period
            year5_ebitda_margin = 0.282 + 0.01  # Margin improvement
            year5_ebitda = year5_revenue * year5_ebitda_margin
            
            exit_ev = year5_ebitda * exit_multiple
            exit_equity = exit_ev - net_debt  # Simplified (no debt paydown)
            
            # IRR calculation
            irr = (exit_equity / entry_equity) ** (1/hold_period) - 1
            irr_matrix[i, j] = irr * 100  # Convert to percentage
    
    # Create heatmap
    fig, ax = plt.subplots(figsize=(10, 8))
    
    im = ax.imshow(irr_matrix, cmap='RdYlGn', aspect='auto', vmin=0, vmax=25)
    
    # Set ticks and labels
    ax.set_xticks(range(len(exit_multiples)))
    ax.set_yticks(range(len(revenue_cagrs)))
    ax.set_xticklabels([f'{m:.1f}x' for m in exit_multiples])
    ax.set_yticklabels([f'{c:.0%}' for c in revenue_cagrs])
    
    # Add text annotations
    for i in range(len(revenue_cagrs)):
        for j in range(len(exit_multiples)):
            text = ax.text(j, i, f'{irr_matrix[i, j]:.1f}%',
                         ha="center", va="center", color="black", fontweight='bold')
    
    ax.set_xlabel('Exit Multiple (EV/EBITDA)', fontsize=12)
    ax.set_ylabel('Revenue CAGR', fontsize=12)
    ax.set_title('IRR Sensitivity Analysis (%)', fontsize=14, fontweight='bold', pad=20)
    
    # Add colorbar
    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('IRR (%)', rotation=270, labelpad=20)
    
    plt.tight_layout()
    plt.savefig('radiant_point_irr_sensitivity.png', dpi=300, bbox_inches='tight')
    plt.show()

def create_epv_comparison_chart():
    """Create EPV vs Multiple valuation comparison"""
    
    valuation_methods = ['EPV\n(Conservative)', 'Base Case\n(8.5x EBITDA)', 'Bull Case\n(9.5x EBITDA)']
    enterprise_values = [10416, 16855, 18838]  # in thousands
    equity_values = [9581, 16020, 18003]  # in thousands
    
    fig, ax = plt.subplots(figsize=(12, 8))
    
    x = np.arange(len(valuation_methods))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, enterprise_values, width, label='Enterprise Value', 
                   color='#2E86AB', alpha=0.8)
    bars2 = ax.bar(x + width/2, equity_values, width, label='Equity Value', 
                   color='#F18F01', alpha=0.8)
    
    # Add value labels
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 500,
                    f'${height:,.0f}K', ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    ax.set_title('Valuation Method Comparison', fontsize=16, fontweight='bold', pad=20)
    ax.set_ylabel('Value ($000)', fontsize=12)
    ax.set_xticks(x)
    ax.set_xticklabels(valuation_methods)
    ax.legend(fontsize=12)
    ax.grid(True, alpha=0.3)
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, p: f'${x:,.0f}K'))
    
    # Add annotation for EPV discount
    epv_discount = (equity_values[0] / equity_values[1] - 1) * 100
    ax.annotate(f'EPV at {epv_discount:.0f}% discount\nto market multiple', 
                xy=(0, equity_values[0]), xytext=(0.5, equity_values[0] - 2000),
                arrowprops=dict(arrowstyle='->', color='red', lw=2),
                fontsize=11, ha='center', color='red', fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.7))
    
    plt.tight_layout()
    plt.savefig('radiant_point_epv_comparison.png', dpi=300, bbox_inches='tight')
    plt.show()

def main():
    """Generate all visualization charts"""
    
    print("Generating Radiant Point Aesthetics Visualization Suite...")
    
    print("\n1. Creating quarterly revenue growth chart...")
    create_quarterly_revenue_chart()
    
    print("2. Creating EBITDA bridge chart...")
    create_ebitda_bridge_chart()
    
    print("3. Creating valuation matrix chart...")
    create_valuation_matrix_chart()
    
    print("4. Creating operational KPIs dashboard...")
    create_operational_kpis_chart()
    
    print("5. Creating IRR sensitivity analysis...")
    create_irr_sensitivity_analysis()
    
    print("6. Creating EPV comparison chart...")
    create_epv_comparison_chart()
    
    print("\n✅ All visualizations generated successfully!")
    print("\nFiles created:")
    print("- radiant_point_revenue_growth.png")
    print("- radiant_point_ebitda_bridge.png") 
    print("- radiant_point_valuation_matrix.png")
    print("- radiant_point_operational_kpis.png")
    print("- radiant_point_irr_sensitivity.png")
    print("- radiant_point_epv_comparison.png")

if __name__ == "__main__":
    main() 