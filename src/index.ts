#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { generateReadme } from './ai.js';           /* PERBAIKAN: Ditambahkan .js */
import { detectTechStack } from './scanner.js';     /* PERBAIKAN: Ditambahkan .js */
import { setupGitAndCommit } from './git.js';       /* PERBAIKAN: Ditambahkan .js */
import { zipProject } from './backup.js';           /* PERBAIKAN: Ditambahkan .js */
import { uploadToDrive } from './drive.js';         /* PERBAIKAN: Ditambahkan .js */

const program = new Command();

program
  .name('autoporto')
  .description('AI-Powered Auto Documentation & Backup Tool')
  .version('1.0.0');

program
  .command('sync')
  .description('Analisis kode, buat README, inisialisasi Git, dan siapkan Cloud Backup')
  .action(async () => {
    console.log(chalk.cyan.bold('\n🚀 Menjalankan AutoPorto AI...\n'));
    
    // 1. Memindai Tech Stack
    const scanSpinner = ora('Menganalisis file dan tech stack proyek...').start();
    const { stack, description } = detectTechStack();
    scanSpinner.succeed(`Tech stack terdeteksi: ${chalk.green(stack.join(', '))}`);

    // 2. Memanggil AI untuk membuat README
    const aiSpinner = ora('AI sedang merancang dan menulis README.md...').start();
    try {
      const readmePath = path.join(process.cwd(), 'README.md');
      if (fs.existsSync(readmePath)) {
        aiSpinner.succeed(`[HEMAT KREDIT] README.md sudah ada, melewati panggilan Gemini AI.`);
      } else {
        const readmeContent = await generateReadme(stack, description);
        fs.writeFileSync(readmePath, readmeContent);
        aiSpinner.succeed(`Dokumentasi berhasil disimpan di ${chalk.blue('README.md')}`);
      }
    } catch (error) {
      aiSpinner.fail(chalk.red('Gagal membuat dokumentasi AI. Pastikan API Key valid.'));
      return; 
    }

    // 3. Inisialisasi Git & Auto Commit
    const gitSpinner = ora('Menyiapkan Git Repository & Commit...').start();
    try {
      await setupGitAndCommit();
      gitSpinner.succeed(`Git diinisialisasi dan perubahan di-commit dengan ${chalk.green('standar industri')}.`);
    } catch (error: any) {
      if (error.message && error.message.includes('Tidak ada perubahan')) {
        gitSpinner.info(chalk.yellow('Tidak ada file baru untuk di-commit.'));
      } else {
        gitSpinner.fail(chalk.red('Gagal melakukan operasi Git.'));
      }
    }

    // 4 & 5. Kompresi ZIP sekaligus Upload ke Google Drive
    const zipSpinner = ora('Mengompres file proyek (mengabaikan node_modules)...').start();
    try {
      // Buat ZIP
      const zipPath = await zipProject();
      zipSpinner.succeed(`File backup bersih berhasil dibuat: ${chalk.yellow(path.basename(zipPath))}`);
      
      // Langsung Terbangkan ke Drive
      const uploadSpinner = ora('Menerbangkan file backup ke Google Drive...').start();
      const driveLink = await uploadToDrive(zipPath);
      uploadSpinner.succeed(`Backup otomatis diamankan di Cloud! ☁️\n   Cek di sini: ${chalk.blue.underline(driveLink)}`);
      
    } catch (error: any) {
      zipSpinner.fail(chalk.red('Gagal memproses backup atau upload ke Cloud.'));
      console.log(chalk.redBright(`\n[DEBUG ERROR DETAIL]: ${error.stack || error.message || error}\n`));
    }

    console.log(chalk.cyan.bold('\n✨ Semua proses selesai! Proyek Anda aman, rpi, dan siap jadi portofolio.\n'));
  });

program.parse(process.argv);