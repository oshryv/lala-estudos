# 📚 Lala Estudos — Deploy no Vercel

## O que é isso?
App de estudos da Lala com chat AI integrado. Precisa rodar num servidor para o chat funcionar.

## Como publicar (5 minutos, grátis)

### Passo 1 — Crie uma conta no GitHub
- Acesse https://github.com e crie uma conta gratuita (se não tiver)

### Passo 2 — Crie um repositório novo
- Clique em "New repository"
- Nome: `lala-estudos`
- Marque "Public"
- Clique em "Create repository"

### Passo 3 — Suba os arquivos
No repositório criado, clique em "uploading an existing file" e suba:
- `vercel.json`
- A pasta `api/` com o arquivo `chat.js` dentro
- A pasta `public/` com o arquivo `index.html` dentro

### Passo 4 — Crie conta no Vercel
- Acesse https://vercel.com
- Clique em "Sign up" e entre com o GitHub

### Passo 5 — Importe o projeto
- No painel do Vercel, clique em "Add New Project"
- Selecione o repositório `lala-estudos`
- Clique em "Deploy"

### Passo 6 — Configure a chave da API (IMPORTANTE!)
Após o deploy, vá em:
- Settings → Environment Variables
- Adicione uma nova variável:
  - **Name:** `ANTHROPIC_API_KEY`
  - **Value:** sua chave da API (começa com `sk-ant-...`)
- Clique em Save
- Vá em Deployments → clique nos 3 pontinhos → "Redeploy"

### Passo 7 — Acesse!
O Vercel vai te dar um link tipo `lala-estudos.vercel.app`
Esse link funciona em qualquer navegador, celular ou tablet!

## Como obter a chave da API Anthropic
- Acesse https://console.anthropic.com
- Vá em "API Keys" → "Create Key"
- Copie a chave e cole no Vercel (passo 6)

## Dúvidas?
Pergunte para a mamãe! 😄
