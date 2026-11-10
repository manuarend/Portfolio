"""
=============================================================================
PROJETO: Campanha Digital Mensal - Acompanhamento de Desempenho das Filiais
AUTORA: Manuela Arend
REPOSITÓRIO: https://github.com/manuarend/Portfolio
DIRETRIZ DE SEGURANÇA: Dados 100% sintetizados e anonimizados (LGPD / Sigilo)
=============================================================================
"""

import csv
import os
from collections import defaultdict

def carregar_dados_campanha(caminho_csv):
    """Carrega os dados de campanhas digitais e vendas por filial."""
    registros = []
    with open(caminho_csv, mode="r", encoding="utf-8") as arq:
        leitor = csv.DictReader(arq)
        for linha in leitor:
            registros.append({
                "id_registro": linha["id_registro"],
                "data_registro": linha["data_registro"],
                "nome_campanha": linha["nome_campanha"],
                "filial": linha["filial"],
                "cidade": linha["cidade"],
                "uf": linha["uf"],
                "canal_digital": linha["canal_digital"],
                "leads_gerados": int(linha["leads_gerados"]),
                "pedidos_convertidos": int(linha["pedidos_convertidos"]),
                "taxa_conversao_pct": float(linha["taxa_conversao_pct"]),
                "investimento_midia_brl": float(linha["investimento_midia_brl"]),
                "faturamento_realizado_brl": float(linha["faturamento_realizado_brl"]),
                "meta_faturamento_brl": float(linha["meta_faturamento_brl"]),
                "atingimento_meta_pct": float(linha["atingimento_meta_pct"]),
                "ticket_medio_brl": float(linha["ticket_medio_brl"]),
                "roas_campanha": float(linha["roas_campanha"])
            })
    return registros

def consolidar_kpis_gerais(dados):
    """Calcula os KPIs consolidados da operação digital."""
    total_leads = sum(r["leads_gerados"] for r in dados)
    total_pedidos = sum(r["pedidos_convertidos"] for r in dados)
    total_investimento = sum(r["investimento_midia_brl"] for r in dados)
    total_faturamento = sum(r["faturamento_realizado"] if "faturamento_realizado" in r else r["faturamento_realizado_brl"] for r in dados)
    total_meta = sum(r["meta_faturamento_brl"] for r in dados)
    
    taxa_conversao_media = (total_pedidos / total_leads * 100) if total_leads else 0
    roas_geral = (total_faturamento / total_investimento) if total_investimento else 0
    ticket_medio_geral = (total_faturamento / total_pedidos) if total_pedidos else 0
    atingimento_geral = (total_faturamento / total_meta * 100) if total_meta else 0
    
    return {
        "total_leads": total_leads,
        "total_pedidos": total_pedidos,
        "taxa_conversao_media": round(taxa_conversao_media, 1),
        "total_investimento_brl": round(total_investimento, 2),
        "total_faturamento_brl": round(total_faturamento, 2),
        "atingimento_geral_pct": round(atingimento_geral, 1),
        "ticket_medio_brl": round(ticket_medio_geral, 2),
        "roas_geral": round(roas_geral, 2)
    }

def ranking_filiais(dados):
    """Gera ranking consolidado por filial."""
    filiais = defaultdict(lambda: {"faturamento": 0.0, "meta": 0.0, "pedidos": 0, "cidade": "", "uf": ""})
    for r in dados:
        nome = r["filial"]
        filiais[nome]["faturamento"] += r["faturamento_realizado_brl"]
        filiais[nome]["meta"] += r["meta_faturamento_brl"]
        filiais[nome]["pedidos"] += r["pedidos_convertidos"]
        filiais[nome]["cidade"] = r["cidade"]
        filiais[nome]["uf"] = r["uf"]
        
    resultado = []
    for nome, vals in filiais.items():
        ating = (vals["faturamento"] / vals["meta"] * 100) if vals["meta"] else 0
        resultado.append({
            "filial": nome,
            "cidade": vals["cidade"],
            "uf": vals["uf"],
            "faturamento_brl": round(vals["faturamento"], 2),
            "meta_brl": round(vals["meta"], 2),
            "pedidos": vals["pedidos"],
            "atingimento_pct": round(ating, 1)
        })
    return sorted(resultado, key=lambda x: x["atingimento_pct"], reverse=True)

