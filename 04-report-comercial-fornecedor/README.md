# 📊 Relatório Comercial Mensal de Fornecedores
### 🚀 Case de Sucesso: Simplificação e Automação de um Processo Analítico Caótico

> **Destaque de Currículo & Entrevistas:**  
> *"Redesenho e automação de fluxos analíticos complexos, integrando múltiplas fontes de dados (SQL, Python e BI) para eliminar retrabalho manual, erradicar planilhas gigantes desconectadas e democratizar o acesso a indicadores gerenciais com atualização instantânea."*

---

## 🧭 O Desafio: O "Cenário Caótico" das Planilhas Gigantes

Antes deste projeto, a geração do relatório mensal de acompanhamento comercial de fornecedores e indústrias parceiras era um dos processos mais **desgastantes, demorados e propensos a erro humano** na rotina da equipe:

```
[Base 2024 (.xlsx)] ──┐
[Base 2025 (.xlsx)] ──┼─> [Planilha Gigante >100MB] ──> [Fórmulas / PROCVs] ──> [Dias de Retrabalho]
[Base 2026 (.xlsx)] ──┘   (Trava máquinas, dezenas de abas, sem versionamento)
```

### Principais Dores Identificadas:
1. **Planilhas Gigantescas e Lentas:** Dados fragmentados em arquivos Excel que somavam mais de **100 MB** de histórico (`Base_2024.xlsx`, `Base_2025.xlsx`, `Base_2026.xlsx`), fazendo com que as máquinas dos analistas travassem com frequência.
2. **Retrabalho Manual Exaustivo:** A cada fechamento de mês, analistas gastavam **dias inteiros** copiando, colando, ajustando fórmulas PROCV, refazendo tabelas dinâmicas e recalculando manualmente variações de **YoY (ano contra ano)**, **MoM (mês contra mês)** e **YTD (acumulado do ano)**.
3. **Risco Crítico de Inconsistência:** Qualquer célula com erro de fórmula gerava divergência de faturamento entre o que a diretoria visualizava e o que era apresentado nas rodadas de negociação com as indústrias parceiras.
4. **Falta de Democratização:** Os gerentes de compras e diretores dependiam 100% de demandar um analista para qualquer filtro simples (ex.: *"quanto a indústria X cresceu no e-commerce vs lojas físicas?"*).

---

## 💡 A Solução Implementada

Para resolver a raiz do problema, desenhei e implementei uma **arquitetura de dados moderna e enxuta**, substituindo todo o processo manual por uma aplicação automatizada em **Streamlit (Python)**, scripts analíticos em **SQL** e um **painel interativo standalone em HTML5**:

```
                              ARQUITETURA DA SOLUÇÃO
                              
  [ Fontes de Dados ]            [ Camada de Engenharia ]           [ Consumo & Interface ]
  
  ┌─────────────────┐           ┌──────────────────────┐          ┌───────────────────────┐
  │ Transações      │           │                      │          │  Streamlit Data App   │
  │ Históricas      │ ────────> │ Pipeline Python      │ ───────> │  (main.py / Plotly)   │
  │ (2024 a 2026)   │           │ Limpeza, tipagem e   │          ├───────────────────────┤
  └─────────────────┘           │ unificação analítica │          │  Dashboard Standalone │
  ┌─────────────────┐           │                      │ ───────> │  (HTML5 / Tailwind)   │
  │ Modelagem SQL   │ ────────> └──────────────────────┘          ├───────────────────────┤
  │ (CTEs & Window) │                                             │  Exportação PDF/CSV   │
  └─────────────────┘                                             │  (1 Clique)           │
                                                                  └───────────────────────┘
```

