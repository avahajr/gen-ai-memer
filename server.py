import base64
import os
import urllib.request

import requests
from PIL import Image
from flask import Flask, request, jsonify, render_template
from openai import OpenAI
from werkzeug.utils import secure_filename

from openai_secrets import SECRET_KEY

client = OpenAI(api_key=SECRET_KEY)
num_images = 1

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads/'  # Ensure this directory exists


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def is_allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}


@app.route('/')
def home():
    # you can pass in an existing article or a blank one.
    return render_template('tab_contents.html')


@app.route("/get_meme_from_caption", methods=['POST'])
def get_meme_from_caption():
    caption = dict(request.json)['caption']

    image_url = get_image_from_gpt(caption)
    # image_url = "static/uploads/Screenshot_2024-07-01_at_3.44.25_PM.png"
    return {"image_url": image_url}


def download_img(url, save_as):
    urllib.request.urlretrieve(url, save_as)
    new_img = Image.open(save_as)
    new_img = new_img.convert("RGBA")
    new_img.save(save_as)
    return save_as


def get_image_from_gpt(caption: str):
    global num_images

    response = client.images.generate(
        model="dall-e-3",
        prompt=f"Make a reaction image (meme) for this caption: {caption}. DON'T INCLUDE THE CAPTION IN THE PHOTO.",
        size="1024x1024",
        quality="standard",
        n=1,
    )

    image_path = download_img(response.data[0].url,
                              os.path.join(app.config['UPLOAD_FOLDER'], f"dall-e_{str(num_images)}.png"))
    num_images += 1

    return image_path


@app.route("/upload_image_for_captioning", methods=["POST"])
def upload_image_for_captioning():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    image = request.files['image']

    if image.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if image and is_allowed_file(image.filename):
        filename = secure_filename(image.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(file_path)

        response = get_caption_from_gpt(file_path)["generated_caption"]

        return jsonify({'file-path': file_path, 'gpt-response': response})

    return jsonify({'error': 'File type not allowed'}), 400


@app.route("/refine_caption", methods=["POST"])
def refine_caption():
    data = request.json
    image_path = data["image_url"]
    feedback = data["meme_refine_input"]

    new_caption = get_caption_from_gpt(image_path, feedback)["generated_caption"]

    return jsonify({'image_url': image_path, 'caption': new_caption, "meme_refine_input": feedback})

def get_caption_from_gpt(file_path: str, feedback="") -> dict:
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
                        "text": f"Write a silly meme caption for this image. {feedback}."
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
    return {"generated_caption": response.json()['choices'][0]['message']['content']}


@app.route("/refine_image", methods=["POST"])
def refine_image():
    data = request.json
    refine_input = data['meme_refine_input']
    img_url = data['img_url']
    provided_caption = data['provided_caption']

    new_image = get_gpt_image_refinement(img_url, provided_caption, refine_input)

    return jsonify({'image_url': new_image, 'caption': provided_caption, "meme_refine_input": refine_input})


def get_gpt_image_refinement(img_path: str, caption: str, feedback: str) -> str:
    global num_images

    image_response = client.images.edit(
        model="dall-e-2",
        image=open(img_path, "rb"),
        prompt=f"This is the reaction image associated with the caption: {caption}. Change the image to match this feedback: {feedback}. DON'T INCLUDE THE CAPTION IN THE PHOTO.",
        n=1,
        size="1024x1024"
    )

    new_image_url = download_img(image_response.data[0].url,
                                 os.path.join(app.config.get('UPLOAD_FOLDER'), f"dall-e_{str(num_images)}.png"))
    num_images += 1
    return new_image_url


if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True, port=8921)
