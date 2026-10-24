import { GROUND, SHIFT, SALOON, lift } from "./shoots-art";
import {
  bird,
  runner,
  card,
  gunman,
  thing,
  DONT,
  mulberry,
  across,
  flush,
  toss,
  float,
  run,
  charge,
  hover,
  cannon,
  stairs,
  balcony,
  slide,
  pick,
  flyers
} from "./shoot-paths";
import { CARNIVAL } from "./campaign-carnival";
import { DUCK } from "./campaign-duck";
import { DEER } from "./campaign-deer";
import { BOAR } from "./campaign-boar";
import { BOND } from "./campaign-bond";
import { SAFARI } from "./campaign-safari";
import { HOSTAGE } from "./campaign-hostage";
import { WEST } from "./campaign-west";

// Each shoot's levels 2 to 5 (campaign-*.js), by its key.
const MORE = {
  carnival: CARNIVAL,
  duck: DUCK,
  deer: DEER,
  boar: BOAR,
  bond: BOND,
  safari: SAFARI,
  hostage: HOSTAGE,
  saloon: WEST
};

// The featured shoots on the Rovers roof (Jay, 2026-10-19): a world drawn
// round the roof (shoots-art.js), its knockdown plates (plates.js) and the
// targets thrown, run and walked through it. Like the clay stands
// (skeet-range.js) everything is a fixed programme on the shared clock: a
// show is { sc, lvl, t0, seed, round } and every headset works out the same
// targets from it, so only hits go over the network.
//
// Campaigns (Jay, 2026-10-24: "a multilevel game where we have to reach 5k
// points and then it changes"): each of the eight shoots is five levels, each
// level its own world. The shooters keep their own scores, but a level is
// won as a team: when everyone's points in it add up to its goal (5,000) the
// next level comes up (LEVEL_GAP s later), a new world with new targets. A
// timed level (the western's quick draw) runs its length and moves on by
// itself. After the fifth, the campaign is over: a break (the clay stands),
// then the next campaign, 15% faster, up to the fourth.
//
// A level runs in 30 s waves, getting busier over its first 8 minutes; every
// 12th wave is a double-points wave. Range frame as in skeet-range.js: u to
// the shooter's right, f downrange, h up from the roof deck; the worlds'
// ground is at h = GROUND.

export const WAVE = 30;
export const LEVEL_WAVES = 240; // (two hours: nobody is still on one level by then)
export const BREAK = 120;
export const GOAL = 5000;
export const LEVEL_GAP = 8; // s from a level won to the next one starting
// (the saloon came later, so it's last: rounds and picks go by number)
export const SCENARIOS = ["carnival", "duck", "deer", "boar", "bond", "safari", "hostage", "saloon"];

