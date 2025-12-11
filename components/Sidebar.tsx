import React from 'react';
import { LayoutDashboard, Users, Calendar, CreditCard, FileText, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registration', label: 'Registration (SA3)', icon: Users },
    { id: 'scheduling', label: 'Scheduling (SA4)', icon: Calendar },
    { id: 'records', label: 'Medical Records (SA1)', icon: FileText },
    { id: 'billing', label: 'Billing (SA2)', icon: CreditCard },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen flex-shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-medical-500 p-2 rounded-lg">
          <Activity size={24} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">ICAM</h1>
          <p className="text-xs text-slate-400">Orchestrator</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-medical-600 text-white shadow-lg'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-semibold text-green-400">Online: Gemini 2.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
