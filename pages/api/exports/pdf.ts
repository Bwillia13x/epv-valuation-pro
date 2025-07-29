import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import puppeteer from 'puppeteer';

interface PDFRequest {
  caseData: any;
  title: string;
  ttm: string;
  template?: 'onepager' | 'bridge' | 'matrix' | 'epv' | 'lbo';
  format?: 'pdf' | 'png';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { caseData, title, ttm, template = 'onepager', format = 'pdf' }: PDFRequest = req.body;

    if (!caseData || !title || !ttm) {
      return res.status(400).json({ 
        error: 'Missing required fields: caseData, title, ttm' 
      });
    }

    // Validate case data
    const requiredFields = ['ttm_revenue', 'adjusted_ebitda', 'ebitda_margin'];
    for (const field of requiredFields) {
      if (!(field in caseData)) {
        return res.status(400).json({ 
          error: `Missing required case data field: ${field}` 
        });
      }
    }

    // Create temporary directory for exports
    const exportDir = join(process.cwd(), 'temp-exports');
    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${template}-${timestamp}`;
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true, // Use boolean instead of 'new'
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1280,
        height: 720,
        deviceScaleFactor: 2, // For high DPI
      });

      // Load template
      const templatePath = join(process.cwd(), 'report-kit', 'templates', `${template}.html`);
      
      if (!existsSync(templatePath)) {
        throw new Error(`Template not found: ${template}`);
      }

      let templateHtml = readFileSync(templatePath, 'utf-8');
      
      // Replace placeholders with actual data
      templateHtml = templateHtml
        .replace(/\{\{CASE_TITLE\}\}/g, title)
        .replace(/\{\{TTM_PERIOD\}\}/g, ttm)
        .replace('window.__CASE__ = {}', `window.__CASE__ = ${JSON.stringify(caseData)}`);

      // Load HTML content
      await page.setContent(templateHtml, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Wait for charts to render
      await page.waitForFunction(() => (window as any).__READY__ === true, { 
        timeout: 15000 
      });

      // Generate output
      let outputBuffer: Buffer;
      let contentType: string;

      if (format === 'pdf') {
        outputBuffer = Buffer.from(await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '18mm',
            right: '18mm',
            bottom: '18mm',
            left: '18mm',
          },
          displayHeaderFooter: true,
          headerTemplate: `
            <div style="font-size: 10px; color: #666; width: 100%; text-align: center;">
              ${title} - Generated on ${new Date().toLocaleDateString()}
            </div>
          `,
          footerTemplate: `
            <div style="font-size: 10px; color: #666; width: 100%; text-align: center;">
              Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>
          `,
        }));
        contentType = 'application/pdf';
      } else {
        outputBuffer = Buffer.from(await page.screenshot({
          type: 'png',
          fullPage: template === 'onepager',
          omitBackground: false,
        }));
        contentType = 'image/png';
      }

      // Set response headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.${format}"`);
      res.setHeader('Content-Length', outputBuffer.length);
      
      // Send response
      res.status(200).send(outputBuffer);

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Increase API timeout for PDF generation
export const config = {
  api: {
    responseLimit: '10mb',
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}; 