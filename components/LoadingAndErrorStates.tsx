import React from 'react';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    primary: 'border-t-blue-600',
    secondary: 'border-t-gray-600',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-2 border-gray-300 ${colorClasses[color]} rounded-full loading-spinner`}
    />
  );
};

interface LoadingDotsProps {
  color?: 'primary' | 'secondary';
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  color = 'primary',
}) => {
  const colorClass = color === 'primary' ? 'bg-blue-600' : 'bg-gray-400';

  return (
    <div className="loading-dots">
      <div className={`loading-dot ${colorClass}`} />
      <div className={`loading-dot ${colorClass}`} />
      <div className={`loading-dot ${colorClass}`} />
    </div>
  );
};

interface SkeletonProps {
  variant?: 'text' | 'avatar' | 'rectangular';
  width?: string;
  height?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
}) => {
  const baseClasses = {
    text: 'skeleton-text',
    avatar: 'skeleton-avatar',
    rectangular: 'skeleton',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div className={`${baseClasses[variant]} ${className}`} style={style} />
  );
};

interface ErrorStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="error-state">
      {icon || (
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-400" />
      )}
      <div className="error-title">{title}</div>
      <div className="error-message">{message}</div>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="empty-state">
      {icon || <InformationCircleIcon className="empty-state-icon" />}
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-message">{message}</div>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

interface LoadingCardProps {
  title?: string;
  lines?: number;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Loading...',
  lines = 3,
}) => {
  return (
    <div className="card-primary">
      <div className="flex items-center space-x-3 mb-4">
        <LoadingSpinner size="sm" />
        <div className="metric-secondary text-gray-500">{title}</div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton
            key={index}
            variant="text"
            width={index === lines - 1 ? '60%' : '100%'}
          />
        ))}
      </div>
    </div>
  );
};

interface LoadingTableProps {
  rows?: number;
  columns?: number;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      <table className="table-professional">
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, index) => (
              <th key={index} className="table-header">
                <Skeleton variant="text" width="80px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <td key={colIndex} className="table-cell">
                  <Skeleton
                    variant="text"
                    width={colIndex === 0 ? '120px' : '80px'}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const typeClasses = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info',
  };

  return (
    <div className={`toast ${typeClasses[type]}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-medium text-gray-900">{title}</div>
          {message && (
            <div className="text-sm text-gray-600 mt-1">{message}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface ProgressBarProps {
  percentage: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  showPercentage = true,
  color = 'primary',
}) => {
  const colorClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-500">{percentage}%</span>
          )}
        </div>
      )}
      <div className="progress-container">
        <div
          className={`progress-bar ${colorClasses[color]}`}
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
        />
      </div>
    </div>
  );
};
