"""
=============================================================================
PROJETO: Report Comercial de Fornecedor & Scorecard de Suprimentos
AUTORA: Manuela Arend
REPOSITÓRIO: https://github.com/manuarend/Portfolio
DIRETRIZ DE SEGURANÇA: Dados 100% sintetizados e anonimizados (LGPD / Sigilo)
=============================================================================
"""

import csv
import os
from collections import defaultdict

def carregar_dados_fornecedores(caminho_csv):
    """Carrega dados da base sintética de compras e entregas."""
    registros = []
    with open(caminho_csv, mode="r", encoding="utf-8") as arq:
        leitor = csv.DictReader(arq)
        for linha in leitor:
            registros.append({
                "id_pedido": linha["id_pedido"],
                "data_emissao": linha["data_emissao"],
                "fornecedor": linha["fornecedor"],
                "linha_fornecimento": linha["linha_fornecimento"],
                "cidade_origem": linha["cidade_origem"],
                "uf_origem": linha["uf_origem"],
                "cidade_destino": linha["cidade_destino"],
                "uf_destino": linha["uf_destino"],
                "volume_lotes_un": int(linha["volume_lotes_un"]),
                "valor_compras_brl": float(linha["valor_compras_brl"]),
                "prazo_acordado_dias": int(linha["prazo_acordado_dias"]),
                "prazo_real_dias": int(linha["prazo_real_dias"]),
                "status_pontualidade": linha["status_pontualidade"],
                "conforme_in_full_pct": float(linha["conforme_in_full_pct"]),
                "indicador_otif": int(linha["indicador_otif"]),
                "taxa_avarias_pct": float(linha["taxa_avarias_pct"]),
                "classificacao_abc": linha["classificacao_abc"]
            })
    return registros

def calcular_scorecard(dados):
    """Agrega os indicadores de performance por fornecedor."""
    scorecard = defaultdict(lambda: {
        "pedidos": 0, "volume": 0, "valor_total": 0.0,
        "on_time": 0, "conforme_sum": 0.0, "otif": 0,
        "avarias_sum": 0.0, "prazos": [], "uf": ""
    })
    
    for r in dados:
        f = r["fornecedor"]
        scorecard[f]["pedidos"] += 1
        scorecard[f]["volume"] += r["volume_lotes_un"]
        scorecard[f]["valor_total"] += r["valor_compras_brl"]
        scorecard[f]["uf"] = r["uf_origem"]
        if r["status_pontualidade"] in ("No Prazo", "Antecipado"):
            scorecard[f]["on_time"] += 1
        scorecard[f]["conforme_sum"] += r["conforme_in_full_pct"]
        scorecard[f]["otif"] += r["indicador_otif"]
        scorecard[f]["avarias_sum"] += r["taxa_avarias_pct"]
        scorecard[f]["prazos"].append(r["prazo_real_dias"])
        
    resultado = []
    for f, vals in scorecard.items():
        n = vals["pedidos"]
        otif_pct = (vals["otif"] / n * 100) if n else 0
        on_time_pct = (vals["on_time"] / n * 100) if n else 0
        in_full_pct = (vals["conforme_sum"] / n) if n else 0
        avaria_med = (vals["avarias_sum"] / n) if n else 0
        lead_time = sum(vals["prazos"]) / len(vals["prazos"]) if vals["prazos"] else 0
        
        resultado.append({
            "fornecedor": f,
            "uf": vals["uf"],
            "total_pedidos": n,
            "volume_lotes": vals["volume"],
            "valor_compras_brl": round(vals["valor_total"], 2),
            "lead_time_medio": round(lead_time, 1),
            "on_time_pct": round(on_time_pct, 1),
            "in_full_pct": round(in_full_pct, 1),
            "otif_pct": round(otif_pct, 1),
            "avaria_media_pct": round(avaria_med, 2)
        })
    return sorted(resultado, key=lambda x: x["valor_compras_brl"], reverse=True)

def exibir_relatorio(caminho_csv):
    print("=" * 90)
    print("📋 REPORT COMERCIAL DE FORNECEDORES & INDICADORES DE SUPRIMENTOS (OTIF)")
    print("Base: Dados sintéticos (Indústrias de ES/RJ/SP | Compras R$ 1.000 a R$ 10.000)")
    print("=" * 90)
    
    dados = carregar_dados_fornecedores(caminho_csv)
    total_gasto = sum(r["valor_compras_brl"] for r in dados)
    total_pedidos = len(dados)
    otif_global = (sum(r["indicador_otif"] for r in dados) / total_pedidos * 100) if total_pedidos else 0
    avaria_global = sum(r["taxa_avarias_pct"] for r in dados) / total_pedidos if total_pedidos else 0
    
    print("\n📦 1. RESUMO CONSOLIDADO DE COMPRAS E NÍVEL DE SERVIÇO")
    print(f"  • Total Comprado (Gastos):     R$ {total_gasto:,.2f}")
    print(f"  • Pedidos de Compras Emitidos: {total_pedidos} ordens")
    print(f"  • Índice OTIF Consolidado:     {otif_global:.1f}%")
    print(f"  • Taxa Média de Avarias:       {avaria_global:.2f}%")
    
    print("\n🏢 2. SCORECARD DE FORNECEDORES (CLASSIFICAÇÃO DE GASTOS E SLA)")
    print(f"{'Fornecedor':<30} | {'UF':<3} | {'Compras (R$)':<13} | {'Lead Time':<9} | {'OTIF (%)':<9} | {'Avaria (%)'}")
    print("-" * 88)
    for s in calcular_scorecard(dados):
        print(f"{s['fornecedor']:<30} | {s['uf']:<3} | R$ {s['valor_compras_brl']:<10,.2f} | {s['lead_time_medio']:>7.1f} d | {s['otif_pct']:>7.1f}% | {s['avaria_media_pct']:>9.2f}%")

if __name__ == "__main__":
    diretorio_atual = os.path.dirname(os.path.abspath(__file__))
    caminho = os.path.join(diretorio_atual, "..", "data", "report_fornecedor_sintetico.csv")
    exibir_relatorio(caminho)