// Points: the smaller and faster, the more. Don't-shoots cost 25.
export const SHOW_KINDS = {
  // small, fast birds: 25; big, slow ones: 5
  pigeon: bird("pigeon", 25, 0.3, "chirp"),
  teal: bird("teal", 25, 0.3, "quack"),
  crow: bird("crow", 25, 0.3, "caw"),
  starling: bird("starling", 25, 0.28, "chirp"),
  dove: bird("dove", 25, 0.3, "chirp"),
  lovebird: bird("lovebird", 25, 0.28, "chirp"),
  woodduck: bird("woodduck", 5, 0.6, "quack"),
  mallard: bird("mallard", 5, 0.5, "quack"),
  greygoose: bird("goose", 5, 0.65, "honk"),
  pheasant: bird("pheasant", 5, 0.5, "caw"),
  woodpigeon: bird("woodpigeon", 5, 0.45, "chirp"),
  peacock: bird("peacock", 5, 0.6, "honk"),
  vulture: bird("vulture", 5, 0.7, "caw"),
  drone: { ...thing("drone", 0, 25, 0.3, "fall", "level", "clank") },
  heli: { ...thing("heli", 0, 5, 1.3, "fall", "level", "ufo"), name: "HELICOPTER" },
  // carnival things and their disguises
  tinduck: card("tinduck", 10, 0.35, "ping"),
  star: thing("star", 0, 15, 0.3, "shatter", "spin", "ping"),
  balloonR: thing("balloon", 0xe8344a, 10, 0.3, "pop", "up", "pop"),
  balloonB: thing("balloon", 0x2f6fe8, 10, 0.3, "pop", "up", "pop"),
  balloonY: thing("balloon", 0xf2c230, 10, 0.3, "pop", "up", "pop"),
  balloonG: thing("balloon", 0x3ab54a, 10, 0.3, "pop", "up", "pop"),
  bigBalloon: { ...thing("bigBalloon", 0xb03ae8, 5, 0.6, "pop", "up", "pop") },
  clown: card("clown", 15, 0.4, "boing"),
  cannonman: { ...thing("cannonman", 0, 10, 0.5, "fall", "fly", "boing"), name: "HUMAN CANNONBALL" },
  decoy: thing("decoy", 0, 10, 0.35, "fall", "level", "thud"),
  tindeer: card("tindeer", 10, 0.5, "ping"),
  apple: thing("apple", 0, 15, 0.16, "shatter", "fixed", "splat"),
  turnip: thing("turnip", 0, 15, 0.2, "shatter", "fixed", "splat"),
  glass: thing("glass", 0, 15, 0.14, "shatter", "fixed", "glass"),
  chipR: thing("chip", 0xc0182a, 15, 0.18, "fall", "spin", "clank"),
  chipK: thing("chip", 0x151515, 15, 0.18, "fall", "spin", "clank"),
  cardH: thing("card", 0xc0182a, 15, 0.25, "fall", "spin", "thud"),
  cardS: thing("card", 0x151515, 15, 0.25, "fall", "spin", "thud"),
  tinzebra: card("tinzebra", 10, 0.5, "ping"),
  tingiraffe: card("tingiraffe", 10, 0.55, "ping"),
  coconut: thing("coconut", 0, 15, 0.2, "shatter", "tumble", "splat"),
  letterA: card("letterA", 10, 0.35, "ping"),
  letterB: card("letterB", 10, 0.35, "ping"),
  letterC: card("letterC", 10, 0.35, "ping"),
  // the main events
  deer: runner("buck", 0xff7a1a, 1.4, 0.6, "thud"),
  stag: { ...runner("bigbuck", 0xffc93c, 1.9, 0.75, "thud"), name: "THE STAG" },
  boar: runner("boar", 0xff7a1a, 0.85, 0.6, "squeal"),
  piglet: runner("boar", 0xf28ab0, 0.5, 0.38, "squeal"),
  bigboar: { ...runner("boar", 0xffc93c, 1.4, 0.95, "squeal"), name: "BIG TUSKER" },
  lion: runner("lion", 0xe8344a, 1.2, 0.7, "roar"),
  lioness: runner("lion", 0xff7a1a, 1.05, 0.62, "roar"),
  antelope: runner("antelope", 0xff7a1a, 1.1, 0.5, "thud"),
  zebra: runner("zebra", 0xf4efe2, 1.3, 0.65, "thud"),
  henchman: card("henchman", 10, 0.5),
  boss: { ...card("boss", 50, 0.45), name: "THE MASTERMIND" },
  bad: card("bad", 10, 0.5),
  taker: card("taker", 25, 0.19),
  // don't shoot
  dog: { ...card("dog", -25, 0.35, "wrong"), ...DONT },
  hiker: { ...card("hiker", -25, 0.5, "wrong"), ...DONT },
  farmer: { ...card("farmer", -25, 0.5, "wrong"), ...DONT },
  girl: { ...card("girl", -25, 0.5, "wrong"), ...DONT },
  ranger: { ...card("ranger", -25, 0.5, "wrong"), ...DONT },
  hostage: { ...card("hostage", -25, 0.45, "wrong"), ...DONT },
  mime: { ...card("mime", -25, 0.5, "wrong"), ...DONT, name: "IT'S THE MIME! DON'T SHOOT!" },
  // the saloon: gunmen down the stairs and along the balcony (cut-outs like
  // the pop-ups; one that gets to the floor and draws costs everyone 10),
  // the ladies (don't), bottles sliding down the bar, hats and bottles in the air
  cowboy: gunman("cowboy", 1.8),
  gunslinger: gunman("gunslinger", 1.8),
  outlaw: { ...gunman("outlaw", 1.85), pts: 100, name: "BLACK BART" },
  lady: { ...gunman("lady", 1.75), pts: -25, sound: "wrong", ...DONT },
  // (on the balcony, behind its railing: aim higher)
  cowboyB: { ...gunman("cowboy", 1.8), hy: 1.35 },
  gunslingerB: { ...gunman("gunslinger", 1.8), hy: 1.35 },
  ladyB: { ...gunman("lady", 1.75), hy: 1.3, pts: -25, sound: "wrong", ...DONT },
  whiskey: { ...thing("whiskey", 0, 25, 0.16, "shatter", "fixed", "glass"), hy: 0.15 },
  beer: { ...thing("mug", 0, 25, 0.14, "shatter", "fixed", "glass"), hy: 0.08 },
  bottleUp: { ...thing("whiskey", 0, 25, 0.17, "shatter", "tumble", "glass"), hy: 0.15 },
  stetson: thing("stetson", 0, 15, 0.3, "fall", "spin", "thud"),
  // anywhere, now and then
  golden: { ...thing("gold", 0, 50, 0.3, "shatter", "spin", "bell"), name: "GOLDEN TARGET · 50" },
  // the campaigns' own
  ...Object.assign({}, ...Object.values(MORE).map(m => m.kinds))
};

