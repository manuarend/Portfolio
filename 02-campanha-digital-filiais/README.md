# 📱 Campanha Digital Mensal - Acompanhamento de Desempenho de Vendas das Filiais

Este projeto implementa uma solução analítica para mensuração do impacto de **campanhas de marketing digital e conversão de vendas nas filiais físicas e canais remotos** distribuídos pelos estados do **Espírito Santo (ES)**, **Rio de Janeiro (RJ)** e **São Paulo (SP)**.

A ferramenta integra métricas de mídia de performance (leads, investimento, ROAS) com os dados transacionais de faturamento e atingimento de metas das unidades de negócio.

---

## 🔒 Diretrizes de Anonimização e Sigilo de Dados
> [!NOTE]
> - **Valores e Quantidades:** Todos os números foram sintetizados de forma independente. Quantidades de leads e pedidos estão delimitadas entre **1 e 50 transações**; valores de metas e faturamento variam entre **R$ 1.000,00 e R$ 10.000,00**.
> - **Sem Proporção com a Empresa Real:** A base é inteiramente abstrata para impedir engenharia reversa de margens ou faturamentos reais.
> - **Rede de Filiais:** As filiais são fictícias, sediadas estrategicamente em cidades polo de ES (Vitória, Serra, Vila Velha, Linhares), RJ (Rio de Janeiro, Niterói, Macaé, Volta Redonda) e SP (São Paulo, Campinas, Santos, São José dos Campos).

---

## 🎯 Desafio de Negócio
Durante campanhas mensais de marketing digital (ex.: campanhas sazonais, feirões B2B, incentivos de catálogo), as empresas enfrentam desafios como:
1. **Atribuição de Vendas às Filiais:** Dificuldade em identificar se o lead gerado digitalmente converteu na loja física ou no canal de televendas/WhatsApp da filial correspondente.
2. **Disparidade de Desempenho Regional:** Unidades com alto volume de leads mas baixa conversão, indicando problemas de atendimento local ou ruptura de estoque.
3. **Eficiência de Mídia (ROAS):** Falta de clareza sobre quais canais digitais (ex.: WhatsApp vs Meta/Google Ads vs Portal E-commerce) entregam maior rentabilidade por real investido.

---

## 📊 Arquitetura de Dados

O dataset sintético está em [`data/campanha_digital_filiais_sintetico.csv`](data/campanha_digital_filiais_sintetico.csv):

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `id_registro` | String | Identificador único do lote de campanha | `CMP-00012` |
| `data_registro` | Date | Data da medição semanal/mensal | `2026-04-18` |
| `nome_campanha` | String | Nome da campanha estratégica | `Campanha Alavanca Q1` |
| `filial` | String | Nome da filial física responsável | `Filial Vitória - Centro` |
| `cidade` / `uf` | String | Localidade e estado (`ES`, `RJ`, `SP`) | `Vitória` / `ES` |
| `canal_digital` | String | Canal de captação do lead | `WhatsApp Corporativo` |
| `leads_gerados` | Inteiro | Oportunidades geradas (1 a 50) | `32` |
| `pedidos_convertidos` | Inteiro | Vendas fechadas (1 a 50) | `14` |
| `taxa_conversao_pct` | Decimal | % de leads transformados em pedidos | `43.8%` |
| `investimento_midia_brl`| Decimal | Custo de mídia alocado (R$) | `R$ 1.800,00` |
| `faturamento_realizado_brl` | Decimal | Vendas faturadas no período | `R$ 7.240,00` |
| `meta_faturamento_brl` | Decimal | Meta estipulada para a campanha | `R$ 6.500,00` |
| `atingimento_meta_pct` | Decimal | Percentual de alcance da meta (%) | `111.4%` |
| `ticket_medio_brl` | Decimal | Valor médio por pedido fechado | `R$ 517,14` |
| `roas_campanha` | Decimal | Retorno sobre investimento em mídia | `4.02x` |

---

## 📈 Principais Métricas & KPIs
- **ROAS (Return on Ad Spend):** `Faturamento Realizado / Investimento em Mídia`.
- **Taxa de Conversão por Canal:** `(Pedidos Convertidos / Leads Gerados) * 100`.
- **Atingimento da Meta da Filial (%):** `(Faturamento Realizado / Meta) * 100`.
- **Ticket Médio Digital:** `Faturamento Realizado / Pedidos Convertidos`.

---

## 💻 Execução do Script
Para rodar a rotina em Python:

```bash
cd 02-campanha-digital-filiais/scripts
python analise_campanha_filiais.py
```

---

## 💡 Insights e Ações Recomendadas
- **Alavancagem do WhatsApp Corporativo:** O canal apresenta a maior taxa de conversão direta, justificando treinamentos de atendimento rápido para as equipes de vendas internas das filiais.
- **Plano de Recuperação para Filiais Abaixo de 85%:** Identificação de filiais que demandam apoio com promoções locais e reforço de portfólio para atingir a meta no fechamento do mês.
