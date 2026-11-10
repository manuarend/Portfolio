import React from 'react';
import { LayoutDashboard, PieChart, ShoppingBag, MapPin, Layers, Settings, Filter, Radio } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenFilter }) {
  const menuItems = [
    { id: 'tab-1', title: '1. Visão Geral de KPIs', icon: LayoutDashboard },
    { id: 'tab-2', title: '2. Matriz Linhas & Produtos (Rede vs Digital)', icon: Layers },
    { id: 'tab-3', title: '3. Top Produtos & Rankings', icon: ShoppingBag },
    { id: 'tab-4', title: '4. Cidades & Regiões', icon: MapPin },
    { id: 'tab-5', title: '5. Desempenho por Canal', icon: PieChart },
    { id: 'tab-live', title: '6. Mês Atual · Ao Vivo (Qlik)', icon: Radio, isLive: true },
  ];

  return (
    <aside className="w-16 md:w-20 bg-slate-900 border-r border-slate-800 dark:bg-slate-950 dark:border-slate-900 flex flex-col items-center py-5 shrink-0 z-20">
      
      {/* Sidebar Logo */}
      <div className="mb-8 cursor-pointer hover:opacity-90 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 p-0.5 shadow-md flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <span className="font-extrabold text-white text-base tracking-tighter font-['Montserrat']">SJ</span>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-3 w-full px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.title}
              className={`w-full h-12 rounded-xl flex items-center justify-center transition-all relative ${
                isActive
                  ? item.isLive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                    : 'bg-red-600 text-white shadow-md shadow-red-900/30'
                  : item.isLive
                    ? 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 dark:hover:bg-slate-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.isLive && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Filter Shortcut */}
      <div className="px-2 w-full mt-auto">
        <button
          onClick={onOpenFilter}
          title="Filtros do Painel JBP"
          className="w-full h-12 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700/60"
        >
          <Filter className="w-5 h-5 text-red-500" />
        </button>
      </div>

    </aside>
  );
}
