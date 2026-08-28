import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectDirectory = process.cwd();
const outputDirectory = path.join(projectDirectory, 'dist', 'client');
const cardsSource = path.join(projectDirectory, 'public', 'cartelas.json');
const cardsDestination = path.join(outputDirectory, 'cartelas.json');

await mkdir(outputDirectory, { recursive: true });
try {
  await copyFile(cardsSource, cardsDestination);
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    // Sem cartela padrão: a interface exibirá a opção de importar um JSON.
  } else {
    throw error;
  }
}

await writeFile(path.join(outputDirectory, '.nojekyll'), '');
