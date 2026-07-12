from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
from PIL import Image
import numpy as np
import os

# Disable OneDNN optimization
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

app = Flask(__name__)
CORS(app)

# Load the skin disease classification model
model = load_model("../backend/skin_disease_model.h5")

# Define class names
class_names = ["Cellulitis", "Impetigo", "Athlete's Foot", "Nail Fungus", "Ringworm",
               "Cutaneous Larva Migrans", "Chickenpox", "Shingles"]

def preprocess_image(img, target_size):
    img = img.resize(target_size)
    img = img_to_array(img)
    img = np.expand_dims(img, axis=0)
    img = img / 255.0  # Normalize pixel values
    return img

@app.route("/predict", methods=["POST"])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No image file selected"}), 400

        image = Image.open(file.stream)
        image = preprocess_image(image, target_size=(150, 150))
        prediction = model.predict(image)
        predicted_class_index = np.argmax(prediction[0])
        predicted_class = class_names[predicted_class_index]
        confidence = float(prediction[0][predicted_class_index])

        # Get all predictions
        all_predictions = []
        for i, class_name in enumerate(class_names):
            all_predictions.append({
                'class': class_name,
                'confidence': float(prediction[0][i])
            })
        
        # Sort by confidence
        all_predictions.sort(key=lambda x: x['confidence'], reverse=True)

        return jsonify({
            "prediction": predicted_class,
            "confidence": confidence,
            "all_predictions": all_predictions
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Failed to process image"}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "OK"})

if __name__ == "__main__":
    app.run(debug=True, port=5001)