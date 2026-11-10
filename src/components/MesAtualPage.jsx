import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  AreaChart, Area, Legend, LineChart, Line, ComposedChart, ReferenceArea,
} from 'recharts';
import {
  Radio, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Minus,
  ShoppingBag, DollarSign, Clock, Zap, ChevronUp, ChevronDown,
  CalendarDays, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Constantes ───────────────────────────────────────────────────────────────
const SERVER_URL = import.meta.env.VITE_API_URL ?? (
  window.location.port === '5173' ? `http://${window.location.hostname}:3001` : ''
);

const today = new Date();
const CURRENT_YEAR  = today.getFullYear().toString();
const CURRENT_MONTH = String(today.getMonth() + 1).padStart(2, '0');
const BASE_YEAR     = (today.getFullYear() - 1).toString();
const CURRENT_YM    = `${CURRENT_YEAR}-${CURRENT_MONTH}`;
const BASE_YM       = `${BASE_YEAR}-${CURRENT_MONTH}`;

const getMonthName = (monthNumber) => {
  const m = parseInt(monthNumber, 10);
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return names[m - 1];
};

const getFullMonthName = (monthNumber) => {
  const m = parseInt(monthNumber, 10);
  const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return names[m - 1];
};

const CURRENT_MONTH_NAME = getMonthName(CURRENT_MONTH);
const CURRENT_MONTH_FULL = getFullMonthName(CURRENT_MONTH);

const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
const PREV_MONTH_NAME = getMonthName(String(prevDate.getMonth() + 1));
const PREV_YEAR = prevDate.getFullYear().toString();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v, opts = {}) => {
  if (v === null || v === undefined || isNaN(v)) return '—';
  const { prefix = '', decimals = 1 } = opts;
  if (Math.abs(v) >= 1e6) return `${prefix}${(v / 1e6).toFixed(decimals)}M`;
  if (Math.abs(v) >= 1e3) return `${prefix}${(v / 1e3).toFixed(decimals)}K`;
  return `${prefix}${v.toFixed(decimals)}`;
};

const fmtBRL = (v) => {
  if (!v && v !== 0) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
};

const pct = (current, base) => {
  if (!base || base === 0) return null;
  return ((current - base) / base) * 100;
};

// ─── Componente: Tooltip Comparativo (MoM e YoY com D-1) ──────────────────────
function ComparativeTooltip({ active, payload, diaD1, currentLabel, prevLabel, baseLabel }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const isPosMoM = data.growthMoM >= 0;
  const isPosYoY = data.growthYoY >= 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs space-y-2 min-w-[240px]">
      <p className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 truncate">
        {data.fornecedor || data.linha || 'Item'}
      </p>
      
      {/* Atual */}
      <div className="flex items-center justify-between">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {currentLabel || 'Atual'} (até D-{diaD1}):
        </span>
        <span className="font-montserrat font-bold text-slate-900 dark:text-white">
          {fmtBRL(data.receita)}
        </span>
      </div>

      {/* Mês Anterior (D-1) */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex flex-col">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            vs. {prevLabel || 'Mês Ant.'} (D-{diaD1}):
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {fmtBRL(data.receitaPrev)}
          </span>
        </div>
        {data.growthMoM !== null && data.growthMoM !== undefined ? (
          <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded text-[10px] ${
            isPosMoM 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
              : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
          }`}>
            {isPosMoM ? '+' : ''}{data.growthMoM.toFixed(1)}%
          </span>
        ) : (
          <span className="text-slate-400 text-[10px]">—</span>
        )}
      </div>

      {/* Ano Anterior (D-1) */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex flex-col">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            vs. {baseLabel || 'Ano Ant.'} (D-{diaD1}):
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {fmtBRL(data.receitaBase)}
          </span>
        </div>
        {data.growthYoY !== null && data.growthYoY !== undefined ? (
          <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded text-[10px] ${
            isPosYoY 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
              : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
          }`}>
            {isPosYoY ? '+' : ''}{data.growthYoY.toFixed(1)}%
          </span>
        ) : (
          <span className="text-slate-400 text-[10px]">—</span>
        )}
      </div>
    </div>
  );
}

