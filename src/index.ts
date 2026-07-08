#!/usr/bin/env node
import * as cliProgress from 'cli-progress';   // <--- tambahkan baris ini
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Semua fungsi dari drive.ts digabung dalam satu import
import {
  getAuthenticatedClient,
  findFileInDrive,
  deleteFileInDrive,
  uploadToDrive
} from './drive.js';

import { generateReadme } from './ai.js';
import { detectTechStack } from './scanner.js';
import { setupGitAndCommit } from './git.js';
import { zipProject } from './backup.js';

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

    // 1. Scan tech stack
    const scanSpinner = ora('Menganalisis file dan tech stack proyek...').start();
    const { stack, description } = detectTechStack();
    scanSpinner.succeed(`Tech stack terdeteksi: ${chalk.green(stack.join(', '))}`);

    // 2. Generate README (hanya jika belum ada)
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

    // 3. Git init & commit
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

        // 4. Kompresi ZIP dengan Progress Bar
    console.log(chalk.cyan('\n📦 Mengompres proyek...'));
    const zipBar = new cliProgress.SingleBar({
      format: 'Progress | {bar} | {percentage}% | {value}/{total} files',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
    });

    let zipPath: string;
    try {
      // Mulai bar (total 100, diisi 0)
      zipBar.start(100, 0);
      zipPath = await zipProject((percent, total, processed) => {
        zipBar.update(percent);
        // Opsional: update teks di bar dengan jumlah file
        zipBar.update({ total: total, value: processed });
      });
      zipBar.update(100);
      zipBar.stop();
      console.log(chalk.green(`✅ File backup berhasil dibuat: ${chalk.yellow(path.basename(zipPath))}`));
    } catch (error: any) {
      zipBar.stop();
      console.log(chalk.red('❌ Gagal mengompres proyek.'));
      console.log(chalk.red(`Detail error: ${error.stack || error.message || error}`));
      return;
    }

    // 5. Upload ke Google Drive dengan Progress Bar
    try {
      const authSpinner = ora('Mempersiapkan koneksi ke Google Drive...').start();
      const authClient = await getAuthenticatedClient();
      authSpinner.succeed('Koneksi Google Drive berhasil.');

      const fileName = path.basename(zipPath);
      const fileId = await findFileInDrive(authClient, fileName);

      let finalFileName = fileName;
      let shouldUpload = true;

      if (fileId) {
        console.log(chalk.yellow(`\n⚠️  File "${fileName}" sudah ada di Google Drive.`));
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        const answer = await new Promise<string>((resolve) => {
          rl.question(
            chalk.cyan('Pilih aksi: (o)verwrite, (s)kip, (r)ename dengan timestamp: '),
            (ans) => {
              rl.close();
              resolve(ans.toLowerCase().trim());
            }
          );
        });

        if (answer === 'o' || answer === 'overwrite') {
          console.log(chalk.yellow(`🗑️  Menghapus file lama (ID: ${fileId})...`));
          await deleteFileInDrive(authClient, fileId);
          console.log(chalk.green('✅ File lama berhasil dihapus.'));
        } else if (answer === 'r' || answer === 'rename') {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const ext = path.extname(fileName);
          const base = path.basename(fileName, ext);
          finalFileName = `${base}-${timestamp}${ext}`;
          console.log(chalk.blue(`📝 Nama file baru: ${finalFileName}`));
        } else {
          console.log(chalk.gray('⏭️  Melewati upload. File tidak diunggah.'));
          shouldUpload = false;
        }
      }

      if (shouldUpload) {
        console.log(chalk.cyan(`\n☁️  Mengunggah ${finalFileName} ke Google Drive...`));
        const uploadBar = new cliProgress.SingleBar({
          format: 'Upload | {bar} | {percentage}%',
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true,
        });
        uploadBar.start(100, 0);

        const driveLink = await uploadToDrive(
          authClient,
          zipPath,
          finalFileName,
          (percent: number) => {
            uploadBar.update(percent);
          }
        );
        uploadBar.update(100);
        uploadBar.stop();
        console.log(chalk.green(`✅ Backup otomatis diamankan di Cloud! ☁️\n   Cek di sini: ${chalk.blue.underline(driveLink)}`));
      } else {
        console.log(chalk.gray('💡 File ZIP tetap tersimpan di lokal.'));
      }
    } catch (error: any) {
      console.log(chalk.redBright(`\n[ERROR UPLOAD]: ${error.stack || error.message || error}\n`));
    }
  });

program.parse(process.argv);