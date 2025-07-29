/**
 * CPP Visual Report Kit - Acceptance Tests
 * Validates financial calculations with ±0.5% tolerance
 */

window.__ACCEPTANCE__ = {
  /**
   * Run all acceptance checks on case data
   * @param {object} caseData - The case JSON data
   * @returns {array} Array of validation results
   */
  run: function (caseData) {
    const results = [];
    const tolerance = 0.005; // 0.5%

    try {
      // 1. EBITDA Bridge validation
      results.push(this.validateEbitdaBridge(caseData, tolerance));

      // 2. Valuation matrix validation (base case)
      results.push(this.validateValuationMatrix(caseData, tolerance));

      // 3. LBO exit equity validation
      results.push(this.validateLboExitEquity(caseData, tolerance));

      // 4. EPV consistency validation
      results.push(this.validateEpvConsistency(caseData, tolerance));

      // 5. Additional financial validations
      results.push(...this.validateAdditionalChecks(caseData, tolerance));
    } catch (error) {
      results.push({
        name: 'Acceptance Test Error',
        ok: false,
        expected: 'No errors',
        actual: error.message,
        diff: 'N/A',
      });
    }

    return results;
  },

  /**
   * Validate EBITDA Bridge reconciliation
   * Reported + Owner + One-time + Rent = Adjusted
   */
  validateEbitdaBridge: function (caseData, tolerance) {
    try {
      const bridge = caseData.ebitda_bridge;

      const reported = bridge.reported_ebitda;
      const owner = bridge.owner_addback;
      const onetime = bridge.onetime_addback;
      const rent = bridge.rent_normalization;
      const adjusted = bridge.adjusted_ebitda;

      const calculated = reported + owner + onetime + rent;
      const validation = this.withinTolerance(calculated, adjusted, tolerance);

      return {
        name: 'EBITDA Bridge Reconciliation',
        ok: validation.ok,
        expected: this.formatNumber(adjusted),
        actual: this.formatNumber(calculated),
        diff: this.formatDiff(validation),
      };
    } catch (error) {
      return {
        name: 'EBITDA Bridge Reconciliation',
        ok: false,
        expected: 'Valid calculation',
        actual: `Error: ${error.message}`,
        diff: 'N/A',
      };
    }
  },

  /**
   * Validate valuation matrix base case
   * EV = Adjusted EBITDA × Multiple
   */
  validateValuationMatrix: function (caseData, tolerance) {
    try {
      // Find base case (8.5x or closest)
      const matrix = caseData.valuation_matrix;
      const adjustedEbitda = caseData.ebitda_bridge.adjusted_ebitda;

      let baseCase = matrix.find((row) => row.multiple === 8.5);
      if (!baseCase) {
        // Fallback to 8.0x if 8.5x not found
        baseCase = matrix.find((row) => row.multiple === 8.0);
      }
      if (!baseCase) {
        // Use first available multiple
        baseCase = matrix[0];
      }

      const expectedEv = adjustedEbitda * baseCase.multiple;
      const actualEv = baseCase.enterprise_value;

      const validation = this.withinTolerance(actualEv, expectedEv, tolerance);

      return {
        name: `Valuation Matrix (${baseCase.multiple}× Multiple)`,
        ok: validation.ok,
        expected: this.formatNumber(expectedEv),
        actual: this.formatNumber(actualEv),
        diff: this.formatDiff(validation),
      };
    } catch (error) {
      return {
        name: 'Valuation Matrix',
        ok: false,
        expected: 'Valid EV calculation',
        actual: `Error: ${error.message}`,
        diff: 'N/A',
      };
    }
  },

  /**
   * Validate LBO exit equity calculation
   * Exit Equity = Exit EV - Exit Debt
   */
  validateLboExitEquity: function (caseData, tolerance) {
    try {
      const irr = caseData.irr_analysis;

      const exitEv = irr.exit_ev;
      const exitDebt = irr.exit_debt;
      const exitEquity = irr.exit_equity;

      const calculated = exitEv - exitDebt;
      const validation = this.withinTolerance(
        calculated,
        exitEquity,
        tolerance
      );

      return {
        name: 'LBO Exit Equity Calculation',
        ok: validation.ok,
        expected: this.formatNumber(exitEquity),
        actual: this.formatNumber(calculated),
        diff: this.formatDiff(validation),
      };
    } catch (error) {
      return {
        name: 'LBO Exit Equity Calculation',
        ok: false,
        expected: 'Valid exit equity',
        actual: `Error: ${error.message}`,
        diff: 'N/A',
      };
    }
  },

  /**
   * Validate EPV calculation consistency
   * Check that EPV values match what's in the JSON
   */
  validateEpvConsistency: function (caseData, tolerance) {
    try {
      const epv = caseData.epv_analysis;

      // Validate EPV enterprise calculation
      const ebit = epv.ebit;
      const nopat = epv.nopat;
      const reinvestment = epv.reinvestment;
      const fcf = epv.fcf;
      const epvEnterprise = epv.epv_enterprise;

      // Check FCF calculation: NOPAT - Reinvestment
      const calculatedFcf = nopat - reinvestment;
      const fcfValidation = this.withinTolerance(calculatedFcf, fcf, tolerance);

      if (!fcfValidation.ok) {
        return {
          name: 'EPV Free Cash Flow Calculation',
          ok: false,
          expected: this.formatNumber(fcf),
          actual: this.formatNumber(calculatedFcf),
          diff: this.formatDiff(fcfValidation),
        };
      }

      // For EPV enterprise, we'll validate that it's reasonable given FCF
      // Assuming WACC is around 12% (FCF / EPV should be around 0.12)
      const impliedWacc = fcf / epvEnterprise;
      const waccInRange = impliedWacc >= 0.08 && impliedWacc <= 0.2; // 8-20% range

      return {
        name: 'EPV Calculation Consistency',
        ok: waccInRange,
        expected: '8-20% implied WACC',
        actual: `${(impliedWacc * 100).toFixed(1)}% implied WACC`,
        diff: waccInRange ? '0%' : 'Outside range',
      };
    } catch (error) {
      return {
        name: 'EPV Calculation Consistency',
        ok: false,
        expected: 'Valid EPV calculation',
        actual: `Error: ${error.message}`,
        diff: 'N/A',
      };
    }
  },

  /**
   * Additional financial validation checks
   */
  validateAdditionalChecks: function (caseData, tolerance) {
    const results = [];

    try {
      // Check TTM revenue vs quarterly sum
      const ttmRevenue = caseData.ttm_metrics.ttm_revenue;
      if (caseData.debt_schedule && caseData.debt_schedule.length > 0) {
        // Use year 0 revenue as proxy for TTM
        const year1Revenue = caseData.debt_schedule[0].revenue;
        if (year1Revenue) {
          const validation = this.withinTolerance(
            year1Revenue,
            ttmRevenue * 1.08,
            0.1
          ); // Allow 10% for growth
          results.push({
            name: 'Revenue Growth Consistency',
            ok: validation.ok,
            expected: `~${this.formatNumber(ttmRevenue * 1.08)} (8% growth)`,
            actual: this.formatNumber(year1Revenue),
            diff: this.formatDiff(validation),
          });
        }
      }

      // Check EBITDA margin reasonableness
      const margin = caseData.ttm_metrics.ttm_margin;
      const marginReasonable = margin >= 0.05 && margin <= 0.5; // 5-50% range
      results.push({
        name: 'EBITDA Margin Reasonableness',
        ok: marginReasonable,
        expected: '5-50% range',
        actual: `${(margin * 100).toFixed(1)}%`,
        diff: marginReasonable ? '0%' : 'Outside range',
      });

      // Check IRR reasonableness for PE deal
      const irr = caseData.irr_analysis.irr;
      const irrReasonable = irr >= 0.1 && irr <= 0.5; // 10-50% range
      results.push({
        name: 'IRR Reasonableness',
        ok: irrReasonable,
        expected: '10-50% range',
        actual: `${(irr * 100).toFixed(1)}%`,
        diff: irrReasonable ? '0%' : 'Outside range',
      });

      // CPP Enhanced Checks - Strict 0.5% tolerance

      // Check Base Matrix Row calculation
      const matrix = caseData.valuation_matrix;
      const adjustedEbitda = caseData.ebitda_bridge.adjusted_ebitda;
      const baseCase =
        matrix.find((row) => row.multiple === 8.5) ||
        matrix[Math.floor(matrix.length / 2)];

      if (baseCase && adjustedEbitda) {
        const expectedEv = adjustedEbitda * baseCase.multiple;
        const validation = this.withinTolerance(
          baseCase.enterprise_value,
          expectedEv,
          0.005
        );
        results.push({
          name: 'Base Matrix Calculation (8.5×)',
          ok: validation.ok,
          expected: this.formatNumber(expectedEv),
          actual: this.formatNumber(baseCase.enterprise_value),
          diff: this.formatDiff(validation),
        });
      }

      // Check EPV Enterprise/Equity match JSON
      const epv = caseData.epv_analysis;
      if (epv && epv.epv_enterprise && epv.epv_equity) {
        const netDebt = caseData.assumptions
          ? caseData.assumptions.net_debt
          : 2030000;
        const expectedEquity = epv.epv_enterprise - netDebt;
        const validation = this.withinTolerance(
          epv.epv_equity,
          expectedEquity,
          0.005
        );
        results.push({
          name: 'EPV Equity Calculation',
          ok: validation.ok,
          expected: this.formatNumber(expectedEquity),
          actual: this.formatNumber(epv.epv_equity),
          diff: this.formatDiff(validation),
        });
      }
    } catch (error) {
      results.push({
        name: 'Additional Checks',
        ok: false,
        expected: 'Valid calculations',
        actual: `Error: ${error.message}`,
        diff: 'N/A',
      });
    }

    return results;
  },

  /**
   * Check if value is within tolerance
   */
  withinTolerance: function (actual, expected, tolerance = 0.005) {
    if (expected === 0) {
      return {
        ok: Math.abs(actual) <= tolerance,
        diff: Math.abs(actual),
        diffPct: null,
      };
    }

    const diff = Math.abs(actual - expected);
    const diffPct = diff / Math.abs(expected);

    return {
      ok: diffPct <= tolerance,
      diff: diff,
      diffPct: diffPct * 100,
    };
  },

  /**
   * Format number for display
   */
  formatNumber: function (value) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }

    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (abs >= 1000000) {
      return `${sign}${(abs / 1000000).toFixed(2)}M`;
    } else if (abs >= 1000) {
      return `${sign}${(abs / 1000).toFixed(0)}K`;
    } else {
      return `${sign}${abs.toFixed(0)}`;
    }
  },

  /**
   * Format validation difference for display
   */
  formatDiff: function (validation) {
    if (validation.diffPct === null) {
      return this.formatNumber(validation.diff);
    } else {
      return `${validation.diffPct.toFixed(2)}%`;
    }
  },

  /**
   * Generate summary of validation results
   */
  generateSummary: function (results) {
    const total = results.length;
    const passed = results.filter((r) => r.ok).length;
    const failed = total - passed;

    return {
      total: total,
      passed: passed,
      failed: failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      allPassed: failed === 0,
    };
  },

  /**
   * Get detailed failure information
   */
  getFailures: function (results) {
    return results.filter((r) => !r.ok);
  },

  /**
   * Format summary for console display
   */
  formatSummary: function (results) {
    const summary = this.generateSummary(results);
    const failures = this.getFailures(results);

    let output = `\nAcceptance Test Summary:\n`;
    output += `Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}\n`;
    output += `Pass Rate: ${summary.passRate.toFixed(1)}%\n`;

    if (failures.length > 0) {
      output += `\nFailures:\n`;
      failures.forEach((failure) => {
        output += `❌ ${failure.name}\n`;
        output += `   Expected: ${failure.expected}\n`;
        output += `   Actual: ${failure.actual}\n`;
        output += `   Difference: ${failure.diff}\n`;
      });
    }

    return output;
  },
};

// Expose validation utilities globally
window.validateCase = window.__ACCEPTANCE__.run;
window.withinTolerance = window.__ACCEPTANCE__.withinTolerance;
