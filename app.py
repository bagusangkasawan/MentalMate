import os
import requests
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_restx import Api, Resource, fields, Namespace
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Konfigurasi dari .env
WATSONX_API_KEY = os.getenv("WATSONX_API_KEY")
PROJECT_ID = os.getenv("WATSONX_PROJECT_ID")
MODEL_ID = "ibm/granite-3-8b-instruct"
WATSONX_API_URL = "https://jp-tok.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29"
system_prompt = os.getenv("GRANITE_SYSTEM_PROMPT")

# Fungsi ambil access token dari IBM IAM
def get_ibm_access_token():
    resp = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data=f"grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey={WATSONX_API_KEY}"
    )
    return resp.json().get("access_token")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/blog")
def blog():
    return render_template("blog.html")

@app.route("/generate", methods=["POST"])
def generate():
    user_input = request.form.get("user_input", "")
    if not user_input.strip():
        return jsonify({"response": "Mohon masukkan pesan terlebih dahulu."})

    try:
        access_token = get_ibm_access_token()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ],
            "project_id": PROJECT_ID,
            "model_id": MODEL_ID,
            "max_tokens": 1024,
            "temperature": 0.7,
            "top_p": 1
        }

        response = requests.post(WATSONX_API_URL, headers=headers, json=payload)
        result = response.json()
        choices = result.get("choices", [])
        if choices:
            text = choices[0].get("message", {}).get("content", "")
        else:
            text = "Model tidak memberikan respon."
        return jsonify({"response": text})

    except Exception as e:
        return jsonify({"response": f"Terjadi kesalahan: {str(e)}"})

# Swagger config
app.config['SWAGGER_UI_DOC_EXPANSION'] = 'full'

api = Api(
    app,
    version='1.0',
    title='MentalMate Chatbot API',
    description=(
        "Selamat datang di dokumentasi MentalMate Chatbot API.\n"
        "API ini memungkinkan pengguna untuk berinteraksi dengan asisten virtual berbasis AI.\n\n"
        "Fitur utama:\n"
        "- Konsultasi seputar kesehatan mental\n"
        "- Rekomendasi aktivitas positif\n\n"
        "Gunakan endpoint /api/generate untuk memulai percakapan."
    ),
    doc='/api/docs'
)

chat_ns = Namespace(
    'Chatbot',
    description='Interaksi dengan chatbot MentalMate berbasis Granite IBM Watsonx'
)

chat_input_model = chat_ns.model('ChatInput', {
    'user_input': fields.String(
        required=True,
        description='Pesan dari pengguna',
        example='Saya sedang stres, apa yang harus saya lakukan?'
    )
})

@chat_ns.route('/generate')
class ChatEndpoint(Resource):
    @chat_ns.expect(chat_input_model)
    @chat_ns.response(200, 'Berhasil mendapatkan respon.')
    @chat_ns.response(500, 'Terjadi kesalahan pada server.')
    def post(self):
        """Mengirim pertanyaan ke chatbot dan menerima respon dari Granite API."""
        try:
            data = request.get_json()
            user_input = data.get("user_input", "")
            if not user_input.strip():
                return jsonify({"response": "Mohon masukkan pesan terlebih dahulu."})

            access_token = get_ibm_access_token()
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }

            payload = {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                "project_id": PROJECT_ID,
                "model_id": MODEL_ID,
                "max_tokens": 1024,
                "temperature": 0.7,
                "top_p": 1
            }

            response = requests.post(WATSONX_API_URL, headers=headers, json=payload)
            result = response.json()
            choices = result.get("choices", [])
            if choices:
                text = choices[0].get("message", {}).get("content", "")
            else:
                text = "Model tidak memberikan respon."
            return jsonify({"response": text})

        except Exception as e:
            return {'error': f'Internal server error: {str(e)}'}, 500

api.add_namespace(chat_ns, path='/api')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
