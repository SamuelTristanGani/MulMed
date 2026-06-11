import "../components/WayangRig.css";
import { useEffect, useMemo, useState } from "react";
import {
  ANIMATIONS,
  buildRigPoseAtTime,
  buildRigPoseForGestureAtTime,
} from "../components/WayangAnimations";

// initialize RigTest
export default function RigTest() {
  const gestureIds = useMemo(() => Object.keys(ANIMATIONS), []);

  // =====================
  // Debug configuration
  // =====================
  // Choose which designed gesture to debug.
  // - When locked, it loops that gesture’s idle/loop animation.
  // - Set to null to autoplay the full macro timeline.
  const POSE_DEBUG = "strike"; // "bow" | "strike" | "tremble" | "speak" | null

  const isLocked = Boolean(POSE_DEBUG && gestureIds.includes(POSE_DEBUG));

  const [poseId, setPoseId] = useState(
    isLocked ? POSE_DEBUG : gestureIds[0] || "bow"
  );

  const [rot, setRot] = useState(() => ANIMATIONS[poseId]);

  useEffect(() => {
    let rafId;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;

      if (isLocked) {
        const { pose } = buildRigPoseForGestureAtTime(POSE_DEBUG, elapsed);
        setRot(pose);
        setPoseId(POSE_DEBUG);
      } else {
        const { poseId: nextPoseId, pose } = buildRigPoseAtTime(elapsed);
        setPoseId(nextPoseId);
        setRot(pose);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isLocked, POSE_DEBUG, gestureIds]);

  return (
    <div className="body">
      <div
        className="left-upper"
        style={{ transform: `rotate(${rot.leftUpper}deg)` }}
        aria-label="left upper arm"
      >
        <div
          className="left-lower"
          style={{ transform: `rotate(${rot.leftLower}deg)` }}
          aria-label="left lower arm"
        />
      </div>

      <div
        className="right-upper"
        style={{ transform: `rotate(${rot.rightUpper}deg)` }}
        aria-label="right upper arm"
      >
        <div
          className="right-lower"
          style={{ transform: `rotate(${rot.rightLower}deg)` }}
          aria-label="right lower arm"
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: -24,
          fontSize: 14,
          color: "#000",
          fontWeight: 600,
        }}
      >
        {isLocked ? `DEBUG: ${poseId}` : `TIMELINE: ${poseId}`}
      </div>
    </div>
  );
}

