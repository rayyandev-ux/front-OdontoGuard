import React from 'react';
import { 
  Users, 
  Calendar, 
  Settings, 
  LayoutDashboard, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  DollarSign,
  Clock
} from 'lucide-react';

const Sidebar = ({ activeView, onViewChange, isOpen, setIsOpen, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Pacientes', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'services', label: 'Servicios', icon: DollarSign },
    { id: 'reminders', label: 'Recordatorios', icon: Clock },
    { id: 'reminders-config', label: 'Configuración', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen md:h-screen h-[100dvh] fixed left-0 top-0 z-40
          transition-all duration-300 ease-in-out flex-col
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}
          flex
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-slate-100 dark:border-slate-800 relative">
          <div className="flex items-center gap-3 text-teal-600 font-bold text-xl overflow-hidden whitespace-nowrap px-4">
            <div className="bg-teal-50 dark:bg-teal-900/30 p-2 rounded-lg flex-shrink-0">
              <Stethoscope size={24} className="text-teal-600 dark:text-white" />
            </div>
            <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 hidden md:block'} dark:text-white`}>
              OdontoKaren
            </span>
          </div>
          
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -right-3 top-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-sm text-slate-500 dark:text-slate-200 hover:text-teal-600 transition-colors hidden md:block"
          >
            {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          <button 
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-5 text-slate-400 hover:text-slate-600 md:hidden"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onViewChange(item.id); setIsOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                ${activeView === item.id 
                  ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-white font-medium shadow-sm' 
                  : 'text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <item.icon 
                size={20} 
                className={`flex-shrink-0 ${activeView === item.id ? 'text-teal-600 dark:text-white' : 'text-slate-400 dark:text-slate-300 group-hover:text-slate-600 dark:group-hover:text-white'}`} 
              />
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden md:block'}`}>
                {item.label}
              </span>
              
              {activeView === item.id && isOpen && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />
              )}
            </button>
          ))}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-3 rounded-xl
              text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
            `}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden md:block'}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
