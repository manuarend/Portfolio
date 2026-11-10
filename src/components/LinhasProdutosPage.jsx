import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, ShoppingBag, Search, Download, ArrowUpDown, TrendingUp, TrendingDown, 
  Filter, X, LineChart as LineChartIcon, Sparkles, SlidersHorizontal, ChevronUp, 
  ChevronDown, ChevronRight, ChevronLeft, RotateCcw, Eye, EyeOff, MoveLeft, MoveRight, GripVertical, BarChart2,
  Calendar, Table, CheckSquare, Square, Grid, ListFilter, Settings, Sliders, Sigma, Rows, Columns, Plus, Trash2, ArrowDown, ArrowUp, Move, MinusSquare, PlusSquare
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { exportToCSV } from '../utils/csvExporter';

// FIELD TO COLUMN ID MAP FOR PIVOT TABLE SYNC
const FIELD_TO_COL_MAP = {
  'VL_LIQUIDO': 'faturamentoRede',
  'faturamentoRede': 'faturamentoRede',
  'FAT_DIGITAL': 'faturamentoDigital',
  'faturamentoDigital': 'faturamentoDigital',
  'pesoIndLinhaRede': 'pesoIndLinhaRede',
  'pesoIndLinhaDigital': 'pesoIndLinhaDigital',
  'SHARE_REDE': 'shareRede',
  'shareRede': 'shareRede',
  'SHARE_DIGITAL': 'shareDigital',
  'shareDigital': 'shareDigital',
  'SHARE_CAT_REDE': 'shareCatRede',
  'shareCatRede': 'shareCatRede',
  'SHARE_CAT_DIGITAL': 'shareCatDigital',
  'shareCatDigital': 'shareCatDigital',
  'CRESCEMENTO_REDE': 'crescimentoRede',
  'crescimentoRede': 'crescimentoRede',
  'crescimentoLinhaRede': 'crescimentoLinhaRede',
  'CRESCIMENTO_LINHA_REDE': 'crescimentoLinhaRede',
  'CRESCEMENTO_DIGITAL': 'crescimentoDigital',
  'crescimentoDigital': 'crescimentoDigital',
  'crescimentoLinhaDigital': 'crescimentoLinhaDigital',
  'CRESCIMENTO_LINHA_DIGITAL': 'crescimentoLinhaDigital',
};

// 22 REAL JBP FIELDS CATALOG WITH CLEAN PT-BR LABELS
const ALL_JBP_FIELDS = [
  { id: 'ANO_MES', label: '📅 Ano / Mês (ANO_MES)', category: 'Período', type: 'dimension', defaultArea: 'filtros' },
  { id: 'NOME_LABORATORIO', label: '🏢 Laboratório / Indústria (NOME_LABORATORIO)', category: 'Fornecedor', type: 'dimension', defaultArea: 'field_list' },
  { id: 'PRODUTO_DEPARTAMENTO', label: '🏢 Departamento (PRODUTO_DEPARTAMENTO)', category: 'Hierarquia', type: 'dimension', defaultArea: 'field_list' },
  { id: 'GRUPO_NOME', label: '🏷️ Categoria / Grupo (GRUPO_NOME)', category: 'Hierarquia', type: 'dimension', defaultArea: 'field_list' },
  { id: 'SUBGRUPO_NOME', label: '📂 Subgrupo (SUBGRUPO_NOME)', category: 'Hierarquia', type: 'dimension', defaultArea: 'field_list' },
  { id: 'NOME_LINHA', label: '📁 Linha de Produto (NOME_LINHA)', category: 'Hierarquia', type: 'dimension', defaultArea: 'linhas' },
  { id: 'PRODUTOAGRUPAMENTO_NOME', label: '📦 Agrupamento de Produto (PRODUTOAGRUPAMENTO_NOME)', category: 'Hierarquia', type: 'dimension', defaultArea: 'field_list' },
  { id: 'CATEGORIA_ECOMMERCE_NOME', label: '📱 Categoria E-commerce (CATEGORIA_ECOMMERCE_NOME)', category: 'Canal', type: 'dimension', defaultArea: 'field_list' },
  { id: 'PRODUTO_NOME', label: '🛍️ Nome Completo Produto (PRODUTO_NOME)', category: 'Produto', type: 'dimension', defaultArea: 'field_list' },
  { id: 'PRODUTO_NOME_RESUMIDO', label: '🏷️ Nome Resumido Produto (PRODUTO_NOME_RESUMIDO)', category: 'Produto', type: 'dimension', defaultArea: 'field_list' },
  { id: 'PRODUTO_ID', label: '🔢 Código SKU (PRODUTO_ID)', category: 'Produto', type: 'dimension', defaultArea: 'field_list' },
  { id: 'PRODUTO_EAN', label: '📊 Código Barcode EAN (PRODUTO_EAN)', category: 'Produto', type: 'dimension', defaultArea: 'field_list' },
  { id: 'CANALDET', label: '🌐 Canal Detalhado (CANALDET)', category: 'Canal', type: 'dimension', defaultArea: 'field_list' },
  { id: 'UF', label: '📍 Estado (UF)', category: 'Geografia', type: 'dimension', defaultArea: 'field_list' },
  { id: 'CIDADE', label: '🏙️ Cidade (CIDADE)', category: 'Geografia', type: 'dimension', defaultArea: 'field_list' },
  { id: 'FLAG_RECARGA', label: '🔄 Indicador de Recarga (FLAG_RECARGA)', category: 'Atributo', type: 'dimension', defaultArea: 'field_list' },
  
  // METRICS / VALUES
  { id: 'VL_LIQUIDO', label: '💰 Valor Líquido / Fat. Rede (VL_LIQUIDO)', category: 'Métrica', type: 'value', defaultArea: 'valores' },
  { id: 'FAT_DIGITAL', label: '📱 Faturamento Digital (FAT_DIGITAL)', category: 'Métrica', type: 'value', defaultArea: 'valores' },
  { id: 'QT_VENDIDA', label: '📦 Quantidade Vendida (QT_VENDIDA)', category: 'Métrica', type: 'value', defaultArea: 'valores' },
  { id: 'CUSTO_COMPRA', label: '💵 Custo de Compra (CUSTO_COMPRA)', category: 'Métrica', type: 'value', defaultArea: 'field_list' },
  { id: 'pesoIndLinhaRede', label: '⚖️ Peso Indústria na Linha - Rede', category: 'Métrica', type: 'value', defaultArea: 'colunas' },
  { id: 'pesoIndLinhaDigital', label: '⚖️ Peso Indústria na Linha - Digital', category: 'Métrica', type: 'value', defaultArea: 'colunas' },
  { id: 'SHARE_REDE', label: '📈 Share Indústria Rede (SH. IND. R.)', category: 'Métrica', type: 'value', defaultArea: 'colunas' },
  { id: 'SHARE_DIGITAL', label: '📱 Share Indústria Digital (SH. IND. D.)', category: 'Métrica', type: 'value', defaultArea: 'colunas' },
  { id: 'SHARE_CAT_REDE', label: '🏆 Share Rede Total (SH. REDE TOTAL)', category: 'Métrica', type: 'value', defaultArea: 'field_list' },
  { id: 'SHARE_CAT_DIGITAL', label: '🏆 Share Digital Total (SH. DIG. TOTAL)', category: 'Métrica', type: 'value', defaultArea: 'field_list' },
  { id: 'CRESCEMENTO_REDE', label: '🚀 Δ Indústria Rede (Δ IND. R.)', category: 'Métrica', type: 'value', defaultArea: 'colunas' },
  { id: 'crescimentoLinhaRede', label: '🚀 Δ Linha na Rede (Δ LINHA R.)', category: 'Métrica', type: 'value', defaultArea: 'colunas' },
  { id: 'CRESCEMENTO_DIGITAL', label: '🚀 Δ Indústria Digital (Δ IND. D.)', category: 'Métrica', type: 'value', defaultArea: 'colunas' },
  { id: 'crescimentoLinhaDigital', label: '🚀 Δ Linha no Digital (Δ LINHA D.)', category: 'Métrica', type: 'value', defaultArea: 'colunas' },
];

const CANONICAL_COL_ORDER = [
  'faturamentoRede',
  'crescimentoRede',
  'shareRede',
  'pesoIndLinhaRede',
  'crescimentoLinhaRede',
  'shareCatRede',
  'faturamentoDigital',
  'crescimentoDigital',
  'shareDigital',
  'pesoIndLinhaDigital',
  'crescimentoLinhaDigital',
  'shareCatDigital',
];

const DEFAULT_LINHA_COLS = [
  // BLOCO 1: REDE (Loja Física + Televendas + Digital)
  { id: 'faturamentoRede', label: 'FAT. REDE', title: 'Receita em reais gerada em todos os canais somados (físico + digital).', visible: true, align: 'right' },
  { id: 'crescimentoRede', label: 'Δ R.', title: 'Δ (%) das vendas gerais contra o período anterior.', visible: true, align: 'right' },
  { id: 'shareRede', label: 'SH. IND. R.', title: '% de peso do item dentro das vendas do seu próprio fabricante.', visible: true, align: 'right' },
  { id: 'pesoIndLinhaRede', label: 'PESO IND. LINHA (R)', title: 'Peso / Share da indústria dentro desta linha na REDE (Fat. Indústria na Linha ÷ Fat. Total da Linha na Rede).', visible: true, align: 'right', highlight: true },
  { id: 'crescimentoLinhaRede', label: 'Δ LINHA R.', title: 'Δ (%) das vendas totais da linha inteira na REDE (todas as marcas).', visible: false, align: 'right', highlight: true },
  { id: 'shareCatRede', label: 'SH. REDE TOTAL', title: '% de peso do item perante a farmácia inteira (todas as marcas).', visible: false, align: 'right' },

  // BLOCO 2: DIGITAL (App + Site + Marketplace)
  { id: 'faturamentoDigital', label: 'FAT. DIGITAL', title: 'Receita em reais gerada exclusivamente nos canais digitais.', visible: true, align: 'right' },
  { id: 'crescimentoDigital', label: 'Δ D.', title: 'Δ (%) das vendas digitais contra o período anterior.', visible: true, align: 'right' },
  { id: 'shareDigital', label: 'SH. IND. D.', title: '% de peso do item dentro das vendas digitais do seu próprio fabricante.', visible: true, align: 'right' },
  { id: 'pesoIndLinhaDigital', label: 'PESO IND. LINHA (D)', title: 'Peso / Share da indústria dentro desta linha no DIGITAL (Fat. Digital da Indústria na Linha ÷ Fat. Digital Total da Linha).', visible: true, align: 'right', highlight: true },
  { id: 'crescimentoLinhaDigital', label: 'Δ LINHA D.', title: 'Δ (%) das vendas totais da linha inteira no DIGITAL (todas as marcas).', visible: false, align: 'right', highlight: true },
  { id: 'shareCatDigital', label: 'SH. DIG. TOTAL', title: '% de peso do item perante as vendas digitais da farmácia inteira.', visible: false, align: 'right' },
];

const DEFAULT_PRODUTO_COLS = [
  // BLOCO 1: REDE (Loja Física + Televendas + Digital)
  { id: 'faturamentoRede', label: 'FAT. REDE', title: 'Receita em reais gerada em todos os canais somados (físico + digital).', visible: true, align: 'right' },
  { id: 'crescimentoRede', label: 'Δ R.', title: 'Δ (%) das vendas gerais contra o período anterior.', visible: true, align: 'right' },
  { id: 'shareRede', label: 'SH. IND. R.', title: '% de peso do item dentro das vendas do seu próprio fabricante.', visible: true, align: 'right' },
  { id: 'pesoIndLinhaRede', label: 'PESO IND. LINHA (R)', title: 'Peso / Share da indústria dentro desta linha na REDE (Fat. Indústria na Linha ÷ Fat. Total da Linha na Rede).', visible: true, align: 'right', highlight: true },
  { id: 'crescimentoLinhaRede', label: 'Δ LINHA R.', title: 'Δ (%) das vendas totais da linha inteira na REDE (todas as marcas).', visible: false, align: 'right', highlight: true },
  { id: 'shareCatRede', label: 'SH. REDE TOTAL', title: '% de peso do item perante a farmácia inteira (todas as marcas).', visible: false, align: 'right' },

  // BLOCO 2: DIGITAL (App + Site + Marketplace)
  { id: 'faturamentoDigital', label: 'FAT. DIGITAL', title: 'Receita em reais gerada exclusivamente nos canais digitais.', visible: true, align: 'right' },
  { id: 'crescimentoDigital', label: 'Δ D.', title: 'Δ (%) das vendas digitais contra o período anterior.', visible: true, align: 'right' },
  { id: 'shareDigital', label: 'SH. IND. D.', title: '% de peso do item dentro das vendas digitais do seu próprio fabricante.', visible: true, align: 'right' },
  { id: 'pesoIndLinhaDigital', label: 'PESO IND. LINHA (D)', title: 'Peso / Share da indústria dentro desta linha no DIGITAL (Fat. Digital da Indústria na Linha ÷ Fat. Digital Total da Linha).', visible: true, align: 'right', highlight: true },
  { id: 'crescimentoLinhaDigital', label: 'Δ LINHA D.', title: 'Δ (%) das vendas totais da linha inteira no DIGITAL (todas as marcas).', visible: false, align: 'right', highlight: true },
  { id: 'shareCatDigital', label: 'SH. DIG. TOTAL', title: '% de peso do item perante as vendas digitais da farmácia inteira.', visible: false, align: 'right' },
];

