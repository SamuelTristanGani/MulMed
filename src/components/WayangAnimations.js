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

  // Strike (now a looping right-arm punch).
  // These are the RIGHT-arm driven base angles.
  // Left arm will remain near tremble/speaking base and bend subtly in response.
  strike: {
    leftUpper: 20,
    leftLower: -20,
    rightUpper: -85,
    rightLower: -140,
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
const smoothstep = (t) => t * t * (3 - 2 * t); // assumes t in [0,1]

/**
 * Looping macro driver.
 * Returns the rig pose for the given elapsed time.
 */
export function buildRigPoseAtTime(elapsedMs) {
  // Strike/timeline is no longer an alternating “strike side” animation.
  // The full macro loop now cycles through bow/tremble/speak and ends on “strike”
  // which is the looping right-arm punch.
  const STRIKE_CYCLE_MS = 1200;

  const macroCycleMs = 5200;
  const macroPhase = elapsedMs % macroCycleMs;


  // Which designed gesture is active for this macro phase
  let poseId;
  if (macroPhase < 1300) poseId = "bow";
  else if (macroPhase < 2900) poseId = "tremble";
  else if (macroPhase < 4300) poseId = "speak";
  else poseId = "strike";

  const baseBow = ANIMATIONS.bow;
  const baseTremble = ANIMATIONS.tremble;
  const baseSpeak = ANIMATIONS.speak;
  const baseStrike = ANIMATIONS.strike;

  // Fixed punch: drive ONLY the RIGHT arm in a loop.
  // Left arm bends subtly in response.
  let target = { ...baseBow };



  if (poseId === "bow") {
    const sway = Math.sin(elapsedMs / 900) * 4;
    target = {
      ...baseBow,
      leftUpper: baseBow.leftUpper + sway,
      rightUpper: baseBow.rightUpper - sway,
      leftLower: baseBow.leftLower + sway * 0.5,
      rightLower: baseBow.rightLower - sway * 0.5,
    };
  } else if (poseId === "tremble") {
    const wob = Math.sin(elapsedMs / 180) * 2;
    target = {
      ...baseTremble,
      leftUpper: baseTremble.leftUpper + wob,
      leftLower: baseTremble.leftLower - wob,
      rightUpper: baseTremble.rightUpper - wob,
      rightLower: baseTremble.rightLower + wob,
    };
  } else if (poseId === "speak") {
    const wave = Math.sin(elapsedMs / 650) * 3;
    target = {
      ...baseSpeak,
      leftUpper: baseSpeak.leftUpper + wave,
      rightUpper: baseSpeak.rightUpper - wave,
      leftLower: baseSpeak.leftLower + wave * 0.6,
      rightLower: baseSpeak.rightLower - wave * 0.6,
    };
  } else {
    // Strike phase: fixed looping RIGHT-arm punch.
    const FORWARD_MS = 220;
    const REST_MS = STRIKE_CYCLE_MS;

    const phaseInStrike = elapsedMs % STRIKE_CYCLE_MS;

    const forwardT = Math.min(1, Math.max(0, phaseInStrike / FORWARD_MS));
    const forwardEased = smoothstep(forwardT);

    const retractDen = REST_MS - FORWARD_MS;
    const retractT =
      retractDen <= 0
        ? 1
        : Math.min(1, Math.max(0, (phaseInStrike - FORWARD_MS) / retractDen));
    const retractEased = smoothstep(retractT);

    // amplitude: 0->1 during forward, 1->0 during retract
    const amp = forwardEased * (1 - retractEased);

    // Left-arm response (subtle counter-bend)
    // When right punches forward, left upper tilts down slightly and left lower bends.
    const leftUpperBend = Math.sin(amp * Math.PI) * -6; // ~[-6..0]
    const leftLowerBend = Math.sin(amp * Math.PI) * -10; // ~[-10..0]

    // Right-arm punch: approach baseStrike, then relax smoothly.
    const rightUpper = lerp(baseBow.rightUpper, baseStrike.rightUpper, amp);
    const rightLower = lerp(baseBow.rightLower, baseStrike.rightLower, amp);

    target = {
      ...baseBow,
      leftUpper: baseBow.leftUpper + leftUpperBend,
      leftLower: baseBow.leftLower + leftLowerBend,
      rightUpper,
      rightLower,
    };
  }


  return { poseId, pose: target };
}

/**
 * Single gesture loop driver (for debugging).
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
  // Looping RIGHT-arm punch + subtle left-arm response.
  const STRIKE_CYCLE_MS = 1200;
  const FORWARD_MS = 220;

  const phaseInStrike = elapsedMs % STRIKE_CYCLE_MS;

  const forwardT = Math.min(1, Math.max(0, phaseInStrike / FORWARD_MS));
  const forwardEased = smoothstep(forwardT);

  const retractT =
    phaseInStrike <= FORWARD_MS
      ? 0
      : Math.min(1, Math.max(0, (phaseInStrike - FORWARD_MS) / (STRIKE_CYCLE_MS - FORWARD_MS)));
  const retractEased = smoothstep(retractT);

  const amp = forwardEased * (1 - retractEased);

  // Left-arm response (subtle counter-bend)
  const leftUpperBend = Math.sin(amp * Math.PI) * -6; // ~[-6..0]
  const leftLowerBend = Math.sin(amp * Math.PI) * -10; // ~[-10..0]

  // Right-arm punch
  const rightUpper = lerp(baseBow.rightUpper, baseStrike.rightUpper, amp);
  const rightLower = lerp(baseBow.rightLower, baseStrike.rightLower, amp);

  return {
    poseId: "strike",
    pose: {
      ...baseBow,
      leftUpper: baseBow.leftUpper + leftUpperBend,
      leftLower: baseBow.leftLower + leftLowerBend,
      rightUpper,
      rightLower,
    },
  }; 


}

