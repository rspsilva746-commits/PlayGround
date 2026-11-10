import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x89908a);
scene.fog = new THREE.FogExp2(0x89908a, 0.021);
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.06, 110);
camera.position.set(0, 1.7, 4);
scene.add(camera);
const clock = new THREE.Clock();
const hemi = new THREE.HemisphereLight(0xc5d5d0, 0x36302a, 1.55); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffdfb4, 3.1); sun.position.set(-7, 15, 5); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -22; sun.shadow.camera.right = 22; sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -24; sun.shadow.bias = -0.0007; scene.add(sun);
const fill = new THREE.DirectionalLight(0x8aa6a5, 1.15); fill.position.set(8, 6, -12); scene.add(fill);
const materials = {};
const mat = (name, color, roughness = .9, metalness = 0) => materials[name] ||= new THREE.MeshStandardMaterial({ color, roughness, metalness });
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(1, 12, 9);
const cylGeo = new THREE.CylinderGeometry(.5, .5, 1, 10);
function block(parent, x, y, z, sx, sy, sz, material, cast = true) {
  const m = new THREE.Mesh(boxGeo, material); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
}
function ball(parent, x, y, z, sx, sy, sz, material) {
  const m = new THREE.Mesh(sphereGeo, material); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m;
}
function cylinder(parent, x, y, z, rTop, rBot, height, material, sides = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, height, sides), material); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
}
function seeded(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let n = t; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; }; }
const rand = seeded(3903);

function makeAsphalt() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d');
  ctx.fillStyle = '#343a37'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 10000; i++) { const v = Math.floor(rand() * 65 + 35); ctx.fillStyle = `rgba(${v},${v + 3},${v + 2},${rand() * .23})`; const s = rand() * 2.4 + .4; ctx.fillRect(rand() * 256, rand() * 256, s, s); }
  for (let i = 0; i < 30; i++) { ctx.strokeStyle = `rgba(10,13,12,${rand() * .19})`; ctx.lineWidth = rand() * 1.4 + .3; ctx.beginPath(); let x = rand() * 256, y = rand() * 256; ctx.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (rand() - .5) * 35; y += rand() * 22; ctx.lineTo(x, y); } ctx.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 14); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const asphalt = new THREE.MeshStandardMaterial({ map: makeAsphalt(), color: 0xaaa9a1, roughness: 1 });
function makeWindowTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#4b504c'; x.fillRect(0, 0, 128, 256);
  for (let y = 10; y < 250; y += 34) for (let xx = 8; xx < 125; xx += 30) {
    const lit = rand() > .52; x.fillStyle = lit ? ['#6c7774', '#858274', '#424b4c'][Math.floor(rand() * 3)] : '#222a2b';
    x.fillRect(xx, y, 22, 26); x.fillStyle = 'rgba(207,200,170,.15)'; x.fillRect(xx + 2, y + 2, 2, 22);
    x.fillStyle = '#292c2a'; x.fillRect(xx - 1, y + 27, 24, 3);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const windowTexture = makeWindowTex();
const buildingMats = [0x666762, 0x77756d, 0x5a605d, 0x827d70, 0x555b58].map(color => new THREE.MeshStandardMaterial({ map: windowTexture, color, roughness: .97 }));

// Roadside city blocks: weathered concrete, shuttered shops, wreckage and street furniture.
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat('ground', 0x4a4b43)); ground.rotation.x = -Math.PI / 2; ground.position.y = -.075; ground.receiveShadow = true; scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(11, 150), asphalt); road.rotation.x = -Math.PI / 2; road.position.set(0, -.025, -27); road.receiveShadow = true; scene.add(road);
const walkMat = mat('sidewalk', 0x77756b), curbMat = mat('curb', 0x99978a), lineMat = new THREE.MeshStandardMaterial({ color: 0xc3b99a, roughness: 1, transparent: true, opacity: .48 });
for (const x of [-6.15, 6.15]) { const walk = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 150), walkMat); walk.rotation.x = -Math.PI / 2; walk.position.set(x, -.005, -27); walk.receiveShadow = true; scene.add(walk); block(scene, x > 0 ? -5.05 : 5.05, .06, -27, .16, .18, 150, curbMat, false); }
for (let z = -95; z < 44; z += 8) { const dash = new THREE.Mesh(boxGeo, lineMat); dash.position.set(0, .008, z); dash.scale.set(.12, .012, 3.3); scene.add(dash); }
// Broken lane paint and oil stains.
for (let i = 0; i < 55; i++) { const oil = new THREE.Mesh(new THREE.CircleGeometry(.15 + rand() * .58, 12), new THREE.MeshBasicMaterial({ color: rand() > .5 ? 0x161b19 : 0x555248, transparent: true, opacity: .18 + rand() * .2, depthWrite: false })); oil.rotation.x = -Math.PI / 2; oil.rotation.z = rand() * 3; oil.position.set((rand() - .5) * 9, .004, -85 + rand() * 120); oil.scale.set(1.7, .45 + rand(), 1); scene.add(oil); }

