# 🤝 Joint Business Planning (JBP) - Acompanhamento de Metas & Acordos Comerciais

Este projeto estrutura a gestão analítica do **Joint Business Plan (JBP)** — processo estratégico de planejamento colaborativo entre a distribuidora/comercializadora e as indústrias parceiras.

O objetivo é monitorar o cumprimento de acordos comerciais, entrega de volume, retorno de verbas cooperadas (marketing/incentivo) e o nível de serviço logístico (SLA), transformando dados operacionais em alavancas de negociação executiva.

---

## 🔒 Diretrizes de Anonimização e LGPD
> [!NOTE]
> - **Valores e Volumes:** Todos os dados foram gerados sinteticamente para fins de demonstração de capacidade analítica. Os volumes foram fixados no intervalo de **1 a 50 unidades/lotes** e os valores financeiros entre **R$ 1.000,00 e R$ 10.000,00**.
> - **Relação com Dados Reais:** Não há proporção, espelhamento ou conexão matemática com volumes ou faturamentos reais corporativos, garantindo total conformidade com boas práticas de segurança da informação.
> - **Geolocalização:** Foco exclusivo nas operações industriais dos estados de **Espírito Santo (ES)**, **Rio de Janeiro (RJ)** e **São Paulo (SP)**.
> - **Indústrias:** Os nomes de indústrias representam polos parceiros de mercado para contexto de negócio, mas todas as métricas são 100% ilustrativas.

---

## 🎯 Problema de Negócio
Em operações B2B de grande porte, a falta de visibilidade em tempo real sobre os acordos de JBP acarreta:
1. **Perda de bonificações e descontos contratuais:** Falhas na identificação precoce de metas de faturamento e volume em risco no final do ciclo.
2. **Subutilização ou desperdício de verba cooperada:** Dificuldade de mensurar o índice de alavancagem de vendas proporcionado pelos investimentos conjuntos.
3. **Desalinhamento entre vendas e logística:** Rupturas de estoque e descumprimento de SLAs contratuais, prejudicando a relação comercial.

---

## 📊 Arquitetura de Dados & Dicionário de Variáveis

O dataset está localizado em [`data/jbp_acordos_sintetico.csv`](data/jbp_acordos_sintetico.csv) e possui a seguinte estrutura:

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `id_acordo` | String | Identificador único do acordo de JBP | `JBP-0001` |
| `mes_referencia` | Date/String | Mês e ano da competência avaliada | `2026-03` |
| `industria_parceira` | String | Nome da indústria foco do plano | `ArcelorMittal`, `Suzano` |
| `categoria_foco` | String | Linha estratégica de produtos do acordo | `Aços e Perfis Estruturais` |
| `cidade_polo` | String | Cidade polo da operação | `Vitória`, `Volta Redonda`, `Campinas` |
| `uf_operacao` | String | Unidade Federativa (`ES`, `RJ`, `SP`) | `ES` |
| `volume_planejado` | Inteiro | Volume acordado (1 a 50 unidades) | `35` |
| `volume_realizado` | Inteiro | Volume executado (1 a 50 unidades) | `38` |
| `meta_faturamento` | Decimal | Meta financeira acordada (R$) | `R$ 6.500,00` |
| `faturamento_realizado`| Decimal | Faturamento efetivamente faturado | `R$ 6.820,00` |
| `atingimento_pct` | Decimal | Percentual de alcance da meta financeira | `104.9%` |
| `verba_cooperada` | Decimal | Valor aportado em incentivos/marketing | `R$ 1.500,00` |
| `sla_entrega_pct` | Decimal | On-Time Delivery (% de pontualidade) | `96.4%` |
| `status_jbp` | String | Classificação de risco executivo | `Superado`, `No Alvo`, `Crítico` |

---

## 📈 Principais Indicadores (KPIs)
- **Atingimento Global do JBP (%):** Razão entre faturamento realizado e meta financeira acordada.
- **Índice de Alavancagem de Verba (ROI JBP):** `Faturamento Realizado / Verba Cooperada Investida`.
- **Aderência de Volume:** `Volume Realizado / Volume Planejado`.
- **Nível de Serviço Logístico (SLA %):** Percentual de entregas realizadas no prazo contratual.

---

## 💻 Como Executar a Análise
Para rodar a rotina analítica em Python:

```bash
cd 01-jbp-joint-business-planning/scripts
python analise_jbp.py
```

---

## 💡 Insights e Recomendações Estratégicas
1. **Revisão Trimestral dos Acordos (QBR):** Fornecedores com atingimento abaixo de 90% e SLA comprometido devem entrar em plano de ação imediato antes do encerramento do semestre.
2. **Realocação Inteligente de Verba Cooperada:** Direcionar investimentos de marketing conjunto para as categorias e regiões com maior taxa de conversão em faturamento incremental (maior alavancagem de ROI).
3. **Integração com Suprimentos:** Otimizar pedidos conjuntos nos polos de Vitória (ES), Volta Redonda (RJ) e Campinas (SP) para maximizar o volume consolidado e obter melhores faixas de desconto.

