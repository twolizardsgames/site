// Sun + sky + front fill, blended between day and purple twilight, plus lamps that glow at twilight.

import * as THREE from 'three';
import { toonGlow } from './toon.js';
import { mesh, cyl, ball } from './models/prims.js';
import { DAY_LENGTH } from '../sim/day.js';

const DAY = {
  sky: '#bfe3f5', hemiSky: '#fff4e6', hemiGround: '#d9b8e8', hemi: 0.8,
  sun: '#fff3df', sunI: 2.2, sunDir: new THREE.Vector3(-3, 5, 11).normalize(),
  fill: '#ffe9f2', fillI: 0.8, glass: '#cdeaff',
};
const TWILIGHT = {
  sky: '#6f62b0', hemiSky: '#8a7fe0', hemiGround: '#c99ad8', hemi: 0.65,
  sun: '#c9a6f0', sunI: 1.0, sunDir: new THREE.Vector3(9, 3.5, 9).normalize(),
  fill: '#b8a8f0', fillI: 0.45, glass: '#8f7fd6',
};
/**
 * The Settings menu's Graphics slider (GDD #145), one notch each: the sun's shadows and their sharpness, the warm
 * light each room lamp throws in the evening (bulbs glow either way), and the most pixels per screen dot.
 */
export const GRAPHICS = [
  // sun: with no shadows everything gets the full sun and looks washed out (user, 2026-10-14), so Faster dims it.
  { name: 'Faster', shadows: false, shadowSize: 0, lamps: false, pixelRatio: 1, sun: 0.6 },
  { name: 'Balanced', shadows: true, shadowSize: 1024, lamps: true, pixelRatio: 1.5, sun: 1 },
  { name: 'Prettiest', shadows: true, shadowSize: 2048, lamps: true, pixelRatio: 2, sun: 1 },
];
export const graphicsOf = (level) => GRAPHICS[level] ?? GRAPHICS[GRAPHICS.length - 1];

const LAMP_COLOR = '#ffdcd2';
const LAMP_INTENSITY = 3;
// Without lamp lights (Faster) the rooms went much darker than Prettiest at night (user, 2026-10-14): the shadowless
// front fill light stands in for them, warming to the lamps' color and brightening as dusk falls. It's free (no new lights).
const LAMPLESS = { fill: 1.1, hemi: 0.2 };

