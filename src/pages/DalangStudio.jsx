import { useEffect, useMemo, useRef, useState } from "react";
import Nav from "../components/Nav";
import { wayangTypes } from "../data/wayang";
import { characterImages, typeImages } from "../data/images";
import { studioMoods, studioScenes } from "../data/studioScenes";
import { useAudio } from "../audio/AudioContext";
import "./DalangStudio.css";

import WayangRig from "../components/WayangRig";
import { ANIMATIONS, buildRigPoseForGestureAtTime } from "../components/WayangAnimations";

function HanomanRigSlot({ gesture }) {
  const [rot, setRot] = useState(() => ANIMATIONS.tremble);

  useEffect(() => {
    let rafId;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const gestureId = gesture && gesture !== "still" ? gesture : "tremble";
      const { pose } = buildRigPoseForGestureAtTime(gestureId, elapsed);
      setRot(pose);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [gesture]);

  return (
    <div
      className="hanoman-rig-viewport"
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <WayangRig
        leftUpperRotation={rot.leftUpper}
        leftLowerRotation={rot.leftLower}
        rightUpperRotation={rot.rightUpper}
        rightLowerRotation={rot.rightLower}
      />
    </div>
  );
}


const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const gestureOptions = [
  { id: "bow", label: "Bow", meaning: "Respect and restraint" },
  { id: "speak", label: "Speak", meaning: "Command attention" },
  { id: "strike", label: "Strike", meaning: "Force and conflict" },
  { id: "tremble", label: "Tremble", meaning: "Fear or uncertainty" },
];

function getStagePoint(event, stage) {
  const rect = stage.getBoundingClientRect();
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92),
    y: clamp(((rect.bottom - event.clientY) / rect.height) * 100, 8, 58),
  };
}

function getCharacterMap() {
  return wayangTypes
    .flatMap((type) =>
      type.characters.map((character) => ({
        ...character,
        typeId: type.id,
        typeName: type.name,
      }))
    )
    .reduce((map, character) => {
      map[character.id] = character;
      return map;
    }, {});
}

function getDirectorProfile(decisions, usedGestures, moodChanges) {
  const choiceIds = Object.values(decisions);
  const reflectiveChoices = choiceIds.filter((id) =>
    ["quiet", "empathy"].includes(id)
  ).length;
  const forcefulChoices = choiceIds.filter((id) =>
    ["defiant", "urgency"].includes(id)
  ).length;
  const expressiveActions = usedGestures.length + moodChanges;

  if (reflectiveChoices > forcefulChoices) {
    return {
      title: "The Reflective Dalang",
      description:
        "You direct through stillness, empathy, and carefully controlled movement.",
      accent: "wisdom",
    };
  }

  if (forcefulChoices > reflectiveChoices) {
    return {
      title: "The Dramatic Dalang",
      description:
        "You build urgency through confrontation, momentum, and decisive staging.",
      accent: "battle",
    };
  }

  if (expressiveActions >= 5) {
    return {
      title: "The Expressive Dalang",
      description:
        "You use movement, atmosphere, and gesture to make every cue visible.",
      accent: "victory",
    };
  }

  return {
    title: "The Keeper of Balance",
    description:
      "You let composition, story, and moral meaning support one another.",
    accent: "devotion",
  };
}

