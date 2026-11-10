"""
=============================================================================
PROJETO: Joint Business Planning (JBP) - Análise de Acordos e Metas Comerciais
AUTORA: Manuela Arend
REPOSITÓRIO: https://github.com/manuarend/Portfolio
DIRETRIZ DE SEGURANÇA: Dados 100% sintetizados e anonimizados (LGPD / Sigilo)
=============================================================================
"""

import csv
import os
from collections import defaultdict

def carregar_dados_jbp(caminho_csv):
    """Carrega o arquivo CSV de acordos sintéticos de JBP."""
    registros = []
    with open(caminho_csv, mode="r", encoding="utf-8") as arquivo:
        leitor = csv.DictReader(arquivo)
        for linha in leitor:
            registros.append({
                "id_acordo": linha["id_acordo"],
                "mes_referencia": linha["mes_referencia"],
                "industria_parceira": linha["industria_parceira"],
                "categoria_foco": linha["categoria_foco"],
                "cidade_polo": linha["cidade_polo"],
                "uf_operacao": linha["uf_operacao"],
                "volume_planejado": int(linha["volume_planejado"]),
                "volume_realizado": int(linha["volume_realizado"]),
                "meta_faturamento": float(linha["meta_faturamento"]),
                "faturamento_realizado": float(linha["faturamento_realizado"]),
                "atingimento_pct": float(linha["atingimento_pct"]),
                "verba_cooperada": float(linha["verba_cooperada"]),
                "sla_entrega_pct": float(linha["sla_entrega_pct"]),
                "status_jbp": linha["status_jbp"]
            })
    return registros

def calcular_kpis_globais(dados):
    """Calcula os indicadores consolidados do plano de negócios."""
    total_meta = sum(r["meta_faturamento"] for r in dados)
    total_real = sum(r["faturamento_realizado"] for r in dados)
    total_verba = sum(r["verba_cooperada"] for r in dados)
    vol_planejado = sum(r["volume_planejado"] for r in dados)
    vol_realizado = sum(r["volume_realizado"] for r in dados)
    
    atingimento_global = (total_real / total_meta) * 100 if total_meta else 0
    atingimento_volume = (vol_realizado / vol_planejado) * 100 if vol_planejado else 0
    roi_verba = (total_real / total_verba) if total_verba else 0
    sla_medio = sum(r["sla_entrega_pct"] for r in dados) / len(dados) if dados else 0
    
    return {
        "total_meta_brl": round(total_meta, 2),
        "total_realizado_brl": round(total_real, 2),
        "atingimento_faturamento_pct": round(atingimento_global, 2),
        "total_vol_planejado": vol_planejado,
        "total_vol_realizado": vol_realizado,
        "atingimento_volume_pct": round(atingimento_volume, 2),
        "total_verba_investida_brl": round(total_verba, 2),
        "alavancagem_verba_ratio": round(roi_verba, 2),
        "sla_medio_logistica_pct": round(sla_medio, 2)
    }

def desempenho_por_industria(dados):
    """Consolida os resultados por indústria parceira."""
    agrupado = defaultdict(lambda: {"meta": 0.0, "real": 0.0, "verba": 0.0, "slas": [], "acordos": 0})
    for r in dados:
        ind = r["industria_parceira"]
        agrupado[ind]["meta"] += r["meta_faturamento"]
        agrupado[ind]["real"] += r["faturamento_realizado"]
        agrupado[ind]["verba"] += r["verba_cooperada"]
        agrupado[ind]["slas"].append(r["sla_entrega_pct"])
        agrupado[ind]["acordos"] += 1
        
    resultado = []
    for ind, vals in agrupado.items():
        ating = (vals["real"] / vals["meta"] * 100) if vals["meta"] else 0
        sla_med = sum(vals["slas"]) / len(vals["slas"])
        resultado.append({
            "industria": ind,
            "meta_brl": round(vals["meta"], 2),
            "real_brl": round(vals["real"], 2),
            "atingimento_pct": round(ating, 2),
            "sla_medio_pct": round(sla_med, 1),
            "status": "Destaque" if ating >= 100 else ("Acompanhar" if ating >= 95 else "Crítico")
        })
    return sorted(resultado, key=lambda x: x["atingimento_pct"], reverse=True)

