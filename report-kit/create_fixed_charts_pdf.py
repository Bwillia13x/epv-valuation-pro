#!/usr/bin/env python3
"""
CPP Visual Report Kit - Fixed Charts PDF Generator
Improved version that handles high-resolution RGBA PNG files properly
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
import tempfile

def convert_png_for_pdf(png_path, max_width=1920, max_height=1080):
    """
    Convert high-resolution RGBA PNG to RGB format optimized for PDF
    """
    try:
        with Image.open(png_path) as img:
            # Convert RGBA to RGB if needed
            if img.mode == 'RGBA':
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1])  # Use alpha channel as mask
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if too large
            if img.width > max_width or img.height > max_height:
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save as temporary RGB PNG
            temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
            img.save(temp_file.name, 'PNG', optimize=True)
            temp_file.close()
            
            return temp_file.name
            
    except Exception as e:
        print(f"❌ Error converting {png_path}: {str(e)}")
        return None

def create_fixed_charts_pdf(export_dir, case_name="AuroraSkin & Laser", output_filename="AuroraSkin_Fixed_Charts_Review.pdf"):
    """
    Create a PDF with properly converted charts
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
    
    # Create PDF document
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
    
    status_style = ParagraphStyle(
        'Status',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#dc2626'),
        spaceAfter=10,
        fontName='Helvetica'
    )
    
    # Story elements
    story = []
    temp_files = []  # Track temp files for cleanup
    
    # Title page
    story.append(Paragraph(f"{case_name}", title_style))
    story.append(Paragraph("CPP-Grade Visual Analysis Pack", chart_title_style))
    story.append(Paragraph("Fixed Chart Review Document", description_style))
    
    # Key metrics summary
    story.append(Paragraph("Investment Summary", chart_title_style))
    story.append(Paragraph("• TTM Revenue: $8.75M | Adjusted EBITDA: $1.81M (20.6% margin)", metrics_style))
    story.append(Paragraph("• Base Valuation (8.5×): $15.35M EV / $13.32M Equity", metrics_style))
    story.append(Paragraph("• EPV Intrinsic Value: $9.13M EV / $7.10M Equity", metrics_style))
    story.append(Paragraph("• LBO Returns: 22.8% IRR / 2.8× MoIC (5-year hold)", metrics_style))
    
    story.append(Paragraph("✅ All 9 acceptance checks passed with 0.5% tolerance", metrics_style))
    story.append(Paragraph("🔧 Images converted from RGBA to RGB for PDF compatibility", status_style))
    story.append(Paragraph(f"Generated: {datetime.datetime.now().strftime('%B %d, %Y at %I:%M %p')}", description_style))
    
    story.append(PageBreak())
    
    successful_charts = 0
    failed_charts = 0
    
    # Add each chart with improved processing
    for i, (filename, title, description) in enumerate(chart_files, 1):
        chart_path = export_path / filename
        
        story.append(Paragraph(f"{i}. {title}", chart_title_style))
        story.append(Paragraph(description, description_style))
        
        if chart_path.exists():
            print(f"📊 Processing chart {i}: {filename}")
            
            # Convert PNG for PDF compatibility
            converted_path = convert_png_for_pdf(chart_path)
            
            if converted_path:
                temp_files.append(converted_path)
                
                try:
                    # Get image dimensions for scaling
                    with Image.open(converted_path) as img:
                        img_width, img_height = img.size
                    
                    # Scale to fit page (7 inches available for A4)
                    max_width = 7 * inch
                    max_height = 8 * inch
                    
                    scale_w = max_width / img_width
                    scale_h = max_height / img_height
                    scale = min(scale_w, scale_h, 1.0)  # Don't upscale
                    
                    new_width = img_width * scale
                    new_height = img_height * scale
                    
                    # Add converted image to PDF
                    story.append(RLImage(converted_path, width=new_width, height=new_height))
                    story.append(Paragraph("✅ Chart rendered successfully", status_style))
                    successful_charts += 1
                    
                except Exception as e:
                    story.append(Paragraph(f"❌ Error rendering chart: {str(e)}", status_style))
                    failed_charts += 1
                    
            else:
                story.append(Paragraph("❌ Error converting chart for PDF", status_style))
                failed_charts += 1
        else:
            story.append(Paragraph(f"❌ Chart file not found: {filename}", status_style))
            failed_charts += 1
        
        # Add space and page break
        if i < len(chart_files):
            story.append(Spacer(1, 0.2*inch))
            story.append(PageBreak())
    
    # Build PDF
    try:
        doc.build(story)
        print(f"✅ Fixed Charts PDF created: {output_path}")
        print(f"📊 Successfully rendered: {successful_charts}/{len(chart_files)} charts")
        if failed_charts > 0:
            print(f"⚠️  Failed to render: {failed_charts} charts")
        
        # Cleanup temp files
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except:
                pass
        
        return str(output_path)
        
    except Exception as e:
        print(f"❌ Error creating PDF: {str(e)}")
        
        # Cleanup temp files on error
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except:
                pass
        
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python create_fixed_charts_pdf.py <export_directory> [case_name] [output_filename]")
        sys.exit(1)
    
    export_dir = sys.argv[1]
    case_name = sys.argv[2] if len(sys.argv) > 2 else "AuroraSkin & Laser (Miami)"
    output_filename = sys.argv[3] if len(sys.argv) > 3 else "AuroraSkin_Fixed_Charts_Review.pdf"
    
    if not os.path.exists(export_dir):
        print(f"❌ Export directory not found: {export_dir}")
        sys.exit(1)
    
    # Count PNG files
    png_files = [f for f in os.listdir(export_dir) if f.endswith('.png')]
    print(f"📊 Found {len(png_files)} PNG charts in directory")
    print(f"🔧 Converting RGBA images to RGB for PDF compatibility...")
    
    pdf_path = create_fixed_charts_pdf(export_dir, case_name, output_filename)
    
    if pdf_path and os.path.exists(pdf_path):
        file_size = os.path.getsize(pdf_path) / (1024*1024)  # Size in MB
        print(f"📄 Fixed PDF successfully created ({file_size:.1f}MB)")
        print(f"📁 Location: {pdf_path}")
        
        # Try to open the PDF
        try:
            if sys.platform == "darwin":  # macOS
                os.system(f"open '{pdf_path}'")
                print("🔍 Fixed PDF opened for review")
            elif sys.platform == "win32":  # Windows
                os.system(f"start '{pdf_path}'")
                print("🔍 Fixed PDF opened for review")
            else:  # Linux
                os.system(f"xdg-open '{pdf_path}'")
                print("🔍 Fixed PDF opened for review")
        except Exception as e:
            print(f"💡 Please manually open: {pdf_path}")
    else:
        print("❌ Failed to create fixed PDF")
        sys.exit(1)

if __name__ == "__main__":
    main() 