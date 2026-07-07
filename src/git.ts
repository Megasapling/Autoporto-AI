import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git'; // <--- PERBAIKAN: Gunakan nama fungsi di dalam kurung kurawal
import * as fs from 'fs';
import * as path from 'path';

// ... sisa kode konfigurasi options di bawahnya tetap sama ...
const options: Partial<SimpleGitOptions> = {
   baseDir: process.cwd(),
   binary: 'git',
   maxConcurrentProcesses: 6,
   trimmed: false,
};

const git: SimpleGit = simpleGit(options);

export async function setupGitAndCommit(): Promise<void> {
  const projectPath = process.cwd();

  // 1. Membuat .gitignore jika belum ada (Mencegah upload file rahasia/besar)
  const gitignorePath = path.join(projectPath, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    const defaultGitignore = `node_modules/\ndist/\n.env\n.DS_Store\n`;
    fs.writeFileSync(gitignorePath, defaultGitignore);
  }

  // 2. Cek apakah ini sudah berupa repository Git. Jika belum, lakukan "git init"
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    await git.init();
  }

  // 3. Tambahkan semua file ke staging area (git add .)
  await git.add('./*');

  // 4. Lakukan commit jika ada perubahan
  const status = await git.status();
  if (status.staged.length > 0) {
    // Menggunakan format "Conventional Commits" yang umum di industri
    await git.commit('chore(setup): auto-initialize repository and generate docs via AutoPorto AI');
  } else {
    throw new Error('Tidak ada perubahan baru untuk di-commit.');
  }
}