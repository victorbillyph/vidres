# Vidres

Aplicativo web inspirado no YouTube, com backend Node.js + TypeScript + Express e frontend React + TypeScript + Vite.

## Rodando

```bash
npm install
npm run install:all
npm run dev
```

Backend: `http://localhost:4000`

Frontend: `http://localhost:5173`

## Primeiro acesso

Na primeira execucao, `backend/data/users.json` estara vazio. O frontend redireciona automaticamente para `/setup`, onde voce cria o usuario `superadmin`.

## Banco JSON local

Os dados ficam em:

- `backend/data/users.json`
- `backend/data/channels.json`
- `backend/data/videos.json`
- `backend/data/comments.json`
- `backend/data/reports.json`

Uploads sao salvos em `backend/uploads` e videos passam por compactacao com FFmpeg via `ffmpeg-static`.

