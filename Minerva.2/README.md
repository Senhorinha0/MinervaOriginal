# Banco Minerva — estrutura organizada

## Importante
O Supabase do frontend foi preservado exatamente como está no projeto enviado. Esta reorganização **não remove, troca, recria ou configura o Supabase**.

## Estrutura
- `frontend/index.html` — página principal
- `frontend/css/style.css` — estilos extraídos do HTML
- `frontend/js/main.js` — JavaScript original do frontend
- `frontend/assets/images/logo.png` — imagem usada pelo site; substitua pelo seu logo
- `backend/app.py` — backend Flask fornecido
- `backend/models.py` — modelos SQLAlchemy fornecidos
- `backend/routes/` — estrutura de rotas preparada conforme o documento; os arquivos enviados originalmente não continham as implementações das rotas.
- `backend/requirements.txt` — dependências do backend fornecido
- `backend/.env.example` — exemplo de variáveis do backend

## Imagem
Para colocar sua própria imagem, substitua:
`frontend/assets/images/logo.png`

Você pode manter o mesmo nome `logo.png` para que o site a utilize automaticamente.

## Execução do frontend
Abra `frontend/index.html` no navegador ou sirva a pasta `frontend` por um servidor local.

## Backend
O `backend/app.py` fornecido depende de `DATABASE_URL` e espera módulos em `backend/routes/`. As implementações completas dessas rotas não estavam presentes nos arquivos enviados, portanto não foram inventadas nesta organização.