// A world's birds: both sizes, crossers, pairs, flushes, overhead (indoors:
// what it throws up instead).
function birds(s, R, add, c, n) {
  if (s.air) return s.air(R, add, c, n);
  flyers(s.birds, R, add, c, n, s.flush);
}

// Per world: names, the birds [small, big], the don't-shoot, and the opener,
// main event and finale. Counts scale with c.I, speeds with c.S.
export const SCREEN = {
  carnival: {
    name: "CARNIVAL NIGHT",
    titles: [
      "STEP RIGHT UP!",
      "PIGEONS OVER THE MIDWAY",
      "TAKE A BREATHER",
      "THE BIG TOP",
      "THE MIDWAY GOES WILD",
      "BALLOON RELEASE · DOUBLE POINTS"
    ],
    birds: ["pigeon", "woodduck"],
    dont: "mime",
    music: "carnival",
    amb: "crowd",
    opener(R, add, c) {
      // balloons drifting up (the tin ducks, rabbits and stars are plates now)
      for (let k = 0; k < Math.round(2 + 3 * c.I); k++)
        add(R(1, 25), pick(R, ["balloonR", "balloonB", "balloonY", "balloonG"]), float(R, { v: R(1.2, 2) * c.S }));
    },
    main(R, add, c) {
      // (the clowns pop up from the booths as plates)
      if (R(0, 1) < 0.6) add(R(4, 20), "cannonman", cannon(R, { S: c.S }));
      for (let k = 0; k < Math.round(2 + 3 * c.I); k++)
        add(R(1, 25), pick(R, ["balloonR", "balloonB", "balloonY", "balloonG"]), float(R, { v: R(1.6, 3) * c.S }));
    },
    finale(R, add, c) {
      for (let k = 0; k < 40; k++)
        add(
          1 + k * 0.6,
          pick(R, ["balloonR", "balloonB", "balloonY", "balloonG", "bigBalloon"]),
          float(R, { v: R(2, 3.6) * c.S, f: R(9, 22) })
        );
      for (let k = 0; k < 3; k++) add(4 + k * 8, "cannonman", cannon(R, { S: c.S }));
    }
  },
  duck: {
    name: "DUCK HUNT",
    titles: [
      "THE DECOY POND",
      "FIRST FLIGHT",
      "TAKE A BREATHER",
      "THE FLYWAY",
      "OPENING DAY",
      "THE BIG FLUSH · DOUBLE POINTS"
    ],
    birds: ["teal", "mallard"],
    flush: true,
    dont: "dog",
    music: "duck",
    amb: "marsh",
    opener(R, add, c) {
      for (let k = 0; k < Math.round(1 + 2 * c.I); k++) add(R(3, 24), "mallard", flush(R, { S: c.S * 0.8 }));
    },
    main(R, add, c) {
      // flocks: a lead bird and its followers in a line
      const flocks = Math.round(2 + 2.5 * c.I);
      for (let k = 0; k < flocks; k++) {
        const t = 1 + k * (26 / flocks);
        const dir = R(0, 1) < 0.5 ? 1 : -1;
        const f = R(14, 30);
        const h = R(5, 12);
        const kind = R(0, 1) < 0.4 ? "teal" : R(0, 1) < 0.8 ? "mallard" : "greygoose";
        const v = (kind === "teal" ? R(11, 13) : kind === "mallard" ? R(6.5, 8) : R(5, 6)) * c.S;
        const size = kind === "greygoose" ? 5 : 3 + Math.floor(R(0, 3));
        for (let j = 0; j < size; j++)
          add(t + j * 0.35, kind, across(R, { v, dir, f: f + j * 0.8, h: h + Math.abs(j - size / 2) * 0.4, amp: 0.2 }));
      }
    },
    finale(R, add, c) {
      for (let k = 0; k < 4; k++)
        for (let j = 0; j < 9; j++)
          add(1 + k * 7 + j * 0.25, R(0, 1) < 0.4 ? "teal" : "mallard", flush(R, { S: c.S * 1.2 }));
    }
  },
  deer: {
    name: "DEER STALK",
    titles: [
      "TIN DEER & APPLES",
      "CROWS IN THE PINES",
      "TAKE A BREATHER",
      "AT THE FOREST EDGE",
      "THE RUT",
      "THE HERD CROSSES · DOUBLE POINTS"
    ],
    birds: ["crow", "pheasant"],
    flush: true,
    dont: "hiker",
    music: "deer",
    amb: "forest",
    opener(R, add, c) {
      birds(SCREEN.deer, R, add, c, Math.round(1 + 2 * c.I));
    },
    main(R, add, c) {
      const n = Math.round(2 + 3 * c.I);
      for (let k = 0; k < n; k++) add(1 + k * (24 / n), "deer", run(R, { v: R(11, 14) * c.S }));
      if (R(0, 1) < 0.35 + 0.3 * c.p) add(R(4, 18), "stag", run(R, { v: R(12, 15) * c.S, f: R(36, 50) }));
      birds(SCREEN.deer, R, add, c, Math.round(1 + c.I));
    },
    finale(R, add, c) {
      for (let k = 0; k < 14; k++)
        add(1 + k * 1.8, k % 5 === 4 ? "stag" : "deer", run(R, { v: R(12, 15) * c.S, f: R(16, 42) }));
    }
  },
  boar: {
    name: "BOAR CHARGE",
    titles: [
      "THE TURNIP PATCH",
      "OVER THE SCRUB",
      "TAKE A BREATHER",
      "BOAR IN THE BRUSH",
      "THE SOUNDER",
      "BIG TUSKER · DOUBLE POINTS"
    ],
    birds: ["starling", "woodpigeon"],
    flush: true,
    dont: "farmer",
    music: "boar",
    amb: "scrub",
    opener(R, add, c) {
      if (R(0, 1) < 0.5) add(R(5, 20), "piglet", charge(R, { v: R(10, 12) * c.S, f0: R(30, 45) }));
    },
    main(R, add, c) {
      const n = Math.round(2 + 3 * c.I);
      for (let k = 0; k < n; k++) add(1 + k * (22 / n), "boar", charge(R, { v: R(9, 11) * c.S }));
      for (let k = 0; k < Math.round(c.I * 2); k++)
        add(R(2, 20), "piglet", charge(R, { v: R(10, 12) * c.S, f0: R(35, 55) }));
      for (let k = 0; k < Math.round(c.I); k++) add(R(2, 20), "boar", run(R, { v: R(11, 14) * c.S }));
    },
    finale(R, add, c) {
      add(2, "bigboar", charge(R, { v: 7 * c.S, f0: 70 }));
      for (let k = 0; k < 12; k++) add(4 + k * 1.8, k % 3 ? "boar" : "piglet", charge(R, { v: R(9, 12) * c.S }));
    }
  },
  bond: {
    name: "SPY NIGHT · THE VILLAIN'S LAIR",
    titles: [
      "THE CHAMPAGNE BAR",
      "DOVES OFF THE CASINO",
      "TAKE A BREATHER",
      "HENCHMEN",
      "THE LAIR IS ON ALERT",
      "THE MASTERMIND · DOUBLE POINTS"
    ],
    birds: ["dove", "peacock"],
    dont: "girl",
    music: "bond",
    amb: "casino",
    opener(R, add, c) {
      for (let k = 0; k < Math.round(2 + 3 * c.I); k++) {
        const u = R(-10, 10);
        add(
          R(1, 25),
          pick(R, ["chipR", "chipK", "cardH", "cardS"]),
          toss(R, { u, f: R(11, 22), h: GROUND + 1.2, vh: R(8, 11) * c.S })
        );
      }
    },
    main(R, add, c) {
      // (the henchmen are in the lair's windows, as plates)
      if (R(0, 1) < 0.3 + 0.3 * c.p) add(R(2, 15), "heli", hover(R));
      birds(SCREEN.bond, R, add, c, Math.round(1 + c.I));
    },
    finale(R, add, c) {
      for (let k = 0; k < 3; k++) add(2 + k * 9, "heli", hover(R, { S: c.S }));
      birds(SCREEN.bond, R, add, c, 10);
    }
  },
  safari: {
    name: "SAFARI NIGHT",
    titles: [
      "THE TIN PARADE",
      "OVER THE WATERHOLE",
      "TAKE A BREATHER",
      "THE LIONS COME",
      "STAMPEDE SEASON",
      "THE PRIDE CHARGES · DOUBLE POINTS"
    ],
    birds: ["lovebird", "vulture"],
    dont: "ranger",
    music: "safari",
    amb: "savanna",
    opener(R, add, c) {
      for (let k = 0; k < Math.round(2 + 2 * c.I); k++)
        add(R(1, 25), "coconut", toss(R, { u: -7 + R(-0.6, 0.6), f: 18, h: GROUND + 7, vh: R(3, 6), vu: R(-2, 2) }));
    },
    main(R, add, c) {
      const n = Math.round(2 + 2.5 * c.I);
      for (let k = 0; k < n; k++)
        add(1 + k * (22 / n), R(0, 1) < 0.5 ? "lion" : "lioness", charge(R, { v: R(9, 11) * c.S }));
      for (let k = 0; k < Math.round(1 + 2 * c.I); k++)
        add(R(1, 22), R(0, 1) < 0.6 ? "antelope" : "zebra", run(R, { v: R(12, 15) * c.S }));
    },
    finale(R, add, c) {
      for (let k = 0; k < 10; k++) add(1 + k * 2.2, k % 3 ? "lioness" : "lion", charge(R, { v: R(10, 12) * c.S }));
    }
  },
  hostage: {
    name: "HOSTAGE RESCUE",
    titles: [
      "THE PRACTICE LINE",
      "DRONES!",
      "TAKE A BREATHER",
      "CLEAR THE HOUSE",
      "BREACH!",
      "THE LAST ROOM · DOUBLE POINTS"
    ],
    birds: ["drone", "heli"],
    dont: "hostage",
    music: "hostage",
    amb: "night",
    opener(R, add, c) {
      // (the practice line and the windows are plates; drones overhead)
      birds(SCREEN.hostage, R, add, c, Math.round(1 + c.I));
    },
    main(R, add, c) {
      birds(SCREEN.hostage, R, add, c, Math.round(2 + 2 * c.I));
    },
    finale(R, add, c) {
      birds(SCREEN.hostage, R, add, c, 12);
      add(4, "heli", hover(R));
    }
  },
  saloon: {
    name: "WILD WEST SALOON",
    titles: [
      "SHOTS ON THE HOUSE",
      "HATS IN THE AIR",
      "TAKE A BREATHER",
      "TROUBLE ON THE STAIRS",
      "SALOON BRAWL",
      "THE GANG COMES DOWN · DOUBLE POINTS"
    ],
    dont: "lady",
    music: "saloon",
    amb: "saloon",
    // (instead of birds: hats thrown up off the floor, bottles from behind the bar)
    air(R, add, c, n) {
      for (let k = 0; k < n; k++) {
        const t = 2 + (k * 26) / n + R(0, 1.5);
        const vu = R(-2, 2) * c.S;
        if (R(0, 1) < 0.55) {
          const u = R(-10, 10);
          const f = R(2, 12);
          add(t, "stetson", toss(R, { u, f, h: GROUND + 1, vh: Math.min(11.5, R(8.5, 10.5) * c.S), vu }));
          if (R(0, 1) < 0.3)
            add(t + 0.4, "stetson", toss(R, { u: u + 1, f, h: GROUND + 1, vh: R(8.5, 10.5), vu: -vu }));
        } else
          add(
            t,
            "bottleUp",
            toss(R, {
              u: R(-5, 5),
              f: SALOON.BAR + 0.9,
              h: GROUND + 1.3,
              vh: Math.min(10, R(7, 9) * c.S),
              vu: vu * 1.2
            })
          );
      }
    },
    opener(R, add, c) {
      for (let k = 0; k < Math.round(2 + 3 * c.I); k++)
        add(R(1, 25), R(0, 1) < 0.6 ? "whiskey" : "beer", slide(R, { v: R(3, 5) * c.S }));
    },
    main(R, add, c) {
      const n = Math.round(2 + 2.5 * c.I);
      for (let k = 0; k < n; k++)
        add(
          1 + k * (22 / n) + R(0, 1.5),
          R(0, 1) < 0.55 ? "cowboy" : "gunslinger",
          stairs(R, { v: R(2.8, 3.8) * c.S, gun: true })
        );
      if (R(0, 1) < 0.4) add(R(2, 20), "lady", stairs(R, { v: R(2, 2.6) }));
      if (R(0, 1) < 0.5) add(R(1, 14), R(0, 1) < 0.5 ? "cowboyB" : "gunslingerB", balcony(R, { v: R(2.4, 3.4) * c.S }));
      if (R(0, 1) < 0.3) add(R(1, 14), "ladyB", balcony(R, { v: R(1.8, 2.4) }));
    },
    finale(R, add, c) {
      for (let k = 0; k < 12; k++)
        add(
          1 + k * 1.9,
          k % 2 ? "cowboy" : "gunslinger",
          stairs(R, { side: k % 4 < 2 ? 1 : -1, v: R(3.2, 4.2) * c.S, gun: true })
        );
      add(12, "outlaw", stairs(R, { v: 2.6 * c.S, gun: true }));
      for (let k = 0; k < 3; k++)
        add(2 + k * 7, k % 2 ? "cowboyB" : "gunslingerB", balcony(R, { v: R(2.8, 3.6) * c.S }));
      add(R(4, 16), "ladyB", balcony(R, { v: 2 }));
    }
  }
};
// Now and then, anywhere: the golden target (indoors, from wall to wall).
function extras(R, add, c, indoor) {
  const gold = 0.1 + 0.15 * c.p;
  if (R(0, 1) < gold)
    add(
      R(3, 22),
      "golden",
      indoor
        ? across(R, { u0: SALOON.W - 0.6, v: R(8, 11) * c.S, f: R(3, 20), h: GROUND + R(2.5, 5.5), weave: 1.2 })
        : across(R, { v: R(11, 14) * c.S, h: R(4, 10), weave: 2.5 })
    );
  // (the night's don't-shoot and the mime come up among the plates)
}
// ---- The campaigns ---------------------------------------------------------------

