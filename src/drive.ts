import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as url from 'url';
import * as dotenv from 'dotenv';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.autoporto');
dotenv.config({ path: path.join(CONFIG_DIR, '.env') });

const FOLDER_ID = process.env.DRIVE_FOLDER_ID;
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(CONFIG_DIR, 'token.json');

// Tipe untuk OAuth2Client yang kompatibel dengan googleapis
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  if (!FOLDER_ID) {
    throw new Error('DRIVE_FOLDER_ID tidak ditemukan di file .env');
  }

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

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);
  } else {
    await getAccessToken(oAuth2Client);
  }

  return oAuth2Client;
}

export async function findFileInDrive(
  client: OAuth2Client,
  fileName: string
): Promise<string | null> {
  const drive = google.drive({ version: 'v3', auth: client as any }); // <-- as any untuk menghindari konflik tipe
  const response = await drive.files.list({
    q: `name='${fileName}' and '${FOLDER_ID}' in parents and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1,
  });
  const files = response.data.files;
  return files && files.length > 0 ? files[0].id ?? null : null;
}

export async function deleteFileInDrive(
  client: OAuth2Client,
  fileId: string
): Promise<void> {
  const drive = google.drive({ version: 'v3', auth: client as any });
  await drive.files.delete({ fileId });
}

export async function uploadToDrive(
  client: OAuth2Client,
  zipFilePath: string,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!FOLDER_ID) {
    throw new Error('DRIVE_FOLDER_ID tidak ditemukan di file .env');
  }

  const drive = google.drive({ version: 'v3', auth: client as any });

  const response = await drive.files.create(
    {
      requestBody: {
        name: fileName,
        parents: [FOLDER_ID],
      },
      media: {
        mimeType: 'application/zip',
        body: fs.createReadStream(zipFilePath),
      },
      fields: 'id, webViewLink',
    },
    {
      onUploadProgress: (ev: any) => {
        if (ev.total && onProgress) {
          const percent = Math.round((ev.loaded / ev.total) * 100);
          onProgress(percent);
        }
      },
    } as any
  );

  // Perbaiki: response.data adalah objek dengan properti webViewLink
  const data = response.data as any;
  return data.webViewLink || 'Berhasil diunggah!';
}

// --- Fungsi internal untuk otorisasi pertama kali ---
function getAccessToken(oAuth2Client: OAuth2Client): Promise<void> {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'select_account',
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