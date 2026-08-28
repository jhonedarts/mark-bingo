# Marca Bingo

Aplicativo local para acompanhar de uma a quatro cartelas de bingo.

## Executar

Requer Node.js 22.13 ou superior e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` no navegador.

## Carregar outras cartelas

Clique em **Carregar JSON** e escolha um arquivo com o formato abaixo. O arquivo pode conter de uma a quatro cartelas; `null` representa o espaço livre central.

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

## Arquivos locais

- `public/cartelas.json`: cartelas exibidas ao iniciar o app.
- `public/marcacoes.json`: números marcados; é criado automaticamente e continua disponível após recarregar a página ou reiniciar o servidor.

Ao usar **Carregar JSON**, o arquivo selecionado substitui `public/cartelas.json` e limpa as marcações anteriores.
