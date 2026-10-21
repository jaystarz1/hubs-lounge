// The featured shoots' music: a calm and a driving loop per world, made
// locally with MusicGen (~/Studio/tools/musicgen.py + loopify.py).
import carnivalCalm from "../assets/sfx/range/carnival-calm.mp3";
import carnivalDrive from "../assets/sfx/range/carnival-drive.mp3";
import duckCalm from "../assets/sfx/range/duck-calm.mp3";
import duckDrive from "../assets/sfx/range/duck-drive.mp3";
import deerCalm from "../assets/sfx/range/deer-calm.mp3";
import deerDrive from "../assets/sfx/range/deer-drive.mp3";
import boarCalm from "../assets/sfx/range/boar-calm.mp3";
import boarDrive from "../assets/sfx/range/boar-drive.mp3";
import bondCalm from "../assets/sfx/range/bond-calm.mp3";
import bondDrive from "../assets/sfx/range/bond-drive.mp3";
import safariCalm from "../assets/sfx/range/safari-calm.mp3";
import safariDrive from "../assets/sfx/range/safari-drive.mp3";
import hostageCalm from "../assets/sfx/range/hostage-calm.mp3";
import hostageDrive from "../assets/sfx/range/hostage-drive.mp3";

export const MUSIC = {
  carnival: [carnivalCalm, carnivalDrive],
  duck: [duckCalm, duckDrive],
  deer: [deerCalm, deerDrive],
  boar: [boarCalm, boarDrive],
  bond: [bondCalm, bondDrive],
  safari: [safariCalm, safariDrive],
  hostage: [hostageCalm, hostageDrive]
};
