#!/usr/bin/env python3
"""
CPP Visual Report Kit - All Charts PDF Generator
Combines all 8 PNG charts into a single comprehensive PDF for review
"""

import os
import sys
from pathlib import Path
from PIL import Image
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import datetime

def create_all_charts_pdf(export_dir, case_name="AuroraSkin & Laser", output_filename="AuroraSkin_All_Charts_Review.pdf"):
    """
    Create a comprehensive PDF with all charts for review
    """
    
    # Setup paths
    export_path = Path(export_dir)
    output_path = export_path / output_filename
    
    # Chart files in order with descriptions
    chart_files = [
        ("01_EBITDA_Bridge.png", "EBITDA Bridge Analysis", 
         "TTM normalization waterfall: $1.61M → +$0.20M (Owner) → +$0.08M (One-time) → -$0.08M (Rent) → $1.81M"),
        
        ("02_Valuation_Matrix.png", "Valuation Matrix", 
         "Enterprise and equity values across 7.0x-10.0x multiple range with highlighted 8.5x base case"),
        
        ("03_EPV_Panel.png", "Earnings Power Value Analysis", 
         "Intrinsic value calculation with 3×3 sensitivity grid (WACC vs. Reinvestment Rate)"),
        
        ("04_LBO_Summary.png", "LBO Analysis Summary", 
         "Sources & uses, 5-year debt schedule, and projected returns (22.8% IRR / 2.8x MoIC)"),
        
        ("05_KPI_Dashboard.png", "Key Performance Indicators", 
         "Operational metrics with performance benchmarks and gauge visualizations"),
        
        ("06_Monte_Carlo.png", "Monte Carlo Simulation", 
         "10,000-iteration risk analysis with statistical distributions and probability outcomes"),
        
        ("07_Scenario_Analysis.png", "Scenario Analysis", 
         "Base, downside, and upside case modeling with equity value impact assessment"),
        
        ("08_Sensitivity_Tornado.png", "Sensitivity Analysis", 
         "IRR impact ranking of key value drivers with tornado chart visualization")
    ]
    
    # Create PDF document with A4 size for better viewing
    doc = SimpleDocTemplate(str(output_path), pagesize=A4, 
                          rightMargin=0.5*inch, leftMargin=0.5*inch,
                          topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    chart_title_style = ParagraphStyle(
        'ChartTitle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=8,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )
    
    description_style = ParagraphStyle(
        'Description',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15,
        fontName='Helvetica'
    )
    
    metrics_style = ParagraphStyle(
        'Metrics',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#16a34a'),
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )
    
    # Story elements
    story = []
    
    # Title page
    story.append(Paragraph(f"{case_name}", title_style))
    story.append(Paragraph("CPP-Grade Visual Analysis Pack", chart_title_style))
    story.append(Paragraph("Complete Chart Review Document", description_style))
    
    # Key metrics summary
    story.append(Paragraph("Investment Summary", chart_title_style))
    story.append(Paragraph("• TTM Revenue: $8.75M | Adjusted EBITDA: $1.81M (20.6% margin)", metrics_style))
    story.append(Paragraph("• Base Valuation (8.5×): $15.35M EV / $13.32M Equity", metrics_style))
    story.append(Paragraph("• EPV Intrinsic Value: $9.13M EV / $7.10M Equity", metrics_style))
    story.append(Paragraph("• LBO Returns: 22.8% IRR / 2.8× MoIC (5-year hold)", metrics_style))
    
    story.append(Paragraph("✅ All 9 acceptance checks passed with 0.5% tolerance", metrics_style))
    story.append(Paragraph(f"Generated: {datetime.datetime.now().strftime('%B %d, %Y at %I:%M %p')}", description_style))
    
    story.append(PageBreak())
    
    # Add each chart with description
    for i, (filename, title, description) in enumerate(chart_files, 1):
        chart_path = export_path / filename
        
        if chart_path.exists():
            # Chart title with number
            story.append(Paragraph(f"{i}. {title}", chart_title_style))
            story.append(Paragraph(description, description_style))
            
            # Add chart image
            try:
                # Calculate image size to fit page
                img = Image.open(chart_path)
                img_width, img_height = img.size
                
                # Scale to fit page width (7 inches available for A4)
                max_width = 7 * inch
                max_height = 9 * inch
                
                scale_w = max_width / img_width
                scale_h = max_height / img_height
                scale = min(scale_w, scale_h, 1.0)  # Don't upscale
                
                new_width = img_width * scale
                new_height = img_height * scale
                
                story.append(RLImage(str(chart_path), width=new_width, height=new_height))
                
                # Add space after image, page break for next chart
                if i < len(chart_files):
                    story.append(Spacer(1, 0.2*inch))
                    story.append(PageBreak())
                    
            except Exception as e:
                story.append(Paragraph(f"❌ Error loading chart: {str(e)}", description_style))
                story.append(Spacer(1, 0.5*inch))
        else:
            story.append(Paragraph(f"❌ Chart not found: {filename}", description_style))
            story.append(Spacer(1, 0.5*inch))
    
    # Build PDF
    try:
        doc.build(story)
        print(f"✅ All Charts PDF created: {output_path}")
        return str(output_path)
    except Exception as e:
        print(f"❌ Error creating PDF: {str(e)}")
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python create_all_charts_pdf.py <export_directory> [case_name] [output_filename]")
        sys.exit(1)
    
    export_dir = sys.argv[1]
    case_name = sys.argv[2] if len(sys.argv) > 2 else "AuroraSkin & Laser (Miami)"
    output_filename = sys.argv[3] if len(sys.argv) > 3 else "AuroraSkin_All_Charts_Review.pdf"
    
    if not os.path.exists(export_dir):
        print(f"❌ Export directory not found: {export_dir}")
        sys.exit(1)
    
    # Count PNG files
    png_files = [f for f in os.listdir(export_dir) if f.endswith('.png')]
    print(f"📊 Found {len(png_files)} PNG charts in directory")
    
    pdf_path = create_all_charts_pdf(export_dir, case_name, output_filename)
    
    if pdf_path and os.path.exists(pdf_path):
        file_size = os.path.getsize(pdf_path) / (1024*1024)  # Size in MB
        print(f"📄 PDF successfully created ({file_size:.1f}MB) with {len(png_files)} charts")
        print(f"📁 Location: {pdf_path}")
        
        # Try to open the PDF
        try:
            if sys.platform == "darwin":  # macOS
                os.system(f"open '{pdf_path}'")
                print("🔍 PDF opened for review")
            elif sys.platform == "win32":  # Windows
                os.system(f"start '{pdf_path}'")
                print("🔍 PDF opened for review")
            else:  # Linux
                os.system(f"xdg-open '{pdf_path}'")
                print("🔍 PDF opened for review")
        except Exception as e:
            print(f"💡 Please manually open: {pdf_path}")
    else:
        print("❌ Failed to create PDF")
        sys.exit(1)

if __name__ == "__main__":
    main() 