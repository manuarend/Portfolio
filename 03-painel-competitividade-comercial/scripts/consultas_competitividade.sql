-- =============================================================================
-- PROJETO: Painel de Competitividade Comercial & Price Index
-- AUTORA: Manuela Arend
-- OBJETIVO: Consultas analíticas para monitoramento de competitividade de preços,
--           posicionamento relativo frente a concorrentes e impacto na margem.
-- DIRETRIZ: Dados sintéticos | Mercados ES, RJ e SP
-- =============================================================================

-- 1. Visão Geral: Cálculo do Price Index por Categoria e Posição de Mercado
WITH cte_competitividade AS (
    SELECT 
        sku,
        descricao_produto,
        categoria,
        uf_mercado,
        cidade_pesquisa,
        concorrente_benchmark,
        preco_nosso_brl,
        preco_concorrente_brl,
        custo_produto_brl,
        volume_mensal_un,
        -- Price Index: > 100 significa nosso preço superior ao concorrente
        ROUND((preco_nosso_brl / preco_concorrente_brl) * 100.0, 1) AS price_index_pct,
        -- Margem Bruta
        ROUND(((preco_nosso_brl - custo_produto_brl) / preco_nosso_brl) * 100.0, 1) AS margem_bruta_pct,
        -- Receita Potencial Mensal
        ROUND(preco_nosso_brl * volume_mensal_un, 2) AS receita_mensal_brl
    FROM tb_competitividade_pesquisa
)
SELECT 
    categoria,
    COUNT(DISTINCT sku) AS total_skus_monitorados,
    ROUND(AVG(price_index_pct), 1) AS price_index_medio_pct,
    ROUND(AVG(margem_bruta_pct), 1) AS margem_bruta_media_pct,
    SUM(volume_mensal_un) AS volume_total_vendido,
    SUM(receita_mensal_brl) AS receita_total_brl,
    CASE 
        WHEN AVG(price_index_pct) < 96.0 THEN 'Liderança por Preço Baixo'
        WHEN AVG(price_index_pct) BETWEEN 96.0 AND 104.0 THEN 'Paridade Competitiva'
        ELSE 'Prêmio de Marca / Risco de Fuga de Volume'
    END AS diagnostico_estrategico
FROM cte_competitividade
GROUP BY categoria
ORDER BY price_index_medio_pct ASC;

-- 2. Ranking Regional: Identificação dos SKUs Mais Desalinhados por Estado
WITH cte_dispersao_regional AS (
    SELECT 
        uf_mercado,
        sku,
        descricao_produto,
        concorrente_benchmark,
        preco_nosso_brl,
        preco_concorrente_brl,
        ROUND((preco_nosso_brl / preco_concorrente_brl) * 100.0, 1) AS price_index_pct,
        DENSE_RANK() OVER (
            PARTITION BY uf_mercado 
            ORDER BY (preco_nosso_brl / preco_concorrente_brl) DESC
        ) AS rank_maior_sobrepreco
    FROM tb_competitividade_pesquisa
)
SELECT 
    uf_mercado,
    rank_maior_sobrepreco,
    sku,
    descricao_produto,
    concorrente_benchmark,
    preco_nosso_brl,
    preco_concorrente_brl,
    price_index_pct
FROM cte_dispersao_regional
WHERE rank_maior_sobrepreco <= 3
ORDER BY uf_mercado, rank_maior_sobrepreco;

