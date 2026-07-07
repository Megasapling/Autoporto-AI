import { GoogleGenerativeAI } from '@google/generative-ai'; // <--- KUNCI UTAMA: GoogleGenerativeAI, bukan GoogleGenAI
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';

// Tentukan jalur folder pusat
const CONFIG_DIR = path.join(os.homedir(), '.autoporto');
dotenv.config({ path: path.join(CONFIG_DIR, '.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY tidak ditemukan di file .env di folder .autoporto');
}

// Inisialisasi menggunakan nama kelas yang benar
const ai = new GoogleGenerativeAI(apiKey);

/**
 * Fungsi untuk membuat dokumentasi README.md otomatis berdasarkan Tech Stack
 */
export async function generateReadme(stack: string[], description: string): Promise<string> {
  // Menggunakan model Gemini terbaru yang stabil dan cepat
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    Anda adalah seorang Senior Technical Writer profesional.
    Tugas Anda adalah membuat file README.md yang sangat menarik, rapi, dan berstandar industri untuk proyek ini.
    
    Informasi Proyek:
    - Tech Stack yang Terdeteksi: ${stack.join(', ')}
    - Deskripsi/Struktur File: ${description}
    
    Ketentuan README.md:
    1. Ditulis dalam Bahasa Indonesia yang profesional dan semi-formal.
    2. Harus memiliki struktur:
       - Judul Proyek yang Menarik & Deskripsi Singkat.
       - Fitur Utama.
       - Prasyarat (Prerequisites) & Cara Instalasi.
       - Cara Menjalankan Aplikasi.
       - Tech Stack Detail (Gunakan badge/ikon jika memungkinkan agar estetis).
    3. Desain harus sangat rapi, scannable, dan menggunakan markdown modern.
    
    Berikan HANYA kode markdown README.md saja, tanpa teks pembuka atau penutup tambahan.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Bersihkan jika AI membungkus kode dengan backticks ```markdown
  if (text.startsWith('```markdown')) {
    text = text.replace('```markdown', '');
  }
  if (text.endsWith('```')) {
    text = text.slice(0, -3);
  }

  return text.trim();
}