function makeBuilding(side, z, seed) {
  const r = seeded(seed), group = new THREE.Group(), width = 5 + r() * 4, height = 8 + r() * 10, depth = 11 + r() * 7;
  group.position.set(side * (8.5 + width / 2), 0, z); scene.add(group);
  const wall = buildingMats[Math.floor(r() * buildingMats.length)];
  block(group, 0, height / 2, 0, width, height, depth, wall);
  block(group, 0, height + .12, 0, width + .25, .26, depth + .25, mat(`roof${seed}`, 0x484b47));
  block(group, 0, .28, -side * (width / 2 + .08), width, .55, depth, mat(`base${seed}`, 0x454947));
  // Sills, projecting awnings and shop bays.
  for (let zz = -depth / 2 + 1.2; zz < depth / 2; zz += 2.4) {
    const sign = block(group, -side * (width / 2 + .12), 2.8, zz, .28, .52, 2.1, mat(`sign${seed}_${zz}`, r() > .6 ? 0x4b5148 : 0x5d4940));
    sign.rotation.z = side * -.06;
    block(group, -side * (width / 2 + .22), 2.28, zz, .14, .09, 2.2, mat(`awning${seed}_${zz}`, 0x292f2b));
  }
  for (let i = 0; i < 3 + Math.floor(r() * 4); i++) {
    const x = (r() - .5) * (width - .5), zz = (r() - .5) * (depth - 1);
    block(group, x, height + .5 + r() * 2, zz, .6 + r(), .6 + r() * 1.4, .45, mat(`hvac${seed}_${i}`, 0x535853));
  }
  // Small torn flags and rust streaks give the facade a lived-in silhouette.
  for (let i = 0; i < 3; i++) { const stain = block(group, side * (width / 2 + .006), 2.5 + r() * 3, (r() - .5) * depth, .025, 1.1 + r() * 2, .22, mat(`stain${seed}_${i}`, 0x51483e), false); stain.rotation.z = (r() - .5) * .1; }
  return group;
}
for (let z = -85, i = 0; z < 38; z += 17, i++) { makeBuilding(-1, z, i * 7 + 11); makeBuilding(1, z - 7, i * 7 + 53); }

function makeLamp(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  cylinder(g, 0, 3, 0, .055, .09, 6, mat('lampmetal', 0x353c3a), 8);
  block(g, -Math.sign(x) * .42, 5.88, 0, .9, .09, .09, mat('armmetal', 0x414844));
  const bulb = ball(g, -Math.sign(x) * .85, 5.72, 0, .2, .13, .2, new THREE.MeshStandardMaterial({ color: 0xe7d2a0, emissive: 0xa57b35, emissiveIntensity: 1.7 }));
  const glow = new THREE.PointLight(0xd0a66d, .9, 8); glow.position.copy(bulb.position); g.add(glow);
}
for (let z = -57; z < 29; z += 20) { makeLamp(-5.3, z); makeLamp(5.3, z - 10); }

