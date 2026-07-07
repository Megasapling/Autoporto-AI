import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

/**
 * Fungsi untuk mengompres proyek menjadi file ZIP dengan mengabaikan folder berat
 */
export function zipProject(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const projectPath = process.cwd();
      const projectName = path.basename(projectPath);
      const outputPath = path.join(projectPath, `${projectName}-backup.zip`);

      // Inisialisasi adm-zip
      const zip = new AdmZip();

      // Baca semua isi folder proyek
      const items = fs.readdirSync(projectPath);

      for (const item of items) {
        // Daftar hitam: file/folder yang TIDAK boleh ikut di-zip
        if (
          item === 'node_modules' || 
          item === 'dist' || 
          item === '.git' || 
          item.endsWith('.zip')
        ) {
          continue; 
        }

        const fullPath = path.join(projectPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Jika ini folder, tambahkan sebagai folder lokal (parameter kedua adalah nama folder di dalam zip)
          zip.addLocalFolder(fullPath, item);
        } else {
          // Jika ini file biasa, langsung tambahkan
          zip.addLocalFile(fullPath);
        }
      }

      // Tulis file zip ke penyimpanan (synchronous, dijamin selesai sebelum lanjut)
      zip.writeZip(outputPath);
      
      resolve(outputPath);
    } catch (error) {
      reject(error);
    }
  });
}