// ─── Componente: Badge "Ao Vivo" ──────────────────────────────────────────────
function LiveBadge({ atualizadoEm }) {
  return (
    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-emerald-400 text-xs font-semibold tracking-wide">AO VIVO — QLIK CLOUD</span>
      {atualizadoEm && (
        <span className="text-slate-500 text-xs">
          {new Date(atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

// ─── Componente: KPI Card Live ────────────────────────────────────────────────
function LiveKpiCard({ label, current, base, compareBase, displayBaseLabel, icon: Icon, prefix = 'R$', loading, incremental = false, customValue }) {
  const baseForDelta = compareBase !== undefined ? compareBase : base;
  const delta = pct(current, baseForDelta);
  const positive = delta !== null && delta >= 0;

  // No modo incremental, o valor principal exibido é a diferença (atual - base)
  const displayValue  = incremental && base != null ? current - base : current;
  const displayPositive = incremental ? displayValue >= 0 : positive;

  return (
    <div className="crm-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        {delta !== null && !loading && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-md border
            ${positive
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
              : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
            }`}>
            {positive ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      ) : (
        <>
          <div>
            <p className={`text-xl font-black tracking-tight ${displayPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} ${!incremental ? 'text-slate-900 dark:text-white' : ''}`}
               style={!incremental ? { color: 'inherit' } : {}}>
              {customValue !== undefined
                ? customValue
                : (incremental
                  ? (displayPositive ? '+' : '') + (prefix === 'R$' ? fmtBRL(displayValue) : fmt(displayValue, { prefix }))
                  : (prefix === 'R$' ? fmtBRL(current) : fmt(current, { prefix })))}
            </p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{label}</p>
          </div>
          {base != null && (
            <p className="text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-2 font-medium">
              {displayBaseLabel || (incremental ? `Base ${CURRENT_MONTH_NAME}/${BASE_YEAR}:` : `Total ${PREV_MONTH_NAME} ${PREV_YEAR}:`)}{' '}
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {prefix === 'R$' ? fmtBRL(base) : fmt(base, { prefix })}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Componente: Projeção do Mês ──────────────────────────────────────────────
function ProjecaoMes({ receitaAtual, projecaoAnt }) {
  if (receitaAtual == null || !projecaoAnt) return null;

  const { receitaTotal, receitaParcial, receitaAtualD1, mesAnterior, diaAnalisado } = projecaoAnt;
  
  // Usa receitaAtualD1 (mês atual até D-1) para comparar com receitaParcial (mês anterior até D-1)
  const valAtual = receitaAtualD1 || receitaAtual;
  const crescimento = receitaParcial > 0 ? (valAtual / receitaParcial) - 1 : 0;
  const projecao = receitaTotal * (1 + crescimento);
  
  const percText = crescimento > 0 ? `+${(crescimento * 100).toFixed(1)}%` : `${(crescimento * 100).toFixed(1)}%`;
  const [ano, mes] = mesAnterior.split('-');
  const progresso = receitaTotal > 0 ? (receitaAtual / projecao) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-[#007BFF]/15 to-[#0056B3]/15 dark:from-[#007BFF]/20 dark:to-[#0056B3]/20 border border-[#007BFF]/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold text-[#007BFF] dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-[#007BFF] dark:text-blue-400" />
          Projeção do Mês
        </h3>
        <span className="text-[9px] bg-[#007BFF]/10 text-[#007BFF] dark:text-blue-300 border border-[#007BFF]/30 px-2 py-0.5 rounded font-bold uppercase tracking-widest" title={`Baseado no Δ até D${diaAnalisado} vs ${mes}/${ano}`}>
          Run Rate D-1 vs {mes}/{ano}
        </span>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {fmtBRL(projecao)}
          </p>
          <p className="text-[10px] text-[#007BFF] dark:text-blue-300 mt-1 font-medium">Ritmo atual: {percText} vs Mês Ant.</p>
        </div>
        <div className="text-right border-l border-[#007BFF]/30 pl-3">
          <p className="text-[9px] text-[#007BFF] dark:text-blue-400 font-medium uppercase tracking-wider">Mês Ant.</p>
          <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
            {fmtBRL(receitaTotal)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-blue-200 mb-1.5 font-medium">
          <span>{fmtBRL(receitaAtual)} alcançado</span>
          <span>{progresso.toFixed(1)}% da proj.</span>
        </div>
        <div className="h-2 w-full bg-[#007BFF]/10 rounded-full overflow-hidden border border-[#007BFF]/20">
          <div
            className="h-full bg-gradient-to-r from-[#007BFF] to-[#0056B3] rounded-full relative transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(progresso, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componente: Estado de Erro ───────────────────────────────────────────────
function ErrorState({ mensagem, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>
      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-slate-200 mb-2">Qlik Cloud SaaS Indisponível</h3>
        <p className="text-sm text-slate-400 mb-1">{mensagem}</p>
        <p className="text-xs text-slate-500">
          Verifique a conexão em tempo real com o Qlik Cloud SaaS
        </p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Tentar novamente
      </button>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function MesAtualPage({ selectedSupplier, selectedLinha, selectedChannel, selectedProduct, selectedUFs }) {
  const [liveKpis,     setLiveKpis]     = useState(null);
  const [liveProducts, setLiveProducts] = useState(null);
  const [base2025,     setBase2025]     = useState(null);
  const [projecaoAnt,  setProjecaoAnt]  = useState(null);
  const [evolucaoDiaria, setEvolucaoDiaria] = useState(null);
  const [evolucaoUF, setEvolucaoUF] = useState('default');
  const [evolucaoCanal, setEvolucaoCanal] = useState('default');
  const [diaInicio, setDiaInicio] = useState('');
  const [diaFim, setDiaFim] = useState('');
  const [loadingEvolucao, setLoadingEvolucao] = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [loadingProds, setLoadingProds] = useState(true);
  const [error,        setError]        = useState(null);
  const [lastRefresh,  setLastRefresh]  = useState(null);

  // Modos de visualização comparativa para Fornecedores e Linhas
  const [viewModeForn,  setViewModeForn]  = useState('receita'); // 'receita' | 'mom' | 'yoy'
  const [viewModeLinha, setViewModeLinha] = useState('receita'); // 'receita' | 'mom' | 'yoy'

  // Aba da tabela comparativa inferior (produtos, linhas, fornecedores)
  const [tableTab, setTableTab] = useState('produtos'); // 'produtos' | 'linhas' | 'fornecedores'
  const [displayLimit, setDisplayLimit] = useState(30);

  const kpisData = liveKpis || null;
  const baseData = base2025 || null;

  const fetchData = async () => {
    setLoading(true);
    setLoadingProds(true);
    setError(null);

    const params = new URLSearchParams();
    if (selectedSupplier && selectedSupplier.length > 0) {
      selectedSupplier.forEach(s => {
        if (!s.includes('CONSOLIDADO')) {
          params.append('fornecedor', s);
        }
      });
    }
    if (selectedLinha && selectedLinha.length > 0) {
      selectedLinha.forEach(l => {
        if (!l.includes('CONSOLIDADO')) {
          params.append('linha', l);
        }
      });
    }
    if (selectedProduct && selectedProduct.length > 0) {
      selectedProduct.forEach(p => {
        if (!p.includes('CONSOLIDADO')) {
          params.append('produto', p);
        }
      });
    }
    if (selectedUFs && selectedUFs.length > 0) {
      selectedUFs.forEach(u => {
        if (!u.includes('CONSOLIDADO')) {
          params.append('uf', u);
        }
      });
    }
    if (selectedChannel) {
      params.append('canal', selectedChannel);
    }
    if (diaInicio) params.append('diaInicio', diaInicio);
    if (diaFim) params.append('diaFim', diaFim);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const evolParams = new URLSearchParams(params);
    if (evolucaoUF !== 'default') evolParams.set('evolucaoUF', evolucaoUF);
    if (evolucaoCanal !== 'default') evolParams.set('evolucaoCanal', evolucaoCanal);
    const evolQs = evolParams.toString() ? `?${evolParams.toString()}` : '';

    try {
      const [kpisRes, base2025Res, prodsRes, projecaoRes, evolucaoRes] = await Promise.all([
        fetch(`${SERVER_URL}/api/live/kpis${qs}`).then(r => r.json()),
        fetch(`${SERVER_URL}/api/live/base2025${qs}`).then(r => r.json()).catch(() => null),
        fetch(`${SERVER_URL}/api/live/products${qs}`).then(r => r.json()).catch(() => null),
        fetch(`${SERVER_URL}/api/live/projecao${qs}`).then(r => r.json()).catch(() => null),
        fetch(`${SERVER_URL}/api/live/evolucao-diaria${evolQs}`).then(r => r.json()).catch(() => null),
      ]);

      if (!kpisRes?.ok) throw new Error(kpisRes?.erro || 'Erro ao buscar KPIs');

      setLiveKpis(kpisRes);
      if (base2025Res?.ok) setBase2025(base2025Res);
      if (prodsRes?.ok)    setLiveProducts(prodsRes);
      if (projecaoRes?.ok) setProjecaoAnt(projecaoRes);
      if (evolucaoRes?.ok) setEvolucaoDiaria(evolucaoRes);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || 'Não foi possível conectar ao servidor Qlik. Verifique se está rodando na porta 3000.');
    } finally {
      setLoading(false);
      setLoadingProds(false);
    }
  };

  const fetchEvolucao = async (uf, canal) => {
    setLoadingEvolucao(true);
    const params = new URLSearchParams();
    if (selectedSupplier && selectedSupplier.length > 0) {
      selectedSupplier.forEach(s => {
        if (!s.includes('CONSOLIDADO')) params.append('fornecedor', s);
      });
    }
    if (selectedLinha && selectedLinha.length > 0) {
      selectedLinha.forEach(l => {
        if (!l.includes('CONSOLIDADO')) params.append('linha', l);
      });
    }
    if (selectedProduct && selectedProduct.length > 0) {
      selectedProduct.forEach(p => {
        if (!p.includes('CONSOLIDADO')) params.append('produto', p);
      });
    }
    if (selectedUFs && selectedUFs.length > 0) {
      selectedUFs.forEach(u => {
        if (!u.includes('CONSOLIDADO')) params.append('uf', u);
      });
    }
    if (selectedChannel) {
      params.append('canal', selectedChannel);
    }
    if (uf !== 'default') params.append('evolucaoUF', uf);
    if (canal !== 'default') params.append('evolucaoCanal', canal);
    
    const qs = params.toString() ? `?${params.toString()}` : '';
    try {
      const res = await fetch(`${SERVER_URL}/api/live/evolucao-diaria${qs}`);
      const json = await res.json();
      if (json?.ok) setEvolucaoDiaria(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvolucao(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchEvolucao(evolucaoUF, evolucaoCanal);
    }
  }, [evolucaoUF, evolucaoCanal]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedSupplier, selectedLinha, selectedChannel, selectedProduct, selectedUFs, diaInicio, diaFim]);

  // Chart Data
  const canalData = useMemo(() => {
    if (!liveKpis?.canais) return [];
    return [...liveKpis.canais]
      .filter(c => c.receita > 0)
      .sort((a, b) => b.receita - a.receita);
  }, [liveKpis]);

  const fornecedorData = useMemo(() => {
    if (!liveKpis?.fornecedores) return [];
    return [...liveKpis.fornecedores]
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);
  }, [liveKpis]);

  const linhaData = useMemo(() => {
    if (!liveKpis?.linhas) return [];
    return [...liveKpis.linhas]
      .filter(l => l.receita > 0)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10);
  }, [liveKpis]);

  const CANAL_COLORS = ['#00A650', '#007BFF', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  // Mês e Ano ativos da consulta com D-1 proporcional
  const activeMonthStr = liveKpis?.mes || CURRENT_YM;
  const [activeYear, activeMonth] = activeMonthStr.split('-');
  const displayMonthName = getFullMonthName(activeMonth);
  const displayMonthShort = getMonthName(activeMonth);
  const displayBaseYear = (parseInt(activeYear, 10) - 1).toString();

  const prevMonthStr = liveKpis?.prevMes || `${activeYear}-${String(parseInt(activeMonth, 10) - 1).padStart(2, '0')}`;
  const [prevYear, prevMonth] = prevMonthStr.split('-');
  const prevMonthShort = getMonthName(prevMonth);
  const prevMonthFull = getFullMonthName(prevMonth);

  const diaD1 = liveKpis?.diaD1 || Math.max(1, new Date().getDate() - 1);

  // Dados dinâmicos para a tabela comparativa inferior (produtos, linhas, fornecedores)
  const currentTableData = useMemo(() => {
    if (tableTab === 'produtos') {
      return (liveProducts?.produtos || []).map(p => ({
        id: p.ean || p.nome,
        nome: p.nome,
        sub: p.ean ? `EAN: ${p.ean}` : null,
        receita: p.receita,
        qtd: p.qtd,
        receitaPrev: p.receitaPrev,
        receitaBase: p.receitaBase,
        growthMoM: p.growthMoM,
        growthYoY: p.growthYoY
      }));
    } else if (tableTab === 'linhas') {
      return (liveKpis?.linhas || []).map(l => ({
        id: l.linha,
        nome: l.linha,
        sub: null,
        receita: l.receita,
        qtd: l.qtd,
        receitaPrev: l.receitaPrev,
        receitaBase: l.receitaBase,
        growthMoM: l.growthMoM,
        growthYoY: l.growthYoY
      }));
    } else {
      return (liveKpis?.fornecedores || []).map(f => ({
        id: f.fornecedor,
        nome: f.fornecedor,
        sub: null,
        receita: f.receita,
        qtd: f.qtd,
        receitaPrev: f.receitaPrev,
        receitaBase: f.receitaBase,
        growthMoM: f.growthMoM,
        growthYoY: f.growthYoY
      }));
    }
  }, [tableTab, liveProducts, liveKpis]);

  // Função para exportar os dados da tabela ativa para Excel (.xlsx)
  const handleExportExcel = () => {
    let dataToExport = [];
    let sheetName = 'Top_Produtos';
    let filename = `Top_Produtos_${displayMonthShort}_${activeYear}`;

    if (tableTab === 'produtos') {
      sheetName = 'Produtos_Completo';
      filename = `Lista_Completa_Produtos_${displayMonthShort}_${activeYear}`;
      const list = liveProducts?.produtos || [];
      dataToExport = list.map((item, idx) => ({
        '#': idx + 1,
        'Produto': item.nome,
        'EAN': item.ean || '',
        'Receita Atual (R$)': item.receita,
        'Qtd Atual (un)': item.qtd,
        [`Receita Mês Ant. (${prevMonthShort} D-${diaD1}) (R$)`]: item.receitaPrev || 0,
        'Var. MoM (%)': item.growthMoM !== null && item.growthMoM !== undefined ? Number(item.growthMoM.toFixed(1)) : 'Novo / Sem base',
        [`Receita Ano Ant. (${displayMonthShort}/${displayBaseYear} D-${diaD1}) (R$)`]: item.receitaBase || 0,
        'Var. YoY (%)': item.growthYoY !== null && item.growthYoY !== undefined ? Number(item.growthYoY.toFixed(1)) : 'Novo / Sem base',
      }));
    } else if (tableTab === 'linhas') {
      sheetName = 'Linhas_Completo';
      filename = `Lista_Completa_Linhas_${displayMonthShort}_${activeYear}`;
      const list = liveKpis?.linhas || [];
      dataToExport = list.map((item, idx) => ({
        '#': idx + 1,
        'Linha': item.linha,
        'Receita Atual (R$)': item.receita,
        'Qtd Atual (un)': item.qtd,
        [`Receita Mês Ant. (${prevMonthShort} D-${diaD1}) (R$)`]: item.receitaPrev || 0,
        'Var. MoM (%)': item.growthMoM !== null && item.growthMoM !== undefined ? Number(item.growthMoM.toFixed(1)) : 'Novo / Sem base',
        [`Receita Ano Ant. (${displayMonthShort}/${displayBaseYear} D-${diaD1}) (R$)`]: item.receitaBase || 0,
        'Var. YoY (%)': item.growthYoY !== null && item.growthYoY !== undefined ? Number(item.growthYoY.toFixed(1)) : 'Novo / Sem base',
      }));
    } else if (tableTab === 'fornecedores') {
      sheetName = 'Fornecedores_Completo';
      filename = `Lista_Completa_Fornecedores_${displayMonthShort}_${activeYear}`;
      const list = liveKpis?.fornecedores || [];
      dataToExport = list.map((item, idx) => ({
        '#': idx + 1,
        'Fornecedor': item.fornecedor,
        'Receita Atual (R$)': item.receita,
        'Qtd Atual (un)': item.qtd,
        [`Receita Mês Ant. (${prevMonthShort} D-${diaD1}) (R$)`]: item.receitaPrev || 0,
        'Var. MoM (%)': item.growthMoM !== null && item.growthMoM !== undefined ? Number(item.growthMoM.toFixed(1)) : 'Novo / Sem base',
        [`Receita Ano Ant. (${displayMonthShort}/${displayBaseYear} D-${diaD1}) (R$)`]: item.receitaBase || 0,
        'Var. YoY (%)': item.growthYoY !== null && item.growthYoY !== undefined ? Number(item.growthYoY.toFixed(1)) : 'Novo / Sem base',
      }));
    }

    if (!dataToExport || dataToExport.length === 0) {
      alert('Não há dados disponíveis para exportação no momento.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const keys = Object.keys(dataToExport[0]);
    worksheet['!cols'] = keys.map(k => {
      const maxLen = Math.max(k.length, ...dataToExport.map(row => String(row[k] ?? '').length));
      return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {displayMonthName} / {activeYear} — Mês em Andamento
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dados em tempo real via Qlik Cloud SaaS · comparativo vs. {displayMonthName}/{displayBaseYear}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveBadge atualizadoEm={liveKpis?.atualizadoEm} />
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 shadow-sm">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">De:</span>
            <input 
              type="number" 
              min="1" max="31"
              value={diaInicio}
              onChange={(e) => setDiaInicio(e.target.value)}
              className="w-12 text-center text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 transition-colors"
              placeholder="01"
            />
            <span className="text-xs font-semibold text-slate-500">Até:</span>
            <input 
              type="number" 
              min="1" max="31"
              value={diaFim}
              onChange={(e) => setDiaFim(e.target.value)}
              className="w-12 text-center text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 transition-colors"
              placeholder="31"
            />
            {(diaInicio || diaFim) && (
              <button
                onClick={() => {
                  setDiaInicio('');
                  setDiaFim('');
                  setTimeout(fetchData, 50); // delay to let state update
                }}
                className="ml-2 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors border border-slate-300"
              >
                Limpar (Mês Completo)
              </button>
            )}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar dados
          </button>
        </div>
      </div>

      {/* Estado de Erro */}
      {error && !loading && (
        <ErrorState mensagem={error} onRetry={fetchData} />
      )}

      {/* Conteúdo quando há dados ou carregando */}
      {(!error || loading) && (
        <>
          {/* Banner de andamento do mês */}
          {(liveKpis || loading) && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-5 py-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-200">
                {loading ? 'Carregando dados do Qlik…' : (
                  <>
                    Mês parcial · <strong>Dia {liveKpis?.diasCorridos}</strong> de {liveKpis?.diasNoMes} ·
                    {' '}{((liveKpis?.diasCorridos / liveKpis?.diasNoMes) * 100).toFixed(0)}% do mês decorrido ·
                    dados atualizados automaticamente a cada 5 minutos
                  </>
                )}
              </p>
            </div>
          )}

          {/* KPI Cards — 3 cards no topo */}
          
          {/* Lógica do Filtro de Dias */}
          {(() => {
            const isCustom = diaInicio || diaFim;
            const dI = Number(diaInicio) || 1;
            const dF = Number(diaFim) || liveKpis?.diasCorridos || 31;
            const customDias = (dF >= dI) ? (dF - dI + 1) : 0;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <LiveKpiCard
                  label={`Receita Total · ${displayMonthName}/${activeYear}`}
                  current={liveKpis?.totalReceita}
                  base={projecaoAnt?.receitaTotal}
                  compareBase={projecaoAnt?.receitaParcial}
                  displayBaseLabel={`Total ${PREV_MONTH_NAME} ${PREV_YEAR}:`}
                  icon={DollarSign}
                  prefix="R$"
                  loading={loading}
                />
                <LiveKpiCard
                  label={`Receita Digital vs ${displayMonthName}/${displayBaseYear} (D${isCustom ? dF : (baseData?.diaAtual ?? '…')})`}
                  current={liveKpis?.totalReceita}
                  base={baseData?.receitaProRata}
                  displayBaseLabel={`Base ${displayMonthName}/${displayBaseYear}:`}
                  icon={TrendingUp}
                  prefix="R$"
                  loading={loading}
                  incremental
                />
                <LiveKpiCard
                  label={isCustom ? "Dias Selecionados" : "Dias Corridos"}
                  current={isCustom ? customDias : liveKpis?.diasCorridos}
                  customValue={isCustom ? `${customDias} Dias` : liveKpis ? `${liveKpis.diasCorridos}/${liveKpis.diasNoMes}` : undefined}
                  base={null}
                  icon={ShoppingBag}
                  prefix=""
                  loading={loading}
                />
              </div>
            );
          })()}

          

          {/* Gráfico de Evolução Diária */}
          <div className="crm-card p-4 mb-4 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Evolução Diária de Vendas
              </h3>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                
                {/* Botão Reset / Geral */}
                {(evolucaoUF !== 'default' || evolucaoCanal !== 'default') && (
                  <button
                    onClick={() => { setEvolucaoUF('default'); setEvolucaoCanal('default'); }}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 transition-colors"
                  >
                    Limpar Filtro
                  </button>
                )}

                {/* Dropdown UF */}
                <div className="relative group">
                  <select
                    className={`appearance-none text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all font-semibold shadow-sm border-0
                      ${evolucaoUF !== 'default' 
                        ? 'bg-[#0056B3] text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-[#007BFF]' 
                        : 'bg-[#007BFF] text-white hover:bg-[#0056B3]'}`}
                    value={evolucaoUF}
                    onChange={(e) => setEvolucaoUF(e.target.value)}
                  >
                    <option value="default" disabled hidden>📍 Selecionar UF</option>
                    <option value="all" className="bg-white text-slate-700">📍 Todas as UFs</option>
                    <option value="RS" className="bg-white text-slate-700">🟢 Apenas RS</option>
                    <option value="SC" className="bg-white text-slate-700">🔵 Apenas SC</option>
                    <option value="PR" className="bg-white text-slate-700">🟡 Apenas PR</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-100">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Dropdown Canal */}
                <div className="relative group">
                  <select
                    className={`appearance-none text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer transition-all font-semibold shadow-sm border-0
                      ${evolucaoCanal !== 'default' 
                        ? 'bg-[#0056B3] text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-[#007BFF]' 
                        : 'bg-[#007BFF] text-white hover:bg-[#0056B3]'}`}
                    value={evolucaoCanal}
                    onChange={(e) => setEvolucaoCanal(e.target.value)}
                  >
                    <option value="default" disabled hidden>📱 Selecionar Canal Digital</option>
                    <option value="all" className="bg-white text-slate-700">📱 Todos os Canais</option>
                    <option value="App Mobile" className="bg-white text-slate-700">📲 App Mobile</option>
                    <option value="E-commerce / Site" className="bg-white text-slate-700">💻 Site / E-commerce</option>
                    <option value="Marketplace" className="bg-white text-slate-700">🛒 Marketplace</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-100">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            {(loading || loadingEvolucao) ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
              </div>
            ) : evolucaoDiaria?.dias?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={evolucaoDiaria.dias.filter(d => Object.keys(d).some(k => k !== 'dia' && d[k] > 0))} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                  {(diaInicio || diaFim) && (
                    <ReferenceArea
                      x1={diaInicio ? Number(diaInicio) : 1}
                      x2={diaFim ? Number(diaFim) : 31}
                      fill="#007BFF"
                      fillOpacity={0.05}
                      stroke="#007BFF"
                      strokeOpacity={0.2}
                      strokeDasharray="3 3"
                    />
                  )}
                  <XAxis 
                    dataKey="dia" 
                    tickFormatter={(v) => v} 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={(v) => fmt(v, { prefix: 'R$' })}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(v, name) => [fmtBRL(v), name]}
                    labelFormatter={(v) => `Dia ${v}`}
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 500, color: '#475569' }} />
                  
                  {evolucaoDiaria.lines?.map((line, index) => {
                    const isPrev = line === evolucaoDiaria.mesAnterior;
                    const isPrevMonth = line === evolucaoDiaria.mesPassado;
                    const isCurr = line === evolucaoDiaria.mesAtual;
                    
                    // Is this a single line filtered view? (i.e. not the 3-line breakdown, and not the general unfiltered view)
                    // If the view has Mês Atual and Mês Anterior, AND there's a filter applied, it's the single filtered view!
                    const isFiltered = (evolucaoUF !== 'default' || evolucaoCanal !== 'default') && (evolucaoUF !== 'all' && evolucaoCanal !== 'all');
                    
                    let activeColor = '#00A650'; // Default Green
                    if (evolucaoUF === 'RS') activeColor = '#00A650'; // Green
                    if (evolucaoUF === 'SC') activeColor = '#007BFF'; // Blue
                    if (evolucaoUF === 'PR') activeColor = '#F59E0B'; // Yellow
                    if (evolucaoUF === 'default' && evolucaoCanal !== 'default') activeColor = '#8B5CF6'; // Purple for channels
                    
                    const colors = ['#00A650', '#007BFF', '#F59E0B', '#8B5CF6', '#EC4899'];
                    const color = isPrev ? '#cbd5e1' : isPrevMonth ? '#94a3b8' : isCurr ? activeColor : colors[index % colors.length];
                    const width = (isPrev || isPrevMonth) ? 2 : 3;

                    // If it's a specific filter view, render the current month as an Area!
                    if (isFiltered && isCurr) {
                      return (
                        <Area
                          key={line}
                          type="monotone"
                          dataKey={line}
                          name={line}
                          stroke={color}
                          strokeWidth={width}
                          fill={color}
                          fillOpacity={0.15}
                          dot={{ r: 4, fill: color, strokeWidth: 0 }}
                          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                        />
                      );
                    }

                    return (
                      <Line 
                        key={line}
                        type="monotone" 
                        dataKey={line} 
                        name={line} 
                        stroke={color} 
                        strokeWidth={width} 
                        strokeDasharray={isPrevMonth ? "5 5" : undefined}
                        dot={{ r: (isPrev || isPrevMonth) ? 3 : 4, fill: color, strokeWidth: 0 }} 
                        activeDot={{ r: (isPrev || isPrevMonth) ? 5 : 6, stroke: '#fff', strokeWidth: 2 }} 
                      />
                    );
                  })}
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Sem dados de evolução disponíveis
              </div>
            )}
          </div>

          {/* KPI Projeção (Run Rate Mês Anterior) */}
          {kpisData && projecaoAnt && !diaInicio && !diaFim && (
            <ProjecaoMes
              receitaAtual={kpisData.totalReceita}
              projecaoAnt={projecaoAnt}
            />
          )}

          {/* Gráficos — 3 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Por Canal */}
            <div className="crm-card p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00A650]" />
                Receita por Canal · {CURRENT_MONTH_NAME}/{CURRENT_YEAR}
              </h3>
              {loading ? (
                <div className="h-52 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-2 border-[#00A650] border-t-transparent rounded-full" />
                </div>
              ) : canalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={canalData} layout="vertical" margin={{ left: 0, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis
                      type="number"
                      tickFormatter={v => fmt(v, { prefix: 'R$' })}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="canal"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      width={90}
                    />
                    <Tooltip
                      formatter={(v) => [fmtBRL(v), 'Receita']}
                      contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }}
                      labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                    />
                    <Bar dataKey="receita" radius={[0, 6, 6, 0]}>
                      {canalData.map((_, i) => (
                        <Cell key={i} fill={CANAL_COLORS[i % CANAL_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
                  Sem dados de canais disponíveis
                </div>
              )}
            </div>

            {/* Por Fornecedor — Top 10 com Comparativo MoM e YoY (D-1) */}
            <div className="crm-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#007BFF]" />
                  <span>Top 10 Fornecedores · {displayMonthShort}/{activeYear}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (D-{diaD1})
                  </span>
                </h3>

                {/* Seletor de visualização comparativa */}
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setViewModeForn('receita')}
                    className={`px-2 py-0.5 rounded transition-colors ${viewModeForn === 'receita' ? 'bg-white dark:bg-slate-700 text-[#007BFF] shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                  >
                    Faturamento
                  </button>
                  <button
                    onClick={() => setViewModeForn('mom')}
                    className={`px-2 py-0.5 rounded transition-colors ${viewModeForn === 'mom' ? 'bg-white dark:bg-slate-700 text-[#007BFF] shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    title={`Comparar vs ${prevMonthShort}/${prevYear} proporcional até D-${diaD1}`}
                  >
                    vs. Mês Ant.
                  </button>
                  <button
                    onClick={() => setViewModeForn('yoy')}
                    className={`px-2 py-0.5 rounded transition-colors ${viewModeForn === 'yoy' ? 'bg-white dark:bg-slate-700 text-[#007BFF] shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    title={`Comparar vs ${displayMonthShort}/${displayBaseYear} proporcional até D-${diaD1}`}
                  >
                    vs. Ano Ant.
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="h-52 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-2 border-[#007BFF] border-t-transparent rounded-full" />
                </div>
              ) : fornecedorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={fornecedorData} layout="vertical" margin={{ left: 0, right: 24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis
                      type="number"
                      tickFormatter={v => fmt(v, { prefix: 'R$' })}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="fornecedor"
                      tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '…' : val}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      width={130}
                      interval={0}
                    />
                    <Tooltip
                      content={
                        <ComparativeTooltip
                          diaD1={diaD1}
                          currentLabel={`${displayMonthShort}/${activeYear}`}
                          prevLabel={`${prevMonthShort}/${prevYear}`}
                          baseLabel={`${displayMonthShort}/${displayBaseYear}`}
                        />
                      }
                    />
                    {viewModeForn === 'receita' && (
                      <Bar dataKey="receita" fill="#007BFF" fillOpacity={0.85} radius={[0, 6, 6, 0]} />
                    )}
                    {viewModeForn === 'mom' && (
                      <>
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                        <Bar dataKey="receita" name={`${displayMonthShort}/${activeYear} (D-${diaD1})`} fill="#007BFF" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="receitaPrev" name={`${prevMonthShort}/${prevYear} (D-${diaD1})`} fill="#94A3B8" radius={[0, 4, 4, 0]} />
                      </>
                    )}
                    {viewModeForn === 'yoy' && (
                      <>
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                        <Bar dataKey="receita" name={`${displayMonthShort}/${activeYear} (D-${diaD1})`} fill="#007BFF" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="receitaBase" name={`${displayMonthShort}/${displayBaseYear} (D-${diaD1})`} fill="#10B981" radius={[0, 4, 4, 0]} />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
                  Sem dados de fornecedores disponíveis
                </div>
              )}
            </div>

            {/* Por Linha — Top 10 com Comparativo MoM e YoY (D-1) */}
            <div className="crm-card p-4 lg:col-span-2 xl:col-span-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                  <span>Top 10 Linhas · {displayMonthShort}/{activeYear}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (D-{diaD1})
                  </span>
                </h3>

                {/* Seletor de visualização comparativa */}
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setViewModeLinha('receita')}
                    className={`px-2 py-0.5 rounded transition-colors ${viewModeLinha === 'receita' ? 'bg-white dark:bg-slate-700 text-[#8B5CF6] shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                  >
                    Faturamento
                  </button>
                  <button
                    onClick={() => setViewModeLinha('mom')}
                    className={`px-2 py-0.5 rounded transition-colors ${viewModeLinha === 'mom' ? 'bg-white dark:bg-slate-700 text-[#8B5CF6] shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    title={`Comparar vs ${prevMonthShort}/${prevYear} proporcional até D-${diaD1}`}
                  >
                    vs. Mês Ant.
                  </button>
                  <button
                    onClick={() => setViewModeLinha('yoy')}
                    className={`px-2 py-0.5 rounded transition-colors ${viewModeLinha === 'yoy' ? 'bg-white dark:bg-slate-700 text-[#8B5CF6] shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    title={`Comparar vs ${displayMonthShort}/${displayBaseYear} proporcional até D-${diaD1}`}
                  >
                    vs. Ano Ant.
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="h-52 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full" />
                </div>
              ) : linhaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={linhaData} layout="vertical" margin={{ left: 0, right: 24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis
                      type="number"
                      tickFormatter={v => fmt(v, { prefix: 'R$' })}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="linha"
                      tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '…' : val}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      width={130}
                      interval={0}
                    />
                    <Tooltip
                      content={
                        <ComparativeTooltip
                          diaD1={diaD1}
                          currentLabel={`${displayMonthShort}/${activeYear}`}
                          prevLabel={`${prevMonthShort}/${prevYear}`}
                          baseLabel={`${displayMonthShort}/${displayBaseYear}`}
                        />
                      }
                    />
                    {viewModeLinha === 'receita' && (
                      <Bar dataKey="receita" fill="#8B5CF6" fillOpacity={0.85} radius={[0, 6, 6, 0]} />
                    )}
                    {viewModeLinha === 'mom' && (
                      <>
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                        <Bar dataKey="receita" name={`${displayMonthShort}/${activeYear} (D-${diaD1})`} fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="receitaPrev" name={`${prevMonthShort}/${prevYear} (D-${diaD1})`} fill="#94A3B8" radius={[0, 4, 4, 0]} />
                      </>
                    )}
                    {viewModeLinha === 'yoy' && (
                      <>
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                        <Bar dataKey="receita" name={`${displayMonthShort}/${activeYear} (D-${diaD1})`} fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="receitaBase" name={`${displayMonthShort}/${displayBaseYear} (D-${diaD1})`} fill="#10B981" radius={[0, 4, 4, 0]} />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
                  Sem dados de linhas disponíveis
                </div>
              )}
            </div>
          </div>

          {/* Tabela Principal — Top Produtos, Top Linhas e Top Fornecedores com Comparativo MoM e YoY (D-1) */}
          <div className="crm-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Abas de Navegação */}
                <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <button
                    onClick={() => { setTableTab('produtos'); setDisplayLimit(30); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      tableTab === 'produtos'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span>Top Produtos</span>
                  </button>

                  <button
                    onClick={() => { setTableTab('linhas'); setDisplayLimit(30); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      tableTab === 'linhas'
                        ? 'bg-white dark:bg-slate-700 text-[#8B5CF6] dark:text-purple-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                    <span>Top Linhas</span>
                  </button>

                  <button
                    onClick={() => { setTableTab('fornecedores'); setDisplayLimit(30); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      tableTab === 'fornecedores'
                        ? 'bg-white dark:bg-slate-700 text-[#007BFF] dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#007BFF]" />
                    <span>Top Fornecedores</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    — {displayMonthName}/{activeYear}
                  </span>
                  <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-full font-bold">
                    Comparativo Proporcional D-{diaD1}
                  </span>
                  {(tableTab === 'produtos' ? loadingProds : loading) && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> carregando…
                    </span>
                  )}
                </div>
              </div>

              {/* Lado Direito: Comparativo e Botão Exportar Excel */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium hidden md:inline">
                  vs. {prevMonthShort}/{prevYear} (MoM) e {displayMonthShort}/{displayBaseYear} (YoY)
                </span>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 cursor-pointer"
                  title={`Baixar lista completa com todos os ${currentTableData.length} itens em planilha Excel (.xlsx)`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Baixar Excel Completo ({currentTableData.length})</span>
                </button>
              </div>
            </div>

            {(tableTab === 'produtos' ? loadingProds : loading) ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                ))}
              </div>
            ) : currentTableData.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 shadow-sm select-none">
                      <tr className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <th className="text-left py-2.5 px-3 font-semibold">#</th>
                        <th className="text-left py-2.5 px-3 font-semibold">
                          {tableTab === 'produtos' ? 'Produto' : tableTab === 'linhas' ? 'Linha' : 'Fornecedor'}
                        </th>
                        <th className="text-right py-2.5 px-3 font-semibold">Receita Atual</th>
                        <th className="text-right py-2.5 px-3 font-semibold">Qtd</th>
                        <th className="text-right py-2.5 px-3 font-semibold">
                          vs. Mês Ant. ({prevMonthShort} D-{diaD1})
                        </th>
                        <th className="text-right py-2.5 px-3 font-semibold">
                          vs. Ano Ant. ({displayMonthShort}/{displayBaseYear} D-{diaD1})
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTableData.slice(0, displayLimit).map((item, i) => {
                        const isPosMoM = item.growthMoM >= 0;
                        const isPosYoY = item.growthYoY >= 0;

                        return (
                          <tr
                            key={item.id || i}
                            className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-slate-400 text-xs w-8 font-semibold">{i + 1}</td>
                            <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-medium max-w-xs">
                              <div className="truncate font-semibold text-[13px]">{item.nome}</div>
                              {item.sub && (
                                <div className="text-[10px] text-slate-400 font-mono">{item.sub}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                              {fmtBRL(item.receita)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-medium tabular-nums">
                              {item.qtd?.toLocaleString('pt-BR')} un.
                            </td>
                            
                            {/* vs Mês Anterior D-1 */}
                            <td className="py-2.5 px-3 text-right tabular-nums">
                              {item.growthMoM !== null && item.growthMoM !== undefined ? (
                                <div className="flex flex-col items-end">
                                  <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded text-[10px] leading-tight ${
                                    isPosMoM 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                                      : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                                  }`}>
                                    {isPosMoM ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                    {isPosMoM ? '+' : ''}{item.growthMoM.toFixed(1)}%
                                  </span>
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                                    vs. {fmtBRL(item.receitaPrev)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>

                            {/* vs Ano Anterior D-1 */}
                            <td className="py-2.5 px-3 text-right tabular-nums">
                              {item.growthYoY !== null && item.growthYoY !== undefined ? (
                                <div className="flex flex-col items-end">
                                  <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded text-[10px] leading-tight ${
                                    isPosYoY 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                                      : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                                  }`}>
                                    {isPosYoY ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                    {isPosYoY ? '+' : ''}{item.growthYoY.toFixed(1)}%
                                  </span>
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                                    vs. {fmtBRL(item.receitaBase)}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                                  Novo
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Barra de Paginação / Carregar Mais */}
                {currentTableData.length > 30 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs select-none rounded-b-xl">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Exibindo os top <strong>{Math.min(displayLimit, currentTableData.length)}</strong> de <strong>{currentTableData.length}</strong> {tableTab === 'produtos' ? 'produtos' : tableTab === 'linhas' ? 'linhas' : 'fornecedores'}.
                      {displayLimit < currentTableData.length && ' (o Excel baixa a lista completa de todos os itens)'}
                    </span>
                    <div className="flex items-center gap-2">
                      {displayLimit < currentTableData.length && (
                        <>
                          <button
                            onClick={() => setDisplayLimit(prev => Math.min(prev + 50, currentTableData.length))}
                            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            +50 itens
                          </button>
                          <button
                            onClick={() => setDisplayLimit(currentTableData.length)}
                            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Ver todos ({currentTableData.length})
                          </button>
                        </>
                      )}
                      {displayLimit > 30 && (
                        <button
                          onClick={() => setDisplayLimit(30)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Recolher para 30
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                {error ? 'Dados não disponíveis (servidor offline)' : `Sem dados de ${tableTab} para o mês atual`}
              </div>
            )}
          </div>

          {/* Nota de rodapé */}
          <p className="text-xs text-slate-400 text-center pb-4">
            ⚡ Dados em tempo real via Qlik Cloud SaaS Engine API · Cache de 15 min · Conexão direta ao App JBP
          </p>
        </>
      )}
    </div>
  );
}
