import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const MainLayout = ({ children, activeView, onViewChange, onLogout, userEmail }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar 
        activeView={activeView} 
        onViewChange={onViewChange}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onLogout={onLogout}
      />
      
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} ml-0 pb-0`}
      >
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg md:hidden"
            >
              <Menu size={24} />
            </button>
            
          </div>

          <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dr. Admin</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail || 'admin@odontokaren.com'}</p>
              </div>
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-800/30 rounded-full flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold border-2 border-white dark:border-slate-800 shadow-sm">
                DA
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <div className="w-full mx-auto animate-in fade-in duration-300 slide-in-from-bottom-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
