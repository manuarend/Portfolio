import React, { useState } from 'react';
import { BarChart3, Table as TableIcon, Download } from 'lucide-react';
import { exportToCSV } from '../utils/csvExporter';

export default function ViewToggleBlock({
  title,
  subtitle,
  exportFilename = 'relatorio_jbp',
  tableHeaders = [],
  tableRows = [],
  chartComponent,
  customTableComponent,
  defaultView = 'chart',
  headerControls
}) {
  const [viewMode, setViewMode] = useState(defaultView);

  const handleExportCSV = () => {
    exportToCSV(exportFilename, tableRows, tableHeaders);
  };

  return (
    <div className="crm-card p-5 sm:p-6 shadow-sm transition-all">
      
      {/* Header matching CRM - V4 progressao-header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-montserrat font-bold text-xs sm:text-sm uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Dual View Toggle Buttons & Header Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {headerControls}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-montserrat font-semibold">
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'chart' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráfico</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Planilha</span>
            </button>
          </div>

          {/* Export CSV Button */}
          {viewMode === 'table' && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-montserrat font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800/60 rounded-xl transition-colors shadow-xs"
              title="Baixar Planilha em CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Block Body Content */}
      <div className="min-h-[320px] flex flex-col justify-center">
        {viewMode === 'chart' ? (
          chartComponent
        ) : (
          customTableComponent ? customTableComponent : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900 font-montserrat font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    {tableHeaders.map((h) => (
                      <th key={h.key} className="px-4 py-3">
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {tableRows && tableRows.length > 0 ? (
                    tableRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors">
                        {tableHeaders.map((h) => (
                          <td key={h.key} className="px-4 py-3 font-medium">
                            {row[h.key]}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={tableHeaders.length || 1} className="px-4 py-8 text-center text-slate-400">
                        Nenhum registro encontrado para a planilha.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

    </div>
  );
}
