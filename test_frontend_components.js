/**
 * Frontend Component Test Suite
 * Tests React components, TypeScript compilation, and UI functionality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test result tracking
class FrontendTestResults {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      categories: {}
    };
  }

  record(testName, category, passed, error = null) {
    if (!this.results.categories[category]) {
      this.results.categories[category] = { passed: 0, failed: 0 };
    }
    
    if (passed) {
      this.results.passed++;
      this.results.categories[category].passed++;
      console.log(`✅ ${testName}`);
    } else {
      this.results.failed++;
      this.results.categories[category].failed++;
      this.results.errors.push({ testName, category, error: error?.message || 'Test failed' });
      console.log(`❌ ${testName}: ${error?.message || 'Test failed'}`);
    }
  }

  summary() {
    console.log('\n📊 FRONTEND TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    console.log('\n📈 BY CATEGORY:');
    Object.entries(this.results.categories).forEach(([category, stats]) => {
      const total = stats.passed + stats.failed;
      const rate = ((stats.passed / total) * 100).toFixed(1);
      console.log(`${category}: ${stats.passed}/${total} (${rate}%)`);
    });
  }
}

const testResults = new FrontendTestResults();

// 1. File Structure Tests
function testFileStructure() {
  console.log('\n📁 TESTING FILE STRUCTURE');
  console.log('='.repeat(50));

  try {
    // Test essential directories exist
    const directories = [
      'components',
      'pages',
      'lib',
      'styles',
      '__tests__'
    ];

    directories.forEach(dir => {
      if (fs.existsSync(dir)) {
        testResults.record(`${dir} directory exists`, 'File Structure', true);
      } else {
        testResults.record(`${dir} directory exists`, 'File Structure', false);
      }
    });

    // Test essential component files exist
    const componentFiles = [
      'components/EnhancedValuationComponents.tsx',
      'components/ExecutiveDashboard.tsx',
      'components/FinancialDataComponents.tsx',
      'components/AuthenticationForm.tsx',
      'components/CaseManager.tsx',
      'components/EnhancedVisualizations.tsx'
    ];

    componentFiles.forEach(file => {
      if (fs.existsSync(file)) {
        testResults.record(`${file} exists`, 'File Structure', true);
      } else {
        testResults.record(`${file} exists`, 'File Structure', false);
      }
    });

    // Test configuration files exist
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'next.config.js',
      'tailwind.config.js',
      'jest.config.js'
    ];

    configFiles.forEach(file => {
      if (fs.existsSync(file)) {
        testResults.record(`${file} exists`, 'File Structure', true);
      } else {
        testResults.record(`${file} exists`, 'File Structure', false);
      }
    });

  } catch (error) {
    testResults.record('File Structure', 'File Structure', false, error);
  }
}

// 2. TypeScript Compilation Tests
function testTypeScriptCompilation() {
  console.log('\n🔧 TESTING TYPESCRIPT COMPILATION');
  console.log('='.repeat(50));

  try {
    // Test TypeScript compilation
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    testResults.record('TypeScript compilation (noEmit)', 'TypeScript', true);
  } catch (error) {
    testResults.record('TypeScript compilation (noEmit)', 'TypeScript', false, error);
  }

  try {
    // Test TypeScript configuration
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    expect(tsConfig.compilerOptions?.strict, true, 0, 'TypeScript strict mode enabled');
    expect(tsConfig.compilerOptions?.esModuleInterop, true, 0, 'ES module interop enabled');
    testResults.record('TypeScript configuration', 'TypeScript', true);
  } catch (error) {
    testResults.record('TypeScript configuration', 'TypeScript', false, error);
  }
}

// 3. Component Content Tests
function testComponentContent() {
  console.log('\n🎨 TESTING COMPONENT CONTENT');
  console.log('='.repeat(50));

  try {
    // Test component imports and exports
    const componentFiles = [
      'components/EnhancedValuationComponents.tsx',
      'components/ExecutiveDashboard.tsx',
      'components/FinancialDataComponents.tsx'
    ];

    componentFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for React imports
        if (content.includes('import React') || content.includes('import {') || content.includes('from \'react\'')) {
          testResults.record(`${file} has React imports`, 'Component Content', true);
        } else {
          testResults.record(`${file} has React imports`, 'Component Content', false);
        }

        // Check for component definition
        if (content.includes('function ') || content.includes('const ') || content.includes('export default')) {
          testResults.record(`${file} has component definition`, 'Component Content', true);
        } else {
          testResults.record(`${file} has component definition`, 'Component Content', false);
        }

        // Check for JSX
        if (content.includes('<') && content.includes('>')) {
          testResults.record(`${file} contains JSX`, 'Component Content', true);
        } else {
          testResults.record(`${file} contains JSX`, 'Component Content', false);
        }
      }
    });

  } catch (error) {
    testResults.record('Component Content', 'Component Content', false, error);
  }
}

// 4. Styling Tests
function testStyling() {
  console.log('\n🎨 TESTING STYLING');
  console.log('='.repeat(50));

  try {
    // Test Tailwind configuration
    if (fs.existsSync('tailwind.config.js')) {
      const tailwindConfig = require('./tailwind.config.js');
      expect(tailwindConfig.content !== undefined, true, 0, 'Tailwind content configuration');
      testResults.record('Tailwind configuration', 'Styling', true);
    } else {
      testResults.record('Tailwind configuration', 'Styling', false);
    }

    // Test CSS files exist
    const cssFiles = [
      'styles/globals.css',
      'postcss.config.js'
    ];

    cssFiles.forEach(file => {
      if (fs.existsSync(file)) {
        testResults.record(`${file} exists`, 'Styling', true);
      } else {
        testResults.record(`${file} exists`, 'Styling', false);
      }
    });

    // Test for Tailwind classes in components
    const componentFiles = [
      'components/EnhancedValuationComponents.tsx',
      'components/ExecutiveDashboard.tsx'
    ];

    componentFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('className=') && content.includes('bg-') || content.includes('text-') || content.includes('p-') || content.includes('m-')) {
          testResults.record(`${file} uses Tailwind classes`, 'Styling', true);
        } else {
          testResults.record(`${file} uses Tailwind classes`, 'Styling', false);
        }
      }
    });

  } catch (error) {
    testResults.record('Styling', 'Styling', false, error);
  }
}

// 5. Testing Framework Tests
function testTestingFramework() {
  console.log('\n🧪 TESTING TESTING FRAMEWORK');
  console.log('='.repeat(50));

  try {
    // Test Jest configuration
    if (fs.existsSync('jest.config.js')) {
      const jestConfig = require('./jest.config.js');
      // Jest config is a function that returns the config
      expect(typeof jestConfig === 'function', true, 0, 'Jest configuration is a function');
      testResults.record('Jest configuration', 'Testing Framework', true);
    } else {
      testResults.record('Jest configuration', 'Testing Framework', false);
    }

    // Test existing test files
    const testFiles = [
      '__tests__/AuthenticationForm.test.tsx',
      '__tests__/AuthContext.test.tsx'
    ];

    testFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('describe(') || content.includes('test(') || content.includes('it(')) {
          testResults.record(`${file} has test structure`, 'Testing Framework', true);
        } else {
          testResults.record(`${file} has test structure`, 'Testing Framework', false);
        }
      } else {
        testResults.record(`${file} exists`, 'Testing Framework', false);
      }
    });

    // Test package.json scripts
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    expect(packageJson.scripts.test !== undefined, true, 0, 'Test script exists');
    expect(packageJson.scripts['test:watch'] !== undefined, true, 0, 'Test watch script exists');
    testResults.record('Package.json test scripts', 'Testing Framework', true);

  } catch (error) {
    testResults.record('Testing Framework', 'Testing Framework', false, error);
  }
}

// 6. Build Configuration Tests
function testBuildConfiguration() {
  console.log('\n🔨 TESTING BUILD CONFIGURATION');
  console.log('='.repeat(50));

  try {
    // Test Next.js configuration
    if (fs.existsSync('next.config.js')) {
      const nextConfig = require('./next.config.js');
      testResults.record('Next.js configuration', 'Build Configuration', true);
    } else {
      testResults.record('Next.js configuration', 'Build Configuration', false);
    }

    // Test package.json build scripts
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    expect(packageJson.scripts.build !== undefined, true, 0, 'Build script exists');
    expect(packageJson.scripts.dev !== undefined, true, 0, 'Dev script exists');
    expect(packageJson.scripts.start !== undefined, true, 0, 'Start script exists');
    testResults.record('Package.json build scripts', 'Build Configuration', true);

    // Test dependencies
    const requiredDeps = ['react', 'react-dom', 'next'];
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        testResults.record(`${dep} dependency exists`, 'Build Configuration', true);
      } else {
        testResults.record(`${dep} dependency exists`, 'Build Configuration', false);
      }
    });

  } catch (error) {
    testResults.record('Build Configuration', 'Build Configuration', false, error);
  }
}

// Helper function for assertions
function expect(actual, expected, tolerance = 0.001, testName = '') {
  if (typeof expected === 'number') {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(`${testName}: Expected ${expected}, got ${actual}`);
    }
  } else if (actual !== expected) {
    throw new Error(`${testName}: Expected ${expected}, got ${actual}`);
  }
  return true;
}

// Main test runner
function runFrontendTests() {
  console.log('🎨 FRONTEND COMPONENT TEST SUITE');
  console.log('='.repeat(60));
  console.log('Testing React components, TypeScript, and UI functionality...\n');

  const startTime = Date.now();

  try {
    testFileStructure();
    testTypeScriptCompilation();
    testComponentContent();
    testStyling();
    testTestingFramework();
    testBuildConfiguration();

    const totalTime = Date.now() - startTime;

    console.log('\n🎉 FRONTEND TESTING COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total Test Time: ${totalTime}ms`);
    
    testResults.summary();

    if (testResults.results.failed > 0) {
      console.log('\n❌ Some frontend tests failed. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ All frontend tests passed! Components are properly structured.');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n💥 Frontend test suite failed with error:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runFrontendTests();
}

module.exports = {
  runFrontendTests,
  testFileStructure,
  testTypeScriptCompilation,
  testComponentContent,
  testStyling,
  testTestingFramework,
  testBuildConfiguration
};