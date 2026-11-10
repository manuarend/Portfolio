# 📋 Report Comercial de Fornecedor & Scorecard de Suprimentos

Este projeto implementa um **Scorecard de Fornecedores e Gestão Comercial de Suprimentos** utilizando **SQL e Python**. A ferramenta avalia o desempenho de entrega, pontualidade, qualidade e conformidade física das compras industriais realizadas junto aos grandes fornecedores do polo Sudeste (**Espírito Santo, Rio de Janeiro e São Paulo**).

---

## 🔒 Diretrizes de Anonimização e Sigilo de Dados
> [!NOTE]
> - **Valores e Quantidades:** Todos os dados transacionais de compras foram gerados aleatoriamente com propósitos ilustrativos de metodologia. Valores totais de pedidos de compra estão compreendidos entre **R$ 1.000,00 e R$ 10.000,00**, e volumes de lotes entre **1 e 50 unidades/lotes**.
> - **Nenhum Dado Real:** Não há vínculo com custos, volumes ou transações reais praticadas com qualquer fornecedor ou com a empresa.
> - **Indústrias:** Nomes de indústrias consolidadas (ex.: ArcelorMittal, Gerdau, Vale, Suzano, Petrobras, Ambev, CSN, Braskem) foram mantidos apenas como contexto do ecossistema industrial de ES, RJ e SP, com métricas 100% fictícias.

---

## 🎯 Desafio de Negócio
A gestão estratégica de compras e suprimentos (*Strategic Sourcing*) necessita de visibilidade contínua sobre a performance dos fornecedores para:
1. **Garantir a Pontualidade e Completude das Entregas (OTIF):** Evitar paralisações nas operações e fábricas causadas por atrasos ou entregas parciais de lotes.
2. **Controlar Avarias e Não Conformidades:** Identificar fornecedores com índices elevados de devolução ou avaria de mercadorias no recebimento.
3. **Qualificar Fornecedores com Base em Fatos:** Apoiar rodadas de negociação de preços com relatórios objetivos de histórico de entrega e cumprimento de SLA.

---

## 📊 Arquitetura de Dados

O dataset sintético está em [`data/report_fornecedor_sintetico.csv`](data/report_fornecedor_sintetico.csv):

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `id_pedido` | String | Identificador da Ordem de Compra (OC) | `OC-00025` |
| `data_emissao` | Date | Data de abertura do pedido | `2026-05-14` |
| `fornecedor` | String | Razão social / Nome do parceiro industrial | `ArcelorMittal Brasil` |
| `linha_fornecimento` | String | Categoria de produto fornecido | `Aços Longos e Perfis` |
| `cidade_origem` / `uf_origem` | String | Polo de fabricação (`ES`, `RJ`, `SP`) | `Serra` / `ES` |
| `cidade_destino` / `uf_destino` | String | Centro de distribuição de entrega | `Vitória` / `ES` |
| `volume_lotes_un` | Inteiro | Volume de caixas/lotes (1 a 50) | `32` |
| `valor_compras_brl` | Decimal | Valor total do pedido faturado (R$) | `R$ 7.420,00` |
| `prazo_acordado_dias` | Inteiro | Lead time contratado (dias) | `15` |
| `prazo_real_dias` | Inteiro | Lead time efetivo da entrega (dias) | `14` |
| `status_pontualidade` | String | Status da entrega | `No Prazo`, `Antecipado`, `Atrasado`|
| `conforme_in_full_pct` | Decimal | % de itens entregues sem faltas | `100.0%` |
| `indicador_otif` | Inteiro | 1 se On-Time AND In-Full; 0 caso contrário | `1` |
| `taxa_avarias_pct` | Decimal | % de avarias identificadas no recebimento | `0.45%` |
| `classificacao_abc` | String | Relevância financeira do pedido (`A`, `B`, `C`)| `A` |

---

## 📈 Indicadores Principais (KPIs)
- **OTIF (On-Time In-Full):** Percentual de entregas realizadas rigorosamente no prazo contratual E com quantidade 100% conforme.
  $$\text{OTIF} = \left(\frac{\text{Entregas no Prazo e Conformes}}{\text{Total de Entregas}}\right) \times 100$$
- **On-Time Rate (%):** Índice de pontualidade independentemente do volume entregue.
- **In-Full Rate (%):** Índice de completude do pedido (sem rupturas ou entregas parciais).
- **Lead Time Médio (dias):** Tempo médio entre emissão da OC e recebimento físico no armazém.
- **Taxa Média de Avarias (%):** Percentual de avarias sobre os volumes recebidos.

---

## 💻 Códigos & Consultas Analíticas
- **Script SQL Completo:** Veja [`scripts/scorecard_fornecedores.sql`](scripts/scorecard_fornecedores.sql) com consultas de agrupamento, cálculo de OTIF e segmentação por Curva ABC com funções analíticas de janela (`OVER`).
- **Script Executivo em Python:**
  ```bash
  cd 04-report-comercial-fornecedor/scripts
  python analise_fornecedores.py
  ```

---

## 💡 Insights e Ações Recomendadas
- **Renegociação de SLAs:** Fornecedores com OTIF abaixo de 75% devem ter seus prazos de lead time repensados para evitar falta de material no estoque.
- **Consolidação de Pedidos por Polo:** Aproveitar a proximidade geográfica de polos industriais (como Vitória/Serra no ES e Volta Redonda no RJ) para consolidar fretes e reduzir custos logísticos de recebimento.

