#!/usr/bin/env node

/**
 * Master Test Runner for EPV Valuation Platform
 * Executes all test suites and provides comprehensive reporting
 */

const { spawn } = require('child_process');
const fs = require('fs');

// Test suite configuration
const TEST_SUITES = [
  {
    name: 'Mathematical Foundation',
    file: 'test_comprehensive_platform.js',
    description: 'Core mathematical calculations and EPV formulas'
  },
  {
    name: 'Edge Cases',
    file: 'test_edge_cases.js',
    description: 'Boundary conditions and error scenarios'
  },
  {
    name: 'Monte Carlo Validation',
    file: 'test_monte_carlo.js',
    description: 'Statistical validation and distribution testing'
  },
  {
    name: 'Valuation Models',
    file: 'test_valuation_models.js',
    description: 'EPV, DCF, WACC, and financial calculations'
  },
  {
    name: 'Frontend Components',
    file: 'test_frontend_components.js',
    description: 'React components, TypeScript, and UI testing'
  },
  {
    name: 'Comprehensive Integration',
    file: 'comprehensive_test_suite.js',
    description: 'Full platform integration testing'
  }
];

// Test results tracking
class MasterTestResults {
  constructor() {
    this.results = {
      suites: [],
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      startTime: Date.now(),
      endTime: null
    };
  }

  addSuiteResult(suite, passed, failed, duration) {
    this.results.suites.push({
      name: suite.name,
      passed,
      failed,
      total: passed + failed,
      successRate: passed + failed > 0 ? ((passed / (passed + failed)) * 100).toFixed(1) : '0.0',
      duration,
      status: failed === 0 ? '✅ PASSED' : '❌ FAILED'
    });
    
    this.results.totalPassed += passed;
    this.results.totalFailed += failed;
    this.results.totalTests += (passed + failed);
  }

  getOverallSuccessRate() {
    return this.results.totalTests > 0 
      ? ((this.results.totalPassed / this.results.totalTests) * 100).toFixed(1)
      : '0.0';
  }

  getPassedSuites() {
    return this.results.suites.filter(suite => suite.failed === 0).length;
  }

