# Marca Bingo

Aplicativo web estático para carregar, acompanhar e marcar até quatro cartelas de bingo diretamente no navegador.

Acesse a versão publicada: [Marca Bingo no GitHub Pages](https://jhonedarts.github.io/mark-bingo/).

## Funcionalidades

- Acompanhamento simultâneo de uma a quatro cartelas.
- Marcação de números com indicação visual nas cartelas.
- Histórico de números sorteados, com opções para expandir, editar, remover, desfazer e limpar.
- Alerta visual quando uma ou mais cartelas são completadas.
- Importação por imagem, texto JSON/JSON5 ou arquivo `.json`.
- Leitura de até quatro imagens em lote, considerando cada imagem como uma cartela.
- Drag and drop de imagens e revisão do resultado do OCR antes da confirmação.
- Interface disponível em português, espanhol e inglês.
- Persistência local das cartelas, marcações e preferência de idioma por 24 horas.
- Layout responsivo para desktop e dispositivos móveis.

## Tecnologias

- React 19 e TypeScript.
- Next.js 16 com [Vinext](https://github.com/cloudflare/vinext) e Vite.
- Tesseract.js para reconhecimento dos números nas imagens.
- JSON5 para aceitar uma sintaxe de importação mais flexível.
- Exportação estática para GitHub Pages.

## Desenvolvimento local

### Requisitos

- Node.js 22.13 ou superior.
- npm 10 ou superior.

### Instalação

```bash
npm install
npm run dev
```

O endereço do servidor local será exibido no terminal.

### Comandos disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o ambiente local de desenvolvimento. |
| `npm run start` | Inicia o mesmo ambiente local definido pelo projeto. |
| `npm run build` | Gera a versão estática em `dist/client`. |
| `npm run lint` | Executa o ESLint no código-fonte. |
| `npx tsc --noEmit --incremental false` | Verifica os tipos sem gerar arquivos. |

## Carregamento de cartelas

Ao iniciar, o aplicativo procura primeiro uma partida válida no `localStorage`. Se não encontrar, tenta carregar `public/cartelas.json`. Quando nenhuma dessas fontes está disponível, o modal de carregamento é aberto automaticamente.

### Por imagem

1. Abra a opção **Imagem** no modal.
2. Selecione ou arraste até quatro imagens; cada arquivo representa uma cartela.
3. Aguarde o processamento sequencial das imagens.
4. Revise a lista de cartelas reconhecidas e remova ou adicione imagens, se necessário.
5. Clique em **Revisar JSON**.
6. Confira e corrija os números extraídos antes de clicar em **Confirmar**.

O OCR é executado no navegador. Para melhorar o reconhecimento, use imagens retas, nítidas, bem iluminadas e com a grade completa visível. O resultado deve sempre ser conferido antes da confirmação.

### Por JSON

Na opção **JSON**, o seletor permite alternar entre:

- **Digitar**: cola ou edita o conteúdo diretamente no modal.
- **Importar**: seleciona um arquivo `.json`.

O editor aceita JSON tradicional e JSON5, incluindo aspas simples, propriedades sem aspas e vírgulas finais.

## Formato das cartelas

O documento pode conter de uma a quatro cartelas. Cada cartela precisa ter um título não vazio e uma matriz retangular de números. Use `null` para representar um espaço livre.

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

Regras de validação:

- A propriedade `cards` deve conter entre uma e quatro cartelas.
- `title` deve ser uma string não vazia.
- `numbers` deve ter ao menos uma linha e uma coluna.
- Todas as linhas de uma cartela devem possuir a mesma quantidade de colunas.
- Cada célula deve conter `null` ou um número inteiro entre 1 e 9999.

## Persistência

O navegador mantém dois registros no `localStorage`:

- Cartelas e números sorteados.
- Idioma selecionado.

Ambos expiram após 24 horas. Dados ausentes, vencidos ou inválidos são descartados. Depois disso, o aplicativo volta a procurar a cartela padrão em `public/cartelas.json` ou abre o modal de carregamento.

## Internacionalização

Os catálogos ficam em:

- `app/src/i18n/pt-br.json`
- `app/src/i18n/es.json`
- `app/src/i18n/en.json`

As chaves usam `UPPER_SNAKE_CASE` e precisam existir nos três arquivos:

```json
{
  "BRAND_LABEL": "Marcador de bingo",
  "CALLED_COUNT": "{{count}} números sorteados"
}
```

Textos dinâmicos usam placeholders no formato `{{name}}`. O módulo `app/src/i18n/index.ts` carrega os catálogos, define os idiomas disponíveis e realiza a interpolação.

## Estrutura do projeto

```text
app/
├── bingo-client.tsx       # Estado e coordenação dos fluxos da aplicação
├── bingo-client.css       # Layout principal
├── globals.css            # Tokens e estilos globais
├── layout.tsx             # Metadados e layout raiz
├── page.tsx               # Página inicial
└── src/
    ├── components/        # Componentes visuais e respectivos arquivos CSS
    ├── i18n/              # Catálogos JSON e utilitários de internacionalização
    ├── card-json.ts        # Formatação do JSON para revisão
    ├── domain.ts           # Validação e regras das cartelas
    ├── ocr.ts              # Reconhecimento de cartelas por imagem
    ├── storage.ts          # Persistência no localStorage
    └── types.ts            # Tipos compartilhados
public/
└── favicon.svg
```

O arquivo `public/cartelas.json` é opcional e pode ser adicionado para disponibilizar cartelas padrão.

## Build e publicação

```bash
npm run build
```

O build gera os arquivos estáticos em `dist/client`. O script também copia `public/cartelas.json`, quando existir, e cria `.nojekyll` para compatibilidade com o GitHub Pages.

O workflow `.github/workflows/deploy-pages.yml` executa o build e publica automaticamente a aplicação após um push para a branch `main`. A publicação também pode ser iniciada manualmente pela interface do GitHub Actions.

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](./LICENSE).
