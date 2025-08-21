from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import logging
import os
from plate_detector import LicensePlateDetector

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize detector
detector = None
try:
    detector = LicensePlateDetector()
    logger.info("License plate detector initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize detector: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        status = "healthy" if detector is not None else "unhealthy"
        return jsonify({
            'status': status,
            'message': 'AI Service is running'
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/detect-file', methods=['POST'])
def detect_license_plate_file():
    """Detect license plate from uploaded file"""
    try:
        logger.info("Received file detection request")
        
        # Check if detector is available
        if detector is None:
            logger.error("Detector not initialized")
            return jsonify({
                'success': False,
                'error': 'Detector not initialized'
            }), 500
        
        # Check if file is in request
        if 'file' not in request.files:
            logger.error("No file in request")
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.error("Empty filename")
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Save uploaded file
        upload_dir = 'uploads'
        os.makedirs(upload_dir, exist_ok=True)
        
        filename = f"detect_{file.filename}"
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)
        
        logger.info(f"File saved: {filepath}")
        
        # Detect license plate
        result = detector.detect_license_plate(filepath)
        
        if result:
            logger.info(f"Detection successful: {result}")
            
            # Handle both string and dict results
            if isinstance(result, str):
                license_plate = result
                confidence = 0.8
                method = 'Roboflow+OCR'
            elif isinstance(result, dict):
                license_plate = result.get('license_plate', 'Unknown')
                confidence = result.get('confidence', 0.0)
                method = result.get('method', 'N/A')
            else:
                logger.error(f"Unexpected result type: {type(result)}")
                return jsonify({
                    'success': False,
                    'error': 'Invalid detection result format'
                }), 500
            
            return jsonify({
                'success': True,
                'license_plate': license_plate,
                'confidence': float(confidence),
                'method': method
            }), 200
        else:
            logger.warning("Detection failed: No result returned")
            return jsonify({
                'success': False,
                'error': 'Could not detect license plate'
            }), 404
    
    except Exception as e:
        logger.error(f"Detection error: {e}")
        return jsonify({
            'success': False,
            'error': f'Detection failed: {str(e)}'
        }), 500

@app.route('/detect-base64', methods=['POST'])
def detect_license_plate_base64():
    """Detect license plate from base64 image"""
    try:
        logger.info("Received base64 detection request")
        
        # Check if detector is available
        if detector is None:
            logger.error("Detector not initialized")
            return jsonify({
                'success': False,
                'error': 'Detector not initialized'
            }), 500
        
        # Get JSON data
        data = request.get_json()
        if not data or 'image' not in data:
            logger.error("No image data in request")
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        # Decode base64 image
        try:
            image_data = data['image']
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            
            # Convert to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                logger.error("Failed to decode image")
                return jsonify({
                    'success': False,
                    'error': 'Invalid image data'
                }), 400
            
        except Exception as e:
            logger.error(f"Image decoding failed: {e}")
            return jsonify({
                'success': False,
                'error': 'Failed to decode image'
            }), 400
        
        # Save image for processing
        upload_dir = 'uploads'
        os.makedirs(upload_dir, exist_ok=True)
        
        import time
        timestamp = int(time.time() * 1000000)
        filename = f"base64-{timestamp}.jpg"
        filepath = os.path.join(upload_dir, filename)
        
        cv2.imwrite(filepath, image)
        logger.info(f"Base64 image saved: {filepath}")
        
        # Detect license plate
        result = detector.detect_license_plate(filepath)
        
        if result:
            logger.info(f"Base64 detection successful: {result}")
            
            # Handle both string and dict results
            if isinstance(result, str):
                license_plate = result
                confidence = 0.8
                method = 'Roboflow+OCR'
            elif isinstance(result, dict):
                license_plate = result.get('license_plate', 'Unknown')
                confidence = result.get('confidence', 0.0)
                method = result.get('method', 'N/A')
            else:
                logger.error(f"Unexpected result type: {type(result)}")
                return jsonify({
                    'success': False,
                    'error': 'Invalid detection result format'
                }), 500
            
            return jsonify({
                'success': True,
                'license_plate': license_plate,
                'confidence': float(confidence),
                'method': method
            }), 200
        else:
            logger.warning("Base64 detection failed: No result returned")
            return jsonify({
                'success': False,
                'error': 'Could not detect license plate'
            }), 404
    
    except Exception as e:
        logger.error(f"Base64 detection error: {e}")
        return jsonify({
            'success': False,
            'error': f'Detection failed: {str(e)}'
        }), 500

@app.route('/test', methods=['GET'])
def test():
    return jsonify({
        'message': 'AI Service is working',
        'detector_status': 'ready' if detector else 'not_ready'
    })

if __name__ == '__main__':
    logger.info("Starting AI License Plate Service...")
    
    # Initialize detector
    if detector is not None:
        logger.info("✅ Detector ready")
    else:
        logger.error("❌ Detector initialization failed")
    
    logger.info("🚀 Starting Flask server...")
    app.run(host='0.0.0.0', port=5000, debug=True)