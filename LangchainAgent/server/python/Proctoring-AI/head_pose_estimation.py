# -*- coding: utf-8 -*-
"""
Created on Fri Jul 31 03:00:36 2020

@author: hp
"""

import cv2
import numpy as np
import math
from face_detector import get_face_detector, find_faces
from face_landmarks import get_landmark_model, detect_marks

def get_2d_points(img, rotation_vector, translation_vector, camera_matrix, val):
    """Return the 3D points present as 2D for making annotation box"""
    point_3d = []
    dist_coeffs = np.zeros((4,1))
    rear_size = val[0]
    rear_depth = val[1]
    point_3d.append((-rear_size, -rear_size, rear_depth))
    point_3d.append((-rear_size, rear_size, rear_depth))
    point_3d.append((rear_size, rear_size, rear_depth))
    point_3d.append((rear_size, -rear_size, rear_depth))
    point_3d.append((-rear_size, -rear_size, rear_depth))
    
    front_size = val[2]
    front_depth = val[3]
    point_3d.append((-front_size, -front_size, front_depth))
    point_3d.append((-front_size, front_size, front_depth))
    point_3d.append((front_size, front_size, front_depth))
    point_3d.append((front_size, -front_size, front_depth))
    point_3d.append((-front_size, -front_size, front_depth))
    point_3d = np.array(point_3d, dtype=np.float64).reshape(-1, 3)
    
    # Map to 2d img points
    (point_2d, _) = cv2.projectPoints(point_3d,
                                      rotation_vector,
                                      translation_vector,
                                      camera_matrix,
                                      dist_coeffs)
    point_2d = np.int32(point_2d.reshape(-1, 2))
    return point_2d

def draw_annotation_box(img, rotation_vector, translation_vector, camera_matrix,
                        rear_size=300, rear_depth=0, front_size=500, front_depth=400,
                        color=(255, 255, 0), line_width=2):
    """
    Draw a 3D anotation box on the face for head pose estimation

    Parameters
    ----------
    img : np.unit8
        Original Image.
    rotation_vector : Array of float64
        Rotation Vector obtained from cv2.solvePnP
    translation_vector : Array of float64
        Translation Vector obtained from cv2.solvePnP
    camera_matrix : Array of float64
        The camera matrix
    rear_size : int, optional
        Size of rear box. The default is 300.
    rear_depth : int, optional
        The default is 0.
    front_size : int, optional
        Size of front box. The default is 500.
    front_depth : int, optional
        Front depth. The default is 400.
    color : tuple, optional
        The color with which to draw annotation box. The default is (255, 255, 0).
    line_width : int, optional
        line width of lines drawn. The default is 2.

    Returns
    -------
    None.

    """
    
    rear_size = 1
    rear_depth = 0
    front_size = img.shape[1]
    front_depth = front_size*2
    val = [rear_size, rear_depth, front_size, front_depth]
    point_2d = get_2d_points(img, rotation_vector, translation_vector, camera_matrix, val)
    # # Draw all the lines
    cv2.polylines(img, [point_2d], True, color, line_width, cv2.LINE_AA)
    cv2.line(img, tuple(point_2d[1]), tuple(
        point_2d[6]), color, line_width, cv2.LINE_AA)
    cv2.line(img, tuple(point_2d[2]), tuple(
        point_2d[7]), color, line_width, cv2.LINE_AA)
    cv2.line(img, tuple(point_2d[3]), tuple(
        point_2d[8]), color, line_width, cv2.LINE_AA)
    
    
def head_pose_points(img, rotation_vector, translation_vector, camera_matrix):
    """
    Get the points to estimate head pose sideways    

    Parameters
    ----------
    img : np.unit8
        Original Image.
    rotation_vector : Array of float64
        Rotation Vector obtained from cv2.solvePnP
    translation_vector : Array of float64
        Translation Vector obtained from cv2.solvePnP
    camera_matrix : Array of float64
        The camera matrix

    Returns
    -------
    (x, y) : tuple
        Coordinates of line to estimate head pose

    """
    rear_size = 1
    rear_depth = 0
    front_size = img.shape[1]
    front_depth = front_size*2
    val = [rear_size, rear_depth, front_size, front_depth]
    point_2d = get_2d_points(img, rotation_vector, translation_vector, camera_matrix, val)
    y = (point_2d[5] + point_2d[8])//2
    x = point_2d[2]
    
    return (x, y)
    
