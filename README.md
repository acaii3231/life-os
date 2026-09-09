# ⚡ LIFE OS | Gestão Pessoal & Financeira Inteligente

Uma aplicação web completa no estilo **Life OS** construída com arquitetura full-stack moderna, banco de dados relacional **Supabase (PostgreSQL)**, módulo de produtividade com **Agenda e Kanban integrados**, checklists estilo Trello com micro-atividades, notificações WhatsApp via **API Plugsend**, **Life Builder** com mapa mental/fluxograma interativo de metas, dashboard financeiro analítico e algoritmo preditivo de **Nível de Vida**.

---

## 🔐 1. Credenciais de Acesso (Administrador)

- **Usuário:** `venom`
- **Senha:** `venom198`

> 💡 *Na tela de login, há um botão de 1 clique para preencher automaticamente as credenciais de teste.*

---

## 🗄️ 2. Banco de Dados Relacional (Supabase PostgreSQL)

O banco de dados relacional foi provisionado no Supabase (Projeto: `life-os` / `yqbzqjjnlzghgnrzwppy` na região `sa-east-1` de São Paulo).

As seguintes tabelas relacionais estão ativas:
1. `users`: Usuários do sistema e permissões.
2. `tasks`: Tarefas sincronizadas entre Agenda e Kanban.
3. `subtasks`: Micro-atividades em estilo checklist (Trello).
4. `media`: Upload e armazenamento de arquivos e anexos.
5. `transactions`: Lançamentos de receitas e despesas.
6. `life_goals`: Metas de vida para o Life Builder (Curto, Médio e Longo Prazo).
7. `life_goal_links`: Conexões e dependências do fluxograma vetorial.
8. `settings`: Configurações de API do Plugsend, telefone e preferências.
9. `notification_logs`: Histórico auditável de disparos do WhatsApp.

---

## 🚀 3. Como Executar a Aplicação

### Pré-requisitos
- Node.js v18+ (instalado no sistema)
- npm

### Inicialização Rápida (Servidor Unificado: Backend + Frontend)

Para rodar a aplicação completa na porta `3030`:

```bash
# Na raiz do projeto
npm run start
```
Acesse no navegador: **`http://localhost:3030`**

### Modo Desenvolvimento (Hot Reloading Frontend + Backend)

Em um terminal:
```bash
cd server && npm run dev
```

Em outro terminal:
```bash
cd client && npm run dev
```
Acesse o Vite dev server em: **`http://localhost:5173`**

---

## 🧭 4. Módulos e Recursos Implementados

### 📅 Produtividade (Agenda & Kanban Integrados)
- **Agenda Interativa:** Calendário mensal com navegação de datas, botão "Hoje", filtros por prioridade (Crítica, Alta, Média, Baixa) e status. Clique em qualquer dia para agendar uma atividade.
- **Kanban Integrado:** 3 colunas sincronizadas em tempo real (*A Fazer*, *Fazendo*, *Concluído*) com suporte a drag-and-drop e avançamento rápido de status.
- **Micro-atividades (Estilo Trello):** Abra qualquer cartão para ver checklists com cálculo de progresso percentual instantâneo, adição rápida com Enter, marcar/desmarcar itens e exclusão.
- **Anexos e Mídia:** Upload de arquivos, imagens e documentos diretamente para o cartão com visualizador e download.

### 📱 Notificações WhatsApp (API Plugsend)
- **PlugSendService:** Integração completa com o gateway da Plugsend.
- **Scheduler Automático:** Monitoramento em segundo plano que verifica a cada minuto tarefas com prazo para hoje, tarefas atrasadas e tarefas com prioridade crítica.
- **Modo Sandbox / Simulação:** Permite testar todos os gatilhos, layouts de mensagem e auditoria sem consumir créditos da API.
- **Disparo Manual:** Botão *"Disparar WhatsApp Agora"* dentro do cartão de qualquer tarefa e na gaveta lateral de notificações.

### 🧠 Life Builder (Mapa Mental & Fluxograma de Metas)
- Interface gráfica com nós arrastáveis (drag-and-drop) pelo canvas infinito.
- Coordenadas `(x, y)` salvas no banco de dados.
- Conexões vetoriais dinâmicas (curvas Bézier com setas SVG indicando dependências e marcos).
- Classificação por horizontes: **Curto Prazo** (< 1 ano), **Médio Prazo** (1 a 3 anos) e **Longo Prazo** (3 a 10 anos).
- Barras de progresso financeiro em cada nó (Valor Atual acumulado vs. Meta Planejada).

### 💰 Dashboard Financeiro
- Indicadores de Saldo Líquido, Total de Receitas, Total de Despesas e Margem de Poupança.
- Gráfico de Área com evolução de fluxo de caixa (Receitas x Despesas).
- Gráfico de Pizza/Donut de despesas por categoria.
- Lançamento de transações com **vínculo direto às Metas do Life Builder** (o aporte atualiza o progresso da meta automaticamente).
- Extrato com busca e filtros.

### 🩺 Algoritmo de "Nível de Vida" (Life Health Index)
- HUD visual com velocímetro/gauge semi-circular no topo da aplicação.
- Pontuação dinâmica contínua de **0 a 100 pontos**, dividida em:
  - **Produtividade (0 a 50 pts):** Conclusão de tarefas, progresso de micro-atividades, penalidade severa para tarefas atrasadas (-12 pts) e tarefas críticas pendentes (-8 pts).
  - **Finanças (0 a 50 pts):** Balanço líquido do mês, margem de economia e alocações em metas de vida. Déficits geram queda drástica na nota.
- Classificação visual automática:
  - 🔴 **"Perigoso"** (< 45 pts): Finanças no negativo ou tarefas acumuladas.
  - 🟡 **"Normal"** (45 a 74 pts): Equilíbrio e estabilidade.
  - 🟢 **"Excelente"** (75 a 100 pts): Metas batidas e finanças saudáveis.
- Diagnóstico textual e recomendações práticas em tempo real.
