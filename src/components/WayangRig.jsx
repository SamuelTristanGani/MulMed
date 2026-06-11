/*
  Later in DalangStudio.jsx, swap out <img /> in
  .performance-puppet and .stage-puppet
  for <WayangRig />
*/

import "./WayangRig.css";

import hanomanBody from "../assets/Hanoman/HanomanBody.png";
import hanomanUpperLeft from "../assets/Hanoman/HanomanUpperLeftArm.png";
import hanomanLowerLeft from "../assets/Hanoman/HanomanLowerLeftArm.png";
import hanomanUpperRight from "../assets/Hanoman/HanomanUpperRightArm.png";
import hanomanLowerRight from "../assets/Hanoman/HanomanLowerRightArm.png";

export default function WayangRig({
  leftUpperRotation = 0,
  leftLowerRotation = 0,
  rightUpperRotation = 0,
  rightLowerRotation = 0,
}) {
  return (
    <div className="wayang-body">
      <img src={hanomanBody} alt="hanoman body" />
g
      <div
        className="left-upper"
        style={{ transform: `rotate(${leftUpperRotation}deg)` }}
      >
        <img src={hanomanUpperLeft} alt="hanoman left upper arm" />

        <div
          className="left-lower"
          style={{ transform: `rotate(${leftLowerRotation}deg)` }}
        >
          <img src={hanomanLowerLeft} alt="hanoman left lower arm" />
        </div>
      </div>

      <div
        className="right-upper"
        style={{ transform: `rotate(${rightUpperRotation}deg)` }}
      >
        <img src={hanomanUpperRight} alt="hanoman right upper arm" />

        <div
          className="right-lower"
          style={{ transform: `rotate(${rightLowerRotation}deg)` }}
        >
          <img src={hanomanLowerRight} alt="hanoman right lower arm" />
        </div>
      </div>
    </div>
  );
}

