# HabitApp — Guia de Deploy

## Estrutura do projeto

```
habitapp-backend/   → Node.js + Express + PostgreSQL (Railway)
habitapp-frontend/  → React + Vite (Netlify)
```

---

## 1. Backend no Railway

### 1.1 Criar o projeto
1. Acesse railway.app e crie um novo projeto
2. Clique em **"Add Service" → "Database" → "PostgreSQL"**
3. Clique em **"Add Service" → "GitHub Repo"** e selecione seu repositório do backend

### 1.2 Variáveis de ambiente no Railway
Vá em **Variables** no serviço do backend e adicione:

```
DATABASE_URL        → (copie da aba Variables do PostgreSQL: "DATABASE_URL")
JWT_SECRET          → qualquer string longa e aleatória (ex: abc123xyz456...)
GOOGLE_CLIENT_ID    → (veja passo 3)
FRONTEND_URL        → https://seu-app.netlify.app (preencha depois do deploy do frontend)
PORT                → 3001
NODE_ENV            → production
```

### 1.3 Deploy
O Railway vai fazer o deploy automaticamente ao subir o código.
Anote a URL pública do backend (ex: `https://habitapp-backend.up.railway.app`).

---

## 2. Google OAuth (para login com Google)

1. Acesse console.cloud.google.com
2. Crie um projeto novo (ou use um existente)
3. Vá em **"APIs e Serviços" → "Credenciais"**
4. Clique em **"Criar credenciais" → "ID do cliente OAuth 2.0"**
5. Tipo: **Aplicativo Web**
6. Em **"Origens JavaScript autorizadas"**, adicione:
   - `http://localhost:5173` (desenvolvimento)
   - `https://seu-app.netlify.app` (produção)
7. Copie o **ID do cliente** — é o `GOOGLE_CLIENT_ID`

---

## 3. Frontend no Netlify

### 3.1 Criar .env local (para desenvolvimento)
Copie `.env.example` para `.env`:
```
VITE_API_URL=https://habitapp-backend.up.railway.app
VITE_GOOGLE_CLIENT_ID=seu_id_do_google_aqui
```

### 3.2 Deploy no Netlify
1. Acesse netlify.com e faça login
2. Clique em **"Add new site" → "Import from Git"**
3. Selecione o repositório do frontend
4. Configurações de build:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Vá em **"Site settings" → "Environment variables"** e adicione:
   ```
   VITE_API_URL          → https://habitapp-backend.up.railway.app
   VITE_GOOGLE_CLIENT_ID → seu_id_do_google_aqui
   ```
6. Clique em **Deploy**

---

## 4. Desenvolvimento local

### Backend
```bash
cd habitapp-backend
cp .env.example .env    # preencha as variáveis
npm install
npm run dev             # roda em http://localhost:3001
```

### Frontend
```bash
cd habitapp-frontend
cp .env.example .env    # preencha as variáveis
npm install
npm run dev             # abre em http://localhost:5173
```

---

## 5. Checklist final

- [ ] PostgreSQL criado no Railway
- [ ] Backend no Railway com todas as variáveis de ambiente
- [ ] Google Cloud Console configurado com as origens corretas
- [ ] Frontend no Netlify com variáveis de ambiente
- [ ] `FRONTEND_URL` no Railway atualizado com a URL do Netlify

---

## Funcionalidades implementadas

- Login com email/senha e Google OAuth
- Cadastro de hábitos com ícone e cor personalizados
- Marcar/desmarcar hábito do dia
- Streak de dias consecutivos por hábito
- Sistema de pontos (20 pts por hábito/dia)
- Níveis: Iniciante → Aprendiz → Praticante → Guerreiro → Mestre → Lendário
- Conquistas: 1º hábito, 7, 14, 30 e 66 dias de streak

## Próximas funcionalidades (Etapas 3 e 4)

- Gráfico de progresso histórico
- Calendário de dias cumpridos por hábito
- Notificações push diárias
- Escudo de streak (para não perder a sequência)
