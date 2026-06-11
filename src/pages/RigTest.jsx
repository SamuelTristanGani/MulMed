import "../components/WayangRig.css";
import { useEffect, useMemo, useState } from "react";
import {
  ANIMATIONS,
  buildRigPoseAtTime,
  buildRigPoseForGestureAtTime,
} from "../components/WayangAnimations";

import WayangRig from "../components/WayangRig";

// initialize RigTest
export default function RigTest() {
  const gestureIds = useMemo(() => Object.keys(ANIMATIONS), []);

  // =====================
  // Debug configuration
  // =====================
  // Choose which designed gesture to debug.
  // - When locked, it loops that gesture’s idle/loop animation.
  // - Set to null to autoplay the full macro timeline.
  // For alignment debugging:
  // - set POSE_DEBUG to "strike" etc to reproduce detachment
  // - set to null to see the full macro timeline
  // - if you suspect neutral detachment, temporarily force pose angles to 0 by setting POSE_DEBUG and overriding rotations in the component.
  const POSE_DEBUG = "tremble"; // "bow" | "strike" | "tremble" | "speak" | null

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
        className="rig-viewport"
        aria-label="WayangRig debug viewport"
        style={{ position: "relative", width: 128, height: 150, margin: "auto"}}
      >
        <WayangRig
          leftUpperRotation={rot.leftUpper}
          leftLowerRotation={rot.leftLower}
          rightUpperRotation={rot.rightUpper}
          rightLowerRotation={rot.rightLower}
        />

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -24,
            fontSize: 14,
            color: "#000",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {isLocked ? `DEBUG: ${poseId}` : `TIMELINE: ${poseId}`}
        </div>
      </div>
    </div>
  );
}

