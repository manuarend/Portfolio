-- =============================================================================
-- PROJETO: Relatório Comercial Mensal de Fornecedores & Scorecard de Vendas
-- AUTORA: Manuela Arend
-- OBJETIVO: Consultas analíticas para apuração de faturamento (VALOR), volumetria (VOLUME),
--           comparações trienais (2024 x 2025 x 2026), variações YoY/MoM, YTD e Curva ABC.
-- REGRAS: Dados 100% sintéticos | Valores entre R$ 1.000 e R$ 10.000 | Cobertura ES, RJ, SP
-- =============================================================================

-- 1. Pivot Mensal Trienal de Faturamento por Fornecedor (2024, 2025 e 2026)
WITH cte_vendas_ano AS (
    SELECT 
        Laboratorio AS fornecedor,
        SUBSTR(AnoMes, 6, 2) AS mes,
        SUBSTR(AnoMes, 1, 4) AS ano,
        SUM(`Valor Liquido`) AS faturamento_liquido
    FROM tb_report_fornecedor
    GROUP BY Laboratorio, SUBSTR(AnoMes, 6, 2), SUBSTR(AnoMes, 1, 4)
)
SELECT 
    fornecedor,
    mes,
    ROUND(SUM(CASE WHEN ano = '2024' THEN faturamento_liquido ELSE 0 END), 2) AS fat_2024,
    ROUND(SUM(CASE WHEN ano = '2025' THEN faturamento_liquido ELSE 0 END), 2) AS fat_2025,
    ROUND(SUM(CASE WHEN ano = '2026' THEN faturamento_liquido ELSE 0 END), 2) AS fat_2026,
    -- Crescimento YoY 25x24 (%)
    ROUND(
        (SUM(CASE WHEN ano = '2025' THEN faturamento_liquido ELSE 0 END) - 
         SUM(CASE WHEN ano = '2024' THEN faturamento_liquido ELSE 0 END)) * 100.0 /
        NULLIF(SUM(CASE WHEN ano = '2024' THEN faturamento_liquido ELSE 0 END), 0), 1
    ) AS yoy_25x24_pct,
    -- Crescimento YoY 26x25 (%)
    ROUND(
        (SUM(CASE WHEN ano = '2026' THEN faturamento_liquido ELSE 0 END) - 
         SUM(CASE WHEN ano = '2025' THEN faturamento_liquido ELSE 0 END)) * 100.0 /
        NULLIF(SUM(CASE WHEN ano = '2025' THEN faturamento_liquido ELSE 0 END), 0), 1
    ) AS yoy_26x25_pct
FROM cte_vendas_ano
GROUP BY fornecedor, mes
ORDER BY fornecedor, mes;

-- 2. Apuração de YTD (Year-to-Date: Jan a Ago) e Aceleração Comercial
WITH cte_ytd AS (
    SELECT 
        Laboratorio AS fornecedor,
        SUBSTR(AnoMes, 1, 4) AS ano,
        SUM(`Valor Liquido`) AS faturamento_ytd,
        SUM(Quantidade) AS volume_ytd
    FROM tb_report_fornecedor
    WHERE CAST(SUBSTR(AnoMes, 6, 2) AS INTEGER) <= 8
    GROUP BY Laboratorio, SUBSTR(AnoMes, 1, 4)
)
SELECT 
    fornecedor,
    ROUND(SUM(CASE WHEN ano = '2024' THEN faturamento_ytd ELSE 0 END), 2) AS ytd_fat_2024,
    ROUND(SUM(CASE WHEN ano = '2025' THEN faturamento_ytd ELSE 0 END), 2) AS ytd_fat_2025,
    ROUND(SUM(CASE WHEN ano = '2026' THEN faturamento_ytd ELSE 0 END), 2) AS ytd_fat_2026,
    -- Aceleração YTD 26x25
    ROUND(
        (SUM(CASE WHEN ano = '2026' THEN faturamento_ytd ELSE 0 END) - 
         SUM(CASE WHEN ano = '2025' THEN faturamento_ytd ELSE 0 END)) * 100.0 /
        NULLIF(SUM(CASE WHEN ano = '2025' THEN faturamento_ytd ELSE 0 END), 0), 1
    ) AS ytd_crescimento_yoy_pct,
    -- Volumetria
    SUM(CASE WHEN ano = '2026' THEN volume_ytd ELSE 0 END) AS ytd_volume_2026_un
FROM cte_ytd
GROUP BY fornecedor
ORDER BY ytd_fat_2026 DESC;

-- 3. Segmentação de Produtos por Curva ABC de Faturamento
WITH cte_produtos_acumulado AS (
    SELECT 
        Desc_Produto AS produto,
        Laboratorio AS fornecedor,
        SUM(`Valor Liquido`) AS faturamento_total,
        SUM(Quantidade) AS volume_total
    FROM tb_report_fornecedor
    GROUP BY Desc_Produto, Laboratorio
),
cte_pareto AS (
    SELECT 
        produto,
        fornecedor,
        faturamento_total,
        volume_total,
        SUM(faturamento_total) OVER (ORDER BY faturamento_total DESC) AS fat_acumulado,
        SUM(faturamento_total) OVER () AS fat_global
    FROM cte_produtos_acumulado
)
SELECT 
    produto,
    fornecedor,
    ROUND(faturamento_total, 2) AS faturamento_total_brl,
    volume_total AS volume_total_un,
    ROUND((faturamento_total / fat_global) * 100.0, 2) AS share_pct,
    ROUND((fat_acumulado / fat_global) * 100.0, 2) AS acumulado_pct,
    CASE 
        WHEN (fat_acumulado / fat_global) <= 0.70 THEN 'Classe A (Alto Impacto)'
        WHEN (fat_acumulado / fat_global) <= 0.90 THEN 'Classe B (Intermediário)'
        ELSE 'Classe C (Cauda Longa)'
    END AS classificacao_abc
FROM cte_pareto
ORDER BY faturamento_total DESC;

-- 4. Distribuição por Canal Omnichannel e Representatividade
SELECT 
    Canaldet AS canal_venda,
    ROUND(SUM(`Valor Liquido`), 2) AS faturamento_total_brl,
    SUM(Quantidade) AS volume_total_un,
    ROUND(SUM(`Valor Liquido`) * 100.0 / SUM(SUM(`Valor Liquido`)) OVER(), 1) AS share_canal_pct
FROM tb_report_fornecedor
WHERE SUBSTR(AnoMes, 1, 4) = '2026'
GROUP BY Canaldet
ORDER BY faturamento_total_brl DESC;