### O que foi entregue:
1. **Pipeline de Dados em Python:** Script automatizado que carrega, valida tipos numéricos e consolida o histórico trienal (2024, 2025 e 2026) em segundos.
2. **Consultas SQL Padronizadas:** Lógica analítica formalizada com CTEs (*Common Table Expressions*) e *Window Functions* para calcular automaticamente faturamento líquido, volumetria, share na rede, Curva ABC e percentuais de aceleração YoY/MoM.
3. **Data App em Streamlit:** Interface visual executiva com filtros reativos por indústria parceira e canal de venda, cards de KPI dinâmicos e geração de relatórios com 1 clique (*Exportar PDF*).
4. **Painel Standalone Zero-Dependência ([`index.html`](index.html)):** Versão executiva pronta para uso em qualquer navegador web, sem necessidade de servidores ou instalações locais.

---

## 📈 Impactos e Resultados de Negócio

| Antes (Processo Manual e Caótico) | Depois (Com a Automação Desenvolvida) | Ganho de Eficiência |
| :--- | :--- | :---: |
| **Tempo de Fechamento:** Dias inteiros de consolidação manual mensal. | **Atualização Instantânea:** Geração em menos de **3 segundos**. | **~98% de redução de tempo** |
| **Manipulação:** Planilhas Excel de >100 MB com dezenas de abas e fórmulas complexas. | **Base Estruturada:** Processamento em lote em Python/SQL com interface limpa. | **Fim do travamento de planilhas** |
| **Confiabilidade:** Alto risco de erro humano por edição acidental de células. | **Fonte Única da Verdade:** Regras de negócio versionadas em código. | **100% de consistência de dados** |
| **Acesso:** Dependência direta do analista para qualquer filtro ou recorte. | **Self-Service:** Compradores e gestores filtram e exportam relatórios sozinhos. | **Democratização dos dados** |

---

## 🔒 Diretrizes de Anonimização e Sigilo de Dados (LGPD)
> [!NOTE]
> - **Valores e Quantidades:** Todos os dados transacionais de compras foram 100% sintetizados com propósitos ilustrativos de metodologia. Valores faturados estão compreendidos estritamente entre **R$ 1.000,00 e R$ 10.000,00**, e volumes entre **1 e 50 unidades/lotes**.
> - **Nenhum Dado Real:** Não há vínculo com custos, volumes ou transações reais praticadas com qualquer fornecedor ou com a empresa anterior.
> - **Indústrias:** Nomes de indústrias (ex.: Unilever, Eurofarma, EMS, Aché, Sanofi, Bayer) foram mantidos apenas como contexto de mercado do Sudeste (**ES, RJ e SP**), com métricas 100% fictícias.
> - **Foco em Performance Comercial:** Todas as métricas tratam estritamente de evolução de vendas, share de mercado, volumetria e aceleração de receita.

---

## 💻 Estrutura dos Arquivos do Projeto

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
└── README.md                       # Documentação executiva do case
```

---

## 📊 Arquitetura de Dados (Dataset Sintético)

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

## 📈 Indicadores Principais Calculados

- **Faturamento Filtrado (2026):** Receita líquida acumulada no ano corrente para o fornecedor ou canal selecionado.
- **Faturamento REDE (2026):** Receita total da rede no mesmo recorte de canal, servindo como denominador de share.
- **Participação na REDE (%):**
  $$\text{Share} = \left(\frac{\text{Faturamento Fornecedor 2026}}{\text{Faturamento REDE 2026}}\right) \times 100$$
- **Variação YoY 26x25 (%):** Crescimento percentual das vendas no ano de 2026 contra o mesmo período de 2025.
- **Variação MoM (%):** Variação mês a mês entre o mês atual e o mês imediatamente anterior.
- **YTD (Year-to-Date):** Acumulado de Janeiro até o mês de corte mais recente (Agosto) para todos os anos comparados.

---

## 🚀 Como Executar

### 1. Painel Interativo Web (Sem Instalar Nada)
Abra diretamente o arquivo [`index.html`](index.html) em qualquer navegador. O painel é 100% responsivo, possui alternador de tema claro/escuro, filtros reativos e exportação direta para CSV.

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
