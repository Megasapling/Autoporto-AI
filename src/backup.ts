import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

/**
 * Mengompres proyek menjadi ZIP dengan progress callback
 * Menggunakan adm-zip (stabil, tidak ada masalah import)
 */
export function zipProject(
  onProgress?: (percent: number, total: number, processed: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const projectPath = process.cwd();
      const projectName = path.basename(projectPath);
      const outputPath = path.join(projectPath, `${projectName}-backup.zip`);

      const zip = new AdmZip();
      const exclude = new Set(['node_modules', 'dist', '.git']);

      // --- 1. Hitung total file yang akan di-zip ---
      function countFiles(dir: string): number {
        let count = 0;
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            if (exclude.has(item) || item.endsWith('.zip')) continue;
            const fullPath = path.join(dir, item);
            let stat;
            try {
              stat = fs.statSync(fullPath);
            } catch {
              continue;
            }
            if (stat.isDirectory()) {
              count += countFiles(fullPath);
            } else {
              count++;
            }
          }
        } catch (err) {
          console.warn(`Gagal menghitung file di ${dir}: ${err}`);
        }
        return count;
      }

      const totalFiles = countFiles(projectPath) || 1;
      let processedFiles = 0;

      // --- 2. Tambahkan file ke ZIP sambil update progress ---
      function addToZip(dir: string, baseInZip: string = '') {
        try {
          const items = fs.readdirSync(dir);
          for (const item of items) {
            if (exclude.has(item) || item.endsWith('.zip')) continue;
            const fullPath = path.join(dir, item);
            let stat;
            try {
              stat = fs.statSync(fullPath);
            } catch {
              continue;
            }
            const zipPath = path.join(baseInZip, item);
            if (stat.isDirectory()) {
              addToZip(fullPath, zipPath);
            } else {
              try {
                // Tambahkan file ke ZIP (adm-zip tidak memberikan event,
                // jadi kita update progress manual di sini)
                zip.addLocalFile(fullPath, baseInZip);
                processedFiles++;
                if (onProgress) {
                  const percent = Math.min(Math.round((processedFiles / totalFiles) * 100), 100);
                  onProgress(percent, totalFiles, processedFiles);
                }
              } catch (e) {
                console.warn(`Gagal menambahkan file ${fullPath}: ${e}`);
              }
            }
          }
        } catch (err) {
          console.warn(`Gagal membaca folder ${dir}: ${err}`);
        }
      }

      addToZip(projectPath);

      // --- 3. Tulis ZIP ke disk ---
      zip.writeZip(outputPath);
      resolve(outputPath);
    } catch (error) {
      reject(error);
    }
  });
}