export function createLighting(scene) {
  scene.background = new THREE.Color(DAY.sky);
  const hemi = new THREE.HemisphereLight(DAY.hemiSky, DAY.hemiGround, DAY.hemi);
  const sun = new THREE.DirectionalLight(DAY.sun, DAY.sunI);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  // Shadowless fill from the viewer's side so the cutaway interiors never go flat.
  const fill = new THREE.DirectionalLight(DAY.fill, DAY.fillI);
  fill.position.set(2, 3, 10);
  scene.add(hemi, sun, sun.target, fill);

  const shadeMat = toonGlow('#fff3c9', '#ffd6c8', { side: THREE.DoubleSide });
  const bulbMat = toonGlow('#fffbe8', '#fff0dc');
  const glassMat = new THREE.MeshBasicMaterial({ color: DAY.glass });
  let lamps = [];

  const c = (hex) => new THREE.Color(hex);
  const day = Object.fromEntries(Object.entries(DAY).map(([k, v]) => [k, typeof v === 'string' ? c(v) : v]));
  const tw = Object.fromEntries(Object.entries(TWILIGHT).map(([k, v]) => [k, typeof v === 'string' ? c(v) : v]));
  const lerp = THREE.MathUtils.lerp;
  const lampColor = c(LAMP_COLOR);
  const sunDir = new THREE.Vector3();
  let twilight = 0, twilightTarget = 0;

  let lampsOn = true, sunScale = 1;
  function addLight(parent, x, y, z) {
    const L = new THREE.PointLight(LAMP_COLOR, 0, 5, 1.5);
    L.position.set(x, y, z);
    L.visible = lampsOn;
    parent.add(L);
    lamps.push(L);
  }

  return {
    glassMat,
    get twilight() { return twilightTarget; },
    setTwilight(v) { twilightTarget = v; },

    /** Pendant lamp hanging from a ceiling at height y. */
    addPendant(parent, x, y, z) {
      cyl(parent, 0.008, 0.008, 0.35, 4, '#5a3a55', x, y - 0.175, z).castShadow = false;
      mesh(parent, new THREE.ConeGeometry(0.22, 0.18, 10, 1, true), shadeMat, x, y - 0.42, z).castShadow = false;
      ball(parent, 0.06, bulbMat, x, y - 0.48, z).castShadow = false;
      addLight(parent, x, y - 0.6, z);
    },

    addStreetLamp(parent, x, groundY, z) {
      cyl(parent, 0.05, 0.06, 2.2, 6, '#5a3a55', x, groundY + 1.1, z);
      ball(parent, 0.16, bulbMat, x, groundY + 2.25, z).castShadow = false;
      addLight(parent, x, groundY + 2.1, z + 0.2);
    },

    /** A Graphics slider notch (GRAPHICS): shadows on or off and how sharp, lamp light on or off. */
    setGraphics(level) {
      const g = graphicsOf(level);
      sun.castShadow = g.shadows;
      if (g.shadows && sun.shadow.mapSize.x !== g.shadowSize) {
        sun.shadow.mapSize.set(g.shadowSize, g.shadowSize);
        sun.shadow.map?.dispose();
        sun.shadow.map = null; // three.js makes a new one at the new size
      }
      lampsOn = g.lamps;
      sunScale = g.sun;
      this.update(0); // apply now, without jumping the dusk ahead
      for (const L of lamps) L.visible = lampsOn;
    },

    /** Forget lamps from a world that is being rebuilt. */
    resetLamps() { lamps = []; },

    /** Aim the sun at the building and size its shadow box to cover it. */
    fitTo({ width, height }) {
      const span = Math.max(width, height) / 2 + 4;
      sun.target.position.set(0, height / 2, 0);
      Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 60 });
      sun.shadow.camera.updateProjectionMatrix();
      this.update(0, true);
    },

    update(dt, snap = false) {
      let step = (twilightTarget - twilight) * (1 - Math.exp(-dt * 3));
      // Dusk never falls faster than the evening does, so a day that closes early (everyone gone before the
      // evening is over, GDD #115) keeps getting dark at the same pace instead of jumping to night.
      if (step > 0) step = Math.min(step, dt / DAY_LENGTH.evening);
      twilight = snap ? twilightTarget : twilight + step;
      const t = twilight;
      scene.background.lerpColors(day.sky, tw.sky, t);
      hemi.color.lerpColors(day.hemiSky, tw.hemiSky, t);
      hemi.groundColor.lerpColors(day.hemiGround, tw.hemiGround, t);
      hemi.intensity = lerp(day.hemi, tw.hemi, t);
      sun.color.lerpColors(day.sun, tw.sun, t);
      sun.intensity = lerp(day.sunI, tw.sunI, t) * sunScale;
      sunDir.lerpVectors(day.sunDir, tw.sunDir, t).normalize();
      sun.position.copy(sun.target.position).addScaledVector(sunDir, 25);
      fill.color.lerpColors(day.fill, tw.fill, t);
      fill.intensity = lerp(day.fillI, tw.fillI, t);
      if (!lampsOn) {
        fill.color.lerp(lampColor, t);
        fill.intensity += t * LAMPLESS.fill;
        hemi.intensity += t * LAMPLESS.hemi;
      }
      glassMat.color.lerpColors(day.glass, tw.glass, t);
      shadeMat.emissiveIntensity = t * 0.6;
      bulbMat.emissiveIntensity = t * 1.6;
      for (const L of lamps) L.intensity = t * LAMP_INTENSITY;
    },
  };
}
