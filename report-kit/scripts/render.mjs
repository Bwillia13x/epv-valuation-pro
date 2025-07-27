#!/usr/bin/env node

/**
 * CPP Visual Report Kit - Main Renderer
 * Generates pixel-perfect visuals from case JSON using Puppeteer
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Command line argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--case':
        options.case = args[++i];
        break;
      case '--title':
        options.title = args[++i];
        break;
      case '--ttm':
        options.ttm = args[++i];
        break;
      case '--out':
        options.out = args[++i];
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        showHelp();
        process.exit(1);
    }
  }
  
  // Validate required options
  if (!options.case || !options.title || !options.ttm) {
    console.error('Missing required options');
    showHelp();
    process.exit(1);
  }
  
  // Set defaults
  options.out = options.out || 'exports';
  
  return options;
}

function showHelp() {
  console.log(`
CPP Visual Report Kit

Usage: node scripts/render.mjs [options]

Options:
  --case <path>     Path to case JSON file (required)
  --title <text>    Case title for headers (required) 
  --ttm <text>      TTM window description (required)
  --out <dir>       Output directory (default: exports)
  --help           Show this help message

Examples:
  node scripts/render.mjs \\
    --case cases/harborglow.json \\
    --title "HarborGlow Aesthetics (Nashville)" \\
    --ttm "2024-Q3 → 2025-Q2" \\
    --out exports
`);
}

// Template configurations
const templates = [
  {
    name: 'bridge',
    file: 'bridge.html',
    output: '01_EBITDA_Bridge.png',
    description: 'EBITDA Bridge Waterfall'
  },
  {
    name: 'matrix', 
    file: 'matrix.html',
    output: '02_Valuation_Matrix.png',
    description: 'Valuation Matrix'
  },
  {
    name: 'epv',
    file: 'epv.html', 
    output: '03_EPV_Panel.png',
    description: 'EPV Panel with Sensitivity'
  },
  {
    name: 'lbo',
    file: 'lbo.html',
    output: '04_LBO_Summary.png', 
    description: 'LBO Summary'
  },
  {
    name: 'kpi',
    file: 'kpi.html',
    output: '05_KPI_Dashboard.png',
    description: 'KPI Gauges & Metrics'
  },
  {
    name: 'monte-carlo',
    file: 'monte-carlo.html',
    output: '06_Monte_Carlo.png',
    description: 'Monte Carlo Simulation'
  },
  {
    name: 'scenario',
    file: 'scenario.html',
    output: '07_Scenario_Analysis.png',
    description: 'Scenario Analysis'
  },
  {
    name: 'tornado',
    file: 'tornado.html',
    output: '08_Sensitivity_Tornado.png',
    description: 'Sensitivity Tornado Chart'
  }
];

async function loadCaseData(casePath) {
  try {
    const fullPath = path.resolve(rootDir, casePath);
    const data = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading case data from ${casePath}:`, error.message);
    process.exit(1);
  }
}

async function ensureOutputDirectory(outputDir) {
  const fullPath = path.resolve(rootDir, outputDir);
  try {
    await fs.mkdir(fullPath, { recursive: true });
    return fullPath;
  } catch (error) {
    console.error(`Error creating output directory ${outputDir}:`, error.message);
    process.exit(1);
  }
}

async function launchBrowser() {
  console.log('🚀 Launching browser...');
  
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-default-apps',
        '--no-first-run'
      ],
      defaultViewport: {
        width: 1280,
        height: 720,
        deviceScaleFactor: 2 // For high-DPI output
      },
      timeout: 30000,
      protocolTimeout: 30000,
      ignoreDefaultArgs: ['--disable-extensions'],
      dumpio: false
    });
    
    console.log('✅ Browser launched successfully');
    return browser;
    
  } catch (error) {
    console.error('❌ Browser launch failed:', error.message);
    console.log('💡 Trying fallback browser configuration...');
    
    // Fallback: try with minimal configuration
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        width: 1280,
        height: 720,
        deviceScaleFactor: 2
      }
    });
    
    console.log('✅ Browser launched with fallback config');
    return browser;
  }
}

async function renderTemplate(browser, template, caseData, title, ttm, outputPath) {
  const page = await browser.newPage();
  
  try {
    console.log(`📊 Rendering ${template.description}...`);
    
    // Load template
    const templatePath = path.resolve(rootDir, 'templates', template.file);
    const templateUrl = `file://${templatePath}`;
    
    await page.goto(templateUrl, { waitUntil: 'networkidle0' });
    
    // Inject case data
    await page.evaluate(({ caseData, title, ttm }) => {
      window.__CASE__ = caseData;
      window.__TITLE__ = title;
      window.__TTM__ = ttm;
    }, { caseData, title, ttm });
    
    // Wait for chart to be ready
    await page.waitForFunction(() => window.__READY__ === true, { timeout: 10000 });
    
    // Take screenshot
    const outputFile = path.join(outputPath, template.output);
    await page.screenshot({
      path: outputFile,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1280,
        height: 720
      }
    });
    
    console.log(`✅ Generated: ${template.output}`);
    
  } catch (error) {
    console.error(`❌ Error rendering ${template.name}:`, error.message);
    throw error;
  } finally {
    await page.close();
  }
}

async function renderOnePager(browser, caseData, title, ttm, outputPath) {
  const page = await browser.newPage();
  
  try {
    console.log('📄 Rendering one-pager PDF...');
    
    // Load onepager template
    const templatePath = path.resolve(rootDir, 'templates', 'onepager.html');
    const templateUrl = `file://${templatePath}`;
    
    await page.goto(templateUrl, { waitUntil: 'networkidle0' });
    
    // Inject case data
    await page.evaluate(({ caseData, title, ttm }) => {
      window.__CASE__ = caseData;
      window.__TITLE__ = title;
      window.__TTM__ = ttm;
    }, { caseData, title, ttm });
    
    // Wait for all charts to be ready
    await page.waitForFunction(() => window.__READY__ === true, { timeout: 15000 });
    
    // Generate PDF
    const outputFile = path.join(outputPath, 'CPP_OnePager.pdf');
    await page.pdf({
      path: outputFile,
      format: 'A4',
      margin: {
        top: '18mm',
        right: '18mm', 
        bottom: '18mm',
        left: '18mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    console.log('✅ Generated: CPP_OnePager.pdf');
    
  } catch (error) {
    console.error('❌ Error rendering PDF:', error.message);
    throw error;
  } finally {
    await page.close();
  }
}

async function runAcceptanceChecks(browser, caseData) {
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Running acceptance checks...');
    
    // Load acceptance page (we'll create a minimal HTML for this)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="../public/js/acceptance.js"></script>
</head>
<body>
  <div id="status">Loading acceptance checks...</div>
</body>
</html>
    `;
    
    await page.setContent(html);
    
    // Load acceptance script
    const acceptancePath = path.resolve(rootDir, 'public', 'js', 'acceptance.js');
    await page.addScriptTag({ path: acceptancePath });
    
    // Run checks
    const results = await page.evaluate((caseData) => {
      return window.__ACCEPTANCE__.run(caseData);
    }, caseData);
    
    // Display results
    let allPassed = true;
    console.log('\n📋 Acceptance Check Results:');
    console.log('─'.repeat(60));
    
    for (const result of results) {
      const status = result.ok ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      
      if (!result.ok) {
        console.log(`    Expected: ${result.expected}`);
        console.log(`    Actual: ${result.actual}`);
        console.log(`    Difference: ${result.diff}%`);
        allPassed = false;
      }
    }
    
    console.log('─'.repeat(60));
    
    if (!allPassed) {
      console.error('❌ Some acceptance checks failed. Exiting.');
      process.exit(1);
    }
    
    console.log('✅ All acceptance checks passed!');
    return results;
    
  } catch (error) {
    console.error('❌ Error running acceptance checks:', error.message);
    throw error;
  } finally {
    await page.close();
  }
}

function formatCurrency(value) {
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

async function generateSummary(caseData, title, ttm, outputPath, acceptanceResults) {
  const summary = `CPP VISUAL REPORT SUMMARY
${'='.repeat(50)}

CASE: ${title}
TTM WINDOW: ${ttm}
GENERATED: ${new Date().toISOString()}

FINANCIAL METRICS:
──────────────────
• TTM Revenue: ${formatCurrency(caseData.ttm_metrics.ttm_revenue)}
• Reported EBITDA: ${formatCurrency(caseData.ttm_metrics.ttm_ebitda_reported)}
• Adjusted EBITDA: ${formatCurrency(caseData.ttm_metrics.ttm_ebitda_adjusted)}
• EBITDA Margin: ${formatPercent(caseData.ttm_metrics.ttm_margin)}

VALUATION (BASE CASE):
─────────────────────
• Base Multiple: 8.5×
• Enterprise Value: ${formatCurrency(caseData.valuation_matrix.find(v => v.multiple === 8.5)?.enterprise_value || 0)}
• Equity to Seller: ${formatCurrency(caseData.valuation_matrix.find(v => v.multiple === 8.5)?.equity_value_to_seller || 0)}

LBO ANALYSIS:
────────────
• Sponsor Equity: ${formatCurrency(caseData.sources_uses.sponsor_equity)}
• IRR: ${formatPercent(caseData.irr_analysis.irr)}
• MOIC: ${caseData.irr_analysis.moic.toFixed(1)}×
• Exit Multiple: ${(caseData.irr_analysis.exit_ev / caseData.irr_analysis.year5_ebitda).toFixed(1)}×

EPV ANALYSIS:
────────────
• EPV Enterprise: ${formatCurrency(caseData.epv_analysis.epv_enterprise)}
• EPV Equity: ${formatCurrency(caseData.epv_analysis.epv_equity)}
• EPV Multiple: ${caseData.epv_analysis.epv_implied_multiple.toFixed(1)}×

ACCEPTANCE CHECKS:
─────────────────
${acceptanceResults.map(r => `${r.ok ? '✅' : '❌'} ${r.name}`).join('\n')}

FILES GENERATED:
───────────────
• 01_EBITDA_Bridge.png
• 02_Valuation_Matrix.png  
• 03_EPV_Panel.png
• 04_LBO_Summary.png
• CPP_OnePager.pdf
• summary.txt

${'='.repeat(50)}
Quality: Investment Grade | Status: CPP Ready
`;

  const summaryPath = path.join(outputPath, 'summary.txt');
  await fs.writeFile(summaryPath, summary);
  console.log('✅ Generated: summary.txt');
}

async function main() {
  const options = parseArgs();
  
  console.log('🎯 CPP Visual Report Kit');
  console.log('─'.repeat(40));
  console.log(`Case: ${options.case}`);
  console.log(`Title: ${options.title}`);
  console.log(`TTM: ${options.ttm}`);
  console.log(`Output: ${options.out}`);
  console.log('─'.repeat(40));
  
  // Load case data
  const caseData = await loadCaseData(options.case);
  console.log('✅ Case data loaded');
  
  // Ensure output directory
  const outputPath = await ensureOutputDirectory(options.out);
  console.log(`✅ Output directory ready: ${outputPath}`);
  
  const browser = await launchBrowser();
  
  try {
    // Run acceptance checks first
    const acceptanceResults = await runAcceptanceChecks(browser, caseData);
    
    // Render individual chart templates
    for (const template of templates) {
      await renderTemplate(browser, template, caseData, options.title, options.ttm, outputPath);
    }
    
    // Render one-pager PDF
    await renderOnePager(browser, caseData, options.title, options.ttm, outputPath);
    
    // Generate summary
    await generateSummary(caseData, options.title, options.ttm, outputPath, acceptanceResults);
    
    console.log('\n🎉 CPP Visual Report Kit Complete!');
    console.log(`📁 All files saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 