import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

// Buat fungsi require yang berfungsi di ESM
const require = createRequire(import.meta.url);
const archiver = require('archiver');

/**
 * Mengompres proyek menjadi ZIP dengan progress callback
 */
export function zipProject(
  onProgress?: (percent: number, total: number, processed: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const projectPath = process.cwd();
    const projectName = path.basename(projectPath);
    const outputPath = path.join(projectPath, `${projectName}-backup.zip`);

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(outputPath));
    archive.on('error', (err: any) => reject(err));

    const exclude = new Set(['node_modules', 'dist', '.git']);

    // Hitung total file
    function countFiles(dir: string): number {
      let count = 0;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (exclude.has(item) || item.endsWith('.zip')) continue;
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          count += countFiles(fullPath);
        } else {
          count++;
        }
      }
      return count;
    }

    const totalFiles = countFiles(projectPath) || 1;
    let processedFiles = 0;

    archive.on('entry', (entry: any) => {
      processedFiles++;
      if (onProgress) {
        const percent = Math.min(Math.round((processedFiles / totalFiles) * 100), 100);
        onProgress(percent, totalFiles, processedFiles);
      }
    });

    archive.pipe(output);

    function addToArchive(dir: string, baseInZip: string = '') {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (exclude.has(item) || item.endsWith('.zip')) continue;
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        const zipPath = path.join(baseInZip, item);
        if (stat.isDirectory()) {
          addToArchive(fullPath, zipPath);
        } else {
          archive.file(fullPath, { name: zipPath });
        }
      }
    }

    addToArchive(projectPath);
    archive.finalize();
  });
}