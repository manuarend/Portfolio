"""
=============================================================================
PROJETO: Painel de Competitividade Comercial & Elasticidade de Preço
AUTORA: Manuela Arend
REPOSITÓRIO: https://github.com/manuarend/Portfolio
DIRETRIZ DE SEGURANÇA: Dados 100% sintetizados e anonimizados (LGPD / Sigilo)
=============================================================================
"""

import csv
import os
from collections import defaultdict

def carregar_dados_competitividade(caminho_csv):
    """Lê a base sintética de inteligência competitiva."""
    registros = []
    with open(caminho_csv, mode="r", encoding="utf-8") as arq:
        leitor = csv.DictReader(arq)
        for linha in leitor:
            registros.append({
                "id_pesquisa": linha["id_pesquisa"],
                "sku": linha["sku"],
                "descricao_produto": linha["descricao_produto"],
                "categoria": linha["categoria"],
                "cidade_pesquisa": linha["cidade_pesquisa"],
                "uf_mercado": linha["uf_mercado"],
                "concorrente_benchmark": linha["concorrente_benchmark"],
                "preco_nosso_brl": float(linha["preco_nosso_brl"]),
                "preco_concorrente_brl": float(linha["preco_concorrente_brl"]),
                "custo_produto_brl": float(linha["custo_produto_brl"]),
                "indice_competitividade_pct": float(linha["indice_competitividade_pct"]),
                "margem_bruta_pct": float(linha["margem_bruta_pct"]),
                "volume_mensal_un": int(linha["volume_mensal_un"]),
                "posicionamento_estrategico": linha["posicionamento_estrategico"]
            })
    return registros

def consolidar_kpis(dados):
    """Calcula estatísticas gerais de competitividade."""
    total_itens = len(dados)
    price_index_medio = sum(r["indice_competitividade_pct"] for r in dados) / total_itens
    margem_media = sum(r["margem_bruta_pct"] for r in dados) / total_itens
    total_volume = sum(r["volume_mensal_un"] for r in dados)
    
    mais_baratos = sum(1 for r in dados if r["indice_competitividade_pct"] < 96.0)
    paridade = sum(1 for r in dados if 96.0 <= r["indice_competitividade_pct"] <= 104.0)
    mais_caros = sum(1 for r in dados if r["indice_competitividade_pct"] > 104.0)
    
    return {
        "price_index_medio": round(price_index_medio, 1),
        "margem_bruta_media": round(margem_media, 1),
        "volume_total_mensal": total_volume,
        "distribuicao": {
            "mais_baratos_pct": round((mais_baratos / total_itens) * 100, 1),
            "paridade_pct": round((paridade / total_itens) * 100, 1),
            "mais_caros_pct": round((mais_caros / total_itens) * 100, 1)
        }
    }

def analisar_por_categoria(dados):
    """Agrega competitividade e margem por categoria."""
    agrupado = defaultdict(lambda: {"indices": [], "margens": [], "volumes": []})
    for r in dados:
        cat = r["categoria"]
        agrupado[cat]["indices"].append(r["indice_competitividade_pct"])
        agrupado[cat]["margens"].append(r["margem_bruta_pct"])
        agrupado[cat]["volumes"].append(r["volume_mensal_un"])
        
    resultado = []
    for cat, vals in agrupado.items():
        idx_med = sum(vals["indices"]) / len(vals["indices"])
        mrg_med = sum(vals["margens"]) / len(vals["margens"])
        vol_tot = sum(vals["volumes"])
        resultado.append({
            "categoria": cat,
            "price_index_pct": round(idx_med, 1),
            "margem_bruta_pct": round(mrg_med, 1),
            "volume_total": vol_tot
        })
    return sorted(resultado, key=lambda x: x["price_index_pct"])

def analisar_por_estado(dados):
    """Compara o índice de competitividade regional (ES, RJ, SP)."""
    agrupado = defaultdict(lambda: {"indices": [], "margens": []})
    for r in dados:
        uf = r["uf_mercado"]
        agrupado[uf]["indices"].append(r["indice_competitividade_pct"])
        agrupado[uf]["margens"].append(r["margem_bruta_pct"])
        
    resultado = []
    for uf, vals in agrupado.items():
        resultado.append({
            "uf": uf,
            "price_index_medio": round(sum(vals["indices"]) / len(vals["indices"]), 1),
            "margem_bruta_media": round(sum(vals["margens"]) / len(vals["margens"]), 1)
        })
    return sorted(resultado, key=lambda x: x["uf"])

def exibir_relatorio(caminho_csv):
    print("=" * 85)
    print("🏷️  PAINEL DE COMPETITIVIDADE COMERCIAL & PRICE INDEX")
    print("Base: Dados sintéticos (Mercados ES/RJ/SP | Preços R$ 1.000 a R$ 10.000)")
    print("=" * 85)
    
    dados = carregar_dados_competitividade(caminho_csv)
    kpis = consolidar_kpis(dados)
    
    print("\n🎯 1. VISÃO EXECUTIVA DE PREÇO & MARGEM")
    print(f"  • Price Index Médio Geral:      {kpis['price_index_medio']}% (100% = Paridade exata)")
    print(f"  • Margem Bruta Média Ponderada: {kpis['margem_bruta_media']}%")
    print(f"  • Itens Mais Baratos que o Benchmark: {kpis['distribuicao']['mais_baratos_pct']}% do catálogo")
    print(f"  • Itens em Paridade (+/- 4%):          {kpis['distribuicao']['paridade_pct']}% do catálogo")
    print(f"  • Itens com Preço Acima (> 104%):      {kpis['distribuicao']['mais_caros_pct']}% do catálogo")
    
    print("\n📦 2. COMPETITIVIDADE POR CATEGORIA DE PRODUTO")
    print(f"{'Categoria':<32} | {'Price Index (%)':<16} | {'Margem Média (%)':<18} | {'Volume (un)'}")
    print("-" * 85)
    for c in analisar_por_categoria(dados):
        print(f"{c['categoria']:<32} | {c['price_index_pct']:>14.1f}% | {c['margem_bruta_pct']:>16.1f}% | {c['volume_total']} un.")
        
    print("\n🗺️  3. DISPERSÃO DE PREÇO POR ESTADO (ES / RJ / SP)")
    print(f"{'UF':<5} | {'Price Index Médio (%)':<24} | {'Margem Bruta Média (%)'}")
    print("-" * 55)
    for u in analisar_por_estado(dados):
        print(f"{u['uf']:<5} | {u['price_index_medio']:>22.1f}% | {u['margem_bruta_media']:>20.1f}%")

if __name__ == "__main__":
    diretorio_atual = os.path.dirname(os.path.abspath(__file__))
    caminho = os.path.join(diretorio_atual, "..", "data", "competitividade_comercial_sintetico.csv")
    exibir_relatorio(caminho)
