// Written by lounge-assets/mystery-script.py index: the week's murder mysteries, by night
// (each night's script and its rendered cues; a night without both has no case).
import mon from "./mon.json";
import monCues from "./mon-cues.json";
import tue from "./tue.json";
import tueCues from "./tue-cues.json";
import wed from "./wed.json";
import wedCues from "./wed-cues.json";
import thu from "./thu.json";
import thuCues from "./thu-cues.json";
import fri from "./fri.json";
import friCues from "./fri-cues.json";
import sat from "./sat.json";
import satCues from "./sat-cues.json";
import sun from "./sun.json";
import sunCues from "./sun-cues.json";
export const MYSTERIES = {
  mon: { script: mon, cues: monCues.cues },
  tue: { script: tue, cues: tueCues.cues },
  wed: { script: wed, cues: wedCues.cues },
  thu: { script: thu, cues: thuCues.cues },
  fri: { script: fri, cues: friCues.cues },
  sat: { script: sat, cues: satCues.cues },
  sun: { script: sun, cues: sunCues.cues }
};