// A level: { world (the shoots-art WORLDS and plates LAYOUTS key), name,
// story (its banner's last line), goal (team points to win it; null: timed),
// dur (s, a timed level), pistols (pistols only), music, amb, legend (the
// board's points line), indoor (the golden target flies wall to wall), gold
// (0: no golden target), x2(w) (double-points waves), title(w, x2), wave(R,
// add, c) }. c: { I (busyness), S (speed), p (0..1 over the first 8
// minutes), w (wave), x2 }.
//
// Each campaign's first level is its old featured shoot (SCREEN) as a level:
// a six-wave cycle of its opener, birds and main event, and every 12th wave
// its old finale.
function classic(sc, name, story) {
  const S0 = SCREEN[sc];
  return {
    world: sc,
    name,
    story,
    music: S0.music,
    amb: S0.amb,
    indoor: !!S0.air,
    wave(R, add, c) {
      if (c.x2) return S0.finale(R, add, c);
      const k = c.w % 6;
      const air = n => birds(SCREEN[sc], R, add, c, n);
      if (k === 0) {
        S0.opener(R, add, c);
        air(Math.round(1 + c.I));
      } else if (k === 1) air(Math.round(5 + 4 * c.I));
      else if (k === 2) S0.main(R, add, c);
      else if (k === 3) {
        S0.main(R, add, c);
        air(2);
      } else if (k === 4) {
        S0.opener(R, add, c);
        S0.main(R, add, { ...c, I: c.I * 0.8 });
      } else {
        S0.main(R, add, { ...c, I: c.I * 1.15 });
        air(Math.round(2 + 2 * c.I));
        S0.opener(R, add, { ...c, I: 0.3 });
      }
    }
  };
}

