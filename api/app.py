import os
import requests
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from flask_restx import Api, Resource, fields, Namespace
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Konfigurasi API Key dan Prompt Sistem
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
system_prompt = os.getenv("GEMINI_SYSTEM_PROMPT")

# Fungsi untuk memanggil Gemini API via REST
def call_gemini_api(prompt, temperature=0.7, max_tokens=256, top_k=40, top_p=0.95):
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {
        "Content-Type": "application/json"
    }
    body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "topK": top_k,
            "topP": top_p,
            "maxOutputTokens": max_tokens
        }
    }

    response = requests.post(endpoint, headers=headers, json=body)
    if response.status_code == 200:
        try:
            data = response.json()
            return data['candidates'][0]['content']['parts'][0]['text']
        except (KeyError, IndexError):
            return "Tidak ada respons yang dapat ditampilkan."
    else:
        return f"Terjadi kesalahan: {response.status_code} - {response.text}"

# Halaman HTML
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/blog")
def blog():
    return render_template("blog.html")

@app.route("/checkin")
def checkin():
    backend_url = os.getenv("BACKEND_URL")
    return render_template("checkin.html", backend_url=backend_url)

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('static', 'icon.png')

# Endpoint untuk UI (form biasa)
@app.route("/generate", methods=["POST"])
def generate():
    user_input = request.form.get("user_input", "")
    if not user_input.strip():
        return jsonify({"response": "Mohon masukkan pesan terlebih dahulu."})

    full_prompt = f"{system_prompt}\n\n{user_input}" if system_prompt else user_input

    try:
        response_text = call_gemini_api(full_prompt)
        return jsonify({"response": response_text})
    except Exception as e:
        return jsonify({"response": f"Terjadi kesalahan: {str(e)}"})

# Konfigurasi Swagger UI
app.config['SWAGGER_UI_DOC_EXPANSION'] = 'full'

api = Api(
    app,
    version='1.0',
    title='MentalMate Chatbot API',
    description=(
        "Selamat datang di dokumentasi MentalMate Chatbot API.\n"
        "API ini memungkinkan pengguna untuk berinteraksi dengan asisten virtual berbasis Gemini AI.\n\n"
        "Fitur utama:\n"
        "- Konsultasi seputar kesehatan mental\n"
        "- Rekomendasi aktivitas positif\n\n"
        "Gunakan endpoint /api/generate untuk memulai percakapan."
    ),
    doc='/api/docs'
)

# Namespace dan model input Swagger
chat_ns = Namespace(
    'Chatbot',
    description='Interaksi dengan chatbot MentalMate berbasis Gemini AI'
)

chat_input_model = chat_ns.model('ChatInput', {
    'user_input': fields.String(
        required=True,
        description='Pesan dari pengguna',
        example='Saya sedang stres, apa yang harus saya lakukan?'
    )
})

# Endpoint API Swagger
@chat_ns.route('/generate')
class ChatEndpoint(Resource):
    @chat_ns.expect(chat_input_model)
    @chat_ns.response(200, 'Berhasil mendapatkan respon.')
    @chat_ns.response(500, 'Terjadi kesalahan pada server.')
    def post(self):
        """Mengirim pertanyaan ke chatbot dan menerima respon dari Gemini API (REST)."""
        try:
            data = request.get_json()
            user_input = data.get("user_input", "")
            if not user_input.strip():
                return jsonify({"response": "Mohon masukkan pesan terlebih dahulu."})

            full_prompt = f"{system_prompt}\n\n{user_input}" if system_prompt else user_input

            response_text = call_gemini_api(full_prompt)
            return jsonify({"response": response_text})

        except Exception as e:
            print(f"Error occurred: {e}")
            return {'error': 'Internal server error'}, 500

# Tambahkan namespace ke Swagger
api.add_namespace(chat_ns, path='/api')

# Run server
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