function makeCar(x, z, color, rot = 0) {
  const g = new THREE.Group(); g.position.set(x, .12, z); g.rotation.y = rot; scene.add(g);
  const bodyMat = mat(`car${color}`, color, .76, .12), glass = mat(`glass${color}`, 0x273333, .28, .18), tire = mat('tire', 0x191c1b), chrome = mat('chrome', 0x777a71, .35, .6);
  block(g, 0, .48, 0, 2.05, .72, 4.25, bodyMat);
  block(g, 0, 1.03, -.25, 1.73, .62, 2.15, glass);
  block(g, 0, .83, 1.55, 1.85, .13, .32, chrome);
  block(g, 0, .83, -1.6, 1.8, .12, .28, chrome);
  for (const wx of [-1.04, 1.04]) for (const wz of [-1.38, 1.38]) { const w = cylinder(g, wx, .3, wz, .35, .35, .17, tire, 12); w.rotation.z = Math.PI / 2; const hub = cylinder(g, wx * 1.03, .3, wz, .17, .17, .18, chrome, 8); hub.rotation.z = Math.PI / 2; }
  block(g, -.78, .43, -2.13, .32, .18, .07, mat('taillight', 0x8e3023));
  block(g, .78, .43, -2.13, .32, .18, .07, mat('taillight2', 0x8e3023));
  // Bent-open door and shattered windshield details.
  const door = block(g, -1.27, .7, .05, .1, .9, 1.2, bodyMat); door.rotation.y = -.34;
  return g;
}
makeCar(-3.7, -13, 0x505751, -.04); makeCar(3.55, -34, 0x4b514c, Math.PI + .08); makeCar(-3.2, -54, 0x5b5148, -.12); makeCar(3.8, 8, 0x515754, Math.PI);
for (let i = 0; i < 13; i++) {
  const x = (rand() > .5 ? 1 : -1) * (4.8 + rand() * 2.6), z = -78 + rand() * 115;
  const crate = block(scene, x, .3, z, .7 + rand(), .6 + rand() * .6, .7 + rand(), mat(`debris${i}`, [0x514b3c, 0x4b4d46, 0x54443b][i % 3])); crate.rotation.y = rand() * 2;
  if (i % 3 === 0) { const trash = ball(scene, x + .5, .15, z + .7, .4, .18, .25, mat(`trash${i}`, 0x343b37)); trash.rotation.z = .5; }
}
// Barricades and a crashed emergency van make the street read as a real evacuation route.
function makeBarricade(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g); const stripe = mat('hazard', 0xd3c99e);
  block(g, 0, .54, 0, 2.3, .88, .3, mat('barricadebase', 0x4c5049));
  for (let i = -2; i < 3; i++) { const b = block(g, i * .48, .55, .17, .18, .9, .025, i % 2 ? stripe : mat('darkstripe', 0x282e29)); b.rotation.z = -.45; }
  for (const dx of [-.85, .85]) cylinder(g, dx, .04, 0, .16, .2, .08, mat('barfoot', 0x393e39), 8);
}
makeBarricade(2.7, -23); makeBarricade(-2.2, -46); makeBarricade(2.4, -68);

