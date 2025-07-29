import React, { useState, useCallback, useRef, useEffect } from 'react';

// Types for financial data structure
interface FinancialLineItem {
  id: string;
  category: 'revenue' | 'cogs' | 'expenses' | 'other';
  subcategory?: string;
  label: string;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isEditable?: boolean;
  isCalculated?: boolean;
  formula?: string;
  values: { [year: string]: number };
  units?: 'currency' | 'percentage' | 'number';
  level: number; // For indentation (0=main, 1=sub, 2=detail)
}

interface SpreadsheetProps {
  years?: string[];
  onDataChange?: (data: FinancialLineItem[]) => void;
  initialData?: FinancialLineItem[];
  readOnly?: boolean;
}

// Default P&L structure based on the Excel screenshots
const createDefaultPLStructure = (years: string[]): FinancialLineItem[] => {
  const emptyValues = years.reduce((acc, year) => ({ ...acc, [year]: 0 }), {});

  return [
    // REVENUE SECTION
    {
      id: 'revenue-header',
      category: 'revenue',
      label: 'REVENUE',
      level: 0,
      isSubtotal: true,
      isEditable: false,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'botox-dysport',
      category: 'revenue',
      subcategory: 'injectables',
      label: 'Botox & Dysport',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'dermal-fillers',
      category: 'revenue',
      subcategory: 'injectables',
      label: 'Dermal Fillers',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'laser-treatments',
      category: 'revenue',
      subcategory: 'services',
      label: 'Laser Treatments',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'skincare-products',
      category: 'revenue',
      subcategory: 'retail',
      label: 'Skincare Products',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'other-services',
      category: 'revenue',
      subcategory: 'services',
      label: 'Other Services',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'total-revenue',
      category: 'revenue',
      label: 'Total Revenue',
      level: 0,
      isTotal: true,
      isCalculated: true,
      isEditable: false,
      formula: 'SUM(botox-dysport:other-services)',
      values: emptyValues,
      units: 'currency'
    },

    // COST OF GOODS SOLD
    {
      id: 'cogs-header',
      category: 'cogs',
      label: 'COST OF GOODS SOLD',
      level: 0,
      isSubtotal: true,
      isEditable: false,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'product-costs',
      category: 'cogs',
      label: 'Product Costs',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'medical-supplies',
      category: 'cogs',
      label: 'Medical Supplies',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'total-cogs',
      category: 'cogs',
      label: 'Total Cost of Goods Sold',
      level: 0,
      isTotal: true,
      isCalculated: true,
      isEditable: false,
      formula: 'SUM(product-costs:medical-supplies)',
      values: emptyValues,
      units: 'currency'
    },

    // GROSS PROFIT
    {
      id: 'gross-profit',
      category: 'revenue',
      label: 'Gross Profit',
      level: 0,
      isTotal: true,
      isCalculated: true,
      isEditable: false,
      formula: 'total-revenue - total-cogs',
      values: emptyValues,
      units: 'currency'
    },

    // OPERATING EXPENSES
    {
      id: 'expenses-header',
      category: 'expenses',
      label: 'OPERATING EXPENSES',
      level: 0,
      isSubtotal: true,
      isEditable: false,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'salaries-benefits',
      category: 'expenses',
      subcategory: 'personnel',
      label: 'Salaries & Benefits',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'rent',
      category: 'expenses',
      subcategory: 'facilities',
      label: 'Rent',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'utilities',
      category: 'expenses',
      subcategory: 'facilities',
      label: 'Utilities',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'insurance',
      category: 'expenses',
      subcategory: 'administrative',
      label: 'Insurance',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'marketing',
      category: 'expenses',
      subcategory: 'sales',
      label: 'Marketing & Advertising',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'professional-fees',
      category: 'expenses',
      subcategory: 'administrative',
      label: 'Professional Fees',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'depreciation',
      category: 'expenses',
      subcategory: 'administrative',
      label: 'Depreciation & Amortization',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'other-expenses',
      category: 'expenses',
      subcategory: 'administrative',
      label: 'Other Operating Expenses',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'total-expenses',
      category: 'expenses',
      label: 'Total Operating Expenses',
      level: 0,
      isTotal: true,
      isCalculated: true,
      isEditable: false,
      formula: 'SUM(salaries-benefits:other-expenses)',
      values: emptyValues,
      units: 'currency'
    },

    // OPERATING INCOME
    {
      id: 'operating-income',
      category: 'revenue',
      label: 'Operating Income (EBITDA)',
      level: 0,
      isTotal: true,
      isCalculated: true,
      isEditable: false,
      formula: 'gross-profit - total-expenses + depreciation',
      values: emptyValues,
      units: 'currency'
    },

    // OTHER INCOME/EXPENSES
    {
      id: 'other-header',
      category: 'other',
      label: 'OTHER INCOME / (EXPENSES)',
      level: 0,
      isSubtotal: true,
      isEditable: false,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'interest-income',
      category: 'other',
      label: 'Interest Income',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'interest-expense',
      category: 'other',
      label: 'Interest Expense',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    },
    {
      id: 'total-other',
      category: 'other',
      label: 'Total Other Income / (Expenses)',
      level: 0,
      isTotal: true,
      isCalculated: true,
      isEditable: false,
      formula: 'interest-income - interest-expense',
      values: emptyValues,
      units: 'currency'
    },

    // NET INCOME
    {
      id: 'net-income',
      category: 'revenue',
      label: 'Net Income Before Taxes',
      level: 0,
      isTotal: true,
      isCalculated: true,
      isEditable: false,
      formula: 'operating-income + total-other',
      values: emptyValues,
      units: 'currency'
    }
  ];
};

