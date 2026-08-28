import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import vinext from 'vinext';
import hostingConfig from './.openai/hosting.json';

type CellValue = number | null;
type BingoCard = { title: string; numbers: CellValue[][] };

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID = '00000000-0000-4000-8000-000000000000';
const { d1, r2 } = hostingConfig;
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const localBindingConfig = {
  main: 'vinext/server/app-router-entry',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: d1 ? [{ binding: d1, database_name: 'site-creator-d1', database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID }] : [],
  r2_buckets: r2 ? [{ binding: r2, bucket_name: 'site-creator-r2' }] : [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isValidCard(value: unknown): value is BingoCard {
  if (!isRecord(value)) return false;
  const { title, numbers } = value;
  return typeof title === 'string' && title.trim().length > 0 && Array.isArray(numbers) && numbers.length === 5 && numbers.every((row) => Array.isArray(row) && row.length === 5 && row.every((cell) => cell === null || (typeof cell === 'number' && Number.isInteger(cell) && cell >= 1 && cell <= 75)));
}

function getCards(value: unknown): BingoCard[] | null {
  const cards = Array.isArray(value) ? value : isRecord(value) ? value.cards : undefined;
  return Array.isArray(cards) && cards.length >= 1 && cards.length <= 4 && cards.every(isValidCard) ? cards : null;
}

function getMarks(value: unknown): number[] {
  const marks = isRecord(value) ? value.calledNumbers : undefined;
  if (!Array.isArray(marks)) return [];
  return Array.from(new Set(marks.filter((item): item is number => typeof item === 'number' && Number.isInteger(item) && item >= 1 && item <= 75)));
}

function localBingoStorage(): Plugin {
  const publicDirectory = path.resolve(process.cwd(), 'public');
  const cardsFile = path.join(publicDirectory, 'cartelas.json');
  const marksFile = path.join(publicDirectory, 'marcacoes.json');

  async function readJson(file: string): Promise<unknown | null> {
    try {
      return JSON.parse(await readFile(file, 'utf8')) as unknown;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  async function writeJson(file: string, value: unknown) {
    await mkdir(publicDirectory, { recursive: true });
    const temporaryFile = `${file}.${process.pid}.tmp`;
    await writeFile(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await rename(temporaryFile, file);
  }

  async function readBody(request: IncomingMessage): Promise<unknown> {
    let rawBody = '';
    for await (const chunk of request) rawBody += chunk.toString();
    return JSON.parse(rawBody);
  }

  function respond(response: ServerResponse, status: number, body: unknown) {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(body));
  }

  async function handle(request: IncomingMessage, response: ServerResponse) {
    try {
      if (request.method === 'GET') {
        const [cardsData, marksData] = await Promise.all([readJson(cardsFile), readJson(marksFile)]);
        respond(response, 200, {
          cards: cardsData === null ? [] : getCards(cardsData) ?? [],
          calledNumbers: marksData === null ? [] : getMarks(marksData),
        });
        return;
      }

      if (request.method !== 'POST') {
        respond(response, 405, { error: 'Método não permitido.' });
        return;
      }

      const body = await readBody(request);
      if (!isRecord(body) || typeof body.action !== 'string') {
        respond(response, 400, { error: 'Requisição inválida.' });
        return;
      }

      if (body.action === 'saveCards') {
        const cards = getCards(body.cards);
        if (!cards) {
          respond(response, 400, { error: 'Cartelas inválidas.' });
          return;
        }
        await writeJson(cardsFile, { cards });
        await writeJson(marksFile, { calledNumbers: [] });
        respond(response, 200, { cards, calledNumbers: [] });
        return;
      }

      if (body.action === 'saveMarks') {
        const calledNumbers = getMarks({ calledNumbers: body.calledNumbers });
        await writeJson(marksFile, { calledNumbers });
        respond(response, 200, { calledNumbers });
        return;
      }

      respond(response, 400, { error: 'Ação desconhecida.' });
    } catch {
      respond(response, 500, { error: 'Não foi possível acessar os arquivos locais.' });
    }
  }

  return {
    name: 'local-bingo-storage',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/bingo', (request, response) => {
        void handle(request, response);
      });
    },
  };
}

export default defineConfig(async () => {
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox ? { watch: { useFsEvents: false, usePolling: true } } : undefined,
    plugins: [
      localBingoStorage(),
      vinext(),
      sites(),
      cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] }, config: localBindingConfig }),
    ],
  };
});
