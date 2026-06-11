// Base limb poses (angles in degrees) for each gesture.
// These are the “design” poses.
// Idle motion / looping behavior is layered by the functions below.
export const ANIMATIONS = {
  // Bow: slight natural sway around these base angles.
  bow: {
    leftUpper: 20,
    leftLower: 15,
    rightUpper: -40,
    rightLower: 150,
  },

  // Strike: base striking shape.
  // The timeline/loop decides which hand is actually “going forward”.
  strike: {
    leftUpper: 20,
    leftLower: -90,
    rightUpper: -70,
    rightLower: -30,
  },

  // Tremble: base tremble shape.
  tremble: {
    leftUpper: 4,
    leftLower: -4,
    rightUpper: -4,
    rightLower: 4,
  },

  // Speak: base “speaking / waving” shape.
  speak: {
    leftUpper: 15,
    leftLower: 20,
    rightUpper: -15,
    rightLower: -20,
  },
};

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Looping macro driver.
 * Returns the rig pose for the given elapsed time.
 * all animations are sorted in this elapsed time
 *
 * Timeline feel (tweak values to taste):
 * - 0..1300ms: bow (with sway)
 * - 1300..2900ms: tremble (with jitter)
 * - 2900..4300ms: speak (with wave)
 * - 4300..end: strike (alternating hand forward strikes)
 */

export function buildRigPoseAtTime(elapsedMs) {
  const STRIKE_CYCLE_MS = 1200; // alternates striking side every 1.2s
  const STRIKE_PUNCH_MS = 320; // portion of cycle used for forward “punch” motion

  const macroCycleMs = 5200;
  const macroPhase = elapsedMs % macroCycleMs;

  // Which designed gesture is active for this macro phase
  let poseId;
  if (macroPhase < 1300) poseId = "bow";
  else if (macroPhase < 2900) poseId = "tremble";
  else if (macroPhase < 4300) poseId = "speak";
  else poseId = "strike";

  // Base angles for each gesture
  const baseBow = ANIMATIONS.bow;
  const baseTremble = ANIMATIONS.tremble;
  const baseSpeak = ANIMATIONS.speak;
  const baseStrike = ANIMATIONS.strike;

  // Alternating strike side
  const rightIsStriking = Math.floor(elapsedMs / STRIKE_CYCLE_MS) % 2 === 0;

  // Build the target pose with layered idle motion
  let target = { ...baseBow };

  if (poseId === "bow") {
    // Natural sway to make bow feel alive
    const sway = Math.sin(elapsedMs / 900) * 4;
    target = {
      ...baseBow,
      leftUpper: baseBow.leftUpper + sway,
      rightUpper: baseBow.rightUpper - sway,
      leftLower: baseBow.leftLower + sway * 0.5,
      rightLower: baseBow.rightLower - sway * 0.5,
    };
  } else if (poseId === "tremble") {
    // Tremble jitter
    const wob = Math.sin(elapsedMs / 180) * 2;
    target = {
      ...baseTremble,
      leftUpper: baseTremble.leftUpper + wob,
      leftLower: baseTremble.leftLower - wob,
      rightUpper: baseTremble.rightUpper - wob,
      rightLower: baseTremble.rightLower + wob,
    };
  } else if (poseId === "speak") {
    // Speak wave
    const wave = Math.sin(elapsedMs / 650) * 3;
    target = {
      ...baseSpeak,
      leftUpper: baseSpeak.leftUpper + wave,
      rightUpper: baseSpeak.rightUpper - wave,
      leftLower: baseSpeak.leftLower + wave * 0.6,
      rightLower: baseSpeak.rightLower - wave * 0.6,
    };
  } else {
    // Strike phase: alternate which side goes forward.
    const phaseInStrike = elapsedMs % STRIKE_CYCLE_MS;
    const punchT = Math.min(1, Math.max(0, phaseInStrike / STRIKE_PUNCH_MS));
    const eased = punchT * punchT * (3 - 2 * punchT);

    // Idle pose for the non-striking hand
    const idle = {
      ...baseTremble,
      leftUpper: baseTremble.leftUpper + Math.sin(elapsedMs / 140) * 2,
      leftLower: baseTremble.leftLower + Math.sin(elapsedMs / 160) * 1.5,
      rightUpper: baseTremble.rightUpper - Math.sin(elapsedMs / 140) * 2,
      rightLower: baseTremble.rightLower - Math.sin(elapsedMs / 160) * 1.5,
    };

    if (rightIsStriking) {
      // Right goes forward, left stays closer to bow+idle
      target = {
        ...baseBow,
        leftUpper: lerp(baseBow.leftUpper, idle.leftUpper, 0.6),
        leftLower: lerp(baseBow.leftLower, idle.leftLower, 0.6),
        rightUpper: lerp(baseBow.rightUpper, baseStrike.rightUpper, eased),
        rightLower: lerp(baseBow.rightLower, baseStrike.rightLower, eased),
      };
    } else {
      // Left goes forward
      target = {
        ...baseBow,
        leftUpper: lerp(baseBow.leftUpper, baseStrike.leftUpper, eased),
        leftLower: lerp(baseBow.leftLower, baseStrike.leftLower, eased),
        rightUpper: lerp(baseBow.rightUpper, idle.rightUpper, 0.6),
        rightLower: lerp(baseBow.rightLower, idle.rightLower, 0.6),
      };
    }
  }

  return { poseId, pose: target };
}

