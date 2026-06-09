# VIVARIS CARE - DOCUMENTACAO COMPLETA DO PROJETO
Ultima atualizacao: 31/05/2026 | Versao 1.0.0

## VISAO GERAL
Plataforma digital de cuidado compartilhado para ILPIs.
Nao e software de ILPI - e uma ponte digital de confianca entre ILPI e familia.
3 perfis principais: COMERCIAL (vendas), ASSISTENCIAL (clinico), FAMILIAR (acompanhamento humanizado).

## STACK TECNICA
- Frontend: HTML5 + CSS3 + JavaScript Vanilla
- Backend: Node.js 18+ (rodando em Node 20) + Express
- Banco: PostgreSQL hospedado no Railway
- Auth: JWT + Bcryptjs (PIN com hash)
- Tempo real: Socket.IO (carregado, chat ainda nao implementado)
- Deploy: Railway com auto-deploy via GitHub push

## LOCALIZACAO DO PROJETO
- Windows: C:\Users\Walter Note\OneDrive\Documentos\vivaris-care
- WSL: /mnt/c/Users/Walter\ Note/OneDrive/Documentos/vivaris-care
- GitHub: https://github.com/walterleite01/vivaris-care (privado)
- Railway: https://vivaris-care-production.up.railway.app
- Ambiente dev: WSL Ubuntu no Windows, comando: npm run dev (porta 3000)

## VARIAVEIS DE AMBIENTE (.env)
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:EPpAXyxdCanRlEldKQOSgDAagIUZNkjT@yamanote.proxy.rlwy.net:45526/railway
JWT_SECRET=vivaris-care-secret-key-super-segura-2026

## USUARIOS DE TESTE
| Email | PIN | Role |
|---|---|---|
| admin@vivaris.test | 1234 | admin |
| comercial@vivaris.test | 1234 | comercial |
| maria@vivaris.test | 5678 | assistencial |
| silva@vivaris.test | 1234 | assistencial |
| familiar@vivaris.test | 5678 | familiar |

## BANCO DE DADOS - 16 MIGRATIONS
001-011 (base): users, residents, resident_identification, clinical_history,
medications, allergies, vaccination, geriatric_scales, resident_risks,
daily_activities, messages, contracts.
012-016 (timeline premium): timeline_events, timeline_comments,
timeline_reactions, family_requests, timeline_moments.
Migrations rodam automaticamente ao iniciar o servidor (src/index.js).

## ESTRUTURA DE PASTAS
src/index.js (entry), src/db.js, src/middleware/auth.js (exporta {authenticate, requireRole}),
src/migrations/ (001 a 016), src/controllers/ (residents, timeline, moments, family-requests),
src/routes/ (auth, residents, timeline, moments, family-requests).
public/html/, public/css/, public/js/ com os arquivos:
index.html (login), comercial-dashboard, assistencial-dashboard,
familiar-dashboard, resident-form (17 abas).

## APIS IMPLEMENTADAS
POST /api/auth/login (body: email + pin)
GET/POST /api/residents
POST /api/timeline | GET /api/timeline/:resident_id (filtra por role/audience)
POST+GET /api/timeline/:event_id/comments
POST /api/timeline/:event_id/reactions
POST /api/moments | GET /api/moments/:resident_id
POST+GET /api/family-requests | PUT /api/family-requests/:id/respond

## AUDIENCE LAYER (seguranca de visibilidade)
internal_only (equipe) | family_visible (familia, humanizado) |
medical_only (medicos) | admin_only (administrativo).
Familiar so ve eventos family_visible. Auto-routing de solicitacoes por tipo:
solicitar_atualizacao/duvida_medicacao/informacao_importante -> assistencial,
contato_medico -> medico, visita/questao_financeira -> admin.
SLA: high=2h, medium=24h, low=48h.

