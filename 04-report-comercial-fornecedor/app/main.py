import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import os

# ── 1. Page Configuration ────────────────────────────────────────────────────
st.set_page_config(
    page_title="Relatório Comercial Mensal de Fornecedores | Nexus Varejo B2B",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ── 2. CSS Styling & Layout ──────────────────────────────────────────────────
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
    .stApp { background-color: #f8fafc; }
    [data-testid="stMain"] { background-color: #f8fafc; }

    /* Cards */
    [data-testid="stVerticalBlockBorderWrapper"] {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 14px !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.04) !important;
        padding: 8px 14px !important;
        margin-bottom: 8px !important;
    }

    /* KPI Metric Cards */
    .metric-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 18px 22px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        text-align: center;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.07);
    }
    .metric-title {
        font-size: 11px; font-weight: 700;
        color: #64748b; margin-bottom: 6px;
        text-transform: uppercase; letter-spacing: 0.8px;
    }
    .metric-value {
        font-size: 24px; font-weight: 800;
        color: #0f172a; margin: 0;
    }
    .metric-sub {
        font-size: 11px; font-weight: 600;
        color: #0052cc; margin-top: 4px;
    }

    /* Report do Mês Card */
    .report-card {
        background: linear-gradient(160deg, #0b132b 0%, #1e40af 100%);
        border-radius: 14px;
        padding: 22px 18px;
        color: white;
        box-shadow: 0 8px 24px rgba(30, 64, 175, 0.25);
    }
    .report-card-title {
        font-size: 12px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 1.2px;
        color: #93c5fd; margin-bottom: 14px;
        border-bottom: 1px solid rgba(255,255,255,0.12);
        padding-bottom: 10px;
    }
    .report-card-label {
        font-size: 11px; font-weight: 600;
        color: #bfdbfe; text-transform: uppercase; margin-bottom: 4px;
    }
    .report-card-value {
        font-size: 26px; font-weight: 800;
        color: #ffffff; margin-bottom: 16px;
    }
    .report-card-metric {
        display: flex; justify-content: space-between;
        align-items: center;
        background: rgba(255,255,255,0.08);
        border-radius: 8px; padding: 10px 12px;
        margin-bottom: 8px;
        border: 1px solid rgba(255,255,255,0.08);
    }
    .report-card-metric-label { font-size: 11px; color: #bfdbfe; }
    .report-card-metric-val { font-size: 14px; font-weight: 700; }
    .positive { color: #4ade80; }
    .negative { color: #f87171; }
    .neutral  { color: #cbd5e1; }

    /* Pivot Table */
    .table-wrapper { overflow-x: auto; }
    .premium-table {
        width: 100%; border-collapse: collapse;
        font-size: 12px; text-align: left;
    }
    .premium-table th {
        background-color: #0b132b; color: #ffffff;
        font-weight: 600; padding: 10px 12px;
        text-align: right; border: 1px solid #1e293b;
    }
    .premium-table th:first-child { text-align: left; }
    .premium-table td {
        padding: 8px 12px; border: 1px solid #e2e8f0;
        text-align: right; font-weight: 500; color: #334155;
    }
    .premium-table td:first-child { text-align: left; font-weight: 600; color: #0f172a; }
    .premium-table tr:nth-child(even) { background-color: #f8fafc; }
    .premium-table tr:hover { background-color: #f1f5f9; }
    .premium-table tr.total-row td {
        font-weight: 700; background-color: #f1f5f9;
        border-top: 2px solid #0052cc;
        border-bottom: 2px solid #0052cc; color: #0f172a;
    }
    .val-positive { color: #009b4d !important; font-weight: 700; }
    .val-negative { color: #dc2626 !important; font-weight: 700; }
    .val-neutral  { color: #64748b !important; }

    .section-title {
        font-size: 13px; font-weight: 700;
        color: #0f172a; margin: 10px 0 8px 0;
        border-left: 4px solid #0052cc;
        padding-left: 8px;
    }
</style>
""", unsafe_allow_html=True)

# ── 3. Data Loading ──────────────────────────────────────────────────────────
@st.cache_data
def load_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_dir, "data", "report_fornecedor_sintetico.csv")
    
    if not os.path.exists(csv_path):
        # Fallback local path
        csv_path = "report_fornecedor_sintetico.csv"

    df = pd.read_csv(csv_path, sep=";", encoding="utf-8")
    df["Year"] = df["AnoMes"].apply(lambda x: int(str(x).split("-")[0]))
    df["Month_Num"] = df["AnoMes"].apply(lambda x: int(str(x).split("-")[1]))
    df["Valor Liquido"] = pd.to_numeric(df["Valor Liquido"].astype(str).str.replace(",", "."), errors="coerce")
    df["Quantidade"] = pd.to_numeric(df["Quantidade"], errors="coerce")
    return df

df_base = load_data()

month_map = {
    1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
    7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
}
full_month_name = {
    1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
    7: 'Julho', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
}

max_base_month = int(df_base[df_base["Year"] == 2026]["Month_Num"].max()) if (df_base["Year"] == 2026).any() else 8
max_base_month_lbl = month_map.get(max_base_month, "Ago")

# ── 4. Header Banner ─────────────────────────────────────────────────────────
st.markdown("""
<div style="background: linear-gradient(135deg, #0b132b 0%, #1e3a8a 60%, #0284c7 100%); border-radius: 16px; padding: 18px 24px; color: white; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
    <div>
        <h1 style="font-size: 20px; font-weight: 800; margin: 0 0 4px 0; color: white;">📊 Relatório Comercial Mensal — Nexus Varejo B2B</h1>
        <p style="font-size: 12px; margin: 0; color: #93c5fd;">Evolução Mensal de Vendas por Fornecedor: Faturamento (VALOR) e Volume (UNIDADES)</p>
    </div>
    <div style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: white;">
        Base Sintética 2024–2026
    </div>
</div>
""", unsafe_allow_html=True)

# ── 5. Filters ───────────────────────────────────────────────────────────────
with st.container(border=True):
    st.markdown('<div class="section-title">🔍 Filtros de Análise</div>', unsafe_allow_html=True)
    f_col1, f_col2 = st.columns(2)
    
    laboratorios = sorted(df_base["Laboratorio"].unique())
    canais = sorted(df_base["Canaldet"].unique())

    with f_col1:
        selected_labs = st.multiselect(
            "Indústria / Fornecedor",
            options=laboratorios,
            default=["UNILEVER BRASIL B2B"] if "UNILEVER BRASIL B2B" in laboratorios else None
        )
    with f_col2:
        selected_canals = st.multiselect(
            "Canal de Venda",
            options=canais,
            default=None
        )

df_filtered = df_base.copy()
if selected_labs:
    df_filtered = df_filtered[df_filtered["Laboratorio"].isin(selected_labs)]
if selected_canals:
    df_filtered = df_filtered[df_filtered["Canaldet"].isin(selected_canals)]

# ── 6. KPI Calculations ──────────────────────────────────────────────────────
current_month_2026 = max_base_month
current_month_lbl = max_base_month_lbl

df_fat_2026_ytd = df_filtered[(df_filtered["Year"] == 2026) & (df_filtered["Month_Num"] <= current_month_2026)]
faturamento_filtrado_2026 = df_fat_2026_ytd["Valor Liquido"].sum()

df_rede_2026 = df_base[df_base["Year"] == 2026].copy()
if selected_canals:
    df_rede_2026 = df_rede_2026[df_rede_2026["Canaldet"].isin(selected_canals)]
faturamento_rede_2026 = df_rede_2026["Valor Liquido"].sum()

participacao_2026 = (faturamento_filtrado_2026 / faturamento_rede_2026) if faturamento_rede_2026 > 0 else 0.0

kpi_col1, kpi_col2, kpi_col3 = st.columns(3)

with kpi_col1:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Faturamento Filtrado (2026)</div>
        <div class="metric-value">R$ {faturamento_filtrado_2026:,.2f}</div>
        <div class="metric-sub">Acumulado Jan–{current_month_lbl}/26</div>
    </div>
    """, unsafe_allow_html=True)

with kpi_col2:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Faturamento REDE (2026)</div>
        <div class="metric-value">R$ {faturamento_rede_2026:,.2f}</div>
        <div class="metric-sub">Acumulado até {current_month_lbl}/26</div>
    </div>
    """, unsafe_allow_html=True)

with kpi_col3:
    st.markdown(f"""
    <div class="metric-card">
        <div class="metric-title">Participação na REDE (2026)</div>
        <div class="metric-value">{participacao_2026*100:.1f}%</div>
        <div class="metric-sub">Share Relativo em 2026</div>
    </div>
    """, unsafe_allow_html=True)

# ── 7. Pivot Data Calculation ────────────────────────────────────────────────
def calculate_pivot_data(df_sel, value_col):
    pivot = df_sel.pivot_table(
        index="Month_Num",
        columns="Year",
        values=value_col,
        aggfunc="sum"
    ).reindex(range(1, 13))

    for yr in [2024, 2025, 2026]:
        if yr not in pivot.columns:
            pivot[yr] = 0.0

    pivot = pivot[[2024, 2025, 2026]].fillna(0.0)
    ytd_data = pivot.loc[1:current_month_2026].sum()
    total_data = pivot.sum()
    pivot.index = [month_map[m] for m in pivot.index]

    # % MoM 25
    mom_25, prev_val = [], None
    for val in pivot[2025]:
        if prev_val is None or prev_val == 0:
            mom_25.append(np.nan)
        else:
            mom_25.append((val - prev_val) / prev_val)
        prev_val = val
    pivot["% MoM 25"] = mom_25

    # % YoY 25x24
    pivot["% YoY 25x24"] = (pivot[2025] - pivot[2024]) / pivot[2024]
    pivot["% YoY 25x24"] = pivot["% YoY 25x24"].replace([np.inf, -np.inf], np.nan)

    # % YoY 26x25
    pivot["% YoY 26x25"] = (pivot[2026] - pivot[2025]) / pivot[2025]
    pivot["% YoY 26x25"] = pivot["% YoY 26x25"].replace([np.inf, -np.inf], np.nan)
    pivot.loc[pivot[2026] == 0, "% YoY 26x25"] = np.nan

    ytd_yoy_25_24 = (ytd_data[2025] - ytd_data[2024]) / ytd_data[2024] if ytd_data[2024] > 0 else np.nan
    ytd_yoy_26_25 = (ytd_data[2026] - ytd_data[2025]) / ytd_data[2025] if ytd_data[2025] > 0 else np.nan
    tot_yoy_25_24 = (total_data[2025] - total_data[2024]) / total_data[2024] if total_data[2024] > 0 else np.nan
    tot_yoy_26_25 = (total_data[2026] - total_data[2025]) / total_data[2025] if total_data[2025] > 0 else np.nan

    df_result = pivot.copy()
    df_result.loc["YTD"] = [ytd_data[2024], ytd_data[2025], ytd_data[2026], np.nan, ytd_yoy_25_24, ytd_yoy_26_25]
    df_result.loc["Total"] = [total_data[2024], total_data[2025], total_data[2026], np.nan, tot_yoy_25_24, tot_yoy_26_25]
    return df_result

df_valor_pivot = calculate_pivot_data(df_filtered, "Valor Liquido")
df_volume_pivot = calculate_pivot_data(df_filtered, "Quantidade")

# ── 8. Table & Chart Generators ──────────────────────────────────────────────
def generate_html_table(df_pivot, is_currency=True):
    html = '<div class="table-wrapper"><table class="premium-table">'
    html += '<thead><tr><th>Mês</th><th>2024</th><th>2025</th><th>2026</th><th>% MoM 25</th><th>% YoY 25x24</th><th>% YoY 26x25</th></tr></thead><tbody>'

    for r_lbl, row in df_pivot.iterrows():
        is_summary = r_lbl in ["YTD", "Total"]
        row_class = ' class="total-row"' if is_summary else ""
        html += f'<tr{row_class}><td>{r_lbl}</td>'

        for year in [2024, 2025, 2026]:
            val = row[year]
            if is_currency:
                fmt = f"R$ {val:,.2f}" if val != 0 else "-"
            else:
                fmt = f"{int(val):,}" if val != 0 else "-"
            html += f'<td>{fmt}</td>'

        for col in ["% MoM 25", "% YoY 25x24", "% YoY 26x25"]:
            val = row[col]
            if pd.isna(val):
                html += '<td>-</td>'
            else:
                pct = val * 100
                cls = "val-positive" if pct > 0 else ("val-negative" if pct < 0 else "val-neutral")
                sign = "+" if pct > 0 else ""
                html += f'<td class="{cls}">{sign}{pct:.1f}%</td>'
        html += '</tr>'

    html += '</tbody></table></div>'
    return html

def generate_plotly_chart(df_pivot, title, is_currency=True):
    df_monthly = df_pivot.drop(["YTD", "Total"])
    months = df_monthly.index.tolist()
    fig = make_subplots(specs=[[{"secondary_y": True}]])

    colors = {2024: '#0b132b', 2025: '#ff9326', 2026: '#009b4d'}

    for yr in [2024, 2025, 2026]:
        y_vals = df_monthly[yr]
        fig.add_trace(
            go.Bar(x=months, y=y_vals, name=str(yr), marker_color=colors[yr]),
            secondary_y=False
        )

    for pct_col, color in [('% YoY 25x24', '#ef4444'), ('% YoY 26x25', '#0284c7')]:
        fig.add_trace(
            go.Scatter(
                x=months, y=df_monthly[pct_col], name=pct_col,
                mode='lines+markers', line=dict(color=color, width=2.5),
                marker=dict(size=6)
            ),
            secondary_y=True
        )

    fig.update_layout(
        title=dict(text=title, font=dict(size=14, color='#0f172a')),
        barmode='group', hovermode='x unified',
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5),
        margin=dict(t=60, b=30, l=30, r=30),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    fig.update_yaxes(title_text="Faturamento (R$)" if is_currency else "Volume (un)", secondary_y=False, showgrid=True, gridcolor='#f1f5f9')
    fig.update_yaxes(title_text="Crescimento YoY (%)", secondary_y=True, showgrid=False, tickformat='.0%')
    return fig

def build_report_card(df_pivot, is_currency=True):
    df_monthly = df_pivot.drop(["YTD", "Total"])
    has_2026 = df_monthly[df_monthly[2026] > 0]
    if has_2026.empty:
        return ""
    
    last_month_lbl = has_2026.index[-1]
    last_pos = df_monthly.index.get_loc(last_month_lbl)
    val_curr = df_monthly.iloc[last_pos][2026]
    val_prev = df_monthly.iloc[last_pos - 1][2026] if last_pos > 0 else 0
    mom = (val_curr - val_prev) / val_prev if val_prev > 0 else 0
    yoy = df_monthly.iloc[last_pos]["% YoY 26x25"]

    val_fmt = f"R$ {val_curr:,.2f}" if is_currency else f"{int(val_curr):,} un"
    label = "Faturamento" if is_currency else "Volume"

    return f"""
    <div class="report-card">
        <div class="report-card-title">📅 Report do Mês — {last_month_lbl}/26</div>
        <div class="report-card-label">{label} Mensal</div>
        <div class="report-card-value">{val_fmt}</div>
        <div class="report-card-metric">
            <span class="report-card-metric-label">% MoM mês atual s/ mês ant.</span>
            <span class="report-card-metric-val {'positive' if mom >= 0 else 'negative'}">{mom*100:+.1f}%</span>
        </div>
        <div class="report-card-metric">
            <span class="report-card-metric-label">% YoY 26x25</span>
            <span class="report-card-metric-val {'positive' if yoy >= 0 else 'negative'}">{yoy*100:+.1f}%</span>
        </div>
    </div>
    """

# ── 9. Tabs ──────────────────────────────────────────────────────────────────
tab_valor, tab_volume, tab_historico = st.tabs([
    "💰 Evolução Faturamento (R$)",
    "📦 Evolução Volume (Unidades)",
    "📋 Histórico Linear (Base)"
])

with tab_valor:
    with st.container(border=True):
        col_c, col_r = st.columns([7, 3])
        with col_c:
            st.markdown('<div class="section-title">Gráfico Evolutivo — Faturamento vs Crescimento</div>', unsafe_allow_html=True)
            fig_v = generate_plotly_chart(df_valor_pivot, "Evolução Mensal — Faturamento (R$)", is_currency=True)
            st.plotly_chart(fig_v, use_container_width=True)
        with col_r:
            st.markdown(build_report_card(df_valor_pivot, is_currency=True), unsafe_allow_html=True)

    with st.container(border=True):
        st.markdown('<div class="section-title">Tabela Pivot de Faturamento (R$)</div>', unsafe_allow_html=True)
        st.markdown(generate_html_table(df_valor_pivot, is_currency=True), unsafe_allow_html=True)

with tab_volume:
    with st.container(border=True):
        col_c2, col_r2 = st.columns([7, 3])
        with col_c2:
            st.markdown('<div class="section-title">Gráfico Evolutivo — Volume vs Crescimento</div>', unsafe_allow_html=True)
            fig_q = generate_plotly_chart(df_volume_pivot, "Evolução Mensal — Volume (Unidades)", is_currency=False)
            st.plotly_chart(fig_q, use_container_width=True)
        with col_r2:
            st.markdown(build_report_card(df_volume_pivot, is_currency=False), unsafe_allow_html=True)

    with st.container(border=True):
        st.markdown('<div class="section-title">Tabela Pivot de Volume (Unidades)</div>', unsafe_allow_html=True)
        st.markdown(generate_html_table(df_volume_pivot, is_currency=False), unsafe_allow_html=True)

with tab_historico:
    st.markdown('<div class="section-title">Histórico Linear Agrupado por Ano/Mês</div>', unsafe_allow_html=True)
    linear_hist = df_filtered.groupby("AnoMes").agg(
        VALOR=("Valor Liquido", "sum"),
        VOLUME=("Quantidade", "sum")
    ).reset_index()
    linear_hist["VALOR"] = linear_hist["VALOR"].apply(lambda v: f"R$ {v:,.2f}")
    linear_hist["VOLUME"] = linear_hist["VOLUME"].apply(lambda q: f"{int(q):,}")
    st.dataframe(linear_hist, use_container_width=True, hide_index=True)

