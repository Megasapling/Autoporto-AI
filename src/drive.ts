import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as url from 'url';
import * as dotenv from 'dotenv';
import * as os from 'os';

// 1. KUNCI PERBAIKAN: Tentukan jalur ke folder pusat .autoporto
const CONFIG_DIR = path.join(os.homedir(), '.autoporto');
dotenv.config({ path: path.join(CONFIG_DIR, '.env') }); 

const FOLDER_ID = process.env.DRIVE_FOLDER_ID;
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(CONFIG_DIR, 'token.json');

/**
 * Fungsi untuk mengunggah file ZIP menggunakan Kuota Akun Google (OAuth2)
 */
export async function uploadToDrive(zipFilePath: string): Promise<string> {
  if (!FOLDER_ID) {
    throw new Error('DRIVE_FOLDER_ID tidak ditemukan di file .env');
  }

  // 2. PERBAIKAN: Baca oauth.json dari folder pusat
  const oauthPath = path.join(CONFIG_DIR, 'oauth.json');
  if (!fs.existsSync(oauthPath)) {
    throw new Error(`File oauth.json tidak ditemukan di ${CONFIG_DIR}. Pastikan file sudah dipindahkan.`);
  }

  const credentials = JSON.parse(fs.readFileSync(oauthPath, 'utf-8'));
  const { client_secret, client_id } = credentials.installed || credentials.web;
  
  const oAuth2Client = new google.auth.OAuth2(
    client_id, 
    client_secret, 
    'http://localhost:3000'
  );

  // 3. PERBAIKAN: Cek token.json di folder pusat
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);
  } else {
    await getAccessToken(oAuth2Client);
  }

  // 4. Eksekusi Upload
  const drive = google.drive({ version: 'v3', auth: oAuth2Client });
  const fileName = path.basename(zipFilePath);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [FOLDER_ID],
    },
    media: {
      mimeType: 'application/zip',
      body: fs.createReadStream(zipFilePath),
    },
    fields: 'id, webViewLink',
  });

  return response.data.webViewLink || 'Berhasil diunggah!';
}

/**
 * Fungsi untuk membuka server lokal sementara dan menunggu login dari Browser
 */
function getAccessToken(oAuth2Client: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'select_account'
    });

    console.log('\n=============================================');
    console.log('🔒 OTORISASI GOOGLE DRIVE DIPERLUKAN 🔒');
    console.log('Tahan tombol CTRL (atau CMD) lalu klik link di bawah ini:');
    console.log(`\n${authUrl}\n`);
    console.log('Menunggu Anda memberikan izin di browser...\n=============================================');

    const server = http.createServer(async (req, res) => {
      if (req.url && req.url.includes('code=')) {
        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = qs.get('code');
        
        res.end('Otorisasi AutoPorto AI Berhasil! Silakan tutup tab ini.');
        server.close();

        if (code) {
          try {
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            // Simpan token ke folder pusat
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      }
    }).listen(3000);
  });
}