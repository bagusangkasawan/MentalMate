# MentalMate 💚

***Platform Dukungan Kesehatan Mental dan Pencegahan Dampak Judi Online***

## 📌 Deskripsi Singkat

**MentalMate** adalah aplikasi web yang bertujuan untuk meningkatkan kesadaran dan kesejahteraan mental masyarakat, khususnya dalam mencegah dan menangani dampak negatif dari judi online. Aplikasi ini menawarkan informasi edukatif dan chatbot berbasis AI yang empatik untuk memberikan dukungan awal secara aman dan anonim.

---

## 🎯 Tujuan Proyek

* Memberikan **dukungan emosional awal** melalui chatbot AI yang empatik dan informatif.
* Menyediakan **informasi edukatif** tentang kesehatan mental dan bahaya judi online.
* Meningkatkan **kesadaran diri** dan mendorong intervensi dini terhadap gejala stres, kecemasan, atau gangguan lainnya.
* Mengurangi **stigma** dalam mencari bantuan profesional.

---

## ⚙️ Teknologi yang Digunakan

| Komponen            | Teknologi                                   | Deskripsi                                             |
| ------------------- | ------------------------------------------- | ----------------------------------------------------- |
| **Frontend**        | HTML, CSS, Bootstrap 5, JavaScript          | Tampilan web yang responsif dan ramah pengguna        |
| **Backend Chatbot** | Python Flask                                | Menangani logika percakapan dan komunikasi dengan API |
| **AI Chatbot**      | IBM watsonx Granite (granite-3-8b-instruct) | Memberikan respons dukungan mental yang empatik       |
| **Blog**            | Flask + Template HTML                       | Menyediakan artikel informatif dengan filter kategori |
| **Deployment**      | Google Cloud Run                            | Deploy aplikasi Flask                                 |
| **Version Control** | GitHub                                      | Manajemen kode sumber                                 |

---

## ✨ Fitur Utama

### 🔹 AI Chatbot

* Memberikan dukungan awal bagi pengguna yang mengalami stres atau kecemasan.
* Dibangun menggunakan **model Granite IBM Watsonx** (granite-3-8b-instruct).
* Respons empatik dan relevan berdasarkan konteks pertanyaan pengguna.

### 🔹 Artikel Edukasi

* Blog berisi informasi kesehatan mental, strategi coping, dan bahaya judi online.
* Fitur filter berdasarkan kategori untuk memudahkan pencarian artikel.

---

## 🧠 Integrasi AI

### 🔸 Model AI: `ibm/granite-3-8b-instruct`

* **Jenis**: Model instruksi untuk percakapan
* **Peran**: Asisten virtual empatik untuk kesehatan mental
* **Fungsi Utama**:

  * Memberikan saran, dukungan, dan edukasi seputar stres dan kecemasan
  * Menyediakan respons informatif namun tidak menghakimi
* **Manfaat**:

  * Mengganti peran dukungan awal yang seringkali tidak tersedia
  * Memungkinkan akses 24/7 secara anonim

---

## 🚀 Cara Menjalankan Aplikasi

### 📁 Prasyarat

* Python 3.10+
* API Key IBM Watsonx & Project ID
* `.env` file berisi:

  ```
  WATSONX_API_KEY=your_ibm_api_key
  WATSONX_PROJECT_ID=your_project_id
  GRANITE_SYSTEM_PROMPT=Kamu adalah asisten virtual yang suportif dan empatik...
  ```

### 🛠️ Instalasi

```bash
git clone https://github.com/bagusangkasawan/MentalMate
cd MentalMate
pip install -r requirements.txt
python app.py
```

### 🌐 Akses Web

* **Localhost**: `http://localhost:8080/`
* **Online (Production)**:
  👉 [MentalMate Live App](https://mentalmate-325126223708.us-central1.run.app/)

> ⏳ *Note: Mungkin membutuhkan waktu beberapa saat ketika pertama dibuka karena cold start dari Google Cloud Run.*

---

## 🔗 REST API & Swagger

MentalMate juga dapat digunakan sebagai **backend REST API**.

* Endpoint utama: `POST /api/generate`
* Dokumentasi Swagger:
  👉 [MentalMate Chatbot API](https://mentalmate-325126223708.us-central1.run.app/api/docs)

Contoh request:

```json
{
  "user_input": "Saya merasa stres dan cemas, apa yang bisa saya lakukan?"
}
```

Contoh response:

```json
{
  "response": "Beberapa cara yang bisa kamu coba adalah meditasi, olahraga ringan, atau bicara dengan orang terpercaya..."
}
```

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan Capstone Project Student Developer Initiative by IBM x Hacktiv8. Hak cipta sepenuhnya milik Developer.
