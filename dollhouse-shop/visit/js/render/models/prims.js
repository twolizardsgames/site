// Low-poly primitive helpers. Each adds a shadow-casting mesh to `parent` and returns it.
// `mat` is a palette color string (cached toon material) or a Material.

import * as THREE from 'three';
import { toon, isPlainToon, toonVertex } from '../toon.js';

export function mesh(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, typeof mat === 'string' ? toon(mat) : mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

export const box = (parent, w, h, d, mat, x, y, z) => mesh(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
export const cyl = (parent, rTop, rBottom, h, segments, mat, x, y, z) =>
  mesh(parent, new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat, x, y, z);
export const ball = (parent, r, mat, x, y, z, detail = 1) => mesh(parent, new THREE.IcosahedronGeometry(r, detail), mat, x, y, z);

/** Triangular prism (roofs): base on y=0, apex at y=h, centered in x and z. */
export function prism(parent, w, h, d, mat) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return mesh(parent, g, mat);
}

/** Geometry used by many meshes (cached models, hit boxes): disposeTree and the mergers leave it alone. */
export function shareGeometry(obj) {
  obj.traverse((o) => { if (o.geometry) o.geometry.userData.shared = true; });
  return obj;
}

const hitGeos = new Map();
const hitMat = new THREE.MeshBasicMaterial({ visible: false });
/** An invisible box for taps to land on. Its geometry is shared by every hit box that size. */
export function hitBox(w, h, d) {
  const key = `${w},${h},${d}`;
  if (!hitGeos.has(key)) {
    const g = new THREE.BoxGeometry(w, h, d);
    g.userData.shared = true;
    hitGeos.set(key, g);
  }
  return new THREE.Mesh(hitGeos.get(key), hitMat);
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    if (!o.geometry?.userData.shared) o.geometry?.dispose();
    if (o.material?.map && !o.material.map.userData.keep) o.material.map.dispose(); // shared pattern textures stay
  });
}

/**
 * Merge every plain mesh directly in `group` into one mesh per material (and shadow setting), baking each mesh's
 * position, turn and scale into the vertices. Many little static props then cost a few draw calls instead of
 * dozens (big houses, docs/TECH.md §5.4). Only for untextured materials: uvs are dropped.
 */
export function mergeStatic(group) {
  const sets = new Map();
  for (const m of [...group.children]) {
    if (!m.isMesh || m.isInstancedMesh || m.material.map || m.geometry.attributes.color) continue; // mergeColors' meshes keep their colors
    const key = `${m.material.uuid}|${m.castShadow}`;
    if (!sets.has(key)) sets.set(key, { material: m.material, cast: m.castShadow, parts: [] });
    m.updateMatrix();
    const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);
    sets.get(key).parts.push(g);
    if (!m.geometry.userData.shared) m.geometry.dispose();
    group.remove(m);
  }
  for (const { material, cast, parts } of sets.values()) {
    const n = parts.reduce((sum, g) => sum + g.attributes.position.count, 0);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    let at = 0;
    for (const g of parts) {
      pos.set(g.attributes.position.array, at * 3);
      nor.set(g.attributes.normal.array, at * 3);
      at += g.attributes.position.count;
      g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.computeBoundingSphere();
    const merged = new THREE.Mesh(geo, material);
    merged.castShadow = cast;
    merged.receiveShadow = true;
    group.add(merged);
  }
  return group;
}

/**
 * Merge every plain-colored mesh under `root` (any depth) into one mesh per shadow setting, with each old material's
 * color baked into the vertices (toonVertex). A shelf item, a character or a whole furnished room then costs one or two
 * draw calls instead of dozens (big houses: draw calls are what slow the phone, docs/TECH.md §5.4). Left as they are:
 * meshes with other materials (glass, glowing lamps, textures), tap targets (anything with userData), meshes with an
 * onBeforeRender hook, and everything under an object marked `userData.live` (parts that move on their own).
 */
export function mergeColors(root) {
  root.updateMatrixWorld(true);
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const sets = new Map(), take = [];
  const visit = (o) => {
    if (o !== root && o.userData.live) return;
    if (o.isMesh && !o.isInstancedMesh && !o.isSkinnedMesh && isPlainToon(o.material) && o.visible
      && !Object.keys(o.userData).length && o.onBeforeRender === THREE.Mesh.prototype.onBeforeRender) take.push(o);
    for (const c of o.children) visit(c);
  };
  visit(root);
  if (take.length < 2) return root;
  const m4 = new THREE.Matrix4();
  for (const m of take) {
    const key = `${m.castShadow}|${m.receiveShadow}`;
    if (!sets.has(key)) sets.set(key, { cast: m.castShadow, receive: m.receiveShadow, parts: [] });
    const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m4.multiplyMatrices(toRoot, m.matrixWorld));
    sets.get(key).parts.push({ g, color: m.material.color });
    if (!m.geometry.userData.shared) m.geometry.dispose();
    m.removeFromParent();
  }
  for (const { cast, receive, parts } of sets.values()) {
    const n = parts.reduce((sum, p) => sum + p.g.attributes.position.count, 0);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let at = 0;
    for (const { g, color } of parts) {
      const count = g.attributes.position.count;
      pos.set(g.attributes.position.array, at * 3);
      nor.set(g.attributes.normal.array, at * 3);
      for (let i = 0; i < count; i++) { col[(at + i) * 3] = color.r; col[(at + i) * 3 + 1] = color.g; col[(at + i) * 3 + 2] = color.b; }
      at += count;
      g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    const merged = new THREE.Mesh(geo, toonVertex);
    merged.castShadow = cast;
    merged.receiveShadow = receive;
    root.add(merged);
  }
  return root;
}
