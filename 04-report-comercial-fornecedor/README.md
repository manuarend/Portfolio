# 📊 Relatório Comercial Mensal de Fornecedores

Este projeto implementa um **Scorecard e Relatório Comercial Mensal de Fornecedores** completo, composto por um aplicativo em **Streamlit (Python)**, um painel interativo standalone em **HTML5/Tailwind/ApexCharts**, e scripts analíticos em **SQL** e **Python**. 

A ferramenta fornece visibilidade executiva sobre a evolução de vendas por fornecedor em três dimensões temporais (**2024, 2025 e 2026**), mensurando **Faturamento Líquido (VALOR)** e **Volumetria de Vendas (VOLUME)**, taxas de aceleração **YoY (Year-over-Year)**, **MoM (Month-over-Month)**, acumulação **YTD (Year-to-Date)** e segmentação de canais omnichannel.

---

## 🔒 Diretrizes de Anonimização e Sigilo de Dados (LGPD)
> [!NOTE]
> - **Valores e Quantidades:** Todos os dados transacionais de compras foram 100% sintetizados com propósitos ilustrativos de metodologia. Valores faturados estão compreendidos estritamente entre **R$ 1.000,00 e R$ 10.000,00**, e volumes entre **1 e 50 unidades/lotes**.
> - **Nenhum Dado Real:** Não há vínculo com custos, volumes ou transações reais praticadas com qualquer fornecedor ou com a empresa.
> - **Indústrias:** Nomes de indústrias farmacêuticas e de bens de consumo (ex.: Unilever, Eurofarma, EMS, Aché, Sanofi, Bayer) foram mantidos apenas como contexto do ecossistema comercial do Sudeste (**ES, RJ e SP**), com métricas 100% fictícias.
> - **Foco em Performance Comercial:** Todas as métricas tratam estritamente de evolução de vendas, share de mercado, volumetria e aceleração de receita.

---

## 🎯 Desafio de Negócio
A gestão estratégica de categorias e negociação de compras (*Trade Marketing & Commercial Procurement*) necessita de visibilidade contínua sobre a performance dos fornecedores para:
1. **Acompanhar a Evolução de Vendas Trienal:** Monitorar se a indústria parceira está crescendo acima ou abaixo do mercado nos ciclos 2024, 2025 e 2026.
2. **Comparar Desempenho por Canal Omnichannel:** Identificar penetração das marcas entre Lojas Físicas, App Mobile, E-commerce, Marketplace e Televendas.
3. **Gerar Relatórios Mensais com 1 Clique (PDF/Excel):** Fornecer aos gerentes comerciais relatórios padronizados de acompanhamento mensal (*Report do Mês* com variações MoM e YoY).

---

## 💻 Estrutura do Projeto

```bash
04-report-comercial-fornecedor/
├── app/
│   └── main.py                     # Aplicação Web Streamlit (Python + Plotly)
├── data/
│   └── report_fornecedor_sintetico.csv # Base sintética 2024-2026 (1.280 registros)
├── scripts/
│   ├── analise_fornecedores.py     # Pipeline de processamento em Python
│   └── scorecard_fornecedores.sql  # Queries SQL avançadas (Pivots, YTD, Curva ABC)
├── index.html                      # Painel interativo standalone (Zero dependências)
├── requirements.txt                # Dependências Python (Streamlit, Plotly, Pandas)
└── README.md                       # Documentação executiva do projeto
```

---

## 📊 Arquitetura de Dados

O dataset sintético está em [`data/report_fornecedor_sintetico.csv`](data/report_fornecedor_sintetico.csv):

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `Produto_ID` | Inteiro | Identificador sintético do produto | `2001` |
| `CODBARRAS` | String | Código EAN de barras fictício | `7891000101011` |
| `Desc_Produto` | String | Descrição padronizada e anônima do produto | `SOLUÇÃO METABÓLICA ULTRA 5MG` |
| `Laboratorio_ID` | Inteiro | Código do fornecedor / laboratório | `101` |
| `Laboratorio` | String | Nome da indústria parceira | `UNILEVER BRASIL B2B` |
| `AnoMes` | String | Período de apuração (`YYYY-MM`) | `2026-08` |
| `Canaldet` | String | Canal de venda omnichannel | `Loja Física`, `App Mobile`, `Site` |
| `Valor Liquido` | Decimal | Faturamento líquido faturado (R$ 1.000 a R$ 10.000) | `R$ 7.840,00` |
| `Quantidade` | Inteiro | Volume vendido no período (1 a 50 unidades) | `46` |

---

## 📈 Indicadores Principais (KPIs)

- **Faturamento Filtrado (2026):** Receita líquida acumulada no ano corrente para o fornecedor ou canal selecionado.
- **Faturamento REDE (2026):** Receita total da rede no mesmo recorte de canal, servindo como denominador de share.
- **Participação na REDE (%):**
  $$\text{Share} = \left(\frac{\text{Faturamento Fornecedor 2026}}{\text{Faturamento REDE 2026}}\right) \times 100$$
- **Variação YoY 26x25 (%):** Crescimento percentual das vendas no ano de 2026 contra o mesmo período de 2025.
- **Variação MoM (%):** Variação mês a mês entre o mês atual e o mês anterior.
- **YTD (Year-to-Date):** Acumulado de Janeiro até o mês de corte mais recente (Agosto) para todos os anos comparados.

---

## 🚀 Como Executar

### 1. Painel Interativo Web (Sem Instalar Nada)
Abra diretamente o arquivo [`index.html`](index.html) em qualquer navegador (Chrome, Edge, Firefox). O painel é 100% responsivo, possui alternador de tema claro/escuro, filtros dinâmicos e exportação para CSV.

### 2. Aplicação Streamlit (Python)
```bash
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Executar a aplicação
streamlit run app/main.py
```

### 3. Pipeline de Análise em Python
```bash
python scripts/analise_fornecedores.py
```

### 4. Consultas SQL
O arquivo [`scripts/scorecard_fornecedores.sql`](scripts/scorecard_fornecedores.sql) contém as queries analíticas prontas para execução em PostgreSQL, Snowflake, BigQuery ou SQLite.
