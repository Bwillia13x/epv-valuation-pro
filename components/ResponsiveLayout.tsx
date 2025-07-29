import React, { useState, useEffect } from 'react';
import SidebarNavigation from './SidebarNavigation';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onNavigate: (section: string) => void;
  theme?: 'light' | 'dark';
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  activeSection,
  onNavigate,
  theme = 'light',
  className = '',
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse sidebar on mobile
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const layoutClasses = `min-h-screen flex ${
    theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'
  } ${className}`;

  const mainContentClasses = `
    flex-1 flex flex-col min-w-0
    ${isMobile && !sidebarCollapsed ? 'hidden' : ''}
    transition-all duration-300 ease-in-out
  `;

  const contentAreaClasses = `
    flex-1 overflow-auto
    ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}
  `;

  // Mobile overlay for sidebar
  const showMobileOverlay = isMobile && !sidebarCollapsed;

  return (
    <div className={layoutClasses}>
      {/* Mobile Overlay */}
      {showMobileOverlay && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleToggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        ${isMobile ? 'fixed' : 'relative'}
        ${isMobile ? 'z-50' : 'z-10'}
        ${isMobile && sidebarCollapsed ? 'transform -translate-x-full' : ''}
        transition-transform duration-300 ease-in-out
        h-screen
      `}
      >
        <SidebarNavigation
          activeSection={activeSection}
          onNavigate={(section) => {
            onNavigate(section);
            // Auto-close sidebar on mobile after navigation
            if (isMobile) {
              setSidebarCollapsed(true);
            }
          }}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          theme={theme}
          className="h-full"
        />
      </div>

      {/* Main Content Area */}
      <div className={mainContentClasses}>
        {/* Top Bar for Mobile */}
        {isMobile && sidebarCollapsed && (
          <div
            className={`
            flex items-center justify-between px-4 py-3 border-b
            ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            }
          `}
          >
            <button
              onClick={handleToggleSidebar}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Open navigation menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">EPV Valuation Pro</h1>
            <div className="w-10" /> {/* Spacer for center alignment */}
          </div>
        )}

        {/* Content Area */}
        <main className={contentAreaClasses}>{children}</main>
      </div>
    </div>
  );
};

export default ResponsiveLayout;
