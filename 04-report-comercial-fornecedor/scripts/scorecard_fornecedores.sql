-- =============================================================================
-- PROJETO: Report Comercial de Fornecedor & Scorecard de Suprimentos
-- AUTORA: Manuela Arend
-- OBJETIVO: Consultas analíticas para consolidação de compras, pontualidade (OTIF),
--           avarias e segmentação por Curva ABC de fornecedores industriais.
-- DIRETRIZ: Dados sintéticos | Fornecedores nos estados ES, RJ e SP
-- =============================================================================

-- 1. Scorecard Executivo por Fornecedor (Volume, Compras, OTIF e SLA de Entrega)
WITH cte_compras_fornecedor AS (
    SELECT 
        fornecedor,
        linha_fornecimento,
        uf_origem,
        COUNT(id_pedido) AS total_pedidos,
        SUM(volume_lotes_un) AS volume_total_lotes,
        SUM(valor_compras_brl) AS total_comprado_brl,
        AVG(prazo_real_dias) AS lead_time_medio_dias,
        -- % de Entregas No Prazo (On-Time)
        ROUND(SUM(CASE WHEN prazo_real_dias <= prazo_acordado_dias THEN 1 ELSE 0 END) * 100.0 / COUNT(id_pedido), 1) AS taxa_on_time_pct,
        -- % de Pedidos Conformes (In-Full)
        ROUND(AVG(conforme_in_full_pct), 1) AS taxa_in_full_pct,
        -- % de Sucesso OTIF (On-Time In-Full)
        ROUND(SUM(indicador_otif) * 100.0 / COUNT(id_pedido), 1) AS taxa_otif_global_pct,
        -- Taxa Média de Avarias/Devoluções
        ROUND(AVG(taxa_avarias_pct), 2) AS taxa_media_avarias_pct
    FROM tb_report_fornecedor
    GROUP BY fornecedor, linha_fornecimento, uf_origem
)
SELECT 
    fornecedor,
    linha_fornecimento,
    uf_origem,
    total_pedidos,
    volume_total_lotes,
    total_comprado_brl,
    ROUND(total_comprado_brl / total_pedidos, 2) AS ticket_medio_compra_brl,
    lead_time_medio_dias,
    taxa_on_time_pct,
    taxa_in_full_pct,
    taxa_otif_global_pct,
    taxa_media_avarias_pct,
    CASE 
        WHEN taxa_otif_global_pct >= 85.0 THEN 'Fornecedor Nível A (Homologado Excelente)'
        WHEN taxa_otif_global_pct >= 70.0 THEN 'Fornecedor Nível B (Operação Estável)'
        ELSE 'Fornecedor Nível C (Necessita Plano de Ação)'
    END AS classificacao_operacional
FROM cte_compras_fornecedor
ORDER BY total_comprado_brl DESC;

-- 2. Análise da Curva ABC de Gastos com Fornecedores
WITH cte_totais AS (
    SELECT 
        fornecedor,
        SUM(valor_compras_brl) AS gasto_total_fornecedor_brl
    FROM tb_report_fornecedor
    GROUP BY fornecedor
),
cte_acumulado AS (
    SELECT 
        fornecedor,
        gasto_total_fornecedor_brl,
        SUM(gasto_total_fornecedor_brl) OVER (ORDER BY gasto_total_fornecedor_brl DESC) AS gasto_acumulado_brl,
        SUM(gasto_total_fornecedor_brl) OVER () AS gasto_global_brl
    FROM cte_totais
)
SELECT 
    fornecedor,
    gasto_total_fornecedor_brl,
    ROUND((gasto_total_fornecedor_brl / gasto_global_brl) * 100.0, 2) AS representatividade_pct,
    ROUND((gasto_acumulado_brl / gasto_global_brl) * 100.0, 2) AS percentual_acumulado_pct,
    CASE 
        WHEN (gasto_acumulado_brl / gasto_global_brl) <= 0.70 THEN 'Curva A (Alta Relevância)'
        WHEN (gasto_acumulado_brl / gasto_global_brl) <= 0.90 THEN 'Curva B (Média Relevância)'
        ELSE 'Curva C (Cauda Longa)'
    END AS classificacao_curva_abc
FROM cte_acumulado
ORDER BY gasto_total_fornecedor_brl DESC;

