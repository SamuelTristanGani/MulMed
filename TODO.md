# MulMed - TODO

- [ ] Update src/components/WayangAnimations.js
  - [x] Remove strike logic from buildRigPoseAtTime macro timeline (bow/tremble/speak/strike section)
  - [ ] Replace with looping “punch” animation that drives the RIGHT arm forward and back continuously
  - [ ] Make LEFT hand/arm bend slightly in response during punch (subtle counter-bend)
  - [ ] Ensure buildRigPoseForGestureAtTime('strike') uses the same new looping punch behavior
  - [ ] Sanity-check exports/used constants so RigTest still renders without errors


