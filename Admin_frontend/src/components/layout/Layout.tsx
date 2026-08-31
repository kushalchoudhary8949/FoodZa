import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Header } from './Header';
import { TimeoutAlertBanner } from '../intervention/TimeoutAlertBanner';
import { InterventionModal } from '../intervention/InterventionModal';
import { ToastContainer } from '../common/Toast';

interface LayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, onSelectTab, children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Urgent Intervention Banner */}
        <TimeoutAlertBanner />

        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          onSelectTab={onSelectTab}
        />

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>

      {/* Intervention Dialog */}
      <InterventionModal />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};