def eficiencia_por_canal(dados):
    """Avalia o retorno e taxa de conversão por canal digital."""
    canais = defaultdict(lambda: {"leads": 0, "pedidos": 0, "investimento": 0.0, "faturamento": 0.0})
    for r in dados:
        c = r["canal_digital"]
        canais[c]["leads"] += r["leads_gerados"]
        canais[c]["pedidos"] += r["pedidos_convertidos"]
        canais[c]["investimento"] += r["investimento_midia_brl"]
        canais[c]["faturamento"] += r["faturamento_realizado_brl"]
        
    resultado = []
    for c, vals in canais.items():
        conv = (vals["pedidos"] / vals["leads"] * 100) if vals["leads"] else 0
        roas = (vals["faturamento"] / vals["investimento"]) if vals["investimento"] else 0
        resultado.append({
            "canal": c,
            "leads": vals["leads"],
            "pedidos": vals["pedidos"],
            "taxa_conversao_pct": round(conv, 1),
            "investimento_brl": round(vals["investimento"], 2),
            "faturamento_brl": round(vals["faturamento"], 2),
            "roas": round(roas, 2)
        })
    return sorted(resultado, key=lambda x: x["roas"], reverse=True)

def exibir_dashboard(caminho_csv):
    print("=" * 85)
    print("📱 RELATÓRIO DE DESEMPENHO: CAMPANHA DIGITAL MENSAL DAS FILIAIS")
    print("Base: Dados sintéticos (Filiais ES/RJ/SP | Valores R$ 1.000 a R$ 10.000)")
    print("=" * 85)
    
    dados = carregar_dados_campanha(caminho_csv)
    kpis = consolidar_kpis_gerais(dados)
    
    print("\n🎯 1. INDICADORES CONSOLIDADOS DA CAMPANHA")
    print(f"  • Faturamento Total Gerado:    R$ {kpis['total_faturamento_brl']:,.2f}")
    print(f"  • Atingimento de Meta Médio:   {kpis['atingimento_geral_pct']}%")
    print(f"  • Investimento Total em Mídia: R$ {kpis['total_investimento_brl']:,.2f}")
    print(f"  • ROAS Consolidado:            {kpis['roas_geral']}x de retorno")
    print(f"  • Volume Total de Pedidos:     {kpis['total_pedidos']} pedidos (de {kpis['total_leads']} leads)")
    print(f"  • Taxa de Conversão Média:     {kpis['taxa_conversao_media']}%")
    print(f"  • Ticket Médio:                R$ {kpis['ticket_medio_brl']:,.2f}")
    
    print("\n🏆 2. DESEMPENHO E EFICIÊNCIA POR CANAL DE AQUISIÇÃO")
    print(f"{'Canal Digital':<32} | {'Leads':<6} | {'Pedidos':<8} | {'Conv (%)':<9} | {'ROAS':<6} | {'Faturamento'}")
    print("-" * 85)
    for c in eficiencia_por_canal(dados):
        print(f"{c['canal']:<32} | {c['leads']:<6} | {c['pedidos']:<8} | {c['taxa_conversao_pct']:>6.1f}% | {c['roas']:>5.2f}x | R$ {c['faturamento_brl']:<10,.2f}")
        
    print("\n🏬 3. TOP FILIAIS POR ATINGIMENTO DE META")
    print(f"{'Filial':<32} | {'UF':<4} | {'Meta (R$)':<12} | {'Real (R$)':<12} | {'Ating (%)':<10} | {'Pedidos'}")
    print("-" * 85)
    for f in ranking_filiais(dados)[:6]:
        print(f"{f['filial']:<32} | {f['uf']:<4} | R$ {f['meta_brl']:<9,.2f} | R$ {f['faturamento_brl']:<9,.2f} | {f['atingimento_pct']:>8.1f}% | {f['pedidos']} un.")

if __name__ == "__main__":
    diretorio_atual = os.path.dirname(os.path.abspath(__file__))
    caminho = os.path.join(diretorio_atual, "..", "data", "campanha_digital_filiais_sintetico.csv")
    exibir_dashboard(caminho)
