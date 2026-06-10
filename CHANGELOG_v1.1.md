# 🚀 VIVARIS CARE — v1.1.0 (10/06/2026)

Sessão de desenvolvimento que fechou os 4 itens do backlog prioritário + bugs ocultos descobertos no caminho.

## 🐛 BUGS CRÍTICOS CORRIGIDOS (estavam silenciosos)

1. **Chat nunca funcionaria** — o controller `messages.js` usava colunas `sent_at` e `read_at` que NÃO existiam no schema (migration 010 criou `created_at`/`is_read`). Toda tentativa de enviar mensagem dava erro 500. → Corrigido na migration **017**.

2. **Medicações dava "Acesso negado"** — `requireRole('admin','assistencial')` passava 2 argumentos, mas o middleware esperava UM array. Resultado: `roles.includes()` quebrava. → `requireRole` agora aceita os dois formatos.

3. **Coluna `prescribed_by_id` ausente** — a rota POST /medications inseria nessa coluna, mas ela não existia na tabela. → Adicionada na migration 017.

4. **`openTimeline` duplicado** no assistencial-dashboard.js — havia DUAS funções com o mesmo nome; a segunda (sem `await loadTimeline()`) sobrescrevia a primeira, então clicar em "Timeline" no card não carregava nada. → Unificado.

5. **Botão "Novo Contrato" inútil** — só chamava `switchPage('contracts')`. A tabela `contracts` existia no banco mas NÃO havia rota de API. → Criada `/api/contracts` (GET/POST/PATCH).

## ✨ FUNCIONALIDADES NOVAS

### Backend
- `src/routes/contracts.js` — CRUD de contratos + geração de número sequencial (VC-ANO-XXXX)
- `src/routes/upload.js` — upload de imagens/vídeos via Cloudinary (fallback local se CLOUDINARY_URL ausente)
- `src/index.js` — Socket.IO com **autenticação JWT obrigatória**, salas por residente (`resident:ID`), salas por usuário, evento "digitando..."
- Emits em tempo real: `new_message`, `new_timeline_event`, `new_moment`, `request_response`
- `package.json` — + cloudinary + multer

### Comercial
- Modal Novo Contrato (salva de verdade no banco)
- Botão "Ver" → modal de detalhes do residente
- Botão "Exportar" → gera CSV
- Botão "Sair" agora VISÍVEL (era branco no branco)
- Métricas reais: receita = soma das mensalidades dos contratos; conversão = contratos/residentes

### Assistencial
- 💊 Página Medicações completa (busca + modal de cadastro + filtro por residente)
- 📊 Página Relatórios (cards de indicadores + gráficos de barra de riscos e eventos)
- 💬 Chat em tempo real (estilo WhatsApp, bolhas, "digitando...")
- 📸 Novo Momento com upload de foto
- 🎨 Nova paleta verde TEAL premium (#0d9488)

### Familiar
- Socket.IO corrigido (agora envia token — antes o servidor recusaria a conexão)
- 💬 Página Chat com a equipe (tempo real)

## ✅ TESTES REALIZADOS (PostgreSQL local + servidor real)
1. Logins (comercial/assistencial/familiar) ✅
2. Criar + listar contratos ✅
3. Criar medicação (bug requireRole) ✅
4. Listar medicações ✅
5. Chat: enviar/receber/histórico ✅
6. Timeline: criar evento ✅
7. Upload de imagem (fallback local) ✅
8. Criar momento com mídia ✅
9. Socket SEM token → rejeitado ✅
10. Socket COM token JWT → conecta ✅
11. Mensagem entregue em TEMPO REAL entre dois sockets ✅

## ⚠️ AÇÕES PENDENTES PÓS-DEPLOY (você precisa fazer)
1. **Trocar a senha do banco no Railway** (a antiga vazou no histórico do Git).
2. **Configurar CLOUDINARY_URL no Railway** — sem isso, fotos somem no redeploy (filesystem efêmero).
3. As variáveis `APP_NAME`/`APP_VERSION` podem ser adicionadas no Railway (opcional).
