import React, { useCallback, useEffect, useRef, useState } from 'react';

interface CliMessage {
  id: string;
  timestamp: number;
  type: 'system' | 'user' | 'success' | 'error' | 'info' | 'warning';
  content: string;
}

interface CommandCategory {
  name: string;
  description: string;
  commands: Command[];
}

interface Command {
  name: string;
  description: string;
  usage: string;
  example?: string;
}

const COMMAND_CATEGORIES: CommandCategory[] = [
  {
    name: 'Core Valuation Commands',
    description: 'Primary valuation methodologies and calculations',
    commands: [
      { name: 'epv', description: 'EPV (Earnings Power Value) calculation', usage: 'epv [method=owner|nopat]', example: 'epv owner' },
      { name: 'dcf', description: 'Discounted Cash Flow analysis', usage: 'dcf [years=10] [growth=3%]', example: 'dcf 10 3%' },
      { name: 'ddm', description: 'Dividend Discount Model', usage: 'ddm [dividend] [growth]', example: 'ddm 2.50 5%' },
      { name: 'multiples', description: 'Multiple-based valuation', usage: 'multiples [type=ev|pe|ps]', example: 'multiples ev' },
      { name: 'quality', description: 'Comprehensive quality scoring', usage: 'quality [metrics]', example: 'quality roic roe' },
      { name: 'reverse-dcf', description: 'Implied growth rate analysis', usage: 'reverse-dcf [price]', example: 'reverse-dcf 125.50' },
      { name: 'graham', description: 'Graham Number calculation', usage: 'graham [eps] [bvps]', example: 'graham 5.25 45.20' },
    ]
  },
  {
    name: 'Data & Analysis Commands',
    description: 'Market data retrieval and analysis tools',
    commands: [
      { name: 'quote', description: 'Get current stock quote', usage: 'quote [symbol]', example: 'quote AAPL' },
      { name: 'sec', description: 'SEC filing parser', usage: 'sec [symbol] [form=10k|10q|8k]', example: 'sec AAPL 10k' },
      { name: 'risk', description: 'Advanced risk metrics', usage: 'risk [metrics]', example: 'risk beta volatility' },
      { name: 'validate', description: 'Data quality validation', usage: 'validate [dataset]', example: 'validate financials' },
      { name: 'search', description: 'Advanced search and filtering', usage: 'search [criteria]', example: 'search sector=tech' },
      { name: 'benchmarks', description: 'Industry benchmark comparison', usage: 'benchmarks [industry]', example: 'benchmarks medtech' },
    ]
  },
  {
    name: 'Scenario & Analysis Commands',
    description: 'Scenario modeling and sensitivity analysis',
    commands: [
      { name: 'scenario', description: 'Switch analysis scenario', usage: 'scenario [base|bull|bear]', example: 'scenario bull' },
      { name: 'montecarlo', description: 'Monte Carlo simulation', usage: 'montecarlo [runs=1000]', example: 'montecarlo 5000' },
      { name: 'sensitivity', description: 'Sensitivity analysis', usage: 'sensitivity [variable]', example: 'sensitivity revenue' },
      { name: 'stress', description: 'Stress testing', usage: 'stress [scenario]', example: 'stress recession' },
      { name: 'optimization', description: 'Parameter optimization', usage: 'optimization [target]', example: 'optimization irr' },
    ]
  },
  {
    name: 'Management Commands',
    description: 'Portfolio and investment management tools',
    commands: [
      { name: 'watchlist', description: 'Investment watchlist management', usage: 'watchlist [add|remove|list]', example: 'watchlist add AAPL' },
      { name: 'notes', description: 'Investment notes and memos', usage: 'notes [add|edit|list]', example: 'notes add "Strong moat"' },
      { name: 'export', description: 'Generate comprehensive reports', usage: 'export [format=pdf|excel|json]', example: 'export pdf' },
      { name: 'history', description: 'Command history and sessions', usage: 'history [show|clear]', example: 'history show' },
      { name: 'config', description: 'Configuration management', usage: 'config [get|set] [key] [value]', example: 'config set theme dark' },
      { name: 'portfolio', description: 'Portfolio analysis', usage: 'portfolio [summary|allocation]', example: 'portfolio summary' },
    ]
  },
  {
    name: 'System Commands',
    description: 'System utilities and navigation',
    commands: [
      { name: 'help', description: 'Display command reference', usage: 'help [command]', example: 'help epv' },
      { name: 'clear', description: 'Clear terminal screen', usage: 'clear', example: 'clear' },
      { name: 'status', description: 'System status and health', usage: 'status', example: 'status' },
      { name: 'version', description: 'Display version information', usage: 'version', example: 'version' },
      { name: 'debug', description: 'Debug mode toggle', usage: 'debug [on|off]', example: 'debug on' },
      { name: 'theme', description: 'Change terminal theme', usage: 'theme [dark|light|green]', example: 'theme green' },
    ]
  }
];

