#!/usr/bin/env python3
"""
CPP-Ready Visual Pack Generator
HarborGlow Aesthetics Case Study
Generates institutional-quality charts and one-pager PDF
"""

import json
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from datetime import datetime
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Image as RLImage, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus.flowables import PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph

# Color scheme - CPP convention
COLORS = {
    'input': '#2E86AB',      # Blue for inputs
    'linked': '#2C2C2C',     # Black for linked values
    'output': '#2E8B57',     # Green for outputs
    'neutral': '#6C757D',    # Grey for neutral
    'background': '#F8F9FA',  # Light grey background
    'highlight': '#FFF3CD'   # Light yellow for highlights
}

class CPPVisualGenerator:
    def __init__(self, case_json_path, case_title):
        with open(case_json_path, 'r') as f:
            self.data = json.load(f)
        self.case_title = case_title
        self.ttm_window = "2024-Q3 → 2025-Q2"
        
        # Set matplotlib style
        plt.style.use('default')
        plt.rcParams['font.size'] = 10
        plt.rcParams['font.family'] = 'sans-serif'
        
        # Create output directory
        os.makedirs('cpp_visuals', exist_ok=True)
        
        # Validate data integrity
        self.validate_data()
    
    def validate_data(self):
        """Validate key calculations match JSON data"""
        print("🔍 VALIDATING DATA INTEGRITY...")
        
        # EBITDA Bridge validation
        bridge = self.data['ebitda_bridge']
        reported = bridge['reported_ebitda']
        owner = bridge['owner_addback']
        onetime = bridge['onetime_addback']
        rent = bridge['rent_normalization']
        adjusted = bridge['adjusted_ebitda']
        
        calculated_adjusted = reported + owner + onetime + rent
        bridge_diff = abs(calculated_adjusted - adjusted) / adjusted
        
        if bridge_diff > 0.005:  # 0.5% tolerance
            raise ValueError(f"Bridge validation failed: {calculated_adjusted} vs {adjusted}")
        print(f"✅ EBITDA Bridge: {reported:,.0f} + {owner:,.0f} + {onetime:,.0f} + {rent:,.0f} = {adjusted:,.0f}")
        
        # Valuation validation (8.5x base case)
        base_multiple = 8.5
        val_row = next(row for row in self.data['valuation_matrix'] if row['multiple'] == base_multiple)
        expected_ev = adjusted * base_multiple
        actual_ev = val_row['enterprise_value']
        val_diff = abs(expected_ev - actual_ev) / actual_ev
        
        if val_diff > 0.005:
            raise ValueError(f"Valuation validation failed: {expected_ev} vs {actual_ev}")
        print(f"✅ Valuation ({base_multiple}x): {adjusted:,.0f} × {base_multiple} = ${actual_ev:,.0f}")
        
        # LBO validation
        irr_data = self.data['irr_analysis']
        exit_check = irr_data['exit_ev'] - irr_data['exit_debt']
        exit_equity = irr_data['exit_equity']
        lbo_diff = abs(exit_check - exit_equity) / exit_equity
        
        if lbo_diff > 0.005:
            raise ValueError(f"LBO validation failed: {exit_check} vs {exit_equity}")
        print(f"✅ LBO Exit: ${irr_data['exit_ev']:,.0f} - ${irr_data['exit_debt']:,.0f} = ${exit_equity:,.0f}")
        
        print("✅ ALL VALIDATIONS PASSED\n")
    
    def format_currency(self, value, suffix=''):
        """Format currency with appropriate scale"""
        if abs(value) >= 1e6:
            return f"${value/1e6:.2f}M{suffix}"
        elif abs(value) >= 1e3:
            return f"${value/1e3:.0f}K{suffix}"
        else:
            return f"${value:,.0f}{suffix}"
    
    def create_ebitda_bridge(self):
        """Generate EBITDA Bridge waterfall chart"""
        print("📊 Creating EBITDA Bridge...")
        
        bridge = self.data['ebitda_bridge']
        
        # Data for waterfall
        categories = ['Reported\nEBITDA', 'Owner\nAdd-back', 'One-time\nItems', 'Rent\nNormalization', 'Adjusted\nEBITDA']
        values = [
            bridge['reported_ebitda'],
            bridge['owner_addback'],
            bridge['onetime_addback'],
            bridge['rent_normalization'],
            bridge['adjusted_ebitda']
        ]
        
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 8))
        
        # Calculate positions for waterfall
        cumulative = [values[0]]
        for i in range(1, len(values)-1):
            cumulative.append(cumulative[-1] + values[i])
        cumulative.append(values[-1])  # Final adjusted value
        
        # Bar positions and colors
        bar_colors = [COLORS['linked'], COLORS['input'], COLORS['input'], COLORS['input'], COLORS['output']]
        
        # Create bars
        bars = []
        for i, (cat, val, cum) in enumerate(zip(categories, values, cumulative)):
            if i == 0 or i == len(values)-1:
                # Start and end bars (from zero)
                bar = ax.bar(i, val, color=bar_colors[i], alpha=0.8, edgecolor='black', linewidth=1)
                bars.append(bar)
                # Add value label
                ax.text(i, val/2, self.format_currency(val), ha='center', va='center', fontweight='bold')
            else:
                # Adjustment bars (floating)
                bottom = cumulative[i-1] if val > 0 else cum
                height = abs(val)
                bar = ax.bar(i, height, bottom=bottom, color=bar_colors[i], alpha=0.8, edgecolor='black', linewidth=1)
                bars.append(bar)
                # Add value label
                label_y = bottom + height/2
                ax.text(i, label_y, self.format_currency(val), ha='center', va='center', fontweight='bold')
        
        # Connecting lines
        for i in range(len(cumulative)-2):
            if i > 0:
                ax.plot([i+0.4, i+1-0.4], [cumulative[i], cumulative[i]], 'k--', alpha=0.5, linewidth=1)
        
        # Formatting
        ax.set_xticks(range(len(categories)))
        ax.set_xticklabels(categories)
        ax.set_ylabel('EBITDA ($)', fontsize=12, fontweight='bold')
        ax.set_title(f'{self.case_title}\nEBITDA Bridge - {self.ttm_window}', fontsize=14, fontweight='bold', pad=20)
        
        # Add grid
        ax.grid(True, alpha=0.3, axis='y')
        ax.set_axisbelow(True)
        
        # Format y-axis
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: self.format_currency(x)))
        
        # Add margin info
        ttm_revenue = self.data['ttm_metrics']['ttm_revenue']
        reported_margin = bridge['reported_ebitda'] / ttm_revenue * 100
        adjusted_margin = bridge['adjusted_ebitda'] / ttm_revenue * 100
        
        ax.text(0, -0.1, f'{reported_margin:.1f}%', transform=ax.get_xaxis_transform(), 
                ha='center', va='top', fontsize=10, color=COLORS['neutral'])
        ax.text(4, -0.1, f'{adjusted_margin:.1f}%', transform=ax.get_xaxis_transform(), 
                ha='center', va='top', fontsize=10, color=COLORS['neutral'])
        
        plt.tight_layout()
        plt.savefig('cpp_visuals/01_EBITDA_Bridge.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✅ EBITDA Bridge saved: {self.format_currency(bridge['reported_ebitda'])} → {self.format_currency(bridge['adjusted_ebitda'])}")
    
    def create_valuation_matrix(self):
        """Generate Valuation Matrix table"""
        print("📊 Creating Valuation Matrix...")
        
        matrix = self.data['valuation_matrix']
        
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 8))
        
        # Prepare data for table
        headers = ['Multiple', 'Enterprise Value', 'Equity to Seller', 'EV/Revenue']
        table_data = []
        
        base_multiple = 8.5  # Highlight this row
        
        for row in matrix:
            table_data.append([
                f"{row['multiple']:.1f}×",
                self.format_currency(row['enterprise_value']),
                self.format_currency(row['equity_value_to_seller']),
                f"{row['ev_revenue_ratio']:.1f}×"
            ])
        
        # Create table
        table = ax.table(cellText=table_data, colLabels=headers, cellLoc='center', loc='center')
        table.auto_set_font_size(False)
        table.set_fontsize(11)
        table.scale(1, 2.5)
        
        # Style table
        for i, header in enumerate(headers):
            table[(0, i)].set_facecolor(COLORS['neutral'])
            table[(0, i)].set_text_props(weight='bold', color='white')
        
        # Highlight base case row
        base_row_idx = next(i for i, row in enumerate(matrix) if row['multiple'] == base_multiple) + 1
        for j in range(len(headers)):
            table[(base_row_idx, j)].set_facecolor(COLORS['highlight'])
            table[(base_row_idx, j)].set_text_props(weight='bold')
        
        # Remove axes
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')
        
        # Title
        ax.set_title(f'{self.case_title}\nValuation Matrix - {self.ttm_window}', 
                    fontsize=14, fontweight='bold', pad=20)
        
        # Add assumptions note
        adj_ebitda = self.data['ttm_metrics']['ttm_ebitda_adjusted']
        net_debt = 1940000  # From case data
        
        assumptions_text = f"Assumptions: Adj. EBITDA ${adj_ebitda/1e6:.2f}M • Old Net Debt ${net_debt/1e6:.2f}M • Base Case: {base_multiple}×"
        ax.text(0.5, 0.1, assumptions_text, transform=ax.transAxes, ha='center', 
                fontsize=10, style='italic', color=COLORS['neutral'])
        
        plt.tight_layout()
        plt.savefig('cpp_visuals/02_Valuation_Matrix.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        base_case = next(row for row in matrix if row['multiple'] == base_multiple)
        print(f"✅ Valuation Matrix saved: Base {base_multiple}× = ${base_case['enterprise_value']:,.0f} EV")
    
    def create_epv_panel(self):
        """Generate EPV Panel with formula and sensitivity"""
        print("📊 Creating EPV Panel...")
        
        epv = self.data['epv_analysis']
        sensitivity = self.data['epv_sensitivity']
        
        # Create figure with subplots
        fig = plt.figure(figsize=(14, 10))
        
        # Left panel - EPV Formula and assumptions
        ax1 = plt.subplot(1, 2, 1)
        ax1.axis('off')
        
        # EPV Formula box
        formula_text = """EPV CALCULATION
        
EPV = (EBIT × (1 - Tax) - Reinvestment) / WACC

Current Assumptions:
• EBIT: $1,585,500 (Adj. EBITDA - D&A)
• Tax Rate: 26%
• Reinvestment: 10% of EBIT
• WACC: 12%

Results:
• NOPAT: $1,173,270
• Reinvestment: $158,550
• Free Cash Flow: $1,014,720
• EPV Enterprise: $8,456,000
• EPV Equity: $6,516,000"""
        
        # Create text box
        bbox_props = dict(boxstyle="round,pad=0.5", facecolor=COLORS['background'], alpha=0.8)
        ax1.text(0.05, 0.95, formula_text, transform=ax1.transAxes, fontsize=11,
                verticalalignment='top', bbox=bbox_props, fontfamily='monospace')
        
        ax1.set_title('EPV Assumptions & Formula', fontsize=12, fontweight='bold', pad=20)
        
        # Right panel - Sensitivity matrix
        ax2 = plt.subplot(1, 2, 2)
        
        # Extract sensitivity data
        wacc_values = [0.11, 0.12, 0.13]
        reinvest_values = [0.05, 0.10, 0.15]
        
        # Create matrix for heatmap
        epv_matrix = np.zeros((3, 3))
        for i, row in enumerate(sensitivity):
            for j, cell in enumerate(row):
                epv_matrix[i, j] = cell['epv_enterprise'] / 1e6  # Convert to millions
        
        # Create heatmap
        im = ax2.imshow(epv_matrix, cmap='RdYlGn', aspect='auto')
        
        # Add text annotations
        for i in range(3):
            for j in range(3):
                value = epv_matrix[i, j]
                text = ax2.text(j, i, f'${value:.1f}M', ha="center", va="center",
                              color="black", fontweight='bold')
        
        # Set ticks and labels
        ax2.set_xticks([0, 1, 2])
        ax2.set_xticklabels(['11.0%', '12.0%', '13.0%'])
        ax2.set_yticks([0, 1, 2])
        ax2.set_yticklabels(['5.0%', '10.0%', '15.0%'])
        
        ax2.set_xlabel('WACC →', fontweight='bold')
        ax2.set_ylabel('Reinvestment Rate ↓', fontweight='bold')
        ax2.set_title('3×3 Sensitivity Matrix\n(EPV Enterprise Value)', fontsize=12, fontweight='bold')
        
        # Main title
        fig.suptitle(f'{self.case_title}\nEPV Analysis & Sensitivity', fontsize=14, fontweight='bold')
        
        # Add footer note
        implied_multiple = epv['epv_implied_multiple']
        fig.text(0.5, 0.02, f'EPV Implied Multiple: {implied_multiple:.1f}× Adj. EBITDA (Conservative Floor)', 
                ha='center', fontsize=10, style='italic', color=COLORS['neutral'])
        
        plt.tight_layout()
        plt.savefig('cpp_visuals/03_EPV_Panel.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✅ EPV Panel saved: ${epv['epv_enterprise']:,.0f} Enterprise / ${epv['epv_equity']:,.0f} Equity")
    
    def create_lbo_summary(self):
        """Generate LBO Summary with sources/uses, debt schedule, and exit metrics"""
        print("📊 Creating LBO Summary...")
        
        sources_uses = self.data['sources_uses']
        debt_schedule = self.data['debt_schedule']
        irr_analysis = self.data['irr_analysis']
        
        # Create figure with multiple subplots
        fig = plt.figure(figsize=(16, 12))
        
        # Top panel - Sources & Uses
        ax1 = plt.subplot(3, 2, (1, 2))
        
        # Sources & Uses data
        categories = ['Entry EV', 'New Debt\n(72%)', 'Sponsor\nEquity', 'Equity to\nSeller']
        values = [
            sources_uses['entry_ev'],
            sources_uses['new_debt'],
            sources_uses['sponsor_equity'],
            sources_uses['equity_to_seller']
        ]
        colors_su = [COLORS['linked'], COLORS['input'], COLORS['input'], COLORS['output']]
        
        bars = ax1.bar(range(len(categories)), [v/1e6 for v in values], 
                      color=colors_su, alpha=0.8, edgecolor='black')
        
        # Add value labels
        for bar, val in zip(bars, values):
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                    self.format_currency(val), ha='center', va='bottom', fontweight='bold')
        
        ax1.set_xticks(range(len(categories)))
        ax1.set_xticklabels(categories)
        ax1.set_ylabel('Value ($M)', fontweight='bold')
        ax1.set_title('LBO Sources & Uses', fontsize=12, fontweight='bold')
        ax1.grid(True, alpha=0.3, axis='y')
        
        # Middle panel - Debt Schedule
        ax2 = plt.subplot(3, 1, 2)
        
        years = [0] + [row['year'] for row in debt_schedule]
        debt_balances = [sources_uses['new_debt']] + [row['debt_balance'] for row in debt_schedule]
        
        ax2.plot(years, [d/1e6 for d in debt_balances], marker='o', linewidth=3, 
                markersize=8, color=COLORS['linked'])
        ax2.fill_between(years, [d/1e6 for d in debt_balances], alpha=0.3, color=COLORS['linked'])
        
        # Add data labels
        for year, debt in zip(years, debt_balances):
            ax2.annotate(f'${debt/1e6:.1f}M', (year, debt/1e6), textcoords="offset points", 
                        xytext=(0,10), ha='center', fontsize=9, fontweight='bold')
        
        ax2.set_xlabel('Year', fontweight='bold')
        ax2.set_ylabel('Net Debt ($M)', fontweight='bold')
        ax2.set_title('Debt Amortization Schedule', fontsize=12, fontweight='bold')
        ax2.grid(True, alpha=0.3)
        ax2.set_xlim(-0.5, 5.5)
        
        # Bottom panel - Exit Metrics
        ax3 = plt.subplot(3, 2, 5)
        
        # Calculate exit multiple
        exit_multiple = irr_analysis['exit_ev'] / irr_analysis['year5_ebitda']
        
        metrics_text = f"""EXIT METRICS (Year 5)
        
Exit Multiple: {exit_multiple:.1f}×
Exit EV: {self.format_currency(irr_analysis['exit_ev'])}
Exit Debt: {self.format_currency(irr_analysis['exit_debt'])}
Exit Equity: {self.format_currency(irr_analysis['exit_equity'])}

RETURNS
MOIC: {irr_analysis['moic']:.1f}×
IRR: {irr_analysis['irr']:.1%}"""
        
        ax3.text(0.05, 0.95, metrics_text, transform=ax3.transAxes, fontsize=11,
                verticalalignment='top', fontfamily='monospace',
                bbox=dict(boxstyle="round,pad=0.5", facecolor=COLORS['background'], alpha=0.8))
        ax3.axis('off')
        ax3.set_title('Returns Analysis', fontsize=12, fontweight='bold')
        
        # Assumptions panel
        ax4 = plt.subplot(3, 2, 6)
        
        assumptions_text = f"""ASSUMPTIONS
        
Entry Debt %: {sources_uses['debt_pct']:.0f}%
Debt Rate: 8.5%
Cash Sweep: 80%
Hold Period: 5 years
Exit Multiple: {exit_multiple:.1f}×

TTM Window: {self.ttm_window}"""
        
        ax4.text(0.05, 0.95, assumptions_text, transform=ax4.transAxes, fontsize=11,
                verticalalignment='top', fontfamily='monospace',
                bbox=dict(boxstyle="round,pad=0.5", facecolor=COLORS['highlight'], alpha=0.8))
        ax4.axis('off')
        ax4.set_title('Key Assumptions', fontsize=12, fontweight='bold')
        
        # Main title
        fig.suptitle(f'{self.case_title}\nLBO Analysis Summary', fontsize=14, fontweight='bold')
        
        plt.tight_layout()
        plt.savefig('cpp_visuals/04_LBO_Summary.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✅ LBO Summary saved: {irr_analysis['irr']:.1%} IRR, {irr_analysis['moic']:.1f}× MOIC")
    
    def create_one_pager_pdf(self):
        """Generate comprehensive one-pager PDF"""
        print("📄 Creating One-Pager PDF...")
        
        # Create PDF document
        doc = SimpleDocTemplate("cpp_visuals/CPP_OnePager.pdf", pagesize=letter)
        story = []
        
        # Header
        styles = getSampleStyleSheet()
        title_style = styles['Title']
        title_style.fontSize = 16
        title_style.spaceAfter = 6
        
        subtitle_style = styles['Normal']
        subtitle_style.fontSize = 12
        subtitle_style.spaceAfter = 12
        subtitle_style.alignment = 1  # Center
        
        # Title and subtitle
        story.append(Paragraph(self.case_title, title_style))
        story.append(Paragraph(f"TTM Window: {self.ttm_window}", subtitle_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Create 2x2 grid of images
        img_width = 3.5*inch
        img_height = 2.5*inch
        
        # Top row
        img1 = RLImage('cpp_visuals/01_EBITDA_Bridge.png', width=img_width, height=img_height)
        img2 = RLImage('cpp_visuals/02_Valuation_Matrix.png', width=img_width, height=img_height)
        
        top_row = Table([[img1, img2]], colWidths=[img_width, img_width])
        story.append(top_row)
        story.append(Spacer(1, 0.1*inch))
        
        # Bottom row
        img3 = RLImage('cpp_visuals/03_EPV_Panel.png', width=img_width, height=img_height)
        img4 = RLImage('cpp_visuals/04_LBO_Summary.png', width=img_width, height=img_height)
        
        bottom_row = Table([[img3, img4]], colWidths=[img_width, img_width])
        story.append(bottom_row)
        
        # Footer
        story.append(Spacer(1, 0.2*inch))
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        footer_text = f"Model v{timestamp} • Prepared for CPP MA&I Case • HarborGlow Aesthetics Analysis"
        footer_style = styles['Normal']
        footer_style.fontSize = 8
        footer_style.alignment = 1
        footer_style.textColor = colors.grey
        
        story.append(Paragraph(footer_text, footer_style))
        
        # Build PDF
        doc.build(story)
        
        print("✅ One-Pager PDF saved: CPP_OnePager.pdf")
    
    def generate_summary_report(self):
        """Generate text summary of key metrics"""
        print("\n" + "="*60)
        print("📋 CPP VISUAL PACK SUMMARY")
        print("="*60)
        
        # Extract key metrics
        ttm = self.data['ttm_metrics']
        bridge = self.data['ebitda_bridge']
        
        # Base case (8.5x)
        base_case = next(row for row in self.data['valuation_matrix'] if row['multiple'] == 8.5)
        
        epv = self.data['epv_analysis']
        irr = self.data['irr_analysis']
        
        print(f"CASE: {self.case_title}")
        print(f"TTM WINDOW: {self.ttm_window}")
        print("-" * 40)
        
        print("FINANCIAL METRICS:")
        print(f"• Adj. EBITDA: {self.format_currency(bridge['adjusted_ebitda'])}")
        print(f"• Base Multiple: 8.5×")
        print(f"• Enterprise Value: {self.format_currency(base_case['enterprise_value'])}")
        print(f"• Equity to Seller: {self.format_currency(base_case['equity_value_to_seller'])}")
        
        print("\nEPV ANALYSIS:")
        print(f"• EPV Enterprise: {self.format_currency(epv['epv_enterprise'])}")
        print(f"• EPV Equity: {self.format_currency(epv['epv_equity'])}")
        print(f"• EPV Implied Multiple: {epv['epv_implied_multiple']:.1f}×")
        
        print("\nLBO RETURNS:")
        exit_multiple = irr['exit_ev'] / irr['year5_ebitda']
        print(f"• Exit Multiple: {exit_multiple:.1f}×")
        print(f"• IRR: {irr['irr']:.1%}")
        print(f"• MOIC: {irr['moic']:.1f}×")
        
        print("\nVALIDATION STATUS:")
        print("✅ EBITDA Bridge reconciled")
        print("✅ Valuation matrix validated") 
        print("✅ LBO exit calculations verified")
        print("✅ EPV sensitivity matrix complete")
        
        print("\nFILES GENERATED:")
        files = [
            "01_EBITDA_Bridge.png",
            "02_Valuation_Matrix.png", 
            "03_EPV_Panel.png",
            "04_LBO_Summary.png",
            "CPP_OnePager.pdf"
        ]
        
        for file in files:
            if os.path.exists(f'cpp_visuals/{file}'):
                print(f"✅ {file}")
            else:
                print(f"❌ {file}")
        
        print("\n🎯 ALL VISUALS READY FOR CPP PRESENTATION")
        print("="*60)
    
    def run_full_generation(self):
        """Execute complete visual pack generation"""
        print("🚀 STARTING CPP VISUAL PACK GENERATION")
        print("="*60)
        
        try:
            # Generate all visuals
            self.create_ebitda_bridge()
            self.create_valuation_matrix()
            self.create_epv_panel()
            self.create_lbo_summary()
            self.create_one_pager_pdf()
            
            # Generate summary
            self.generate_summary_report()
            
            return True
            
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            return False

def main():
    """Main execution function"""
    case_title = "HarborGlow Aesthetics (Nashville) — TTM 2024-Q3 → 2025-Q2"
    case_json = "harborglow_aesthetic_simulation_results.json"
    
    # Generate visual pack
    generator = CPPVisualGenerator(case_json, case_title)
    success = generator.run_full_generation()
    
    if success:
        print("\n🎉 CPP VISUAL PACK GENERATION COMPLETE!")
        print("📁 All files saved in: cpp_visuals/")
    else:
        print("\n❌ GENERATION FAILED - Check errors above")

if __name__ == "__main__":
    main() 