import base64
import os
import requests

from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from openai_secrets import SECRET_KEY
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'  # Ensure this directory exists


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def is_allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}


@app.route('/')
def home():
    # you can pass in an existing article or a blank one.
    return render_template('tab_contents.html')


@app.route("/upload_image", methods=["POST"])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    image = request.files['image']

    if image.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if image and is_allowed_file(image.filename):
        filename = secure_filename(image.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(file_path)

        response = get_caption_from_gpt(file_path)

        return jsonify({'image': filename, 'gpt-response': response})

    return jsonify({'error': 'File type not allowed'}), 400


def get_caption_from_gpt(file_path: str):

    base64_image = encode_image(file_path)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SECRET_KEY}"
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Write a silly meme caption for this image."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 300
    }

    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    return response.json()['choices'][0]['message']['content']

if __name__ == '__main__':
    app.run(debug=True)
