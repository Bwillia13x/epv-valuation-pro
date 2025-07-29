#!/usr/bin/env node

/**
 * VistaBelle Case Validation Test
 * Tests the VistaBelle case data specifically
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

async function validateVistaBelleCase() {
  console.log('🏥 VistaBelle Aesthetics Case Validation');
  console.log('─'.repeat(50));

  try {
    const caseData = await loadCaseData('cases/vistabelle.json');

    // Check required fields
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

    console.log('\n📊 Data Structure Validation:');
    let allFieldsPresent = true;

    for (const field of requiredFields) {
      const exists = !!caseData[field];
      console.log(`${exists ? '✅' : '❌'} ${field}`);
      if (!exists) allFieldsPresent = false;
    }

    if (!allFieldsPresent) {
      console.error('\n❌ Missing required fields');
      return;
    }

    // Acceptance tests
    console.log('\n🔍 Acceptance Tests:');

    // Test 1: EBITDA Bridge
    const bridge = caseData.ebitda_bridge;
    const calculated =
      bridge.reported_ebitda +
      bridge.owner_addback +
      bridge.onetime_addback +
      bridge.rent_normalization;
    const bridgeTolerance =
      Math.abs(calculated - bridge.adjusted_ebitda) / bridge.adjusted_ebitda;
    const bridgePass = bridgeTolerance <= 0.005;
    console.log(
      `${bridgePass ? '✅' : '❌'} EBITDA Bridge: ${formatCurrency(calculated)} vs ${formatCurrency(bridge.adjusted_ebitda)}`
    );

    // Test 2: Valuation Matrix
    const matrix = caseData.valuation_matrix;
    const baseCase = matrix.find((row) => row.multiple === 8.5);
    const expectedEv = bridge.adjusted_ebitda * 8.5;
    const matrixTolerance =
      Math.abs(expectedEv - baseCase.enterprise_value) /
      baseCase.enterprise_value;
    const matrixPass = matrixTolerance <= 0.005;
    console.log(
      `${matrixPass ? '✅' : '❌'} Valuation Matrix: ${formatCurrency(expectedEv)} vs ${formatCurrency(baseCase.enterprise_value)}`
    );

    // Test 3: LBO Exit Equity
    const irr = caseData.irr_analysis;
    const calculatedExitEquity = irr.exit_ev - irr.exit_debt;
    const exitTolerance =
      Math.abs(calculatedExitEquity - irr.exit_equity) / irr.exit_equity;
    const exitPass = exitTolerance <= 0.005;
    console.log(
      `${exitPass ? '✅' : '❌'} Exit Equity: ${formatCurrency(calculatedExitEquity)} vs ${formatCurrency(irr.exit_equity)}`
    );

    // Display key metrics
    console.log('\n📈 VistaBelle Key Metrics:');
    console.log(
      `Company: ${caseData.company_info?.name || 'VistaBelle Aesthetics, LLC'}`
    );
    console.log(`Location: ${caseData.company_info?.location || 'Denver, CO'}`);
    console.log(
      `TTM Window: ${caseData.company_info?.ttm_window || '2024-Q3 → 2025-Q2'}`
    );
    console.log(
      `TTM Revenue: ${formatCurrency(caseData.ttm_metrics.ttm_revenue)}`
    );
    console.log(
      `Adjusted EBITDA: ${formatCurrency(caseData.ttm_metrics.ttm_ebitda_adjusted)}`
    );
    console.log(
      `EBITDA Margin: ${formatPercent(caseData.ttm_metrics.ttm_margin)}`
    );
    console.log(`Base EV (8.5×): ${formatCurrency(baseCase.enterprise_value)}`);
    console.log(
      `Equity to Seller: ${formatCurrency(baseCase.equity_value_to_seller)}`
    );
    console.log(`Sponsor IRR: ${formatPercent(irr.irr)}`);
    console.log(`MOIC: ${irr.moic.toFixed(1)}×`);
    console.log(
      `EPV Enterprise: ${formatCurrency(caseData.epv_analysis.epv_enterprise)}`
    );
    console.log(
      `EPV Equity: ${formatCurrency(caseData.epv_analysis.epv_equity)}`
    );

    // Summary
    const allTestsPass = bridgePass && matrixPass && exitPass;
    console.log('\n🎯 Validation Summary:');
    console.log(
      `Data Structure: ${allFieldsPresent ? '✅ Complete' : '❌ Incomplete'}`
    );
    console.log(
      `Acceptance Tests: ${allTestsPass ? '✅ All Pass' : '❌ Some Failed'}`
    );

    if (allFieldsPresent && allTestsPass) {
      console.log('\n🎉 VistaBelle case is ready for visual generation!');
      console.log('\nTo generate visuals, run:');
      console.log(
        'node scripts/render.mjs --case cases/vistabelle.json --title "VistaBelle Aesthetics (Denver)" --ttm "2024-Q3 → 2025-Q2" --out vistabelle_exports'
      );
    } else {
      console.log(
        '\n⚠️ VistaBelle case needs corrections before visual generation.'
      );
    }
  } catch (error) {
    console.error('❌ Error validating VistaBelle case:', error.message);
  }
}

validateVistaBelleCase();
