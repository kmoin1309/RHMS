# -*- coding: utf-8 -*-
"""
Created on Fri Jul 31 01:04:44 2020

@author: hp
"""

import cv2
from face_detector import get_face_detector, find_faces
from face_landmarks import get_landmark_model, detect_marks, draw_marks
import logging
# face_model = get_face_detector()
# landmark_model = get_landmark_model()
outer_points = [[49, 59], [50, 58], [51, 57], [52, 56], [53, 55]]
d_outer = [0]*5
inner_points = [[61, 67], [62, 66], [63, 65]]
d_inner = [0]*3
font = cv2.FONT_HERSHEY_SIMPLEX 


def mouth_opening_detector(video_path):
    cap = cv2.VideoCapture(video_path)

    while(True):
        ret, img = cap.read()
        rects = find_faces(img, face_model)
        for rect in rects:
            shape = detect_marks(img, landmark_model, rect)
            draw_marks(img, shape)
            cv2.putText(img, 'Press r to record Mouth distances', (30, 30), font,
                        1, (0, 255, 255), 2)
            cv2.imshow("Output", img)
        if cv2.waitKey(1) & 0xFF == ord('r'):
            for i in range(100):
                for i, (p1, p2) in enumerate(outer_points):
                    d_outer[i] += shape[p2][1] - shape[p1][1]
                for i, (p1, p2) in enumerate(inner_points):
                    d_inner[i] += shape[p2][1] - shape[p1][1]
            break
    cv2.destroyAllWindows()
    d_outer[:] = [x / 100 for x in d_outer]
    d_inner[:] = [x / 100 for x in d_inner]

    while(True):
        ret, img = cap.read()
        rects = find_faces(img, face_model)
        for rect in rects:
            shape = detect_marks(img, landmark_model, rect)
            cnt_outer = 0
            cnt_inner = 0
            draw_marks(img, shape[48:])
            for i, (p1, p2) in enumerate(outer_points):
                if d_outer[i] + 3 < shape[p2][1] - shape[p1][1]:
                    cnt_outer += 1 
            for i, (p1, p2) in enumerate(inner_points):
                if d_inner[i] + 2 <  shape[p2][1] - shape[p1][1]:
                    cnt_inner += 1
            if cnt_outer > 3 and cnt_inner > 2:
                print('Mouth open')
                cv2.putText(img, 'Mouth open', (30, 30), font,
                        1, (0, 255, 255), 2)
            

def process_frame(img, face_model, landmark_model):
    """Process a single frame and return mouth status"""
    try:
        mouth_open = False
        processed_frame = img.copy()
        
        # Initialize result with default values
        result = {
            'mouth_open': False,
            'confidence': 0.0
        }
        
        rects = find_faces(processed_frame, face_model)
        if not rects:
            return processed_frame, result
            
        for rect in rects:
            shape = detect_marks(processed_frame, landmark_model, rect)
            if shape is None:
                continue
                
            draw_marks(processed_frame, shape[48:])
            
            # Initialize counters
            cnt_outer = 0
            cnt_inner = 0
            
            # Check outer points
            for i, (p1, p2) in enumerate(outer_points):
                try:
                    if shape[p2][1] - shape[p1][1] > 20:  # Threshold value
                        cnt_outer += 1
                except IndexError:
                    continue
                    
            # Check inner points
            for i, (p1, p2) in enumerate(inner_points):
                try:
                    if shape[p2][1] - shape[p1][1] > 15:  # Threshold value
                        cnt_inner += 1
                except IndexError:
                    continue
                    
            mouth_open = cnt_outer > 3 and cnt_inner > 2
            if mouth_open:
                cv2.putText(processed_frame, 'Mouth open', (30, 30), font,
                        1, (0, 255, 255), 2)
            
            result = {
                'mouth_open': mouth_open,
                'confidence': (cnt_outer + cnt_inner) / 8  # Simple confidence score
            }
            
        return processed_frame, result
        
    except Exception as e:
        logger.error(f"Error in process_frame: {str(e)}")
        return img, {'mouth_open': False, 'confidence': 0.0}
    
