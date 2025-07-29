import React, { useState, useCallback } from 'react';
import GrailTerminal from './GrailTerminal';
import MedispaEPVProCliPage from './MedispaEPVProCliPage';
import { runMonteCarloEPV } from '../lib/valuationModels';

interface EPVGrailIntegrationProps {
  enableNeptune?: boolean;
}

interface AnalysisState {
  currentCase: string;
  scenario: 'Base' | 'Bull' | 'Bear';
  valuation: any;
  monteCarlo: any;
  sensitivity: any;
}

export default function EPVGrailIntegration({ enableNeptune = true }: EPVGrailIntegrationProps) {
  const [mode, setMode] = useState<'terminal' | 'gui'>('terminal');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    currentCase: 'default',
    scenario: 'Base',
    valuation: null,
    monteCarlo: null,
    sensitivity: null,
  });
  
  const [systemMessages, setSystemMessages] = useState<string[]>([]);

  const addSystemMessage = useCallback((message: string) => {
    setSystemMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const handleCommand = useCallback(async (command: string, args: string[]) => {
    addSystemMessage(`Executing: ${command} ${args.join(' ')}`);

    try {
      switch (command) {
        case 'epv':
          const method = args[0] || 'owner';
          if (method === 'owner' || method === 'nopat') {
            addSystemMessage(`Running EPV calculation with ${method} earnings method...`);
            // Integrate with existing EPV calculation logic
            const result = calculateEPV(method);
            setAnalysisState(prev => ({ ...prev, valuation: result }));
            addSystemMessage(`EPV calculation completed: $${result?.value?.toLocaleString() || 'N/A'}`);
          } else {
            throw new Error('Invalid EPV method. Use: owner or nopat');
          }
          break;

        case 'dcf':
          const years = parseInt(args[0]) || 10;
          const growth = parseFloat(args[1]) || 3;
          addSystemMessage(`Running DCF analysis: ${years} years, ${growth}% terminal growth...`);
          const dcfResult = calculateDCF(years, growth);
          setAnalysisState(prev => ({ ...prev, valuation: dcfResult }));
          addSystemMessage(`DCF completed: $${dcfResult?.value?.toLocaleString() || 'N/A'}`);
          break;

        case 'montecarlo':
          const runs = parseInt(args[0]) || 1000;
          addSystemMessage(`Starting Monte Carlo simulation with ${runs} iterations...`);
          const mcResult = await runMonteCarloAnalysis(runs);
          setAnalysisState(prev => ({ ...prev, monteCarlo: mcResult }));
          addSystemMessage(`Monte Carlo completed. Mean: $${mcResult?.mean?.toLocaleString()}, P95: $${mcResult?.p95?.toLocaleString()}`);
          break;

        case 'scenario':
          const scenario = args[0];
          if (['base', 'bull', 'bear'].includes(scenario)) {
            const scenarioType = scenario.charAt(0).toUpperCase() + scenario.slice(1) as 'Base' | 'Bull' | 'Bear';
            setAnalysisState(prev => ({ ...prev, scenario: scenarioType }));
            addSystemMessage(`Switched to ${scenarioType} scenario`);
          } else {
            throw new Error('Invalid scenario. Use: base, bull, or bear');
          }
          break;

        case 'sensitivity':
          const variable = args[0] || 'revenue';
          addSystemMessage(`Running sensitivity analysis on ${variable}...`);
          const sensResult = calculateSensitivity(variable);
          setAnalysisState(prev => ({ ...prev, sensitivity: sensResult }));
          addSystemMessage(`Sensitivity analysis completed for ${variable}`);
          break;

        case 'multiples':
          const type = args[0] || 'ev';
          addSystemMessage(`Calculating ${type.toUpperCase()} multiples...`);
          const multiplesResult = calculateMultiples(type);
          addSystemMessage(`${type.toUpperCase()} multiple: ${multiplesResult?.multiple?.toFixed(1)}x`);
          break;

        case 'quality':
          addSystemMessage('Running quality scoring analysis...');
          const qualityResult = calculateQualityScore();
          addSystemMessage(`Quality Score: ${qualityResult?.score}/100 (${qualityResult?.grade})`);
          break;

        case 'export':
          const format = args[0] || 'pdf';
          addSystemMessage(`Generating ${format.toUpperCase()} report...`);
          await exportReport(format);
          addSystemMessage(`Report exported successfully`);
          break;

        case 'gui':
          setMode('gui');
          addSystemMessage('Switched to GUI mode');
          break;

        case 'terminal':
          setMode('terminal');
          addSystemMessage('Switched to terminal mode');
          break;

        case 'status':
          addSystemMessage('=== SYSTEM STATUS ===');
          addSystemMessage(`Current Case: ${analysisState.currentCase}`);
          addSystemMessage(`Scenario: ${analysisState.scenario}`);
          addSystemMessage(`Last Valuation: ${analysisState.valuation?.value ? '$' + analysisState.valuation.value.toLocaleString() : 'None'}`);
          addSystemMessage(`Monte Carlo: ${analysisState.monteCarlo ? 'Available' : 'Not run'}`);
          addSystemMessage('===================');
          break;

        default:
          // Command not implemented in terminal mode
          throw new Error(`Command not implemented: ${command}. Switch to GUI mode for additional features.`);
          break;
      }
    } catch (error) {
      addSystemMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [analysisState, addSystemMessage]);

  // Mock calculation functions - these would integrate with your existing logic
  const calculateEPV = (method: string) => {
    // This would integrate with your existing EPV calculation logic
    return {
      method,
      value: 125000000,
      multiple: 12.5,
      confidence: 'High'
    };
  };

  const calculateDCF = (years: number, growth: number) => {
    // This would integrate with your existing DCF logic
    return {
      value: 135000000,
      years,
      terminalGrowth: growth,
      wacc: 8.5
    };
  };

  const runMonteCarloAnalysis = async (runs: number): Promise<any> => {
    // This would integrate with your existing Monte Carlo logic
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          runs,
          mean: 128000000,
          p5: 95000000,
          p25: 115000000,
          p50: 128000000,
          p75: 142000000,
          p95: 165000000
        });
      }, 1000);
    });
  };

  const calculateSensitivity = (variable: string) => {
    // This would integrate with your existing sensitivity analysis
    return {
      variable,
      baseValue: 128000000,
      lowCase: 95000000,
      highCase: 165000000,
      elasticity: 1.8
    };
  };

  const calculateMultiples = (type: string) => {
    // This would integrate with your existing multiples calculation
    return {
      type,
      multiple: type === 'ev' ? 12.5 : 18.2,
      benchmark: type === 'ev' ? 11.8 : 16.5
    };
  };

  const calculateQualityScore = () => {
    // This would integrate with your existing quality scoring
    return {
      score: 85,
      grade: 'A-',
      components: {
        profitability: 90,
        growth: 80,
        financial: 85,
        management: 85
      }
    };
  };

  const exportReport = async (format: string) => {
    // This would integrate with your existing export functionality
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`Report exported as ${format}`);
      }, 500);
    });
  };

  if (mode === 'gui') {
    return (
      <div className="h-screen flex flex-col">
        {/* Header with mode toggle */}
        <div className="bg-gray-900 text-white p-2 flex justify-between items-center">
          <div className="text-sm">
            <span className="text-green-400">VALOR-IVX</span> {/* GUI Mode */}
          </div>
          <button
            onClick={() => setMode('terminal')}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Switch to Terminal
          </button>
        </div>
        
        {/* Existing EPV GUI */}
        <div className="flex-1">
          <MedispaEPVProCliPage />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Terminal Mode */}
      <GrailTerminal
        onCommandExecute={handleCommand}
        enableNeptune={enableNeptune}
      />
      
      {/* System Messages Panel (can be toggled) */}
      {systemMessages.length > 0 && (
        <div className="fixed bottom-4 right-4 w-96 max-h-40 bg-black bg-opacity-90 text-green-400 text-xs p-3 rounded border border-green-600 overflow-y-auto">
          <div className="font-bold mb-2">System Messages</div>
          {systemMessages.slice(-10).map((msg, idx) => (
            <div key={idx} className="mb-1 opacity-80">{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
} 