import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart, Zap, PieChart, Receipt } from 'lucide-react';

export default function KpiCard({
  title,
  value,
  variation,
  subtext,
  iconType,
  variant = 'simple', // 'solid' | 'solid-red' | 'solid-blue' | 'simple' | 'triple-metric'
  progressPct,
  secondaryMetric, // { value: string, label: string }
  metricsList // [{ label, value, subtext, variation, isHighlight }]
}) {
  const isPositive = variation >= 0;

  const renderIcon = (props = {}) => {
    const cls = props.className || "w-16 h-16";
    switch (iconType) {
      case 'revenue': return <DollarSign className={cls} />;
      case 'qty': return <Package className={cls} />;
      case 'ticket': return <ShoppingCart className={cls} />;
      case 'receipt': return <Receipt className={cls} />;
      case 'incremental': return <Zap className={cls} />;
      case 'share': return <PieChart className={cls} />;
      default: return <DollarSign className={cls} />;
    }
  };

  // SOLID CARD (CRM - V4 Style: kpi-card-solid-blue / kpi-card-solid-green)
  if (variant.startsWith('solid')) {
    let bgGradient = "from-[#00A650] to-[#008741]";
    if (variant === 'solid-red') bgGradient = "from-[#E30613] to-[#B8050F]";
    if (variant === 'solid-blue') bgGradient = "from-[#007BFF] to-[#0056B3]";
    if (variant === 'solid-lime') bgGradient = "from-[#82C91E] to-[#68A613]";

    return (
      <div className={`relative bg-gradient-to-br ${bgGradient} rounded-xl p-3 text-white shadow-lg overflow-hidden flex flex-col h-full w-full group transition-transform hover:-translate-y-0.5`}>
        {/* Background Icon Overlay */}
        <div className="absolute -right-3 -bottom-3 opacity-15 pointer-events-none transition-transform group-hover:scale-110">
          {renderIcon()}
        </div>

        {/* Top Zone: Label (Fixed Height) */}
        <div className="h-5 mb-1.5 flex items-center">
          <span className="font-montserrat font-bold text-[11px] uppercase tracking-wider text-white/90">
            {title}
          </span>
        </div>

        {/* Middle Zone: Strict Heights for perfect alignment */}
        <div className="flex-1 flex flex-col">
          {/* Sub-label Zone (Empty for solid cards) */}
          <div className="h-3.5 mb-0.5"></div>

          {/* Number Zone */}
          <div className="h-9 flex items-end">
            <h3 className="font-montserrat font-bold text-2xl sm:text-3xl tracking-tight text-white leading-none">
              {value}
            </h3>
          </div>

          {/* Addons Zone */}
          <div className="h-5 mt-0.5 flex items-start">
            {secondaryMetric && (
              <div className="flex items-center gap-1.5 text-white/90 font-medium text-sm">
                <span className="text-white/70 text-xs">{secondaryMetric.label}:</span>
                <span>{secondaryMetric.value}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Zone: Footer (Fixed Height) */}
        <div className="h-6 flex items-center justify-between text-xs font-medium border-t border-white/20 pt-1 mt-auto">
          <span className="text-white/90">{subtext}</span>
          {variation !== undefined && variation !== null && (
            <span className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded-full font-bold leading-none text-[10px]">
              {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {isPositive ? `+${variation.toFixed(1)}%` : `${variation.toFixed(1)}%`}
            </span>
          )}
        </div>
      </div>
    );
  }

  // TRIPLE METRIC CARD (Destaque Ticket Médio + Pedidos/Cupons + Itens Vendidos)
  if (variant === 'triple-metric' && metricsList && metricsList.length > 0) {
    return (
      <div className="crm-card crm-card-hover p-2.5 flex flex-col h-full w-full justify-between">
        {/* Top Zone: Title & Icon */}
        <div className="h-4 mb-1 flex items-center justify-between">
          <span className="font-montserrat font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="text-amber-500 dark:text-amber-400 opacity-80">
            {renderIcon({ className: "w-3.5 h-3.5" })}
          </div>
        </div>

        {/* 3 Metric Rows */}
        <div className="flex-1 flex flex-col justify-center gap-1">
          {metricsList.map((item, idx) => {
            const isPos = item.variation >= 0;
            if (item.isHighlight) {
              // Hero Row (Ticket Médio com grande destaque mas compacto)
              return (
                <div 
                  key={idx}
                  className="bg-gradient-to-r from-amber-50/80 to-emerald-50/50 dark:from-amber-950/30 dark:to-emerald-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-lg px-2 py-1 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 leading-none">
                      {item.label}
                    </span>
                    <span className="font-montserrat font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white leading-tight mt-0.5">
                      {item.value}
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    {item.variation !== undefined && item.variation !== null && (
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold text-[9px] leading-none mb-0.5 ${
                        isPos 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                      }`}>
                        {isPos ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                        {isPos ? `+${item.variation.toFixed(1)}%` : `${item.variation.toFixed(1)}%`}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                      {item.subtext}
                    </span>
                  </div>
                </div>
              );
            }

            // Secondary Rows (Pedidos e Itens Vendidos) - Bem compactas e sem corte de texto
            return (
              <div 
                key={idx}
                className="flex items-center justify-between px-1 py-0.5 border-t border-slate-100 dark:border-slate-800/60 text-[10px]"
              >
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {item.label}:
                  </span>
                  <span className="font-montserrat font-bold text-[10.5px] text-slate-900 dark:text-white whitespace-nowrap">
                    {item.value}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-right">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 hidden sm:inline whitespace-nowrap">
                    {item.subtext}
                  </span>
                  {item.variation !== undefined && item.variation !== null && (
                    <span className={`inline-flex items-center gap-0.5 font-bold text-[9px] leading-none ${
                      isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isPos ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                      {isPos ? `+${item.variation.toFixed(1)}%` : `${item.variation.toFixed(1)}%`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // SIMPLE CARD (CRM - V4 Style: kpi-card-simple)
  return (
    <div className="crm-card crm-card-hover p-3 flex flex-col h-full w-full">
      
      {/* Top Zone: Label (Fixed Height) */}
      <div className="h-5 mb-1.5 flex items-center justify-between">
        <span className="font-montserrat font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="text-emerald-600 dark:text-emerald-400 opacity-60">
          {React.cloneElement(renderIcon(), { className: "w-4 h-4" })}
        </div>
      </div>

      {/* Middle Zone: Strict Heights */}
      <div className="flex-1 flex flex-col">
        {secondaryMetric ? (
          <div className="grid grid-cols-2 gap-2">
            <div 
              className="flex flex-col h-full bg-slate-50 dark:bg-slate-800/60 rounded-xl px-2 py-1 cursor-help"
              title="Market Share: Percentual de venda do item filtrado em relação à venda total da farmácia neste canal."
            >
              <div className="h-3.5 mb-0.5 flex items-end">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide leading-none truncate">
                  {subtext}
                </span>
              </div>
              <div className="h-9 flex items-end">
                <span className="font-montserrat font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white leading-none">
                  {value}
                </span>
              </div>
              <div className="h-5 mt-0.5 flex items-start w-full">
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, progressPct ?? 0))}%` }}
                  />
                </div>
              </div>
            </div>

            <div 
              className="flex flex-col h-full bg-emerald-50 dark:bg-emerald-950/40 rounded-xl px-2 py-1 border border-emerald-100 dark:border-emerald-900/50 cursor-help"
              title="Penetração: Quanto este canal representa das vendas totais do próprio item que está filtrado."
            >
              <div className="h-3.5 mb-0.5 flex items-end">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wide leading-none truncate">
                  {secondaryMetric.label}
                </span>
              </div>
              <div className="h-9 flex items-end">
                <span className="font-montserrat font-bold text-2xl sm:text-3xl tracking-tight text-emerald-700 dark:text-emerald-300 leading-none">
                  {secondaryMetric.value}
                </span>
              </div>
              <div className="h-5 mt-0.5 flex items-start w-full">
                <div className="w-full bg-emerald-100 dark:bg-emerald-900/40 h-1.5 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, parseFloat(secondaryMetric.value) || 0))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="h-3.5 mb-0.5"></div>
            <div className="h-9 flex items-end">
              <h3 className="font-montserrat font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white leading-none">
                {value}
              </h3>
            </div>
            <div className="h-5 mt-0.5 flex items-start w-full">
              {progressPct !== undefined && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Zone: Footer (Fixed Height) */}
      <div className="h-6 flex items-center justify-between text-xs font-medium border-t border-slate-100 dark:border-slate-800 pt-1 mt-auto">
        {!secondaryMetric ? (
          <>
            <span className="text-slate-500 dark:text-slate-400 truncate">{subtext}</span>
            {variation !== undefined && variation !== null && (
              <span className={`inline-flex items-center gap-1 font-bold leading-none text-[10px] ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {isPositive ? `+${variation.toFixed(1)}%` : `${variation.toFixed(1)}%`}
              </span>
            )}
          </>
        ) : (
          /* Empty placeholder for alignment consistency */
          <span className="text-transparent">Placeholder</span>
        )}
      </div>
    </div>
  );
}
