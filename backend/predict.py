import tensorflow as tf
import numpy as np
from PIL import Image
import sys
import json
import io
import base64

# Load the model
try:
    model = tf.keras.models.load_model('skin_disease_model.h5')
    print("Model loaded successfully", file=sys.stderr)
except Exception as e:
    print(f"Error loading model: {e}", file=sys.stderr)
    sys.exit(1)

# Class names
class_names = [
    'Cellulitis',
    'Impetigo', 
    'Athlete\'s Foot',
    'Nail Fungus',
    'Ringworm',
    'Cutaneous Larva Migrans',
    'Chickenpox',
    'Shingles'
]

def preprocess_image(image_data):
    # Decode base64 image
    image_bytes = base64.b64decode(image_data)
    image = Image.open(io.BytesIO(image_bytes))
    
    # Convert to RGB if needed
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Resize to model input size
    image = image.resize((150, 150))
    
    # Convert to numpy array and normalize
    image_array = np.array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)
    
    return image_array

def predict_image(image_data):
    try:
        # Preprocess image
        processed_image = preprocess_image(image_data)
        
        # Make prediction
        predictions = model.predict(processed_image, verbose=0)
        
        # Get results
        predicted_class_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_index])
        predicted_class = class_names[predicted_class_index]
        
        # Get all predictions
        all_predictions = []
        for i, class_name in enumerate(class_names):
            all_predictions.append({
                'class': class_name,
                'confidence': float(predictions[0][i])
            })
        
        # Sort by confidence
        all_predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            'prediction': predicted_class,
            'confidence': confidence,
            'all_predictions': all_predictions
        }
    
    except Exception as e:
        return {'error': str(e)}

if __name__ == "__main__":
    # Read image data from stdin
    image_data = sys.stdin.read().strip()
    
    # Make prediction
    result = predict_image(image_data)
    
    # Output result as JSON
    print(json.dumps(result))