# calculations.py - Módulo de Cálculos Estratégicos e Indicadores (KPIs)

import pandas as pd
import numpy as np

def calculate_competitor_average(row):
    """
    Calcula a média de preços da concorrência (Panvel e Raia),
    desconsiderando valores nulos, zerados ou menores que zero.
    """
    p = row.get('Preço Médio Panvel', 0.0)
    r = row.get('Preço Médio por Raia', 0.0)
    
    # Valida preços válidos
    prices = []
    if isinstance(p, (int, float)) and p > 0:
        prices.append(p)
    if isinstance(r, (int, float)) and r > 0:
        prices.append(r)
        
    if len(prices) > 0:
        return float(np.mean(prices))
    return np.nan

def compute_gap_percent(row):
    """
    Calcula o GAP % Médio entre o produto SJ e a concorrência.
    Utiliza a média dos GAPs informados da concorrência (Panvel e Raia) para garantir total
    consistência visual com as colunas GAP% Panvel e GAP% Raia.
    Caso os GAPs diretos não estejam disponíveis, calcula a partir do Preço Efetivo SJ
    (Preço Atual SJ se > 0 senão Preço Regular SJ) em relação à Média Concorrência.
    """
    p = row.get('GAP % Panvel', np.nan)
    r = row.get('GAP % Raia', np.nan)
    
    gaps = []
    if pd.notnull(p) and isinstance(p, (int, float)) and p != 0:
        gaps.append(float(p))
    if pd.notnull(r) and isinstance(r, (int, float)) and r != 0:
        gaps.append(float(r))
        
    if len(gaps) > 0:
        return float(np.mean(gaps))
        
    # Fallback caso não haja colunas de GAP pré-calculadas na planilha
    sj_reg = row.get('Preço Regular SJ', 0.0)
    sj_atu = row.get('Preço Atual SJ', 0.0)
    sj = sj_atu if (isinstance(sj_atu, (int, float)) and sj_atu > 0) else sj_reg
    avg = row.get('Média Concorrência', np.nan)
    
    if pd.isnull(avg) or pd.isnull(sj) or avg <= 0 or sj <= 0:
        return 0.0
        
    return (sj - avg) / avg

def classify_competitiveness(row):
    """
    Classifica o produto em um dos três status de competitividade baseados na coluna GAP % Médio:
    - Competitivo (Verde): GAP % Médio <= 0 (Preço igual ou abaixo da concorrência)
    - Oportunidade (Amarelo): 0 < GAP % Médio <= 0.025 (Preço até 2,5% acima do GAP Médio)
    - Alerta (Vermelho): GAP % Médio > 0.025 (Preço mais de 2,5% acima do GAP Médio)
    Retorna 'N/A' se não houver dados de concorrência válidos.
    """
    avg = row.get('Média Concorrência', np.nan)
    if pd.isnull(avg) or avg <= 0:
        return 'N/A'
        
    gap_medio = row.get('GAP % Real SJ', None)
    if gap_medio is None:
        gap_medio = compute_gap_percent(row)
        
    if gap_medio <= 0:
        return 'Competitivo'
    elif gap_medio <= 0.025:
        return 'Oportunidade'
    else:
        return 'Alerta'

def enrich_dataframe_with_kpis(df):
    """
    Enriquece o DataFrame principal adicionando colunas calculadas:
    - Média Concorrência
    - GAP % Real SJ (GAP % Médio)
    - Status_KPI
    """
    # Evita alterar o DataFrame original
    df_enriched = df.copy()
    
    # Aplica cálculo da média da concorrência
    df_enriched['Média Concorrência'] = df_enriched.apply(calculate_competitor_average, axis=1)
    
    # Aplica cálculo do Gap percentual calculado em tempo de execução
    df_enriched['GAP % Real SJ'] = df_enriched.apply(compute_gap_percent, axis=1)
    
    # Aplica classificação de competitividade
    df_enriched['Status_KPI'] = df_enriched.apply(classify_competitiveness, axis=1)
    
    return df_enriched

def get_kpi_summary(df):
    """
    Calcula os totais e percentuais consolidados para exibição nos cartões de KPI.
    Conta apenas registros que possuem concorrência válida (onde Status_KPI != 'N/A').
    """
    if 'Status_KPI' not in df.columns:
        df = enrich_dataframe_with_kpis(df)
        
    # Filtra apenas registros válidos com concorrência
    valid_df = df[df['Status_KPI'] != 'N/A']
    total_comp = len(valid_df)
    
    counts = valid_df['Status_KPI'].value_counts()
    
    alerta_qty = int(counts.get('Alerta', 0))
    oportunidade_qty = int(counts.get('Oportunidade', 0))
    competitivo_qty = int(counts.get('Competitivo', 0))
    
    alerta_pct = (alerta_qty / total_comp * 100) if total_comp > 0 else 0.0
    oportunidade_pct = (oportunidade_qty / total_comp * 100) if total_comp > 0 else 0.0
    competitivo_pct = (competitivo_qty / total_comp * 100) if total_comp > 0 else 0.0
    
    return {
        "total_concorrência": total_comp,
        "alerta_qty": alerta_qty,
        "alerta_pct": alerta_pct,
        "oportunidade_qty": oportunidade_qty,
        "oportunidade_pct": oportunidade_pct,
        "competitivo_qty": competitivo_qty,
        "competitivo_pct": competitivo_pct
    }
