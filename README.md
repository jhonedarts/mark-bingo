# Marca Bingo

Aplicativo estático para acompanhar de uma a quatro cartelas de bingo. Está preparado para publicar no GitHub Pages.

## Desenvolvimento local

Requer Node.js 22.13 ou superior e npm.

```bash
npm install
npm run dev
```

## Cartelas e persistência

- As cartelas padrão são lidas de `public/cartelas.json`.
- Se esse arquivo não existir, a interface solicita o carregamento de um JSON.
- Cartelas importadas e marcações são salvas no `localStorage` do navegador por 24 horas.
- Ao vencer esse prazo, o app volta a usar `public/cartelas.json`.

O JSON deve conter de uma a quatro cartelas; `null` representa o espaço livre central.

```json
{
  "cards": [
    {
      "title": "037",
      "numbers": [
        [1, 17, 41, 54, 64],
        [15, 25, 35, 56, 74],
        [11, 20, null, 60, 75],
        [4, 21, 36, 49, 65],
        [7, 26, 44, 53, 63]
      ]
    }
  ]
}
```

## GitHub Pages

O workflow em `.github/workflows/deploy-pages.yml` publica automaticamente quando houver push para `main`.
