# -*- coding: utf-8 -*-
"""
Created on Thu Jul 30 19:21:18 2020

@author: hp
"""

import cv2
import numpy as np
from face_detector import get_face_detector, find_faces
from face_landmarks import get_landmark_model, detect_marks

def eye_on_mask(mask, side, shape):
    """
    Create ROI on mask of the size of eyes and also find the extreme points of each eye

    Parameters
    ----------
    mask : np.uint8
        Blank mask to draw eyes on
    side : list of int
        the facial landmark numbers of eyes
    shape : Array of uint32
        Facial landmarks

    Returns
    -------
    mask : np.uint8
        Mask with region of interest drawn
    [l, t, r, b] : list
        left, top, right, and bottommost points of ROI

    """
    points = [shape[i] for i in side]
    points = np.array(points, dtype=np.int32)
    mask = cv2.fillConvexPoly(mask, points, 255)
    l = points[0][0]
    t = (points[1][1]+points[2][1])//2
    r = points[3][0]
    b = (points[4][1]+points[5][1])//2
    return mask, [l, t, r, b]

def find_eyeball_position(end_points, cx, cy):
    """Find and return the eyeball positions, i.e. left or right or top or normal"""
    x_ratio = (end_points[0] - cx)/(cx - end_points[2])
    y_ratio = (cy - end_points[1])/(end_points[3] - cy)
    if x_ratio > 3:
        return 1
    elif x_ratio < 0.33:
        return 2
    elif y_ratio < 0.33:
        return 3
    else:
        return 0

    
def contouring(thresh, mid, img, end_points, right=False):
    """
    Find the largest contour on an image divided by a midpoint and subsequently the eye position

    Parameters
    ----------
    thresh : Array of uint8
        Thresholded image of one side containing the eyeball
    mid : int
        The mid point between the eyes
    img : Array of uint8
        Original Image
    end_points : list
        List containing the exteme points of eye
    right : boolean, optional
        Whether calculating for right eye or left eye. The default is False.

    Returns
    -------
    pos: int
        the position where eyeball is:
            0 for normal
            1 for left
            2 for right
            3 for up

    """
    cnts, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    try:
        cnt = max(cnts, key = cv2.contourArea)
        M = cv2.moments(cnt)
        cx = int(M['m10']/M['m00'])
        cy = int(M['m01']/M['m00'])
        if right:
            cx += mid
        cv2.circle(img, (cx, cy), 4, (0, 0, 255), 2)
        pos = find_eyeball_position(end_points, cx, cy)
        return pos
    except:
        pass
    
def process_thresh(thresh):
    """
    Preprocessing the thresholded image

    Parameters
    ----------
    thresh : Array of uint8
        Thresholded image to preprocess

    Returns
    -------
    thresh : Array of uint8
        Processed thresholded image

    """
    thresh = cv2.erode(thresh, None, iterations=2) 
    thresh = cv2.dilate(thresh, None, iterations=4) 
    thresh = cv2.medianBlur(thresh, 3) 
    thresh = cv2.bitwise_not(thresh)
    return thresh

def print_eye_pos(img, left, right):
    """
    Print the side where eye is looking and display on image

    Parameters
    ----------
    img : Array of uint8
        Image to display on
    left : int
        Position obtained of left eye.
    right : int
        Position obtained of right eye.

    Returns
    -------
    None.

    """
    if left == right and left != 0:
        text = ''
        if left == 1:
            print('Looking left')
            text = 'Looking left'
        elif left == 2:
            print('Looking right')
            text = 'Looking right'
        elif left == 3:
            print('Looking up')
            text = 'Looking up'
        font = cv2.FONT_HERSHEY_SIMPLEX 
        cv2.putText(img, text, (30, 30), font,  
                   1, (0, 255, 255), 2, cv2.LINE_AA) 

face_model = get_face_detector()
landmark_model = get_landmark_model()
left = [36, 37, 38, 39, 40, 41]
right = [42, 43, 44, 45, 46, 47]

cv2.namedWindow("image")
kernel = np.ones((9, 9), np.uint8)

def nothing(x):
    pass

cv2.createTrackbar("threshold", "image", 75, 255, nothing)
def track_eye(frame):
    """
    Track eye movements in a single frame
    """
    # Initialize all variables at the start
    eyeball_pos_left = 0
    eyeball_pos_right = 0
    eye_results = {
        'looking_left': False,
        'looking_right': False, 
        'looking_up': False,
        'looking_normal': True,
        'positions': {
            'left': 0,
            'right': 0
        }
    }

    try:
        img = frame.copy()
        rects = find_faces(img, face_model)
        
        # If no faces detected, return early with default values
        if not rects:
            return frame, eye_results

        for rect in rects:
            shape = detect_marks(img, landmark_model, rect)
            mask = np.zeros(img.shape[:2], dtype=np.uint8)
            mask, end_points_left = eye_on_mask(mask, left, shape)
            mask, end_points_right = eye_on_mask(mask, right, shape)
            mask = cv2.dilate(mask, kernel, 5)
            
            eyes = cv2.bitwise_and(img, img, mask=mask)
            mask = (eyes == [0, 0, 0]).all(axis=2)
            eyes[mask] = [255, 255, 255]
            mid = int((shape[42][0] + shape[39][0]) // 2)
            eyes_gray = cv2.cvtColor(eyes, cv2.COLOR_BGR2GRAY)
            
            threshold = 75
            _, thresh = cv2.threshold(eyes_gray, threshold, 255, cv2.THRESH_BINARY)
            thresh = process_thresh(thresh)
            
            # Get eye positions with error handling
            try:
                left_pos = contouring(thresh[:, 0:mid], mid, img, end_points_left)
                if left_pos is not None:
                    eyeball_pos_left = left_pos
            except Exception as e:
                print(f"Left eye detection error: {str(e)}")
                
            try:
                right_pos = contouring(thresh[:, mid:], mid, img, end_points_right, True)
                if right_pos is not None:
                    eyeball_pos_right = right_pos
            except Exception as e:
                print(f"Right eye detection error: {str(e)}")
            
            # Update eye_results based on positions
            if eyeball_pos_left == eyeball_pos_right and eyeball_pos_left != 0:
                eye_results['looking_normal'] = False
                
                text = 'Normal'
                if eyeball_pos_left == 1:
                    eye_results['looking_left'] = True
                    text = 'Looking left'
                elif eyeball_pos_left == 2:
                    eye_results['looking_right'] = True
                    text = 'Looking right'
                elif eyeball_pos_left == 3:
                    eye_results['looking_up'] = True
                    text = 'Looking up'
                    
                font = cv2.FONT_HERSHEY_SIMPLEX 
                cv2.putText(img, text, (30, 30), font, 1, (0, 255, 255), 2, cv2.LINE_AA)
            
            # Always update positions in results
            eye_results['positions']['left'] = eyeball_pos_left
            eye_results['positions']['right'] = eyeball_pos_right

        return img, eye_results
        
    except Exception as e:
        print(f"Error in eye tracking: {str(e)}")
        # Return original frame and default results if anything fails
        return frame, eye_results