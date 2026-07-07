import * as fs from 'fs';
import * as path from 'path';

export function detectTechStack(): { stack: string[], description: string } {
  // Mengambil jalur folder tempat perintah dijalankan (Current Working Directory)
  const projectPath = process.cwd();
  let stack: string[] = [];
  let description = "Proyek pengembangan perangkat lunak otomatis.";

  // 1. Deteksi ekosistem Node.js / JavaScript / TypeScript
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    stack.push('Node.js');
    
    // Membaca file package.json untuk melihat dependencies
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    if (packageData.description) {
      description = packageData.description; // Mengambil deskripsi jika ada
    }

    const deps = { ...packageData.dependencies, ...packageData.devDependencies };
    
    // Mendeteksi framework spesifik
    if (deps['react']) stack.push('React');
    if (deps['next']) stack.push('Next.js');
    if (deps['vite']) stack.push('Vite');
    if (deps['express']) stack.push('Express.js');
    
    // Mendeteksi Tailwind (termasuk Tailwind v4 via Vite plugin)
    if (deps['tailwindcss'] || deps['@tailwindcss/vite']) stack.push('Tailwind CSS');
  }

  // 2. Deteksi ekosistem Java (contohnya Spring Boot via Maven)
  const pomXmlPath = path.join(projectPath, 'pom.xml');
  if (fs.existsSync(pomXmlPath)) {
    stack.push('Java');
    const pomContent = fs.readFileSync(pomXmlPath, 'utf-8');
    if (pomContent.includes('spring-boot')) {
      stack.push('Spring Boot');
    }
  }

  // Jika foldernya kosong atau tidak terdeteksi
  if (stack.length === 0) {
    stack.push('General / Unknown Stack');
  }

  return { stack, description };
}