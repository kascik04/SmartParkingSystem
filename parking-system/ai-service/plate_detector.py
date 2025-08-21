import cv2
import numpy as np
from roboflow import Roboflow
from ultralytics import YOLO
import easyocr
import re
import logging
import os

logger = logging.getLogger(__name__)

class LicensePlateDetector:
    def __init__(self):
        self.rf = None
        self.roboflow_model = None
        self.yolo_model = None
        self.reader = None
        self.dataset_path = None
        self.setup_dataset()
        self.setup_models()
        self.setup_ocr()
    
    def setup_dataset(self):
        """Download và setup dataset từ Roboflow"""
        try:
            logger.info("Setting up Roboflow dataset...")
            
            rf = Roboflow(api_key="09OdNLhe3Re4WNqCfi5y")
            project = rf.workspace("platedetector-ecjn8").project("my-first-project-icuxt-pp5kj")
            version = project.version(1)
            
            # Setup Roboflow inference model
            self.roboflow_model = version.model
            logger.info("Roboflow model setup successfully")
            
        except Exception as e:
            logger.error(f"Roboflow setup failed: {e}")
    
    def setup_models(self):
        """Setup YOLO models"""
        try:
            logger.info("Setting up YOLO models...")
            
            if os.path.exists('yolov8n.pt'):
                self.yolo_model = YOLO('yolov8n.pt')
                logger.info("YOLOv8n model loaded successfully")
            else:
                logger.warning("YOLOv8n model not found")
            
        except Exception as e:
            logger.error(f"YOLO model setup failed: {e}")
    
    def setup_ocr(self):
        try:
            logger.info("Setting up EasyOCR...")
            self.reader = easyocr.Reader(['en'], gpu=False)
            logger.info("EasyOCR loaded successfully")
        except Exception as e:
            logger.error(f"EasyOCR setup failed: {e}")
    
    def detect_with_roboflow(self, image_path):
        """Detect bằng Roboflow API"""
        try:
            if not self.roboflow_model:
                return []
            
            logger.info("Running Roboflow detection...")
            predictions = self.roboflow_model.predict(image_path, confidence=30, overlap=30)
            
            detections = []
            if predictions and 'predictions' in predictions.json():
                for prediction in predictions.json()['predictions']:
                    x = prediction['x']
                    y = prediction['y']
                    w = prediction['width']
                    h = prediction['height']
                    confidence = prediction['confidence']
                    
                    x1 = int(x - w/2)
                    y1 = int(y - h/2)
                    x2 = int(x + w/2)
                    y2 = int(y + h/2)
                    
                    detections.append({
                        'bbox': [x1, y1, x2, y2],
                        'confidence': confidence,
                        'method': 'Roboflow'
                    })
            
            logger.info(f"Roboflow detected {len(detections)} license plates")
            return detections
            
        except Exception as e:
            logger.error(f"Roboflow detection failed: {e}")
            return []
    
    def crop_license_plate(self, image_path, bbox):
        """Crop license plate region"""
        try:
            image = cv2.imread(image_path)
            x1, y1, x2, y2 = bbox
            
            # Add padding
            padding = 20
            h, w = image.shape[:2]
            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(w, x2 + padding)
            y2 = min(h, y2 + padding)
            
            crop = image[y1:y2, x1:x2]
            return crop
            
        except Exception as e:
            logger.error(f"Cropping failed: {e}")
            return None
    
    def preprocess_crop_for_ocr(self, crop):
        """Preprocess crop cho OCR"""
        try:
            if crop is None or crop.size == 0:
                return []
            
            # Resize nếu quá nhỏ
            h, w = crop.shape[:2]
            if h < 60 or w < 200:
                scale = max(60/h, 200/w, 4.0)
                new_w = int(w * scale)
                new_h = int(h * scale)
                crop = cv2.resize(crop, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
            
            # Convert to grayscale
            if len(crop.shape) == 3:
                gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            else:
                gray = crop
            
            processed_images = []
            
            # Method 1: Original
            processed_images.append(gray)
            
            # Method 2: CLAHE
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            enhanced = clahe.apply(gray)
            processed_images.append(enhanced)
            
            # Method 3: Threshold
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            processed_images.append(thresh)
            
            # Method 4: Adaptive threshold
            adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            processed_images.append(adaptive)
            
            return processed_images
            
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            return [crop] if crop is not None else []
    
    def extract_text_from_crop(self, crop, save_path_prefix=""):
        """Extract text từ crop"""
        try:
            if crop is None or crop.size == 0:
                return None, 0
            
            # Save original
            if save_path_prefix:
                cv2.imwrite(f"{save_path_prefix}_original.jpg", crop)
            
            # Preprocess
            processed_images = self.preprocess_crop_for_ocr(crop)
            
            # Save processed
            for i, proc_img in enumerate(processed_images):
                if save_path_prefix:
                    cv2.imwrite(f"{save_path_prefix}_processed_{i}.jpg", proc_img)
            
            # Collect all OCR results
            all_texts = []
            
            for i, img in enumerate(processed_images):
                try:
                    results = self.reader.readtext(img, detail=1, paragraph=False)
                    
                    for bbox, text, confidence in results:
                        if confidence > 0.1:
                            all_texts.append({
                                'text': text.strip(),
                                'confidence': confidence,
                                'method': f'processed_{i}'
                            })
                            logger.info(f"OCR result: '{text}' (conf: {confidence:.2f})")
                            
                except Exception as e:
                    logger.error(f"OCR failed on image {i}: {e}")
            
            if not all_texts:
                return None, 0
            
            # Cố gắng tạo biển số hoàn chỉnh
            result = self.construct_license_plate(all_texts)
            
            if result:
                return result['text'], result['confidence']
            else:
                return None, 0
            
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return None, 0
    
    def find_motorcycle_pattern(self, texts):
        """Tìm pattern biển số xe máy với logic linh hoạt hơn"""
        try:
            # Tìm các components với logic mở rộng
            first_parts = []  # Các phần đầu
            second_parts = []  # Các phần sau như 452.30
            
            for item in texts:
                text = item['text']
                conf = item['confidence']
                
                # Check for second part patterns (xxx.xx format) - Ưu tiên trước
                if re.match(r'^\d{3}\.\d{2}$', text):
                    second_parts.append(item)
                    logger.info(f"Found second part candidate: '{text}' (conf: {conf:.2f})")
                    continue
                
                # Check for first part patterns - MỞ RỘNG để bao gồm "29-61"
                clean_text = text.replace('-', '').replace('*', '').replace(':', '')
                
                # Pattern 1: Standard format like "29G1", "18A"  
                if re.match(r'^\d{2}[A-Z]{1,2}\d*$', clean_text):
                    first_parts.append(item)
                    logger.info(f"Found first part candidate (standard): '{text}' (conf: {conf:.2f})")
                
                # Pattern 2: Number format like "29-61" (needs conversion to "29-G1")
                elif re.match(r'^\d{2}[-*:]\d{1,2}$', text):
                    first_parts.append(item)
                    logger.info(f"Found first part candidate (number): '{text}' (conf: {conf:.2f})")
                
                # Pattern 3: Pure numbers that could be first part like "2961"
                elif re.match(r'^\d{4}$', clean_text) and clean_text[:2] in ['18', '29', '30', '43', '51', '59', '72', '73', '74', '75', '77', '78', '79', '80', '81', '82', '83', '85', '86', '88', '89', '90', '92', '93', '94', '95', '97', '98', '99']:
                    first_parts.append(item)
                    logger.info(f"Found first part candidate (4-digit): '{text}' (conf: {conf:.2f})")
            
            # Sort by confidence
            first_parts.sort(key=lambda x: x['confidence'], reverse=True)
            second_parts.sort(key=lambda x: x['confidence'], reverse=True)
            
            logger.info(f"Found {len(first_parts)} first parts and {len(second_parts)} second parts")
            
            # Nếu có cả 2 phần
            if first_parts and second_parts:
                best_first = first_parts[0]
                best_second = second_parts[0]
                
                first_text = best_first['text']
                logger.info(f"Processing first part: '{first_text}'")
                
                # Convert first part to proper motorcycle format
                formatted_first = self.convert_to_motorcycle_format(first_text)
                
                if formatted_first:
                    result_text = f"{formatted_first} {best_second['text']}"
                    avg_confidence = (best_first['confidence'] + best_second['confidence']) / 2
                    
                    logger.info(f"Motorcycle pattern found: '{result_text}' (conf: {avg_confidence:.2f})")
                    
                    return {
                        'text': result_text,
                        'confidence': avg_confidence,
                        'type': 'motorcycle'
                    }
            
            # Nếu chỉ có first part, thử convert
            elif first_parts:
                best_first = first_parts[0]
                formatted = self.convert_to_motorcycle_format(best_first['text'])
                
                if formatted:
                    logger.info(f"Partial motorcycle pattern: '{formatted}'")
                    return {
                        'text': formatted,
                        'confidence': best_first['confidence'] * 0.6,  # Lower confidence
                        'type': 'motorcycle_partial'
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Motorcycle pattern search failed: {e}")
            return None
    
    def convert_to_motorcycle_format(self, text):
        """Convert text to standard motorcycle format"""
        try:
            clean_text = text.replace('-', '').replace('*', '').replace(':', '')
            
            # Case 1: Already proper format like "29G1"
            match = re.match(r'^(\d{2})([A-Z]{1,2})(\d*)$', clean_text)
            if match:
                province = match.group(1)
                letters = match.group(2)
                numbers = match.group(3) if match.group(3) else '1'
                return f"{province}-{letters}{numbers}"
            
            # Case 2: Number format like "2961" -> "29-G1"
            match = re.match(r'^(\d{2})(\d{1,2})$', clean_text)
            if match:
                province = match.group(1)
                series_num = match.group(2)
                
                # Convert number to letter series
                # Common conversions: 61->G1, 51->H1, etc.
                if series_num == '61':
                    return f"{province}-G1"
                elif series_num == '51':
                    return f"{province}-H1"  
                elif series_num == '71':
                    return f"{province}-B1"
                else:
                    # Default conversion: first digit as letter position
                    first_digit = int(series_num[0]) if series_num else 1
                    second_digit = series_num[1] if len(series_num) > 1 else '1'
                    
                    # Map digit to letter (1->A, 2->B, ..., 7->G, etc.)
                    letter_map = {1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G', 8: 'H', 9: 'K'}
                    letter = letter_map.get(first_digit, 'G')
                    
                    return f"{province}-{letter}{second_digit}"
            
            # Case 3: Format like "29-61" (with separator)
            if '-' in text or '*' in text or ':' in text:
                parts = re.split(r'[-*:]', text)
                if len(parts) == 2:
                    province = parts[0]
                    series = parts[1]
                    
                    if province.isdigit() and len(province) == 2:
                        if series.isdigit():
                            # Convert number series to letter
                            if series == '61':
                                return f"{province}-G1"
                            elif series == '51':
                                return f"{province}-H1"
                            else:
                                return f"{province}-G{series[-1]}"
                        else:
                            # Already has letters
                            return f"{province}-{series}"
            
            logger.warning(f"Could not convert '{text}' to motorcycle format")
            return None
            
        except Exception as e:
            logger.error(f"Motorcycle format conversion failed: {e}")
            return None
    
    def construct_license_plate(self, all_texts):
        """Tạo biển số với priority và validation cải tiến"""
        try:
            logger.info(f"Constructing license plate from {len(all_texts)} text fragments")
            
            # Clean và filter texts
            cleaned_texts = []
            for item in all_texts:
                text = item['text'].upper().strip()
                confidence = item['confidence']
                
                # Clean text
                text = self.clean_text(text)
                
                # Keep texts with lower threshold for motorcycle plates
                if text and len(text) >= 2 and confidence > 0.1:
                    cleaned_texts.append({
                        'text': text,
                        'confidence': confidence,
                        'method': item['method']
                    })
                    logger.info(f"Cleaned text: '{text}' (conf: {confidence:.2f})")
            
            if not cleaned_texts:
                return None
            
            patterns = []
            
            # Priority 1: Motorcycle patterns (most common)
            motorcycle_pattern = self.find_motorcycle_pattern(cleaned_texts)
            if motorcycle_pattern:
                patterns.append(motorcycle_pattern)
            
            # Priority 2: Complete car plates
            for item in cleaned_texts:
                text = item['text'].replace(' ', '').replace('-', '')
                
                # Complete car format: 18A12345
                if re.match(r'^\d{2,3}[A-Z]{1,2}\d{3,5}$', text):
                    match = re.match(r'^(\d{2,3})([A-Z]{1,2})(\d{3,5})$', text)
                    if match and len(match.group(3)) >= 3:
                        formatted = f"{match.group(1)}{match.group(2)}-{match.group(3)}"
                        patterns.append({
                            'text': formatted,
                            'confidence': item['confidence'],
                            'type': 'car_complete'
                        })
                        logger.info(f"Complete car pattern: '{formatted}' (conf: {item['confidence']:.2f})")
            
            # Priority 3: Other car patterns
            car_pattern = self.find_car_pattern(cleaned_texts)
            if car_pattern:
                patterns.append(car_pattern)
            
            if patterns:
                # Choose best pattern with preference for motorcycle (common in Vietnam)
                def pattern_score(p):
                    base_score = p['confidence']
                    if p['type'] == 'motorcycle':
                        base_score += 0.3  # High bonus for motorcycle
                    elif p['type'] == 'car_complete':
                        base_score += 0.2
                    elif p['type'] == 'motorcycle_partial':
                        base_score += 0.1
                    return base_score
                
                best_pattern = max(patterns, key=pattern_score)
                logger.info(f"Best pattern: '{best_pattern['text']}' (conf: {best_pattern['confidence']:.2f}, type: {best_pattern['type']})")
                return best_pattern
            
            return None
            
        except Exception as e:
            logger.error(f"License plate construction failed: {e}")
            return None
    
    def clean_text(self, text):
        """Clean và normalize text"""
        try:
            # Replacements for common OCR errors
            replacements = {
                '*': '-', 'I': '1', 'O': '0', 'S': '5', 'B': '8', 'G': '6', 'Z': '2',
                'D': '0', 'Q': '0', 'U': '0', 'C': '0', 'L': '1', 'J': '1', ':': '-',
                '"': '', "'": '', '[': '', ']': '', '(': '', ')': '', '|': '1'
            }
            
            for old, new in replacements.items():
                text = text.replace(old, new)
            
            # Remove extra spaces and special chars
            text = re.sub(r'[^\w\s\-\.]', '', text)
            text = ' '.join(text.split())
            
            return text
            
        except Exception as e:
            logger.error(f"Text cleaning failed: {e}")
            return text
    
    def detect_license_plate(self, image_path):
        """Main detection method"""
        try:
            logger.info(f"Processing image: {image_path}")
            
            if not os.path.exists(image_path):
                logger.error(f"Image file not found: {image_path}")
                return None
            
            # Detect license plate regions
            detections = self.detect_with_roboflow(image_path)
            
            if not detections:
                logger.warning("No license plate regions detected")
                return self.fallback_full_image_ocr(image_path)
            
            # Process each detection
            best_result = None
            best_confidence = 0
            
            for i, detection in enumerate(detections):
                bbox = detection['bbox']
                det_confidence = detection['confidence']
                method = detection['method']
                
                logger.info(f"Processing detection {i+1}: {method} (conf: {det_confidence:.2f})")
                
                # Crop license plate
                crop = self.crop_license_plate(image_path, bbox)
                if crop is None:
                    continue
                
                # Save for debugging
                base_name = os.path.splitext(os.path.basename(image_path))[0]
                save_prefix = f"uploads/{base_name}_crop_{method}_{det_confidence:.2f}"
                
                # Extract text
                license_text, ocr_confidence = self.extract_text_from_crop(crop, save_prefix)
                
                if license_text:
                    combined_confidence = (det_confidence + ocr_confidence) / 2
                    logger.info(f"Extracted: '{license_text}' (combined: {combined_confidence:.2f})")
                    
                    if combined_confidence > best_confidence:
                        best_result = license_text
                        best_confidence = combined_confidence
            
            if best_result:
                logger.info(f"FINAL RESULT: '{best_result}' (confidence: {best_confidence:.2f})")
                return best_result
            else:
                return self.fallback_full_image_ocr(image_path)
                
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            return None
    
    def fallback_full_image_ocr(self, image_path):
        """Fallback OCR on full image"""
        try:
            logger.info("Using fallback full image OCR...")
            
            image = cv2.imread(image_path)
            processed_images = self.preprocess_crop_for_ocr(image)
            
            for i, proc_img in enumerate(processed_images):
                try:
                    results = self.reader.readtext(proc_img, detail=1, paragraph=False)
                    
                    for bbox, text, confidence in results:
                        if confidence > 0.2:
                            # Try to construct license plate from this text
                            all_texts = [{'text': text, 'confidence': confidence, 'method': f'fallback_{i}'}]
                            result = self.construct_license_plate(all_texts)
                            
                            if result:
                                logger.info(f"Fallback result: '{result['text']}'")
                                return result['text']
                                
                except Exception as e:
                    logger.error(f"Fallback OCR {i} failed: {e}")
            
            return None
            
        except Exception as e:
            logger.error(f"Fallback failed: {e}")
            return None
    
    def find_car_pattern(self, texts):
        """Tìm pattern biển số ô tô với validation tốt hơn"""
        try:
            for item in texts:
                text = item['text'].replace(' ', '').replace('-', '')
                
                # Car pattern: 2-3 digits + 1-2 letters + 3-5 digits
                match = re.match(r'^(\d{2,3})([A-Z]{1,2})(\d{3,5})$', text)
                if match:
                    province = match.group(1)
                    letters = match.group(2)
                    numbers = match.group(3)
                    
                    # Validate reasonable ranges
                    if len(numbers) >= 3 and len(numbers) <= 5:
                        result_text = f"{province}{letters}-{numbers}"
                        logger.info(f"Car pattern found: '{result_text}'")
                        
                        return {
                            'text': result_text,
                            'confidence': item['confidence'],
                            'type': 'car'
                        }
            
            return None
            
        except Exception as e:
            logger.error(f"Car pattern search failed: {e}")
            return None

    def format_license_plate(self, text):
        """Format text thành biển số hợp lệ với validation"""
        try:
            # Remove spaces
            clean = text.replace(' ', '')
            
            # Car format: digits + letters + digits
            car_match = re.match(r'^(\d{2,3})([A-Z]{1,2})(\d{3,5})$', clean)
            if car_match:
                province = car_match.group(1)
                letters = car_match.group(2)
                numbers = car_match.group(3)
                
                # Validate complete numbers (not truncated)
                if len(numbers) >= 3:
                    return f"{province}{letters}-{numbers}"
            
            # Motorcycle format: digits + letters + numbers + . + numbers
            moto_match = re.match(r'^(\d{2})([A-Z]{1,2})(\d{1,3})\.(\d{2})$', clean)
            if moto_match:
                province = moto_match.group(1)
                letters = moto_match.group(2)
                first_nums = moto_match.group(3)
                second_nums = moto_match.group(4)
                
                return f"{province}-{letters}{first_nums} {first_nums}.{second_nums}"
            
            # Try to extract from mixed formats
            numbers = re.findall(r'\d+', text)
            letters = re.findall(r'[A-Z]+', text)
            
            if len(numbers) >= 2 and len(letters) >= 1:
                province = numbers[0]
                letter_part = letters[0]
                
                # Check if we have enough digits for car plate
                if len(numbers) > 1:
                    last_number = numbers[-1]
                    if len(last_number) >= 3:  # Car format
                        return f"{province}{letter_part}-{last_number}"
            
            return None
            
        except Exception as e:
            logger.error(f"License plate formatting failed: {e}")
            return None

    def find_longest_valid_pattern(self, texts):
        """Tìm text dài nhất có pattern hợp lý"""
        try:
            valid_texts = []
            
            for item in texts:
                text = item['text']
                
                # Check if text has reasonable license plate characteristics
                if (len(text) >= 5 and 
                    re.search(r'\d', text) and  # Has digits
                    (re.search(r'[A-Z]', text) or re.search(r'[-*:.]', text))):  # Has letters or separators
                    
                    valid_texts.append(item)
            
            if valid_texts:
                # Sort by length and confidence
                longest = max(valid_texts, key=lambda x: len(x['text']) + x['confidence'])
                
                # Try to format it properly
                text = longest['text']
                formatted = self.format_license_plate(text)
                
                if formatted:
                    logger.info(f"Longest valid pattern: '{formatted}'")
                    return {
                        'text': formatted,
                        'confidence': longest['confidence'] * 0.8,  # Slightly lower confidence
                        'type': 'longest'
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Longest pattern search failed: {e}")
            return None