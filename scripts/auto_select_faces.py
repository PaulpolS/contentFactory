#!/usr/bin/env python3
import sys
import json
import os
from concurrent.futures import ThreadPoolExecutor

def score_face(image_path):
    """
    Detects faces in the image using OpenCV Haar Cascades.
    Returns the area of the largest face detected, or 0 if no face is found.
    """
    try:
        import cv2
        img = cv2.imread(image_path)
        if img is None:
            return 0
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Load Haar Cascade
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        if face_cascade.empty():
            return 0
            
        # Detect faces with parameters tailored for standard video frame resolution
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.15, 
            minNeighbors=5, 
            minSize=(80, 80)
        )
        
        if len(faces) == 0:
            return 0
            
        # Return the area (width * height) of the largest face detected
        max_area = 0
        for (x, y, w, h) in faces:
            area = w * h
            if area > max_area:
                max_area = area
        return max_area
    except Exception:
        return 0

def process_paths(paths):
    scores = {}
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = executor.map(score_face, paths)
        for path, score in zip(paths, results):
            scores[path] = score
    return scores

if __name__ == '__main__':
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({}))
            sys.exit(0)
        
        paths = json.loads(input_data)
        # Filter existing paths
        valid_paths = [p for p in paths if os.path.exists(p)]
        scores = process_paths(valid_paths)
        
        # Add 0 for non-existing paths
        for p in paths:
            if p not in scores:
                scores[p] = 0
                
        print(json.dumps(scores))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