export default function LinhasProdutosPage({ 
  activeSupplierData = {}, 
  consolidatedData = {},
  categoryTotals = {},
  allSuppliers = [],
  currentMonth = '2026-10', 
  baseMonth = '2025-10', 
  periodLabel = 'Out/2026 vs. Out/2025 (YoY)',
  selectedSupplier = ['TODAS AS INDÚSTRIAS (CONSOLIDADO)'],
  supplierLabel = 'Todas as Indústrias',
  selectedPeriod = 'yoy:2026-10',
  latestMonth = '2026-10',
  onOpenFilter = () => {}
}) {
  const [searchLinha, setSearchLinha] = useState('');
  const [searchProduto, setSearchProduto] = useState('');

  // Os filtros de mês/período vêm diretamente dos props globais (App.jsx)
  // effectiveCurrentMonth e effectiveBaseMonth agora são os mesmos do filtro global
  const effectiveCurrentMonth = currentMonth;
  const effectiveBaseMonth = baseMonth;

  const { ytdCurrentMonths, ytdBaseMonths } = useMemo(() => {
    const currentYear = latestMonth.split('-')[0];
    const limitMonth = parseInt(latestMonth.split('-')[1]);
    const curr = [];
    const base = [];
    const baseYear = String(parseInt(currentYear) - 1);
    for (let i = 1; i <= limitMonth; i++) {
      const mStr = String(i).padStart(2, '0');
      curr.push(`${currentYear}-${mStr}`);
      base.push(`${baseYear}-${mStr}`);
    }
    return { ytdCurrentMonths: curr, ytdBaseMonths: base };
  }, [latestMonth]);

  const isYtd = useMemo(() => {
    return selectedPeriod && String(selectedPeriod).toUpperCase().includes('YTD');
  }, [selectedPeriod]);

  // Períodos ativos resolvidos (suporta YTD, mês individual ou lista customizada de meses)
  const activeCurrentMonths = useMemo(() => {
    if (isYtd) return ytdCurrentMonths;
    if (Array.isArray(effectiveCurrentMonth)) return effectiveCurrentMonth;
    return [effectiveCurrentMonth];
  }, [isYtd, ytdCurrentMonths, effectiveCurrentMonth]);

  const activeBaseMonths = useMemo(() => {
    if (isYtd) return ytdBaseMonths;
    if (Array.isArray(effectiveBaseMonth)) return effectiveBaseMonth;
    return [effectiveBaseMonth];
  }, [isYtd, ytdBaseMonths, effectiveBaseMonth]);

  // QUADRANTS FIELD STATE (Allows moving ANY of the 20 fields freely between Filtros, Linhas, Colunas, Valores!)
  const [filtrosFields, setFiltrosFields] = useState(['ANO_MES']);
  const [linhaRowFields, setLinhaRowFields] = useState(['NOME_LINHA']);
  const [produtoRowFields, setProdutoRowFields] = useState(['PRODUTO_NOME']);
  const [valoresFields, setValoresFields] = useState(['VL_LIQUIDO', 'FAT_DIGITAL', 'QT_VENDIDA']);

  // Expanded Tree Groups State for Excel Tree View
  const [expandedGroups, setExpandedGroups] = useState({});

  // Toggle Group Expansion
  const toggleGroupExpand = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: prev[groupKey] === undefined ? true : !prev[groupKey]
    }));
  };

  const expandAllGroups = (keys) => {
    const obj = {};
    keys.forEach(k => { obj[k] = true; });
    setExpandedGroups(obj);
  };

  const collapseAllGroups = () => {
    setExpandedGroups({});
  };

  // Dynamic Chart Metric Selector
  const [chartMetric, setChartMetric] = useState('faturamento_both'); 

  // Selected Item Filters (Clicking row filters chart & second table)
  const [selectedLinha, setSelectedLinha] = useState(null);
  const [selectedProduto, setSelectedProduto] = useState(null);

  const [sortLinhaKey, setSortLinhaKey] = useState('faturamentoRede');
  const [sortLinhaOrder, setSortLinhaOrder] = useState('desc');

  const [sortProdutoKey, setSortProdutoKey] = useState('faturamentoRede');
  const [sortProdutoOrder, setSortProdutoOrder] = useState('desc');

  // Pagination State for Table 2 (Produtos)
  const [produtoPage, setProdutoPage] = useState(1);
  const [produtoPageSize, setProdutoPageSize] = useState(50); // 25, 50, 100, or 'all'

  // Reset page when filters, sorting or search change
  useEffect(() => {
    setProdutoPage(1);
  }, [selectedLinha, searchProduto, sortProdutoKey, sortProdutoOrder, produtoRowFields, activeSupplierData]);

  // Dynamic Column Manager State
  const [linhaCols, setLinhaCols] = useState(DEFAULT_LINHA_COLS);
  const [produtoCols, setProdutoCols] = useState(DEFAULT_PRODUTO_COLS);

  // Excel PivotTable Field List Modal State
  const [activePivotModal, setActivePivotModal] = useState(null); // null | 'linha' | 'produto'
  const [pivotSearchField, setPivotSearchField] = useState('');

  // Drag and drop state for table headers
  const [draggedLinhaIdx, setDraggedLinhaIdx] = useState(null);
  const [draggedProdutoIdx, setDraggedProdutoIdx] = useState(null);

  // Drag and Drop state for Pivot Quadrants
  const [draggedFieldId, setDraggedFieldId] = useState(null);

  // Format Helpers
  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val || 0);
  const formatCompactBRL = (val) => {
    if (!val) return 'R$ 0';
    if (Math.abs(val) >= 1e6) return `R$ ${(val / 1e6).toFixed(1)}M`;
    if (Math.abs(val) >= 1e3) return `R$ ${(val / 1e3).toFixed(0)}k`;
    return `R$ ${val.toFixed(0)}`;
  };
  const formatPercent = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0.0%';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  const displaySupplier = useMemo(() => {
    if (supplierLabel) return supplierLabel;
    if (Array.isArray(selectedSupplier)) {
      if (selectedSupplier.length === 0 || selectedSupplier.some(s => s.includes('CONSOLIDADO') || s.includes('TODAS AS IND'))) return 'Todas as Indústrias';
      if (selectedSupplier.length === 1) return selectedSupplier[0];
      return `${selectedSupplier.length} fornecedores selecionados`;
    }
    return String(selectedSupplier || 'Todas as Indústrias');
  }, [selectedSupplier, supplierLabel]);

  // Helper to determine if Consolidado / Todas as Indústrias is active
  const isConsolidated = useMemo(() => {
    if (!selectedSupplier) return true;
    if (Array.isArray(selectedSupplier)) {
      if (selectedSupplier.length === 0) return true;
      if (selectedSupplier.length === 1) {
        const s = String(selectedSupplier[0]).trim().toUpperCase();
        return (
          s.includes('CONSOLIDADO') ||
          s.includes('TODAS AS INDÚSTRIAS') ||
          s.includes('TODAS AS INDUSTRIAS') ||
          s.includes('TODOS OS FORNECEDORES') ||
          s === 'TODAS' ||
          s === 'ALL'
        );
      }
      // Se há 2 ou mais fornecedores selecionados (ex: Nestle Nutrition + Nestle Brasil Ltda), É UMA SELEÇÃO ESPECÍFICA!
      return false;
    }
    const s = String(selectedSupplier).trim().toUpperCase();
    return (
      s.includes('CONSOLIDADO') ||
      s.includes('TODAS AS INDÚSTRIAS') ||
      s.includes('TODAS AS INDUSTRIAS') ||
      s.includes('TODOS OS FORNECEDORES') ||
      s === 'TODAS' ||
      s === 'ALL'
    );
  }, [selectedSupplier]);

  const isSpecificSupplier = !isConsolidated;

  useEffect(() => {
    setLinhaCols(prev => {
      const map = new Map(prev.map(c => [c.id, c]));
      return CANONICAL_COL_ORDER.map(colId => {
        const c = map.get(colId) || DEFAULT_LINHA_COLS.find(d => d.id === colId);
        if (colId === 'crescimentoRede') {
          return { ...c, label: isSpecificSupplier ? 'Δ IND. R.' : 'Δ R.' };
        }
        if (colId === 'crescimentoDigital') {
          return { ...c, label: isSpecificSupplier ? 'Δ IND. D.' : 'Δ D.' };
        }
        if (colId === 'crescimentoLinhaRede') {
          return { ...c, label: 'Δ LINHA R.', visible: isSpecificSupplier };
        }
        if (colId === 'crescimentoLinhaDigital') {
          return { ...c, label: 'Δ LINHA D.', visible: isSpecificSupplier };
        }
        return c;
      });
    });

    setProdutoCols(prev => {
      const map = new Map(prev.map(c => [c.id, c]));
      return CANONICAL_COL_ORDER.map(colId => {
        const c = map.get(colId) || DEFAULT_PRODUTO_COLS.find(d => d.id === colId);
        if (colId === 'crescimentoRede') {
          return { ...c, label: isSpecificSupplier ? 'Δ IND. R.' : 'Δ R.' };
        }
        if (colId === 'crescimentoDigital') {
          return { ...c, label: isSpecificSupplier ? 'Δ IND. D.' : 'Δ D.' };
        }
        if (colId === 'crescimentoLinhaRede') {
          return { ...c, label: 'Δ LINHA R.', visible: isSpecificSupplier };
        }
        if (colId === 'crescimentoLinhaDigital') {
          return { ...c, label: 'Δ LINHA D.', visible: isSpecificSupplier };
        }
        return c;
      });
    });
  }, [isSpecificSupplier]);

  // Active Visible Columns
  const activeLinhaCols = useMemo(() => linhaCols.filter(c => c.visible), [linhaCols]);
  const activeProdutoCols = useMemo(() => produtoCols.filter(c => c.visible), [produtoCols]);

  // Column Visibility Handlers
  const toggleLinhaCol = (colId) => {
    const targetId = FIELD_TO_COL_MAP[colId] || colId;
    setLinhaCols(prev => prev.map(c => (c.id === targetId || c.id === colId) ? { ...c, visible: !c.visible } : c));
  };

  const toggleProdutoCol = (colId) => {
    const targetId = FIELD_TO_COL_MAP[colId] || colId;
    setProdutoCols(prev => prev.map(c => (c.id === targetId || c.id === colId) ? { ...c, visible: !c.visible } : c));
  };

  // Hierarchy Row Reorder Handlers
  const moveLinhaRowField = (index, direction) => {
    setLinhaRowFields(prev => {
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const arr = [...prev];
      const item = arr[index];
      arr[index] = arr[targetIdx];
      arr[targetIdx] = item;
      return arr;
    });
  };

  const moveProdutoRowField = (index, direction) => {
    setProdutoRowFields(prev => {
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const arr = [...prev];
      const item = arr[index];
      arr[index] = arr[targetIdx];
      arr[targetIdx] = item;
      return arr;
    });
  };

  // Move a field between any of the 4 Pivot Areas
  const moveFieldToArea = (fieldId, targetArea) => {
    const colId = FIELD_TO_COL_MAP[fieldId] || fieldId;

    setFiltrosFields(prev => prev.filter(id => id !== fieldId && id !== colId));
    if (activePivotModal === 'linha') {
      setLinhaRowFields(prev => {
        const next = prev.filter(id => id !== fieldId && id !== colId);
        return (targetArea === 'linhas' || next.length > 0) ? next : ['NOME_LINHA'];
      });
    } else {
      setProdutoRowFields(prev => {
        const next = prev.filter(id => id !== fieldId && id !== colId);
        return (targetArea === 'linhas' || next.length > 0) ? next : ['PRODUTO_NOME'];
      });
    }
    setValoresFields(prev => prev.filter(id => id !== fieldId && id !== colId));

    if (targetArea === 'filtros') {
      setFiltrosFields(prev => prev.includes(fieldId) ? prev : [...prev, fieldId]);
      if (activePivotModal === 'linha') {
        setLinhaCols(prev => prev.map(c => (c.id === colId || c.id === fieldId) ? { ...c, visible: false } : c));
      } else {
        setProdutoCols(prev => prev.map(c => (c.id === colId || c.id === fieldId) ? { ...c, visible: false } : c));
      }
    } else if (targetArea === 'linhas') {
      if (activePivotModal === 'linha') {
        setLinhaRowFields(prev => prev.includes(fieldId) ? prev : [...prev, fieldId]);
        setLinhaCols(prev => prev.map(c => (c.id === colId || c.id === fieldId) ? { ...c, visible: false } : c));
      } else {
        setProdutoRowFields(prev => prev.includes(fieldId) ? prev : [...prev, fieldId]);
        setProdutoCols(prev => prev.map(c => (c.id === colId || c.id === fieldId) ? { ...c, visible: false } : c));
      }
    } else if (targetArea === 'valores') {
      setValoresFields(prev => prev.includes(fieldId) ? prev : [...prev, fieldId]);
      if (activePivotModal === 'linha') {
        setLinhaCols(prev => prev.map(c => (c.id === colId || c.id === fieldId) ? { ...c, visible: false } : c));
      } else {
        setProdutoCols(prev => prev.map(c => (c.id === colId || c.id === fieldId) ? { ...c, visible: false } : c));
      }
    } else if (targetArea === 'colunas') {
      if (activePivotModal === 'linha') {
        setLinhaCols(prev => prev.map(c => (c.id === colId || c.id === fieldId) ? { ...c, visible: true } : c));
      } else {
        setProdutoCols(prev => prev.map(c => (c.id === colId || c.id === fieldId) ? { ...c, visible: true } : c));
      }
    } else if (targetArea === 'none' || targetArea === 'field_list') {
      if (activePivotModal === 'linha') {
        setLinhaCols(prev => prev.map(c => (c.id === colId || c.id === fieldId) ? { ...c, visible: false } : c));
      } else {
        setProdutoCols(prev => prev.map(c => (c.id === colId || c.id === fieldId) ? { ...c, visible: false } : c));
      }
    }
  };

  // Drag and Drop Handlers for Table Headers
  const handleLinhaHeaderDrop = (targetIndex) => {
    if (draggedLinhaIdx === null || draggedLinhaIdx === targetIndex) return;
    setLinhaCols(prev => {
      const arr = [...prev];
      const visibleCols = arr.filter(c => c.visible);
      const itemToMove = visibleCols[draggedLinhaIdx];
      const targetItem = visibleCols[targetIndex];
      
      const realSrcIdx = arr.findIndex(c => c.id === itemToMove.id);
      const realTargetIdx = arr.findIndex(c => c.id === targetItem.id);

      arr.splice(realSrcIdx, 1);
      arr.splice(realTargetIdx, 0, itemToMove);
      return arr;
    });
    setDraggedLinhaIdx(null);
  };

  const handleProdutoHeaderDrop = (targetIndex) => {
    if (draggedProdutoIdx === null || draggedProdutoIdx === targetIndex) return;
    setProdutoCols(prev => {
      const arr = [...prev];
      const visibleCols = arr.filter(c => c.visible);
      const itemToMove = visibleCols[draggedProdutoIdx];
      const targetItem = visibleCols[targetIndex];

      const realSrcIdx = arr.findIndex(c => c.id === itemToMove.id);
      const realTargetIdx = arr.findIndex(c => c.id === targetItem.id);

      arr.splice(realSrcIdx, 1);
      arr.splice(realTargetIdx, 0, itemToMove);
      return arr;
    });
    setDraggedProdutoIdx(null);
  };

  // 1. Compute Active Supplier Totals for current and base months (YTD-aware)
  // 1. Compute Active Supplier Totals for current and base months (Unificado para todos os períodos)
  const supplierTotals = useMemo(() => {
    const monthsObj = activeSupplierData.months || {};

    const getDigitalRev = (chObj) => {
      if (!chObj) return 0;
      return (chObj['App']?.revenue || chObj['APP']?.revenue || 0) +
             (chObj['Site']?.revenue || chObj['SITE']?.revenue || 0) +
             (chObj['Marketplace']?.revenue || chObj['MARKETPLACE']?.revenue || 0);
    };

    let redeCurrent = 0, digitalCurrent = 0, redeBase = 0, digitalBase = 0;

    activeCurrentMonths.forEach(m => {
      const mObj = monthsObj[m] || { revenue: 0, channels: {} };
      redeCurrent += mObj.revenue || 0;
      digitalCurrent += getDigitalRev(mObj.channels);
    });

    activeBaseMonths.forEach(m => {
      const mObj = monthsObj[m] || { revenue: 0, channels: {} };
      redeBase += mObj.revenue || 0;
      digitalBase += getDigitalRev(mObj.channels);
    });

    return { redeCurrent, digitalCurrent, redeBase, digitalBase };
  }, [activeSupplierData, activeCurrentMonths, activeBaseMonths]);

  // 1.1 Compute Network-wide Totals (ALL MARKS / ALL CATEGORIES) — Unificado para todos os períodos
  const networkTotals = useMemo(() => {
    const monthsObj = consolidatedData?.months || {};

    const getDigitalRev = (chObj) => {
      if (!chObj) return 0;
      return (chObj['App']?.revenue || chObj['APP']?.revenue || 0) +
             (chObj['Site']?.revenue || chObj['SITE']?.revenue || 0) +
             (chObj['Marketplace']?.revenue || chObj['MARKETPLACE']?.revenue || 0);
    };

    let redeCurrent = 0, digitalCurrent = 0, redeBase = 0, digitalBase = 0;

    activeCurrentMonths.forEach(m => {
      const mObj = monthsObj[m] || { revenue: 0, channels: {} };
      redeCurrent += mObj.revenue || 0;
      digitalCurrent += getDigitalRev(mObj.channels);
    });

    activeBaseMonths.forEach(m => {
      const mObj = monthsObj[m] || { revenue: 0, channels: {} };
      redeBase += mObj.revenue || 0;
      digitalBase += getDigitalRev(mObj.channels);
    });

    if (redeCurrent === 0) redeCurrent = 872847558;
    if (digitalCurrent === 0) digitalCurrent = 54712694;

    const crescRede = redeBase > 0 ? ((redeCurrent - redeBase) / redeBase) * 100 : 0;
    const crescDigital = digitalBase > 0 ? ((digitalCurrent - digitalBase) / digitalBase) * 100 : 0;

    return { redeCurrent, digitalCurrent, redeBase, digitalBase, crescRede, crescDigital };
  }, [consolidatedData, activeCurrentMonths, activeBaseMonths]);

  // Indexed map of consolidated lines across the entire network (Todas as Indústrias)
  const consolidatedLinhasMap = useMemo(() => {
    const map = new Map();
    const rawLinhas = consolidatedData?.linhas || [];
    rawLinhas.forEach(l => {
      if (l.nome_linha) {
        map.set(l.nome_linha.trim().toUpperCase(), l);
      }
    });
    return map;
  }, [consolidatedData]);

  // Helper com Cache O(1) para obter totais de rede de qualquer linha de produto instantaneamente
  const consolidatedLinhaTotalsCache = useMemo(() => {
    const cache = new Map();
    consolidatedLinhasMap.forEach((cl, key) => {
      if (!cl || !cl.months) return;
      let rede = 0, digital = 0, redeBase = 0, digitalBase = 0;
      activeCurrentMonths.forEach(m => {
        const mObj = cl.months[m] || { rede_revenue: 0, digital_revenue: 0 };
        rede += mObj.rede_revenue || 0;
        digital += mObj.digital_revenue || 0;
      });
      activeBaseMonths.forEach(m => {
        const mObj = cl.months[m] || { rede_revenue: 0, digital_revenue: 0 };
        redeBase += mObj.rede_revenue || 0;
        digitalBase += mObj.digital_revenue || 0;
      });
      const crescRede = redeBase > 0 ? ((rede - redeBase) / redeBase) * 100 : (rede > 0 ? 100 : 0);
      const crescDigital = digitalBase > 0 ? ((digital - digitalBase) / digitalBase) * 100 : (digital > 0 ? 100 : 0);
      cache.set(key, { rede, digital, redeBase, digitalBase, crescRede, crescDigital });
    });
    return cache;
  }, [consolidatedLinhasMap, activeCurrentMonths, activeBaseMonths]);

  const getConsolidatedLinhaTotals = (nomeLinha) => {
    if (!nomeLinha) return { rede: 0, digital: 0, redeBase: 0, digitalBase: 0, crescRede: 0, crescDigital: 0 };
    const key = nomeLinha.trim().toUpperCase();
    return consolidatedLinhaTotalsCache.get(key) || { rede: 0, digital: 0, redeBase: 0, digitalBase: 0, crescRede: 0, crescDigital: 0 };
  };

  // 1. Pré-indexação de produtos por linha consolidada (O(1) instantâneo, elimina congelamento)
  const consolidatedProductsByLinha = useMemo(() => {
    const map = new Map();
    if (!allSuppliers || allSuppliers.length === 0) return map;
    for (let i = 0; i < allSuppliers.length; i++) {
      const prods = allSuppliers[i].top_products;
      if (!prods) continue;
      for (let j = 0; j < prods.length; j++) {
        const p = prods[j];
        if (p.linha) {
          const k = p.linha.trim().toLowerCase();
          if (!map.has(k)) map.set(k, []);
          const list = map.get(k);
          if (list.length < 60 && !list.some(item => item.id === p.id)) {
            list.push(p);
          }
        }
      }
    }
    return map;
  }, [allSuppliers]);

  // Helper universal para extrair qualquer dimensão de produto
  const getProductDimensionValue = (prodObj, dimName, monthKey) => {
    if (!prodObj) return 'OUTROS';
    const monthLabels = { '2026-06': 'Junho/2026', '2026-05': 'Maio/2026', '2026-04': 'Abril/2026' };
    switch (dimName) {
      case 'ANO_MES':
        return monthLabels[monthKey] || monthKey || 'PERÍODO';
      case 'NOME_LINHA':
      case 'linha':
        return prodObj.linha || 'DEMAIS LINHAS';
      case 'SUBGRUPO_NOME':
      case 'subgrupo':
        return prodObj.subgrupo || 'DEMAIS SUBGRUPOS';
      case 'GRUPO_NOME':
      case 'grupo':
      case 'PRODUTO_CATEGORIA':
        return prodObj.grupo || 'DEMAIS CATEGORIAS';
      case 'PRODUTO_DEPARTAMENTO':
      case 'departamento':
        return prodObj.departamento || 'DEMAIS DEPARTAMENTOS';
      case 'NOME_LABORATORIO':
      case 'laboratorio':
        return prodObj.laboratorio || 'DEMAIS FABRICANTES';
      case 'PRODUTOAGRUPAMENTO_NOME':
      case 'agrupamento':
        return prodObj.agrupamento || 'OUTROS';
      case 'CATEGORIA_ECOMMERCE_NOME':
        return prodObj.categoria_ecommerce || 'GERAL';
      case 'PRODUTO_NOME':
      case 'produto':
        return prodObj.name || prodObj.short_name || 'PRODUTO';
      case 'PRODUTO_NOME_RESUMIDO':
        return prodObj.short_name || prodObj.name || 'PRODUTO';
      case 'PRODUTO_ID':
        return `SKU: ${prodObj.id}`;
      case 'PRODUTO_EAN':
        return prodObj.ean || 'SEM EAN';
      case 'CANALDET':
        return 'DIGITAL / FÍSICO';
      case 'UF':
        return 'RS';
      case 'CIDADE':
        return 'GERAL';
      default:
        return prodObj[dimName] || prodObj.linha || dimName;
    }
  };

  // EXCEL PIVOT TREE STRUCTURE ENGINE (Ultra Otimizado & Suporte Total a Qualquer Campo da Tabela Dinâmica)
  const buildExcelPivotTreeRows = (rowFieldsList) => {
    // Fallback de segurança: nunca deixa a lista de campos vazia
    const safeFields = (rowFieldsList && rowFieldsList.length > 0) ? rowFieldsList : ['NOME_LINHA'];
    const isConsolidatedSupplier = isConsolidated;
    
    // Obtenção ultra-rápida dos produtos ativos
    let rawProds = activeSupplierData.top_products || [];
    if (isConsolidatedSupplier && selectedLinha) {
      const prods = consolidatedProductsByLinha.get(selectedLinha.trim().toLowerCase());
      if (prods && prods.length > 0) {
        rawProds = prods;
      }
    }

    const rawLinhas = activeSupplierData.linhas || [];
    const monthLabels = { '2026-06': 'Junho/2026', '2026-05': 'Maio/2026', '2026-04': 'Abril/2026' };

    // CASO 1: Dimensão Única em Linhas
    if (safeFields.length === 1) {
      const dim = safeFields[0];

      // Caso 1.1: ANO_MES
      if (dim === 'ANO_MES') {
        const monthsList = ['2026-06', '2026-05', '2026-04'];
        return monthsList.map(m => {
          const mObj = activeSupplierData.months?.[m] || { revenue: 0, channels: {} };
          const faturamentoRede = mObj.revenue || 0;
          const ch = mObj.channels || {};
          const faturamentoDigital = (ch['App']?.revenue || ch['APP']?.revenue || 0) +
                                     (ch['Site']?.revenue || ch['SITE']?.revenue || 0) +
                                     (ch['Marketplace']?.revenue || ch['MARKETPLACE']?.revenue || 0);

          const baseM = m === '2026-06' ? '2026-05' : '2026-04';
          const baseObj = activeSupplierData.months?.[baseM] || { revenue: 0, channels: {} };
          const faturamentoRedeBase = baseObj.revenue || 0;
          const chB = baseObj.channels || {};
          const faturamentoDigitalBase = (chB['App']?.revenue || chB['APP']?.revenue || 0) +
                                        (chB['Site']?.revenue || chB['SITE']?.revenue || 0) +
                                        (chB['Marketplace']?.revenue || chB['MARKETPLACE']?.revenue || 0);

          const shareRede = supplierTotals.redeCurrent > 0 ? (faturamentoRede / supplierTotals.redeCurrent) * 100 : 0;
          const shareDigital = supplierTotals.digitalCurrent > 0 ? (faturamentoDigital / supplierTotals.digitalCurrent) * 100 : 0;
          const shareCatRede = networkTotals.redeCurrent > 0 ? (faturamentoRede / networkTotals.redeCurrent) * 100 : 0;
          const shareCatDigital = networkTotals.digitalCurrent > 0 ? (faturamentoDigital / networkTotals.digitalCurrent) * 100 : 0;

          const pesoIndLinhaRede = networkTotals.redeCurrent > 0 ? Math.min(100, (faturamentoRede / networkTotals.redeCurrent) * 100) : (isConsolidated ? 100 : 0);
          const pesoIndLinhaDigital = networkTotals.digitalCurrent > 0 ? Math.min(100, (faturamentoDigital / networkTotals.digitalCurrent) * 100) : (isConsolidated ? 100 : 0);

          const crescimentoRede = faturamentoRedeBase > 0 ? ((faturamentoRede - faturamentoRedeBase) / faturamentoRedeBase) * 100 : (faturamentoRede > 0 ? 100 : 0);
          const crescimentoDigital = faturamentoDigitalBase > 0 ? ((faturamentoDigital - faturamentoDigitalBase) / faturamentoDigitalBase) * 100 : (faturamentoDigital > 0 ? 100 : 0);

          return {
            id: m,
            isParent: false,
            level: 0,
            nomeItem: monthLabels[m] || m,
            subText: 'ANO_MES',
            faturamentoRede,
            faturamentoDigital,
            pesoIndLinhaRede,
            pesoIndLinhaDigital,
            shareRede,
            shareDigital,
            shareCatRede,
            shareCatDigital,
            crescimentoRede,
            crescimentoDigital,
            rawMonths: activeSupplierData.months
          };
        });
      }

      // Caso 1.2: NOME_LINHA (com base pré-agregada completa e sem duplicação)
      if ((dim === 'NOME_LINHA' || dim === 'linha') && rawLinhas.length > 0) {
        const linhaMap = new Map();
        rawLinhas.forEach(l => {
          const key = (l.nome_linha || 'DEMAIS LINHAS').trim();
          if (!linhaMap.has(key)) {
            linhaMap.set(key, {
              nome_linha: key,
              months: { ...(l.months || {}) }
            });
          } else {
            const existing = linhaMap.get(key);
            Object.entries(l.months || {}).forEach(([m, vals]) => {
              if (!existing.months[m]) {
                existing.months[m] = { ...vals };
              } else {
                existing.months[m].rede_revenue = (existing.months[m].rede_revenue || 0) + (vals.rede_revenue || 0);
                existing.months[m].digital_revenue = (existing.months[m].digital_revenue || 0) + (vals.digital_revenue || 0);
                existing.months[m].rede_qty = (existing.months[m].rede_qty || 0) + (vals.rede_qty || 0);
                existing.months[m].digital_qty = (existing.months[m].digital_qty || 0) + (vals.digital_qty || 0);
              }
            });
          }
        });
        const distinctLinhas = Array.from(linhaMap.values());

        return distinctLinhas.map(l => {
          let faturamentoRede = 0, faturamentoDigital = 0;
          let faturamentoRedeBase = 0, faturamentoDigitalBase = 0;

          activeCurrentMonths.forEach(m => {
            const mObj = l.months?.[m] || { rede_revenue: 0, digital_revenue: 0 };
            faturamentoRede += mObj.rede_revenue || 0;
            faturamentoDigital += mObj.digital_revenue || 0;
          });
          activeBaseMonths.forEach(m => {
            const mObj = l.months?.[m] || { rede_revenue: 0, digital_revenue: 0 };
            faturamentoRedeBase += mObj.rede_revenue || 0;
            faturamentoDigitalBase += mObj.digital_revenue || 0;
          });

          const shareRede = supplierTotals.redeCurrent > 0 ? (faturamentoRede / supplierTotals.redeCurrent) * 100 : 0;
          const shareDigital = supplierTotals.digitalCurrent > 0 ? (faturamentoDigital / supplierTotals.digitalCurrent) * 100 : 0;
          const shareCatRede = networkTotals.redeCurrent > 0 ? (faturamentoRede / networkTotals.redeCurrent) * 100 : 0;
          const shareCatDigital = networkTotals.digitalCurrent > 0 ? (faturamentoDigital / networkTotals.digitalCurrent) * 100 : 0;

          const linhaTotalsConsol = getConsolidatedLinhaTotals(l.nome_linha);
          const pesoIndLinhaRede = linhaTotalsConsol.rede > 0
            ? Math.max(0, Math.min(100, (faturamentoRede / linhaTotalsConsol.rede) * 100))
            : (isConsolidated ? 100 : 0);
          const pesoIndLinhaDigital = linhaTotalsConsol.digital > 0
            ? Math.max(0, Math.min(100, (faturamentoDigital / linhaTotalsConsol.digital) * 100))
            : (isConsolidated ? 100 : 0);

          const crescimentoRede = faturamentoRedeBase > 0 ? ((faturamentoRede - faturamentoRedeBase) / faturamentoRedeBase) * 100 : (faturamentoRede > 0 ? 100 : 0);
          const crescimentoDigital = faturamentoDigitalBase > 0 ? ((faturamentoDigital - faturamentoDigitalBase) / faturamentoDigitalBase) * 100 : (faturamentoDigital > 0 ? 100 : 0);

          const crescimentoLinhaRede = linhaTotalsConsol.crescRede;
          const crescimentoLinhaDigital = linhaTotalsConsol.crescDigital;

          return {
            id: l.nome_linha,
            isParent: false,
            level: 0,
            nomeItem: l.nome_linha || 'DEMAIS LINHAS',
            subText: 'NOME_LINHA',
            linha: l.nome_linha,
            faturamentoRede,
            faturamentoDigital,
            pesoIndLinhaRede,
            pesoIndLinhaDigital,
            shareRede,
            shareDigital,
            shareCatRede,
            shareCatDigital,
            crescimentoRede,
            crescimentoDigital,
            crescimentoLinhaRede,
            crescimentoLinhaDigital,
            rawMonths: l.months
          };
        });
      }

      // Caso 1.3: Qualquer outra dimensão escolhida (SUBGRUPO, GRUPO, DEPARTAMENTO, PRODUTO, ETC.)
      const groupsMap = {};
      rawProds.forEach(p => {
        const groupVal = getProductDimensionValue(p, dim);
        if (!groupsMap[groupVal]) {
          groupsMap[groupVal] = {
            id: groupVal,
            isParent: false,
            level: 0,
            nomeItem: groupVal,
            subText: dim,
            linha: p.linha || '',
            faturamentoRede: 0,
            faturamentoDigital: 0,
            faturamentoRedeBase: 0,
            faturamentoDigitalBase: 0,
            rawMonths: p.months
          };
        }

        const grp = groupsMap[groupVal];
        activeCurrentMonths.forEach(m => {
          const mObj = p.months?.[m] || { revenue: 0, digital_revenue: 0 };
          grp.faturamentoRede += mObj.revenue || 0;
          grp.faturamentoDigital += mObj.digital_revenue ?? 0;
        });
        activeBaseMonths.forEach(m => {
          const mObj = p.months?.[m] || { revenue: 0, digital_revenue: 0 };
          grp.faturamentoRedeBase += mObj.revenue || 0;
          grp.faturamentoDigitalBase += mObj.digital_revenue ?? 0;
        });
      });

      return Object.values(groupsMap).map(g => {
        const shareRede = supplierTotals.redeCurrent > 0 ? (g.faturamentoRede / supplierTotals.redeCurrent) * 100 : 0;
        const shareDigital = supplierTotals.digitalCurrent > 0 ? (g.faturamentoDigital / supplierTotals.digitalCurrent) * 100 : 0;
        const shareCatRede = networkTotals.redeCurrent > 0 ? (g.faturamentoRede / networkTotals.redeCurrent) * 100 : 0;
        const shareCatDigital = networkTotals.digitalCurrent > 0 ? (g.faturamentoDigital / networkTotals.digitalCurrent) * 100 : 0;

        const pLinhaTotals = getConsolidatedLinhaTotals(g.linha || g.nomeItem);
        const pesoIndLinhaRede = pLinhaTotals.rede > 0
          ? Math.max(0, Math.min(100, (g.faturamentoRede / pLinhaTotals.rede) * 100))
          : (isConsolidated ? 100 : 0);
        const pesoIndLinhaDigital = pLinhaTotals.digital > 0
          ? Math.max(0, Math.min(100, (g.faturamentoDigital / pLinhaTotals.digital) * 100))
          : (isConsolidated ? 100 : 0);

        const crescimentoRede = g.faturamentoRedeBase > 0 ? ((g.faturamentoRede - g.faturamentoRedeBase) / g.faturamentoRedeBase) * 100 : (g.faturamentoRede > 0 ? 100 : 0);
        const crescimentoDigital = g.faturamentoDigitalBase > 0 ? ((g.faturamentoDigital - g.faturamentoDigitalBase) / g.faturamentoDigitalBase) * 100 : (g.faturamentoDigital > 0 ? 100 : 0);

        const crescimentoLinhaRede = pLinhaTotals.crescRede;
        const crescimentoLinhaDigital = pLinhaTotals.crescDigital;

        return {
          ...g,
          pesoIndLinhaRede,
          pesoIndLinhaDigital,
          shareRede,
          shareDigital,
          shareCatRede,
          shareCatDigital,
          crescimentoRede,
          crescimentoDigital,
          crescimentoLinhaRede,
          crescimentoLinhaDigital
        };
      });
    }

    // CASO 2: Hierarquia Multinível estilo Excel Pivot Tree (2 ou mais campos)
    const parentField = safeFields[0];
    const childField = safeFields[1];
    const parentsMap = {};

    rawProds.forEach(p => {
      const parentVal = getProductDimensionValue(p, parentField);
      const childVal = getProductDimensionValue(p, childField);

      if (!parentsMap[parentVal]) {
        parentsMap[parentVal] = {
          groupKey: parentVal,
          nomeItem: parentVal,
          subText: `Grupo (${parentField})`,
          linha: p.linha || '',
          faturamentoRede: 0,
          faturamentoDigital: 0,
          faturamentoRedeBase: 0,
          faturamentoDigitalBase: 0,
          childrenMap: {}
        };
      }

      const parentObj = parentsMap[parentVal];

      if (!parentObj.childrenMap[childVal]) {
        parentObj.childrenMap[childVal] = {
          id: p.id || childVal,
          nomeItem: childVal,
          subText: childField,
          linha: p.linha || '',
          faturamentoRede: 0,
          faturamentoDigital: 0,
          faturamentoRedeBase: 0,
          faturamentoDigitalBase: 0,
          rawMonths: p.months
        };
      }

      const childObj = parentObj.childrenMap[childVal];

      activeCurrentMonths.forEach(m => {
        const mObj = p.months?.[m] || { revenue: 0, digital_revenue: 0 };
        const r = mObj.revenue || 0;
        const d = mObj.digital_revenue ?? 0;
        parentObj.faturamentoRede += r;
        parentObj.faturamentoDigital += d;
        childObj.faturamentoRede += r;
        childObj.faturamentoDigital += d;
      });

      activeBaseMonths.forEach(m => {
        const mObj = p.months?.[m] || { revenue: 0, digital_revenue: 0 };
        const r = mObj.revenue || 0;
        const d = mObj.digital_revenue ?? 0;
        parentObj.faturamentoRedeBase += r;
        parentObj.faturamentoDigitalBase += d;
        childObj.faturamentoRedeBase += r;
        childObj.faturamentoDigitalBase += d;
      });
    });

    // Monta a árvore plana no estilo Excel (Pai + Filhos indentados quando expandido)
    const resultTree = [];

    Object.values(parentsMap).forEach(parent => {
      const shareRede = supplierTotals.redeCurrent > 0 ? (parent.faturamentoRede / supplierTotals.redeCurrent) * 100 : 0;
      const shareDigital = supplierTotals.digitalCurrent > 0 ? (parent.faturamentoDigital / supplierTotals.digitalCurrent) * 100 : 0;
      const shareCatRede = networkTotals.redeCurrent > 0 ? (parent.faturamentoRede / networkTotals.redeCurrent) * 100 : 0;
      const shareCatDigital = networkTotals.digitalCurrent > 0 ? (parent.faturamentoDigital / networkTotals.digitalCurrent) * 100 : 0;

      const parentLinhaTotals = getConsolidatedLinhaTotals(parent.linha || parent.nomeItem);
      const pesoIndLinhaRede = parentLinhaTotals.rede > 0
        ? Math.max(0, Math.min(100, (parent.faturamentoRede / parentLinhaTotals.rede) * 100))
        : (isConsolidated ? 100 : 0);
      const pesoIndLinhaDigital = parentLinhaTotals.digital > 0
        ? Math.max(0, Math.min(100, (parent.faturamentoDigital / parentLinhaTotals.digital) * 100))
        : (isConsolidated ? 100 : 0);

      const crescimentoRede = parent.faturamentoRedeBase > 0 ? ((parent.faturamentoRede - parent.faturamentoRedeBase) / parent.faturamentoRedeBase) * 100 : (parent.faturamentoRede > 0 ? 100 : 0);
      const crescimentoDigital = parent.faturamentoDigitalBase > 0 ? ((parent.faturamentoDigital - parent.faturamentoDigitalBase) / parent.faturamentoDigitalBase) * 100 : (parent.faturamentoDigital > 0 ? 100 : 0);

      const crescimentoLinhaRede = parentLinhaTotals.crescRede;
      const crescimentoLinhaDigital = parentLinhaTotals.crescDigital;

      const isExpanded = expandedGroups[parent.groupKey] !== false; // default aberto

      resultTree.push({
        id: parent.groupKey,
        isParent: true,
        groupKey: parent.groupKey,
        isExpanded,
        childCount: Object.keys(parent.childrenMap).length,
        level: 0,
        nomeItem: parent.nomeItem,
        subText: parent.subText,
        linha: parent.linha,
        faturamentoRede: parent.faturamentoRede,
        faturamentoDigital: parent.faturamentoDigital,
        pesoIndLinhaRede,
        pesoIndLinhaDigital,
        shareRede,
        shareDigital,
        shareCatRede,
        shareCatDigital,
        crescimentoRede,
        crescimentoDigital,
        crescimentoLinhaRede,
        crescimentoLinhaDigital
      });

      if (isExpanded) {
        Object.values(parent.childrenMap).forEach(child => {
          const cShareRede = supplierTotals.redeCurrent > 0 ? (child.faturamentoRede / supplierTotals.redeCurrent) * 100 : 0;
          const cShareDigital = supplierTotals.digitalCurrent > 0 ? (child.faturamentoDigital / supplierTotals.digitalCurrent) * 100 : 0;
          const cShareCatRede = networkTotals.redeCurrent > 0 ? (child.faturamentoRede / networkTotals.redeCurrent) * 100 : 0;
          const cShareCatDigital = networkTotals.digitalCurrent > 0 ? (child.faturamentoDigital / networkTotals.digitalCurrent) * 100 : 0;

          const cLinhaTotals = getConsolidatedLinhaTotals(child.linha || parent.linha || child.nomeItem);
          const cPesoIndLinhaRede = cLinhaTotals.rede > 0
            ? Math.max(0, Math.min(100, (child.faturamentoRede / cLinhaTotals.rede) * 100))
            : (isConsolidated ? 100 : 0);
          const cPesoIndLinhaDigital = cLinhaTotals.digital > 0
            ? Math.max(0, Math.min(100, (child.faturamentoDigital / cLinhaTotals.digital) * 100))
            : (isConsolidated ? 100 : 0);

          const cCrescimentoRede = child.faturamentoRedeBase > 0 ? ((child.faturamentoRede - child.faturamentoRedeBase) / child.faturamentoRedeBase) * 100 : (child.faturamentoRede > 0 ? 100 : 0);
          const cCrescimentoDigital = child.faturamentoDigitalBase > 0 ? ((child.faturamentoDigital - child.faturamentoDigitalBase) / child.faturamentoDigitalBase) * 100 : (child.faturamentoDigital > 0 ? 100 : 0);

          const cCrescimentoLinhaRede = cLinhaTotals.crescRede;
          const cCrescimentoLinhaDigital = cLinhaTotals.crescDigital;

          resultTree.push({
            id: child.id,
            isParent: false,
            parentKey: parent.groupKey,
            level: 1,
            nomeItem: child.nomeItem,
            subText: child.subText,
            linha: child.linha,
            faturamentoRede: child.faturamentoRede,
            faturamentoDigital: child.faturamentoDigital,
            pesoIndLinhaRede: cPesoIndLinhaRede,
            pesoIndLinhaDigital: cPesoIndLinhaDigital,
            shareRede: cShareRede,
            shareDigital: cShareDigital,
            shareCatRede: cShareCatRede,
            shareCatDigital: cShareCatDigital,
            crescimentoRede: cCrescimentoRede,
            crescimentoDigital: cCrescimentoDigital,
            crescimentoLinhaRede: cCrescimentoLinhaRede,
            crescimentoLinhaDigital: cCrescimentoLinhaDigital,
            rawMonths: child.rawMonths
          });
        });
      }
    });

    return resultTree;
  };

  // 2. Process Linhas Table Data for Table 1
  const linhasTableData = useMemo(() => {
    return buildExcelPivotTreeRows(linhaRowFields);
  }, [linhaRowFields, expandedGroups, activeSupplierData, effectiveCurrentMonth, effectiveBaseMonth, supplierTotals, networkTotals, selectedPeriod, ytdCurrentMonths, ytdBaseMonths, consolidatedProductsByLinha]);

  // Filtered & Sorted Linhas Data
  const sortedLinhas = useMemo(() => {
    let result = [...linhasTableData];

    if (searchLinha.trim()) {
      const s = searchLinha.toLowerCase();
      result = result.filter(item => item.nomeItem.toLowerCase().includes(s));
    }

    if (!sortLinhaKey) return result;

    const isTree = result.some(r => r.isParent);

    const compareValues = (a, b) => {
      let valA = a[sortLinhaKey];
      let valB = b[sortLinhaKey];

      if (sortLinhaKey === 'nomeItem') {
        valA = String(a.nomeItem || '').trim();
        valB = String(b.nomeItem || '').trim();
        const cmp = valA.localeCompare(valB, 'pt-BR', { numeric: true, sensitivity: 'base' });
        return sortLinhaOrder === 'asc' ? cmp : -cmp;
      }

      valA = typeof valA === 'number' ? valA : (Number(valA) || 0);
      valB = typeof valB === 'number' ? valB : (Number(valB) || 0);

      if (sortLinhaOrder === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    };

    if (!isTree) {
      return result.sort(compareValues);
    }

    // Se for árvore hierárquica (Parent / Child):
    const parentGroups = [];
    let currentParentGroup = null;

    result.forEach(row => {
      if (row.isParent) {
        currentParentGroup = { parent: row, children: [] };
        parentGroups.push(currentParentGroup);
      } else if (currentParentGroup && row.level === 1) {
        currentParentGroup.children.push(row);
      } else {
        parentGroups.push({ parent: row, children: [] });
      }
    });

    parentGroups.sort((gA, gB) => compareValues(gA.parent, gB.parent));

    parentGroups.forEach(g => {
      if (g.children.length > 1) {
        g.children.sort(compareValues);
      }
    });

    const sortedTree = [];
    parentGroups.forEach(g => {
      sortedTree.push(g.parent);
      g.children.forEach(c => sortedTree.push(c));
    });

    return sortedTree;
  }, [linhasTableData, searchLinha, sortLinhaKey, sortLinhaOrder]);

  // Total Footer Calculations for Linhas Table
  const linhasTotals = useMemo(() => {
    let totRede = 0;
    let totDigital = 0;
    let totShareRede = 0;
    let totShareDigital = 0;

    const parentsOnly = sortedLinhas.filter(r => r.level === 0);

    let totRedeLinhasConsol = 0;
    let totDigitalLinhasConsol = 0;
    let totRedeBaseLinhasConsol = 0;
    let totDigitalBaseLinhasConsol = 0;

    parentsOnly.forEach(l => {
      totRede += l.faturamentoRede;
      totDigital += l.faturamentoDigital;
      totShareRede += l.shareRede;
      totShareDigital += l.shareDigital;

      const clTotals = getConsolidatedLinhaTotals(l.nomeItem);
      totRedeLinhasConsol += clTotals.rede;
      totDigitalLinhasConsol += clTotals.digital;
      totRedeBaseLinhasConsol += clTotals.redeBase;
      totDigitalBaseLinhasConsol += clTotals.digitalBase;
    });

    const totShareCatRede = networkTotals.redeCurrent > 0 ? (totRede / networkTotals.redeCurrent) * 100 : 0;
    const totShareCatDigital = networkTotals.digitalCurrent > 0 ? (totDigital / networkTotals.digitalCurrent) * 100 : 0;

    const totPesoIndLinhaRede = isConsolidated
      ? 100
      : (totRedeLinhasConsol > 0 ? Math.max(0, Math.min(100, (totRede / totRedeLinhasConsol) * 100)) : 0);
    const totPesoIndLinhaDigital = isConsolidated
      ? 100
      : (totDigitalLinhasConsol > 0 ? Math.max(0, Math.min(100, (totDigital / totDigitalLinhasConsol) * 100)) : 0);

    const crescRede = supplierTotals.redeBase > 0 ? ((totRede - supplierTotals.redeBase) / supplierTotals.redeBase) * 100 : 0;
    const crescDigital = supplierTotals.digitalBase > 0 ? ((totDigital - supplierTotals.digitalBase) / supplierTotals.digitalBase) * 100 : 0;

    const crescLinhaRede = totRedeBaseLinhasConsol > 0
      ? ((totRedeLinhasConsol - totRedeBaseLinhasConsol) / totRedeBaseLinhasConsol) * 100
      : networkTotals.crescRede;
    const crescLinhaDigital = totDigitalBaseLinhasConsol > 0
      ? ((totDigitalLinhasConsol - totDigitalBaseLinhasConsol) / totDigitalBaseLinhasConsol) * 100
      : networkTotals.crescDigital;

    return {
      totRede,
      totDigital,
      totShareRede: Math.min(100, totShareRede),
      totShareDigital: Math.min(100, totShareDigital),
      totShareCatRede,
      totShareCatDigital,
      totPesoIndLinhaRede,
      totPesoIndLinhaDigital,
      crescRede,
      crescDigital,
      crescLinhaRede,
      crescLinhaDigital
    };
  }, [sortedLinhas, supplierTotals, networkTotals, selectedSupplier, consolidatedLinhasMap, activeCurrentMonths, activeBaseMonths]);

  // 3. Process Produtos Table Data for Table 2 (com reatividade imediata à seleção de linha)
  const produtosTableData = useMemo(() => {
    return buildExcelPivotTreeRows(produtoRowFields);
  }, [produtoRowFields, selectedLinha, expandedGroups, activeSupplierData, effectiveCurrentMonth, effectiveBaseMonth, supplierTotals, networkTotals, selectedPeriod, ytdCurrentMonths, ytdBaseMonths, consolidatedProductsByLinha]);

  // Filtered & Sorted Produtos Data
  const sortedProdutos = useMemo(() => {
    let result = [...produtosTableData];

    if (selectedLinha) {
      result = result.filter(item => {
        if (item.linha) return item.linha.toLowerCase() === selectedLinha.toLowerCase();
        return item.nomeItem.toLowerCase().includes(selectedLinha.toLowerCase());
      });
    }

    if (searchProduto.trim()) {
      const s = searchProduto.toLowerCase();
      result = result.filter(item => 
        item.nomeItem.toLowerCase().includes(s) ||
        (item.id && item.id.toLowerCase().includes(s))
      );
    }

    if (!sortProdutoKey) return result;

    const isTree = result.some(r => r.isParent);

    const compareValues = (a, b) => {
      let valA = a[sortProdutoKey];
      let valB = b[sortProdutoKey];

      if (sortProdutoKey === 'nomeItem') {
        valA = String(a.nomeItem || '').trim();
        valB = String(b.nomeItem || '').trim();
        const cmp = valA.localeCompare(valB, 'pt-BR', { numeric: true, sensitivity: 'base' });
        return sortProdutoOrder === 'asc' ? cmp : -cmp;
      }

      valA = typeof valA === 'number' ? valA : (Number(valA) || 0);
      valB = typeof valB === 'number' ? valB : (Number(valB) || 0);

      if (sortProdutoOrder === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    };

    if (!isTree) {
      return result.sort(compareValues);
    }

    const parentGroups = [];
    let currentParentGroup = null;

    result.forEach(row => {
      if (row.isParent) {
        currentParentGroup = { parent: row, children: [] };
        parentGroups.push(currentParentGroup);
      } else if (currentParentGroup && row.level === 1) {
        currentParentGroup.children.push(row);
      } else {
        parentGroups.push({ parent: row, children: [] });
      }
    });

    parentGroups.sort((gA, gB) => compareValues(gA.parent, gB.parent));

    parentGroups.forEach(g => {
      if (g.children.length > 1) {
        g.children.sort(compareValues);
      }
    });

    const sortedTree = [];
    parentGroups.forEach(g => {
      sortedTree.push(g.parent);
      g.children.forEach(c => sortedTree.push(c));
    });

    return sortedTree;
  }, [produtosTableData, selectedLinha, searchProduto, sortProdutoKey, sortProdutoOrder]);

  // Total Footer Calculations for Produtos Table
  const produtosTotals = useMemo(() => {
    let totRede = 0;
    let totDigital = 0;
    let totShareRede = 0;
    let totShareDigital = 0;

    const parentsOnly = sortedProdutos.filter(r => r.level === 0);

    const distinctLines = new Set();
    parentsOnly.forEach(p => {
      totRede += p.faturamentoRede;
      totDigital += p.faturamentoDigital;
      totShareRede += p.shareRede;
      totShareDigital += p.shareDigital;

      const linhaName = p.linha || (p.subText === 'NOME_LINHA' ? p.nomeItem : null);
      if (linhaName) {
        distinctLines.add(linhaName);
      }
    });

    let totRedeLinhasConsol = 0;
    let totDigitalLinhasConsol = 0;
    let totRedeBaseLinhasConsol = 0;
    let totDigitalBaseLinhasConsol = 0;

    if (distinctLines.size > 0) {
      distinctLines.forEach(line => {
        const clTotals = getConsolidatedLinhaTotals(line);
        totRedeLinhasConsol += clTotals.rede;
        totDigitalLinhasConsol += clTotals.digital;
        totRedeBaseLinhasConsol += clTotals.redeBase;
        totDigitalBaseLinhasConsol += clTotals.digitalBase;
      });
    } else if (selectedLinha) {
      const clTotals = getConsolidatedLinhaTotals(selectedLinha);
      totRedeLinhasConsol = clTotals.rede;
      totDigitalLinhasConsol = clTotals.digital;
      totRedeBaseLinhasConsol = clTotals.redeBase;
      totDigitalBaseLinhasConsol = clTotals.digitalBase;
    } else {
      totRedeLinhasConsol = networkTotals.redeCurrent;
      totDigitalLinhasConsol = networkTotals.digitalCurrent;
      totRedeBaseLinhasConsol = networkTotals.redeBase;
      totDigitalBaseLinhasConsol = networkTotals.digitalBase;
    }

    const totShareCatRede = networkTotals.redeCurrent > 0 ? (totRede / networkTotals.redeCurrent) * 100 : 0;
    const totShareCatDigital = networkTotals.digitalCurrent > 0 ? (totDigital / networkTotals.digitalCurrent) * 100 : 0;

    const totPesoIndLinhaRede = isConsolidated
      ? 100
      : (totRedeLinhasConsol > 0 ? Math.max(0, Math.min(100, (totRede / totRedeLinhasConsol) * 100)) : 0);
    const totPesoIndLinhaDigital = isConsolidated
      ? 100
      : (totDigitalLinhasConsol > 0 ? Math.max(0, Math.min(100, (totDigital / totDigitalLinhasConsol) * 100)) : 0);

    const crescRede = supplierTotals.redeBase > 0 ? ((totRede - supplierTotals.redeBase) / supplierTotals.redeBase) * 100 : 0;
    const crescDigital = supplierTotals.digitalBase > 0 ? ((totDigital - supplierTotals.digitalBase) / supplierTotals.digitalBase) * 100 : 0;

    const crescLinhaRede = totRedeBaseLinhasConsol > 0
      ? ((totRedeLinhasConsol - totRedeBaseLinhasConsol) / totRedeBaseLinhasConsol) * 100
      : 0;
    const crescLinhaDigital = totDigitalBaseLinhasConsol > 0
      ? ((totDigitalLinhasConsol - totDigitalBaseLinhasConsol) / totDigitalBaseLinhasConsol) * 100
      : 0;

    return {
      totRede,
      totDigital,
      totShareRede: Math.min(100, totShareRede),
      totShareDigital: Math.min(100, totShareDigital),
      totShareCatRede,
      totShareCatDigital,
      totPesoIndLinhaRede,
      totPesoIndLinhaDigital,
      crescRede,
      crescDigital,
      crescLinhaRede,
      crescLinhaDigital
    };
  }, [sortedProdutos, supplierTotals, networkTotals, selectedSupplier, selectedLinha, consolidatedLinhasMap, activeCurrentMonths, activeBaseMonths]);

  // Paginated Slicing for Table 2 (Produtos)
  const totalProdutoPages = useMemo(() => {
    if (produtoPageSize === 'all') return 1;
    return Math.max(1, Math.ceil(sortedProdutos.length / produtoPageSize));
  }, [sortedProdutos.length, produtoPageSize]);

  const paginatedProdutos = useMemo(() => {
    if (produtoPageSize === 'all') return sortedProdutos;
    const start = (produtoPage - 1) * produtoPageSize;
    return sortedProdutos.slice(start, start + produtoPageSize);
  }, [sortedProdutos, produtoPage, produtoPageSize]);

  // 4. Compute Dynamic Timeline Chart Data
  const { timelineData, chartTitle, chartSubTitle, chartDataKeys } = useMemo(() => {
    const months = ['2026-04', '2026-05', '2026-06'];
    const monthLabels = { '2026-04': 'Abr/2026', '2026-05': 'Mai/2026', '2026-06': 'Jun/2026' };

    let selectedItemObj = null;
    let selectedItemTitle = '';

    if (selectedProduto) {
      selectedItemObj = produtosTableData.find(p => p.id === selectedProduto.id || p.nomeItem === selectedProduto.nomeItem) || selectedProduto;
      selectedItemTitle = `Produto: ${selectedItemObj.nomeItem}`;
    } else if (selectedLinha) {
      selectedItemObj = linhasTableData.find(l => l.nomeItem.toLowerCase() === selectedLinha.toLowerCase());
      selectedItemTitle = `Seleção: ${selectedLinha}`;
    } else {
      selectedItemTitle = `Visão Geral (${selectedSupplier})`;
    }

    const data = months.map(m => {
      let redeVal = 0;
      let digitalVal = 0;
      let redeBaseVal = 0;
      let digitalBaseVal = 0;

      if (selectedItemObj) {
        const mObj = selectedItemObj.rawMonths?.[m] || { revenue: 0, digital_revenue: 0, rede_revenue: 0 };
        redeVal = mObj.revenue || mObj.rede_revenue || 0;
        digitalVal = mObj.digital_revenue || (redeVal * 0.35);

        const baseObj = selectedItemObj.rawMonths?.[effectiveBaseMonth] || { revenue: 0, digital_revenue: 0, rede_revenue: 0 };
        redeBaseVal = baseObj.revenue || baseObj.rede_revenue || 0;
        digitalBaseVal = baseObj.digital_revenue || (redeBaseVal * 0.35);
      } else {
        const mObj = activeSupplierData.months?.[m] || { revenue: 0, channels: {} };
        redeVal = mObj.revenue || 0;
        const ch = mObj.channels || {};
        digitalVal = (ch['App']?.revenue || ch['APP']?.revenue || 0) +
                     (ch['Site']?.revenue || ch['SITE']?.revenue || 0) +
                     (ch['Marketplace']?.revenue || ch['MARKETPLACE']?.revenue || 0);

        const baseObj = activeSupplierData.months?.[effectiveBaseMonth] || { revenue: 0, channels: {} };
        redeBaseVal = baseObj.revenue || 0;
        const chB = baseObj.channels || {};
        digitalBaseVal = (chB['App']?.revenue || chB['APP']?.revenue || 0) +
                         (chB['Site']?.revenue || chB['SITE']?.revenue || 0) +
                         (chB['Marketplace']?.revenue || chB['MARKETPLACE']?.revenue || 0);
      }

      const netRede = networkTotals.redeCurrent || 1;
      const netDig = networkTotals.digitalCurrent || 1;
      const supRede = supplierTotals.redeCurrent || 1;
      const supDig = supplierTotals.digitalCurrent || 1;

      const shIndRede = (redeVal / supRede) * 100;
      const shIndDigital = (digitalVal / supDig) * 100;

      const shCatRede = (redeVal / netRede) * 100;
      const shCatDigital = (digitalVal / netDig) * 100;

      const crescRede = redeBaseVal > 0 ? ((redeVal - redeBaseVal) / redeBaseVal) * 100 : (redeVal > 0 ? 100 : 0);
      const crescDigital = digitalBaseVal > 0 ? ((digitalVal - digitalBaseVal) / digitalBaseVal) * 100 : (digitalVal > 0 ? 100 : 0);

      return {
        month: monthLabels[m] || m,
        'Faturamento Rede': redeVal,
        'Faturamento Digital': digitalVal,
        'Share Indústria Rede (%)': shIndRede,
        'Share Indústria Digital (%)': shIndDigital,
        'Share Categoria Rede (%)': shCatRede,
        'Share Categoria Digital (%)': shCatDigital,
        'Δ Rede (%)': crescRede,
        'Δ Digital (%)': crescDigital,
      };
    });

    let keys = [];
    let titleStr = '';

    switch (chartMetric) {
      case 'faturamento_rede':
        keys = [{ key: 'Faturamento Rede', color: '#10B981', type: 'currency' }];
        titleStr = `Evolução Mensal: Faturamento Rede — ${selectedItemTitle}`;
        break;
      case 'faturamento_digital':
        keys = [{ key: 'Faturamento Digital', color: '#3B82F6', type: 'currency' }];
        titleStr = `Evolução Mensal: Faturamento Digital — ${selectedItemTitle}`;
        break;
      case 'share_industria':
        keys = [
          { key: 'Share Indústria Rede (%)', color: '#10B981', type: 'percent' },
          { key: 'Share Indústria Digital (%)', color: '#3B82F6', type: 'percent' }
        ];
        titleStr = `Evolução Mensal: Share no Fornecedor — ${selectedItemTitle}`;
        break;
      case 'share_categoria':
        keys = [
          { key: 'Share Categoria Rede (%)', color: '#F59E0B', type: 'percent' },
          { key: 'Share Categoria Digital (%)', color: '#3B82F6', type: 'percent' }
        ];
        titleStr = `Evolução Mensal: Share na Categoria (Nexus Varejo) — ${selectedItemTitle}`;
        break;
      case 'crescimento':
        keys = [
          { key: 'Δ Rede (%)', color: '#10B981', type: 'percent' },
          { key: 'Δ Digital (%)', color: '#EC4899', type: 'percent' }
        ];
        titleStr = `Evolução Mensal: Taxa de Δ — ${selectedItemTitle}`;
        break;
      default: // 'faturamento_both'
        keys = [
          { key: 'Faturamento Rede', color: '#10B981', type: 'currency' },
          { key: 'Faturamento Digital', color: '#3B82F6', type: 'currency' }
        ];
        titleStr = `Evolução Mensal: Faturamento (Rede vs. Digital) — ${selectedItemTitle}`;
        break;
    }

    return {
      timelineData: data,
      chartTitle: titleStr,
      chartSubTitle: `Histórico comparativo nos meses de Abril, Maio e Junho/2026`,
      chartDataKeys: keys
    };
  }, [selectedProduto, selectedLinha, produtosTableData, linhasTableData, activeSupplierData, supplierTotals, networkTotals, chartMetric, effectiveBaseMonth]);

  // Handlers for selection
  const handleSelectLinha = (nomeItem) => {
    if (selectedLinha === nomeItem) {
      setSelectedLinha(null);
    } else {
      setSelectedLinha(nomeItem);
      setSelectedProduto(null);
    }
  };

  const handleSelectProduto = (row) => {
    if (selectedProduto?.id === row.id || selectedProduto?.nomeItem === row.nomeItem) {
      setSelectedProduto(null);
    } else {
      setSelectedProduto(row);
    }
  };

  // SAFE CSV EXPORT HANDLERS
  const handleExportLinhasCSV = () => {
    if (!sortedLinhas || sortedLinhas.length === 0) return;
    const exportData = sortedLinhas.map(item => {
      const obj = { 
        'TIPO_ROW': item.isParent ? 'PAI_SUBTOTAL' : 'ITEM_FILHO',
        'NOME_ITEM': item.nomeItem || '-'
      };
      activeLinhaCols.forEach(col => {
        const colLabel = col.label || col.id;
        if (col.id === 'faturamentoRede') {
          obj[colLabel] = item.faturamentoRede != null ? Number(item.faturamentoRede).toFixed(2) : '0.00';
        } else if (col.id === 'faturamentoDigital') {
          obj[colLabel] = item.faturamentoDigital != null ? Number(item.faturamentoDigital).toFixed(2) : '0.00';
        } else if (col.id === 'pesoIndLinhaRede') {
          obj[colLabel] = item.pesoIndLinhaRede != null && !isNaN(item.pesoIndLinhaRede) ? `${Number(item.pesoIndLinhaRede).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'pesoIndLinhaDigital') {
          obj[colLabel] = item.pesoIndLinhaDigital != null && !isNaN(item.pesoIndLinhaDigital) ? `${Number(item.pesoIndLinhaDigital).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'shareRede') {
          obj[colLabel] = item.shareRede != null && !isNaN(item.shareRede) ? `${Number(item.shareRede).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'shareDigital') {
          obj[colLabel] = item.shareDigital != null && !isNaN(item.shareDigital) ? `${Number(item.shareDigital).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'shareCatRede') {
          obj[colLabel] = item.shareCatRede != null && !isNaN(item.shareCatRede) ? `${Number(item.shareCatRede).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'shareCatDigital') {
          obj[colLabel] = item.shareCatDigital != null && !isNaN(item.shareCatDigital) ? `${Number(item.shareCatDigital).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'crescimentoRede') {
          obj[colLabel] = item.crescimentoRede != null && !isNaN(item.crescimentoRede) ? `${Number(item.crescimentoRede).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'crescimentoDigital') {
          obj[colLabel] = item.crescimentoDigital != null && !isNaN(item.crescimentoDigital) ? `${Number(item.crescimentoDigital).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'crescimentoLinhaRede') {
          obj[colLabel] = item.crescimentoLinhaRede != null && !isNaN(item.crescimentoLinhaRede) ? `${Number(item.crescimentoLinhaRede).toFixed(2)}%` : '';
        } else if (col.id === 'crescimentoLinhaDigital') {
          obj[colLabel] = item.crescimentoLinhaDigital != null && !isNaN(item.crescimentoLinhaDigital) ? `${Number(item.crescimentoLinhaDigital).toFixed(2)}%` : '';
        } else if (item[col.id] !== undefined) {
          obj[colLabel] = item[col.id];
        }
      });
      return obj;
    });

    const supplierStr = Array.isArray(selectedSupplier) ? (selectedSupplier[0] || 'CONSOLIDADO') : String(selectedSupplier || 'FORNECEDOR');
    const safeSupplier = supplierStr.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
    exportToCSV(`Linhas_ExcelPivotTree_${safeSupplier}`, exportData);
  };

  const handleExportProdutosCSV = () => {
    if (!sortedProdutos || sortedProdutos.length === 0) return;
    const exportData = sortedProdutos.map(item => {
      const obj = { 
        'TIPO_ROW': item.isParent ? 'PAI_SUBTOTAL' : 'ITEM_FILHO',
        'SKU_ID': item.id || '-', 
        'NOME_ITEM': item.nomeItem || '-'
      };
      activeProdutoCols.forEach(col => {
        const colLabel = col.label || col.id;
        if (col.id === 'faturamentoRede') {
          obj[colLabel] = item.faturamentoRede != null ? Number(item.faturamentoRede).toFixed(2) : '0.00';
        } else if (col.id === 'faturamentoDigital') {
          obj[colLabel] = item.faturamentoDigital != null ? Number(item.faturamentoDigital).toFixed(2) : '0.00';
        } else if (col.id === 'pesoIndLinhaRede') {
          obj[colLabel] = item.pesoIndLinhaRede != null && !isNaN(item.pesoIndLinhaRede) ? `${Number(item.pesoIndLinhaRede).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'pesoIndLinhaDigital') {
          obj[colLabel] = item.pesoIndLinhaDigital != null && !isNaN(item.pesoIndLinhaDigital) ? `${Number(item.pesoIndLinhaDigital).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'shareRede') {
          obj[colLabel] = item.shareRede != null && !isNaN(item.shareRede) ? `${Number(item.shareRede).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'shareDigital') {
          obj[colLabel] = item.shareDigital != null && !isNaN(item.shareDigital) ? `${Number(item.shareDigital).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'shareCatRede') {
          obj[colLabel] = item.shareCatRede != null && !isNaN(item.shareCatRede) ? `${Number(item.shareCatRede).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'shareCatDigital') {
          obj[colLabel] = item.shareCatDigital != null && !isNaN(item.shareCatDigital) ? `${Number(item.shareCatDigital).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'crescimentoRede') {
          obj[colLabel] = item.crescimentoRede != null && !isNaN(item.crescimentoRede) ? `${Number(item.crescimentoRede).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'crescimentoDigital') {
          obj[colLabel] = item.crescimentoDigital != null && !isNaN(item.crescimentoDigital) ? `${Number(item.crescimentoDigital).toFixed(2)}%` : '0.00%';
        } else if (col.id === 'crescimentoLinhaRede') {
          obj[colLabel] = item.crescimentoLinhaRede != null && !isNaN(item.crescimentoLinhaRede) ? `${Number(item.crescimentoLinhaRede).toFixed(2)}%` : '';
        } else if (col.id === 'crescimentoLinhaDigital') {
          obj[colLabel] = item.crescimentoLinhaDigital != null && !isNaN(item.crescimentoLinhaDigital) ? `${Number(item.crescimentoLinhaDigital).toFixed(2)}%` : '';
        } else if (item[col.id] !== undefined) {
          obj[colLabel] = item[col.id];
        }
      });
      return obj;
    });

    const supplierStr = Array.isArray(selectedSupplier) ? (selectedSupplier[0] || 'CONSOLIDADO') : String(selectedSupplier || 'FORNECEDOR');
    const safeSupplier = supplierStr.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
    exportToCSV(`Produtos_ExcelPivotTree_${safeSupplier}`, exportData);
  };

  // Helper to render body cell according to col.id
  const renderCellContent = (colId, row) => {
    const isParent = row.isParent;
    switch (colId) {
      case 'faturamentoRede':
        return <span className={`font-mono ${isParent ? 'font-extrabold text-emerald-700 dark:text-emerald-300' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>{formatBRL(row.faturamentoRede)}</span>;
      case 'faturamentoDigital':
        return <span className={`font-mono ${isParent ? 'font-extrabold text-blue-700 dark:text-blue-300' : 'font-semibold text-blue-600 dark:text-blue-400'}`}>{formatBRL(row.faturamentoDigital)}</span>;
      case 'pesoIndLinhaRede':
        return (
          <span className="font-mono text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-500/10 px-1 py-0.5 rounded border border-purple-200 dark:border-purple-800/40">
            {row.pesoIndLinhaRede !== undefined ? `${row.pesoIndLinhaRede.toFixed(1)}%` : '0.0%'}
          </span>
        );
      case 'pesoIndLinhaDigital':
        return (
          <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/40">
            {row.pesoIndLinhaDigital !== undefined ? `${row.pesoIndLinhaDigital.toFixed(1)}%` : '0.0%'}
          </span>
        );
      case 'shareRede':
        return <span className="font-mono text-slate-500 dark:text-slate-400">{row.shareRede.toFixed(1)}%</span>;
      case 'shareDigital':
        return <span className="font-mono text-blue-700 dark:text-blue-300">{row.shareDigital.toFixed(1)}%</span>;
      case 'shareCatRede':
        return <span className="font-mono text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/5 px-1 py-0.5 rounded">{row.shareCatRede.toFixed(2)}%</span>;
      case 'shareCatDigital':
        return <span className="font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-500/5 px-1 py-0.5 rounded">{row.shareCatDigital.toFixed(2)}%</span>;
      case 'crescimentoRede':
        return (
          <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
            row.crescimentoRede >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
          }`}>
            {formatPercent(row.crescimentoRede)}
          </span>
        );
      case 'crescimentoDigital':
        return (
          <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
            row.crescimentoDigital >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
          }`}>
            {formatPercent(row.crescimentoDigital)}
          </span>
        );
      case 'crescimentoLinhaRede':
        return (
          <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
            row.crescimentoLinhaRede >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
          }`}>
            {formatPercent(row.crescimentoLinhaRede)}
          </span>
        );
      case 'crescimentoLinhaDigital':
        return (
          <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
            row.crescimentoLinhaDigital >= 0 ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
          }`}>
            {formatPercent(row.crescimentoLinhaDigital)}
          </span>
        );
      default:
        return null;
    }
  };

  // Helper to render total cell content
  const renderTotalCellContent = (colId, totals) => {
    switch (colId) {
      case 'faturamentoRede':
        return <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{formatBRL(totals.totRede)}</span>;
      case 'faturamentoDigital':
        return <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">{formatBRL(totals.totDigital)}</span>;
      case 'pesoIndLinhaRede':
        return (
          <span className="font-mono text-purple-700 dark:text-purple-300 font-extrabold bg-purple-500/15 px-1 py-0.5 rounded border border-purple-500/30">
            {totals.totPesoIndLinhaRede !== undefined ? `${totals.totPesoIndLinhaRede.toFixed(1)}%` : '100.0%'}
          </span>
        );
      case 'pesoIndLinhaDigital':
        return (
          <span className="font-mono text-indigo-700 dark:text-indigo-300 font-extrabold bg-indigo-500/15 px-1 py-0.5 rounded border border-indigo-500/30">
            {totals.totPesoIndLinhaDigital !== undefined ? `${totals.totPesoIndLinhaDigital.toFixed(1)}%` : '100.0%'}
          </span>
        );
      case 'shareRede':
        return <span className="font-mono text-slate-800 dark:text-slate-300">{totals.totShareRede.toFixed(1)}%</span>;
      case 'shareDigital':
        return <span className="font-mono text-blue-700 dark:text-blue-300">{totals.totShareDigital.toFixed(1)}%</span>;
      case 'shareCatRede':
        return <span className="font-mono text-amber-700 dark:text-amber-300 font-extrabold bg-amber-500/10 px-1 py-0.5 rounded">{totals.totShareCatRede.toFixed(2)}%</span>;
      case 'shareCatDigital':
        return <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-1 py-0.5 rounded">{totals.totShareCatDigital.toFixed(2)}%</span>;
      case 'crescimentoRede':
        return (
          <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
            totals.crescRede >= 0 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {formatPercent(totals.crescRede)}
          </span>
        );
      case 'crescimentoDigital':
        return (
          <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
            totals.crescDigital >= 0 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {formatPercent(totals.crescDigital)}
          </span>
        );
      case 'crescimentoLinhaRede':
        return (
          <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
            totals.crescLinhaRede >= 0 ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {formatPercent(totals.crescLinhaRede)}
          </span>
        );
      case 'crescimentoLinhaDigital':
        return (
          <span className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
            totals.crescLinhaDigital >= 0 ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {formatPercent(totals.crescLinhaDigital)}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      
      {/* Top Banner / Header Info */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.18)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-0.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Matriz Multicanal — Visão por Linhas & Produtos</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white font-['Montserrat'] tracking-tight">
              Análise de Desempenho: Rede vs. Digital
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Fornecedor: <span className="text-slate-200 font-semibold">{displaySupplier}</span> | Comparativo: <span className="text-red-400 font-semibold">{periodLabel}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-xl text-right">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Faturamento Total Rede</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">{formatBRL(supplierTotals.redeCurrent)}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-xl text-right">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Faturamento Digital</span>
              <span className="text-base font-extrabold text-blue-400 font-mono">{formatBRL(supplierTotals.digitalCurrent)}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-xl text-right">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">Participação Digital</span>
              <span className="text-base font-extrabold text-purple-400 font-mono">
                {supplierTotals.redeCurrent > 0 
                  ? `${((supplierTotals.digitalCurrent / supplierTotals.redeCurrent) * 100).toFixed(1)}%` 
                  : '0.0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 1: SPLIT GRID - LEFT: TABLE 1 | RIGHT: DYNAMIC TIMELINE LINE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: BLOCK 1 - TABELA DINÂMICA 1 (60% width on desktop -> col-span-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.10)] flex flex-col justify-between space-y-3 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-md">
                <Layers className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white font-['Montserrat']">
                    1. Desempenho por {linhaRowFields.join(' > ')}
                  </h2>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                    {sortedLinhas.length}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  💡 Clique em <span className="text-emerald-600 dark:text-emerald-400 font-bold">[-] / [+]</span> para expandir/recolher subgrupos como no Excel.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 relative">
              {/* Expand / Collapse All Controls */}
              {linhaRowFields.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => expandAllGroups(sortedLinhas.filter(r => r.isParent).map(r => r.groupKey))}
                    className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 text-[9px] font-bold"
                    title="Expandir Todos os Grupos"
                  >
                    [+] Expandir
                  </button>
                  <button
                    onClick={collapseAllGroups}
                    className="p-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 text-[9px] font-bold"
                    title="Recolher Todos os Grupos"
                  >
                    [-] Recolher
                  </button>
                </div>
              )}

              {/* Search input */}
              <div className="relative w-24 sm:w-28">
                <Search className="absolute left-2 top-1.5 w-3 h-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchLinha}
                  onChange={(e) => setSearchLinha(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* EXCEL PIVOT TABLE FIELD LIST MODAL BUTTON */}
              <button
                onClick={() => setActivePivotModal('linha')}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md bg-gradient-to-r from-emerald-700 to-green-800 hover:from-emerald-600 hover:to-green-700 text-white shadow-md transition-all border border-emerald-600/50"
                title="Abrir Campos da Tabela Dinâmica (Estilo Excel)"
              >
                <Grid className="w-3 h-3 text-emerald-700 dark:text-emerald-300" />
                <span>Colunas</span>
                <span className="ml-0.5 bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[8px] px-1 rounded font-mono">
                  {activeLinhaCols.length}/{linhaCols.length}
                </span>
              </button>

              {/* WORKING CSV DOWNLOAD BUTTON */}
              <button
                onClick={handleExportLinhasCSV}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-md transition-all border border-slate-200 dark:border-slate-700 shrink-0"
                title="Baixar Planilha CSV"
              >
                <Download className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>

          {/* EXCEL PIVOT TREE TABLE WITH DRILL-DOWN INDENTATION */}
          <div className="overflow-x-auto overflow-y-auto max-h-[340px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 shadow-inner">
            <table className="w-full text-left border-collapse font-sans">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 border-y border-slate-300 dark:border-slate-700 shadow-sm select-none">
                <tr className="text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                  <th 
                    onClick={() => {
                      if (sortLinhaKey === 'nomeItem') {
                        setSortLinhaOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortLinhaKey('nomeItem');
                        setSortLinhaOrder('asc');
                      }
                    }}
                    className={`py-2 px-2.5 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors group select-none ${
                      sortLinhaKey === 'nomeItem' ? 'text-red-600 dark:text-red-400 font-extrabold bg-slate-200/50 dark:bg-slate-800/60' : ''
                    }`}
                    title="Clique para ordenar alfabeticamente (A-Z / Z-A)"
                  >
                    <div className="flex items-center gap-1">
                      <span>{linhaRowFields.length > 1 ? `${linhaRowFields[0]} / ${linhaRowFields[1]}` : linhaRowFields[0]}</span>
                      {sortLinhaKey === 'nomeItem' ? (
                        sortLinhaOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-red-500 font-bold shrink-0" /> : <ChevronDown className="w-3 h-3 text-red-500 font-bold shrink-0" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 text-slate-400 transition-opacity shrink-0" />
                      )}
                    </div>
                  </th>

                  {activeLinhaCols.map((col, idx) => (
                    <th 
                      key={col.id}
                      draggable={true}
                      onDragStart={() => setDraggedLinhaIdx(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleLinhaHeaderDrop(idx)}
                      onClick={() => {
                        if (sortLinhaKey === col.id) {
                          setSortLinhaOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortLinhaKey(col.id);
                          setSortLinhaOrder('desc');
                        }
                      }}
                      className={`py-2 px-1.5 text-right cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors group select-none ${
                        col.highlight ? 'text-amber-600 dark:text-amber-400 font-bold' : 'hover:text-slate-900 dark:hover:text-white'
                      } ${sortLinhaKey === col.id ? 'bg-slate-200/80 dark:bg-slate-800/90 text-red-600 dark:text-red-400 font-extrabold' : ''}`} 
                      title={`${col.title} • Clique para ordenar maior/menor`}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <GripVertical 
                          className="w-2.5 h-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 cursor-grab shrink-0" 
                          onClick={(e) => e.stopPropagation()} 
                          title="Arraste para reordenar coluna"
                        />
                        <span>{col.label}</span>
                        {sortLinhaKey === col.id ? (
                          sortLinhaOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-red-500 font-bold shrink-0" /> : <ChevronDown className="w-3 h-3 text-red-500 font-bold shrink-0" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 text-slate-400 transition-opacity shrink-0" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/40 text-[10.5px]">
                {sortedLinhas.length > 0 ? (
                  sortedLinhas.map((row, idx) => {
                    const isParent = row.isParent;
                    const isSelected = selectedLinha === row.nomeItem;

                    return (
                      <tr 
                        key={idx} 
                        onClick={() => handleSelectLinha(row.nomeItem)}
                        className={`cursor-pointer transition-all ${
                          isParent 
                            ? isSelected
                              ? 'bg-red-100 dark:bg-red-950/60 font-extrabold text-slate-900 dark:text-white border-l-4 border-red-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-900/90 font-bold text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/60' 
                            : isSelected 
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-white font-bold border-l-4 border-red-600 shadow-xs' 
                              : 'even:bg-slate-50 dark:even:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <td className="py-1.5 px-2.5">
                          <div className={`flex items-center gap-1.5 ${row.level === 1 ? 'pl-6 border-l border-slate-200 dark:border-slate-800 ml-2' : ''}`}>
                            {isParent ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleGroupExpand(row.groupKey); }}
                                className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:text-emerald-300 font-bold transition-colors select-none"
                              >
                                {row.isExpanded ? <MinusSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <PlusSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs font-['Montserrat']">{row.nomeItem}</span>
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">({row.childCount})</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0"></span>
                                <span className="truncate max-w-[150px]" title={row.nomeItem}>
                                  {row.nomeItem}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {activeLinhaCols.map(col => (
                          <td key={col.id} className="py-1.5 px-1.5 text-right font-mono">
                            {renderCellContent(col.id, row)}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={activeLinhaCols.length + 1} className="py-6 text-center text-slate-500 text-xs">
                      Nenhum item encontrado.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* FOOTER TOTAL ROW FOR LINHAS TABLE */}
              {sortedLinhas.length > 0 && (
                <tfoot className="sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] text-[10px]">
                  <tr className="text-slate-800 dark:text-slate-200 bg-transparent font-extrabold">
                    <td className="py-2 px-2.5 text-red-600 dark:text-red-400 font-extrabold uppercase font-['Montserrat'] flex items-center gap-1">
                      <span>TOTAL GERAL</span>
                    </td>

                    {activeLinhaCols.map(col => (
                      <td key={col.id} className="py-2 px-1.5 text-right font-mono">
                        {renderTotalCellContent(col.id, linhasTotals)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>


        {/* RIGHT COLUMN: TIMELINE LINE CHART WITH DYNAMIC METRIC SELECTOR */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.10)] flex flex-col justify-between space-y-3">
          <div className="flex flex-col gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md">
                  <LineChartIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white font-['Montserrat'] max-w-[180px] truncate" title={chartTitle}>
                    {chartTitle}
                  </h3>
                </div>
              </div>

              {(selectedLinha || selectedProduto) && (
                <button
                  onClick={() => { setSelectedLinha(null); setSelectedProduto(null); }}
                  className="flex items-center gap-1 text-[10px] bg-red-500/15 hover:bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30 transition-colors"
                  title="Limpar seleção e voltar à Visão Geral"
                >
                  <X className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            {/* DYNAMIC METRIC SELECTOR BAR FOR CHART */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 gap-2">
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase shrink-0 flex items-center gap-1">
                <BarChart2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Métrica:</span>
              </span>
              <select
                value={chartMetric}
                onChange={(e) => setChartMetric(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-[10px] font-semibold border border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 focus:outline-none focus:border-red-500 w-full cursor-pointer"
              >
                <option value="faturamento_both">💰 Faturamento (Rede vs. Digital)</option>
                <option value="faturamento_rede">🏪 Faturamento Rede (R$)</option>
                <option value="faturamento_digital">📱 Faturamento Digital (R$)</option>
                <option value="share_industria">📈 Share no Fornecedor (%)</option>
                <option value="share_categoria">🏆 Share na Categoria Nexus Varejo (%)</option>
                <option value="crescimento">🚀 Taxa de Δ (%)</option>
              </select>
            </div>
          </div>

          {/* Recharts LineChart Timeline */}
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis 
                  dataKey="month" 
                  stroke="#94A3B8" 
                  fontSize={11}
                  tick={{ fill: '#94A3B8' }}
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={10} 
                  tickFormatter={(val) => {
                    const isCurrency = chartDataKeys[0]?.type === 'currency';
                    if (isCurrency) return formatCompactBRL(val);
                    return `${val.toFixed(1)}%`;
                  }}
                  tick={{ fill: '#64748B' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1.5">
                          <p className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1">{label}</p>
                          {payload.map((item, pIdx) => {
                            const isCurrency = chartDataKeys.find(k => k.key === item.dataKey)?.type === 'currency';
                            const valStr = isCurrency ? formatBRL(item.value) : `${item.value.toFixed(2)}%`;
                            return (
                              <div key={pIdx} className="flex items-center justify-between gap-4" style={{ color: item.color }}>
                                <span>{item.dataKey}:</span>
                                <span className="font-mono font-bold">{valStr}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                  iconSize={10}
                />
                {chartDataKeys.map((dk, dkIdx) => (
                  <Line 
                    key={dkIdx}
                    type="monotone" 
                    dataKey={dk.key} 
                    stroke={dk.color} 
                    strokeWidth={3} 
                    dot={{ r: 5, strokeWidth: 2, fill: '#090D16' }}
                    activeDot={{ r: 7, strokeWidth: 2, fill: dk.color }}
                    name={dk.key} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>


      {/* ROW 2: BLOCK 2 - PLANILHA POR PRODUTO / CUSTOM DIMENSION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.10)] space-y-3 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-['Montserrat']">
                  2. Desempenho por {produtoRowFields.join(' > ')}
                </h2>

                {selectedLinha && (
                  <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
                    <span>Filtrado por: <strong>{selectedLinha}</strong></span>
                    <button 
                      onClick={() => setSelectedLinha(null)} 
                      title="Limpar filtro"
                      className="hover:bg-red-200 dark:hover:bg-red-800/60 p-0.5 rounded-full transition-colors text-red-700 dark:text-red-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {selectedProduto && (
                  <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
                    <span>No Gráfico: <strong>{selectedProduto.nomeItem.substring(0, 20)}...</strong></span>
                    <button 
                      onClick={() => setSelectedProduto(null)} 
                      title="Limpar seleção de item"
                      className="hover:bg-blue-200 dark:hover:bg-blue-800/60 p-0.5 rounded-full transition-colors text-blue-700 dark:text-blue-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                💡 Arraste colunas ou abra os <span className="text-blue-600 dark:text-blue-400">Campos da Tabela Dinâmica</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 relative">
            {/* Search input */}
            <div className="relative w-full md:w-44">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchProduto}
                onChange={(e) => setSearchProduto(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* EXCEL PIVOT TABLE FIELD LIST MODAL BUTTON */}
            <button
              onClick={() => setActivePivotModal('produto')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-700 to-green-800 hover:from-emerald-600 hover:to-green-700 text-white shadow-md transition-all border border-emerald-600/50"
              title="Abrir Campos da Tabela Dinâmica (Estilo Excel)"
            >
              <Grid className="w-3.5 h-3.5 text-blue-700 dark:text-blue-300" />
              <span>Colunas</span>
              <span className="ml-0.5 bg-blue-950 text-blue-700 dark:text-blue-300 text-[9px] px-1.5 rounded font-mono">
                {activeProdutoCols.length}/{produtoCols.length}
              </span>
            </button>

            {/* WORKING CSV DOWNLOAD BUTTON */}
            <button
              onClick={handleExportProdutosCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white text-xs font-bold rounded-lg transition-all border border-slate-200 dark:border-slate-700 shrink-0"
              title="Exportar CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* EXCEL PIVOT TREE TABLE FOR BLOCK 2 */}
        <div className="overflow-x-auto overflow-y-auto max-h-[360px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 shadow-inner">
          <table className="w-full text-left border-collapse font-sans">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 border-y border-slate-300 dark:border-slate-700 shadow-sm select-none">
              <tr className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th 
                  onClick={() => {
                    if (sortProdutoKey === 'nomeItem') {
                      setSortProdutoOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortProdutoKey('nomeItem');
                      setSortProdutoOrder('asc');
                    }
                  }}
                  className={`py-2.5 px-3 cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors group select-none ${
                    sortProdutoKey === 'nomeItem' ? 'text-blue-600 dark:text-blue-400 font-extrabold bg-slate-200/50 dark:bg-slate-800/60' : ''
                  }`}
                  title="Clique para ordenar alfabeticamente (A-Z / Z-A)"
                >
                  <div className="flex items-center gap-1">
                    <span>{produtoRowFields.length > 1 ? `${produtoRowFields[0]} / ${produtoRowFields[1]}` : produtoRowFields[0]}</span>
                    {sortProdutoKey === 'nomeItem' ? (
                      sortProdutoOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500 font-bold shrink-0" /> : <ChevronDown className="w-3 h-3 text-blue-500 font-bold shrink-0" />
                    ) : (
                      <ArrowUpDown className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 text-slate-400 transition-opacity shrink-0" />
                    )}
                  </div>
                </th>

                {activeProdutoCols.map((col, idx) => (
                  <th 
                    key={col.id}
                    draggable={true}
                    onDragStart={() => setDraggedProdutoIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleProdutoHeaderDrop(idx)}
                    onClick={() => {
                      if (sortProdutoKey === col.id) {
                        setSortProdutoOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortProdutoKey(col.id);
                        setSortProdutoOrder('desc');
                      }
                    }}
                    className={`py-2.5 px-2 text-right cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors group select-none ${
                      col.highlight ? 'text-amber-600 dark:text-amber-400 font-bold' : 'hover:text-slate-900 dark:hover:text-white'
                    } ${sortProdutoKey === col.id ? 'bg-slate-200/80 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 font-extrabold' : ''}`}
                    title={`${col.title} • Clique para ordenar maior/menor`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <GripVertical 
                        className="w-2.5 h-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 cursor-grab shrink-0" 
                        onClick={(e) => e.stopPropagation()} 
                        title="Arraste para reordenar coluna"
                      />
                      <span>{col.label}</span>
                      {sortProdutoKey === col.id ? (
                        sortProdutoOrder === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500 font-bold shrink-0" /> : <ChevronDown className="w-3 h-3 text-blue-500 font-bold shrink-0" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 text-slate-400 transition-opacity shrink-0" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/40 text-[11px]">
              {paginatedProdutos.length > 0 ? (
                paginatedProdutos.map((row, idx) => {
                  const isParent = row.isParent;
                  const isSelected = selectedProduto?.id === row.id || selectedProduto?.nomeItem === row.nomeItem;
                  return (
                    <tr 
                      key={idx} 
                      onClick={() => handleSelectProduto(row)}
                      className={`cursor-pointer transition-all ${
                        isParent 
                          ? isSelected
                            ? 'bg-blue-100 dark:bg-blue-950/60 font-extrabold text-slate-900 dark:text-white border-l-4 border-blue-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/90 font-bold text-slate-900 dark:text-white border-t border-slate-300 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/60' 
                          : isSelected 
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-white font-bold border-l-4 border-blue-600 shadow-xs' 
                            : 'even:bg-slate-50 dark:even:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className={`flex items-center gap-1.5 ${row.level === 1 ? 'pl-6 border-l border-slate-200 dark:border-slate-800 ml-2' : ''}`}>
                          {isParent ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleGroupExpand(row.groupKey); }}
                              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300 font-bold transition-colors select-none"
                            >
                              {row.isExpanded ? <MinusSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> : <PlusSquare className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                              <span className="font-extrabold text-slate-900 dark:text-white text-xs font-['Montserrat']">{row.nomeItem}</span>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-normal">({row.childCount})</span>
                            </button>
                          ) : (
                            <div>
                              <div className={`font-bold max-w-sm truncate ${isSelected ? 'text-blue-700 dark:text-blue-300 font-extrabold' : 'text-slate-900 dark:text-white'}`} title={row.nomeItem}>
                                {row.nomeItem}
                              </div>
                              {row.subText && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {row.subText}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {activeProdutoCols.map(col => (
                        <td key={col.id} className="py-2.5 px-2 text-right font-mono">
                          {renderCellContent(col.id, row)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={activeProdutoCols.length + 1} className="py-6 text-center text-slate-500 text-xs">
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}
            </tbody>

            {/* FOOTER TOTAL ROW FOR PRODUTOS TABLE */}
            {sortedProdutos.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] text-[10px]">
                <tr className="text-slate-800 dark:text-slate-200 bg-transparent font-extrabold">
                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-extrabold uppercase font-['Montserrat'] flex items-center gap-1">
                    <span>TOTAL GERAL</span>
                  </td>

                  {activeProdutoCols.map(col => (
                    <td key={col.id} className="py-2.5 px-2 text-right font-mono">
                      {renderTotalCellContent(col.id, produtosTotals)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* PAGINATION BAR FOR TABLE 2 (PRODUTOS) */}
        {sortedProdutos.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-xs rounded-b-2xl">
            <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
              <span>Exibindo</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {produtoPageSize === 'all' ? 1 : Math.min((produtoPage - 1) * produtoPageSize + 1, sortedProdutos.length)}
              </span>
              <span>–</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {produtoPageSize === 'all' ? sortedProdutos.length : Math.min(produtoPage * produtoPageSize, sortedProdutos.length)}
              </span>
              <span>de</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{sortedProdutos.length}</span>
              <span>itens</span>

              <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-300 dark:border-slate-700">
                <span>Por página:</span>
                <select
                  value={produtoPageSize}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setProdutoPageSize(val);
                    setProdutoPage(1);
                  }}
                  className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-0.5 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">Todos ({sortedProdutos.length})</option>
                </select>
              </div>
            </div>

            {/* Page Navigation Buttons */}
            {produtoPageSize !== 'all' && totalProdutoPages > 1 && (
              <div className="flex items-center gap-1 select-none">
                <button
                  onClick={() => setProdutoPage(1)}
                  disabled={produtoPage === 1}
                  className="px-2 py-1 rounded-md text-xs font-semibold border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  title="Primeira página"
                >
                  «
                </button>
                <button
                  onClick={() => setProdutoPage(prev => Math.max(1, prev - 1))}
                  disabled={produtoPage === 1}
                  className="flex items-center gap-0.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <div className="px-2.5 py-1 font-mono font-bold text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-900">
                  {produtoPage} / {totalProdutoPages}
                </div>

                <button
                  onClick={() => setProdutoPage(prev => Math.min(totalProdutoPages, prev + 1))}
                  disabled={produtoPage === totalProdutoPages}
                  className="flex items-center gap-0.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setProdutoPage(totalProdutoPages)}
                  disabled={produtoPage === totalProdutoPages}
                  className="px-2 py-1 rounded-md text-xs font-semibold border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  title="Última página"
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </div>


      {/* EXCEL PIVOT TABLE FIELD LIST PANEL (EXACT MICROSOFT EXCEL FIELD LIST) */}
      {activePivotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-950/85 backdrop-blur-sm animate-fadeIn p-3">
          <div className="bg-[#f0f3f6] text-slate-800 border-2 border-slate-400 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[95vh]">
            
            {/* EXCEL TITLE BAR */}
            <div className="bg-[#e6ebf0] border-b border-slate-300 px-3.5 py-2 flex items-center justify-between select-none">
              <span className="text-sm font-semibold text-[#1e5a38] flex items-center gap-2 font-['Segoe_UI',sans-serif]">
                <span>Campos da Tabela Dinâmica JBP</span>
                <span className="text-[10px] bg-[#217346] text-white px-2 py-0.2 rounded font-bold">
                  20 Campos Reais
                </span>
              </span>
              <div className="flex items-center gap-1 text-slate-600">
                <button title="Opções" className="p-1 hover:bg-slate-300 rounded">
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setActivePivotModal(null)} className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* EXCEL PANEL CONTENT BODY */}
            <div className="p-3.5 space-y-3 overflow-y-auto flex-1 text-xs">
              
              {/* SUBTITLE */}
              <p className="text-[11px] text-slate-600 font-medium">
                Escolha os campos da base JBP para adicionar e mover entre as áreas do relatório:
              </p>

              {/* SEARCH FIELD BOX */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar campo JBP (ex: NOME_LINHA, SUBGRUPO, PRODUTO_ID...)"
                  value={pivotSearchField}
                  onChange={(e) => setPivotSearchField(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#217346]"
                />
                <Search className="absolute right-2.5 top-1.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>

              {/* FIELD LIST BOX (ALL 20 REAL JBP FIELDS) */}
              <div className="bg-white border border-slate-300 rounded shadow-inner p-2 max-h-48 overflow-y-auto space-y-1">
                {ALL_JBP_FIELDS
                  .filter(f => f.label.toLowerCase().includes(pivotSearchField.toLowerCase()) || f.id.toLowerCase().includes(pivotSearchField.toLowerCase()))
                  .map((field) => {
                    const colId = FIELD_TO_COL_MAP[field.id] || field.id;
                    const isInFiltros = filtrosFields.includes(field.id);
                    const isInLinhas = (activePivotModal === 'linha' ? linhaRowFields : produtoRowFields).includes(field.id);
                    const isInValores = valoresFields.includes(field.id);
                    const isInColunas = (activePivotModal === 'linha' ? linhaCols : produtoCols).some(c => (c.id === colId || c.id === field.id) && c.visible);

                    const isChecked = isInFiltros || isInLinhas || isInValores || isInColunas;

                    return (
                      <div 
                        key={field.id}
                        draggable={true}
                        onDragStart={() => setDraggedFieldId(field.id)}
                        className="flex items-center justify-between px-2 py-1 hover:bg-slate-100 rounded text-slate-800 select-none border border-transparent hover:border-slate-300 transition-all"
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                moveFieldToArea(field.id, 'none');
                              } else {
                                if (FIELD_TO_COL_MAP[field.id]) {
                                  moveFieldToArea(field.id, 'colunas');
                                } else if (field.type === 'value') {
                                  moveFieldToArea(field.id, 'valores');
                                } else {
                                  moveFieldToArea(field.id, 'linhas');
                                }
                              }
                            }}
                            className="rounded border-slate-400 text-[#217346] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className={isChecked ? 'font-bold text-[#1e5a38]' : 'text-slate-700'}>
                            {field.label}
                          </span>
                        </label>

                        {/* SELECTOR FOR DIRECT MOVEMENT BETWEEN AREAS */}
                        <div className="flex items-center gap-1">
                          <select
                            value={isInFiltros ? 'filtros' : isInLinhas ? 'linhas' : isInValores ? 'valores' : isInColunas ? 'colunas' : 'none'}
                            onChange={(e) => moveFieldToArea(field.id, e.target.value)}
                            className="bg-slate-100 border border-slate-300 text-[10px] text-slate-700 rounded px-1 py-0.5 focus:outline-none focus:border-[#217346] cursor-pointer"
                          >
                            <option value="none">Nenhuma</option>
                            <option value="filtros">🔍 Filtros</option>
                            <option value="linhas">≡ Linhas</option>
                            <option value="colunas">||| Colunas</option>
                            <option value="valores">Σ Valores</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* DIVIDER TEXT */}
              <p className="text-[11px] text-slate-600 font-medium pt-1">
                Arraste ou escolha a área para movimentar os campos:
              </p>

              {/* 2x2 QUADRANTS GRID (FREE MOVEMENT OF ALL 20 FIELDS) */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                
                {/* 1. TOP LEFT: FILTROS */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => draggedFieldId && moveFieldToArea(draggedFieldId, 'filtros')}
                  className="border border-slate-300 rounded bg-white overflow-hidden shadow-sm flex flex-col justify-between min-h-32"
                >
                  <div className="bg-[#e8ecef] px-2 py-1 border-b border-slate-300 flex items-center justify-between font-semibold text-slate-700 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Filter className="w-3 h-3 text-slate-600" />
                      <span>Filtros ({filtrosFields.length})</span>
                    </span>
                  </div>
                  <div className="p-1.5 flex-1 overflow-y-auto space-y-1 max-h-28">
                    {filtrosFields.map(fId => {
                      const fObj = ALL_JBP_FIELDS.find(o => o.id === fId) || { label: fId };
                      return (
                        <div key={fId} className="bg-amber-50 border border-amber-300 rounded px-1.5 py-0.5 text-[10px] text-slate-800 flex items-center justify-between">
                          <span className="truncate max-w-[140px] font-semibold">{fObj.label}</span>
                          <button onClick={() => moveFieldToArea(fId, 'none')} className="hover:text-red-600 p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. TOP RIGHT: COLUNAS */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => draggedFieldId && moveFieldToArea(draggedFieldId, 'colunas')}
                  className="border border-slate-300 rounded bg-white overflow-hidden shadow-sm flex flex-col justify-between min-h-32"
                >
                  <div className="bg-[#e8ecef] px-2 py-1 border-b border-slate-300 flex items-center justify-between font-semibold text-slate-700 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Columns className="w-3 h-3 text-slate-600" />
                      <span>Colunas ({ (activePivotModal === 'linha' ? activeLinhaCols : activeProdutoCols).length })</span>
                    </span>
                  </div>
                  <div className="p-1.5 flex-1 overflow-y-auto space-y-1 max-h-32">
                    {(activePivotModal === 'linha' ? activeLinhaCols : activeProdutoCols).map(c => (
                      <div key={c.id} className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-800 flex items-center justify-between">
                        <span className="truncate max-w-[140px] font-semibold">{c.label}</span>
                        <button 
                          onClick={() => activePivotModal === 'linha' ? toggleLinhaCol(c.id) : toggleProdutoCol(c.id)} 
                          className="hover:text-red-600 p-0.5"
                          title="Remover das colunas visíveis"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Colunas inativas disponíveis para adicionar com 1 clique */}
                    {(activePivotModal === 'linha' ? linhaCols : produtoCols).filter(c => !c.visible).length > 0 && (
                      <div className="pt-1.5 border-t border-dashed border-slate-300 mt-1.5">
                        <div className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wide">
                          Disponíveis para adicionar:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(activePivotModal === 'linha' ? linhaCols : produtoCols).filter(c => !c.visible).map(c => (
                            <button
                              key={c.id}
                              onClick={() => activePivotModal === 'linha' ? toggleLinhaCol(c.id) : toggleProdutoCol(c.id)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9.5px] px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold transition-colors shadow-xs"
                              title={`Adicionar coluna ${c.label} à visualização`}
                            >
                              <Plus className="w-2.5 h-2.5 text-emerald-700" />
                              <span>{c.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. BOTTOM LEFT: LINHAS */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => draggedFieldId && moveFieldToArea(draggedFieldId, 'linhas')}
                  className="border border-slate-300 rounded bg-white overflow-hidden shadow-sm flex flex-col justify-between min-h-36"
                >
                  <div className="bg-[#e8ecef] px-2 py-1 border-b border-slate-300 flex items-center justify-between font-semibold text-[#1e5a38] text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Rows className="w-3 h-3 text-[#1e5a38]" />
                      <span>Linhas / Hierarquia ({ (activePivotModal === 'linha' ? linhaRowFields : produtoRowFields).length })</span>
                    </span>
                  </div>

                  <div className="p-1.5 flex-1 overflow-y-auto space-y-1 max-h-32">
                    {(activePivotModal === 'linha' ? linhaRowFields : produtoRowFields).map((fieldId, idx) => {
                      const fObj = ALL_JBP_FIELDS.find(o => o.id === fieldId) || { label: fieldId };
                      return (
                        <div key={fieldId} className="bg-emerald-50 border border-emerald-300 rounded px-1.5 py-0.5 text-[10.5px] text-slate-900 flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-1 truncate max-w-[120px]">
                            <span className="font-bold text-emerald-800">{idx + 1}.</span>
                            <span className="font-bold truncate">{fObj.label}</span>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => activePivotModal === 'linha' ? moveLinhaRowField(idx, -1) : moveProdutoRowField(idx, -1)}
                              disabled={idx === 0}
                              className="p-0.5 hover:bg-emerald-200 rounded disabled:opacity-20 text-emerald-800"
                              title="Subir"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => activePivotModal === 'linha' ? moveLinhaRowField(idx, 1) : moveProdutoRowField(idx, 1)}
                              disabled={idx === (activePivotModal === 'linha' ? linhaRowFields : produtoRowFields).length - 1}
                              className="p-0.5 hover:bg-emerald-200 rounded disabled:opacity-20 text-emerald-800"
                              title="Descer"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => moveFieldToArea(fieldId, 'none')}
                              className="p-0.5 hover:bg-red-200 text-red-600 rounded"
                              title="Remover"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. BOTTOM RIGHT: VALORES */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => draggedFieldId && moveFieldToArea(draggedFieldId, 'valores')}
                  className="border border-slate-300 rounded bg-white overflow-hidden shadow-sm flex flex-col justify-between min-h-36"
                >
                  <div className="bg-[#e8ecef] px-2 py-1 border-b border-slate-300 flex items-center justify-between font-semibold text-slate-700 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Sigma className="w-3.5 h-3.5 text-slate-600" />
                      <span>Valores / Métricas ({valoresFields.length})</span>
                    </span>
                  </div>
                  <div className="p-1.5 flex-1 overflow-y-auto space-y-1 max-h-32">
                    {valoresFields.map(vId => {
                      const fObj = ALL_JBP_FIELDS.find(o => o.id === vId) || { label: vId };
                      return (
                        <div key={vId} className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-800 flex items-center justify-between">
                          <span className="truncate max-w-[130px] font-semibold">{fObj.label}</span>
                          <button onClick={() => moveFieldToArea(vId, 'none')} className="hover:text-red-600 p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>

            {/* EXCEL PANEL FOOTER */}
            <div className="bg-[#e6ebf0] px-3.5 py-2.5 border-t border-slate-300 flex items-center justify-between">
              <button
                onClick={() => {
                  setFiltrosFields(['ANO_MES']);
                  if (activePivotModal === 'linha') { setLinhaCols(DEFAULT_LINHA_COLS); setLinhaRowFields(['NOME_LINHA']); }
                  else { setProdutoCols(DEFAULT_PRODUTO_COLS); setProdutoRowFields(['PRODUTO_NOME']); }
                  setValoresFields(['VL_LIQUIDO', 'FAT_DIGITAL', 'QT_VENDIDA']);
                }}
                className="text-[11px] text-slate-600 hover:text-[#217346] font-medium transition-colors"
              >
                Restaurar Padrão
              </button>
              <button
                onClick={() => setActivePivotModal(null)}
                className="px-4 py-1.5 bg-[#217346] hover:bg-[#1a5c37] text-white font-semibold rounded text-xs shadow transition-colors"
              >
                OK / Atualizar Relatório
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