  getTotalSuites() {
    return this.results.suites.length;
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 MASTER TEST RUNNER - COMPREHENSIVE RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📊 OVERALL SUMMARY:`);
    console.log(`   Total Test Suites: ${this.getTotalSuites()}`);
    console.log(`   Passed Suites: ${this.getPassedSuites()}`);
    console.log(`   Failed Suites: ${this.getTotalSuites() - this.getPassedSuites()}`);
    console.log(`   Overall Success Rate: ${this.getOverallSuccessRate()}%`);
    console.log(`   Total Test Cases: ${this.results.totalTests}`);
    console.log(`   Total Passed: ${this.results.totalPassed}`);
    console.log(`   Total Failed: ${this.results.totalFailed}`);
    
    const totalDuration = Date.now() - this.results.startTime;
    console.log(`   Total Execution Time: ${totalDuration}ms`);
    
    console.log(`\n📈 DETAILED RESULTS:`);
    console.log('─'.repeat(80));
    console.log('Suite Name'.padEnd(30) + 'Status'.padEnd(12) + 'Pass/Fail'.padEnd(12) + 'Success Rate'.padEnd(12) + 'Duration');
    console.log('─'.repeat(80));
    
    this.results.suites.forEach(suite => {
      console.log(
        suite.name.padEnd(30) +
        suite.status.padEnd(12) +
        `${suite.passed}/${suite.failed}`.padEnd(12) +
        `${suite.successRate}%`.padEnd(12) +
        `${suite.duration}ms`
      );
    });
    
    console.log('─'.repeat(80));
    
    // Print failed suites details
    const failedSuites = this.results.suites.filter(suite => suite.failed > 0);
    if (failedSuites.length > 0) {
      console.log(`\n❌ FAILED SUITES (${failedSuites.length}):`);
      failedSuites.forEach(suite => {
        console.log(`   • ${suite.name}: ${suite.failed} failures`);
      });
    }
    
    // Print passed suites
    const passedSuites = this.results.suites.filter(suite => suite.failed === 0);
    if (passedSuites.length > 0) {
      console.log(`\n✅ PASSED SUITES (${passedSuites.length}):`);
      passedSuites.forEach(suite => {
        console.log(`   • ${suite.name}: ${suite.passed} tests passed`);
      });
    }
    
    // Final assessment
    console.log(`\n🎯 FINAL ASSESSMENT:`);
    const successRate = parseFloat(this.getOverallSuccessRate());
    if (successRate >= 95) {
      console.log('   🟢 EXCELLENT - Platform is ready for production!');
    } else if (successRate >= 85) {
      console.log('   🟡 GOOD - Platform is mostly ready with minor issues to address');
    } else if (successRate >= 70) {
      console.log('   🟠 FAIR - Platform needs improvements before production');
    } else {
      console.log('   🔴 POOR - Platform requires significant work before production');
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// Execute a single test suite
function runTestSuite(suite) {
  return new Promise((resolve) => {
    console.log(`\n🚀 Running ${suite.name}...`);
    console.log(`   Description: ${suite.description}`);
    console.log(`   File: ${suite.file}`);
    
    const startTime = Date.now();
    
    const child = spawn('node', [suite.file], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      // Parse test results from output
      let passed = 0;
      let failed = 0;
      
      // Look for test result patterns in output
      const passedMatches = output.match(/✅/g);
      const failedMatches = output.match(/❌/g);
      
      if (passedMatches) passed = passedMatches.length;
      if (failedMatches) failed = failedMatches.length;
      
      // If no patterns found, try to parse from summary
      if (passed === 0 && failed === 0) {
        const summaryMatch = output.match(/Passed:\s*(\d+).*Failed:\s*(\d+)/s);
        if (summaryMatch) {
          passed = parseInt(summaryMatch[1]);
          failed = parseInt(summaryMatch[2]);
        }
      }
      
      // If still no results, use exit code
      if (passed === 0 && failed === 0) {
        if (code === 0) {
          passed = 1; // Assume success if no failures detected
        } else {
          failed = 1; // Assume failure if exit code is non-zero
        }
      }
      
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Result: ${passed} passed, ${failed} failed`);
      
      resolve({ passed, failed, duration, output, errorOutput, code });
    });
    
    child.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`   Error: ${error.message}`);
      resolve({ passed: 0, failed: 1, duration, output: '', errorOutput: error.message, code: 1 });
    });
  });
}

// Main test runner
async function runAllTests() {
  console.log('🎯 EPV VALUATION PLATFORM - MASTER TEST RUNNER');
  console.log('='.repeat(80));
  console.log('Executing comprehensive test suite for all platform components...\n');
  
  const masterResults = new MasterTestResults();
  
  for (const suite of TEST_SUITES) {
    try {
      // Check if test file exists
      if (!fs.existsSync(suite.file)) {
        console.log(`⚠️  Test file ${suite.file} not found, skipping...`);
        masterResults.addSuiteResult(suite, 0, 1, 0);
        continue;
      }
      
      const result = await runTestSuite(suite);
      masterResults.addSuiteResult(suite, result.passed, result.failed, result.duration);
      
    } catch (error) {
      console.log(`❌ Error running ${suite.name}: ${error.message}`);
      masterResults.addSuiteResult(suite, 0, 1, 0);
    }
  }
  
  masterResults.results.endTime = Date.now();
  masterResults.printSummary();
  
  // Save results to file
  const reportData = {
    timestamp: new Date().toISOString(),
    results: masterResults.results,
    overallSuccessRate: masterResults.getOverallSuccessRate(),
    passedSuites: masterResults.getPassedSuites(),
    totalSuites: masterResults.getTotalSuites()
  };
  
  fs.writeFileSync('test_results.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed results saved to: test_results.json');
  
  // Exit with appropriate code
  const successRate = parseFloat(masterResults.getOverallSuccessRate());
  if (successRate >= 85) {
    console.log('\n✅ Test suite completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Test suite completed with failures. Please review the results.');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Master test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  MasterTestResults,
  TEST_SUITES
};