// Each campaign's first level: the classic world, its name and banner line.
const FIRST = {
  carnival: ["THE MIDWAY", "Step right up!"],
  duck: ["THE DECOY POND", "Opening morning on the marsh"],
  deer: ["THE FOREST EDGE", "Quiet now. They're in the trees"],
  boar: ["THE SCRUB", "Wild boar in the brush"],
  bond: ["THE VILLAIN'S CASINO", "Your mission: the Mastermind"],
  safari: ["THE SAVANNA", "The pride is out tonight"],
  hostage: ["THE SHOOT HOUSE", "Hostages inside. Clear the house"],
  saloon: ["THE SILVER SPUR SALOON", "Villa's men are drinking in the Silver Spur"]
};
export const CAMPAIGNS = Object.fromEntries(
  SCENARIOS.map(k => [
    k,
    {
      name: MORE[k].name,
      done: MORE[k].done,
      levels: [classic(k, FIRST[k][0], MORE[k].first || FIRST[k][1]), ...MORE[k].levels]
    }
  ])
);

export const levelsOf = sc => (CAMPAIGNS[SCENARIOS[sc]] || CAMPAIGNS.carnival).levels;
export const campaignOf = sc => CAMPAIGNS[SCENARIOS[sc]] || CAMPAIGNS.carnival;
export const levelOf = show => (show ? levelsOf(show.sc)[show.lvl | 0] || null : null);
export const levelGoal = lv => (lv && lv.goal !== undefined ? lv.goal : GOAL);

