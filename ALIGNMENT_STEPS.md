# Hanoman rig joint alignment steps (RigTest)

Goal: when all rotations are **0deg** (`POSE_DEBUG` locked to a pose where rotations are near base), the **arm joints visually overlap** between:
- Left upper arm ↔ Left lower arm
- Right upper arm ↔ Right lower arm

This is done entirely in **`src/components/WayangRig.css`**.

---

## Section 0 — Ensure you can see the joints
In `RigTest.jsx`, temporarily set:
- `POSE_DEBUG = "bow"` (or any pose where motion is minimal), then verify:
- rotate values for left/right are non-extreme

Also in browser devtools, you can force rotations to 0 by temporarily setting in `RigTest.jsx`:
- `leftUpperRotation={0}` etc.

That lets you align against a static pose.

---

## Section 1 — Confirm the CSS that affects pivots
You should have these blocks in `src/components/WayangRig.css` for the limb wrappers:
- `.wayang-body`
- `.left-upper`, `.left-lower`, `.right-upper`, `.right-lower`
- `transform-origin`

Right now the file still contains the old `.body` / fixed-size placeholder rules. Those are not used by the current `WayangRig.jsx` component (which uses `.wayang-body`).

If you want to align perfectly, you may first add temporary debug borders to wrapper elements:
- add `outline: 1px dashed red;` to `.left-upper` and similar.

---

## Section 2 — Pass A: manual positioning (wrapper anchors)
**Where:** edit these properties in `WayangRig.css`:
- `.left-upper { left: ___; top: ___; }`
- `.left-lower { left: ___; top: ___; }`
- `.right-upper { right: ___; top: ___; }`
- `.right-lower { right: ___; top: ___; }`

**What to do:**
1. Set all rotations to **0deg**.
2. Adjust **upper arm wrapper position** until the upper-arm joint point matches the expected joint location on the body/art.
3. Adjust **lower arm wrapper position** until its joint point matches the upper arm’s joint point.
4. Repeat (lower arm changes can make upper look slightly off).

**Tip:** Because PNGs are transparent, only the joint/connector pixels will guide alignment.

---

## Section 3 — Pass B: manual pivot location (`transform-origin`)
**Where:** edit:
- `.left-upper`, `.left-lower`, `.right-upper`, `.right-lower` → `transform-origin: XX% YY%;`

Default recommended starting values:
- `transform-origin: 50% 0%;`

**What to do:**
1. Keep wrapper positions from Pass A.
2. Set `POSE_DEBUG = "strike"` (or adjust your animation driver) and watch which way the arm swings.
3. If the hinge rotates around the wrong point:
   - move `XX%` left/right
   - move `YY%` up/down
4. Do upper arm pivots first (they affect the whole lower-arm relationship visually).

---

## Section 4 — Pass C: verify scaling
Since the limb wrappers size should be derived from image content, scaling the whole rig in the parent scene should preserve hinge behavior.

**Verification checklist:**
- Change parent scale (or wrapper width/height) and ensure joints still overlap at 0deg.
- Run a punch/gesture cycle and confirm hinge stays on the joint.

---

## Section 5 — What I need from you (optional, to remove guesswork)
If you want me to set initial `left/top` and `transform-origin` values precisely, share:
- screenshots of RigTest at 0deg and at a small rotation (e.g. RIGHT arm at ~10deg)

---

### Files to edit
- `src/components/WayangRig.css` (only)
- (Optional) `src/pages/RigTest.jsx` for forcing 0deg rotations during alignment