interface GrailTerminalProps {
  onCommandExecute?: (command: string, args: string[]) => void;
  enableNeptune?: boolean;
}

export default function GrailTerminal({ 
  onCommandExecute,
  enableNeptune = true 
}: GrailTerminalProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<CliMessage[]>([]);
  const [showHelp, setShowHelp] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light' | 'green'>('green');
  const [neptuneMode, setNeptuneMode] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addMessage = useCallback((type: CliMessage['type'], content: string) => {
    const message: CliMessage = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      content
    };
    setMessages(prev => [...prev, message]);
  }, []);

  useEffect(() => {
    // Welcome message
    addMessage('system', 'VALOR-IVX GRAIL Terminal - v2.1.0');
    addMessage('system', 'Mode: Public Markets Analysis');
    addMessage('info', 'Type "help" for a list of commands.');
    if (enableNeptune) {
      addMessage('info', 'Neptune mode available - enhanced AI analysis.');
    }
  }, [addMessage, enableNeptune]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseCommand = (input: string): { command: string; args: string[] } => {
    const trimmed = input.trim();
    const parts = trimmed.split(/\s+/);
    return {
      command: parts[0]?.toLowerCase() || '',
      args: parts.slice(1)
    };
  };

  const executeCommand = useCallback((input: string) => {
    if (!input.trim()) return;

    const { command, args } = parseCommand(input);
    
    // Add to history
    setCommandHistory(prev => [input, ...prev.slice(0, 99)]);
    setHistoryIndex(-1);
    
    // Echo command
    addMessage('user', `> ${input}`);

    // Execute command
    switch (command) {
      case 'help':
        if (args.length === 0) {
          setShowHelp(true);
          addMessage('info', 'GRAIL Terminal - Complete Command Reference');
          COMMAND_CATEGORIES.forEach(category => {
            addMessage('info', `\n${category.name}:`);
            category.commands.forEach(cmd => {
              addMessage('info', `  ${cmd.name.padEnd(15)} ${cmd.description}`);
            });
          });
        } else {
          const cmdName = args[0];
          const foundCmd = COMMAND_CATEGORIES
            .flatMap(cat => cat.commands)
            .find(cmd => cmd.name === cmdName);
          
          if (foundCmd) {
            addMessage('info', `Command: ${foundCmd.name}`);
            addMessage('info', `Description: ${foundCmd.description}`);
            addMessage('info', `Usage: ${foundCmd.usage}`);
            if (foundCmd.example) {
              addMessage('info', `Example: ${foundCmd.example}`);
            }
          } else {
            addMessage('error', `Command not found: ${cmdName}`);
          }
        }
        break;

      case 'clear':
        setMessages([]);
        addMessage('system', 'Terminal cleared');
        break;

      case 'status':
        addMessage('success', 'System Status: OPERATIONAL');
        addMessage('info', `Theme: ${theme}`);
        addMessage('info', `Neptune Mode: ${neptuneMode ? 'ENABLED' : 'DISABLED'}`);
        addMessage('info', `Commands Executed: ${commandHistory.length}`);
        break;

      case 'version':
        addMessage('info', 'VALOR-IVX GRAIL Terminal v2.1.0');
        addMessage('info', 'EPV Valuation Engine v1.5.2');
        addMessage('info', 'Built with TypeScript + React');
        break;

      case 'theme':
        if (args[0] && ['dark', 'light', 'green'].includes(args[0])) {
          setTheme(args[0] as 'dark' | 'light' | 'green');
          addMessage('success', `Theme changed to: ${args[0]}`);
        } else {
          addMessage('error', 'Valid themes: dark, light, green');
        }
        break;

      case 'neptune':
        if (enableNeptune) {
          setNeptuneMode(!neptuneMode);
          addMessage('success', `Neptune mode ${neptuneMode ? 'disabled' : 'enabled'}`);
        } else {
          addMessage('error', 'Neptune mode not available');
        }
        break;

      case 'history':
        if (args[0] === 'clear') {
          setCommandHistory([]);
          addMessage('success', 'Command history cleared');
        } else {
          addMessage('info', 'Recent Commands:');
          commandHistory.slice(0, 10).forEach((cmd, idx) => {
            addMessage('info', `${idx + 1}. ${cmd}`);
          });
        }
        break;

      case 'debug':
        if (args[0] === 'on' || args[0] === 'off') {
          addMessage('success', `Debug mode ${args[0]}`);
        } else {
          addMessage('error', 'Usage: debug [on|off]');
        }
        break;

      default:
        // Check if it's a valid command
        const isValidCommand = COMMAND_CATEGORIES
          .flatMap(cat => cat.commands)
          .some(cmd => cmd.name === command);

        if (isValidCommand) {
          addMessage('info', `Executing: ${command} ${args.join(' ')}`);
          onCommandExecute?.(command, args);
          addMessage('success', `Command executed: ${command}`);
        } else {
          addMessage('error', `Unknown command: ${command}. Type 'help' for available commands.`);
        }
        break;
    }
  }, [addMessage, theme, neptuneMode, commandHistory, onCommandExecute, enableNeptune]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'green':
        return 'bg-black text-green-400 border-green-600';
      case 'dark':
        return 'bg-gray-900 text-gray-100 border-gray-600';
      case 'light':
        return 'bg-white text-gray-900 border-gray-300';
      default:
        return 'bg-black text-green-400 border-green-600';
    }
  };

  const getMessageColor = (type: CliMessage['type']) => {
    if (theme === 'light') {
      switch (type) {
        case 'error': return 'text-red-600';
        case 'success': return 'text-green-600';
        case 'warning': return 'text-yellow-600';
        case 'info': return 'text-blue-600';
        case 'system': return 'text-purple-600';
        case 'user': return 'text-gray-700';
        default: return 'text-gray-900';
      }
    } else {
      switch (type) {
        case 'error': return 'text-red-400';
        case 'success': return 'text-green-400';
        case 'warning': return 'text-yellow-400';
        case 'info': return 'text-cyan-400';
        case 'system': return 'text-purple-400';
        case 'user': return 'text-white';
        default: return theme === 'green' ? 'text-green-400' : 'text-gray-300';
      }
    }
  };

  return (
    <div className={`h-screen flex flex-col font-mono text-sm ${getThemeClasses()}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-current">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">VALOR-IVX</h1>
          <span className="text-xs opacity-70">{/* GRAIL TERMINAL */} GRAIL TERMINAL</span>
        </div>
        <div className="flex items-center space-x-2">
          {enableNeptune && (
            <button
              onClick={() => setNeptuneMode(!neptuneMode)}
              className={`px-3 py-1 text-xs border rounded ${
                neptuneMode 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'border-current hover:bg-current hover:bg-opacity-10'
              }`}
            >
              Neptune
            </button>
          )}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="px-3 py-1 text-xs border border-current rounded hover:bg-current hover:bg-opacity-10"
          >
            Help
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`whitespace-pre-wrap ${getMessageColor(message.type)}`}
              >
                {message.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-current">
            <div className="flex items-center space-x-2">
              <span className="text-current opacity-70">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-current"
                placeholder="Enter command..."
                autoFocus
              />
            </div>
          </form>
        </div>

        {/* Help Panel (if shown) */}
        {showHelp && (
          <div className="w-96 border-l border-current p-4 overflow-y-auto">
            <h3 className="font-bold mb-4">Command Reference</h3>
            <div className="space-y-4">
              {COMMAND_CATEGORIES.map((category) => (
                <div key={category.name}>
                  <h4 className="font-semibold text-xs mb-2 opacity-70">
                    {category.name.toUpperCase()}
                  </h4>
                  <div className="space-y-1">
                    {category.commands.map((command) => (
                      <div key={command.name} className="text-xs">
                        <span className="text-current font-medium">
                          {command.name}
                        </span>
                        <div className="opacity-70 ml-2">
                          {command.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 