"""
ReBuild Offline Pose Replay & Biomechanical Analysis Tool
Uses OpenCV and MediaPipe (Python) to process recorded exercise video files
or landmark sequences offline, validating rep counts and form evaluations.

Usage:
    python replay_pose.py --video sample_knee_extension.mp4 --exercise seated_knee_extension
"""

import sys
import os
import json
import argparse
import math
from typing import Tuple, List, Dict, Any

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.rehab.evaluator import calculate_angle_3p, RepCounterStateMachine

def replay_video(video_path: str, exercise_id: str = "seated_knee_extension"):
    try:
        import cv2
        import mediapipe as mp
    except ImportError:
        print("[!] OpenCV or MediaPipe Python not installed.")
        print("    Install with: pip install opencv-python mediapipe")
        print("    Running synthetic mathematical replay test instead...\n")
        replay_synthetic_angles()
        return

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"[!] Cannot open video file: {video_path}")
        return

    sm = RepCounterStateMachine(
        start_angle=90.0,
        target_angle=170.0,
        angle_tolerance=12.0,
        min_duration_s=1.8,
        max_duration_s=7.0
    )

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_idx = 0

    print(f"[*] Replaying video: {video_path} (FPS: {fps:.1f})")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        timestamp_s = frame_idx / fps
        frame_idx += 1

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb)

        if results.pose_landmarks:
            lm = results.pose_landmarks.landmark
            # Extract landmarks for Seated Knee Extension (Hip: 23, Knee: 25, Ankle: 27)
            hip = (lm[mp_pose.PoseLandmark.LEFT_HIP.value].x, lm[mp_pose.PoseLandmark.LEFT_HIP.value].y)
            knee = (lm[mp_pose.PoseLandmark.LEFT_KNEE.value].x, lm[mp_pose.PoseLandmark.LEFT_KNEE.value].y)
            ankle = (lm[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, lm[mp_pose.PoseLandmark.LEFT_ANKLE.value].y)

            angle = calculate_angle_3p(hip, knee, ankle)
            res = sm.process_frame(angle, timestamp_s)

            if res.get("rep_event"):
                print(f"[{timestamp_s:.2f}s] Event: {res['rep_event'].upper()} | Valid Reps: {res['reps_valid']} | Angle: {angle:.1f}°")

    cap.release()
    pose.close()
    print(f"\n[+] Video Replay Finished: {sm.reps_valid}/{sm.reps_attempted} valid repetitions detected.")

def replay_synthetic_angles():
    """Generates synthetic joint angle trajectory for testing the state machine."""
    sm = RepCounterStateMachine(
        start_angle=90.0,
        target_angle=170.0,
        angle_tolerance=12.0,
        min_duration_s=1.8,
        max_duration_s=7.0
    )

    print("[*] Simulating synthetic seated knee extension repetitions...")
    time_step = 0.1
    t = 0.0

    # Simulate 3 clean reps
    for rep in range(3):
        print(f"\n--- Starting Rep {rep + 1} ---")
        # Extension phase (90 -> 170 deg over 1.5s)
        for i in range(15):
            angle = 90.0 + (i / 14.0) * 80.0
            res = sm.process_frame(angle, t)
            t += time_step

        # Hold at extension for 0.5s
        for _ in range(5):
            res = sm.process_frame(170.0, t)
            t += time_step

        # Return phase (170 -> 90 deg over 1.5s)
        for i in range(15):
            angle = 170.0 - (i / 14.0) * 80.0
            res = sm.process_frame(angle, t)
            t += time_step
            if res.get("rep_event") == "valid_rep":
                print(f"Rep {rep + 1} completed successfully! Total valid: {res['reps_valid']}")

    print(f"\n[+] Synthetic Replay Complete: {sm.reps_valid}/{sm.reps_attempted} repetitions verified.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MoveSafe Offline Pose Replay Tool")
    parser.add_argument("--video", type=str, default="", help="Path to video file")
    parser.add_argument("--exercise", type=str, default="seated_knee_extension", help="Exercise ID")
    args = parser.parse_args()

    if args.video and os.path.exists(args.video):
        replay_video(args.video, args.exercise)
    else:
        replay_synthetic_angles()
