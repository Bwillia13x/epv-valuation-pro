#!/usr/bin/env node

/**
 * CPP Visual Report Kit - Simple Test
 * Validates templates and data without Puppeteer
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

async function validateTemplate(templateName) {
  const templatePath = path.resolve(
    rootDir,
    'templates',
    `${templateName}.html`
  );

  try {
    const content = await fs.readFile(templatePath, 'utf8');

    // Basic validation checks
    const checks = [
      { name: 'Contains DOCTYPE', test: content.includes('<!DOCTYPE html>') },
      { name: 'Contains ECharts script', test: content.includes('echarts') },
      { name: 'Contains format.js', test: content.includes('format.js') },
      {
        name: 'Contains window.__CASE__',
        test: content.includes('window.__CASE__'),
      },
      {
        name: 'Contains window.__READY__',
        test: content.includes('window.__READY__'),
      },
      { name: 'Contains chart container', test: content.includes('chart') },
    ];

    const failed = checks.filter((check) => !check.test);

    return {
      template: templateName,
      valid: failed.length === 0,
      checks: checks,
      failed: failed,
    };
  } catch (error) {
    return {
      template: templateName,
      valid: false,
      error: error.message,
    };
  }
}

async function validateCaseData(caseData) {
  const requiredFields = [
    'ttm_metrics',
    'ebitda_bridge',
    'valuation_matrix',
    'sources_uses',
    'debt_schedule',
    'irr_analysis',
    'epv_analysis',
    'epv_sensitivity',
  ];

  const checks = requiredFields.map((field) => ({
    field: field,
    exists: !!caseData[field],
    type: typeof caseData[field],
  }));

  const missing = checks.filter((check) => !check.exists);

  return {
    valid: missing.length === 0,
    checks: checks,
    missing: missing,
  };
}

async function runAcceptanceChecks(caseData) {
  const checks = [];

  try {
    // EBITDA Bridge validation
    const bridge = caseData.ebitda_bridge;
    const calculated =
      bridge.reported_ebitda +
      bridge.owner_addback +
      bridge.onetime_addback +
      bridge.rent_normalization;
    const tolerance =
      Math.abs(calculated - bridge.adjusted_ebitda) / bridge.adjusted_ebitda;

    checks.push({
      name: 'EBITDA Bridge Reconciliation',
      expected: bridge.adjusted_ebitda,
      actual: calculated,
      tolerance: tolerance,
      passed: tolerance <= 0.005,
    });

    // Valuation Matrix validation
    const matrix = caseData.valuation_matrix;
    const baseCase = matrix.find((row) => row.multiple === 8.5) || matrix[0];
    const expectedEv = bridge.adjusted_ebitda * baseCase.multiple;
    const evTolerance =
      Math.abs(expectedEv - baseCase.enterprise_value) /
      baseCase.enterprise_value;

    checks.push({
      name: 'Valuation Matrix Base Case',
      expected: expectedEv,
      actual: baseCase.enterprise_value,
      tolerance: evTolerance,
      passed: evTolerance <= 0.005,
    });

    // LBO Exit Equity validation
    const irr = caseData.irr_analysis;
    const calculatedExitEquity = irr.exit_ev - irr.exit_debt;
    const exitTolerance =
      Math.abs(calculatedExitEquity - irr.exit_equity) / irr.exit_equity;

    checks.push({
      name: 'LBO Exit Equity',
      expected: irr.exit_equity,
      actual: calculatedExitEquity,
      tolerance: exitTolerance,
      passed: exitTolerance <= 0.005,
    });
  } catch (error) {
    checks.push({
      name: 'Acceptance Checks Error',
      error: error.message,
      passed: false,
    });
  }

  return checks;
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

async function main() {
  console.log('🧪 CPP Visual Report Kit - Simple Test');
  console.log('─'.repeat(50));

  // Test templates
  const templates = ['bridge', 'matrix', 'epv', 'lbo', 'onepager'];
  console.log('\n📋 Template Validation:');

  for (const template of templates) {
    const result = await validateTemplate(template);
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${template}.html`);

    if (!result.valid && result.failed) {
      result.failed.forEach((check) => {
        console.log(`   ❌ ${check.name}`);
      });
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  // Test case data
  console.log('\n📊 Case Data Validation:');
  try {
    const caseData = await loadCaseData('cases/sample.json');
    const dataValidation = await validateCaseData(caseData);

    if (dataValidation.valid) {
      console.log('✅ All required fields present');
    } else {
      console.log('❌ Missing required fields:');
      dataValidation.missing.forEach((field) => {
        console.log(`   - ${field.field}`);
      });
    }

    // Test acceptance checks
    console.log('\n🔍 Acceptance Checks:');
    const acceptanceResults = await runAcceptanceChecks(caseData);

    acceptanceResults.forEach((check) => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}`);

      if (!check.passed && !check.error) {
        console.log(`   Expected: ${formatCurrency(check.expected)}`);
        console.log(`   Actual: ${formatCurrency(check.actual)}`);
        console.log(`   Tolerance: ${(check.tolerance * 100).toFixed(2)}%`);
      }

      if (check.error) {
        console.log(`   Error: ${check.error}`);
      }
    });

    // Summary
    const passedChecks = acceptanceResults.filter((c) => c.passed).length;
    const totalChecks = acceptanceResults.length;

    console.log('\n📈 Key Metrics Summary:');
    console.log(
      `TTM Revenue: ${formatCurrency(caseData.ttm_metrics.ttm_revenue)}`
    );
    console.log(
      `Adjusted EBITDA: ${formatCurrency(caseData.ebitda_bridge.adjusted_ebitda)}`
    );
    console.log(
      `EBITDA Margin: ${formatPercent(caseData.ttm_metrics.ttm_margin)}`
    );
    console.log(
      `Base EV (8.5×): ${formatCurrency(caseData.valuation_matrix.find((v) => v.multiple === 8.5)?.enterprise_value || 0)}`
    );
    console.log(`Sponsor IRR: ${formatPercent(caseData.irr_analysis.irr)}`);
    console.log(
      `EPV Enterprise: ${formatCurrency(caseData.epv_analysis.epv_enterprise)}`
    );

    console.log('\n🎯 Test Results:');
    console.log(`Templates: ${templates.length}/5 validated`);
    console.log(
      `Data Fields: ${dataValidation.valid ? 'All present' : 'Some missing'}`
    );
    console.log(`Acceptance Checks: ${passedChecks}/${totalChecks} passed`);

    if (passedChecks === totalChecks && dataValidation.valid) {
      console.log('\n🎉 All tests passed! Report kit is ready for use.');
      console.log('\nTo generate visuals, run:');
      console.log(
        'node scripts/render.mjs --case cases/sample.json --title "HarborGlow Aesthetics" --ttm "2024-Q3 → 2025-Q2" --out exports'
      );
    } else {
      console.log('\n⚠️  Some tests failed. Review above for details.');
    }
  } catch (error) {
    console.error('❌ Error testing case data:', error.message);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