// ---- A level's waves -------------------------------------------------------------

const waveCache = new Map();

// Wave w of level `show` ({ sc, lvl, t0, seed, round }): { w, x2, title,
// launches }, each launch { id, kind, t0 (absolute s), dur, pos, ... }.
export function showWave(show, w) {
  const key = `${show.t0}|${show.sc}|${show.lvl | 0}|${w}`;
  let s = waveCache.get(key);
  if (s) return s;
  const lv = levelOf(show);
  const rnd = mulberry((show.seed >>> 0) ^ Math.imul(w + 1, 2654435761) ^ Math.imul((show.lvl | 0) + 1, 40503));
  const R = (a, b) => a + (b - a) * rnd();
  const p = Math.min(1, w / 16);
  const x2 = lv.x2 ? lv.x2(w) : w % 12 === 11;
  const I = [0.7, 1.0, 0.8, 1.25][w % 4] * (1 + 0.6 * p);
  const S = (1 + 0.15 * Math.min(3, Math.max(0, (show.round || 1) - 1))) * (1 + 0.1 * p);
  const c = { I, S, p, w, x2 };
  const launches = [];
  const base = show.t0 + w * WAVE;
  const add = (t, kind, L) => {
    if (t < 0 || t + L.dur > WAVE * 1.9) return;
    // (laid out as before; flown SHIFT m further out and over the lifted land)
    const path = L.pos;
    launches.push({
      id: `s${Math.round(show.t0)}.${w}.${launches.length}`,
      kind,
      t0: base + t,
      x2,
      ...L,
      pos: (tau, out) => {
        path(tau, out);
        out.y += SHIFT;
        out.z += lift(out.y);
        return out;
      }
    });
  };
  lv.wave(R, add, c);
  if (lv.gold !== 0 && !x2) extras(R, add, c, !!lv.indoor);
  launches.sort((a, b) => a.t0 - b.t0);
  s = { w, x2, title: (lv.title && lv.title(w, x2)) || (x2 ? "DOUBLE POINTS" : lv.name), launches };
  waveCache.set(key, s);
  if (waveCache.size > 6) waveCache.delete(waveCache.keys().next().value);
  return s;
}

// The launches in the air at shared time T (this wave and the one before).
export function liveShow(show, T, out = []) {
  out.length = 0;
  const w = Math.floor((T - show.t0) / WAVE);
  for (const m of [w - 1, w]) {
    if (m < 0 || m >= LEVEL_WAVES) continue;
    for (const L of showWave(show, m).launches) {
      const tau = T - L.t0;
      if (tau >= 0 && tau <= L.dur) out.push(L);
    }
  }
  return out;
}

export function findShowLaunch(show, id) {
  if (!show || !String(id).startsWith("s")) return null;
  const [t0, w] = String(id).slice(1).split(".");
  const n = Number(w);
  // (a hit on the last level's target is nothing now)
  if (Number(t0) !== Math.round(show.t0) || !Number.isFinite(n) || n < 0 || n >= LEVEL_WAVES) return null;
  return showWave(show, n).launches.find(L => L.id === id) || null;
}

// Tonight's world by the starter's local day: Monday carnival ... Sunday hostage.
export function tonight(date = new Date()) {
  return (date.getDay() + 6) % 7;
}
