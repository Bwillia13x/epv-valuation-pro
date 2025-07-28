import React, { useState, useMemo } from 'react';

// Type definitions for the enhanced data table
export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  conditionalFormatting?: {
    positive?: string;
    negative?: string;
    neutral?: string;
    threshold?: number;
  };
}

export interface TableRow {
  id: string;
  [key: string]: any;
}

export interface ExportOptions {
  csv?: boolean;
  excel?: boolean;
  pdf?: boolean;
}

export interface EnhancedDataTableProps {
  columns: TableColumn[];
  data: TableRow[];
  title?: string;
  description?: string;
  exportOptions?: ExportOptions;
  onExport?: (format: 'csv' | 'excel' | 'pdf', data: TableRow[]) => void;
  theme?: 'light' | 'dark';
  className?: string;
  pageSize?: number;
  showPagination?: boolean;
  showSearch?: boolean;
  highlightRows?: string[];
  onRowClick?: (row: TableRow) => void;
}

type SortDirection = 'asc' | 'desc' | null;

// Utility functions
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const formatPercentage = (value: number) =>
  `${(value * 100).toFixed(1)}%`;

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString();
};

const formatValue = (value: any, type: TableColumn['type'], customFormat?: (value: any) => string) => {
  if (customFormat) return customFormat(value);
  if (value == null) return '-';

  switch (type) {
    case 'currency':
      return formatCurrency(Number(value));
    case 'percentage':
      return formatPercentage(Number(value));
    case 'number':
      return formatNumber(Number(value));
    case 'date':
      return formatDate(value);
    default:
      return String(value);
  }
};

const exportToCSV = (data: TableRow[], columns: TableColumn[], filename: string) => {
  const headers = columns.map(col => col.label).join(',');
  const rows = data.map(row =>
    columns.map(col => {
      let value = row[col.key];
      if (value == null) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return String(value);
    }).join(',')
  );

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const EnhancedDataTable: React.FC<EnhancedDataTableProps> = ({
  columns,
  data,
  title,
  description,
  exportOptions = { csv: true },
  onExport,
  theme = 'light',
  className = '',
  pageSize = 25,
  showPagination = true,
  showSearch = true,
  highlightRows = [],
  onRowClick,
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;

      const column = columns.find(col => col.key === sortColumn);
      
      if (column?.type === 'number' || column?.type === 'currency' || column?.type === 'percentage') {
        const numA = Number(aValue);
        const numB = Number(bValue);
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      if (column?.type === 'date') {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortDirection === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      }

      const strA = String(aValue).toLowerCase();
      const strB = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return strA < strB ? -1 : strA > strB ? 1 : 0;
      } else {
        return strA > strB ? -1 : strA < strB ? 1 : 0;
      }
    });
  }, [data, sortColumn, sortDirection, columns]);

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;
    
    return sortedData.filter(row =>
      columns.some(column => {
        const value = row[column.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [sortedData, searchTerm, columns]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (onExport) {
      onExport(format, filteredData);
    } else if (format === 'csv') {
      const filename = title ? title.replace(/\s+/g, '_').toLowerCase() : 'table_export';
      exportToCSV(filteredData, columns, filename);
    }
  };

  const getCellContent = (row: TableRow, column: TableColumn) => {
    const value = row[column.key];
    const formattedValue = formatValue(value, column.type, column.format);
    
    if (!column.conditionalFormatting) return formattedValue;

    const { positive, negative, neutral, threshold = 0 } = column.conditionalFormatting;
    let className = '';

    if (column.type === 'number' || column.type === 'currency' || column.type === 'percentage') {
      const numValue = Number(value);
      if (numValue > threshold && positive) {
        className = positive;
      } else if (numValue < threshold && negative) {
        className = negative;
      } else if (neutral) {
        className = neutral;
      }
    }

    return (
      <span className={className}>
        {formattedValue}
      </span>
    );
  };

  const tableClasses = `w-full border-collapse ${
    theme === 'dark' 
      ? 'bg-slate-800 text-white' 
      : 'bg-white text-gray-900'
  }`;

  const headerClasses = `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider border-b ${
    theme === 'dark'
      ? 'bg-slate-700 text-slate-300 border-slate-600'
      : 'bg-gray-50 text-gray-500 border-gray-200'
  }`;

  const cellClasses = `px-6 py-4 whitespace-nowrap text-sm border-b ${
    theme === 'dark'
      ? 'border-slate-600'
      : 'border-gray-200'
  }`;

  const containerClasses = `${className} rounded-lg border ${
    theme === 'dark' 
      ? 'border-slate-700 bg-slate-800' 
      : 'border-gray-200 bg-white'
  } shadow-sm overflow-hidden`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      {(title || description || showSearch || exportOptions) && (
        <div className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold">{title}</h3>
              )}
              {description && (
                <p className={`mt-1 text-sm ${
                  theme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  {description}
                </p>
              )}
            </div>
            
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-4">
              {/* Search */}
              {showSearch && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`px-3 py-2 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Export Options */}
              {(exportOptions?.csv || exportOptions?.excel || exportOptions?.pdf) && (
                <div className="flex space-x-2">
                  {exportOptions.csv && (
                    <button
                      onClick={() => handleExport('csv')}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Export CSV
                    </button>
                  )}
                  {exportOptions.excel && (
                    <button
                      onClick={() => handleExport('excel')}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Export Excel
                    </button>
                  )}
                  {exportOptions.pdf && (
                    <button
                      onClick={() => handleExport('pdf')}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Export PDF
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className={tableClasses}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${headerClasses} ${column.sortable ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
                  style={{ width: column.width, textAlign: column.align || 'left' }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="flex flex-col">
                        <svg
                          className={`w-3 h-3 ${
                            sortColumn === column.key && sortDirection === 'asc' 
                              ? 'text-blue-500' 
                              : 'text-gray-400'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                        </svg>
                        <svg
                          className={`w-3 h-3 -mt-1 ${
                            sortColumn === column.key && sortDirection === 'desc'
                              ? 'text-blue-500'
                              : 'text-gray-400'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={row.id}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${
                  highlightRows.includes(row.id)
                    ? theme === 'dark'
                      ? 'bg-blue-900/20'
                      : 'bg-blue-50'
                    : theme === 'dark'
                    ? 'hover:bg-slate-700'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cellClasses}
                    style={{ textAlign: column.align || 'left' }}
                  >
                    {getCellContent(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className={`px-6 py-3 border-t flex items-center justify-between ${
          theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-slate-400' : 'text-gray-700'
          }`}>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 text-sm rounded border transition-colors ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : theme === 'dark'
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            <span className={`px-3 py-1 text-sm ${
              theme === 'dark' ? 'text-slate-300' : 'text-gray-700'
            }`}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 text-sm rounded border transition-colors ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : theme === 'dark'
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDataTable;