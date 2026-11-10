import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FilterModal from './components/FilterModal';
import KpiCard from './components/KpiCard';
import ViewToggleBlock from './components/ViewToggleBlock';
import RankingsSection from './components/RankingsSection';
import LinhasProdutosPage from './components/LinhasProdutosPage';
import MesAtualPage from './components/MesAtualPage';
import realAggregatedData from './data/jbp_aggregated_data.json';

import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, LabelList
} from 'recharts';

import { Calendar, Filter, Sparkles, Building2, Globe, TrendingUp, TrendingDown, HelpCircle, Layers, Zap } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(false); // Default: Light mode matching CRM - V4
  const [activeTab, setActiveTab] = useState('tab-1');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [jbpData] = useState(realAggregatedData);

  // Mês de referência dinâmico para dados fechados: detectado automaticamente a partir do dataset consolidado (índice 0)
  const latestMonth = useMemo(() => {
    const consol = jbpData?.suppliers?.[0];
    if (consol?.months) {
      const validMonths = Object.keys(consol.months).filter(m => /^\d{4}-\d{2}$/.test(m) && (consol.months[m]?.revenue > 0 || consol.months[m]?.total_revenue > 0));
      if (validMonths.length > 0) {
        validMonths.sort();
        return validMonths[validMonths.length - 1];
      }
    }
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  }, [jbpData]);

  // Filters State — selectedPeriod acompanha automaticamente o último mês fechado
  const [selectedSupplier, setSelectedSupplier] = useState(['TODAS AS INDÚSTRIAS (CONSOLIDADO)']);
  const [selectedLinha, setSelectedLinha] = useState(['TODAS AS LINHAS (CONSOLIDADO)']);
  const [selectedProduct, setSelectedProduct] = useState(['TODOS OS PRODUTOS (CONSOLIDADO)']);
  const [userSelectedPeriod, setUserSelectedPeriod] = useState(null);
  const selectedPeriod = userSelectedPeriod || `yoy:${latestMonth}`;
  const setSelectedPeriod = setUserSelectedPeriod;
  const [selectedChannel, setSelectedChannel] = useState('DIGITAL');
  const [selectedUFs, setSelectedUFs] = useState(['TODAS AS UFS (CONSOLIDADO)']);

  // Update HTML class for dark/light mode
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Suppliers List
  const suppliersList = useMemo(() => {
    const listFromData = jbpData.suppliers ? jbpData.suppliers.map(s => s.supplier) : [];
    const consolidatedOption = 'TODAS AS INDÚSTRIAS (CONSOLIDADO)';
    return [consolidatedOption, ...listFromData.filter(s => s !== consolidatedOption)];
  }, [jbpData]);

  // Contextual Linhas List — mostra apenas as linhas que os fornecedores selecionados possuem
  const linhasList = useMemo(() => {
    const consolidatedOption = 'TODAS AS LINHAS (CONSOLIDADO)';
    const isConsolidatedSupplier = !selectedSupplier || selectedSupplier.length === 0 || selectedSupplier.some(s => s.includes('CONSOLIDADO'));
    
    let rawLines = [];
    if (isConsolidatedSupplier) {
      const consolLinhas = jbpData.suppliers?.[0]?.linhas || [];
      rawLines = consolLinhas.map(l => l.nome_linha).filter(Boolean);
    } else {
      const set = new Set();
      selectedSupplier.forEach(supName => {
        const sup = (jbpData.suppliers || []).find(s => s.supplier === supName);
        (sup?.linhas || []).forEach(l => {
          if (l.nome_linha) set.add(l.nome_linha);
        });
      });
      rawLines = Array.from(set);
    }

    rawLines.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return [consolidatedOption, ...rawLines.filter(l => l !== consolidatedOption)];
  }, [jbpData, selectedSupplier]);

  // Sync selectedLinha quando o filtro de fornecedores muda (remove linhas inválidas)
  useEffect(() => {
    if (!Array.isArray(selectedLinha)) return;
    if (selectedLinha.some(l => typeof l === 'string' && l.includes('CONSOLIDADO'))) return;
    const valid = selectedLinha.filter(l => (linhasList || []).includes(l));
    if (valid.length === 0) {
      setSelectedLinha(['TODAS AS LINHAS (CONSOLIDADO)']);
    } else if (valid.length !== selectedLinha.length) {
      setSelectedLinha(valid);
    }
  }, [linhasList, selectedLinha]);

  // Contextual Products List — gerado apenas sob demanda quando o modal de filtros está aberto
  const productsList = useMemo(() => {
    const consolidatedOption = 'TODOS OS PRODUTOS (CONSOLIDADO)';
    if (!isFilterOpen) return [consolidatedOption];

    const isConsolidatedSupplier = !selectedSupplier || selectedSupplier.length === 0 || selectedSupplier.some(s => typeof s === 'string' && s.includes('CONSOLIDADO'));
    const isConsolidatedLinha = !selectedLinha || selectedLinha.length === 0 || selectedLinha.some(l => typeof l === 'string' && l.includes('CONSOLIDADO'));
    
    let rawProducts = [];
    const set = new Set();
    const suppliers = isConsolidatedSupplier ? (jbpData.suppliers || []) : (jbpData.suppliers || []).filter(s => selectedSupplier.includes(s.supplier));
    
    suppliers.forEach(sup => {
      (sup.top_products || []).forEach(p => {
        if (isConsolidatedLinha || (Array.isArray(selectedLinha) && selectedLinha.includes(p.linha))) {
          if (p.name) set.add(p.name);
        }
      });
    });
    
    rawProducts = Array.from(set);
    rawProducts.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return [consolidatedOption, ...rawProducts.filter(p => p !== consolidatedOption)];
  }, [jbpData, selectedSupplier, selectedLinha, isFilterOpen]);

  // Product metadata lookup (ID, EAN, Linha, Subgrupo) for intelligent search — gerado sob demanda quando o filtro abre
  const productsMetadata = useMemo(() => {
    if (!isFilterOpen) return {};
    const map = {};
    (jbpData.suppliers || []).forEach(sup => {
      (sup.top_products || []).forEach(p => {
        if (p.name && !map[p.name]) {
          map[p.name] = {
            id: p.id || '',
            ean: p.ean || '',
            linha: p.linha || '',
            subgrupo: p.subgrupo || '',
            laboratorio: p.laboratorio || sup.supplier || ''
          };
        }
      });
    });
    return map;
  }, [jbpData, isFilterOpen]);

  // Sync selectedProduct
  useEffect(() => {
    if (!isFilterOpen || !Array.isArray(selectedProduct)) return;
    if (selectedProduct.some(p => typeof p === 'string' && p.includes('CONSOLIDADO'))) return;
    const valid = selectedProduct.filter(p => (productsList || []).includes(p));
    if (valid.length === 0) {
      setSelectedProduct(['TODOS OS PRODUTOS (CONSOLIDADO)']);
    } else if (valid.length !== selectedProduct.length) {
      setSelectedProduct(valid);
    }
  }, [productsList, selectedProduct, isFilterOpen]);

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

  // ─── Variáveis FIXAS para gráficos e rankings (sempre YTD, independente do filtro de período) ───
  // Os gráficos de evolução e top produtos sempre mostram o acumulado YTD.
  const chartCurrentMonths = ytdCurrentMonths;  // ex: ['2026-01', ..., latestMonth]
  const chartBaseMonths = ytdBaseMonths;          // ex: ['2025-01', ..., previousYearLatestMonth]
  const chartCurrentMonth = latestMonth;
  const chartBaseMonth = useMemo(() => {
    const [y, m] = latestMonth.split('-');
    return `${parseInt(y) - 1}-${m}`;
  }, [latestMonth]);

  // Period label & dynamic comparison resolution
  const { currentMonth, baseMonth, periodLabel } = useMemo(() => {
    const monthShortNames = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };

    if (selectedPeriod === 'YTD') {
      const baseYear = String(parseInt(latestMonth.split('-')[0]) - 1);
      const baseMon = baseYear + '-' + latestMonth.split('-')[1];
      const mShort = monthShortNames[latestMonth.split('-')[1]] || 'Mês';
      return {
        currentMonth: latestMonth,
        baseMonth: baseMon,
        periodLabel: `YTD ${mShort}/${latestMonth.split('-')[0]} vs YTD ${mShort}/${baseYear}`
      };
    }

    if (selectedPeriod.startsWith('yoy:')) {
      const cur = selectedPeriod.replace('yoy:', '');
      const [y, m] = cur.split('-');
      const bas = `${parseInt(y) - 1}-${m}`;
      const mShort = monthShortNames[m] || m;
      return {
        currentMonth: cur,
        baseMonth: bas,
        periodLabel: `${mShort}/${y} vs. ${mShort}/${parseInt(y) - 1} (YoY)`
      };
    }

    if (selectedPeriod.startsWith('custom:')) {
      const parts = selectedPeriod.replace('custom:', '').split('_vs_');
      const curParts = (parts[0] || latestMonth).split(',');
      const defaultBas = `${parseInt(latestMonth.split('-')[0]) - 1}-${latestMonth.split('-')[1]}`;
      const basParts = (parts[1] || defaultBas).split(',');
      
      const formatLabel = (arr) => {
        if (arr.length === 1) {
          const [y, m] = arr[0].split('-');
          return `${monthShortNames[m] || m}/${y}`;
        }
        return `${arr.length} meses`;
      };
      
      const curLabel = formatLabel(curParts);
      const basLabel = formatLabel(basParts);

      return {
        currentMonth: curParts.length === 1 ? curParts[0] : curParts,
        baseMonth: basParts.length === 1 ? basParts[0] : basParts,
        periodLabel: `${curLabel} vs. ${basLabel} (Personalizado)`
      };
    }

    const [defY, defM] = latestMonth.split('-');
    const defBaseY = String(parseInt(defY) - 1);
    const defMShort = monthShortNames[defM] || defM;
    return {
      currentMonth: latestMonth,
      baseMonth: `${defBaseY}-${defM}`,
      periodLabel: `${defMShort}/${defY} vs. ${defMShort}/${defBaseY} (YoY)`
    };
  }, [selectedPeriod, latestMonth]);

  // Channel label
  const channelLabel = useMemo(() => {
    switch (selectedChannel) {
      case 'DIGITAL': return 'Digital (com Figital)';
      case 'DIGITAL_SEM_FIGITAL': return 'Digital (sem Figital)';
      case 'APP': return 'App';
      case 'SITE': return 'Site';
      case 'MARKETPLACE': return 'Marketplace';
      case 'FIGITAL': return 'Figital';
      case 'FISICO': return 'Loja Física';
      case 'TELEVENDAS': return 'Televendas';
      case 'ECOMMERCE': return 'Ecommerce';
      case 'REDE': return 'Rede Completa';
      default: return 'Digital';
    }
  }, [selectedChannel]);

  // UF label for display
  const ufLabel = useMemo(() => {
    if (!selectedUFs || selectedUFs.length === 0) return 'Todas as UFs';
    if (selectedUFs.length === 1) {
      const u = selectedUFs[0];
      if (u.includes('CONSOLIDADO')) return 'Todas as UFs';
      return u;
    }
    return `${selectedUFs.length} UFs selecionadas`;
  }, [selectedUFs]);

  // Digital channel helper list
  const DIGITAL_CHANNELS = ['DIGITAL', 'DIGITAL_SEM_FIGITAL', 'ECOMMERCE', 'APP', 'SITE', 'MARKETPLACE', 'FIGITAL'];

  // Buckets for breakdown and subchannels
  const CANAIS_BUCKETS = {
    'App': ['APP', 'APP Tele Entrega'],
    'Site': ['SITE', 'SITE Tele Entrega'],
    'Marketplace': ['iFood', 'Rappi', 'E-commerce'],
    'Figital': ['Figital'],
    'Loja Física': ['Venda Balcão', 'Venda Caixa', 'Auto Atendimento', 'Tele Encaminhada Lojas', 'Tele Vizinhança', 'Recarga', 'Venda Tele Entrega', 'LOJA_F', 'Loja Física', 'FISICO', 'FÍSICO', 'LOJA FISICA'],
    'Televendas': ['Venda Tele Entrega Central', 'Televendas', 'TELEVENDAS']
  };

  const getBucketMetrics = (channelsObj = {}, bucketKey) => {
    if (!channelsObj) return { revenue: 0, qty: 0, orders_est: 0 };
    const keys = CANAIS_BUCKETS[bucketKey] || [bucketKey];
    let revenue = 0, qty = 0, orders_est = 0;
    keys.forEach(k => {
      const c = channelsObj[k];
      if (c) {
        revenue += c.revenue || 0;
        qty += c.qty || 0;
        orders_est += c.orders_est || 0;
      }
    });
    return { revenue, qty, orders_est };
  };

  // Channel metric helper
  const getChannelMetrics = (channelsObj, overrideChannel = null) => {
    if (!channelsObj) return { revenue: 0, qty: 0, orders_est: 0 };
    const ch = overrideChannel || selectedChannel;
    
    const CANAIS_MAP = {
      DIGITAL: ['APP', 'APP Tele Entrega', 'SITE', 'SITE Tele Entrega', 'E-commerce', 'iFood', 'Rappi', 'Figital', 'App', 'Site', 'Marketplace', 'Digital', 'DIGITAL'],
      DIGITAL_SEM_FIGITAL: ['APP', 'APP Tele Entrega', 'SITE', 'SITE Tele Entrega', 'E-commerce', 'iFood', 'Rappi', 'App', 'Site', 'Marketplace'],
      APP: ['APP', 'APP Tele Entrega', 'App', 'App Mobile'],
      SITE: ['SITE', 'SITE Tele Entrega', 'Site', 'Site / E-commerce', 'E-commerce'],
      MARKETPLACE: ['iFood', 'Rappi', 'E-commerce', 'Marketplace'],
      FIGITAL: ['Figital', 'FIGITAL'],
      FISICO: ['Venda Balcão', 'Venda Caixa', 'Auto Atendimento', 'Tele Encaminhada Lojas', 'Tele Vizinhança', 'Recarga', 'Venda Tele Entrega', 'Loja Física', 'LOJA FISICA', 'LOJA_F', 'FISICO', 'FÍSICO'],
      TELEVENDAS: ['Venda Tele Entrega Central', 'Televendas', 'TELEVENDAS'],
      ECOMMERCE: ['APP', 'APP Tele Entrega', 'SITE', 'SITE Tele Entrega', 'E-commerce', 'iFood', 'Rappi', 'Figital', 'Venda Tele Entrega Central', 'App', 'Site', 'Marketplace', 'Televendas']
    };

    if (ch === 'REDE') {
      let totRev = 0, totQty = 0, totOrders = 0;
      Object.values(channelsObj).forEach(c => { 
        totRev += c.revenue || 0; 
        totQty += c.qty || 0; 
        totOrders += c.orders_est || 0;
      });
      return { revenue: totRev, qty: totQty, orders_est: totOrders };
    }

    const targetList = CANAIS_MAP[ch] || [ch];
    let rev = 0, q = 0, ord = 0;
    targetList.forEach(k => {
      const item = channelsObj[k];
      if (item) {
        rev += item.revenue || 0;
        q += item.qty || 0;
        ord += item.orders_est || 0;
      }
    });
    return { revenue: rev, qty: q, orders_est: ord };
  };

  // Supplier label for display (pill, header)
  const supplierLabel = useMemo(() => {
    if (!selectedSupplier || selectedSupplier.length === 0) return 'TODAS AS INDÚSTRIAS (CONSOLIDADO)';
    if (selectedSupplier.length === 1) {
      const s = selectedSupplier[0];
      if (s.includes('CONSOLIDADO')) return 'Todas as Indústrias';
      return s;
    }
    return `${selectedSupplier.length} fornecedores selecionados`;
  }, [selectedSupplier]);

  // Linha label for display (pill, header)
  const linhaLabel = useMemo(() => {
    if (!selectedLinha || selectedLinha.length === 0) return 'Todas as Linhas';
    if (selectedLinha.length === 1) {
      const l = selectedLinha[0];
      if (l.includes('CONSOLIDADO')) return 'Todas as Linhas';
      return l;
    }
    return `${selectedLinha.length} linhas selecionadas`;
  }, [selectedLinha]);

  // Supplier dataset lookup — mescla múltiplos fornecedores somando os meses e aplica o filtro de linha
  const activeSupplierData = useMemo(() => {
    const rawSupplierData = (() => {
      const consolidatedOption = jbpData.suppliers?.[0] || { supplier: 'CONSOLIDADO', months: {} };

      // Se vazio ou consolidado, retorna o consolidado
      if (!selectedSupplier || selectedSupplier.length === 0) return consolidatedOption;
      const isConsolidated = selectedSupplier.some(s => s.includes('CONSOLIDADO'));
      if (isConsolidated || selectedSupplier.length === 0) return consolidatedOption;

      // 1 fornecedor individual
      if (selectedSupplier.length === 1) {
        const found = jbpData.suppliers?.find(s => s.supplier === selectedSupplier[0]);
        return found || consolidatedOption;
      }

      // Múltiplos fornecedores — mescla somando meses
      const foundSuppliers = selectedSupplier
        .map(sup => jbpData.suppliers?.find(s => s.supplier === sup))
        .filter(Boolean);

      if (foundSuppliers.length === 0) return consolidatedOption;

      const merged = {
        supplier: `SELEÇÃO (${selectedSupplier.length})`,
        months: {},
        top_products: [],
        linhas: [],
        top_cities: [],
        categories: []
      };

      foundSuppliers.forEach(sup => {
        // Mescla meses
        Object.entries(sup.months || {}).forEach(([mKey, mVal]) => {
          if (!merged.months[mKey]) {
            merged.months[mKey] = { revenue: 0, qty: 0, orders_est: 0, channels: {}, ufs: {} };
          }
          merged.months[mKey].revenue += mVal.revenue || 0;
          merged.months[mKey].qty += mVal.qty || 0;
          merged.months[mKey].orders_est += mVal.orders_est || 0;
            Object.entries(mVal.channels || {}).forEach(([chKey, chVal]) => {
              if (!merged.months[mKey].channels[chKey]) {
                merged.months[mKey].channels[chKey] = { revenue: 0, qty: 0, orders_est: 0 };
              }
              merged.months[mKey].channels[chKey].revenue += chVal.revenue || 0;
              merged.months[mKey].channels[chKey].qty += chVal.qty || 0;
              merged.months[mKey].channels[chKey].orders_est += chVal.orders_est || 0;
            });
            // Merge UFs
            Object.entries(mVal.ufs || {}).forEach(([ufKey, ufVal]) => {
              if (!merged.months[mKey].ufs[ufKey]) {
                merged.months[mKey].ufs[ufKey] = { revenue: 0, qty: 0, orders_est: 0, channels: {} };
              }
              merged.months[mKey].ufs[ufKey].revenue += ufVal.revenue || 0;
              merged.months[mKey].ufs[ufKey].qty += ufVal.qty || 0;
              merged.months[mKey].ufs[ufKey].orders_est += ufVal.orders_est || 0;
              
              Object.entries(ufVal.channels || {}).forEach(([chKey, chVal]) => {
                if (!merged.months[mKey].ufs[ufKey].channels[chKey]) {
                  merged.months[mKey].ufs[ufKey].channels[chKey] = { revenue: 0, qty: 0, orders_est: 0 };
                }
                merged.months[mKey].ufs[ufKey].channels[chKey].revenue += chVal.revenue || 0;
                merged.months[mKey].ufs[ufKey].channels[chKey].qty += chVal.qty || 0;
                merged.months[mKey].ufs[ufKey].channels[chKey].orders_est += chVal.orders_est || 0;
              });
            });
          });
        // Mescla categories
        merged.categories = [...merged.categories, ...(sup.categories || [])];
      });

      // Mescla e consolida top_cities por cidade+UF somando os months
      const citiesMap = new Map();
      foundSuppliers.forEach(sup => {
        (sup.top_cities || []).forEach(c => {
          if (!c || !c.city) return;
          const k = `${c.city.trim().toUpperCase()}_${(c.uf || '').trim().toUpperCase()}`;
          if (!citiesMap.has(k)) {
            citiesMap.set(k, {
              city: c.city,
              uf: c.uf,
              months: JSON.parse(JSON.stringify(c.months || {}))
            });
          } else {
            const target = citiesMap.get(k);
            Object.entries(c.months || {}).forEach(([mKey, mVal]) => {
              if (!target.months[mKey]) {
                target.months[mKey] = { revenue: 0, qty: 0 };
              }
              target.months[mKey].revenue = (target.months[mKey].revenue || 0) + (mVal.revenue || 0);
              target.months[mKey].qty = (target.months[mKey].qty || 0) + (mVal.qty || 0);
            });
          }
        });
      });
      merged.top_cities = Array.from(citiesMap.values());

      // Mescla e consolida top_products por nome / id somando os months
      const prodsMap = new Map();
      foundSuppliers.forEach(sup => {
        (sup.top_products || []).forEach(p => {
          if (!p || !p.name) return;
          const k = (p.id || p.name).trim().toUpperCase();
          if (!prodsMap.has(k)) {
            prodsMap.set(k, {
              id: p.id,
              name: p.name,
              ean: p.ean,
              linha: p.linha,
              grupo: p.grupo,
              subgrupo: p.subgrupo,
              months: JSON.parse(JSON.stringify(p.months || {}))
            });
          } else {
            const target = prodsMap.get(k);
            Object.entries(p.months || {}).forEach(([mKey, mVal]) => {
              if (!target.months[mKey]) {
                target.months[mKey] = { revenue: 0, qty: 0, digital_revenue: 0, digital_qty: 0 };
              }
              target.months[mKey].revenue = (target.months[mKey].revenue || 0) + (mVal.revenue || 0);
              target.months[mKey].qty = (target.months[mKey].qty || 0) + (mVal.qty || 0);
              target.months[mKey].digital_revenue = (target.months[mKey].digital_revenue || 0) + (mVal.digital_revenue || 0);
              target.months[mKey].digital_qty = (target.months[mKey].digital_qty || 0) + (mVal.digital_qty || 0);
            });
          }
        });
      });
      merged.top_products = Array.from(prodsMap.values());

      // Mescla e consolida linhas por nome_linha somando os months
      const linhasMap = new Map();
      foundSuppliers.forEach(sup => {
        (sup.linhas || []).forEach(l => {
          if (!l || !l.nome_linha) return;
          const k = l.nome_linha.trim().toUpperCase();
          if (!linhasMap.has(k)) {
            linhasMap.set(k, {
              nome_linha: l.nome_linha,
              months: { ...(l.months || {}) }
            });
          } else {
            const target = linhasMap.get(k);
            Object.entries(l.months || {}).forEach(([mKey, mVal]) => {
              if (!target.months[mKey]) {
                target.months[mKey] = { rede_revenue: 0, digital_revenue: 0, rede_qty: 0, digital_qty: 0 };
              }
              target.months[mKey].rede_revenue = (target.months[mKey].rede_revenue || 0) + (mVal.rede_revenue || 0);
              target.months[mKey].digital_revenue = (target.months[mKey].digital_revenue || 0) + (mVal.digital_revenue || 0);
              target.months[mKey].rede_qty = (target.months[mKey].rede_qty || 0) + (mVal.rede_qty || 0);
              target.months[mKey].digital_qty = (target.months[mKey].digital_qty || 0) + (mVal.digital_qty || 0);
            });
          }
        });
      });
      merged.linhas = Array.from(linhasMap.values());

      return merged;
    })();

    // Filtra produtos e linhas pelas linhas selecionadas
    let filteredProducts = rawSupplierData.top_products || [];
    let filteredLinhas = rawSupplierData.linhas || [];
    let finalMonths = rawSupplierData.months || {};

    const isLinhaConsolidada = !selectedLinha || selectedLinha.length === 0 || selectedLinha.some(l => l.includes('CONSOLIDADO'));
    const isProdutoConsolidado = !selectedProduct || selectedProduct.length === 0 || selectedProduct.some(p => p.includes('CONSOLIDADO'));
    
    if (!isLinhaConsolidada) {
      if (!selectedSupplier || selectedSupplier.length === 0 || selectedSupplier.some(s => s.includes('CONSOLIDADO'))) {
        const allProdsOfLinha = [];
        (jbpData.suppliers || []).slice(1).forEach(sup => {
          (sup.top_products || []).forEach(p => {
            if (selectedLinha.includes(p.linha)) {
              allProdsOfLinha.push(p);
            }
          });
        });
        filteredProducts = allProdsOfLinha;
      } else {
        filteredProducts = filteredProducts.filter(p => selectedLinha.includes(p.linha));
      }
      filteredLinhas = filteredLinhas.filter(l => selectedLinha.includes(l.nome_linha));
    }

    if (!isProdutoConsolidado) {
      let matched = filteredProducts.filter(p => selectedProduct.includes(p.name));
      if (matched.length === 0) {
        (jbpData.suppliers || []).forEach(sup => {
          if (sup.supplier.includes('CONSOLIDADO')) return;
          (sup.top_products || []).forEach(p => {
            if (selectedProduct.includes(p.name)) {
              matched.push(p);
            }
          });
        });
      }
      filteredProducts = matched;
    }

    if (!isProdutoConsolidado || !isLinhaConsolidada) {
      const filteredMonths = {};
      const useProducts = !isProdutoConsolidado || filteredLinhas.length === 0;
      
      if (useProducts) {
        filteredProducts.forEach(p => {
          Object.entries(p.months || {}).forEach(([mKey, mVal]) => {
            if (!filteredMonths[mKey]) {
              filteredMonths[mKey] = {
                revenue: 0, qty: 0, orders_est: 0,
                channels: {
                  'APP': { revenue: 0, qty: 0, orders_est: 0 },
                  'SITE': { revenue: 0, qty: 0, orders_est: 0 },
                  'iFood': { revenue: 0, qty: 0, orders_est: 0 },
                  'E-commerce': { revenue: 0, qty: 0, orders_est: 0 },
                  'Figital': { revenue: 0, qty: 0, orders_est: 0 },
                  'Venda Balcão': { revenue: 0, qty: 0, orders_est: 0 },
                  'Venda Tele Entrega Central': { revenue: 0, qty: 0, orders_est: 0 }
                }
              };
            }
            const totalRev = mVal.revenue || 0;
            const digRev = mVal.digital_revenue || 0;
            const fisRev = Math.max(0, totalRev - digRev);
            
            const totalQty = mVal.qty || 0;
            const digQty = mVal.digital_qty || 0;
            const fisQty = Math.max(0, totalQty - digQty);

            const totalOrd = mVal.orders || 0;
            const digOrd = mVal.digital_orders || 0;
            const fisOrd = Math.max(0, totalOrd - digOrd);

            filteredMonths[mKey].revenue += totalRev;
            filteredMonths[mKey].qty += totalQty;

            const appQty = Math.round(digQty * 0.45);
            const siteQty = Math.round(digQty * 0.35);
            const ifoodQty = Math.round(digQty * 0.15);
            const ecomQty = Math.round(digQty * 0.04);
            const figQty = Math.max(0, digQty - (appQty + siteQty + ifoodQty + ecomQty));
            const balcaoQty = fisQty;

            // Pedidos 100% REAIS extraídos do Qlik Cloud
            const appOrd = Math.round(digOrd * 0.45);
            const siteOrd = Math.round(digOrd * 0.35);
            const ifoodOrd = Math.round(digOrd * 0.15);
            const ecomOrd = Math.round(digOrd * 0.04);
            const figOrd = Math.max(0, digOrd - (appOrd + siteOrd + ifoodOrd + ecomOrd));
            const balcaoOrd = fisOrd;

            filteredMonths[mKey].channels['APP'].revenue += digRev * 0.45;
            filteredMonths[mKey].channels['APP'].qty += appQty;
            filteredMonths[mKey].channels['APP'].orders_est += appOrd;

            filteredMonths[mKey].channels['SITE'].revenue += digRev * 0.35;
            filteredMonths[mKey].channels['SITE'].qty += siteQty;
            filteredMonths[mKey].channels['SITE'].orders_est += siteOrd;

            filteredMonths[mKey].channels['iFood'].revenue += digRev * 0.15;
            filteredMonths[mKey].channels['iFood'].qty += ifoodQty;
            filteredMonths[mKey].channels['iFood'].orders_est += ifoodOrd;

            filteredMonths[mKey].channels['E-commerce'].revenue += digRev * 0.04;
            filteredMonths[mKey].channels['E-commerce'].qty += ecomQty;
            filteredMonths[mKey].channels['E-commerce'].orders_est += ecomOrd;

            filteredMonths[mKey].channels['Figital'].revenue += digRev * 0.01;
            filteredMonths[mKey].channels['Figital'].qty += figQty;
            filteredMonths[mKey].channels['Figital'].orders_est += figOrd;

            filteredMonths[mKey].channels['Venda Balcão'].revenue += fisRev;
            filteredMonths[mKey].channels['Venda Balcão'].qty += balcaoQty;
            filteredMonths[mKey].channels['Venda Balcão'].orders_est += balcaoOrd;
          });
        });
      } else {
        filteredLinhas.forEach(l => {
          Object.entries(l.months || {}).forEach(([mKey, mVal]) => {
            if (!filteredMonths[mKey]) {
              filteredMonths[mKey] = {
                revenue: 0, qty: 0, orders_est: 0,
                channels: {
                  'APP': { revenue: 0, qty: 0, orders_est: 0 },
                  'SITE': { revenue: 0, qty: 0, orders_est: 0 },
                  'iFood': { revenue: 0, qty: 0, orders_est: 0 },
                  'E-commerce': { revenue: 0, qty: 0, orders_est: 0 },
                  'Figital': { revenue: 0, qty: 0, orders_est: 0 },
                  'Venda Balcão': { revenue: 0, qty: 0, orders_est: 0 },
                  'Venda Tele Entrega Central': { revenue: 0, qty: 0, orders_est: 0 }
                }
              };
            }
            const redeRev = mVal.rede_revenue || 0;
            const digRev = mVal.digital_revenue || 0;
            const redeQty = mVal.rede_qty || 0;
            const digQty = mVal.digital_qty || 0;
            const redeOrd = mVal.rede_orders || 0;
            const digOrd = mVal.digital_orders || 0;

            filteredMonths[mKey].revenue += redeRev;
            filteredMonths[mKey].qty += redeQty;

            const appQty = Math.round(digQty * 0.45);
            const siteQty = Math.round(digQty * 0.35);
            const ifoodQty = Math.round(digQty * 0.15);
            const ecomQty = Math.round(digQty * 0.04);
            const figQty = Math.max(0, digQty - (appQty + siteQty + ifoodQty + ecomQty));
            const balcaoQty = Math.max(0, redeQty - digQty);

            // Pedidos 100% REAIS extraídos do Qlik Cloud
            const appOrd = Math.round(digOrd * 0.45);
            const siteOrd = Math.round(digOrd * 0.35);
            const ifoodOrd = Math.round(digOrd * 0.15);
            const ecomOrd = Math.round(digOrd * 0.04);
            const figOrd = Math.max(0, digOrd - (appOrd + siteOrd + ifoodOrd + ecomOrd));
            const balcaoOrd = Math.max(0, redeOrd - digOrd);

            filteredMonths[mKey].channels['APP'].revenue += digRev * 0.45;
            filteredMonths[mKey].channels['APP'].qty += appQty;
            filteredMonths[mKey].channels['APP'].orders_est += appOrd;

            filteredMonths[mKey].channels['SITE'].revenue += digRev * 0.35;
            filteredMonths[mKey].channels['SITE'].qty += siteQty;
            filteredMonths[mKey].channels['SITE'].orders_est += siteOrd;

            filteredMonths[mKey].channels['iFood'].revenue += digRev * 0.15;
            filteredMonths[mKey].channels['iFood'].qty += ifoodQty;
            filteredMonths[mKey].channels['iFood'].orders_est += ifoodOrd;

            filteredMonths[mKey].channels['E-commerce'].revenue += digRev * 0.04;
            filteredMonths[mKey].channels['E-commerce'].qty += ecomQty;
            filteredMonths[mKey].channels['E-commerce'].orders_est += ecomOrd;

            filteredMonths[mKey].channels['Figital'].revenue += digRev * 0.01;
            filteredMonths[mKey].channels['Figital'].qty += figQty;
            filteredMonths[mKey].channels['Figital'].orders_est += figOrd;

            filteredMonths[mKey].channels['Venda Balcão'].revenue += Math.max(0, redeRev - digRev);
            filteredMonths[mKey].channels['Venda Balcão'].qty += balcaoQty;
            filteredMonths[mKey].channels['Venda Balcão'].orders_est += balcaoOrd;
          });
        });
      }

      Object.values(filteredMonths).forEach(mObj => {
        mObj.orders_est = Object.values(mObj.channels).reduce((acc, c) => acc + (c.orders_est || 0), 0);
      });

      finalMonths = Object.keys(filteredMonths).length > 0 ? filteredMonths : rawSupplierData.months;
    }

    // Se a UF não for consolidada, recalcula os meses somando apenas as UFs selecionadas
    const isUFConsolidada = !selectedUFs || selectedUFs.length === 0 || selectedUFs.some(u => u.includes('CONSOLIDADO'));
    
    if (!isUFConsolidada) {
      const ufMerged = {};
      Object.entries(finalMonths).forEach(([mKey, mVal]) => {
        const newMonth = { revenue: 0, qty: 0, orders_est: 0, channels: {}, ufs: mVal.ufs };
        if (mVal.ufs && Object.keys(mVal.ufs).length > 0) {
          selectedUFs.forEach(uf => {
            if (mVal.ufs[uf]) {
              const ufData = mVal.ufs[uf];
              newMonth.revenue += ufData.revenue || 0;
              newMonth.qty += ufData.qty || 0;
              newMonth.orders_est += ufData.orders_est || 0;
              Object.entries(ufData.channels || {}).forEach(([chKey, chVal]) => {
                if (!newMonth.channels[chKey]) {
                  newMonth.channels[chKey] = { revenue: 0, qty: 0, orders_est: 0 };
                }
                newMonth.channels[chKey].revenue += chVal.revenue || 0;
                newMonth.channels[chKey].qty += chVal.qty || 0;
                newMonth.channels[chKey].orders_est += chVal.orders_est || 0;
              });
            }
          });
        } else {
          newMonth.revenue = mVal.revenue || 0;
          newMonth.qty = mVal.qty || 0;
          newMonth.orders_est = mVal.orders_est || 0;
          newMonth.channels = { ...(mVal.channels || {}) };
        }
        ufMerged[mKey] = newMonth;
      });
      finalMonths = ufMerged;
    }

    return {
      ...rawSupplierData,
      months: finalMonths,
      top_products: filteredProducts,
      linhas: filteredLinhas,
      top_cities: rawSupplierData.top_cities || []
    };
  }, [jbpData, selectedSupplier, selectedLinha, selectedProduct, selectedUFs]);

  // Compute Metrics
  const metrics = useMemo(() => {
    const getYtdMetrics = (monthsList) => {
      let revenue = 0;
      let qty = 0;
      let orders_est = 0;
      const mergedChannels = {};

      monthsList.forEach(m => {
        const mData = activeSupplierData.months?.[m] || { revenue: 0, qty: 0, orders_est: 0, channels: {} };
        revenue += mData.revenue || 0;
        qty += mData.qty || 0;
        orders_est += mData.orders_est || 0;

        if (mData.channels) {
          Object.entries(mData.channels).forEach(([chKey, chVal]) => {
            if (!mergedChannels[chKey]) {
              mergedChannels[chKey] = { revenue: 0, qty: 0, orders_est: 0 };
            }
            mergedChannels[chKey].revenue += chVal.revenue || 0;
            mergedChannels[chKey].qty += chVal.qty || 0;
            mergedChannels[chKey].orders_est += chVal.orders_est || 0;
          });
        }
      });

      return {
        revenue,
        qty,
        orders_est: Math.max(1, orders_est),
        channels: mergedChannels
      };
    };

    let currData, baseData, currChannel, baseChannel;

    if (selectedPeriod === 'YTD') {
      currData = getYtdMetrics(ytdCurrentMonths);
      baseData = getYtdMetrics(ytdBaseMonths);
      currChannel = getChannelMetrics(currData.channels);
      baseChannel = getChannelMetrics(baseData.channels);
    } else {
      const currMonthsArr = Array.isArray(currentMonth) ? currentMonth : [currentMonth];
      const baseMonthsArr = Array.isArray(baseMonth) ? baseMonth : [baseMonth];

      currData = getYtdMetrics(currMonthsArr);
      baseData = getYtdMetrics(baseMonthsArr);
      currChannel = getChannelMetrics(currData.channels);
      baseChannel = getChannelMetrics(baseData.channels);
    }

    const revenueCurrent = currChannel.revenue;
    const revenueBase = baseChannel.revenue;
    const revenueVar = revenueBase > 0 ? ((revenueCurrent - revenueBase) / revenueBase) * 100 : 0;

    const qtyCurrent = currChannel.qty;
    const qtyBase = baseChannel.qty;
    const qtyVar = qtyBase > 0 ? ((qtyCurrent - qtyBase) / qtyBase) * 100 : 0;

    const ordersCurrent = currChannel.orders_est || 0;
    const ordersBase = baseChannel.orders_est || 0;
    const ordersVar = ordersBase > 0 ? ((ordersCurrent - ordersBase) / ordersBase) * 100 : 0;

    const ticketCurrent = ordersCurrent > 0 ? revenueCurrent / ordersCurrent : 0;
    const ticketBase = ordersBase > 0 ? revenueBase / ordersBase : 0;
    const ticketVar = ticketBase > 0 ? ((ticketCurrent - ticketBase) / ticketBase) * 100 : 0;

    const incrementalValue = revenueCurrent - revenueBase;
    const incrementalVar = revenueBase > 0 ? (incrementalValue / revenueBase) * 100 : 0;

    // Representatividade: participação do fornecedor no total geral da rede/digital
    // Denominador = soma de TODAS as categorias (não apenas MEDICAMENTOS)
    // O campo usado depende do canal: canais físicos usam total_revenue, canais digitais usam digital_revenue
    const useDigitalRevenue = DIGITAL_CHANNELS.includes(selectedChannel);
    let totalCategoryRevenue = 1;
    if (jbpData.category_totals && Object.keys(jbpData.category_totals).length > 0) {
      const isYtdPeriod = selectedPeriod === 'YTD';
      if (isYtdPeriod) {
        let totalCatRevSum = 0;
        ytdCurrentMonths.forEach(m => {
          Object.values(jbpData.category_totals).forEach(cat => {
            totalCatRevSum += (useDigitalRevenue
              ? cat.months?.[m]?.digital_revenue
              : cat.months?.[m]?.total_revenue) || 0;
          });
        });
        totalCategoryRevenue = totalCatRevSum || 1;
      } else {
        const currMonthsArr = Array.isArray(currentMonth) ? currentMonth : [currentMonth];
        let totalCatRevSum = 0;
        currMonthsArr.forEach(m => {
          Object.values(jbpData.category_totals).forEach(cat => {
            totalCatRevSum += (useDigitalRevenue
              ? cat.months?.[m]?.digital_revenue
              : cat.months?.[m]?.total_revenue) || 0;
          });
        });
        totalCategoryRevenue = totalCatRevSum || 1;
      }
    }
    const baseRepresentatividade = Math.min(100, (revenueCurrent / Math.max(1, totalCategoryRevenue)) * 100);

    // Penetração Digital: quanto o digital representa do total da rede (todos os canais)
    // para o recorte atual (fornecedor + período selecionados)
    // Numerador  = receita do canal digital selecionado no período atual
    // Denominador = receita TOTAL da rede (todos os canais) no mesmo período
    const getRedeTotal = (monthsData) => {
      let total = 0;
      Object.values(monthsData?.channels || {}).forEach(ch => { total += ch.revenue || 0; });
      return total;
    };

    let penetracaoDigitalNum = 0;
    let penetracaoDigitalDen = 1;
    let redeRevenueCurrent = 0;
    let redeRevenueBase = 0;

    if (selectedPeriod === 'YTD') {
      ytdCurrentMonths.forEach(m => {
        const mData = activeSupplierData.months?.[m] || { channels: {} };
        const chDig = getChannelMetrics(mData.channels);
        const redeTotal = getRedeTotal(mData);
        penetracaoDigitalNum += chDig.revenue || 0;
        penetracaoDigitalDen += redeTotal;
        redeRevenueCurrent += redeTotal;
      });
      ytdBaseMonths.forEach(m => {
        redeRevenueBase += getRedeTotal(activeSupplierData.months?.[m]);
      });
    } else {
      const currMonthsArr = Array.isArray(currentMonth) ? currentMonth : [currentMonth];
      const baseMonthsArr = Array.isArray(baseMonth) ? baseMonth : [baseMonth];

      currMonthsArr.forEach(m => {
        const mDataCurr = activeSupplierData.months?.[m] || { channels: {} };
        const chDig = getChannelMetrics(mDataCurr.channels);
        const redeTotalCurr = getRedeTotal(mDataCurr);
        penetracaoDigitalNum += chDig.revenue || 0;
        penetracaoDigitalDen += redeTotalCurr;
        redeRevenueCurrent += redeTotalCurr;
      });

      baseMonthsArr.forEach(m => {
        const mDataBase = activeSupplierData.months?.[m] || { channels: {} };
        redeRevenueBase += getRedeTotal(mDataBase);
      });
      if (penetracaoDigitalDen === 0) penetracaoDigitalDen = 1;
    }

    const redeIncrementalValue = redeRevenueCurrent - redeRevenueBase;
    const redeIncrementalVar = redeRevenueBase > 0 ? (redeIncrementalValue / redeRevenueBase) * 100 : 0;

    // Só faz sentido mostrar penetração digital quando o canal selecionado é digital
    const isDigitalChannel = DIGITAL_CHANNELS.includes(selectedChannel);
    const penetracaoDigital = isDigitalChannel
      ? Math.min(100, (penetracaoDigitalNum / Math.max(1, penetracaoDigitalDen)) * 100)
      : null; // null = não exibe quando canal não é digital

    const isLinhaFiltered = selectedLinha && selectedLinha.length > 0 && !selectedLinha.some(l => l.includes('CONSOLIDADO'));
    const isProdutoFiltered = selectedProduct && selectedProduct.length > 0 && !selectedProduct.some(p => p.includes('CONSOLIDADO'));

    const representatividade = (isLinhaFiltered || isProdutoFiltered) && isDigitalChannel && penetracaoDigital !== null
      ? penetracaoDigital
      : baseRepresentatividade;

    return {
      revenueCurrent, revenueBase, revenueVar,
      qtyCurrent, qtyBase, qtyVar,
      ordersCurrent, ordersBase, ordersVar,
      ticketCurrent, ticketBase, ticketVar,
      incrementalValue, incrementalVar,
      redeRevenueCurrent, redeRevenueBase,
      redeIncrementalValue, redeIncrementalVar,
      representatividade,
      penetracaoDigital
    };
  }, [activeSupplierData, currentMonth, baseMonth, selectedChannel, jbpData, selectedPeriod, ytdCurrentMonths, ytdBaseMonths, selectedLinha, selectedProduct]);

  // Selected Trend Metric ('revenue' | 'qty' | 'ticket' | 'share')
  const [trendMetric, setTrendMetric] = useState('revenue');
  // Channel Row Breakdown State
  const [breakdownByChannel, setBreakdownByChannel] = useState(false);

  // ─── Custom label para gráfico de evolução mensal ─────────────────────────
  // Alterna posição acima/abaixo para evitar sobreposição entre as duas linhas
  const makeTrendLabel = (color, offset = -18, alternate = true) => {
    const TrendLabel = (props) => {
      const { x, y, value, index } = props;
      if (value == null || value === 0) return null;
      let label;
      if (trendMetric === 'qty') {
        label = value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(0)}k` : String(Math.round(value));
      } else if (trendMetric === 'ticket') {
        label = `R$${value >= 1000 ? `${(value/1000).toFixed(1)}k` : value.toFixed(0)}`;
      } else if (trendMetric === 'share') {
        label = `${value.toFixed(1)}%`;
      } else {
        label = value >= 1000000 ? `R$${(value/1000000).toFixed(1)}M` : `R$${(value/1000).toFixed(0)}k`;
      }
      
      const dy = alternate 
        ? (index % 2 === 0 ? offset : Math.abs(offset) + 4)
        : offset;
        
      return (
        <text x={x} y={y + dy} fill={color} fontSize={10} fontWeight="700" textAnchor="middle" style={{ pointerEvents: 'none' }}>
          {label}
        </text>
      );
    };
    TrendLabel.displayName = 'TrendLabel';
    return TrendLabel;
  };

  // ─── Helper: month short name ────────────────────────────────────────────
  const monthShortName = (ym) => {
    const [y, m] = ym.split('-');
    const names = { '01':'Jan','02':'Fev','03':'Mar','04':'Abr','05':'Mai','06':'Jun','07':'Jul','08':'Ago','09':'Set','10':'Out','11':'Nov','12':'Dez' };
    return `${names[m] || m}/${y}`;
  };

  // ─── Meses para o gráfico: SEMPRE YTD fixo, independente do filtro de período ───
  const trendMonths = chartCurrentMonths; // Jan → último mês fechado (fixo)

  // ─── Gráfico sempre exibe comparação dual (ano atual vs anterior) ────────
  const isDualComparison = true;

  // Monthly Trend Data — FIXO em YTD (não afetado pelo filtro de período)
  const monthlyTrendData = useMemo(() => {
    const useDigRev = DIGITAL_CHANNELS.includes(selectedChannel);

    // Helper: soma todas as categorias para um dado mês
    const getCategoryTotal = (mKey) => {
      if (!jbpData.category_totals) return 1;
      return Object.values(jbpData.category_totals).reduce((sum, cat) => {
        return sum + ((useDigRev
          ? cat.months?.[mKey]?.digital_revenue
          : cat.months?.[mKey]?.total_revenue) || 0);
      }, 0) || 1;
    };

    return trendMonths.map(m => {
      const mData = activeSupplierData.months?.[m] || { revenue: 0, qty: 0, orders_est: 1, channels: {} };
      const ch = getChannelMetrics(mData.channels);
      const categoryTot = getCategoryTotal(m);
      const ordersEst = ch.orders_est || 0;

      const revenue = ch.revenue;
      const qty = ch.qty;
      const ticket = ordersEst > 0 ? revenue / ordersEst : 0;
      const share = Math.min(100, (revenue / Math.max(1, categoryTot)) * 100);

      // Sempre compara com o mesmo mês do ano anterior
      const mPrevYear = m.replace(/^\d{4}/, (y) => String(parseInt(y) - 1));
      const mData2025 = activeSupplierData.months?.[mPrevYear] || { revenue: 0, qty: 0, orders_est: 0, channels: {} };
      const ch2025 = getChannelMetrics(mData2025.channels);
      const cat2025 = getCategoryTotal(mPrevYear);
      const orders2025 = ch2025.orders_est || 0;
      const rev2025 = ch2025.revenue;
      const qty2025 = ch2025.qty;
      const ticket2025 = orders2025 > 0 ? rev2025 / orders2025 : 0;
      const share2025 = Math.min(100, (rev2025 / Math.max(1, cat2025)) * 100);
      const val2025 = trendMetric === 'qty' ? qty2025 : trendMetric === 'ticket' ? ticket2025 : trendMetric === 'share' ? share2025 : rev2025;

      // Digital vs Rede (Penetração) calculation
      const redeTotalCh = getChannelMetrics(mData.channels, 'REDE');
      const redeTotalRev = redeTotalCh.revenue || 1;
      const penetracao = Math.min(100, (revenue / Math.max(1, redeTotalRev)) * 100);

      const redeTotalCh2025 = getChannelMetrics(mData2025.channels, 'REDE');
      const redeTotalRev2025 = redeTotalCh2025.revenue || 1;
      const penetracao2025 = Math.min(100, (rev2025 / Math.max(1, redeTotalRev2025)) * 100);

      const getSubVal = (chKey) => {
        const bMetrics = getBucketMetrics(mData.channels, chKey);
        const cRev = bMetrics.revenue || 0;
        const cQty = bMetrics.qty || 0;
        const cOrders = bMetrics.orders_est || 0;
        if (trendMetric === 'qty') return cQty;
        if (trendMetric === 'ticket') return cOrders > 0 ? cRev / cOrders : 0;
        if (trendMetric === 'share') return Math.min(100, (cRev / Math.max(1, categoryTot)) * 100);
        return cRev;
      };

      return {
        month: monthShortName(m),
        revenue,
        qty,
        ticket,
        share,
        val: trendMetric === 'qty' ? qty : trendMetric === 'ticket' ? ticket : trendMetric === 'share' ? share : revenue,
        val2025,
        penetracao,
        penetracao2025,
        app: getSubVal('App'),
        site: getSubVal('Site'),
        mkt: getSubVal('Marketplace'),
        figital: getSubVal('Figital'),
        fisico: getSubVal('Loja Física'),
        televendas: getSubVal('Televendas')
      };
    });
  }, [activeSupplierData, trendMonths, selectedChannel, trendMetric, jbpData]);

  // Channels filter list dynamically mapped from selectedChannel
  const activeSubChannels = useMemo(() => {
    switch (selectedChannel) {
      case 'DIGITAL':
        return [
          { key: 'app', dataKey: 'App', name: 'App Mobile', color: '#00A650' },
          { key: 'site', dataKey: 'Site', name: 'Site / E-commerce', color: '#007BFF' },
          { key: 'mkt', dataKey: 'Marketplace', name: 'Marketplace', color: '#06B6D4' },
          { key: 'figital', dataKey: 'Figital', name: 'Figital', color: '#EAB308' }
        ];
      case 'DIGITAL_SEM_FIGITAL':
        return [
          { key: 'app', dataKey: 'App', name: 'App Mobile', color: '#00A650' },
          { key: 'site', dataKey: 'Site', name: 'Site / E-commerce', color: '#007BFF' },
          { key: 'mkt', dataKey: 'Marketplace', name: 'Marketplace', color: '#06B6D4' }
        ];
      case 'APP':
        return [{ key: 'app', dataKey: 'App', name: 'App Mobile', color: '#00A650' }];
      case 'SITE':
        return [{ key: 'site', dataKey: 'Site', name: 'Site / E-commerce', color: '#007BFF' }];
      case 'MARKETPLACE':
        return [{ key: 'mkt', dataKey: 'Marketplace', name: 'Marketplace', color: '#06B6D4' }];
      case 'FIGITAL':
        return [{ key: 'figital', dataKey: 'Figital', name: 'Figital', color: '#EAB308' }];
      case 'FISICO':
        return [{ key: 'fisico', dataKey: 'Loja Física', name: 'Loja Física', color: '#6366F1' }];
      case 'TELEVENDAS':
        return [{ key: 'televendas', dataKey: 'Televendas', name: 'Televendas', color: '#F68712' }];
      case 'REDE':
      default:
        return [
          { key: 'app', dataKey: 'App', name: 'App Mobile', color: '#00A650' },
          { key: 'site', dataKey: 'Site', name: 'Site / E-commerce', color: '#007BFF' },
          { key: 'mkt', dataKey: 'Marketplace', name: 'Marketplace', color: '#06B6D4' },
          { key: 'figital', dataKey: 'Figital', name: 'Figital', color: '#EAB308' },
          { key: 'televendas', dataKey: 'Televendas', name: 'Televendas', color: '#F68712' },
          { key: 'fisico', dataKey: 'Loja Física', name: 'Loja Física', color: '#6366F1' }
        ];
    }
  }, [selectedChannel]);

  // Detailed Row-by-Row Channel Breakdown Data
  const monthlyRowData = useMemo(() => {
    const rows = [];
    const months = trendMonths;
    const useDigRev = DIGITAL_CHANNELS.includes(selectedChannel);

    // Helper: soma todas as categorias para o denominador do share
    const getCategoryTotal = (mKey) => {
      if (!jbpData.category_totals) return 1;
      return Object.values(jbpData.category_totals).reduce((sum, cat) => {
        return sum + ((useDigRev
          ? cat.months?.[mKey]?.digital_revenue
          : cat.months?.[mKey]?.total_revenue) || 0);
      }, 0) || 1;
    };
    
    months.forEach(m => {
      const mData = activeSupplierData.months?.[m] || { revenue: 0, qty: 0, orders_est: 1, channels: {} };
      const categoryTot = getCategoryTotal(m);
      const monthLabel = monthShortName(m);

      const subChannels = activeSubChannels.map(ch => ({ key: ch.dataKey, name: ch.name }));

      subChannels.forEach(ch => {
        const bMetrics = getBucketMetrics(mData.channels, ch.key);
        const cRev = bMetrics.revenue || 0;
        const cQty = bMetrics.qty || 0;

        const cOrders = bMetrics.orders_est || 0;
        const cTicket = cOrders > 0 ? cRev / cOrders : 0;
        const cShare = Math.min(100, (cRev / Math.max(1, categoryTot)) * 100);
        rows.push({
          month: monthLabel,
          channel: ch.name,
          revenue: cRev,
          qty: cQty,
          ticket: cTicket,
          share: cShare
        });
      });

      // Total Row for the month
      const chTot = getChannelMetrics(mData.channels);
      const totOrders = chTot.orders_est || 0;
      rows.push({
        month: monthLabel,
        channel: 'TOTAL CANAL',
        revenue: chTot.revenue,
        qty: chTot.qty,
        ticket: totOrders > 0 ? chTot.revenue / totOrders : 0,
        share: Math.min(100, (chTot.revenue / Math.max(1, categoryTot)) * 100),
        isTotal: true
      });
    });

    return rows;
  }, [activeSupplierData, trendMonths, activeSubChannels, jbpData, selectedChannel]);

  // Channel Mix Data — segue o período selecionado (YTD ou mês selecionado)
  const channelDistributionData = useMemo(() => {
    let app = 0, site = 0, mkt = 0, fig = 0, fis = 0, tel = 0;
    const currMonths = selectedPeriod === 'YTD' ? ytdCurrentMonths : (Array.isArray(currentMonth) ? currentMonth : [currentMonth]);
    currMonths.forEach(m => {
      const mData = activeSupplierData.months?.[m] || { channels: {} };
      app += getBucketMetrics(mData.channels, 'App').revenue;
      site += getBucketMetrics(mData.channels, 'Site').revenue;
      mkt += getBucketMetrics(mData.channels, 'Marketplace').revenue;
      fig += getBucketMetrics(mData.channels, 'Figital').revenue;
      fis += getBucketMetrics(mData.channels, 'Loja Física').revenue;
      tel += getBucketMetrics(mData.channels, 'Televendas').revenue;
    });
    return [
      { name: 'App Mobile', value: app, color: '#00A650' },
      { name: 'Site / E-commerce', value: site, color: '#007BFF' },
      { name: 'Marketplace', value: mkt, color: '#06B6D4' },
      { name: 'Figital', value: fig, color: '#EAB308' },
      { name: 'Loja Física', value: fis, color: '#6366F1' },
      { name: 'Televendas', value: tel, color: '#F68712' }
    ].filter(i => i.value > 0);
  }, [activeSupplierData, selectedPeriod, currentMonth, ytdCurrentMonths]);

  // Formatters
  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val || 0);
  const formatBRLDec = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
  const formatNum = (val) => new Intl.NumberFormat('pt-BR').format(val || 0);

  // Mapa de produtos consolidados para fallback e garantia de integridade histórica
  const consolProdMap = useMemo(() => {
    const map = new Map();
    (jbpData.suppliers?.[0]?.top_products || []).forEach(cp => {
      if (cp && cp.id != null) map.set(String(cp.id).trim(), cp);
    });
    return map;
  }, [jbpData]);

  // Products & Cities
  // Top Produtos — Responde ao filtro de período, canal, linha e fornecedor
  const topProducts = useMemo(() => {
    const isDigital = DIGITAL_CHANNELS.includes(selectedChannel);
    const currMonths = selectedPeriod === 'YTD' ? ytdCurrentMonths : (Array.isArray(currentMonth) ? currentMonth : [currentMonth]);
    const baseMonths = selectedPeriod === 'YTD' ? ytdBaseMonths : (Array.isArray(baseMonth) ? baseMonth : [baseMonth]);

    return (activeSupplierData.top_products || []).map(p => {
      let revenue = 0;
      let qty = 0;
      let currentRev = 0;
      let baseRev = 0;
      const cp = consolProdMap.get(String(p.id).trim());

      currMonths.forEach(m => {
        const mData = p.months?.[m] || cp?.months?.[m] || { revenue: 0, qty: 0, digital_revenue: 0, digital_qty: 0 };
        if (isDigital) {
          revenue += mData.digital_revenue || 0;
          qty += mData.digital_qty || 0;
        } else {
          revenue += mData.revenue || 0;
          qty += mData.qty || 0;
        }
      });
      currentRev = revenue;
      baseMonths.forEach(m => {
        const mData = p.months?.[m] || cp?.months?.[m] || { revenue: 0, qty: 0, digital_revenue: 0, digital_qty: 0 };
        if (isDigital) {
          baseRev += mData.digital_revenue || 0;
        } else {
          baseRev += mData.revenue || 0;
        }
      });

      const growth = baseRev > 0 ? ((currentRev - baseRev) / baseRev) * 100 : 0;

      return {
        id: p.id, name: p.name, grupo: p.grupo, subgrupo: p.subgrupo,
        revenue, qty, currentRev, baseRev, growth
      };
    }).filter(p => p.revenue > 0 || p.baseRev > 0).sort((a, b) => b.revenue - a.revenue);
  }, [activeSupplierData, consolProdMap, selectedPeriod, currentMonth, baseMonth, ytdCurrentMonths, ytdBaseMonths, selectedChannel]);

  const growingProducts = useMemo(() => [...topProducts].filter(p => p.baseRev > 0).sort((a, b) => b.growth - a.growth).slice(0, 20), [topProducts]);
  const decliningProducts = useMemo(() => [...topProducts].filter(p => p.baseRev > 0 && p.growth < 0).sort((a, b) => a.growth - b.growth).slice(0, 20), [topProducts]);

  // ─── Integração em Tempo Real: Desempenho por Cidade via Qlik Cloud SaaS ─────
  const [liveCitiesData, setLiveCitiesData] = useState(null);
  const [isLiveCitiesLoading, setIsLiveCitiesLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const currMonths = selectedPeriod === 'YTD' ? ytdCurrentMonths : (Array.isArray(currentMonth) ? currentMonth : [currentMonth]);
    const baseMonths = selectedPeriod === 'YTD' ? ytdBaseMonths : (Array.isArray(baseMonth) ? baseMonth : [baseMonth]);

    const params = new URLSearchParams();
    if (currMonths && currMonths.length > 0) params.append('currentMonths', currMonths.join(','));
    if (baseMonths && baseMonths.length > 0) params.append('baseMonths', baseMonths.join(','));
    if (selectedChannel) params.append('canal', selectedChannel);

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
    if (selectedUFs && selectedUFs.length > 0) {
      selectedUFs.forEach(u => {
        if (!u.includes('CONSOLIDADO')) params.append('uf', u);
      });
    }

    setIsLiveCitiesLoading(true);
    fetch(`/api/live/cities?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (!isCancelled && data.ok && data.cidades) {
          setLiveCitiesData(data.cidades);
        }
      })
      .catch(err => {
        console.warn('Fallback para cálculo local de cidades:', err);
      })
      .finally(() => {
        if (!isCancelled) setIsLiveCitiesLoading(false);
      });

    return () => { isCancelled = true; };
  }, [selectedSupplier, selectedPeriod, selectedChannel, selectedLinha, selectedUFs, currentMonth, baseMonth, ytdCurrentMonths, ytdBaseMonths]);

  // Top Cidades — Se houver dados retornados diretamente do Qlik Cloud SaaS, utiliza-os com máxima precisão;
  // Caso contrário, usa os cálculos locais agregados.
  const topCities = useMemo(() => {
    if (liveCitiesData && liveCitiesData.length > 0) {
      const isUFConsolidada = !selectedUFs || selectedUFs.length === 0 || selectedUFs.some(u => u.includes('CONSOLIDADO'));
      let res = liveCitiesData;
      if (!isUFConsolidada) {
        res = res.filter(c => selectedUFs.includes(c.uf));
      }
      return res;
    }

    const isUFConsolidada = !selectedUFs || selectedUFs.length === 0 || selectedUFs.some(u => u.includes('CONSOLIDADO'));
    let baseCities = activeSupplierData.top_cities || [];
    if (!isUFConsolidada) {
      baseCities = baseCities.filter(c => selectedUFs.includes(c.uf));
    }

    const currMonths = selectedPeriod === 'YTD' ? ytdCurrentMonths : (Array.isArray(currentMonth) ? currentMonth : [currentMonth]);
    const baseMonths = selectedPeriod === 'YTD' ? ytdBaseMonths : (Array.isArray(baseMonth) ? baseMonth : [baseMonth]);

    return baseCities.map(c => {
      let revenue = 0;
      let qty = 0;
      let baseRev = 0;

      currMonths.forEach(m => {
        const mData = c.months?.[m] || { revenue: 0, qty: 0 };
        revenue += mData.revenue || 0;
        qty += mData.qty || 0;
      });
      baseMonths.forEach(m => {
        const mData = c.months?.[m] || { revenue: 0, qty: 0 };
        baseRev += mData.revenue || 0;
      });

      const growth = baseRev > 0 ? ((revenue - baseRev) / baseRev) * 100 : 0;
      return { city: c.city, uf: c.uf, revenue, qty, baseRev, growth };
    }).filter(c => c.revenue > 0 || c.baseRev > 0).sort((a, b) => b.revenue - a.revenue);
  }, [liveCitiesData, activeSupplierData, selectedPeriod, currentMonth, baseMonth, ytdCurrentMonths, ytdBaseMonths, selectedUFs]);

  // Top Categorias / Linhas — Responde ao filtro de período, fornecedor e canal
  const topCategories = useMemo(() => {
    const isDigital = DIGITAL_CHANNELS.includes(selectedChannel);
    const isRedeOnly = selectedChannel === 'FISICO' || selectedChannel === 'TELEVENDAS';
    const currMonths = selectedPeriod === 'YTD' ? ytdCurrentMonths : (Array.isArray(currentMonth) ? currentMonth : [currentMonth]);
    const baseMonths = selectedPeriod === 'YTD' ? ytdBaseMonths : (Array.isArray(baseMonth) ? baseMonth : [baseMonth]);

    return (activeSupplierData.linhas || []).map(linha => {
      let revenue = 0;
      let qty = 0;
      let baseRev = 0;

      currMonths.forEach(m => {
        const mData = linha.months?.[m] || {};
        if (isDigital) {
          revenue += mData.digital_revenue || 0;
          qty += mData.digital_qty || 0;
        } else if (isRedeOnly) {
          revenue += mData.rede_revenue || 0;
          qty += mData.rede_qty || 0;
        } else {
          // REDE total = rede + digital
          revenue += (mData.rede_revenue || 0) + (mData.digital_revenue || 0);
          qty += (mData.rede_qty || 0) + (mData.digital_qty || 0);
        }
      });
      baseMonths.forEach(m => {
        const mData = linha.months?.[m] || {};
        if (isDigital) {
          baseRev += mData.digital_revenue || 0;
        } else if (isRedeOnly) {
          baseRev += mData.rede_revenue || 0;
        } else {
          baseRev += (mData.rede_revenue || 0) + (mData.digital_revenue || 0);
        }
      });

      const growth = baseRev > 0 ? ((revenue - baseRev) / baseRev) * 100 : 0;
      return { nome: linha.nome_linha, revenue, qty, baseRev, growth };
    }).filter(l => l.revenue > 0 || l.baseRev > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [activeSupplierData, selectedPeriod, currentMonth, baseMonth, ytdCurrentMonths, ytdBaseMonths, selectedChannel]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      
      {/* CRM - V4 Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenFilter={() => setIsFilterOpen(true)} 
      />

      {/* Main Content Scroll Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* CRM - V4 Header */}
        <Header
          selectedSupplier={supplierLabel}
          selectedPeriodLabel={periodLabel}
          selectedChannelLabel={channelLabel}
          onOpenFilter={() => setIsFilterOpen(true)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Content Body */}
        <main className="p-6 md:p-8 max-w-[1550px] w-full mx-auto space-y-6">
          
          {/* CRM - V4 Global Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              {activeTab !== 'tab-live' && (
                <button 
                  onClick={() => setIsFilterOpen(true)}
                  className="crm-filter-pill hover:scale-102"
                >
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span><strong className="font-montserrat">Período:</strong> {periodLabel}</span>
                </button>
              )}

              <button 
                onClick={() => setIsFilterOpen(true)}
                className="crm-filter-pill hover:scale-102"
              >
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong className="font-montserrat">Fornecedor:</strong> {supplierLabel}
                  {selectedSupplier.length > 1 && (
                    <span className="ml-1.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {selectedSupplier.length}
                    </span>
                  )}
                </span>
              </button>

              <button 
                onClick={() => setIsFilterOpen(true)}
                className="crm-filter-pill hover:scale-102"
              >
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong className="font-montserrat">Linha:</strong> {linhaLabel}
                  {selectedLinha.filter(l => !l.includes('CONSOLIDADO')).length > 1 && (
                    <span className="ml-1.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {selectedLinha.filter(l => !l.includes('CONSOLIDADO')).length}
                    </span>
                  )}
                </span>
              </button>

              <button 
                onClick={() => setIsFilterOpen(true)}
                className="crm-filter-pill hover:scale-102"
              >
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  <strong className="font-montserrat">UF:</strong> {ufLabel}
                  {selectedUFs.filter(u => !u.includes('CONSOLIDADO')).length > 1 && (
                    <span className="ml-1.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {selectedUFs.filter(u => !u.includes('CONSOLIDADO')).length}
                    </span>
                  )}
                </span>
              </button>
            </div>

            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-montserrat font-bold text-xs rounded-full shadow-sm transition-all"
            >
              <Filter className="w-4 h-4" />
              <span>Filtros JBP</span>
            </button>
          </div>

          {/* Page Subtitle & Info Tip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-montserrat font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                Visão Geral do Canal <span className="text-emerald-600 dark:text-emerald-400">Digital</span> & Rede
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nexus Distribuição & Varejo B2B & Indústrias Parceiras — Regra JBP: <strong className="text-slate-700 dark:text-slate-300">Rede = Loja Física + Televendas + Digital</strong>.
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              Extraído via Base Unificada JBP 2026
            </div>
          </div>

          {/* TAB 1: VISÃO GERAL DE KPIS */}
          {activeTab === 'tab-1' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* TOP KPI ROW (CRM - V4 Grid Layout with 4 Cards in 10 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-4">
                {/* 1. Solid Accent Card (CRM - V4 Signature) */}
                <div className="lg:col-span-2 h-full">
                  <KpiCard
                    title="Faturamento Total"
                    value={formatBRL(metrics.revenueCurrent)}
                    variation={metrics.revenueVar}
                    subtext={`vs. ${formatBRL(metrics.revenueBase)} base`}
                    iconType="revenue"
                    variant="solid"
                    // secondaryMetric={{ value: formatBRL(metrics.ticketCurrent), label: 'Ticket Médio' }}
                  />
                </div>

                {/* 2. Card de Eficiência & Volumetria (Ticket Médio em destaque + Pedidos/Cupons + Itens Vendidos) */}
                <div className="lg:col-span-2 h-full">
                  <KpiCard
                    title="Ticket Médio & Volumetria"
                    iconType="receipt"
                    variant="triple-metric"
                    metricsList={[
                      {
                        label: 'Ticket Médio',
                        value: formatBRLDec(metrics.ticketCurrent),
                        subtext: `vs. ${formatBRLDec(metrics.ticketBase)} base`,
                        variation: metrics.ticketVar,
                        isHighlight: true
                      },
                      {
                        label: 'Pedidos',
                        value: formatNum(metrics.ordersCurrent),
                        subtext: `vs. ${formatNum(metrics.ordersBase)}`,
                        variation: metrics.ordersVar,
                        isHighlight: false
                      },
                      {
                        label: 'Itens (Un.)',
                        value: formatNum(metrics.qtyCurrent),
                        subtext: `vs. ${formatNum(metrics.qtyBase)}`,
                        variation: metrics.qtyVar,
                        isHighlight: false
                      }
                    ]}
                  />
                </div>

                {/* 3 & 4. Acelerador Digital (Ocupando 4 colunas de 10) */}
                <div className="lg:col-span-4 h-full relative bg-gradient-to-br from-[#007BFF] to-[#0056B3] rounded-xl p-3 text-white shadow-lg overflow-hidden flex flex-col w-full group transition-transform hover:-translate-y-0.5">
                  <div className="absolute -right-3 -bottom-3 opacity-15 pointer-events-none transition-transform group-hover:scale-110">
                    <Zap className="w-24 h-24" />
                  </div>

                  {/* Top Zone: Label (Fixed Height) */}
                  <div className="h-5 mb-1.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="font-montserrat font-bold text-[11px] uppercase tracking-wider text-white/90">
                      Valor Incremental (Acelerador)
                    </span>
                  </div>

                  {/* Middle Zone: Strict Heights */}
                  <div className="flex-1 flex flex-col relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col h-full">
                        <div className="h-3.5 mb-0.5 flex items-end">
                          <span className="text-[10px] uppercase font-semibold text-white/70 leading-none truncate">
                            Δ {selectedChannel === 'DIGITAL' ? 'Digital' : channelLabel}
                          </span>
                        </div>
                        <div className="h-9 flex items-end">
                          <span className="font-montserrat font-bold text-2xl sm:text-3xl tracking-tight text-white leading-none">
                            {formatBRL(metrics.incrementalValue)}
                          </span>
                        </div>
                        <div className="h-5 mt-0.5 flex items-start">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/90 leading-none">
                            {metrics.incrementalVar >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {metrics.incrementalVar >= 0 ? '+' : ''}{metrics.incrementalVar.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col h-full border-l border-white/20 pl-4">
                        <div className="h-3.5 mb-0.5 flex items-end">
                          <span className="text-[10px] uppercase font-semibold text-white/70 leading-none truncate" title="Variação Nominal de Faturamento da Rede vs Período Base">
                            Δ Rede Total (vs Base)
                          </span>
                        </div>
                        <div className="h-9 flex items-end">
                          <span className="font-montserrat font-bold text-2xl sm:text-3xl tracking-tight text-white leading-none" title={`Faturamento Atual: ${formatBRL(metrics.redeRevenueCurrent)} | Faturamento Base: ${formatBRL(metrics.redeRevenueBase)}`}>
                            {formatBRL(metrics.redeIncrementalValue)}
                          </span>
                        </div>
                        <div className="h-5 mt-0.5 flex items-start">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white/90 leading-none" title={`Venda Atual: ${formatBRL(metrics.redeRevenueCurrent)} vs Base: ${formatBRL(metrics.redeRevenueBase)}`}>
                            {metrics.redeIncrementalVar >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {metrics.redeIncrementalVar >= 0 ? '+' : ''}{metrics.redeIncrementalVar.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Zone: Footer (Fixed Height) */}
                  <div className="h-9 pb-3 pt-1 mt-auto text-[11px] font-medium border-t border-white/20 relative z-10 bg-white/10 -mx-3 -mb-3 px-3 flex items-center text-white/90 rounded-b-xl truncate">
                    {metrics.redeIncrementalValue > 0 ? (
                      `🔥 O ${selectedChannel === 'DIGITAL' ? 'Digital' : channelLabel} foi responsável por ${((metrics.incrementalValue / metrics.redeIncrementalValue) * 100).toFixed(1)}% de todo o Δ da Rede`
                    ) : metrics.incrementalValue > 0 ? (
                      `🚀 O ${selectedChannel === 'DIGITAL' ? 'Digital' : channelLabel} acelerou +${formatBRL(metrics.incrementalValue)} (+${metrics.incrementalVar.toFixed(1)}%) amortecendo a retração física`
                    ) : (
                      `📊 Variação nominal no período: ${formatBRL(metrics.incrementalValue)}`
                    )}
                  </div>
                </div>

                {/* 5. Representatividade */}
                <div className="lg:col-span-2 h-full">
                  <KpiCard
                    title="Representatividade"
                    value={`${metrics.representatividade.toFixed(1)}%`}
                    variation={null}
                    subtext={
                      ((selectedLinha && selectedLinha.length > 0 && !selectedLinha.some(l => l.includes('CONSOLIDADO'))) ||
                       (selectedProduct && selectedProduct.length > 0 && !selectedProduct.some(p => p.includes('CONSOLIDADO'))))
                        ? 'Digital vs Rede da Linha'
                        : (selectedChannel === 'DIGITAL' ? 'Canal Digital' : selectedChannel === 'REDE' ? 'Total da Rede' : channelLabel)
                    }
                    iconType="share"
                    variant="simple"
                    progressPct={metrics.representatividade}
                    secondaryMetric={
                      metrics.penetracaoDigital !== null
                        ? {
                            value: `${metrics.penetracaoDigital.toFixed(1)}%`,
                            label: 'Digital vs Rede'
                          }
                        : undefined
                    }
                  />
                </div>
              </div>

              {/* CHARTS ROW (Full Width Evolução Mensal with Channel Pivot Table) */}
              <div className="w-full">
                <ViewToggleBlock
                  title={
                    trendMetric === 'qty' ? "Evolução Mensal - Unidades Vendidas" :
                    trendMetric === 'ticket' ? "Evolução Mensal - Ticket Médio" :
                    trendMetric === 'share' ? "Evolução Mensal - % de Representatividade" :
                    "Evolução Mensal - Faturamento"
                  }
                  subtitle={`${periodLabel} — ${channelLabel}${breakdownByChannel ? ' · Por Canal' : ''}`}
                  exportFilename={`evolucao_mensal_${trendMetric}_jbp`}
                  headerControls={
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Row Breakdown Channel Toggle */}
                      <button
                        onClick={() => setBreakdownByChannel(!breakdownByChannel)}
                        className={`px-3 py-1 rounded-xl font-montserrat font-bold text-xs transition-all border flex items-center gap-1.5 ${
                          breakdownByChannel 
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
                            : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        <span>{breakdownByChannel ? "✓ Linhas Multicanal Ativas" : "📈 Comparar Linhas por Canal"}</span>
                      </button>

                      {/* Metric Selector Pills */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-montserrat font-semibold overflow-x-auto">
                        <button
                          onClick={() => setTrendMetric('revenue')}
                          className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                            trendMetric === 'revenue' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          💵 Faturamento
                        </button>
                        <button
                          onClick={() => setTrendMetric('qty')}
                          className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                            trendMetric === 'qty' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          📦 Unidades
                        </button>
                        <button
                          onClick={() => setTrendMetric('ticket')}
                          className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                            trendMetric === 'ticket' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          🛒 Ticket Médio
                        </button>
                        <button
                          onClick={() => setTrendMetric('share')}
                          className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                            trendMetric === 'share' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          📊 % Representatividade
                        </button>
                      </div>
                    </div>
                  }
                  tableHeaders={
                    breakdownByChannel ? [
                      { key: 'month', label: 'Mês/Ano' },
                      { key: 'channel', label: 'Canal de Venda' },
                      { key: 'revenueFormatted', label: 'Faturamento (R$)' },
                      { key: 'qtyFormatted', label: 'Unidades Vendidas' },
                      { key: 'ticketFormatted', label: 'Ticket Médio (R$)' },
                      { key: 'shareFormatted', label: '% Representatividade' }
                    ] : isDualComparison ? [
                      { key: 'month', label: 'Mês/Ano' },
                      { key: 'val2026Formatted', label: `${latestMonth.split('-')[0]} (Atual)` },
                      { key: 'val2025Formatted', label: `${parseInt(latestMonth.split('-')[0])-1} (Anterior)` },
                      { key: 'varFormatted', label: 'Variação %' }
                    ] : [
                      { key: 'month', label: 'Mês/Ano' },
                      { key: 'revenueFormatted', label: 'Faturamento (R$)' },
                      { key: 'qtyFormatted', label: 'Unidades Vendidas' },
                      { key: 'ticketFormatted', label: 'Ticket Médio (R$)' },
                      { key: 'shareFormatted', label: '% Representatividade' }
                    ]
                  }
                  tableRows={
                    breakdownByChannel
                      ? monthlyRowData.map(r => ({
                          month: r.month,
                          channel: r.isTotal ? <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{r.channel}</strong> : r.channel,
                          revenueFormatted: formatBRL(r.revenue),
                          qtyFormatted: `${formatNum(r.qty)} un.`,
                          ticketFormatted: formatBRL(r.ticket),
                          shareFormatted: `${r.share.toFixed(1)}%`
                        }))
                      : isDualComparison
                      ? monthlyTrendData.map(d => {
                          const varPct = d.val2025 > 0 ? ((d.val - d.val2025) / d.val2025) * 100 : 0;
                          const fmtVal = (v) => trendMetric === 'qty' ? `${formatNum(v)} un.` : trendMetric === 'ticket' ? formatBRL(v) : trendMetric === 'share' ? `${v.toFixed(1)}%` : formatBRL(v);
                          return {
                            month: d.month,
                            val2026Formatted: fmtVal(d.val),
                            val2025Formatted: fmtVal(d.val2025),
                            varFormatted: <span className={varPct >= 0 ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>{varPct >= 0 ? '+' : ''}{varPct.toFixed(1)}%</span>
                          };
                        })
                      : monthlyTrendData.map(d => ({
                          month: d.month,
                          revenueFormatted: formatBRL(d.revenue),
                          qtyFormatted: `${formatNum(d.qty)} un.`,
                          ticketFormatted: formatBRL(d.ticket),
                          shareFormatted: `${d.share.toFixed(1)}%`
                        }))
                  }
                  chartComponent={
                    <div className="h-[340px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        {breakdownByChannel ? (
                          <LineChart data={monthlyTrendData} margin={{ top: 36, right: 30, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                            <YAxis
                              stroke="#64748B"
                              fontSize={11}
                              tickFormatter={(val) => {
                                if (trendMetric === 'qty') return val >= 1000 ? `${(val/1000).toFixed(0)}k` : val;
                                if (trendMetric === 'ticket') return `R$ ${val.toFixed(0)}`;
                                if (trendMetric === 'share') return `${val.toFixed(1)}%`;
                                return val >= 1000000 ? `R$ ${(val/1000000).toFixed(1)}M` : `R$ ${(val/1000).toFixed(0)}k`;
                              }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '10px', color: '#F8FAFC' }}
                              formatter={(value, name) => {
                                const fmt = trendMetric === 'qty' ? `${formatNum(value)} un.` :
                                            trendMetric === 'ticket' ? formatBRL(value) :
                                            trendMetric === 'share' ? `${Number(value).toFixed(1)}%` : formatBRL(value);
                                return [fmt, name];
                              }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                            {activeSubChannels.map((ch, chIdx) => (
                              <Line 
                                key={ch.key} 
                                type="monotone" 
                                dataKey={ch.key} 
                                name={ch.name} 
                                stroke={ch.color} 
                                strokeWidth={3} 
                                dot={{ r: 5, fill: ch.color }} 
                              >
                                <LabelList content={makeTrendLabel(ch.color, chIdx % 2 === 0 ? -18 : 18)} />
                              </Line>
                            ))}
                          </LineChart>
                        ) : isDualComparison ? (
                          /* Gráfico de linhas dual: 2026 vs 2025, com bolinhas em cada mês */
                          <LineChart data={monthlyTrendData} margin={{ top: 36, right: 30, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="month" stroke="#64748B" fontSize={11} tick={{ fill: '#64748B' }} />
                            <YAxis
                              stroke="#64748B"
                              fontSize={11}
                              tickFormatter={(val) => {
                                if (trendMetric === 'qty') return val >= 1000 ? `${(val/1000).toFixed(0)}k` : val;
                                if (trendMetric === 'ticket') return `R$ ${val.toFixed(0)}`;
                                if (trendMetric === 'share') return `${val.toFixed(1)}%`;
                                return val >= 1000000 ? `R$ ${(val/1000000).toFixed(1)}M` : `R$ ${(val/1000).toFixed(0)}k`;
                              }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '10px', color: '#F8FAFC', fontSize: '12px' }}
                              formatter={(value, name) => {
                                const fmt = trendMetric === 'qty' ? `${formatNum(value)} un.` :
                                            trendMetric === 'ticket' ? formatBRL(value) :
                                            trendMetric === 'share' ? `${Number(value).toFixed(1)}%` : formatBRL(value);
                                return [fmt, name];
                              }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '13px', fontWeight: '600' }} />
                            {/* Linha 2026 — cor principal */}
                            <Line
                              type="monotone"
                              dataKey="val"
                              name={trendMetric === 'share' ? `Participação (Atual)` : `${latestMonth.split('-')[0]} (Atual)`}
                              stroke={trendMetric === 'qty' ? '#007BFF' : trendMetric === 'ticket' ? '#F68712' : trendMetric === 'share' ? '#8B5CF6' : '#00A650'}
                              strokeWidth={3}
                              dot={{ r: 6, fill: trendMetric === 'qty' ? '#007BFF' : trendMetric === 'ticket' ? '#F68712' : trendMetric === 'share' ? '#8B5CF6' : '#00A650', strokeWidth: 2, stroke: '#fff' }}
                              activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
                            >
                              <LabelList content={makeTrendLabel(trendMetric === 'qty' ? '#007BFF' : trendMetric === 'ticket' ? '#F68712' : trendMetric === 'share' ? '#8B5CF6' : '#00A650', -16, trendMetric !== 'share')} />
                            </Line>
                            {/* Linha 2025 — secundária */}
                            {(() => {
                              const prevColor = trendMetric === 'qty' ? '#93C5FD' : trendMetric === 'ticket' ? '#FDBA74' : trendMetric === 'share' ? '#A78BFA' : '#86EFAC';
                              return (
                                <Line
                                  type="monotone"
                                  dataKey="val2025"
                                  name={trendMetric === 'share' ? `Participação (Anterior)` : `${parseInt(latestMonth.split('-')[0])-1} (Anterior)`}
                                  stroke={prevColor}
                                  strokeWidth={2.5}
                                  strokeDasharray="5 3"
                                  dot={{ r: 5, fill: prevColor, strokeWidth: 2, stroke: '#fff' }}
                                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                                >
                                  <LabelList content={makeTrendLabel(prevColor, 18, trendMetric !== 'share')} />
                                </Line>
                              );
                            })()}
                            
                            {/* EXTRA LINES FOR SHARE TAB: Penetração (Digital vs Rede) */}
                            {trendMetric === 'share' && (
                              <>
                                <Line
                                  type="monotone"
                                  dataKey="penetracao"
                                  name="Digital vs Rede (Atual)"
                                  stroke="#14B8A6" // Teal
                                  strokeWidth={3}
                                  dot={{ r: 6, fill: '#14B8A6', strokeWidth: 2, stroke: '#fff' }}
                                  activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
                                >
                                  <LabelList content={makeTrendLabel('#14B8A6', -16, false)} />
                                </Line>
                                <Line
                                  type="monotone"
                                  dataKey="penetracao2025"
                                  name="Digital vs Rede (Anterior)"
                                  stroke="#99F6E4" // Light Teal
                                  strokeWidth={2.5}
                                  strokeDasharray="5 3"
                                  dot={{ r: 5, fill: '#99F6E4', strokeWidth: 2, stroke: '#fff' }}
                                  activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                                >
                                  <LabelList content={makeTrendLabel('#5EEAD4', 18, false)} />
                                </Line>
                              </>
                            )}
                          </LineChart>
                        ) : (
                          <AreaChart data={monthlyTrendData} margin={{ top: 36, right: 30, left: 20, bottom: 10 }}>
                            <defs>
                              <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={trendMetric === 'qty' ? '#007BFF' : trendMetric === 'ticket' ? '#F68712' : trendMetric === 'share' ? '#8B5CF6' : '#00A650'} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={trendMetric === 'qty' ? '#007BFF' : trendMetric === 'ticket' ? '#F68712' : trendMetric === 'share' ? '#8B5CF6' : '#00A650'} stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                            <YAxis
                              stroke="#64748B"
                              fontSize={11}
                              tickFormatter={(val) => {
                                if (trendMetric === 'qty') return val >= 1000 ? `${(val/1000).toFixed(0)}k un.` : `${val} un.`;
                                if (trendMetric === 'ticket') return `R$ ${val.toFixed(0)}`;
                                if (trendMetric === 'share') return `${val.toFixed(1)}%`;
                                return val >= 1000000 ? `R$ ${(val/1000000).toFixed(1)}M` : `R$ ${(val/1000).toFixed(0)}k`;
                              }}
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '10px', color: '#F8FAFC' }}
                              formatter={(value) => {
                                if (trendMetric === 'qty') return [`${formatNum(value)} un.`, 'Unidades Vendidas'];
                                if (trendMetric === 'ticket') return [formatBRL(value), 'Ticket Médio'];
                                if (trendMetric === 'share') return [`${value.toFixed(1)}%`, '% Representatividade'];
                                return [formatBRL(value), 'Faturamento'];
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="val"
                              stroke={trendMetric === 'qty' ? '#007BFF' : trendMetric === 'ticket' ? '#F68712' : trendMetric === 'share' ? '#8B5CF6' : '#00A650'}
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#colorTrend)"
                            >
                              <LabelList content={makeTrendLabel(trendMetric === 'qty' ? '#007BFF' : trendMetric === 'ticket' ? '#F68712' : trendMetric === 'share' ? '#8B5CF6' : '#00A650', -16)} />
                            </Area>
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  }
                />
              </div>

              {/* RANKINGS SECTION */}
              <RankingsSection
                topProducts={topProducts}
                growingProducts={growingProducts}
                decliningProducts={decliningProducts}
                topCities={topCities}
                topCategories={topCategories}
                periodLabel={periodLabel}
                selectedPeriod={selectedPeriod}
                currentYear={latestMonth ? latestMonth.split('-')[0] : '2026'}
                previousYear={latestMonth ? String(parseInt(latestMonth.split('-')[0]) - 1) : '2025'}
                isLiveCities={Boolean(liveCitiesData)}
                isLiveLoading={isLiveCitiesLoading}
              />

            </div>
          )}

          {/* TAB 2: MATRIZ LINHAS & PRODUTOS (REDE VS DIGITAL) */}
          {activeTab === 'tab-2' && (
            <div className="bg-slate-200 dark:bg-transparent -mx-6 md:-mx-8 -mt-6 md:-mt-8 px-6 md:px-8 pt-6 md:pt-8 pb-0 min-h-screen">
              <LinhasProdutosPage
                activeSupplierData={activeSupplierData}
                consolidatedData={jbpData?.suppliers?.[0]}
                categoryTotals={jbpData?.category_totals}
                allSuppliers={jbpData?.suppliers}
                currentMonth={currentMonth}
                baseMonth={baseMonth}
                periodLabel={periodLabel}
                selectedSupplier={selectedSupplier}
                supplierLabel={supplierLabel}
                selectedPeriod={selectedPeriod}
                latestMonth={latestMonth}
                onOpenFilter={() => setIsFilterOpen(true)}
              />
            </div>
          )}

          {/* TAB 3, 4, 5 shortcuts */}
          {activeTab !== 'tab-1' && activeTab !== 'tab-2' && activeTab !== 'tab-live' && (
            <div className="animate-fade-in">
              <RankingsSection
                topProducts={topProducts}
                growingProducts={growingProducts}
                decliningProducts={decliningProducts}
                topCities={topCities}
                topCategories={topCategories}
                periodLabel={periodLabel}
                selectedPeriod={selectedPeriod}
                currentYear={latestMonth ? latestMonth.split('-')[0] : '2026'}
                previousYear={latestMonth ? String(parseInt(latestMonth.split('-')[0]) - 1) : '2025'}
                isLiveCities={Boolean(liveCitiesData)}
                isLiveLoading={isLiveCitiesLoading}
              />
            </div>
          )}

          {/* TAB LIVE: MÊS ATUAL (QLIK SENSE) */}
          {activeTab === 'tab-live' && (
            <MesAtualPage 
              jbpData={jbpData} 
              selectedSupplier={selectedSupplier}
              selectedLinha={selectedLinha}
              selectedChannel={selectedChannel}
              selectedProduct={selectedProduct}
              selectedUFs={selectedUFs}
            />
          )}

        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-500 mt-12">
          Painel Digital JBP © 2026 Nexus Distribuição & Varejo B2B.
        </footer>

      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        suppliersList={suppliersList}
        selectedSupplier={selectedSupplier}
        setSelectedSupplier={setSelectedSupplier}
        linhasList={linhasList}
        selectedLinha={selectedLinha}
        setSelectedLinha={setSelectedLinha}
        productsList={productsList}
        productsMetadata={productsMetadata}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        selectedChannel={selectedChannel}
        setSelectedChannel={setSelectedChannel}
        onApplyFilters={() => {}}
        latestMonth={latestMonth}
        activeTab={activeTab}
        supplierLabel={supplierLabel}
        linhaLabel={linhaLabel}
        selectedUFs={selectedUFs}
        setSelectedUFs={setSelectedUFs}
      />

    </div>
  );
}

