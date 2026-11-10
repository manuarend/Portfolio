import React, { useState } from 'react';
import { X, Check, Search, Building2, Info, Calendar, Globe, Layers, SlidersHorizontal } from 'lucide-react';

export default function FilterModal({ 
  isOpen, 
  onClose, 
  suppliersList, 
  selectedSupplier,   // agora é string[]
  setSelectedSupplier,
  linhasList = [],
  selectedLinha,      // agora é string[]
  setSelectedLinha,
  productsList = [],
  productsMetadata = {},
  selectedProduct = ['TODOS OS PRODUTOS (CONSOLIDADO)'],
  setSelectedProduct,
  selectedPeriod,
  setSelectedPeriod,
  selectedChannel,
  setSelectedChannel,
  onApplyFilters,
  latestMonth = '2026-10',
  supplierLabel = '',
  linhaLabel = '',
  activeTab,
  selectedUFs = ['TODAS AS UFS (CONSOLIDADO)'],
  setSelectedUFs = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermLinha, setSearchTermLinha] = useState('');
  const [searchTermProduct, setSearchTermProduct] = useState('');

  // Comparison type state
  const defaultBaseMonth = React.useMemo(() => {
    if (!latestMonth || !latestMonth.includes('-')) return '2025-10';
    const [y, m] = latestMonth.split('-');
    return `${parseInt(y) - 1}-${m}`;
  }, [latestMonth]);

  const [periodType, setPeriodType] = useState('yoy');
  const [customCurrent, setCustomCurrent] = useState([latestMonth || '2026-10']);
  const [customBase, setCustomBase] = useState([defaultBaseMonth]);
  const [yoyMonth, setYoyMonth] = useState(latestMonth || '2026-10');

  const latestMonthLabel = React.useMemo(() => {
    if (!latestMonth || !latestMonth.includes('-')) return 'Out/2026';
    const parts = latestMonth.split('-');
    const m = parts[1] || '10';
    const y = parts[0] || '2026';
    const mNames = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };
    return `${mNames[m] || 'Out'}/${y}`;
  }, [latestMonth]);

  const monthNames = React.useMemo(() => ({
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
  }), []);

  const monthFullNames = React.useMemo(() => ({
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
  }), []);

  const presetPeriods = React.useMemo(() => {
    const yoyList = [];
    if (!latestMonth || !latestMonth.includes('-')) return { yoy: [] };
    const [maxYear, maxMonth] = latestMonth.split('-').map(Number);
    let curYear = maxYear;
    let curMonth = maxMonth;
    const minYear = 2024;
    const minMonth = 9;

    while (curYear > minYear || (curYear === minYear && curMonth >= minMonth)) {
      const mStr = String(curMonth).padStart(2, '0');
      const baseYear = curYear - 1;
      const curId = `${curYear}-${mStr}`;
      const baseId = `${baseYear}-${mStr}`;
      const curShort = `${monthNames[mStr] || mStr}/${curYear}`;
      const baseShort = `${monthNames[mStr] || mStr}/${baseYear}`;
      const curFull = `${monthFullNames[mStr] || mStr} ${curYear}`;
      const baseFull = `${monthFullNames[mStr] || mStr} ${baseYear}`;

      yoyList.push({
        id: `${curId}_vs_${baseId}`,
        label: `${curFull} vs. ${baseFull} (Ano Anterior)`,
        base: baseShort,
        current: curShort
      });

      curMonth--;
      if (curMonth < 1) {
        curMonth = 12;
        curYear--;
      }
    }
    return { yoy: yoyList };
  }, [latestMonth, monthNames, monthFullNames]);

  const availableMonths = React.useMemo(() => {
    const list = [];
    if (!latestMonth || !latestMonth.includes('-')) return list;
    const [maxYear, maxMonth] = latestMonth.split('-').map(Number);
    let curYear = maxYear;
    let curMonth = maxMonth;
    const minYear = 2023;
    const minMonth = 9;

    while (curYear > minYear || (curYear === minYear && curMonth >= minMonth)) {
      const mStr = String(curMonth).padStart(2, '0');
      const val = `${curYear}-${mStr}`;
      const name = monthFullNames[mStr] || mStr;
      list.push({ value: val, label: `${name} / ${curYear}` });

      curMonth--;
      if (curMonth < 1) {
        curMonth = 12;
        curYear--;
      }
    }
    return list;
  }, [latestMonth, monthFullNames]);

  // Sync internal state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (selectedPeriod === 'YTD') {
        setPeriodType('ytd');
      } else if (typeof selectedPeriod === 'string' && selectedPeriod.startsWith('yoy:')) {
        setPeriodType('yoy');
        setYoyMonth(selectedPeriod.replace('yoy:', ''));
      } else if (typeof selectedPeriod === 'string' && selectedPeriod.startsWith('custom:')) {
        setPeriodType('custom');
        const parts = selectedPeriod.replace('custom:', '').split('_vs_');
        if (parts.length === 2) {
          setCustomCurrent(parts[0].split(','));
          setCustomBase(parts[1].split(','));
        }
      } else if (typeof selectedPeriod === 'string' && selectedPeriod.includes('_vs_')) {
        // Fallback para presets legados (ex: '2026-10_vs_2025-10')
        const curM = selectedPeriod.split('_vs_')[0] || latestMonth;
        setPeriodType('yoy');
        setYoyMonth(curM);
      } else {
        setPeriodType('yoy');
        setYoyMonth(latestMonth || '2026-10');
      }
    }
  }, [isOpen, selectedPeriod, latestMonth]);

  const comparisonTypes = [
    { id: 'yoy', name: 'Ano a Ano (YoY)', desc: 'vs. Mesmo Mês/Ano Anterior' },
    { id: 'ytd', name: 'YTD (Acumulado no Ano)', desc: `Jan–${latestMonthLabel} vs mesmo período/ano anterior` },
    { id: 'custom', name: 'Personalizado', desc: 'Múltiplos Meses' },
  ];

  const channels = [
    { id: 'DIGITAL', label: 'Digital (com Figital)', desc: 'App + Site + Marketplace + Figital', tag: 'Digital' },
    { id: 'DIGITAL_SEM_FIGITAL', label: 'Digital (sem Figital)', desc: 'App + Site + Marketplace (Sem Figital)', tag: 'Digital' },
    { id: 'APP', label: 'App', desc: 'App + App Tele Entrega', tag: 'Digital' },
    { id: 'SITE', label: 'Site', desc: 'Site + Site Tele Entrega', tag: 'Digital' },
    { id: 'MARKETPLACE', label: 'Marketplace', desc: 'iFood + Rappi + E-commerce', tag: 'Digital' },
    { id: 'FIGITAL', label: 'Figital', desc: 'Canal Figital Integrado', tag: 'Digital' },
    { id: 'FISICO', label: 'Loja Física', desc: 'Balcão + Caixa + Auto Atend. + Lojas', tag: 'Físico' },
    { id: 'TELEVENDAS', label: 'Televendas', desc: 'Central Telefônica Tele Entrega', tag: 'Televendas' },
    { id: 'ECOMMERCE', label: 'Ecommerce', desc: 'Digital (com Figital) + Televendas', tag: 'Digital' },
    { id: 'REDE', label: 'Rede Completa', desc: 'Todos os Canais Consolidados', tag: 'Rede' }
  ];

  const CONSOLIDADO = 'TODAS AS INDÚSTRIAS (CONSOLIDADO)';
  const CONSOLIDADO_LINHA = 'TODAS AS LINHAS (CONSOLIDADO)';
  const CONSOLIDADO_PRODUTO = 'TODOS OS PRODUTOS (CONSOLIDADO)';
  const CONSOLIDADO_UF = 'TODAS AS UFS (CONSOLIDADO)';

  // Garante que os estados sejam arrays limpos com strings válidas
  const selectedArray = Array.isArray(selectedSupplier) 
    ? selectedSupplier.filter(s => typeof s === 'string' && s.trim().length > 0) 
    : (typeof selectedSupplier === 'string' ? [selectedSupplier] : [CONSOLIDADO]);
  const selectedLinhaArray = Array.isArray(selectedLinha) 
    ? selectedLinha.filter(l => typeof l === 'string' && l.trim().length > 0) 
    : (typeof selectedLinha === 'string' ? [selectedLinha] : [CONSOLIDADO_LINHA]);
  const selectedProductArray = Array.isArray(selectedProduct) 
    ? selectedProduct.filter(p => typeof p === 'string' && p.trim().length > 0) 
    : (typeof selectedProduct === 'string' ? [selectedProduct] : [CONSOLIDADO_PRODUTO]);
  const selectedUFArray = Array.isArray(selectedUFs) 
    ? selectedUFs.filter(u => typeof u === 'string' && u.trim().length > 0) 
    : (typeof selectedUFs === 'string' ? [selectedUFs] : [CONSOLIDADO_UF]);

  const handleToggleSupplier = (sup) => {
    const isConsolidado = sup === CONSOLIDADO || sup.includes('CONSOLIDADO');

    if (isConsolidado) {
      // Clicar no consolidado limpa tudo e só seleciona consolidado
      setSelectedSupplier([CONSOLIDADO]);
      return;
    }

    const currentHasConsolidado = selectedArray.some(s => s.includes('CONSOLIDADO'));
    const alreadySelected = selectedArray.includes(sup);

    if (currentHasConsolidado) {
      // Substitui consolidado pelo fornecedor clicado
      setSelectedSupplier([sup]);
      return;
    }

    if (alreadySelected) {
      // Desmarca — se ficar vazio, volta para Consolidado
      const next = selectedArray.filter(s => s !== sup);
      setSelectedSupplier(next.length > 0 ? next : [CONSOLIDADO]);
    } else {
      // Adiciona ao array
      setSelectedSupplier([...selectedArray, sup]);
    }
  };

  const handleToggleLinha = (linha) => {
    const isConsolidado = linha === CONSOLIDADO_LINHA || linha.includes('CONSOLIDADO');

    if (isConsolidado) {
      setSelectedLinha([CONSOLIDADO_LINHA]);
      return;
    }

    const currentHasConsolidado = selectedLinhaArray.some(l => l.includes('CONSOLIDADO'));
    const alreadySelected = selectedLinhaArray.includes(linha);

    if (currentHasConsolidado) {
      setSelectedLinha([linha]);
      return;
    }

    if (alreadySelected) {
      const next = selectedLinhaArray.filter(l => l !== linha);
      setSelectedLinha(next.length > 0 ? next : [CONSOLIDADO_LINHA]);
    } else {
      setSelectedLinha([...selectedLinhaArray, linha]);
    }
  };

  const handleToggleProduct = (prod) => {
    const isConsolidado = prod === CONSOLIDADO_PRODUTO || prod.includes('CONSOLIDADO');
    if (isConsolidado) {
      setSelectedProduct([CONSOLIDADO_PRODUTO]);
      return;
    }
    const currentHasConsolidado = selectedProductArray.some(p => p.includes('CONSOLIDADO'));
    const alreadySelected = selectedProductArray.includes(prod);

    if (currentHasConsolidado) {
      setSelectedProduct([prod]);
      return;
    }
    if (alreadySelected) {
      const next = selectedProductArray.filter(p => p !== prod);
      setSelectedProduct(next.length > 0 ? next : [CONSOLIDADO_PRODUTO]);
    } else {
      setSelectedProduct([...selectedProductArray, prod]);
    }
  };

  const handleToggleUF = (uf) => {
    const isConsolidado = uf === CONSOLIDADO_UF || uf.includes('CONSOLIDADO');
    if (isConsolidado) {
      setSelectedUFs([CONSOLIDADO_UF]);
      return;
    }

    const currentHasConsolidado = selectedUFArray.some(u => u.includes('CONSOLIDADO'));
    const alreadySelected = selectedUFArray.includes(uf);

    if (currentHasConsolidado) {
      setSelectedUFs([uf]);
      return;
    }

    if (alreadySelected) {
      const next = selectedUFArray.filter(u => u !== uf);
      setSelectedUFs(next.length > 0 ? next : [CONSOLIDADO_UF]);
    } else {
      setSelectedUFs([...selectedUFArray, uf]);
    }
  };

  const selectedCount = selectedArray.filter(s => typeof s === 'string' && !s.includes('CONSOLIDADO')).length;
  const isConsolidadoSelected = selectedArray.some(s => typeof s === 'string' && s.includes('CONSOLIDADO'));

  const selectedLinhaCount = selectedLinhaArray.filter(l => typeof l === 'string' && !l.includes('CONSOLIDADO')).length;
  const isConsolidadoLinhaSelected = selectedLinhaArray.some(l => typeof l === 'string' && l.includes('CONSOLIDADO'));

  const filteredSuppliers = (suppliersList || []).filter(s => 
    typeof s === 'string' && s.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const filteredLinhas = (linhasList || []).filter(l => 
    typeof l === 'string' && l.toLowerCase().includes((searchTermLinha || '').toLowerCase())
  );

  const handleSelectCustomPeriod = () => {
    const cur = Array.isArray(customCurrent) ? customCurrent.join(',') : customCurrent;
    const bas = Array.isArray(customBase) ? customBase.join(',') : customBase;
    setSelectedPeriod(`custom:${cur}_vs_${bas}`);
  };

  const filteredProducts = (productsList || []).filter(p => {
    if (typeof p !== 'string') return false;
    if (p.includes('CONSOLIDADO')) return true;
    const term = (searchTermProduct || '').toLowerCase().trim();
    if (!term) return true;
    if (p.toLowerCase().includes(term)) return true;
    const meta = productsMetadata?.[p];
    if (meta) {
      if (meta.id && String(meta.id).toLowerCase().includes(term)) return true;
      if (meta.ean && String(meta.ean).toLowerCase().includes(term)) return true;
      if (meta.linha && String(meta.linha).toLowerCase().includes(term)) return true;
      if (meta.subgrupo && String(meta.subgrupo).toLowerCase().includes(term)) return true;
    }
    return false;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-sm">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Filtros Globais do Painel JBP</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                  Base Unificada 2026
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Personalize o fornecedor, linha de produto, período e canais de vendas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SPLIT TWO-COLUMN DIAGRAMMING: LEFT 40% SUPPLIER & LINHA | RIGHT 60% PERIOD & CHANNELS) */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN (40%): FORNECEDOR & LINHA DE PRODUTO */}
          <div className="md:col-span-5 flex flex-col space-y-4 border-r-0 md:border-r border-slate-200 dark:border-slate-800 md:pr-5">
            
            {/* 1. INDÚSTRIA / FORNECEDOR */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Indústria / Fornecedor</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {selectedCount > 0 && !isConsolidadoSelected && (
                    <button
                      type="button"
                      onClick={() => setSelectedSupplier([CONSOLIDADO])}
                      className="text-[10px] text-red-500 hover:text-red-400 font-medium hover:underline transition-colors"
                      title="Voltar para Todas as Indústrias"
                    >
                      (Limpar)
                    </button>
                  )}
                  {selectedCount > 0 && (
                    <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                      {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {isConsolidadoSelected && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{filteredSuppliers.length} indústrias</span>
                  )}
                </div>
              </div>

              {/* Search Box Supplier */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Compact Supplier Scroll Area */}
              <div className="max-h-[170px] min-h-[130px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 divide-y divide-slate-100 dark:divide-slate-850/60 shadow-inner">
                {filteredSuppliers.slice(0, 80).map((sup) => {
                  const isConsolidado = sup.includes('CONSOLIDADO');
                  const isSelected = selectedArray.includes(sup);
                  return (
                    <button
                      key={sup}
                      onClick={() => handleToggleSupplier(sup)}
                      className={`w-full px-3 py-1.5 text-left text-[11px] font-medium flex items-center justify-between gap-2 transition-all ${
                        isSelected 
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border-l-3 border-emerald-500' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Checkbox visual */}
                      <span className={`shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}>
                        {isSelected && (
                          <svg viewBox="0 0 10 8" fill="none" className="w-2 h-2">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span className="truncate flex-1">{sup}</span>
                      {isConsolidado && (
                        <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">Geral</span>
                      )}
                    </button>
                  );
                })}
                {filteredSuppliers.length > 80 && (
                  <div className="py-2 px-3 text-center text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 font-medium">
                    Mostrando 80 de {filteredSuppliers.length} indústrias. Digite na busca acima para filtrar.
                  </div>
                )}
              </div>
            </div>

            {/* 2. LINHA DE PRODUTO (CONTEXTUAL BASED ON SELECTED SUPPLIER) */}
            <div className="flex flex-col space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Linha de Produto</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {selectedLinhaCount > 0 && !isConsolidadoLinhaSelected && (
                    <button
                      type="button"
                      onClick={() => setSelectedLinha([CONSOLIDADO_LINHA])}
                      className="text-[10px] text-red-500 hover:text-red-400 font-medium hover:underline transition-colors"
                      title="Voltar para Todas as Linhas"
                    >
                      (Limpar)
                    </button>
                  )}
                  {selectedLinhaCount > 0 && (
                    <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                      {selectedLinhaCount} selecionada{selectedLinhaCount > 1 ? 's' : ''}
                    </span>
                  )}
                  {isConsolidadoLinhaSelected && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{filteredLinhas.length} linhas</span>
                  )}
                </div>
              </div>

              {/* Search Box Linha */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar linha de produto..."
                  value={searchTermLinha}
                  onChange={(e) => setSearchTermLinha(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Compact Linha Scroll Area */}
              <div className="max-h-[170px] min-h-[130px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 divide-y divide-slate-100 dark:divide-slate-850/60 shadow-inner">
                {filteredLinhas.map((linha) => {
                  const isConsolidado = linha.includes('CONSOLIDADO');
                  const isSelected = selectedLinhaArray.includes(linha);
                  return (
                    <button
                      key={linha}
                      onClick={() => handleToggleLinha(linha)}
                      className={`w-full px-3 py-1.5 text-left text-[11px] font-medium flex items-center justify-between gap-2 transition-all ${
                        isSelected 
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border-l-3 border-emerald-500' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Checkbox visual */}
                      <span className={`shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}>
                        {isSelected && (
                          <svg viewBox="0 0 10 8" fill="none" className="w-2 h-2">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span className="truncate flex-1">{linha}</span>
                      {isConsolidado && (
                        <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">Geral</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. PRODUTO (SKU) */}
            <div className="flex flex-col space-y-1.5 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Produto (SKU)</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {productsList.length - 1} skus
                </span>
              </div>
              
              {/* Product Search */}
              <div className="relative group">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar produto por nome, SKU, EAN ou linha..."
                  value={searchTermProduct}
                  onChange={(e) => setSearchTermProduct(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 text-slate-900 dark:text-white text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Compact Product Scroll Area */}
              <div className="max-h-[170px] min-h-[130px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 divide-y divide-slate-100 dark:divide-slate-850/60 shadow-inner">
                {filteredProducts.slice(0, 60).map((prod) => {
                  const isConsolidado = prod.includes('CONSOLIDADO');
                  const isSelected = selectedProductArray.includes(prod);
                  const meta = productsMetadata?.[prod];
                  return (
                    <button
                      key={prod}
                      onClick={() => handleToggleProduct(prod)}
                      className={`w-full px-3 py-1.5 text-left text-[11px] font-medium flex items-center justify-between gap-2 transition-all ${
                        isSelected 
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border-l-3 border-emerald-500' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Checkbox visual */}
                      <span className={`shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}>
                        {isSelected && (
                          <svg viewBox="0 0 10 8" fill="none" className="w-2 h-2">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate">{prod}</span>
                        {meta?.id && (
                          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-1.5 truncate">
                            <span>SKU: {meta.id}</span>
                            {meta.linha && <span>• {meta.linha}</span>}
                          </span>
                        )}
                      </div>
                      {isConsolidado && (
                        <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">Geral</span>
                      )}
                    </button>
                  );
                })}
                {filteredProducts.length > 60 && (
                  <div className="py-2 px-3 text-center text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 font-medium">
                    Mostrando 60 de {filteredProducts.length} produtos. Refine a busca pelo nome, SKU ou EAN.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (62%): PERIOD COMPARISON & SALES CHANNELS */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            
            {/* SECTION: FREQUÊNCIA DE EVOLUÇÃO E COMPARATIVO */}
            {activeTab !== 'tab-live' ? (
              <div className="space-y-2">
                <label className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Frequência de Evolução</span>
                </label>

                {/* Grid 3-Cols of Comparison Tabs */}
                <div className="grid grid-cols-3 gap-1.5">
                  {comparisonTypes.map((ct) => {
                    const isActive = periodType === ct.id;
                    return (
                      <button
                        key={ct.id}
                        onClick={() => {
                          setPeriodType(ct.id);
                          if (ct.id === 'ytd') setSelectedPeriod('YTD');
                          if (ct.id === 'yoy') setSelectedPeriod(`yoy:${yoyMonth}`);
                        }}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          isActive 
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm' 
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate">{ct.name}</div>
                        <div className={`text-[9px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {ct.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Period Cards or Custom Selectors */}
                {periodType === 'ytd' ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-montserrat font-bold text-emerald-800 dark:text-emerald-300">
                        YTD (Acumulado no Ano) Ativo
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Período de comparação acumulado: Jan a {latestMonthLabel} de 2026 vs. Jan a {latestMonthLabel.replace('2026', '2025')} de 2025.
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>
                ) : periodType === 'yoy' ? (
                  /* YoY: 1 seletor de mês; base = mesmo mês do ano anterior (calculada automaticamente) */
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
                    <div className="text-[11px] font-bold text-emerald-400">Mês de Referência (Ano Atual):</div>
                    <select
                      value={yoyMonth}
                      onChange={(e) => {
                        setYoyMonth(e.target.value);
                        setSelectedPeriod(`yoy:${e.target.value}`);
                      }}
                      className="w-full bg-slate-950 text-white text-[11px] font-semibold border border-slate-800 rounded-lg p-1.5 focus:outline-none focus:border-emerald-500"
                    >
                      {availableMonths.filter(m => m.value.startsWith('2026-') || m.value.startsWith('2027-')).map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    {/* Mês base calculado automaticamente */}
                    {(() => {
                      const ym = (typeof yoyMonth === 'string' && yoyMonth.includes('-')) ? yoyMonth : (latestMonth || '2026-10');
                      const [y, mo] = ym.split('-');
                      const baseYoy = `${parseInt(y) - 1}-${mo}`;
                      const mNames = { '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun','07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez' };
                      const mLabel = mNames[mo] || mo;
                      return (
                        <div className="flex items-center gap-3 text-[10px] pt-1">
                          <span className="text-slate-400">Atual: <strong className="text-emerald-400">{mLabel}/{y}</strong></span>
                          <span className="text-slate-600">→</span>
                          <span className="text-slate-400">Base: <strong className="text-slate-300">{mLabel}/{parseInt(y)-1}</strong></span>
                          <span className="ml-auto text-[9px] text-slate-600 italic">base calculada automaticamente</span>
                        </div>
                      );
                    })()}
                  </div>
                ) : periodType !== 'custom' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {(presetPeriods[periodType] || []).map((p) => {
                      const isSelected = selectedPeriod === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPeriod(p.id)}
                          className={`p-2.5 text-left rounded-xl border transition-all flex flex-col justify-between ${
                            isSelected 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-300 ring-1 ring-emerald-500/40 font-bold' 
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className={`text-[11px] font-montserrat font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                              {p.label}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <span>Atual: <strong>{p.current}</strong></span>
                            <span>•</span>
                            <span>Base: <strong>{p.base}</strong></span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-3">
                    <div className="text-[11px] font-bold text-emerald-400">
                      Período Personalizado:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1.5">Mês Atual (Múltipla escolha):</label>
                        <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                          {availableMonths.map(m => {
                            const isSelected = Array.isArray(customCurrent) && customCurrent.includes(m.value);
                            return (
                              <button
                                key={m.value}
                                onClick={() => {
                                  let next;
                                  const currentArr = Array.isArray(customCurrent) ? customCurrent : [customCurrent];
                                  if (isSelected) {
                                    next = currentArr.filter(x => x !== m.value);
                                    if (next.length === 0) next = [m.value];
                                  } else {
                                    next = [...currentArr, m.value];
                                  }
                                  setCustomCurrent(next);
                                  const baseStr = Array.isArray(customBase) ? customBase.join(',') : customBase;
                                  setSelectedPeriod(`custom:${next.join(',')}_vs_${baseStr}`);
                                }}
                                className={`px-2 py-1.5 text-left text-[10px] rounded border transition-all flex items-center justify-between ${
                                  isSelected 
                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold' 
                                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                                }`}
                              >
                                {m.label}
                                {isSelected && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1.5">Mês Base (Múltipla escolha):</label>
                        <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                          {availableMonths.map(m => {
                            const isSelected = Array.isArray(customBase) && customBase.includes(m.value);
                            return (
                              <button
                                key={m.value}
                                onClick={() => {
                                  let next;
                                  const baseArr = Array.isArray(customBase) ? customBase : [customBase];
                                  if (isSelected) {
                                    next = baseArr.filter(x => x !== m.value);
                                    if (next.length === 0) next = [m.value];
                                  } else {
                                    next = [...baseArr, m.value];
                                  }
                                  setCustomBase(next);
                                  const currentStr = Array.isArray(customCurrent) ? customCurrent.join(',') : customCurrent;
                                  setSelectedPeriod(`custom:${currentStr}_vs_${next.join(',')}`);
                                }}
                                className={`px-2 py-1.5 text-left text-[10px] rounded border transition-all flex items-center justify-between ${
                                  isSelected 
                                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold' 
                                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                                }`}
                              >
                                {m.label}
                                {isSelected && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Filtro de Período Desativado</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[250px]">
                  A visão <strong>Ao Vivo</strong> consome dados em tempo real diretamente do Qlik Cloud SaaS e é sempre fixada no <strong>mês em andamento</strong>.
                </p>
              </div>
            )}

            {/* SECTION: CANAIS DE VENDA */}
            <div className="space-y-2">
              <label className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>Canal de Venda</span>
              </label>

              {/* Grid 2-Cols for Channel Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {channels.map((ch) => {
                  const isSelected = selectedChannel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChannel(ch.id)}
                      className={`p-2 text-left rounded-xl border transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {ch.label}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">{ch.desc}</p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CHANNEL HELP FOOTER NOTE */}
            <div className="p-2.5 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                <strong>Regra JBP:</strong> Digital (App+Site+Mktplace) • Televendas é canal independente da Loja Física.
              </span>
            </div>

            {/* SECTION: ESTADO (UF) */}
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>Estado (UF)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: CONSOLIDADO_UF, label: 'Todas as UFs', desc: 'Consolidado' },
                  { id: 'RS', label: 'Rio Grande do Sul', desc: 'Apenas RS' },
                  { id: 'SC', label: 'Santa Catarina', desc: 'Apenas SC' },
                  { id: 'PR', label: 'Paraná', desc: 'Apenas PR' }
                ].map(ufItem => {
                  const isSelected = selectedUFArray.includes(ufItem.id);
                  return (
                    <button
                      key={ufItem.id}
                      onClick={() => handleToggleUF(ufItem.id)}
                      className={`p-2 text-left rounded-xl border transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {ufItem.label}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate">{ufItem.desc}</p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
            <div>Fornecedor: <strong className="text-slate-900 dark:text-white">{supplierLabel || (selectedArray.length === 1 ? selectedArray[0] : `${selectedArray.length} selecionados`)}</strong></div>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <div>Linha: <strong className="text-slate-900 dark:text-white">{linhaLabel || (selectedLinhaArray.length === 1 ? selectedLinhaArray[0] : `${selectedLinhaArray.length} selecionadas`)}</strong></div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200 dark:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (periodType === 'custom') {
                  handleSelectCustomPeriod();
                }
                onApplyFilters();
                onClose();
              }}
              className="px-5 py-1.5 text-xs font-montserrat font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar Filtros</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