function PerformanceReplay({
  scene,
  charactersById,
  performance,
  profile,
  onClose,
  onReplay,
}) {
  const [beatIndex, setBeatIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const beat = performance[beatIndex];

  useEffect(() => {
    if (!playing || performance.length < 2) return undefined;
    const timer = window.setTimeout(() => {
      if (beatIndex === performance.length - 1) {
        setPlaying(false);
      } else {
        setBeatIndex((index) => index + 1);
      }
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [beatIndex, performance.length, playing]);

  if (!beat) return null;

  return (
    <div className="performance-overlay" role="dialog" aria-modal="true" aria-label="Your Wayang performance">
      <div className="performance-shell">
        <div className="performance-topbar">
          <div>
            <span className="panel-kicker">Your completed lakon</span>
            <h2>{scene.title}</h2>
          </div>
          <button className="performance-close" onClick={onClose} aria-label="Close performance">
            &times;
          </button>
        </div>

        <div className={`performance-stage mood-${beat.mood} ${beat.shadowMode ? "shadow-mode" : ""}`}>
          <div className="performance-screen">
            <span className="performance-lamp" />
            {scene.characters.map((id) => {
              const character = charactersById[id];
              const position = beat.positions[id];
              const gesture = beat.gestures[id];
              return (
                <div
                  key={id}
                  className={`performance-puppet ${position.flip ? "flip" : ""} gesture-${gesture || "still"}`}
                  style={{
                    left: `${position.x}%`,
                    bottom: `${position.y}%`,
                    "--puppet-scale": position.scale,
                  }}
                >
                  <img src={characterImages[id]} alt={character.name} />
                  <span>{character.name}</span>
                </div>
              );
            })}
            <div className="performance-subtitle" key={`${beatIndex}-${beat.title}`}>
              <span>Cue {beatIndex + 1} of {performance.length}</span>
              <p>{beat.narration}</p>
              {beat.interpretation && <strong>{beat.interpretation}</strong>}
            </div>
          </div>
        </div>

        <div className="performance-footer">
          <div className={`director-profile profile-${profile.accent}`}>
            <span>Your interpretation</span>
            <strong>{profile.title}</strong>
            <p>{profile.description}</p>
          </div>
          <div className="performance-controls">
            <div className="performance-timeline">
              {performance.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  className={index === beatIndex ? "active" : ""}
                  onClick={() => {
                    setBeatIndex(index);
                    setPlaying(false);
                  }}
                  aria-label={`Show cue ${index + 1}: ${item.title}`}
                />
              ))}
            </div>
            <button
              className="control-btn"
              onClick={() => {
                setBeatIndex(0);
                setPlaying(true);
              }}
            >
              Play Again
            </button>
            <button className="btn-primary" onClick={onReplay}>
              Direct Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DalangStudio() {
  const { playSfx } = useAudio();
  const charactersById = useMemo(() => getCharacterMap(), []);
  const [sceneId, setSceneId] = useState(studioScenes[0].id);
  const scene = studioScenes.find((item) => item.id === sceneId) || studioScenes[0];
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedCharacterId, setSelectedCharacterId] = useState(scene.characters[0]);
  const [positions, setPositions] = useState(scene.initialPositions);
  const [shadowMode, setShadowMode] = useState(true);
  const [activeMood, setActiveMood] = useState(scene.defaultMood);
  const [failedImages, setFailedImages] = useState({});
  const [decisions, setDecisions] = useState({});
  const [gestures, setGestures] = useState({});
  const [usedGestures, setUsedGestures] = useState([]);
  const [moodChanges, setMoodChanges] = useState(0);
  const [performance, setPerformance] = useState([]);
  const [showPerformance, setShowPerformance] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wayang-studio-badges") || "[]");
    } catch {
      return [];
    }
  });

  const stageRef = useRef(null);
  const dragging = useRef(null);

  const currentStep = scene.steps[stepIndex];
  const selectedCharacter = charactersById[selectedCharacterId];
  const selectedPosition = positions[selectedCharacterId];
  const stageImage = typeImages[scene.typeId];
  const progress = ((stepIndex + 1) / scene.steps.length) * 100;
  const isFinalStep = stepIndex === scene.steps.length - 1;
  const decisionKey = `${scene.id}-${stepIndex}`;
  const selectedDecisionId = decisions[decisionKey];
  const selectedDecision = currentStep.decision?.choices.find(
    (choice) => choice.id === selectedDecisionId
  );
  const decisionComplete = !currentStep.decision || Boolean(selectedDecisionId);
  const stepTargets = currentStep.targets || [];
  const targetChecks = stepTargets.map((target) => {
    const position = positions[target.character];
    const distance = position
      ? Math.hypot(position.x - target.x, position.y - target.y)
      : Number.POSITIVE_INFINITY;

    return {
      target,
      complete: distance <= (target.tolerance || 8),
    };
  });
  const targetNames = targetChecks
    .map(({ target }) => charactersById[target.character]?.name || target.character)
    .join(", ");
  const targetsComplete =
    targetChecks.length === 0 || targetChecks.every((check) => check.complete);
  const shadowRequirementMet =
    typeof currentStep.requiresShadowMode !== "boolean" ||
    shadowMode === currentStep.requiresShadowMode;
  const moodRequirementMet = !currentStep.mood || activeMood === currentStep.mood;
  const requiredGesture = currentStep.requiredGesture;
  const gestureRequirementMet =
    !requiredGesture || gestures[requiredGesture.character] === requiredGesture.gesture;
  const requiredGestureCharacter = requiredGesture
    ? charactersById[requiredGesture.character]?.name || requiredGesture.character
    : "";
  const requiredMoodLabel = currentStep.mood
    ? studioMoods[currentStep.mood]?.label || currentStep.mood
    : "";
  const requiredGestureLabel = requiredGesture
    ? gestureOptions.find((gesture) => gesture.id === requiredGesture.gesture)?.label ||
      requiredGesture.gesture
    : "";
  const isCurrentStepCorrect =
    targetsComplete &&
    shadowRequirementMet &&
    moodRequirementMet &&
    gestureRequirementMet &&
    decisionComplete;
  const challengeInstruction = [
    !targetsComplete &&
      `Move ${targetNames} into ${targetChecks.length > 1 ? "their glowing targets" : "the glowing target"}.`,
    !moodRequirementMet && `Set the atmosphere to ${requiredMoodLabel}.`,
    !gestureRequirementMet &&
      `Make ${requiredGestureCharacter} perform ${requiredGestureLabel}.`,
    !shadowRequirementMet &&
      (currentStep.requiresShadowMode
        ? "Turn Shadow Play On."
        : "Switch to Normal Photo Mode."),
    !decisionComplete && "Make a storytelling decision.",
  ]
    .filter(Boolean)
    .join(" ");
  const challengeStatus = isCurrentStepCorrect
    ? isFinalStep
      ? "Scene complete."
      : "Correct. Next cue unlocked."
    : challengeInstruction;
  const visibleBadges =
    isFinalStep && isCurrentStepCorrect && !earnedBadges.includes(scene.id)
      ? [...earnedBadges, scene.id]
      : earnedBadges;
  const directorProfile = getDirectorProfile(decisions, usedGestures, moodChanges);

  useEffect(() => {
    const handleMove = (event) => {
      if (!dragging.current || !stageRef.current) return;
      const { id, offsetX, offsetY } = dragging.current;
      const point = getStagePoint(event, stageRef.current);

      setPositions((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          x: clamp(point.x + offsetX, 8, 92),
          y: clamp(point.y + offsetY, 8, 58),
        },
      }));
    };

    const stopDragging = () => {
      dragging.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, []);

  useEffect(() => {
    if (!isFinalStep || !isCurrentStepCorrect || earnedBadges.includes(scene.id)) return;
    const nextBadges = [...earnedBadges, scene.id];
    localStorage.setItem("wayang-studio-badges", JSON.stringify(nextBadges));
  }, [earnedBadges, isCurrentStepCorrect, isFinalStep, scene.id]);

  const handleSceneChange = (id) => {
    const nextScene = studioScenes.find((item) => item.id === id) || studioScenes[0];
    if (isFinalStep && isCurrentStepCorrect && !earnedBadges.includes(scene.id)) {
      setEarnedBadges((badges) => [...badges, scene.id]);
    }
    setSceneId(nextScene.id);
    setStepIndex(0);
    setSelectedCharacterId(nextScene.steps[0]?.focus || nextScene.characters[0]);
    setPositions(nextScene.initialPositions);
    setActiveMood(nextScene.defaultMood);
    setDecisions({});
    setGestures({});
    setUsedGestures([]);
    setMoodChanges(0);
    setPerformance([]);
    setShowPerformance(false);
  };

  const handlePuppetDown = (event, id) => {
    if (!stageRef.current) return;
    event.preventDefault();
    setSelectedCharacterId(id);

    const point = getStagePoint(event, stageRef.current);
    const position = positions[id];
    dragging.current = {
      id,
      offsetX: position.x - point.x,
      offsetY: position.y - point.y,
    };
  };

  const moveSelected = (dx, dy) => {
    if (!selectedCharacterId) return;
    setPositions((prev) => ({
      ...prev,
      [selectedCharacterId]: {
        ...prev[selectedCharacterId],
        x: clamp(prev[selectedCharacterId].x + dx, 8, 92),
        y: clamp(prev[selectedCharacterId].y + dy, 8, 58),
      },
    }));
  };

  const flipSelected = () => {
    if (!selectedCharacterId) return;
    setPositions((prev) => ({
      ...prev,
      [selectedCharacterId]: {
        ...prev[selectedCharacterId],
        flip: !prev[selectedCharacterId].flip,
      },
    }));
  };

  const performGesture = (gesture) => {
    if (!selectedCharacterId) return;
    setGestures((previous) => ({ ...previous, [selectedCharacterId]: gesture }));
    setUsedGestures((previous) =>
      previous.includes(gesture) ? previous : [...previous, gesture]
    );
    playSfx(gesture === "strike" ? "wrong" : "correct");
  };

  const chooseMood = (mood) => {
    if (mood !== activeMood) setMoodChanges((count) => count + 1);
    setActiveMood(mood);
  };

  const chooseDecision = (choiceId) => {
    setDecisions((previous) => ({
      ...previous,
      [decisionKey]: choiceId,
    }));
  };

  const captureBeat = () => {
    const interpretation = selectedDecision
      ? `${selectedDecision.result} ${selectedDecision.insight}`
      : currentStep.learningPoint;

    return {
      title: currentStep.title,
      narration: currentStep.narration,
      interpretation,
      mood: activeMood,
      shadowMode,
      positions: structuredClone(positions),
      gestures: { ...gestures },
    };
  };

  const resetScene = () => {
    setPositions(scene.initialPositions);
    setStepIndex(0);
    setSelectedCharacterId(scene.steps[0]?.focus || scene.characters[0]);
    setActiveMood(scene.defaultMood);
    setDecisions({});
    setGestures({});
    setUsedGestures([]);
    setMoodChanges(0);
    setPerformance([]);
    setShowPerformance(false);
  };

  const goToStep = (direction) => {
    if (direction > 0 && !isCurrentStepCorrect) return;

    const nextIndex = clamp(stepIndex + direction, 0, scene.steps.length - 1);
    if (direction > 0) {
      setPerformance((beats) => [...beats.slice(0, stepIndex), captureBeat()]);
    }
    setStepIndex(nextIndex);
    setSelectedCharacterId(scene.steps[nextIndex]?.focus || scene.characters[0]);
  };

  const watchPerformance = () => {
    if (!isCurrentStepCorrect) return;
    setPerformance((beats) => [...beats.slice(0, stepIndex), captureBeat()]);
    setShowPerformance(true);
    playSfx("correct");
  };

  return (
    <div className="page-container studio-page">
      <Nav />

      <header className="page-header studio-header animate-fade-in-up">
        <span className="badge">Interactive Feature</span>
        <h1>Dalang Studio</h1>
        <p className="page-subtitle">
          Step behind the kelir. Choose a scene, move real wayang character
          images, control the mood, and learn how a dalang turns movement into
          meaning.
        </p>
      </header>

      <section className="studio-shell animate-fade-in-up delay-1">
        <aside className="studio-sidebar">
          <div className="studio-panel">
            <span className="panel-kicker">Choose a lakon</span>
            <div className="scene-options">
              {studioScenes.map((item) => (
                <button
                  key={item.id}
                  className={`scene-option ${item.id === scene.id ? "active" : ""}`}
                  onClick={() => handleSceneChange(item.id)}
                >
                  {typeImages[item.typeId] && (
                    <img src={typeImages[item.typeId]} alt="" loading="lazy" />
                  )}
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.epic}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="studio-panel">
            <span className="panel-kicker">Cast</span>
            <div className="cast-list">
              {scene.characters.map((id) => {
                const character = charactersById[id];
                return (
                  <button
                    key={id}
                    className={`cast-card ${selectedCharacterId === id ? "active" : ""}`}
                    onClick={() => setSelectedCharacterId(id)}
                  >
                    {characterImages[id] && !failedImages[id] ? (
                      <img
                        src={characterImages[id]}
                        alt={character.name}
                        loading="lazy"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [id]: true }))
                        }
                      />
                    ) : (
                      <span className="cast-fallback">{character.name.charAt(0)}</span>
                    )}
                    <span>
                      <strong>{character.name}</strong>
                      <small>{character.title}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="studio-main">
          <div className="studio-toolbar">
            <div>
              <span className="studio-eyebrow">{scene.epic}</span>
              <h2>{scene.title}</h2>
              <p>{scene.setting}</p>
            </div>
            <button
              className={`shadow-toggle ${shadowMode ? "active" : ""}`}
              onClick={() => setShadowMode((value) => !value)}
            >
              {shadowMode ? "Shadow Play On" : "Normal Photo Mode"}
            </button>
          </div>

          <div className="studio-achievements">
            <span className="panel-kicker">Dalang journey</span>
            <div>
              {studioScenes.map((item) => (
                <span key={item.id} className={visibleBadges.includes(item.id) ? "earned" : ""}>
                  <b>{visibleBadges.includes(item.id) ? "Mastered" : "Locked"}</b>
                  {item.title}
                </span>
              ))}
            </div>
          </div>

          <div
            ref={stageRef}
            className={`studio-stage mood-${activeMood} ${shadowMode ? "shadow-mode" : ""}`}
          >
            <div className="stage-lamp" />
            <div className="stage-embers" aria-hidden="true">
              {Array.from({ length: 12 }, (_, index) => (
                <span key={index} style={{ "--ember-index": index }} />
              ))}
            </div>
            <div className="stage-screen">
              {stageImage && (
                <img
                  className="stage-texture"
                  src={stageImage}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="stage-floor" />
              <div className="gunungan-marker">
                <span>Gunungan</span>
              </div>

              {targetChecks.map(({ target, complete }) => {
                const targetCharacter = charactersById[target.character];

                return (
                  <div
                    key={`${currentStep.title}-${target.character}`}
                    className={`stage-target ${complete ? "complete" : ""}`}
                    style={{
                      left: `${target.x}%`,
                      bottom: `${target.y}%`,
                    }}
                    aria-hidden="true"
                  >
                    <span className="target-ring" />
                    <span className="target-label">
                      {complete ? "Correct" : target.label || targetCharacter?.name}
                    </span>
                  </div>
                );
              })}

              {scene.characters.map((id) => {
                const character = charactersById[id];
                const position = positions[id];
                const isSelected = selectedCharacterId === id;
                const isFocused = currentStep?.focus === id;
                const hasImage = characterImages[id] && !failedImages[id];

                const gesture = gestures[id] || "still";

                return (
                  <button
                    key={id}
                    className={`stage-puppet ${isSelected ? "selected" : ""} ${isFocused ? "focused" : ""} ${position.flip ? "flip" : ""} gesture-${gesture}`}
                    style={{
                      left: `${position.x}%`,
                      bottom: `${position.y}%`,
                      "--puppet-scale": position.scale,
                    }}
                    onPointerDown={(event) => handlePuppetDown(event, id)}
                    onClick={() => setSelectedCharacterId(id)}
                    aria-label={`Move ${character.name}`}
                  >
                    <span className="puppet-frame">
                      {hasImage ? (
                        id === "hanoman" ? (
                          <HanomanRigSlot gesture={gesture} />
                        ) : (
                          <img
                            src={characterImages[id]}
                            alt={character.name}
                            draggable="false"
                            loading="lazy"
                            decoding="async"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [id]: true }))
                            }
                          />
                        )
                      ) : (
                        <span className="puppet-fallback">{character.name}</span>
                      )}
                    </span>
                    <span className="puppet-label">{character.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="studio-controls-grid">
            <section className="studio-panel cue-panel">
              <div className="cue-topline">
                <span>Scene {stepIndex + 1} of {scene.steps.length}</span>
                <div className="cue-progress">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
              <h3>{currentStep.title}</h3>
              <p className="dalang-script">{currentStep.narration}</p>
              <div className="cue-note">
                <strong>Dalang cue:</strong> {currentStep.cue}
              </div>
              {(targetChecks.length > 0 ||
                typeof currentStep.requiresShadowMode === "boolean" ||
                currentStep.mood ||
                currentStep.requiredGesture) && (
                <div className={`target-status ${isCurrentStepCorrect ? "complete" : ""}`}>
                  <strong>
                    {isCurrentStepCorrect ? "Challenge complete" : "Challenge locked"}
                  </strong>
                  <span>{challengeStatus}</span>
                </div>
              )}
              <div className="cue-requirements" aria-label="Cue requirements">
                <span className={targetsComplete ? "complete" : ""}>
                  <b>{targetsComplete ? "Complete" : "Stage"}</b>
                  Place {targetNames || "the cast"}
                </span>
                {currentStep.mood && (
                  <span className={moodRequirementMet ? "complete" : ""}>
                    <b>{moodRequirementMet ? "Complete" : "Atmosphere"}</b>
                    {requiredMoodLabel}
                  </span>
                )}
                {requiredGesture && (
                  <span className={gestureRequirementMet ? "complete" : ""}>
                    <b>{gestureRequirementMet ? "Complete" : "Gesture"}</b>
                    {requiredGestureCharacter}: {requiredGestureLabel}
                  </span>
                )}
                {typeof currentStep.requiresShadowMode === "boolean" && (
                  <span className={shadowRequirementMet ? "complete" : ""}>
                    <b>{shadowRequirementMet ? "Complete" : "Stage mode"}</b>
                    {currentStep.requiresShadowMode ? "Shadow Play" : "Normal Photo"}
                  </span>
                )}
                {currentStep.decision && (
                  <span className={decisionComplete ? "complete" : ""}>
                    <b>{decisionComplete ? "Complete" : "Interpretation"}</b>
                    Direct the meaning
                  </span>
                )}
              </div>
              <p className="learning-point">{currentStep.learningPoint}</p>

              {currentStep.decision && (
                <div className="story-decision">
                  <span className="panel-kicker">Direct the meaning</span>
                  <h4>{currentStep.decision.question}</h4>
                  <div className="decision-options">
                    {currentStep.decision.choices.map((choice) => (
                      <button
                        key={choice.id}
                        className={selectedDecisionId === choice.id ? "active" : ""}
                        onClick={() => chooseDecision(choice.id)}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                  {selectedDecision && (
                    <div className="decision-result">
                      <strong>{selectedDecision.result}</strong>
                      <span>{selectedDecision.insight}</span>
                    </div>
                  )}
                </div>
              )}

              {isFinalStep && (
                <div className="reflection-card">
                  <strong>Audience reflection</strong>
                  <p>{scene.reflection}</p>
                  {isCurrentStepCorrect && (
                    <div className="badge-unlock">
                      <span>Performance badge earned</span>
                      <strong>{scene.title} · Master Dalang</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="cue-actions">
                <button className="control-btn" onClick={() => goToStep(-1)} disabled={stepIndex === 0}>
                  Previous
                </button>
                {isFinalStep ? (
                  <button
                    className="btn-primary"
                    onClick={watchPerformance}
                    disabled={!isCurrentStepCorrect}
                  >
                    Watch Your Performance
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => goToStep(1)}
                    disabled={!isCurrentStepCorrect}
                    title={!isCurrentStepCorrect ? challengeInstruction : undefined}
                  >
                    Next Cue
                  </button>
                )}
              </div>
            </section>

            <section className="studio-panel director-panel">
              <span className="panel-kicker">Director controls</span>
              <h3>{selectedCharacter?.name || "Select a puppet"}</h3>
              <p>
                {selectedCharacter
                  ? `${selectedCharacter.title} from ${selectedCharacter.typeName}`
                  : "Choose a character from the cast or stage."}
              </p>

              {selectedPosition && (
                <>
                  <div className="nudge-grid" aria-label="Move selected puppet">
                    <button onClick={() => moveSelected(0, 6)}>Up</button>
                    <button onClick={() => moveSelected(-6, 0)}>Left</button>
                    <button onClick={flipSelected}>Flip</button>
                    <button onClick={() => moveSelected(6, 0)}>Right</button>
                    <button onClick={() => moveSelected(0, -6)}>Down</button>
                  </div>

                  <div className="gesture-controls">
                    <span className="panel-kicker">Expressive gesture</span>
                    <div>
                      {gestureOptions.map((gesture) => (
                        <button
                          key={gesture.id}
                          className={gestures[selectedCharacterId] === gesture.id ? "active" : ""}
                          onClick={() => performGesture(gesture.id)}
                          title={gesture.meaning}
                        >
                          <strong>{gesture.label}</strong>
                          <span>{gesture.meaning}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mood-list">
                    {Object.entries(studioMoods).map(([mood, moodInfo]) => (
                      <button
                        key={mood}
                        className={`mood-chip ${activeMood === mood ? "active" : ""}`}
                        onClick={() => chooseMood(mood)}
                      >
                        <strong>{moodInfo.label}</strong>
                        <span>{moodInfo.description}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>

          <section className="studio-moral">
            <span className="panel-kicker">Moral focus</span>
            <p>{scene.moral}</p>
          </section>
        </main>
      </section>

      <p className="studio-source-note">
        Character and type images are sourced from Wikimedia Commons where
        available. Shadow mode stylizes the same real images into a kelir-style
        performance view.
      </p>

      {showPerformance && (
        <PerformanceReplay
          scene={scene}
          charactersById={charactersById}
          performance={performance}
          profile={directorProfile}
          onClose={() => setShowPerformance(false)}
          onReplay={resetScene}
        />
      )}
    </div>
  );
}
