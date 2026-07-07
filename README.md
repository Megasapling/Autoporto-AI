# 🚀 AutoPorto AI

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini API](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Google Drive API](https://img.shields.io/badge/Google_Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://developers.google.com/drive)

**AutoPorto AI** adalah sebuah *Command Line Interface (CLI) Tool* berbasis Node.js dan TypeScript yang dirancang untuk mengotomatisasi siklus dokumentasi dan pencadangan proyek Anda. 

Dengan satu perintah sederhana, sistem ini akan membaca struktur kode Anda, menulis dokumentasi cerdas menggunakan **Google Gemini AI**, merekam jejak versi melalui Git, membungkus proyek ke dalam arsip ZIP, dan menerbangkannya dengan aman ke Google Drive. Sangat ideal untuk menjaga portofolio *software engineering* Anda tetap rapi tanpa usaha manual.

---

## ✨ Fitur Utama

*   🤖 **AI-Powered Documentation**: Menggunakan `gemini-1.5-flash` untuk mendeteksi *tech stack* dan menulis file `README.md` berstandar industri secara otomatis.
*   ☁️ **Cloud Backup Engine**: Mengunggah file ZIP proyek secara asinkron langsung ke Google Drive menggunakan OAuth 2.0.
*   📦 **Automated Archiving**: Mengompresi seluruh direktori proyek secara instan sambil mengabaikan file yang tidak perlu (seperti `node_modules`).
*   🌿 **Git Orchestration**: Menyiapkan dan melakukan *git commit* secara otomatis setiap kali sinkronisasi dijalankan.
*   🌍 **Global Execution**: Dapat dijalankan dari direktori proyek mana saja di komputer Anda melalui perintah global yang simpel.

---

## 🛠️ Prasyarat (Prerequisites)

Sebelum menginstal dan menggunakan alat ini, pastikan sistem Anda telah dilengkapi dengan:
1.  **Node.js** (v18.x atau lebih baru)
2.  **Akun Google Cloud Console** (untuk mendapatkan `oauth.json` dari Google Drive API)
3.  **Gemini API Key** (didapatkan dari Google AI Studio)

---

## 🚀 Cara Instalasi

Ikuti langkah-langkah berikut untuk memasang alat ini di lingkungan lokal Anda:

1. **Kloning Repositori**:
   ```bash
   git clone [https://github.com/Megasapling/Autoporto-AI.git](https://github.com/Megasapling/Autoporto-AI.git)
   cd Autoporto-AI
