"""
=============================================================================
PROJETO: Relatório Comercial Mensal de Fornecedores & Scorecard de Vendas
AUTORA: Manuela Arend
REPOSITÓRIO: https://github.com/manuarend/Portfolio
DIRETRIZ DE SEGURANÇA: Dados 100% sintetizados e anonimizados (LGPD / Sigilo)
=============================================================================
"""

import csv
import os
from collections import defaultdict

def carregar_base_fornecedor(caminho_csv):
    """Carrega dados da base sintética de vendas e volumetria por fornecedor."""
    registros = []
    with open(caminho_csv, mode="r", encoding="utf-8") as arq:
        leitor = csv.DictReader(arq, delimiter=";")
        for linha in leitor:
            val_liq = float(linha["Valor Liquido"].replace(",", "."))
            qtd = int(linha["Quantidade"])
            anomes = linha["AnoMes"]
            ano, mes = anomes.split("-")
            
            registros.append({
                "produto_id": linha["Produto_ID"],
                "ean": linha["CODBARRAS"],
                "produto": linha["Desc_Produto"],
                "fornecedor_id": linha["Laboratorio_ID"],
                "fornecedor": linha["Laboratorio"],
                "anomes": anomes,
                "ano": int(ano),
                "mes": int(mes),
                "canal": linha["Canaldet"],
                "valor_liquido": val_liq,
                "quantidade": qtd
            })
    return registros

def consolidar_evolucao_trienal(dados):
    """Calcula a evolução de faturamento e volume por ano (2024, 2025, 2026)."""
    totais_ano = defaultdict(lambda: {"faturamento": 0.0, "volume": 0})
    for r in dados:
        totais_ano[r["ano"]]["faturamento"] += r["valor_liquido"]
        totais_ano[r["ano"]]["volume"] += r["quantidade"]
    return totais_ano

def calcular_ytd_fornecedor(dados, mes_corte=8):
    """Calcula indicadores de Year-to-Date (YTD) e crescimento por fornecedor."""
    scorecard = defaultdict(lambda: {
        "fat_2024": 0.0, "fat_2025": 0.0, "fat_2026": 0.0,
        "vol_2024": 0, "vol_2025": 0, "vol_2026": 0
    })

    for r in dados:
        if r["mes"] <= mes_corte:
            f = r["fornecedor"]
            ano = r["ano"]
            if ano == 2024:
                scorecard[f]["fat_2024"] += r["valor_liquido"]
                scorecard[f]["vol_2024"] += r["quantidade"]
            elif ano == 2025:
                scorecard[f]["fat_2025"] += r["valor_liquido"]
                scorecard[f]["vol_2025"] += r["quantidade"]
            elif ano == 2026:
                scorecard[f]["fat_2026"] += r["valor_liquido"]
                scorecard[f]["vol_2026"] += r["quantidade"]

    resultados = []
    for f, kpis in scorecard.items():
        yoy_25x24 = ((kpis["fat_2025"] - kpis["fat_2024"]) / kpis["fat_2024"] * 100) if kpis["fat_2024"] > 0 else 0.0
        yoy_26x25 = ((kpis["fat_2026"] - kpis["fat_2025"]) / kpis["fat_2025"] * 100) if kpis["fat_2025"] > 0 else 0.0

        resultados.append({
            "fornecedor": f,
            "ytd_fat_2024": kpis["fat_2024"],
            "ytd_fat_2025": kpis["fat_2025"],
            "ytd_fat_2026": kpis["fat_2026"],
            "yoy_25x24_pct": round(yoy_25x24, 1),
            "yoy_26x25_pct": round(yoy_26x25, 1),
            "ytd_vol_2026": kpis["vol_2026"]
        })

    return sorted(resultados, key=lambda x: x["ytd_fat_2026"], reverse=True)

def main():
    diretorio_atual = os.path.dirname(os.path.abspath(__file__))
    caminho_csv = os.path.join(diretorio_atual, "..", "data", "report_fornecedor_sintetico.csv")
    
    if not os.path.exists(caminho_csv):
        print(f"Arquivo CSV não encontrado em: {caminho_csv}")
        return

    dados = carregar_base_fornecedor(caminho_csv)
    print(f"Base carregada com sucesso: {len(dados)} registros analisados.\n")

    # Consolidação Trienal
    totais = consolidar_evolucao_trienal(dados)
    print("=" * 70)
    print("RESUMO TRIENAL DE VENDAS — REDE NEXUS B2B")
    print("=" * 70)
    for ano in sorted(totais.keys()):
        fat = totais[ano]["faturamento"]
        vol = totais[ano]["volume"]
        print(f"Ano {ano}: Faturamento = R$ {fat:,.2f} | Volume = {vol:,} un")
    print("-" * 70)

    # Scorecard YTD por Fornecedor
    ytd_fornecedores = calcular_ytd_fornecedor(dados, mes_corte=8)
    print("\n" + "=" * 70)
    print("DESEMPENHO YTD (JAN-AGO) POR FORNECEDOR / INDÚSTRIA")
    print("=" * 70)
    for f in ytd_fornecedores:
        print(f"Fornecedor: {f['fornecedor']}")
        print(f"  - YTD 2026: R$ {f['ytd_fat_2026']:,.2f} | Vol: {f['ytd_vol_2026']} un")
        print(f"  - Crescimento YoY 26x25: +{f['yoy_26x25_pct']}% | YoY 25x24: +{f['yoy_25x24_pct']}%")
        print("-" * 70)

if __name__ == "__main__":
    main()