def desempenho_por_regiao(dados):
    """Agrega o desempenho comercial nos polos ES, RJ e SP."""
    agrupado = defaultdict(lambda: {"meta": 0.0, "real": 0.0, "vol": 0})
    for r in dados:
        uf = r["uf_operacao"]
        agrupado[uf]["meta"] += r["meta_faturamento"]
        agrupado[uf]["real"] += r["faturamento_realizado"]
        agrupado[uf]["vol"] += r["volume_realizado"]
        
    resultado = []
    for uf, vals in agrupado.items():
        ating = (vals["real"] / vals["meta"] * 100) if vals["meta"] else 0
        resultado.append({
            "uf": uf,
            "meta_brl": round(vals["meta"], 2),
            "real_brl": round(vals["real"], 2),
            "volume_total": vals["vol"],
            "atingimento_pct": round(ating, 2)
        })
    return sorted(resultado, key=lambda x: x["atingimento_pct"], reverse=True)

def exibir_relatorio(caminho_csv):
    print("=" * 80)
    print("📊 RELATÓRIO EXECUTIVO - JOINT BUSINESS PLANNING (JBP)")
    print("Base: Dados sintéticos (Cidades ES/RJ/SP | Valores R$ 1.000 a R$ 10.000)")
    print("=" * 80)
    
    dados = carregar_dados_jbp(caminho_csv)
    kpis = calcular_kpis_globais(dados)
    
    print("\n📌 1. KPIS GLOBAIS DE EXECUÇÃO DO PLANO")
    print(f"  • Faturamento Planejado (Meta): R$ {kpis['total_meta_brl']:,.2f}")
    print(f"  • Faturamento Realizado:       R$ {kpis['total_realizado_brl']:,.2f}")
    print(f"  • Atingimento Financeiro:      {kpis['atingimento_faturamento_pct']}%")
    print(f"  • Volume (Plan vs Real):       {kpis['total_vol_planejado']} un. vs {kpis['total_vol_realizado']} un. ({kpis['atingimento_volume_pct']}%)")
    print(f"  • Verba Cooperada Investida:   R$ {kpis['total_verba_investida_brl']:,.2f}")
    print(f"  • Alavancagem da Verba (ROI):  {kpis['alavancagem_verba_ratio']}x")
    print(f"  • SLA Médio de Entrega:        {kpis['sla_medio_logistica_pct']}%")
    
    print("\n🏢 2. DESEMPENHO POR INDÚSTRIA PARCEIRA")
    print(f"{'Indústria':<16} | {'Meta (R$)':<12} | {'Real (R$)':<12} | {'Ating (%)':<10} | {'SLA (%)':<8} | {'Status'}")
    print("-" * 75)
    for row in desempenho_por_industria(dados):
        print(f"{row['industria']:<16} | R$ {row['meta_brl']:<9,.2f} | R$ {row['real_brl']:<9,.2f} | {row['atingimento_pct']:>8.1f}% | {row['sla_medio_pct']:>6.1f}% | {row['status']}")
        
    print("\n📍 3. DESEMPENHO REGIONAL (SUDESTE: ES / RJ / SP)")
    print(f"{'UF':<5} | {'Meta (R$)':<14} | {'Real (R$)':<14} | {'Ating (%)':<10} | {'Volume (un)'}")
    print("-" * 65)
    for reg in desempenho_por_regiao(dados):
        print(f"{reg['uf']:<5} | R$ {reg['meta_brl']:<11,.2f} | R$ {reg['real_brl']:<11,.2f} | {reg['atingimento_pct']:>8.1f}% | {reg['volume_total']} un.")

if __name__ == "__main__":
    diretorio_atual = os.path.dirname(os.path.abspath(__file__))
    caminho = os.path.join(diretorio_atual, "..", "data", "jbp_acordos_sintetico.csv")
    exibir_relatorio(caminho)