const bloodMat = mat('blood', 0x6e2822, .65), zombieSkin = [0x777c66, 0x656e61, 0x858272, 0x5c6358].map((c, i) => mat(`skin${i}`, c, .94));
const clothMats = [0x403e37, 0x464e4b, 0x514b45, 0x353b38, 0x57534a].map((c, i) => mat(`cloth${i}`, c, .95));
const zombieEyes = new THREE.MeshBasicMaterial({ color: 0xff4a2d });
const zombies = [];
function makeZombie(x, z, type = 0) {
  const root = new THREE.Group(); root.position.set(x, 0, z); scene.add(root);
  const skin = zombieSkin[Math.floor(rand() * zombieSkin.length)], cloth = clothMats[Math.floor(rand() * clothMats.length)];
  const torso = ball(root, 0, 1.13, 0, .39, .56, .26, cloth); torso.rotation.z = -.08;
  const pelvis = ball(root, 0, .72, 0, .33, .3, .24, cloth);
  const chest = ball(root, 0, 1.48, -.01, .37, .34, .27, cloth);
  const neck = cylinder(root, 0, 1.75, -.015, .11, .13, .17, skin, 8);
  const head = ball(root, 0, 1.96, -.015, .245, .3, .23, skin); head.rotation.z = .08;
  const jaw = ball(root, 0, 1.82, -.19, .17, .105, .11, mat('jaw', 0x4c5146));
  // Sunken, glowing eyes and a torn dark mouth.
  for (const ex of [-.092, .092]) ball(root, ex, 2.005, -.22, .038, .034, .018, zombieEyes);
  block(root, .035, 1.82, -.295, .12, .025, .012, bloodMat);
  const armPivots = [], legPivots = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(side * .39, 1.47, 0); root.add(arm); armPivots.push(arm);
    cylinder(arm, side * .04, -.27, 0, .12, .15, .55, cloth, 8);
    ball(arm, side * .04, -.53, -.015, .115, .18, .12, skin);
    ball(arm, side * .04, -.72, -.05, .105, .13, .105, skin);
    const leg = new THREE.Group(); leg.position.set(side * .17, .69, 0); root.add(leg); legPivots.push(leg);
    cylinder(leg, 0, -.27, 0, .14, .18, .56, cloth, 8);
    ball(leg, 0, -.58, -.12, .14, .13, .26, mat('shoe', 0x282b28));
  }
  // Ripped, dark stains on chest and sleeve.
  const slash = block(root, -.13, 1.34, -.265, .22, .11, .015, bloodMat); slash.rotation.z = -.38;
  if (type % 3 === 0) { const shoulder = ball(root, .25, 1.58, -.15, .13, .12, .12, bloodMat); }
  const hit = ball(root, 0, 1.05, 0, .43, .95, .34, new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0, depthWrite: false })); hit.userData.enemy = true;
  root.traverse(o => { if (o.isMesh && o !== hit) o.userData.enemy = true; });
  zombies.push({ root, armPivots, legPivots, hit, hp: type > 4 ? 2 : 1, speed: .5 + rand() * .25, phase: rand() * 5, attack: 0, alive: true });
  return zombies[zombies.length - 1];
}
// A few distant silhouettes establish the threat before the player starts.
for (let i = 0; i < 4; i++) makeZombie((i % 2 ? 1 : -1) * (1.7 + rand() * 2), -12 - i * 7, i);

// First-person service pistol with a restrained muzzle flash, attached to the camera.
const gun = new THREE.Group(); gun.position.set(.32, -.3, -.66); gun.rotation.set(-.04, -.04, -.06); camera.add(gun);
const gunMetal = new THREE.MeshStandardMaterial({ color: 0x303633, roughness: .34, metalness: .7 });
const gunGrip = mat('gunGrip', 0x292d2a, .92);
block(gun, 0, .015, 0, .13, .12, .43, gunMetal);
block(gun, 0, .055, -.21, .11, .065, .38, mat('barrel', 0x171c1a, .28, .8));
block(gun, 0, -.11, .09, .12, .25, .14, gunGrip).rotation.x = -.19;
block(gun, 0, -.09, .04, .052, .12, .07, gunMetal);
block(gun, 0, .08, -.04, .14, .025, .24, mat('slide', 0x454b47, .28, .72));
block(gun, 0, .105, -.22, .025, .018, .06, mat('sight', 0xc3bb8a, .4, .4));
const muzzle = new THREE.PointLight(0xffc15d, 0, 4); muzzle.position.set(0, .02, -.48); gun.add(muzzle);
const flash = new THREE.Mesh(new THREE.ConeGeometry(.12, .45, 8), new THREE.MeshBasicMaterial({ color: 0xffc85a, transparent: true, opacity: 0, depthWrite: false })); flash.rotation.x = -Math.PI / 2; flash.position.set(0, .02, -.58); gun.add(flash);