/**
 * Single gesture loop driver (for debugging).
 *
 * - If gestureId is bow/tremble/speak: it loops only that gesture’s idle motion.
 * - If gestureId is strike: it loops strike and alternates hands going forward.
 */
export function buildRigPoseForGestureAtTime(gestureId, elapsedMs) {
  if (!ANIMATIONS[gestureId]) {
    return { poseId: "unknown", pose: ANIMATIONS.bow };
  }

  const baseBow = ANIMATIONS.bow;
  const baseTremble = ANIMATIONS.tremble;
  const baseSpeak = ANIMATIONS.speak;
  const baseStrike = ANIMATIONS.strike;

  if (gestureId === "bow") {
    const sway = Math.sin(elapsedMs / 900) * 4;
    return {
      poseId: "bow",
      pose: {
        ...baseBow,
        leftUpper: baseBow.leftUpper + sway,
        rightUpper: baseBow.rightUpper - sway,
        leftLower: baseBow.leftLower + sway * 0.5,
        rightLower: baseBow.rightLower - sway * 0.5,
      },
    };
  }

  if (gestureId === "tremble") {
    const wob = Math.sin(elapsedMs / 180) * 2;
    return {
      poseId: "tremble",
      pose: {
        ...baseTremble,
        leftUpper: baseTremble.leftUpper + wob,
        leftLower: baseTremble.leftLower - wob,
        rightUpper: baseTremble.rightUpper - wob,
        rightLower: baseTremble.rightLower + wob,
      },
    };
  }

  if (gestureId === "speak") {
    const wave = Math.sin(elapsedMs / 650) * 3;
    return {
      poseId: "speak",
      pose: {
        ...baseSpeak,
        leftUpper: baseSpeak.leftUpper + wave,
        rightUpper: baseSpeak.rightUpper - wave,
        leftLower: baseSpeak.leftLower + wave * 0.6,
        rightLower: baseSpeak.rightLower - wave * 0.6,
      },
    };
  }

  // gestureId === "strike"
  const STRIKE_CYCLE_MS = 1200;
  const STRIKE_PUNCH_MS = 320;

  const rightIsStriking = Math.floor(elapsedMs / STRIKE_CYCLE_MS) % 2 === 0;

  const phaseInStrike = elapsedMs % STRIKE_CYCLE_MS;
  const punchT = Math.min(1, Math.max(0, phaseInStrike / STRIKE_PUNCH_MS));
  const eased = punchT * punchT * (3 - 2 * punchT);

  // Idle pose for the non-striking hand
  const idle = {
    ...baseTremble,
    leftUpper: baseTremble.leftUpper + Math.sin(elapsedMs / 140) * 2,
    leftLower: baseTremble.leftLower + Math.sin(elapsedMs / 160) * 1.5,
    rightUpper: baseTremble.rightUpper - Math.sin(elapsedMs / 140) * 2,
    rightLower: baseTremble.rightLower - Math.sin(elapsedMs / 160) * 1.5,
  };

  if (rightIsStriking) {
    return {
      poseId: "strike",
      pose: {
        ...baseBow,
        leftUpper: lerp(baseBow.leftUpper, idle.leftUpper, 0.6),
        leftLower: lerp(baseBow.leftLower, idle.leftLower, 0.6),
        rightUpper: lerp(baseBow.rightUpper, baseStrike.rightUpper, eased),
        rightLower: lerp(baseBow.rightLower, baseStrike.rightLower, eased),
      },
    };
  }

  return {
    poseId: "strike",
    pose: {
      ...baseBow,
      leftUpper: lerp(baseBow.leftUpper, baseStrike.leftUpper, eased),
      leftLower: lerp(baseBow.leftLower, baseStrike.leftLower, eased),
      rightUpper: lerp(baseBow.rightUpper, idle.rightUpper, 0.6),
      rightLower: lerp(baseBow.rightLower, idle.rightLower, 0.6),
    },
  };
}

