# 🏷️ Painel de Competitividade Comercial & Price Index

Este projeto desenvolve uma infraestrutura analítica em **SQL e Python** para avaliação de **inteligência de preços (Pricing), índice de competitividade (Price Index)** e sustentabilidade de margens comerciais em relação a benchmarks concorrentes no mercado do Sudeste (**Espírito Santo, Rio de Janeiro e São Paulo**).

---

## 🔒 Diretrizes de Anonimização e Sigilo Corporativo
> [!NOTE]
> - **Valores e Preços:** Totalmente desvinculados de listas de preços ou custos reais da empresa. Os preços unitários estão restritos entre **R$ 1.000,00 e R$ 10.000,00** e os volumes mensais variam entre **1 e 50 unidades/lotes**.
> - **Concorrentes e Nomes:** Todos os nomes de concorrentes e benchmarks utilizados nesta base são puramente fictícios (ex.: "Distribuidora Aço Líder", "Metálica Paulista B2B", "Rio Tubos & Conexões").
> - **Cidades e Estados:** Amostragem geográfica baseada em polos estratégicos de ES (Vitória, Serra, Vila Velha), RJ (Rio de Janeiro, Macaé, Volta Redonda) e SP (São Paulo, Campinas, Santos, São José dos Campos).

---

## 🎯 Desafio de Negócio
Em setores industriais e distribuidores B2B, a fixação de preços sem inteligência de mercado gera dois extremos prejudiciais:
1. **Subprecificação (Money on the Table):** Vender significativamente abaixo do preço de mercado quando o cliente aceitaria pagar mais, degradando a margem bruta da empresa.
2. **Sobrepreço Não Justificado (Loss of Share):** Praticar preços muito superiores aos concorrentes da mesma praça, resultando em perda de concorrências e queda abrupta no volume faturado.
3. **Dispersão Geográfica Injustificada:** Falta de coerência nos preços praticados entre praças vizinhas (ex.: Vitória vs Rio de Janeiro vs Santos).

---

## 📊 Arquitetura de Dados

O dataset sintético está em [`data/competitividade_comercial_sintetico.csv`](data/competitividade_comercial_sintetico.csv):

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `sku` | String | Código único do item monitorado | `SKU-1002` |
| `descricao_produto` | String | Descrição técnica do produto | `Válvula Esfera Flangeada 150 lbs` |
| `categoria` | String | Linha do catálogo industrial | `Válvulas & Conexões` |
| `cidade_pesquisa` / `uf_mercado` | String | Local da pesquisa (`ES`, `RJ`, `SP`) | `Vitória` / `ES` |
| `concorrente_benchmark` | String | Fornecedor ou concorrente de referência | `Metálica Paulista B2B` |
| `preco_nosso_brl` | Decimal | Preço de venda praticado (R$) | `R$ 5.480,00` |
| `preco_concorrente_brl` | Decimal | Preço pesquisado no concorrente (R$) | `R$ 5.310,00` |
| `custo_produto_brl` | Decimal | Custo de aquisição do produto (R$) | `R$ 3.820,00` |
| `indice_competitividade_pct` | Decimal | Price Index: `(Preço Nosso / Benchmark) * 100` | `103.2%` |
| `margem_bruta_pct` | Decimal | Percentual de margem comercial | `30.3%` |
| `volume_mensal_un` | Inteiro | Volume mensal vendido (1 a 50 un.) | `28` |
| `posicionamento_estrategico` | String | Classificação do posicionamento | `Paridade Competitiva` |

---

## 📐 Metodologia & Fórmulas
1. **Price Index (Índice de Preço Relativo):**
   $$\text{Price Index} = \left(\frac{\text{Preço Praticado}}{\text{Preço do Concorrente}}\right) \times 100$$
   - `< 96.0%`: Posição de Liderança em Preço (Agressivo)
   - `96.0% a 104.0%`: Faixa de Paridade Competitiva
   - `> 104.0%`: Posição Premium / Alerta de Sobrepreço

2. **Margem Bruta Percentual:**
   $$\text{Margem Bruta} = \left(\frac{\text{Preço Praticado} - \text{Custo}}{\text{Preço Praticado}}\right) \times 100$$

---

## 💻 Códigos & Consultas Analíticas
- **Consultas em SQL Avançado:** Veja o script [`scripts/consultas_competitividade.sql`](scripts/consultas_competitividade.sql), contendo consultas com CTEs e Window Functions (`DENSE_RANK()`, agregações ponderadas).
- **Script Executivo em Python:**
  ```bash
  cd 03-painel-competitividade-comercial/scripts
  python analise_competitividade.py
  ```

---

## 💡 Recomendações Estratégicas
- **Elasticidade Cruzada:** Para SKUs da categoria *Fixadores Industriais*, onde o Price Index médio é inferior a 95%, há margem para recomposição de até 3% no preço médio sem risco de perda de share.
- **Equalização Interestadual:** Revisão das regras de frete e tabela de preços entre as filiais de São Paulo e Rio de Janeiro para conter a dispersão de preços que incentiva o cliente a triangular compras entre praças.