face_model = get_face_detector()
landmark_model = get_landmark_model()

font = cv2.FONT_HERSHEY_SIMPLEX 
# 3D model points.
model_points = np.array([
                            (0.0, 0.0, 0.0),             # Nose tip
                            (0.0, -330.0, -65.0),        # Chin
                            (-225.0, 170.0, -135.0),     # Left eye left corner
                            (225.0, 170.0, -135.0),      # Right eye right corne
                            (-150.0, -150.0, -125.0),    # Left Mouth corner
                            (150.0, -150.0, -125.0)      # Right mouth corner
                        ])

def detect_head_pose(frame):
    """
    Detect head pose from a single frame
    
    Parameters
    ----------
    frame : np.array
        Input frame from video/webcam
        
    Returns
    -------
    tuple
        (processed_frame, head_pose_results)
    """
    # Initialize camera matrix
    size = frame.shape
    focal_length = size[1]
    center = (size[1]/2, size[0]/2)
    camera_matrix = np.array(
                        [[focal_length, 0, center[0]],
                        [0, focal_length, center[1]],
                        [0, 0, 1]], dtype = "double"
                        )

    head_pose_results = {
        'angles': None,
        'direction': None
    }

    faces = find_faces(frame, face_model)
    for face in faces:
        marks = detect_marks(frame, landmark_model, face)
        image_points = np.array([
                                marks[30],     # Nose tip
                                marks[8],      # Chin
                                marks[36],     # Left eye left corner
                                marks[45],     # Right eye right corner
                                marks[48],     # Left Mouth corner
                                marks[54]      # Right mouth corner
                            ], dtype="double")
        
        dist_coeffs = np.zeros((4,1))
        (success, rotation_vector, translation_vector) = cv2.solvePnP(model_points, 
                                                                    image_points, 
                                                                    camera_matrix, 
                                                                    dist_coeffs, 
                                                                    flags=cv2.SOLVEPNP_UPNP)

        # Draw face points and lines
        (nose_end_point2D, _) = cv2.projectPoints(np.array([(0.0, 0.0, 1000.0)]), 
                                                 rotation_vector, 
                                                 translation_vector, 
                                                 camera_matrix, 
                                                 dist_coeffs)
        
        p1 = (int(image_points[0][0]), int(image_points[0][1]))
        p2 = (int(nose_end_point2D[0][0][0]), int(nose_end_point2D[0][0][1]))
        x1, x2 = head_pose_points(frame, rotation_vector, translation_vector, camera_matrix)

        cv2.line(frame, p1, p2, (0, 255, 255), 2)
        cv2.line(frame, tuple(x1), tuple(x2), (255, 255, 0), 2)

        try:
            m = (p2[1] - p1[1])/(p2[0] - p1[0])
            ang1 = int(math.degrees(math.atan(m)))
        except:
            ang1 = 90
            
        try:
            m = (x2[1] - x1[1])/(x2[0] - x1[0])
            ang2 = int(math.degrees(math.atan(-1/m)))
        except:
            ang2 = 90

        direction = None
        if ang1 >= 48:
            direction = 'Head down'
            print(direction)
            cv2.putText(frame, 'Head down', (30, 30), font, 2, (255, 255, 128), 3)
        elif ang1 <= -48:
            direction = 'Head up'
            print(direction)
            cv2.putText(frame, 'Head up', (30, 30), font, 2, (255, 255, 128), 3)
        elif ang2 >= 48:
            direction = 'Head right'
            print(direction)
            cv2.putText(frame, 'Head right', (90, 30), font, 2, (255, 255, 128), 3)
        elif ang2 <= -48:
            direction = 'Head left'
            print(direction)
            cv2.putText(frame, 'Head left', (90, 30), font, 2, (255, 255, 128), 3)

        head_pose_results['angles'] = (ang1, ang2)
        head_pose_results['direction'] = direction
    print(head_pose_results)
    return frame, head_pose_results