## ESCALAS GERIATRICAS (pontos de corte validados)
Morse (queda): <=24 sem risco | 25-50 baixo | >=51 alto
Braden (ulcera, invertida): <=12 alto | 13-14 moderado | 15-18 leve | >=19 sem risco
Katz (independencia): 6 independente | 4-5 semi | <=3 dependente

## STATUS POR DASHBOARD

### COMERCIAL (95%)
Funciona: form 17 abas salvando em 9 tabelas, escalas calculando, dashboard
com 6 residentes, metricas, contratos listando.
PENDENTE: botao "Novo Contrato" so troca de pagina (precisa abrir form de criacao),
botao "Ver" no Historico nao abre o residente, botao "Historico" nas Acoes Rapidas,
botao "Sair" esta branco/invisivel (copiar estilo do assistencial: fundo claro vermelho).

### ASSISTENCIAL (estrutura 100%, melhorias pendentes)
Funciona: hero com alertas criticos, cards de residentes com risco calculado
(Morse/Braden), filtros, timeline clinica, modal novo evento, reacoes.
PENDENTE: pagina Medicacoes fica em "Carregando..." (nao tem API/render),
pagina Relatorios vazia, cores do design nao agradaram (rever paleta),
comentarios so mostram alert(), nao ha chat real.

### FAMILIAR (100% estrutura, testado)
Funciona: hero card status do dia, resumo, menu mobile, timeline humanizada
(family_visible), solicitacoes estruturadas com emojis, notificacoes locais,
galeria de momentos, Socket.IO conectando.
PENDENTE: chat em tempo real de verdade (hoje so solicitacoes/tickets),
upload de imagens (integrar Cloudinary), resumo automatico diario as 19h,
notificacoes push, PWA instalavel (manifest + service worker),
dados do hero ainda parcialmente simulados no JS (substituir por API real).

## PENDENCIAS GERAIS (BACKLOG PRIORIZADO)
1. CORRECOES COMERCIAL: 3 botoes + botao Sair (15-30 min)
2. CHAT TEMPO REAL: Socket.IO server-side (emitir new_timeline_event,
   new_moment, request_response) + UI de chat contextual vinculado a evolucao
3. UPLOAD DE IMAGENS: Cloudinary (free 25GB) para momentos e chat
4. ASSISTENCIAL: paginas Medicacoes e Relatorios + nova paleta de cores
5. RESUMO INTELIGENTE DIARIO: job as 19h gerando resumo humanizado
6. PWA: manifest.json + service worker + icones
7. PERMISSOES GRANULARES FAMILIAR: filho ve tudo, neto so fotos
   (tabela de vinculo familiar-residente com permissoes)
8. DEPLOY: validar que Railway esta servindo a versao atual

## LICOES TECNICAS APRENDIDAS (evitar retrabalho)
- middleware/auth.js exporta { authenticate, requireRole } - importar com destructuring
- Controllers: usar SOMENTE module.exports = { fn1, fn2 } no final
  (misturar exports.fn com module.exports quebra - vira [object Object] nas rotas)
- Heredocs grandes no terminal WSL as vezes truncam - verificar com wc -l apos criar
- sed com aspas aninhadas falha facil - preferir cat > arquivo << 'EOF'
- Railway NAO le .env - variaveis devem estar no painel Variables
- Apos mudar dados de auth no banco, reiniciar o servidor (pool/cache)
- Campo de login e "pin" (nao password): body {email, pin}

## COMO RODAR
cd /mnt/c/Users/Walter\ Note/OneDrive/Documentos/vivaris-care
killall node 2>/dev/null; sleep 2; npm run dev
Acessar http://localhost:3000 no navegador do Windows.

## COMO CONTINUAR NO PC NOVO
1. Instalar WSL: wsl --install (PowerShell admin) + Ubuntu
2. Instalar Node 20: via nvm ou apt
3. git clone https://github.com/walterleite01/vivaris-care.git
4. npm install
5. Criar .env com os valores acima
6. npm run dev
