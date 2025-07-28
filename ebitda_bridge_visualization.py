#!/usr/bin/env python3
"""
EBITDA Bridge Visualization
Create waterfall chart showing the walk from reported to normalized EBITDA
"""

import json
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime

def create_ebitda_bridge_chart():
    """Create waterfall chart for EBITDA bridge analysis"""
    
    # Load the analysis results
    try:
        with open('ebitda_bridge_analysis_20250728_065301.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: Analysis file not found. Please run ebitda_bridge_analysis.py first.")
        return
    
    # Extract 2024 data for visualization
    reported_ebitda = data['reported_ebitda']['2024']
    normalized_ebitda = data['normalized_ebitda']['2024']
    
    # Extract component adjustments
    components = []
    adjustments = []
    
    for comp in data['normalization_components']:
        adj_2024 = comp['adjustments']['2024']
        if abs(adj_2024) > 1000:  # Only show material adjustments
            components.append(comp['name'].replace(' Normalization', '').replace(' Reclassification', ''))
            adjustments.append(adj_2024)
    
    # Create waterfall data
    categories = ['Reported\nEBITDA'] + components + ['Normalized\nEBITDA']
    values = [reported_ebitda] + adjustments + [0]  # Final bar will be calculated
    
    # Calculate cumulative values for positioning
    cumulative = [reported_ebitda]
    running_total = reported_ebitda
    
    for adj in adjustments:
        running_total += adj
        cumulative.append(running_total)
    
    cumulative.append(normalized_ebitda)  # Final value
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # Colors: Green for positive, Red for negative, Blue for totals
    colors = ['steelblue']  # Reported EBITDA
    for adj in adjustments:
        colors.append('darkgreen' if adj > 0 else 'darkred')
    colors.append('navy')  # Normalized EBITDA
    
    # Create bars
    bar_positions = range(len(categories))
    bars = []
    
    # Reported EBITDA (full height)
    bars.append(ax.bar(0, reported_ebitda, color=colors[0], alpha=0.8, width=0.6))
    
    # Adjustment bars (floating)
    for i, (adj, cum_val) in enumerate(zip(adjustments, cumulative[1:-1]), 1):
        if adj > 0:
            # Positive adjustment - bar starts at previous cumulative
            bottom = cum_val - adj
            bars.append(ax.bar(i, adj, bottom=bottom, color=colors[i], alpha=0.8, width=0.6))
        else:
            # Negative adjustment - bar starts at current cumulative  
            bottom = cum_val
            bars.append(ax.bar(i, abs(adj), bottom=bottom, color=colors[i], alpha=0.8, width=0.6))
    
    # Normalized EBITDA (full height)
    bars.append(ax.bar(len(categories)-1, normalized_ebitda, color=colors[-1], alpha=0.8, width=0.6))
    
    # Add connecting lines
    for i in range(len(cumulative)-1):
        x_start = i + 0.3
        x_end = i + 0.7
        y_level = cumulative[i+1]
        ax.plot([x_start, x_end], [y_level, y_level], 'k--', alpha=0.5, linewidth=1)
    
    # Add value labels on bars
    for i, (cat, val, cum_val) in enumerate(zip(categories, values, cumulative)):
        if i == 0:  # Reported EBITDA
            ax.text(i, val/2, f'${val:,.0f}', ha='center', va='center', fontweight='bold', fontsize=10)
        elif i == len(categories)-1:  # Normalized EBITDA
            ax.text(i, val/2, f'${cum_val:,.0f}', ha='center', va='center', fontweight='bold', fontsize=10)
        else:  # Adjustments
            adj_val = adjustments[i-1]
            mid_point = cum_val - adj_val/2 if adj_val > 0 else cum_val + abs(adj_val)/2
            ax.text(i, mid_point, f'${adj_val:+,.0f}', ha='center', va='center', fontweight='bold', fontsize=9)
    
    # Formatting
    ax.set_xticks(bar_positions)
    ax.set_xticklabels(categories, rotation=45, ha='right')
    ax.set_ylabel('EBITDA (USD)', fontsize=12, fontweight='bold')
    ax.set_title('EBITDA Bridge Analysis - 2024\nWalk from Reported to Normalized EBITDA', 
                fontsize=14, fontweight='bold', pad=20)
    
    # Add grid
    ax.grid(axis='y', alpha=0.3, linestyle='-')
    ax.set_axisbelow(True)
    
    # Format y-axis
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M'))
    
    # Add summary text box
    summary_text = f"""Key Insights:
• Reported EBITDA: ${reported_ebitda:,.0f}
• Total Adjustments: ${normalized_ebitda - reported_ebitda:+,.0f}
• Normalized EBITDA: ${normalized_ebitda:,.0f}
• Impact: {((normalized_ebitda - reported_ebitda) / reported_ebitda * 100):+.1f}%

Largest adjustments:
• Marketing normalization (+$335K)
• Interest reclassification (+$195K)"""
    
    ax.text(0.02, 0.98, summary_text, transform=ax.transAxes, fontsize=9,
            verticalalignment='top', bbox=dict(boxstyle='round', facecolor='lightgray', alpha=0.8))
    
    plt.tight_layout()
    
    # Save the chart
    chart_filename = f"ebitda_bridge_chart_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    plt.savefig(chart_filename, dpi=300, bbox_inches='tight')
    print(f"📊 EBITDA Bridge chart saved as: {chart_filename}")
    
    plt.show()
    return fig

def create_trend_analysis():
    """Create trend analysis showing 3-year EBITDA evolution"""
    
    # Load the analysis results
    try:
        with open('ebitda_bridge_analysis_20250728_065301.json', 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: Analysis file not found.")
        return
    
    years = ['2022', '2023', '2024']
    reported = [data['reported_ebitda'][year] for year in years]
    normalized = [data['normalized_ebitda'][year] for year in years]
    
    fig, ax = plt.subplots(figsize=(12, 8))
    
    x = np.arange(len(years))
    width = 0.35
    
    # Create bars
    bars1 = ax.bar(x - width/2, reported, width, label='Reported EBITDA', color='steelblue', alpha=0.8)
    bars2 = ax.bar(x + width/2, normalized, width, label='Normalized EBITDA', color='darkgreen', alpha=0.8)
    
    # Add value labels
    for bars in [bars1, bars2]:
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height + 20000,
                   f'${height:,.0f}', ha='center', va='bottom', fontweight='bold')
    
    # Add trend lines
    ax.plot(x - width/2, reported, 'o-', color='steelblue', linewidth=2, markersize=6)
    ax.plot(x + width/2, normalized, 'o-', color='darkgreen', linewidth=2, markersize=6)
    
    ax.set_xlabel('Year', fontsize=12, fontweight='bold')
    ax.set_ylabel('EBITDA (USD)', fontsize=12, fontweight='bold')
    ax.set_title('EBITDA Trend Analysis: Reported vs Normalized\n3-Year Performance View', 
                fontsize=14, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(years)
    ax.legend(fontsize=12)
    ax.grid(axis='y', alpha=0.3)
    
    # Format y-axis
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M'))
    
    # Calculate growth rates
    reported_cagr = ((reported[-1] / reported[0]) ** (1/2) - 1) * 100
    normalized_cagr = ((normalized[-1] / normalized[0]) ** (1/2) - 1) * 100
    
    # Add growth rate annotations
    ax.text(0.02, 0.98, f'2-Year CAGR:\nReported: {reported_cagr:.1f}%\nNormalized: {normalized_cagr:.1f}%', 
            transform=ax.transAxes, fontsize=10, verticalalignment='top',
            bbox=dict(boxstyle='round', facecolor='lightgray', alpha=0.8))
    
    plt.tight_layout()
    
    # Save the chart
    trend_filename = f"ebitda_trend_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    plt.savefig(trend_filename, dpi=300, bbox_inches='tight')
    print(f"📈 EBITDA Trend analysis saved as: {trend_filename}")
    
    plt.show()
    return fig

if __name__ == "__main__":
    print("🎨 Creating EBITDA Bridge Visualizations...")
    print("=" * 50)
    
    # Create waterfall chart
    create_ebitda_bridge_chart()
    
    # Create trend analysis
    create_trend_analysis()
    
    print("\n✅ Visualization complete!")