export const FinancialSpreadsheetEntry: React.FC<SpreadsheetProps> = ({
  years = ['2021', '2022', '2023', '2024', '2025'],
  onDataChange,
  initialData,
  readOnly = false
}) => {
  const [data, setData] = useState<FinancialLineItem[]>(() => 
    initialData || createDefaultPLStructure(years)
  );
  const [selectedCell, setSelectedCell] = useState<{ itemId: string; year: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ itemId: string; year: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate formulas and update dependent cells
  const calculateFormulas = useCallback((updatedData: FinancialLineItem[]) => {
    const dataMap = new Map(updatedData.map(item => [item.id, item]));
    
    const calculateValue = (formula: string, year: string): number => {
      // Handle SUM formulas like "SUM(botox-dysport:other-services)"
      if (formula.startsWith('SUM(') && formula.endsWith(')')) {
        const range = formula.slice(4, -1);
        const [start, end] = range.split(':');
        
        const startIndex = updatedData.findIndex(item => item.id === start);
        const endIndex = updatedData.findIndex(item => item.id === end);
        
        if (startIndex !== -1 && endIndex !== -1) {
          return updatedData
            .slice(startIndex, endIndex + 1)
            .filter(item => item.isEditable && !item.isCalculated)
            .reduce((sum, item) => sum + (item.values[year] || 0), 0);
        }
      }
      
      // Handle simple arithmetic like "total-revenue - total-cogs"
      if (formula.includes(' - ') || formula.includes(' + ')) {
        const operators = formula.split(/\s+/);
        let result = 0;
        let currentOperator = '+';
        
        for (let i = 0; i < operators.length; i++) {
          const token = operators[i];
          if (token === '+' || token === '-') {
            currentOperator = token;
          } else {
            const item = dataMap.get(token);
            const value = item?.values[year] || 0;
            if (currentOperator === '+') {
              result += value;
            } else {
              result -= value;
            }
          }
        }
        return result;
      }
      
      return 0;
    };

    // Update calculated fields
    const newData = updatedData.map(item => {
      if (item.isCalculated && item.formula) {
        const newValues = { ...item.values };
        years.forEach(year => {
          newValues[year] = calculateValue(item.formula!, year);
        });
        return { ...item, values: newValues };
      }
      return item;
    });

    return newData;
  }, [years]);

  // Handle cell value changes
  const handleCellChange = useCallback((itemId: string, year: string, value: number) => {
    const updatedData = data.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          values: { ...item.values, [year]: value }
        };
      }
      return item;
    });

    const calculatedData = calculateFormulas(updatedData);
    setData(calculatedData);
    onDataChange?.(calculatedData);
  }, [data, calculateFormulas, onDataChange]);

  // Handle cell editing
  const handleCellClick = (itemId: string, year: string, isEditable: boolean) => {
    if (readOnly || !isEditable) return;
    
    setSelectedCell({ itemId, year });
    setEditingCell({ itemId, year });
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, itemId: string, year: string) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
      // Move to next row
      const currentIndex = data.findIndex(item => item.id === itemId);
      const nextEditableIndex = data.findIndex((item, index) => 
        index > currentIndex && item.isEditable
      );
      if (nextEditableIndex !== -1) {
        setSelectedCell({ itemId: data[nextEditableIndex].id, year });
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const yearIndex = years.indexOf(year);
      const nextYear = e.shiftKey ? years[yearIndex - 1] : years[yearIndex + 1];
      if (nextYear) {
        setSelectedCell({ itemId, year: nextYear });
        setEditingCell({ itemId, year: nextYear });
      }
    }
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get row styling based on type
  const getRowStyling = (item: FinancialLineItem) => {
    if (item.isTotal) {
      return 'bg-blue-50 border-t-2 border-blue-200 font-semibold';
    }
    if (item.isSubtotal) {
      return 'bg-slate-100 font-medium';
    }
    if (item.level === 1) {
      return 'bg-white hover:bg-slate-50';
    }
    return 'bg-white';
  };

  // Get cell styling
  const getCellStyling = (item: FinancialLineItem, year: string, isSelected: boolean) => {
    let classes = 'px-3 py-2 text-right border-r border-slate-200 ';
    
    if (item.isEditable && !readOnly) {
      classes += 'cursor-pointer hover:bg-blue-50 ';
    }
    
    if (isSelected) {
      classes += 'ring-2 ring-blue-500 bg-blue-100 ';
    }
    
    if (item.isCalculated) {
      classes += 'bg-slate-50 text-slate-700 font-mono ';
    } else {
      classes += 'font-mono ';
    }

    return classes;
  };

  // Add new line item
  const addLineItem = (afterId: string, category: FinancialLineItem['category']) => {
    const afterIndex = data.findIndex(item => item.id === afterId);
    const emptyValues = years.reduce((acc, year) => ({ ...acc, [year]: 0 }), {});
    
    const newItem: FinancialLineItem = {
      id: `custom-${Date.now()}`,
      category,
      label: 'New Line Item',
      level: 1,
      isEditable: true,
      values: emptyValues,
      units: 'currency'
    };

    const newData = [
      ...data.slice(0, afterIndex + 1),
      newItem,
      ...data.slice(afterIndex + 1)
    ];

    setData(newData);
    onDataChange?.(newData);
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  return (
    <div className="card-executive space-component">
      <div className="mb-6">
        <h2 className="content-section-title">Financial Data Entry</h2>
        <p className="content-body text-slate-600">
          Enter your multi-year P&L data. Click any cell to edit, use Tab to navigate horizontally, Enter to move down.
        </p>
      </div>

      <div className="overflow-x-auto shadow-lg rounded-xl border border-slate-200">
        <table className="table-financial min-w-full">
          <thead className="table-header">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 bg-slate-100 border-r border-slate-200 min-w-[300px]">
                Line Item
              </th>
              {years.map(year => (
                <th key={year} className="px-3 py-3 text-center text-sm font-semibold text-slate-900 bg-slate-100 border-r border-slate-200 min-w-[120px]">
                  {year}
                </th>
              ))}
              <th className="px-3 py-3 text-center text-sm font-semibold text-slate-900 bg-slate-100 w-12">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((item, index) => (
              <tr key={item.id} className={`table-row-hover ${getRowStyling(item)}`}>
                <td className="px-4 py-2 border-r border-slate-200">
                  <div className={`flex items-center ${item.level === 1 ? 'ml-4' : item.level === 2 ? 'ml-8' : ''}`}>
                    <span className={`${item.isTotal || item.isSubtotal ? 'font-semibold' : ''} ${item.isCalculated ? 'text-slate-700' : ''}`}>
                      {item.label}
                    </span>
                    {item.isCalculated && (
                      <span className="ml-2 text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                        Auto
                      </span>
                    )}
                  </div>
                </td>
                {years.map(year => (
                  <td
                    key={year}
                    className={getCellStyling(
                      item,
                      year,
                      selectedCell?.itemId === item.id && selectedCell?.year === year
                    )}
                    onClick={() => handleCellClick(item.id, year, item.isEditable || false)}
                  >
                    {editingCell?.itemId === item.id && editingCell?.year === year ? (
                      <input
                        ref={inputRef}
                        type="number"
                        className="w-full bg-transparent border-none outline-none text-right font-mono"
                        defaultValue={item.values[year] || 0}
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          handleCellChange(item.id, year, value);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => handleCellKeyDown(e, item.id, year)}
                      />
                    ) : (
                      <span className={`${item.isTotal ? 'font-semibold' : ''}`}>
                        {formatCurrency(item.values[year] || 0)}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2 text-center">
                  {!item.isCalculated && !item.isSubtotal && !item.isTotal && (
                    <button
                      onClick={() => addLineItem(item.id, item.category)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Add line below"
                    >
                      +
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {['total-revenue', 'operating-income', 'net-income'].map(itemId => {
          const item = data.find(i => i.id === itemId);
          if (!item) return null;
          
          const latestYear = years[years.length - 1];
          const latestValue = item.values[latestYear] || 0;
          
          return (
            <div key={itemId} className="card-metric-primary">
              <div className="financial-caption mb-2">{item.label}</div>
              <div className="financial-primary text-blue-600 mb-1">
                {formatCurrency(latestValue)}
              </div>
              <div className="financial-caption text-slate-500">
                {latestYear} (Latest Year)
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Spreadsheet Controls:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>Click</strong> any editable cell to start entering data</p>
          <p>• <strong>Tab/Shift+Tab</strong> to move horizontally between years</p>
          <p>• <strong>Enter</strong> to move to the next editable row</p>
          <p>• <strong>Escape</strong> to cancel editing</p>
          <p>• <strong>+</strong> button to add new line items</p>
          <p>• Calculated fields (marked &quot;Auto&quot;) update automatically</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialSpreadsheetEntry; 