const $ = s => document.querySelector(s);
const ui = { start: $('#start-screen'), result: $('#result-screen'), startButton: $('#start-button'), restart: $('#restart-button'), title: $('#result-title'), copy: $('#result-copy'), health: $('#health-fill'), healthText: $('#health-text'), ammo: $('#ammo-count'), reserve: $('#reserve-count'), kills: $('#kill-count'), wave: $('#wave-number'), timer: $('#timer'), mission: $('#mission-label'), crosshair: $('#crosshair'), hit: $('#hit-marker'), toast: $('#toast'), damage: $('#damage-flash'), finalKills: $('#final-kills'), finalWave: $('#final-wave'), joystick: $('#joystick'), knob: $('#joy-knob'), fireButton: $('#fire-button'), reloadButton: $('#reload-button'), sound: $('#sound-btn') };
let running = false, ended = false, health = 100, ammo = 12, reserve = 48, kills = 0, wave = 1, elapsed = 0, spawnClock = 0, yaw = 0, pitch = -.025, recoil = 0, shotCooldown = 0, hurtCooldown = 0, reloadClock = 0, soundOn = true, audioCtx = null;
const keys = new Set(), joy = { x: 0, y: 0, active: false, id: null }, pointer = { down: false, x: 0, y: 0, touchId: null };
const raycaster = new THREE.Raycaster(); raycaster.far = 36;
function look(dx, dy, sensitivity = .0022) { yaw -= dx * sensitivity; pitch = THREE.MathUtils.clamp(pitch - dy * sensitivity, -1.05, 1.05); camera.rotation.set(pitch, yaw, 0, 'YXZ'); }
function audio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); return audioCtx; }
function soundShot() { if (!soundOn) return; try { const a = audio(), now = a.currentTime, osc = a.createOscillator(), gain = a.createGain(), noise = a.createBufferSource(), buffer = a.createBuffer(1, a.sampleRate * .07, a.sampleRate), data = buffer.getChannelData(0); for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * (1-i/data.length); noise.buffer = buffer; const ng = a.createGain(); ng.gain.setValueAtTime(.17, now); ng.gain.exponentialRampToValueAtTime(.001, now+.065); noise.connect(ng).connect(a.destination); osc.type='triangle'; osc.frequency.setValueAtTime(130,now); osc.frequency.exponentialRampToValueAtTime(42,now+.13); gain.gain.setValueAtTime(.18,now); gain.gain.exponentialRampToValueAtTime(.001,now+.16); osc.connect(gain).connect(a.destination); osc.start(now); osc.stop(now+.17); noise.start(now); } catch {} }
function soundReload() { if (!soundOn) return; try { const a=audio(), o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.setValueAtTime(500,a.currentTime); o.frequency.exponentialRampToValueAtTime(180,a.currentTime+.12); g.gain.setValueAtTime(.035,a.currentTime); g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.14); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime+.15); } catch {} }
function toast(text) { ui.toast.textContent = text; ui.toast.classList.remove('show'); void ui.toast.offsetWidth; ui.toast.classList.add('show'); }
function showHit() { ui.hit.classList.remove('show'); void ui.hit.offsetWidth; ui.hit.classList.add('show'); }
function reload() {
  if (!running || reloadClock > 0 || ammo >= 12 || reserve <= 0) return;
  reloadClock = 1.15; soundReload(); toast('RECARREGANDO');
}
function shoot() {
  if (!running || ended || shotCooldown > 0 || reloadClock > 0) return;
  if (ammo <= 0) { toast(reserve > 0 ? 'SEM MUNIÇÃO — RECARGA' : 'SEM MUNIÇÃO'); reload(); shotCooldown = .35; return; }
  ammo--; shotCooldown = .24; recoil = .11; muzzle.intensity = 4.2; flash.material.opacity = .92; soundShot();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const targets = zombies.filter(z => z.alive).map(z => z.hit);
  const hit = raycaster.intersectObjects(targets, false)[0];
  if (hit && hit.distance < 34) {
    const enemy = zombies.find(z => z.alive && z.hit === hit.object);
    if (enemy) {
      enemy.hp--; showHit();
      if (enemy.hp <= 0) {
        enemy.alive = false; enemy.death = .8; enemy.root.rotation.x = -.35; enemy.root.rotation.z = (enemy.root.position.x > camera.position.x ? 1 : -1) * .28;
        kills++; ui.kills.textContent = String(kills).padStart(2, '0');
      } else { enemy.hitFlash = .12; }
    }
  }
  updateAmmo();
}
function updateAmmo() { ui.ammo.textContent = String(ammo).padStart(2, '0'); ui.reserve.textContent = String(reserve).padStart(2, '0'); }
function spawnEnemy() {
  if (zombies.filter(z => z.alive).length >= 14) return;
  const ahead = rand() > .2, z = camera.position.z + (ahead ? -1 : 1) * (18 + rand() * 12);
  makeZombie((rand() - .5) * 7.3, THREE.MathUtils.clamp(z, -91, 29), (wave - 1) * 5 + Math.floor(rand() * 6));
}
function endGame(victory) {
  if (ended) return; ended = true; running = false;
  ui.title.innerHTML = victory ? 'VOCÊ<br><em>SOBREVIVEU.</em>' : 'A CIDADE<br><em>TE LEVOU.</em>';
  ui.copy.textContent = victory ? 'A extração chegou. Você conseguiu.' : 'Seu sinal se perdeu entre os mortos.';
  ui.finalKills.textContent = String(kills).padStart(2, '0'); ui.finalWave.textContent = String(wave).padStart(2, '0');
  ui.result.classList.remove('hidden');
}
function startGame() {
  audio();
  if (ended || ui.result.classList.contains('hidden') === false) resetGame();
  running = true; ended = false; ui.start.classList.add('hidden'); ui.result.classList.add('hidden');
  if (window.matchMedia('(pointer: coarse)').matches) $('#mobile-controls').classList.add('playing');
}
function resetGame() {
  for (const z of zombies) scene.remove(z.root); zombies.length = 0;
  health = 100; ammo = 12; reserve = 48; kills = 0; wave = 1; elapsed = 0; spawnClock = 4.5; yaw = 0; pitch = -.025; camera.position.set(0, 1.7, 4); camera.rotation.set(pitch, yaw, 0, 'YXZ');
  ui.kills.textContent = '00'; ui.wave.textContent = '01'; ui.health.style.width = '100%'; ui.healthText.textContent = '100'; updateAmmo();
  for (let i = 0; i < 4; i++) makeZombie((i % 2 ? 1 : -1) * (1.7 + rand() * 2), -12 - i * 7, i);
}
ui.startButton.addEventListener('click', startGame);
ui.restart.addEventListener('click', () => { resetGame(); startGame(); });
ui.sound.addEventListener('click', () => { soundOn = !soundOn; ui.sound.innerHTML = soundOn ? '♫ <span>SOM</span>' : '♪ <span>MUDO</span>'; if (soundOn) audio(); });
ui.reloadButton.addEventListener('pointerdown', e => { e.preventDefault(); reload(); });
ui.fireButton.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (!running) return; pointer.down = true; shoot(); });
ui.fireButton.addEventListener('pointerup', e => { e.preventDefault(); pointer.down = false; });
ui.fireButton.addEventListener('pointercancel', () => pointer.down = false);
ui.joystick.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); joy.active = true; joy.id = e.pointerId; ui.joystick.setPointerCapture(e.pointerId); moveJoy(e); });
function moveJoy(e) { const r = ui.joystick.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), len = Math.hypot(dx, dy), max = r.width * .37, scale = Math.min(1, max / (len || 1)); joy.x = dx / max * scale; joy.y = dy / max * scale; ui.knob.style.transform = `translate(${joy.x * max}px,${joy.y * max}px)`; }
ui.joystick.addEventListener('pointermove', e => { if (joy.active && e.pointerId === joy.id) moveJoy(e); });
function stopJoy(e) { if (e.pointerId === joy.id) { joy.active = false; joy.x = joy.y = 0; ui.knob.style.transform = ''; } }
ui.joystick.addEventListener('pointerup', stopJoy); ui.joystick.addEventListener('pointercancel', stopJoy);
canvas.addEventListener('pointerdown', e => {
  if (!running || e.button !== 0) return;
  if (e.pointerType === 'touch') { pointer.touchId = e.pointerId; pointer.x = e.clientX; pointer.y = e.clientY; canvas.setPointerCapture(e.pointerId); }
  else { pointer.down = true; shoot(); }
});
canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' && e.pointerId === pointer.touchId) { look(e.clientX - pointer.x, e.clientY - pointer.y, .004); pointer.x = e.clientX; pointer.y = e.clientY; }
  else if (e.pointerType === 'mouse' && pointer.down) { look(e.movementX || e.clientX - pointer.x, e.movementY || e.clientY - pointer.y, .0023); pointer.x = e.clientX; pointer.y = e.clientY; }
});
function stopPointer(e) { if (e.pointerId === pointer.touchId) pointer.touchId = null; pointer.down = false; }
canvas.addEventListener('pointerup', stopPointer); canvas.addEventListener('pointercancel', stopPointer);
window.addEventListener('keydown', e => { keys.add(e.code); if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); if (e.code === 'Space') shoot(); if (e.code === 'KeyR') reload(); });
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => { keys.clear(); pointer.down = false; joy.active = false; });

