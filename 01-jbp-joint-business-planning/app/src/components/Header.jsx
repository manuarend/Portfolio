import React from 'react';
import { Calendar, Building2, Sun, Moon, Filter, ChevronRight } from 'lucide-react';

export default function Header({ 
  selectedSupplier, 
  selectedPeriodLabel, 
  selectedChannelLabel, 
  onOpenFilter, 
  darkMode, 
  setDarkMode 
}) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-colors shadow-sm">
      
      {/* Left: Logo & Titles with CRM - V4 Divider */}
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-montserrat font-extrabold text-2xl tracking-tighter text-red-600 dark:text-red-500">
              Nexus Varejo
            </span>
          </div>

          {/* CRM - V4 Header Titles Divider */}
          <div className="border-l border-slate-300 dark:border-slate-700 pl-4 ml-2 flex flex-col">
            <h1 className="font-montserrat font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-2">
              Painel Digital JBP <span className="text-slate-400 font-normal">|</span> <span className="text-slate-800 dark:text-slate-200">{selectedSupplier}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Joint Business Plan — Gestão Digital & Multicanal
            </p>
          </div>
        </div>
      </div>

      {/* Right: Badges & Actions */}
      <div className="flex items-center gap-3">
        
        {/* VTEX / JBP Badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-montserrat font-bold uppercase tracking-wider shadow-sm">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          JBP 2026
        </span>

        {/* Channel Badge */}
        <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium">
          Canal: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{selectedChannelLabel}</strong>
        </span>

        {/* Filter Button */}
        <button
          onClick={onOpenFilter}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-full transition-all shadow-xs"
        >
          <Filter className="w-3.5 h-3.5 text-red-600" />
          <span>Filtros</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full transition-colors"
          title="Alternar Tema Claro/Escuro"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>

    </header>
  );
}

