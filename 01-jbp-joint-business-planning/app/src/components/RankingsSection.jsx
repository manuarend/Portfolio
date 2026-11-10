import React, { useState } from 'react';
import { 
  Trophy, TrendingUp, TrendingDown, MapPin, Layers, 
  Search, ArrowUpDown, Download 
} from 'lucide-react';
import ViewToggleBlock from './ViewToggleBlock';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend } from 'recharts';

export default function RankingsSection({ 
  topProducts = [], 
  growingProducts = [], 
  decliningProducts = [], 
  topCities = [], 
  topCategories = [],
  periodLabel = '',
  selectedPeriod = 'YTD',
  currentYear: propCurrentYear,
  previousYear: propPreviousYear,
  isLiveCities = false,
  isLiveLoading = false
}) {
  const [activeTab, setActiveTab] = useState('top10');
  const [searchFilter, setSearchFilter] = useState('');

  // Format currency helpers
  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatCompactBRL = (val) => {
    if (!val) return 'R$ 0';
    if (Math.abs(val) >= 1e6) return `R$ ${(val / 1e6).toFixed(1)}M`;
    if (Math.abs(val) >= 1e3) return `R$ ${(val / 1e3).toFixed(0)}k`;
    return `R$ ${val.toFixed(0)}`;
  };
  const formatNum = (val) => new Intl.NumberFormat('pt-BR').format(val || 0);

  // Filter lists based on search term
  const filterList = (list, key) => {
    if (!searchFilter.trim()) return list;
    const term = searchFilter.toLowerCase();
    return list.filter(item => {
      const val = String(item[key] || '').toLowerCase();
      const idVal = String(item.id || '').toLowerCase();
      const eanVal = String(item.ean || '').toLowerCase();
      return val.includes(term) || idVal.includes(term) || eanVal.includes(term);
    });
  };

  const yearsFromLabel = periodLabel ? periodLabel.match(/\b(20\d\d)\b/g) : null;
  const currentYear = propCurrentYear || (yearsFromLabel && yearsFromLabel[0]) || '2026';
  const previousYear = propPreviousYear || (yearsFromLabel && yearsFromLabel[1]) || String(parseInt(currentYear) - 1);

  const tabs = [
    { id: 'top10', label: 'Top 10 Produtos (Faturamento)', icon: Trophy, color: 'text-amber-400' },
    { id: 'growth', label: 'Maiores Δ (%)', icon: TrendingUp, color: 'text-emerald-400' },
    { id: 'decline', label: 'Maiores Quedas (%)', icon: TrendingDown, color: 'text-red-400' },
    { id: 'cities', label: 'Top Cidades', icon: MapPin, color: 'text-blue-400' },
    { id: 'categories', label: 'Top Linhas', icon: Layers, color: 'text-purple-400' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-slate-950 text-white border border-slate-700 shadow-md ring-1 ring-red-500/40' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar inside Tab Header — hidden on Top Linhas tab */}
        {activeTab !== 'categories' && (
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filtrar nesta visualização..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>
        )}
      </div>

      {/* Tab Content 1: Top 10 Produtos */}
      {activeTab === 'top10' && (
        <ViewToggleBlock
          title="Top 10 Produtos em Faturamento"
          subtitle={`Ranking por faturamento no período: ${periodLabel}`}
          exportFilename="top_10_produtos_faturamento"
          tableHeaders={[
            { key: 'rank', label: 'Posição' },
            { key: 'id', label: 'SKU / ID' },
            { key: 'name', label: 'Nome do Produto' },
            { key: 'grupo', label: 'Grupo' },
            { key: 'revenueCurrent', label: `Fat. ${currentYear}` },
            { key: 'revenueBase', label: `Fat. ${previousYear}` },
            { key: 'growthFormatted', label: 'Variação %' }
          ]}
          tableRows={filterList(topProducts.slice(0, 10), 'name').map((p, idx) => ({
            rank: `#${idx + 1}`,
            id: p.id,
            name: p.name,
            grupo: p.grupo,
            revenueCurrent: formatBRL(p.currentRev),
            revenueBase: formatBRL(p.baseRev),
            growthFormatted: p.baseRev > 0 
              ? <span className={p.growth >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{p.growth >= 0 ? '+' : ''}{p.growth.toFixed(1)}%</span>
              : <span className="text-slate-500">Novo</span>
          }))}
          chartComponent={
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts.slice(0, 10).map(p => ({
                    name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                    fullName: p.name,
                    fat2026: p.currentRev,
                    fat2025: p.baseRev
                  }))}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(val) => formatCompactBRL(val)} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={160} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
                    formatter={(value, name) => [formatBRL(value), name]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="fat2026" name={`${currentYear} (Atual)`} fill="#E30613" radius={[0, 4, 4, 0]}>
                    {topProducts.slice(0, 10).map((_, index) => (
                      <Cell key={`cell-26-${index}`} fill={index === 0 ? '#E30613' : index < 3 ? '#EF4444' : '#F87171'} />
                    ))}
                  </Bar>
                  <Bar dataKey="fat2025" name={`${previousYear} (Anterior)`} fill="#64748B" radius={[0, 4, 4, 0]} opacity={0.55} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />
      )}

      {/* Tab Content 2: Produtos Maior Crescimento */}
      {activeTab === 'growth' && (
        <ViewToggleBlock
          title="Produtos com Maior Δ (%)"
          subtitle={`Aceleração de faturamento — ${periodLabel}`}
          exportFilename="produtos_maior_crescimento"
          tableHeaders={[
            { key: 'id', label: 'SKU / ID' },
            { key: 'name', label: 'Nome do Produto' },
            { key: 'grupo', label: 'Grupo' },
            { key: 'growthFormatted', label: 'Δ %' },
            { key: 'revenueCurrent', label: `Fat. ${currentYear}` },
            { key: 'revenueBase', label: `Fat. ${previousYear}` }
          ]}
          tableRows={filterList(growingProducts, 'name').map(p => ({
            id: p.id,
            name: p.name,
            grupo: p.grupo,
            growthFormatted: <span className="text-emerald-400 font-bold">+{p.growth.toFixed(1)}%</span>,
            revenueCurrent: formatBRL(p.currentRev),
            revenueBase: formatBRL(p.baseRev)
          }))}
          chartComponent={
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={growingProducts.slice(0, 10).map(p => ({
                    name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                    fullName: p.name,
                    fat2026: p.currentRev,
                    fat2025: p.baseRev,
                    crescimento: p.growth
                  }))}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(val) => formatCompactBRL(val)} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={160} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
                    formatter={(value, name) => [formatBRL(value), name]}
                    labelFormatter={(label, payload) => {
                      const d = payload?.[0]?.payload;
                      return d ? `${d.fullName} (+${d.crescimento.toFixed(1)}%)` : label;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="fat2026" name={`${currentYear} (Atual)`} fill="#10B981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="fat2025" name={`${previousYear} (Anterior)`} fill="#64748B" radius={[0, 4, 4, 0]} opacity={0.55} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />
      )}

      {/* Tab Content 3: Produtos Maior Queda */}
      {activeTab === 'decline' && (
        <ViewToggleBlock
          title="Produtos com Maior Queda (%)"
          subtitle={`SKUs com maior retração no faturamento — ${periodLabel}`}
          exportFilename="produtos_maior_queda"
          tableHeaders={[
            { key: 'id', label: 'SKU / ID' },
            { key: 'name', label: 'Nome do Produto' },
            { key: 'grupo', label: 'Grupo' },
            { key: 'declineFormatted', label: 'Queda %' },
            { key: 'revenueCurrent', label: `Fat. ${currentYear}` },
            { key: 'revenueBase', label: `Fat. ${previousYear}` }
          ]}
          tableRows={filterList(decliningProducts, 'name').map(p => ({
            id: p.id,
            name: p.name,
            grupo: p.grupo,
            declineFormatted: <span className="text-red-400 font-bold">{p.growth.toFixed(1)}%</span>,
            revenueCurrent: formatBRL(p.currentRev),
            revenueBase: formatBRL(p.baseRev)
          }))}
          chartComponent={
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={decliningProducts.slice(0, 10).map(p => ({
                    name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                    fullName: p.name,
                    fat2026: p.currentRev,
                    fat2025: p.baseRev,
                    queda: p.growth
                  }))}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(val) => formatCompactBRL(val)} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} width={160} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
                    formatter={(value, name) => [formatBRL(value), name]}
                    labelFormatter={(label, payload) => {
                      const d = payload?.[0]?.payload;
                      return d ? `${d.fullName} (${d.queda.toFixed(1)}%)` : label;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="fat2026" name={`${currentYear} (Atual)`} fill="#EF4444" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="fat2025" name={`${previousYear} (Anterior)`} fill="#64748B" radius={[0, 4, 4, 0]} opacity={0.55} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />
      )}

      {/* Tab Content 4: Top Cidades */}
      {activeTab === 'cities' && (
        <ViewToggleBlock
          title={
            <div className="flex items-center gap-2">
              <span>Top Cidades em Faturamento</span>
              {isLiveCities && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Qlik Cloud SaaS Live
                </span>
              )}
            </div>
          }
          subtitle={`Municípios com maior volume de vendas — ${periodLabel}`}
          exportFilename="top_cidades_faturamento"
          tableHeaders={[
            { key: 'rank', label: 'Posição' },
            { key: 'city', label: 'Cidade' },
            { key: 'uf', label: 'UF' },
            { key: 'revenueFormatted', label: `Fat. ${currentYear}` },
            { key: 'revenueBaseFormatted', label: `Fat. ${previousYear}` },
            { key: 'growthFormatted', label: 'Variação %' },
            { key: 'qtyFormatted', label: 'Qtd Vendida' }
          ]}
          tableRows={filterList(topCities, 'city').map((c, idx) => ({
            rank: `#${idx + 1}`,
            city: c.city,
            uf: c.uf,
            revenueFormatted: formatBRL(c.revenue),
            revenueBaseFormatted: formatBRL(c.baseRev || 0),
            growthFormatted: c.baseRev > 0 
              ? <span className={c.growth >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{c.growth >= 0 ? '+' : ''}{c.growth.toFixed(1)}%</span>
              : <span className="text-slate-500">—</span>,
            qtyFormatted: formatNum(c.qty)
          }))}
          chartComponent={
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCities.slice(0, 10).map(c => ({
                    cidade: `${c.city} (${c.uf})`,
                    fat2026: c.revenue,
                    fat2025: c.baseRev || 0
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="cidade" stroke="#94A3B8" fontSize={10} angle={-25} textAnchor="end" />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => formatCompactBRL(val)} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
                    formatter={(value, name) => [formatBRL(value), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="fat2026" name={`${currentYear} (Atual)`} fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="fat2025" name={`${previousYear} (Anterior)`} fill="#64748B" radius={[6, 6, 0, 0]} opacity={0.55} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />
      )}

      {/* Tab Content 5: Top Linhas */}
      {activeTab === 'categories' && (
        <ViewToggleBlock
          title="Top Linhas"
          subtitle={`Top 10 linhas de produto por faturamento — ${periodLabel}`}
          exportFilename="top_linhas_jbp"
          tableHeaders={[
            { key: 'rank', label: 'Posição' },
            { key: 'nome', label: 'Linha de Produto' },
            { key: 'revenueFormatted', label: `Fat. ${currentYear}` },
            { key: 'revenueBaseFormatted', label: `Fat. ${previousYear}` },
            { key: 'growthFormatted', label: 'Variação %' },
            { key: 'qtyFormatted', label: 'Qtd Vendida' }
          ]}
          tableRows={topCategories.map((c, idx) => ({
            rank: `#${idx + 1}`,
            nome: c.nome,
            revenueFormatted: formatBRL(c.revenue),
            revenueBaseFormatted: formatBRL(c.baseRev || 0),
            growthFormatted: c.baseRev > 0 
              ? <span className={c.growth >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{c.growth >= 0 ? '+' : ''}{c.growth.toFixed(1)}%</span>
              : <span className="text-slate-500">—</span>,
            qtyFormatted: formatNum(c.qty)
          }))}
          chartComponent={
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topCategories.map(c => ({
                    linha: c.nome.length > 22 ? c.nome.substring(0, 22) + '…' : c.nome,
                    fullNome: c.nome,
                    fat2026: c.revenue,
                    fat2025: c.baseRev || 0
                  }))}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(val) => formatCompactBRL(val)} />
                  <YAxis dataKey="linha" type="category" stroke="#94A3B8" fontSize={10} width={175} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
                    formatter={(value, name) => [formatBRL(value), name]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullNome || label}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="fat2026" name={`${currentYear} (Atual)`} fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="fat2025" name={`${previousYear} (Anterior)`} fill="#64748B" radius={[0, 4, 4, 0]} opacity={0.55} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />
      )}

    </div>
  );
}
