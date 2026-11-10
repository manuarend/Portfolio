# app.py — Painel de Competitividade Comercial · Nexus Inteligência Comercial
# Estratégia Comercial | Compradores | Fornecedores
# ──────────────────────────────────────────────────────────────

import streamlit as st
import pandas as pd
import numpy as np
import os
import hashlib
import io
import base64
from datetime import datetime

# ─── Configuração da Página (DEVE ser o 1.º comando Streamlit) ──
st.set_page_config(
    page_title="Painel de Competitividade Comercial – Nexus Inteligência Comercial",
    page_icon="💊",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ─── Imports internos ──────────────────────────────────────────
from utils.theme_manager import init_theme, toggle_theme, inject_theme_css
from utils.data_manager import (
    load_data_from_excel, save_uploaded_excel,
    get_db_metadata, ensure_data_folder,
)
from utils.calculations import enrich_dataframe_with_kpis, get_kpi_summary
from st_aggrid import AgGrid, GridOptionsBuilder, JsCode

# ─── Cores Design System Nexus Inteligência Comercial ─────────────────────────────
COR_AZUL       = "#2D2E96"
COR_VERMELHO   = "#C81419"
COR_VERDE      = "#0AA35B"
COR_LARANJA    = "#FF9326"
COR_AZUL_CLARO = "#00B1F2"

# ─── Session State ─────────────────────────────────────────────
init_theme()

_SS_DEFAULTS: dict = {
    "kpi_filter":        None,
    "f_comprador":       [],
    "f_laboratorio":     [],
    "f_grupo":           [],
    "f_subgrupo":        [],
    "f_linha":           [],
    "f_descontinuado":   [],
    "f_produto_id_txt":  "",
    "f_ean_txt":         "",
    "f_produto_txt":     "",
    "f_grupo_rede":      [],
    "f_subgrupo_rede":   [],
    "f_linha_rede":      [],
}
for _k, _v in _SS_DEFAULTS.items():
    if _k not in st.session_state:
        st.session_state[_k] = _v

# ─── CSS ───────────────────────────────────────────────────────
inject_theme_css()

_css_path = os.path.join("assets", "custom_style.css")
if os.path.exists(_css_path):
    with open(_css_path, encoding="utf-8") as _f:
        st.markdown(f"<style>{_f.read()}</style>", unsafe_allow_html=True)

# ─── Carregamento de Dados ─────────────────────────────────────
@st.cache_data(show_spinner="🔄 Carregando base de dados…")
def get_enriched_data():
    df = load_data_from_excel()
    return enrich_dataframe_with_kpis(df)


# ─── Helpers ───────────────────────────────────────────────────
def verify_password(plain: str) -> bool:
    default_hash = "5b40bcefa1d0290ce7127f2e1388892f4c1f5043d41e87c6d7d1daf72d069343"
    try:
        h = st.secrets.get("admin_password_hash", os.getenv("ADMIN_PASSWORD_HASH", default_hash))
        return hashlib.sha256(plain.encode()).hexdigest() == (h or default_hash)
    except Exception:
        h = os.getenv("ADMIN_PASSWORD_HASH", default_hash)
        return hashlib.sha256(plain.encode()).hexdigest() == (h or default_hash)


def logo_b64() -> str | None:
    for name in ("logo.png", "logo_horizontal.png"):
        path = os.path.join("assets", name)
        if os.path.exists(path):
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode()
    # Tenta também no root
    for name in ("logo.png",):
        if os.path.exists(name):
            with open(name, "rb") as f:
                return base64.b64encode(f.read()).decode()
    return None


def unique_sorted(df: pd.DataFrame, col: str) -> list:
    if col not in df.columns:
        return []
    return sorted(
        v for v in df[col].dropna().unique()
        if str(v) not in {"N/D", "", "nan"}
    )


# ─── Modal de Atualização ─────────────────────────────────────
@st.dialog("📤 Atualizar Base de Dados")
def show_update_modal():
    st.markdown("Carregue a nova planilha e confirme com a senha administrativa.")
    st.caption("⚠️ A operação substituirá permanentemente a base atual.")

    uploaded = st.file_uploader("Arquivo Excel (.xlsx)", type=["xlsx", "xls"])
    if uploaded:
        st.info(f"📄 **Selecionado:** {uploaded.name}")

    senha = st.text_input("Senha Administrativa", type="password",
                          placeholder="Digite a senha para autorizar…")

    c1, c2 = st.columns(2)
    with c1:
        if st.button("✅ Confirmar Atualização", use_container_width=True, type="primary"):
            if not uploaded:
                st.error("Nenhum arquivo selecionado.")
            elif not senha:
                st.error("Senha obrigatória.")
            elif not verify_password(senha):
                st.error("Senha incorreta.")
            else:
                with st.spinner("Substituindo base…"):
                    try:
                        save_uploaded_excel(uploaded)
                        get_enriched_data.clear()
                        st.success("✅ Base atualizada! Recarregando…")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Erro: {e}")
    with c2:
        if st.button("Cancelar", use_container_width=True):
            st.rerun()


# ─── Filtros ───────────────────────────────────────────────────
_FILTER_KEYS = [
    "f_comprador", "f_laboratorio", "f_grupo",
    "f_subgrupo", "f_linha", "f_descontinuado",
    "f_grupo_rede", "f_subgrupo_rede", "f_linha_rede",
]


def apply_filters(df: pd.DataFrame, exclude: str | None = None) -> pd.DataFrame:
    d = df
    if exclude != "f_comprador"   and st.session_state.f_comprador:
        d = d[d["Comprador"].isin(st.session_state.f_comprador)]
    if exclude != "f_laboratorio" and st.session_state.f_laboratorio:
        d = d[d["Laboratorio"].isin(st.session_state.f_laboratorio)]
    if exclude != "f_grupo"       and st.session_state.f_grupo:
        d = d[d["Gerencial 1"].isin(st.session_state.f_grupo)]
    if exclude != "f_subgrupo"    and st.session_state.f_subgrupo:
        d = d[d["Gerencial 2"].isin(st.session_state.f_subgrupo)]
    if exclude != "f_linha"       and st.session_state.f_linha:
        d = d[d["Gerencial 3"].isin(st.session_state.f_linha)]
    if exclude != "f_descontinuado" and st.session_state.f_descontinuado:
        d = d[d["Descontinuado"].isin(st.session_state.f_descontinuado)]

    # Filtros Arvore Rede (usando mesmas colunas para demonstrar funcionamento, caso necessário separar depois)
    if exclude != "f_grupo_rede"    and st.session_state.f_grupo_rede:
        d = d[d["Desc_Grupo"].isin(st.session_state.f_grupo_rede)]
    if exclude != "f_subgrupo_rede" and st.session_state.f_subgrupo_rede:
        d = d[d["Desc_Subgrupo"].isin(st.session_state.f_subgrupo_rede)]
    if exclude != "f_linha_rede"    and st.session_state.f_linha_rede:
        d = d[d["Desc_Linha"].isin(st.session_state.f_linha_rede)]

    # Produto ID — texto
    ids = [s.strip() for s in st.session_state.f_produto_id_txt.split(",") if s.strip()]
    if ids:
        d = d[d["Produto_ID"].isin(ids)]

    # EAN — texto
    eans = [s.strip() for s in st.session_state.f_ean_txt.split(",") if s.strip()]
    if eans:
        d = d[d["EAN"].isin(eans)]

    # Busca por nome
    pesquisa = st.session_state.f_produto_txt.strip().lower()
    if pesquisa:
        d = d[d["Desc_Produto"].str.lower().str.contains(pesquisa, na=False)]

    # KPI filter (via cartões)
    if st.session_state.kpi_filter and "Status_KPI" in d.columns:
        d = d[d["Status_KPI"] == st.session_state.kpi_filter]

    return d


def clear_filters():
    for k in _FILTER_KEYS:
        st.session_state[k] = []
    st.session_state.f_produto_txt    = ""
    st.session_state.f_produto_id_txt = ""
    st.session_state.f_ean_txt        = ""
    st.session_state.kpi_filter       = None


# ══════════════════════════════════════════════════════════════
#  LAYOUT PRINCIPAL
# ══════════════════════════════════════════════════════════════
ensure_data_folder()
meta = get_db_metadata()

try:
    df_full = get_enriched_data()
    load_err = None
except Exception as e:
    df_full = pd.DataFrame()
    load_err = str(e)


# ── CABEÇALHO ─────────────────────────────────────────────────
_logo = logo_b64()
_logo_html = (
    f'<img src="data:image/png;base64,{_logo}" alt="Nexus Inteligência Comercial">'
    if _logo
    else '<span class="logo-text-fallback">💊 Nexus Inteligência Comercial</span>'
)

# Linha do cabeçalho: logo + título | botões de ação
col_head, col_actions = st.columns([8, 4], gap="medium")

with col_head:
    st.markdown(
        f"""
        <div class="app-header-wrap">
          <div class="app-header-logo-box">{_logo_html}</div>
          <div class="app-header-title-box">
            <h1 class="app-header-main-title">Painel de Competitividade Comercial</h1>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with col_actions:
    st.markdown(
        f'<div class="action-meta">🕒 Atualizado: <b>{meta["last_update"]}</b> &nbsp;|&nbsp; 📄 {meta["filename"]}</div>',
        unsafe_allow_html=True,
    )
    _b1, _b2 = st.columns(2, gap="small")
    with _b1:
        if st.button("📤 Atualizar Base", use_container_width=True, key="btn_upload"):
            show_update_modal()
    with _b2:
        _export_slot = st.empty()

# ── ERRO DE CARREGAMENTO ───────────────────────────────────────
if load_err:
    st.error(f"❌ **Erro ao carregar dados:** {load_err}")
    st.info("Use **📤 Atualizar Base** para carregar uma planilha válida.")
    st.stop()

if df_full.empty:
    st.warning("⚠️ A base de dados está vazia. Faça upload de uma planilha.")
    st.stop()


# ══════════════════════════════════════════════════════════════
#  PAINEL DE FILTROS — fundo azul escuro (modelo)
# ══════════════════════════════════════════════════════════════
with st.container():
    st.markdown('<div class="filter-panel-target"></div>', unsafe_allow_html=True)

    # ── Seção 1: FILTRO PRINCIPAL ──────────────────────────────────
    st.markdown('<div class="filter-section-label">FILTRO</div>', unsafe_allow_html=True)

    f1 = st.columns([2, 2, 1.5, 2, 2.5], gap="small")
    with f1[0]:
        st.multiselect(
            "Comprador",
            unique_sorted(apply_filters(df_full, "f_comprador"), "Comprador"),
            key="f_comprador", placeholder="Todos",
        )
    with f1[1]:
        st.multiselect(
            "Laboratório",
            unique_sorted(apply_filters(df_full, "f_laboratorio"), "Laboratorio"),
            key="f_laboratorio", placeholder="Todos",
        )
    with f1[2]:
        st.multiselect(
            "Descontinuado",
            unique_sorted(apply_filters(df_full, "f_descontinuado"), "Descontinuado"),
            key="f_descontinuado", placeholder="Todos",
        )
    with f1[3]:
        st.text_input(
            "Produto ID",
            key="f_produto_id_txt",
            placeholder="Ex: 88, 170, 217",
            help="Múltiplos IDs separados por vírgula",
        )
    with f1[4]:
        st.text_input(
            "EAN / Cód. Barras",
            key="f_ean_txt",
            placeholder="Ex: 7896006211808",
            help="Múltiplos EANs separados por vírgula",
        )

    # ── Seção 2: FILTRO ARVORE DIGITAL ────────────────────────────
    st.markdown('<div class="filter-section-label">FILTRO ARVORE DIGITAL</div>', unsafe_allow_html=True)

    f2 = st.columns([2, 2, 2, 4], gap="small")
    with f2[0]:
        st.multiselect(
            "Gerencial 1",
            unique_sorted(apply_filters(df_full, "f_grupo"), "Gerencial 1"),
            key="f_grupo", placeholder="Todos",
        )
    with f2[1]:
        st.multiselect(
            "Gerencial 2",
            unique_sorted(apply_filters(df_full, "f_subgrupo"), "Gerencial 2"),
            key="f_subgrupo", placeholder="Todos",
        )
    with f2[2]:
        st.multiselect(
            "Gerencial 3",
            unique_sorted(apply_filters(df_full, "f_linha"), "Gerencial 3"),
            key="f_linha", placeholder="Todos",
        )
    with f2[3]:
        st.text_input(
            "🔎 Buscar Produto",
            key="f_produto_txt",
            placeholder="Digite parte do nome do produto…",
        )

    # ── Seção 3: FILTRO ARVORE REDE + Limpar ──────────────────────
    st.markdown('<div class="filter-section-label">FILTRO ARVORE REDE</div>', unsafe_allow_html=True)

    f3 = st.columns([2, 2, 2, 6, 1.5], gap="small")
    # Arvore Rede usa as mesmas dimensões (Grupo/Subgrupo/Linha) já mostradas acima
    # Exibe como somente‑leitura/informativo (sem estado duplicado), ou pode‑se adaptar
    # para colunas novas se disponíveis na base. Por ora, mostra os filtros de rede:
    with f3[0]:
        st.multiselect(
            "Grupo (Rede)",
            unique_sorted(apply_filters(df_full, "f_grupo_rede"), "Desc_Grupo"),
            key="f_grupo_rede",
            placeholder="Todos",
        )
    with f3[1]:
        st.multiselect(
            "Subgrupo (Rede)",
            unique_sorted(apply_filters(df_full, "f_subgrupo_rede"), "Desc_Subgrupo"),
            key="f_subgrupo_rede",
            placeholder="Todos",
        )
    with f3[2]:
        st.multiselect(
            "Linha (Rede)",
            unique_sorted(apply_filters(df_full, "f_linha_rede"), "Desc_Linha"),
            key="f_linha_rede",
            placeholder="Todos",
        )
    with f3[4]:
        st.markdown("<br>", unsafe_allow_html=True)
        st.button("🗑️ Limpar", use_container_width=True, on_click=clear_filters, key="btn_clear")

st.markdown("<br>", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════
#  KPIs
# ══════════════════════════════════════════════════════════════
_orig_kpi = st.session_state.kpi_filter
st.session_state.kpi_filter = None
df_kpi_base = apply_filters(df_full)
st.session_state.kpi_filter = _orig_kpi

kpis = get_kpi_summary(df_kpi_base)
df_filtered = apply_filters(df_full)
total_recs  = len(df_filtered)

_KPI_DESC = {
    "alerta": f"{kpis['alerta_pct']:.1f}% com concorrência<br>GAP % Médio acima de 2,5%.",
    "oport":  f"{kpis['oportunidade_pct']:.1f}% com concorrência<br>GAP % Médio entre 0% e 2,5%.",
    "comp":   f"{kpis['competitivo_pct']:.1f}% com concorrência<br>Preço igual ou abaixo da concorrência.",
}


def _kpi_card(label, value, mod, is_active):
    active_cls = "kpi-card--active" if is_active else ""
    desc = _KPI_DESC[mod]
    # Replace comma with dot for Brazilian thousands separator format
    formatted_val = f"{value:,}".replace(",", ".")
    return f"""
    <div class="kpi-card kpi-card--{mod} {active_cls}">
      <div class="kpi-label"><span class="kpi-dot"></span>{label}</div>
      <div class="kpi-value">{formatted_val}</div>
      <div class="kpi-desc-text">{desc}</div>
    </div>
    """


k1, k2, k3 = st.columns(3, gap="medium")

with k1:
    st.markdown(_kpi_card(
        "PRODUTOS EM ALERTA",
        kpis["alerta_qty"], "alerta",
        st.session_state.kpi_filter == "Alerta"
    ), unsafe_allow_html=True)
    _lbl = "✕ Remover filtro" if st.session_state.kpi_filter == "Alerta" else "Ver apenas este"
    with st.container():
        st.markdown('<div class="kpi-filter-btn">', unsafe_allow_html=True)
        if st.button(_lbl, key="kpi_alerta", use_container_width=True):
            st.session_state.kpi_filter = None if st.session_state.kpi_filter == "Alerta" else "Alerta"
            st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)

with k2:
    st.markdown(_kpi_card(
        "PRODUTOS COM OPORTUNIDADE",
        kpis["oportunidade_qty"], "oport",
        st.session_state.kpi_filter == "Oportunidade"
    ), unsafe_allow_html=True)
    _lbl = "✕ Remover filtro" if st.session_state.kpi_filter == "Oportunidade" else "Ver apenas este"
    with st.container():
        st.markdown('<div class="kpi-filter-btn">', unsafe_allow_html=True)
        if st.button(_lbl, key="kpi_oport", use_container_width=True):
            st.session_state.kpi_filter = None if st.session_state.kpi_filter == "Oportunidade" else "Oportunidade"
            st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)

with k3:
    st.markdown(_kpi_card(
        "PRODUTOS COMPETITIVOS",
        kpis["competitivo_qty"], "comp",
        st.session_state.kpi_filter == "Competitivo"
    ), unsafe_allow_html=True)
    _lbl = "✕ Remover filtro" if st.session_state.kpi_filter == "Competitivo" else "Ver apenas este"
    with st.container():
        st.markdown('<div class="kpi-filter-btn">', unsafe_allow_html=True)
        if st.button(_lbl, key="kpi_comp", use_container_width=True):
            st.session_state.kpi_filter = None if st.session_state.kpi_filter == "Competitivo" else "Competitivo"
            st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)

st.markdown('<hr class="divider">', unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════
#  TABELA AGGRID
# ══════════════════════════════════════════════════════════════
_kpi_tag = ""
if st.session_state.kpi_filter:
    _kpi_tag = f'<span class="kpi-active-tag">{st.session_state.kpi_filter}</span>'

st.markdown(
    f'<div class="record-badge">📊 Exibindo <b>{total_recs:,}</b> de <b>{len(df_full):,}</b> registros{_kpi_tag}</div>',
    unsafe_allow_html=True,
)

# Seleciona colunas — ordem do modelo: ID, Produto, Status, Comprador, Laboratorio, EAN, Grupo, Subgrupo, Linha, ...
COLS = [c for c in [
    "Produto_ID", "Desc_Produto", "Status_KPI", "Comprador", 
    "Laboratorio", "EAN", 
    "Gerencial 1", "Gerencial 2", "Gerencial 3", 
    "Desc_Grupo", "Desc_Subgrupo", "Desc_Linha",
    "Preço Regular SJ", "Preço Atual SJ", "Preço Médio Panvel", "Preço Médio por Raia",
    "Média Concorrência", "GAP % Panvel", "GAP % Raia", "GAP % Real SJ",
    "Meta Ecommerce", "Realizado D-1", "Desvio",
    "% Crescimento", "$ Crescimento", "% Evolução", "$ Evolução",
] if c in df_filtered.columns]

df_display = df_filtered[COLS].copy()

RENAME = {
    "Laboratorio":          "Laboratório",
    "Produto_ID":           "ID",
    "Desc_Produto":         "Produto",
    "Desc_Grupo":           "Grupo (Rede)",
    "Desc_Subgrupo":        "Subgrupo (Rede)",
    "Desc_Linha":           "Linha (Rede)",
    "Preço Atual SJ":       "Preço Promo SJ",
    "Preço Médio por Raia": "Preço Médio Raia",
    "GAP % Panvel":         "GAP% Panvel",
    "GAP % Raia":           "GAP% Raia",
    "GAP % Real SJ":        "GAP% Médio",
    "Status_KPI":           "Status",
    "Meta Ecommerce":       "Meta E-com",
}
df_display.rename(columns={k: v for k, v in RENAME.items() if k in df_display.columns}, inplace=True)

# ── GridOptions ───────────────────────────────────────────────
gb = GridOptionsBuilder.from_dataframe(df_display)
gb.configure_default_column(
    resizable=True, sortable=True, filter=True,
    editable=False, wrapText=False, floatingFilter=False,
    minWidth=100, wrapHeaderText=False, autoHeaderHeight=False,
)

# Colunas fixadas (pinned left) — ordem do modelo
gb.configure_column("ID",          minWidth=75,  maxWidth=90,  pinned="left")
gb.configure_column("Produto",     minWidth=280,              pinned="left")
gb.configure_column("Status",      minWidth=130, maxWidth=150, pinned="left")
gb.configure_column("Comprador",   minWidth=140, maxWidth=170, pinned="left")
gb.configure_column("Laboratório", minWidth=200, maxWidth=280)
gb.configure_column("EAN",         minWidth=150, maxWidth=180)
gb.configure_column("Gerencial 1", minWidth=150)
gb.configure_column("Gerencial 2", minWidth=200)
gb.configure_column("Gerencial 3", minWidth=190)
gb.configure_column("Grupo (Rede)", minWidth=160)
gb.configure_column("Subgrupo (Rede)", minWidth=200)
gb.configure_column("Linha (Rede)", minWidth=190)
gb.configure_column("Descontinuado", minWidth=150, maxWidth=180)

# Colunas monetárias e seus tamanhos recomendados
CURRENCY_COLS_WITH_WIDTHS = {
    "Preço Regular SJ":   170,
    "Preço Promo SJ":     160,
    "Preço Médio Panvel": 180,
    "Preço Médio Raia":   170,
    "Média Concorrência": 180,
    "Meta E-com":         130,
    "Realizado D-1":      150,
    "Desvio":             110,
    "$ Crescimento":      150,
    "$ Evolução":         140,
}
_fmt_brl = ("(value == null || value === 0) ? '—' : "
            "'R$ ' + value.toFixed(2).replace('.', ',').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')")
for c, w in CURRENCY_COLS_WITH_WIDTHS.items():
    if c in df_display.columns:
        gb.configure_column(c, type=["numericColumn"], valueFormatter=_fmt_brl, minWidth=w)

# Colunas percentuais e seus tamanhos recomendados
PCT_COLS_WITH_WIDTHS = {
    "GAP% Panvel":   130,
    "GAP% Raia":     130,
    "GAP% Médio":    130,
    "% Crescimento": 150,
    "% Evolução":    140,
}
_fmt_pct = "(value == null || value === 0) ? '—' : (value * 100).toFixed(1) + '%'"
for c, w in PCT_COLS_WITH_WIDTHS.items():
    if c in df_display.columns:
        gb.configure_column(c, type=["numericColumn"], valueFormatter=_fmt_pct, minWidth=w)

gb.configure_selection(selection_mode="multiple", use_checkbox=True)
gb.configure_side_bar(filters_panel=True, columns_panel=True)
gb.configure_pagination(enabled=True, paginationAutoPageSize=False, paginationPageSize=100)
gb.configure_grid_options(
    enableRangeSelection=True,
    rowHeight=36,
    headerHeight=52,
    animateRows=True,
    enableCellTextSelection=True,
)

# ── Cores condicionais (tema claro fixo) ─────────────────────
_c = {
    "alerta_bg": "#FFF0F0", "alerta_txt": "#C81419",
    "oport_bg":  "#FFF8EE", "oport_txt":  "#D97706",
    "comp_bg":   "#EDFAF3", "comp_txt":   "#0AA35B",
    "disc_bg":   "#F8FAFC", "disc_txt":   "#94A3B8",
}

js_row = JsCode(f"""
function(params) {{
    if (!params.data) return {{}};
    var disc = String(params.data['Descontinuado'] || '').toLowerCase();
    var st   = params.data['Status'] || '';
    if (['sim','yes','true','s'].includes(disc))
        return {{'background-color':'{_c["disc_bg"]}','color':'{_c["disc_txt"]}','font-style':'italic'}};
    if (st === 'Alerta')       return {{'background-color':'{_c["alerta_bg"]}','color':'{_c["alerta_txt"]}'}};
    if (st === 'Oportunidade') return {{'background-color':'{_c["oport_bg"]}', 'color':'{_c["oport_txt"]}'}};
    if (st === 'Competitivo')  return {{'background-color':'{_c["comp_bg"]}',  'color':'{_c["comp_txt"]}'}};
    return {{}};
}}
""")

js_status = JsCode(f"""
function(params) {{
    var v = params.value || '';
    if (v === 'Alerta')       return {{'background-color':'{COR_VERMELHO}','color':'#fff','font-weight':'700','border-radius':'5px','text-align':'center'}};
    if (v === 'Oportunidade') return {{'background-color':'{COR_LARANJA}', 'color':'#fff','font-weight':'700','border-radius':'5px','text-align':'center'}};
    if (v === 'Competitivo')  return {{'background-color':'{COR_VERDE}',   'color':'#fff','font-weight':'700','border-radius':'5px','text-align':'center'}};
    return {{'color':'{_c["disc_txt"]}','text-align':'center'}};
}}
""")

if "Status" in df_display.columns:
    gb.configure_column("Status", cellStyle=js_status)
gb.configure_grid_options(getRowStyle=js_row)

grid_opts = gb.build()

_header_bg    = "#1E2675"
_header_fg    = "#FFFFFF"
_header_hover = "#1A237E"

_custom_css = {
    ".ag-header, .ag-theme-streamlit .ag-header, .ag-theme-balham .ag-header": {
        "background-color": f"{_header_bg} !important",
        "border-bottom": "2.5px solid #2D2E96 !important",
    },
    ".ag-header-row, .ag-theme-streamlit .ag-header-row, .ag-theme-balham .ag-header-row": {
        "background-color": f"{_header_bg} !important",
    },
    ".ag-header-cell, .ag-theme-streamlit .ag-header-cell, .ag-theme-balham .ag-header-cell": {
        "background-color": f"{_header_bg} !important",
        "color": f"{_header_fg} !important",
        "font-weight": "700 !important",
        "font-size": "0.72rem !important",
        "text-transform": "uppercase !important",
        "letter-spacing": "0.06em !important",
    },
    ".ag-header-cell-label, .ag-theme-streamlit .ag-header-cell-label": {
        "color": f"{_header_fg} !important",
    },
    ".ag-header-cell:hover, .ag-theme-streamlit .ag-header-cell:hover": {
        "background-color": f"{_header_hover} !important",
    },
    ".ag-icon, .ag-theme-streamlit .ag-icon": {
        "color": "rgba(255,255,255,0.85) !important",
    },
}

AgGrid(
    df_display,
    gridOptions=grid_opts,
    theme="streamlit",
    height=560,
    allow_unsafe_jscode=True,
    update_mode="MODEL_CHANGED",
    fit_columns_on_grid_load=False,
    enable_enterprise_modules=False,
    custom_css=_custom_css,
)


# ── EXPORTAÇÃO EXCEL ──────────────────────────────────────────
def _gerar_excel(df: pd.DataFrame) -> bytes:
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as w:
        df.to_excel(w, index=False, sheet_name="Painel SJ")
    return buf.getvalue()


with _export_slot:
    st.download_button(
        "📥 Exportar Excel",
        data=_gerar_excel(df_display),
        file_name=f"painel_sj_{datetime.now():%Y%m%d_%H%M}.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        use_container_width=True,
        key="btn_export",
    )


# ── RODAPÉ ────────────────────────────────────────────────────
st.markdown(
    '<div class="app-footer">'
    'Painel de Competitividade Comercial &nbsp;·&nbsp; Nexus Inteligência Comercial &nbsp;·&nbsp; '
    'Gerência Comercial &nbsp;|&nbsp; Desenvolvido pela equipe de dados'
    '</div>',
    unsafe_allow_html=True,
)