function update(dt) {
  shotCooldown = Math.max(0, shotCooldown - dt); hurtCooldown = Math.max(0, hurtCooldown - dt); recoil = Math.max(0, recoil - dt * .7);
  muzzle.intensity = Math.max(0, muzzle.intensity - dt * 30); flash.material.opacity = Math.max(0, flash.material.opacity - dt * 7);
  gun.position.z = -.66 + recoil * .55; gun.rotation.x = -.04 + recoil * 1.15;
  if (!running || ended) return;
  elapsed += dt;
  const left = Math.max(0, 90 - elapsed), seconds = Math.ceil(left);
  ui.timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const newWave = elapsed < 30 ? 1 : elapsed < 60 ? 2 : 3;
  if (newWave !== wave) { wave = newWave; ui.wave.textContent = String(wave).padStart(2, '0'); toast(`ONDA ${String(wave).padStart(2, '0')} — ELES ESTÃO VINDO`); }
  ui.mission.textContent = left <= 15 ? 'EXTRAÇÃO IMINENTE' : 'SINAL DE EXTRAÇÃO';
  spawnClock -= dt;
  if (spawnClock <= 0) { spawnEnemy(); spawnClock = Math.max(2.7, 6.3 - wave * 1.1) + rand() * 1.5; }
  if (pointer.down && window.matchMedia('(pointer: coarse)').matches && shotCooldown <= 0) shoot();
  if (reloadClock > 0) { reloadClock -= dt; if (reloadClock <= 0) { const take = Math.min(12 - ammo, reserve); ammo += take; reserve -= take; updateAmmo(); } }
  const forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - joy.y;
  const side = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + joy.x;
  const length = Math.hypot(forward, side) || 1, speed = (keys.has('ShiftLeft') ? 5.7 : 4.35) * dt;
  const dx = (Math.sin(yaw) * forward + Math.cos(yaw) * side) / length * speed;
  const dz = (-Math.cos(yaw) * forward + Math.sin(yaw) * side) / length * speed;
  camera.position.x = THREE.MathUtils.clamp(camera.position.x + dx, -4.25, 4.25);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z + dz, -84, 13);
  const walking = Math.abs(forward) + Math.abs(side) > .08;
  if (walking) { const bob = Math.sin(elapsed * 11) * .026; camera.position.y = 1.7 + Math.abs(bob); gun.position.y = -.3 + bob * .5; }
  else { camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.7, 8, dt); gun.position.y = THREE.MathUtils.damp(gun.position.y, -.3, 8, dt); }
  for (const enemy of zombies) {
    if (!enemy.alive) { enemy.death -= dt; enemy.root.position.y -= dt * .18; if (enemy.death <= 0) scene.remove(enemy.root); continue; }
    const dxp = camera.position.x - enemy.root.position.x, dzp = camera.position.z - enemy.root.position.z, distance = Math.hypot(dxp, dzp);
    enemy.root.rotation.y = Math.atan2(dxp, -dzp);
    enemy.phase += dt * (distance > 1.5 ? 7 : 3);
    const gait = Math.sin(enemy.phase);
    enemy.armPivots[0].rotation.x = -.62 + gait * .22; enemy.armPivots[1].rotation.x = -.72 - gait * .22;
    enemy.legPivots[0].rotation.x = gait * .52; enemy.legPivots[1].rotation.x = -gait * .52;
    enemy.root.position.y = Math.abs(gait) * .025;
    if (distance > 1.35) { const step = Math.min(distance - 1.1, enemy.speed * (1 + wave * .1) * dt); enemy.root.position.x += dxp / (distance || 1) * step; enemy.root.position.z += dzp / (distance || 1) * step; }
    else if (hurtCooldown <= 0) { hurtCooldown = .8; health = Math.max(0, health - (7 + wave * 2)); ui.health.style.width = `${health}%`; ui.healthText.textContent = String(health); if (health < 36) ui.health.style.background = '#f2503e'; ui.damage.classList.add('show'); setTimeout(() => ui.damage.classList.remove('show'), 170); if (health <= 0) endGame(false); }
  }
  if (left <= 0 && health > 0) endGame(true);
}
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  update(dt);
  renderer.render(scene, camera);
}
window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65)); });
// Keep the virtual controls away from accidental page zoom/scroll gestures on phones and tablets.
document.addEventListener('contextmenu', e => e.preventDefault());
animate();
