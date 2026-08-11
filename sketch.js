/* SPACE DODGER - p5.js v2 SAFE BUILD
   Full replacement for sketch.js
   Features: menu, levels, archive, about, settings, rating, gameplay,
   5 starting lives, +1 permanent life after Dragon levels 5/10/15/20,
   local save for lives/settings/unlocks/ship, mobile multitouch controls.
*/

// ---------- Safe constants ----------
const PI2 = Math.PI * 2;
const HALFPI = Math.PI / 2;
const QUARTERPI = Math.PI / 4;

// ---------- Campaign ----------
const TOTAL_LEVELS = 20;
const START_LIVES = 5;
const MAX_LIVES = 9;
const DRAGON_LEVELS = [5, 10, 15, 20];
const SAVE_KEY = "spaceDodgerCampaignV2";

let state = "HOME";

let level = 1;
let unlockedLevel = 1;
let selectedShip = 0;

let campaignLives = START_LIVES;
let lives = START_LIVES;

let score = 0;
let levelScore = 0;

let levelStartedAt = 0;
let levelDuration = 42000;
let levelTarget = 500;
let levelClearAt = 0;

let rating = 0;

let soundOn = true;
let swappedControls = false;

// ---------- Game objects ----------
let shipPlayer = null;

let bullets = [];
let enemies = [];
let enemyShots = [];
let drops = [];
let particles = [];
let stars = [];

let boss = null;
let bossActive = false;
let bossDefeated = false;

// ---------- Timers ----------
let lastEnemySpawn = 0;
let lastDropSpawn = 0;
let lastFire = 0;

let specialReadyAt = 0;

// Power button visual feedback
let powerPressedUntil = 0;

let shake = 0;

// ---------- Touch / Mouse ----------
let moveId = null;
let fireId = null;

let fireHeld = false;

let mouseMoving = false;
let mouseFiring = false;

let suppressMouseOnce = false;

// ---------- Controls ----------
const joy = {
  x: 90,
  y: 0,
  r: 56,
  knobX: 90,
  knobY: 0
};

const fireBtn = {
  x: 0,
  y: 0,
  r: 52
};

const powerBtn = {
  x: 0,
  y: 0,
  r: 40
};

const pauseBtn = {
  x: 38,
  y: 92,
  r: 22
};

const homeBtn = {
  x: 0,
  y: 92,
  r: 22
};

let joyAngle = -HALFPI;
let joyStrength = 0;

// ---------- Audio ----------
let audioCtx = null;

// ---------- Temporary powers ----------
const powers = {
  MULTI: 0,
  SHIELD: 0,
  BERSERKER: 0,
  CRYO: 0,
  CELESTIAL: 0
};

// ================================================================
// SHIPS
// ================================================================

const SHIPS = [

  {
    name: "NOVA SCOUT",
    unlock: 1,
    edge: "#39d8ff",
    body: "#0a2b43",
    core: "#ffffff",
    power: "BALANCED"
  },

  {
    name: "SOLAR FANG",
    unlock: 3,
    edge: "#ff9a35",
    body: "#51200b",
    core: "#fff0a0",
    power: "BURN SHOT"
  },

  {
    name: "NEBULA WING",
    unlock: 5,
    edge: "#c77aff",
    body: "#32134d",
    core: "#fff3ff",
    power: "GRAVITY PULSE"
  },

  {
    name: "CRYO HAWK",
    unlock: 7,
    edge: "#7eeaff",
    body: "#123b55",
    core: "#ffffff",
    power: "TIME FREEZE"
  },

  {
    name: "VOID SPEAR",
    unlock: 9,
    edge: "#ff62dc",
    body: "#35102f",
    core: "#ffffff",
    power: "PHASE DODGE"
  },

  {
    name: "DRAGON BANE",
    unlock: 10,
    edge: "#ff4c5c",
    body: "#55121b",
    core: "#ffe36a",
    power: "DRAGON RAGE"
  },

  {
    name: "QUANTUM EDGE",
    unlock: 12,
    edge: "#00dfc5",
    body: "#073e43",
    core: "#efffff",
    power: "QUANTUM DASH"
  },

  {
    name: "STAR PALADIN",
    unlock: 15,
    edge: "#ffe15b",
    body: "#51460d",
    core: "#ffffff",
    power: "HOLY SHIELD"
  },

  {
    name: "GALACTIC TITAN",
    unlock: 18,
    edge: "#ee73ff",
    body: "#42194f",
    core: "#ffffbc",
    power: "TITAN CORE"
  },

  {
    name: "MULTIVERSE KING",
    unlock: 20,
    edge: "#ffd43b",
    body: "#503d04",
    core: "#ffffff",
    power: "REALITY BREAK"
  }

];

// ================================================================
// LEVEL NAMES
// ================================================================

const LEVEL_NAMES = [

  "SPACE ROOKIE",
  "STAR CADET",
  "ORBIT SCOUT",
  "ALIEN HUNTER",
  "DRAGON CHALLENGER",

  "COSMIC RANGER",
  "NEBULA KNIGHT",
  "VOID WALKER",
  "STAR COMMANDER",
  "DRAGON SLAYER",

  "GALAXY GUARDIAN",
  "QUANTUM WARRIOR",
  "COSMIC MASTER",
  "STAR LORD",
  "DRAGON CONQUEROR",

  "VOID EMPEROR",
  "GALACTIC TITAN",
  "COSMIC OVERLORD",
  "MULTIVERSE MASTER",
  "SPACE LEGEND"

];

// ================================================================
// SETUP
// ================================================================

function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );

  pixelDensity(
    Math.min(
      2,
      window.devicePixelRatio || 1
    )
  );

  textFont("Arial");

  loadSave();

  createStars();

  updateLayout();

  shipPlayer =
    new SpacePlayer();

  installPointerEvents();

}

// ================================================================
// MAIN DRAW
// ================================================================

function draw() {

  background(
    2,
    6,
    17
  );

  drawStars();

  if (state === "HOME") {

    drawHome();

  } else if (state === "LEVELS") {

    drawLevels();

  } else if (state === "ARCHIVE") {

    drawArchive();

  } else if (state === "ABOUT") {

    drawAbout();

  } else if (state === "SETTINGS") {

    drawSettings();

  } else if (state === "RATING") {

    drawRating();

  } else if (state === "PLAYING") {

    runGame();

  } else if (state === "PAUSED") {

    drawPaused();

  } else if (state === "GAMEOVER") {

    drawGameOver();

  } else if (state === "LEVELUP") {

    drawLevelUp();

  }

}

// ================================================================
// SAVE / LOAD
// ================================================================

function loadSave() {

  try {

    const raw =
      localStorage.getItem(
        SAVE_KEY
      );

    if (!raw) {
      return;
    }

    const data =
      JSON.parse(raw);

    unlockedLevel =
      constrainInt(
        data.unlockedLevel || 1,
        1,
        TOTAL_LEVELS
      );

    selectedShip =
      constrainInt(
        data.selectedShip || 0,
        0,
        SHIPS.length - 1
      );

    campaignLives =
      constrainInt(
        data.campaignLives ||
        START_LIVES,
        START_LIVES,
        MAX_LIVES
      );

    lives =
      campaignLives;

    soundOn =
      data.soundOn !== false;

    swappedControls =
      data.swappedControls === true;

  } catch (error) {

    unlockedLevel = 1;
    selectedShip = 0;
    campaignLives = START_LIVES;
    lives = START_LIVES;
    soundOn = true;
    swappedControls = false;

  }

}

function saveGame() {

  try {

    localStorage.setItem(

      SAVE_KEY,

      JSON.stringify({

        unlockedLevel:
          unlockedLevel,

        selectedShip:
          selectedShip,

        campaignLives:
          campaignLives,

        soundOn:
          soundOn,

        swappedControls:
          swappedControls

      })

    );

  } catch (error) {}

}

// ================================================================
// DRAGON LIFE REWARD
// ================================================================

function awardDragonLife() {

  if (
    !DRAGON_LEVELS.includes(level)
  ) {

    return;

  }

  if (
    campaignLives < MAX_LIVES
  ) {

    campaignLives++;

  }

  campaignLives =
    Math.min(
      campaignLives,
      MAX_LIVES
    );

  lives =
    campaignLives;

  saveGame();

}

// ================================================================
// LEVEL HELPERS
// ================================================================

function isDragonLevel(n) {

  return DRAGON_LEVELS.includes(n);

}

function difficulty() {

  return (
    1 +
    (level - 1) *
    0.055
  );

}

function shipPower() {

  return SHIPS[
    selectedShip
  ].power;

}

// ================================================================
// START LEVEL
// ================================================================

function startLevel(n) {

  level =
    constrainInt(
      n,
      1,
      TOTAL_LEVELS
    );

  score = 0;
  levelScore = 0;

  lives =
    campaignLives;

  levelDuration =
    40000 +
    (level - 1) *
    5500;

  levelTarget =
    Math.floor(

      450 +

      (level - 1) *
      175 +

      Math.pow(
        level,
        1.25
      ) *
      25

    );

  levelStartedAt =
    millis();

  lastEnemySpawn =
    millis();

  lastDropSpawn =
    millis();

  lastFire = 0;

  // POWER IS READY AT START
  specialReadyAt =
    millis();

  powerPressedUntil = 0;

  bullets = [];
  enemies = [];
  enemyShots = [];
  drops = [];
  particles = [];

  boss = null;
  bossActive = false;
  bossDefeated = false;

  resetPowers();

  shipPlayer =
    new SpacePlayer();

  clearPointers();

  state =
    "PLAYING";

}

// ================================================================
// RESET POWERS
// ================================================================

function resetPowers() {

  powers.MULTI = 0;
  powers.SHIELD = 0;
  powers.BERSERKER = 0;
  powers.CRYO = 0;
  powers.CELESTIAL = 0;

}

// ================================================================
// PLAYER
// ================================================================

class SpacePlayer {

  constructor() {

    this.x =
      width / 2;

    this.y =
      height * 0.63;

    this.angle =
      -HALFPI;

    this.r = 17;

    this.invincibleUntil = 0;

  }

  update() {

    if (this.x < -35) {
      this.x = width + 35;
    }

    if (this.x > width + 35) {
      this.x = -35;
    }

    if (this.y < -35) {
      this.y = height + 35;
    }

    if (this.y > height + 35) {
      this.y = -35;
    }

  }

  draw() {

    if (

      millis() <
      this.invincibleUntil &&

      Math.floor(
        millis() / 110
      ) % 2 === 0

    ) {

      return;

    }

    const ship =
      SHIPS[selectedShip];

    push();

    translate(
      this.x,
      this.y
    );

    rotate(
      this.angle +
      HALFPI
    );

    stroke(
      ship.edge
    );

    strokeWeight(2.3);

    fill(
      ship.body
    );

    beginShape();

    vertex(0, -31);
    vertex(-11, -8);
    vertex(-29, 17);
    vertex(-9, 12);
    vertex(0, 23);
    vertex(9, 12);
    vertex(29, 17);
    vertex(11, -8);

    endShape(CLOSE);

    noStroke();

    fill(
      ship.core
    );

    ellipse(
      0,
      -5,
      9,
      16
    );

    fill(
      ship.edge
    );

    triangle(
      -5,
      17,
      5,
      17,
      0,
      29
    );

    pop();

    if (
      millis() <
      powers.SHIELD
    ) {

      drawShield(
        this.x,
        this.y
      );

    }

  }

}

// ================================================================
// PLAYER POWER
// ================================================================

function playerSpeed() {

  let speed = 5;

  if (
    shipPower() ===
    "QUANTUM DASH"
  ) {

    speed *= 1.35;

  }

  if (
    shipPower() ===
    "TITAN CORE"
  ) {

    speed *= 0.9;

  }

  return speed;

}

function damageMultiplier() {

  let damage = 1;

  if (
    shipPower() ===
    "BURN SHOT"
  ) {

    damage *= 1.12;

  }

  if (
    shipPower() ===
    "DRAGON RAGE" &&
    bossActive
  ) {

    damage *= 1.8;

  }

  if (
    shipPower() ===
    "TITAN CORE"
  ) {

    damage *= 1.6;

  }

  if (
    shipPower() ===
    "REALITY BREAK"
  ) {

    damage *= 2;

  }

  if (
    millis() <
    powers.BERSERKER
  ) {

    damage *= 1.55;

  }

  return damage;

}

function fireDelay() {

  let delay = 150;

  if (
    shipPower() ===
    "QUANTUM DASH"
  ) {

    delay = 90;

  }

  if (
    shipPower() ===
    "TITAN CORE"
  ) {

    delay = 105;

  }

  if (
    shipPower() ===
    "REALITY BREAK"
  ) {

    delay = 75;

  }

  if (
    millis() <
    powers.BERSERKER
  ) {

    delay = 68;

  }

  return delay;

}

function drawShield(x, y) {

  noFill();

  stroke(
    70,
    210,
    245,
    160
  );

  strokeWeight(2);

  circle(
    x,
    y,
    64 +
    Math.sin(
      frameCount * 0.08
    ) * 4
  );

}

// ================================================================
// GAME LOOP
// ================================================================

function runGame() {

  updateShake();

  updateJoystickMovement();

  if (fireHeld) {
    shoot();
  }

  shipPlayer.update();

  updateBullets();
  updateEnemies();
  updateEnemyShots();
  updateDrops();
  updateParticles();

  if (bossActive) {
    updateBoss();
  }

  spawnEnemies();
  spawnDrops();
  checkBossSpawn();

  collideBulletsEnemies();
  collideShipEnemies();
  collideShipShots();
  collideBulletsBoss();

  checkLevelComplete();

  drawHUD();
  drawControls();

  shipPlayer.draw();

}

// ================================================================
// ENEMY SPAWN
// ================================================================

function spawnEnemies() {

  if (bossActive) {
    return;
  }

  const delay =
    Math.max(
      450,
      1050 -
      level * 28
    );

  if (
    millis() -
    lastEnemySpawn <
    delay
  ) {

    return;

  }

  const count =
    (
      level >= 12 &&
      Math.random() < 0.15
    )
      ? 2
      : 1;

  for (
    let i = 0;
    i < count;
    i++
  ) {

    enemies.push(
      new Enemy()
    );

  }

  lastEnemySpawn =
    millis();

}

// ================================================================
// BOSS SPAWN
// ================================================================

function checkBossSpawn() {

  if (
    !isDragonLevel(level) ||
    bossActive ||
    bossDefeated
  ) {

    return;

  }

  if (
    millis() -
    levelStartedAt >=
    levelDuration * 0.58
  ) {

    boss =
      new DragonBoss();

    bossActive = true;

    enemies = [];
    drops = [];

    shake = 14;

  }

}

// ================================================================
// LEVEL COMPLETE
// ================================================================

function checkLevelComplete() {

  const elapsed =
    millis() -
    levelStartedAt;

  const timeDone =
    elapsed >=
    levelDuration;

  const scoreDone =
    levelScore >=
    levelTarget;

  const bossDone =
    !isDragonLevel(level) ||
    bossDefeated;

  if (
    timeDone &&
    scoreDone &&
    bossDone
  ) {

    completeLevel();

  }

}

function completeLevel() {

  if (
    state !==
    "PLAYING"
  ) {

    return;

  }

  clearPointers();

  if (
    isDragonLevel(level)
  ) {

    awardDragonLife();

  }

  if (
    level <
    TOTAL_LEVELS
  ) {

    unlockedLevel =
      Math.max(
        unlockedLevel,
        level + 1
      );

  }

  saveGame();

  createCelebration();

  levelClearAt =
    millis();

  state =
    "LEVELUP";

}

// ================================================================
// BULLETS
// ================================================================

class Bullet {

  constructor(
    x,
    y,
    angle,
    power
  ) {

    this.x = x;
    this.y = y;
    this.angle = angle;
    this.power = power;

    this.speed = 11;

    this.r =
      4 + power;

    this.life = 110;

  }

  update() {

    this.x +=
      Math.cos(this.angle) *
      this.speed;

    this.y +=
      Math.sin(this.angle) *
      this.speed;

    this.life--;

  }

  draw() {

    const ship =
      SHIPS[selectedShip];

    stroke(
      ship.edge
    );

    strokeWeight(
      2.5 + this.power
    );

    line(

      this.x,
      this.y,

      this.x -
      Math.cos(this.angle) *
      15,

      this.y -
      Math.sin(this.angle) *
      15

    );

  }

  dead() {

    return (

      this.life <= 0 ||

      this.x < -80 ||
      this.x > width + 80 ||

      this.y < -80 ||
      this.y > height + 80

    );

  }

}

function shoot() {

  if (
    state !==
    "PLAYING"
  ) {

    return;

  }

  if (
    millis() -
    lastFire <
    fireDelay()
  ) {

    return;

  }

  lastFire =
    millis();

  playFireSound();

  let angles = [
    shipPlayer.angle
  ];

  if (
    millis() <
    powers.MULTI
  ) {

    angles = [

      shipPlayer.angle -
      sdRadians(12),

      shipPlayer.angle,

      shipPlayer.angle +
      sdRadians(12)

    ];

  }

  if (
    shipPower() ===
    "REALITY BREAK"
  ) {

    angles = [

      -0.35,
      -0.18,
      0,
      0.18,
      0.35

    ].map(
      a =>
        shipPlayer.angle + a
    );

  }

  for (
    const angle of angles
  ) {

    bullets.push(

      new Bullet(

        shipPlayer.x +
        Math.cos(angle) *
        27,

        shipPlayer.y +
        Math.sin(angle) *
        27,

        angle,

        damageMultiplier()

      )

    );

  }

}

function updateBullets() {

  for (
    let i =
      bullets.length - 1;
    i >= 0;
    i--
  ) {

    bullets[i].update();

    if (
      bullets[i].dead()
    ) {

      bullets.splice(
        i,
        1
      );

    } else {

      bullets[i].draw();

    }

  }

}

// ================================================================
// ENEMY
// ================================================================

class Enemy {

  constructor() {

    this.type =
      [
        "SCOUT",
        "INTERCEPTOR",
        "HUNTER",
        "HEAVY",
        "ELITE"
      ][
        Math.floor(
          Math.random() * 5
        )
      ];

    if (
      level <= 3
    ) {

      this.type =
        Math.random() < 0.65
          ? "SCOUT"
          : "INTERCEPTOR";

    }

    const side =
      Math.floor(
        Math.random() * 4
      );

    if (side === 0) {

      this.x =
        Math.random() * width;

      this.y = -60;

    } else if (side === 1) {

      this.x =
        width + 60;

      this.y =
        130 +
        Math.random() *
        height * 0.55;

    } else if (side === 2) {

      this.x =
        Math.random() * width;

      this.y =
        height + 60;

    } else {

      this.x = -60;

      this.y =
        130 +
        Math.random() *
        height * 0.55;

    }

    this.r = 22;
    this.hp = 1;

    this.speed =
      (
        1.3 +
        Math.random() * 0.9
      ) *
      difficulty();

    if (
      this.type ===
      "HUNTER"
    ) {

      this.r = 25;
      this.hp = 2;

    }

    if (
      this.type ===
      "HEAVY"
    ) {

      this.r = 32;
      this.hp = 4;

      this.speed *= 0.65;

    }

    if (
      this.type ===
      "ELITE"
    ) {

      this.r = 29;
      this.hp = 3;

      this.speed *= 0.9;

    }

    if (
      this.type ===
      "INTERCEPTOR"
    ) {

      this.speed *= 1.3;

    }

    this.phase =
      Math.random() *
      PI2;

    this.rot =
      Math.random() *
      PI2;

    this.lastShot =
      millis() +
      1200 +
      Math.random() * 1800;

  }

  update() {

    let angle =
      Math.atan2(

        shipPlayer.y -
        this.y,

        shipPlayer.x -
        this.x

      );

    if (
      this.type ===
      "INTERCEPTOR"
    ) {

      angle +=
        Math.sin(
          frameCount * 0.045 +
          this.phase
        ) * 0.55;

    }

    if (
      this.type ===
      "HUNTER"
    ) {

      angle +=
        Math.sin(
          frameCount * 0.025 +
          this.phase
        ) * 0.18;

    }

    let speed =
      this.speed;

    if (
      shipPower() ===
      "GRAVITY PULSE"
    ) {

      speed *= 0.38;

    }

    if (
      shipPower() ===
      "TIME FREEZE"
    ) {

      speed *= 0.3;

    }

    if (
      millis() <
      powers.CRYO
    ) {

      speed *= 0.45;

    }

    this.x +=
      Math.cos(angle) *
      speed;

    this.y +=
      Math.sin(angle) *
      speed;

    this.rot += 0.02;

    if (

      (
        this.type === "HUNTER" ||
        this.type === "ELITE"
      ) &&

      millis() -
      this.lastShot >

      Math.max(
        1200,
        2600 -
        level * 25
      )

    ) {

      this.fire();

      this.lastShot =
        millis();

    }

  }

  fire() {

    const angle =
      Math.atan2(

        shipPlayer.y -
        this.y,

        shipPlayer.x -
        this.x

      );

    enemyShots.push(

      new EnemyShot(

        this.x,
        this.y,
        angle,

        this.type ===
        "ELITE"
          ? 4.1
          : 3

      )

    );

  }

  draw() {

    push();

    translate(
      this.x,
      this.y
    );

    rotate(
      this.rot
    );

    if (
      this.type ===
      "SCOUT"
    ) {

      drawScout();

    } else if (
      this.type ===
      "INTERCEPTOR"
    ) {

      drawInterceptor();

    } else if (
      this.type ===
      "HUNTER"
    ) {

      drawHunter();

    } else if (
      this.type ===
      "HEAVY"
    ) {

      drawHeavy();

    } else {

      drawElite();

    }

    pop();

  }

  dead() {

    return (

      this.x < -140 ||
      this.x > width + 140 ||

      this.y < -140 ||
      this.y > height + 140

    );

  }

}

// ================================================================
// ENEMY ART
// ================================================================

function drawScout() {

  stroke("#65dff5");
  strokeWeight(2);
  fill("#183f58");

  ellipse(0, 5, 48, 20);
  ellipse(0, -2, 28, 18);

  noStroke();

  fill("#c8fbff");
  ellipse(0, -3, 10, 7);

  fill("#4de5ff");

  circle(-15, 6, 4);
  circle(0, 9, 4);
  circle(15, 6, 4);

}

function drawInterceptor() {

  stroke("#ef5dce");
  strokeWeight(2);
  fill("#42143f");

  beginShape();

  vertex(0, -27);
  vertex(13, -10);
  vertex(34, -5);
  vertex(20, 7);
  vertex(11, 24);
  vertex(0, 13);
  vertex(-11, 24);
  vertex(-20, 7);
  vertex(-34, -5);
  vertex(-13, -10);

  endShape(CLOSE);

  noStroke();

  fill("#ffe0f8");

  ellipse(0, -2, 9, 14);

}

function drawHunter() {

  stroke("#ffad43");
  strokeWeight(2.2);
  fill("#572b14");

  beginShape();

  vertex(0, -30);
  vertex(12, -18);
  vertex(27, -20);
  vertex(22, -4);
  vertex(31, 16);
  vertex(10, 11);
  vertex(0, 27);
  vertex(-10, 11);
  vertex(-31, 16);
  vertex(-22, -4);
  vertex(-27, -20);
  vertex(-12, -18);

  endShape(CLOSE);

  noStroke();

  fill("#fff0c7");

  ellipse(0, -2, 13, 18);

}

function drawHeavy() {

  stroke("#ff5757");
  strokeWeight(2.5);
  fill("#4b1518");

  beginShape();

  vertex(0, -34);
  vertex(19, -24);
  vertex(36, -7);
  vertex(31, 20);
  vertex(14, 30);
  vertex(0, 24);
  vertex(-14, 30);
  vertex(-31, 20);
  vertex(-36, -7);
  vertex(-19, -24);

  endShape(CLOSE);

  noStroke();

  fill("#ffb4b4");

  ellipse(0, -4, 15, 20);

}

function drawElite() {

  stroke("#b879ff");
  strokeWeight(2.5);
  fill("#32184d");

  beginShape();

  vertex(0, -36);
  vertex(14, -20);
  vertex(32, -12);
  vertex(22, 4);
  vertex(28, 23);
  vertex(9, 17);
  vertex(0, 31);
  vertex(-9, 17);
  vertex(-28, 23);
  vertex(-22, 4);
  vertex(-32, -12);
  vertex(-14, -20);

  endShape(CLOSE);

  noStroke();

  fill("#f3d9ff");

  ellipse(0, -5, 12, 18);

}

function updateEnemies() {

  for (
    let i =
      enemies.length - 1;
    i >= 0;
    i--
  ) {

    const enemy =
      enemies[i];

    enemy.update();

    if (
      enemy.dead()
    ) {

      enemies.splice(
        i,
        1
      );

    } else {

      enemy.draw();

    }

  }

}

// ================================================================
// ENEMY SHOTS
// ================================================================

class EnemyShot {

  constructor(
    x,
    y,
    angle,
    speed
  ) {

    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;

    this.r = 7;
    this.life = 220;

  }

  update() {

    this.x +=
      Math.cos(this.angle) *
      this.speed;

    this.y +=
      Math.sin(this.angle) *
      this.speed;

    this.life--;

  }

  draw() {

    stroke("#ff5265");
    strokeWeight(3);

    line(

      this.x,
      this.y,

      this.x -
      Math.cos(this.angle) *
      11,

      this.y -
      Math.sin(this.angle) *
      11

    );

  }

  dead() {

    return (

      this.life <= 0 ||

      this.x < -100 ||
      this.x > width + 100 ||

      this.y < -100 ||
      this.y > height + 100

    );

  }

}

function updateEnemyShots() {

  for (
    let i =
      enemyShots.length - 1;
    i >= 0;
    i--
  ) {

    const shot =
      enemyShots[i];

    shot.update();

    if (
      shot.dead()
    ) {

      enemyShots.splice(
        i,
        1
      );

    } else {

      shot.draw();

    }

  }

}

// ================================================================
// DRAGON BOSS
// ================================================================

class DragonBoss {

  constructor() {

    this.x =
      width / 2;

    this.y = -100;

    this.targetY =
      Math.max(
        125,
        height * 0.18
      );

    this.r = 82;

    this.maxHp =
      900 +
      level * 170;

    this.hp =
      this.maxHp;

    this.phase = 1;
    this.t = 0;

    this.lastAttack =
      millis();

  }

  update() {

    if (
      this.y <
      this.targetY
    ) {

      this.y += 1.2;

      return;

    }

    const ratio =
      this.hp /
      this.maxHp;

    this.phase =
      ratio > 0.6
        ? 1
        : ratio > 0.3
          ? 2
          : 3;

    this.t +=
      this.phase === 3
        ? 0.021
        : 0.014;

    this.x =
      width / 2 +
      Math.sin(this.t) *
      width *
      0.28;

    const delay =
      this.phase === 1
        ? 2200
        : this.phase === 2
          ? 1500
          : 1050;

    if (
      millis() -
      this.lastAttack >
      delay
    ) {

      this.attack();

      this.lastAttack =
        millis();

    }

  }

  attack() {

    const base =
      Math.atan2(

        shipPlayer.y -
        this.y,

        shipPlayer.x -
        this.x

      );

    const spread =
      this.phase === 1
        ? [0]
        : this.phase === 2
          ? [-16, 0, 16]
          : [-30, -15, 0, 15, 30];

    for (
      const degree of spread
    ) {

      enemyShots.push(

        new EnemyShot(

          this.x,
          this.y + 35,

          base +
          sdRadians(degree),

          this.phase === 3
            ? 4.2
            : 3.2

        )

      );

    }

  }

  draw() {

    const edge =
      this.phase === 3
        ? "#ff304d"
        : "#ff8238";

    push();

    translate(
      this.x,
      this.y
    );

    stroke(edge);
    strokeWeight(3.5);

    fill(
      this.phase === 3
        ? "#65101b"
        : "#52180e"
    );

    beginShape();

    vertex(-25, -4);
    vertex(-95, -45);
    vertex(-65, 5);
    vertex(-105, 38);
    vertex(-30, 25);

    endShape(CLOSE);

    beginShape();

    vertex(25, -4);
    vertex(95, -45);
    vertex(65, 5);
    vertex(105, 38);
    vertex(30, 25);

    endShape(CLOSE);

    ellipse(
      0,
      8,
      92,
      120
    );

    noStroke();

    fill(
      this.phase === 3
        ? "#ff1744"
        : "#fff05a"
    );

    ellipse(-14, -34, 11, 8);
    ellipse(14, -34, 11, 8);

    pop();

  }

}

function updateBoss() {

  if (!boss) {
    return;
  }

  boss.update();
  boss.draw();

  drawBossBar();

  if (
    boss.hp <= 0
  ) {

    const reward =
      1000 +
      level * 100;

    score += reward;
    levelScore += reward;

    createExplosion(
      boss.x,
      boss.y,
      100,
      "#ff6735"
    );

    enemyShots = [];

    boss = null;

    bossActive = false;
    bossDefeated = true;

    shake = 24;

  }

}

function drawBossBar() {

  if (!boss) {
    return;
  }

  const w =
    Math.min(
      330,
      width * 0.74
    );

  const x =
    width / 2 -
    w / 2;

  const y = 112;

  const ratio =
    constrain(
      boss.hp /
      boss.maxHp,
      0,
      1
    );

  label(
    "METEOR DRAGON  •  PHASE " +
    boss.phase,

    width / 2,
    y - 12,
    11,
    "#e8a08a",
    CENTER,
    CENTER,
    true
  );

  noStroke();

  fill(
    255,
    255,
    255,
    30
  );

  rect(
    x,
    y,
    w,
    9,
    4
  );

  fill("#eb4637");

  rect(
    x,
    y,
    w * ratio,
    9,
    4
  );

}

// ================================================================
// COLLISIONS
// ================================================================

function collideBulletsEnemies() {

  for (
    let i =
      enemies.length - 1;
    i >= 0;
    i--
  ) {

    const enemy =
      enemies[i];

    for (
      let j =
        bullets.length - 1;
      j >= 0;
      j--
    ) {

      const bullet =
        bullets[j];

      if (

        sdDist(
          enemy.x,
          enemy.y,
          bullet.x,
          bullet.y
        ) <

        enemy.r +
        bullet.r

      ) {

        enemy.hp -=
          bullet.power;

        bullets.splice(
          j,
          1
        );

        createExplosion(
          bullet.x,
          bullet.y,
          4,
          SHIPS[selectedShip].edge
        );

        if (
          enemy.hp <= 0
        ) {

          let points = 30;

          if (
            enemy.type === "HUNTER"
          ) {
            points = 45;
          }

          if (
            enemy.type === "HEAVY"
          ) {
            points = 70;
          }

          if (
            enemy.type === "ELITE"
          ) {
            points = 100;
          }

          score += points;
          levelScore += points;

          createExplosion(

            enemy.x,
            enemy.y,

            enemy.type === "HEAVY"
              ? 28
              : 18,

            SHIPS[selectedShip].edge

          );

          shake =
            enemy.type === "HEAVY"
              ? 7
              : 3;

          enemies.splice(
            i,
            1
          );

        }

        break;

      }

    }

  }

}

function collideBulletsBoss() {

  if (
    !bossActive ||
    !boss
  ) {

    return;

  }

  for (
    let i =
      bullets.length - 1;
    i >= 0;
    i--
  ) {

    const bullet =
      bullets[i];

    if (

      sdDist(
        bullet.x,
        bullet.y,
        boss.x,
        boss.y
      ) <

      boss.r +
      bullet.r

    ) {

      boss.hp -=

        (
          10 +
          bullet.power * 8
        ) *
        damageMultiplier();

      bullets.splice(
        i,
        1
      );

      createExplosion(
        bullet.x,
        bullet.y,
        3,
        "#ff9a40"
      );

    }

  }

}

function collideShipEnemies() {

  if (
    millis() <
    shipPlayer.invincibleUntil
  ) {

    return;

  }

  for (
    let i =
      enemies.length - 1;
    i >= 0;
    i--
  ) {

    const enemy =
      enemies[i];

    if (

      sdDist(

        shipPlayer.x,
        shipPlayer.y,

        enemy.x,
        enemy.y

      ) <

      shipPlayer.r +
      enemy.r * 0.72

    ) {

      if (
        millis() <
        powers.SHIELD
      ) {

        enemies.splice(
          i,
          1
        );

        createExplosion(
          enemy.x,
          enemy.y,
          25,
          "#00cfff"
        );

        shake = 5;

        return;

      }

      if (

        shipPower() ===
        "PHASE DODGE" &&

        Math.random() < 0.65

      ) {

        shipPlayer.invincibleUntil =
          millis() + 600;

        return;

      }

      enemies.splice(
        i,
        1
      );

      damagePlayer();

      return;

    }

  }

}

function collideShipShots() {

  if (
    millis() <
    shipPlayer.invincibleUntil
  ) {

    return;

  }

  for (
    let i =
      enemyShots.length - 1;
    i >= 0;
    i--
  ) {

    const shot =
      enemyShots[i];

    if (

      sdDist(

        shipPlayer.x,
        shipPlayer.y,

        shot.x,
        shot.y

      ) <

      shipPlayer.r +
      shot.r

    ) {

      if (
        millis() <
        powers.SHIELD
      ) {

        enemyShots.splice(
          i,
          1
        );

        createExplosion(
          shot.x,
          shot.y,
          8,
          "#00cfff"
        );

        shake = 4;

        return;

      }

      enemyShots.splice(
        i,
        1
      );

      damagePlayer();

      return;

    }

  }

}

function damagePlayer() {

  lives--;

  createExplosion(
    shipPlayer.x,
    shipPlayer.y,
    35,
    "#ff5968"
  );

  shipPlayer.invincibleUntil =
    millis() + 1800;

  shake = 11;

  if (
    lives <= 0
  ) {

    clearPointers();

    state =
      "GAMEOVER";

  }

}

// ================================================================
// POWER DROPS
// ================================================================

class Drop {

  constructor() {

    this.type =
      [
        "MULTI",
        "SHIELD",
        "NOVA",
        "BERSERKER",
        "CRYO"
      ][
        Math.floor(
          Math.random() * 5
        )
      ];

    this.x =
      55 +
      Math.random() *
      (width - 110);

    this.y =
      145 +
      Math.random() *
      Math.max(
        80,
        height - 300
      );

    this.r = 22;
    this.life = 800;
    this.rot = 0;

  }

  update() {

    this.rot += 0.04;
    this.life--;

  }

  draw() {

    const colors = {

      MULTI: "#ffe600",
      SHIELD: "#00cfff",
      NOVA: "#ffffff",
      BERSERKER: "#ff3455",
      CRYO: "#9eefff"

    };

    const colorValue =
      colors[this.type];

    push();

    translate(
      this.x,
      this.y
    );

    rotate(
      this.rot
    );

    stroke(colorValue);
    strokeWeight(2);

    fill(
      20,
      30,
      40,
      100
    );

    circle(
      0,
      0,
      44
    );

    pop();

    let textValue = "CR";

    if (
      this.type === "BERSERKER"
    ) {

      textValue = "BR";

    } else if (
      this.type === "SHIELD"
    ) {

      textValue = "S";

    } else if (
      this.type === "MULTI"
    ) {

      textValue = "M";

    } else if (
      this.type === "NOVA"
    ) {

      textValue = "N";

    }

    label(
      textValue,
      this.x,
      this.y,
      9,
      "#ffffff",
      CENTER,
      CENTER,
      true
    );

  }

}

function spawnDrops() {

  if (

    millis() -
    lastDropSpawn <

    Math.max(
      7000,
      9500 -
      level * 80
    )

  ) {

    return;

  }

  if (
    drops.length < 1
  ) {

    drops.push(
      new Drop()
    );

  }

  lastDropSpawn =
    millis();

}

function updateDrops() {

  for (
    let i =
      drops.length - 1;
    i >= 0;
    i--
  ) {

    const drop =
      drops[i];

    drop.update();

    if (
      drop.life <= 0
    ) {

      drops.splice(
        i,
        1
      );

    } else {

      drop.draw();

    }

  }

  for (
    let i =
      drops.length - 1;
    i >= 0;
    i--
  ) {

    const drop =
      drops[i];

    if (

      sdDist(

        shipPlayer.x,
        shipPlayer.y,

        drop.x,
        drop.y

      ) <

      shipPlayer.r +
      drop.r

    ) {

      activatePower(
        drop.type
      );

      score += 50;
      levelScore += 50;

      createExplosion(
        drop.x,
        drop.y,
        20,
        "#ffe15b"
      );

      drops.splice(
        i,
        1
      );

    }

  }

}

function activatePower(type) {

  playPowerSound();

  const end =
    millis() + 7000;

  if (
    type === "MULTI"
  ) {

    powers.MULTI = end;

  } else if (
    type === "SHIELD"
  ) {

    powers.SHIELD = end;

  } else if (
    type === "BERSERKER"
  ) {

    powers.BERSERKER = end;

  } else if (
    type === "CRYO"
  ) {

    powers.CRYO = end;

  } else if (
    type === "NOVA"
  ) {

    for (
      let i =
        enemies.length - 1;
      i >= 0;
      i--
    ) {

      createExplosion(
        enemies[i].x,
        enemies[i].y,
        15
      );

      enemies.splice(
        i,
        1
      );

      score += 20;
      levelScore += 20;

    }

    shake = 14;

  }

  specialReadyAt =
    millis() + 12000;

}

// ================================================================
// SHIP SPECIAL / POWER BUTTON
// ================================================================

function useSpecial() {

  if (
    state !==
    "PLAYING"
  ) {

    return;

  }

  const now =
    millis();

  // Still refilling
  if (
    now <
    specialReadyAt
  ) {

    return;

  }

  // Visual press feedback
  powerPressedUntil =
    now + 280;

  playPowerSound();

  const power =
    shipPower();

  // ------------------------------------------------------------
  // BALANCED / BURN SHOT / DRAGON RAGE / TITAN CORE
  // Extra combat power
  // ------------------------------------------------------------

  if (
    power === "BALANCED" ||
    power === "BURN SHOT" ||
    power === "DRAGON RAGE" ||
    power === "TITAN CORE"
  ) {

    powers.BERSERKER =
      now + 6000;

  }

  // ------------------------------------------------------------
  // GRAVITY PULSE / TIME FREEZE
  // Extra slow effect
  // ------------------------------------------------------------

  else if (

    power === "GRAVITY PULSE" ||
    power === "TIME FREEZE"

  ) {

    powers.CRYO =
      now + 6500;

  }

  // ------------------------------------------------------------
  // PHASE DODGE / QUANTUM DASH
  // Temporary invincibility
  // ------------------------------------------------------------

  else if (

    power === "PHASE DODGE" ||
    power === "QUANTUM DASH"

  ) {

    shipPlayer.invincibleUntil =
      now + 4500;

  }

  // ------------------------------------------------------------
  // HOLY SHIELD
  // ------------------------------------------------------------

  else if (
    power === "HOLY SHIELD"
  ) {

    powers.SHIELD =
      now + 7000;

  }

  // ------------------------------------------------------------
  // REALITY BREAK
  // ------------------------------------------------------------

  else if (
    power === "REALITY BREAK"
  ) {

    powers.SHIELD =
      now + 6500;

    powers.BERSERKER =
      now + 6500;

    for (
      let i =
        enemies.length - 1;
      i >= 0;
      i--
    ) {

      createExplosion(
        enemies[i].x,
        enemies[i].y,
        15
      );

      enemies.splice(
        i,
        1
      );

      score += 35;
      levelScore += 35;

    }

    if (
      boss
    ) {

      boss.hp -=
        boss.maxHp * 0.12;

    }

    shake = 18;

  }

  // ------------------------------------------------------------
  // IMPORTANT:
  // Power button now needs REFILL TIME after every use.
  // ------------------------------------------------------------

  specialReadyAt =
    now + 15000;

}

// ================================================================
// PARTICLES
// ================================================================

class Particle {

  constructor(
    x,
    y,
    colorValue
  ) {

    const angle =
      Math.random() *
      PI2;

    const speed =
      1 +
      Math.random() * 5;

    this.x = x;
    this.y = y;

    this.vx =
      Math.cos(angle) *
      speed;

    this.vy =
      Math.sin(angle) *
      speed;

    this.life = 220;

    this.size =
      2 +
      Math.random() * 5;

    this.color =
      colorValue ||
      "#ff8a30";

  }

  update() {

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.97;
    this.vy *= 0.97;

    this.life -= 7;

  }

  draw() {

    const c =
      color(this.color);

    noStroke();

    fill(

      red(c),
      green(c),
      blue(c),
      this.life

    );

    circle(
      this.x,
      this.y,
      this.size
    );

  }

}

function createExplosion(
  x,
  y,
  amount,
  colorValue
) {

  for (
    let i = 0;
    i < amount;
    i++
  ) {

    particles.push(

      new Particle(
        x,
        y,
        colorValue
      )

    );

  }

}

function updateParticles() {

  for (
    let i =
      particles.length - 1;
    i >= 0;
    i--
  ) {

    particles[i].update();
    particles[i].draw();

    if (
      particles[i].life <= 0
    ) {

      particles.splice(
        i,
        1
      );

    }

  }

}

function createCelebration() {

  const colors = [

    "#ffe600",
    "#00ddff",
    "#ff4dcc",
    "#ffffff"

  ];

  for (
    let i = 0;
    i < 90;
    i++
  ) {

    particles.push(

      new Particle(

        Math.random() *
        width,

        Math.random() *
        height,

        colors[
          Math.floor(
            Math.random() *
            colors.length
          )
        ]

      )

    );

  }

}

// ================================================================
// SHAKE
// ================================================================

function updateShake() {

  if (
    shake <= 0
  ) {

    return;

  }

  shake *= 0.86;

  if (
    shake < 0.2
  ) {

    shake = 0;

  }

}

// ================================================================
// CONTROLS
// ================================================================

function updateLayout() {

  pauseBtn.x = 38;
  pauseBtn.y = 92;

  homeBtn.x =
    width - 38;

  homeBtn.y = 92;

  const y =
    height - 105;

  joy.x =
    swappedControls
      ? width - 90
      : 90;

  joy.y = y;

  joy.knobX =
    joy.x;

  joy.knobY =
    joy.y;

  fireBtn.x =
    swappedControls
      ? 90
      : width - 90;

  fireBtn.y = y;

  powerBtn.x =
    width / 2;

  powerBtn.y = y;

}

function updateJoystick(
  x,
  y
) {

  let dx =
    x - joy.x;

  let dy =
    y - joy.y;

  let distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    );

  if (
    distance >
    joy.r
  ) {

    const angle =
      Math.atan2(
        dy,
        dx
      );

    dx =
      Math.cos(angle) *
      joy.r;

    dy =
      Math.sin(angle) *
      joy.r;

    distance =
      joy.r;

  }

  joy.knobX =
    joy.x + dx;

  joy.knobY =
    joy.y + dy;

  if (
    distance > 5
  ) {

    joyAngle =
      Math.atan2(
        dy,
        dx
      );

    joyStrength =
      constrain(
        distance /
        joy.r,
        0,
        1
      );

    shipPlayer.angle =
      joyAngle;

  }

}

function updateJoystickMovement() {

  if (
    moveId === null &&
    !mouseMoving
  ) {

    joyStrength = 0;

    return;

  }

  if (
    joyStrength > 0
  ) {

    const speed =
      playerSpeed() *
      joyStrength;

    shipPlayer.x +=
      Math.cos(joyAngle) *
      speed;

    shipPlayer.y +=
      Math.sin(joyAngle) *
      speed;

  }

}

function resetJoy() {

  joy.knobX =
    joy.x;

  joy.knobY =
    joy.y;

  joyStrength = 0;

}

function clearPointers() {

  moveId = null;
  fireId = null;

  fireHeld = false;

  mouseMoving = false;
  mouseFiring = false;

  resetJoy();

}

// ================================================================
// POINTER EVENTS
// ================================================================

function installPointerEvents() {

  const canvas =
    document.querySelector(
      "canvas"
    );

  if (!canvas) {
    return;
  }

  canvas.style.touchAction =
    "none";

  canvas.style.userSelect =
    "none";

  canvas.addEventListener(
    "pointerdown",
    onPointerDown,
    { passive: false }
  );

  canvas.addEventListener(
    "pointermove",
    onPointerMove,
    { passive: false }
  );

  canvas.addEventListener(
    "pointerup",
    onPointerUp,
    { passive: false }
  );

  canvas.addEventListener(
    "pointercancel",
    onPointerUp,
    { passive: false }
  );

}

function pointerPos(event) {

  const rect =
    event.currentTarget
      .getBoundingClientRect();

  return {

    x:
      (
        event.clientX -
        rect.left
      ) *
      (
        width /
        rect.width
      ),

    y:
      (
        event.clientY -
        rect.top
      ) *
      (
        height /
        rect.height
      )

  };

}

function onPointerDown(event) {

  event.preventDefault();

  suppressMouseOnce = true;

  initAudio();

  const p =
    pointerPos(event);

  const x = p.x;
  const y = p.y;

  if (
    state ===
    "PLAYING"
  ) {

    // POWER BUTTON HAS PRIORITY
    if (

      sdDist(
        x,
        y,
        powerBtn.x,
        powerBtn.y
      ) <=
      powerBtn.r + 24

    ) {

      useSpecial();

      return;

    }

    if (

      moveId === null &&

      sdDist(
        x,
        y,
        joy.x,
        joy.y
      ) <=
      joy.r + 20

    ) {

      moveId =
        event.pointerId;

      updateJoystick(
        x,
        y
      );

      return;

    }

    if (

      fireId === null &&

      sdDist(
        x,
        y,
        fireBtn.x,
        fireBtn.y
      ) <=
      fireBtn.r + 20

    ) {

      fireId =
        event.pointerId;

      fireHeld = true;

      shoot();

      return;

    }

    if (

      sdDist(
        x,
        y,
        pauseBtn.x,
        pauseBtn.y
      ) <= 34

    ) {

      state = "PAUSED";

      clearPointers();

      return;

    }

    if (

      sdDist(
        x,
        y,
        homeBtn.x,
        homeBtn.y
      ) <= 34

    ) {

      state = "HOME";

      clearPointers();

      return;

    }

    return;

  }

  if (
    state ===
    "ARCHIVE"
  ) {

    archivePointerDown(
      x,
      y
    );

    return;

  }

  handleTap(
    x,
    y
  );

}

function onPointerMove(event) {

  event.preventDefault();

  const p =
    pointerPos(event);

  if (

    state ===
    "PLAYING" &&

    event.pointerId ===
    moveId

  ) {

    updateJoystick(
      p.x,
      p.y
    );

  }

  if (
    state ===
    "ARCHIVE"
  ) {

    archivePointerMove(
      p.x,
      p.y
    );

  }

}

function onPointerUp(event) {

  event.preventDefault();

  const p =
    pointerPos(event);

  if (
    state ===
    "PLAYING"
  ) {

    if (
      event.pointerId ===
      moveId
    ) {

      moveId = null;

      resetJoy();

    }

    if (
      event.pointerId ===
      fireId
    ) {

      fireId = null;

      fireHeld = false;

    }

    return;

  }

  if (
    state ===
    "ARCHIVE"
  ) {

    archivePointerUp(
      p.x,
      p.y
    );

  }

}

// ================================================================
// DESKTOP MOUSE FALLBACK
// ================================================================

function mousePressed() {

  if (
    suppressMouseOnce
  ) {

    suppressMouseOnce = false;

    return false;

  }

  if (
    state ===
    "PLAYING"
  ) {

    if (

      sdDist(
        mouseX,
        mouseY,
        powerBtn.x,
        powerBtn.y
      ) <=
      powerBtn.r + 24

    ) {

      useSpecial();

      return false;

    }

    if (

      sdDist(
        mouseX,
        mouseY,
        joy.x,
        joy.y
      ) <=
      joy.r + 20

    ) {

      mouseMoving = true;

      updateJoystick(
        mouseX,
        mouseY
      );

      return false;

    }

    if (

      sdDist(
        mouseX,
        mouseY,
        fireBtn.x,
        fireBtn.y
      ) <=
      fireBtn.r + 20

    ) {

      mouseFiring = true;
      fireHeld = true;

      shoot();

      return false;

    }

    if (

      sdDist(
        mouseX,
        mouseY,
        pauseBtn.x,
        pauseBtn.y
      ) <= 34

    ) {

      state = "PAUSED";

      clearPointers();

      return false;

    }

    if (

      sdDist(
        mouseX,
        mouseY,
        homeBtn.x,
        homeBtn.y
      ) <= 34

    ) {

      state = "HOME";

      clearPointers();

      return false;

    }

  } else {

    handleTap(
      mouseX,
      mouseY
    );

  }

  return false;

}

function mouseDragged() {

  if (
    state ===
    "PLAYING" &&
    mouseMoving
  ) {

    updateJoystick(
      mouseX,
      mouseY
    );

  }

  return false;

}

function mouseReleased() {

  mouseMoving = false;
  mouseFiring = false;

  if (
    moveId === null
  ) {

    resetJoy();

  }

  fireHeld = false;

  return false;

}

// ================================================================
// HOME
// ================================================================

function drawHome() {

  label(
    "SPACE DODGER",
    width / 2,
    height * 0.14,
    42,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

  label(
    "GALACTIC CAMPAIGN",
    width / 2,
    height * 0.195,
    12,
    "#8aa9b9"
  );

  const buttons = [

    ["PLAY", 0.32],
    ["SHIP ARCHIVE", 0.43],
    ["ABOUT", 0.54],
    ["SETTINGS", 0.65],
    ["RATE US", 0.76]

  ];

  for (
    const item of buttons
  ) {

    menuButton(
      item[0],
      height * item[1]
    );

  }

  label(
    "LEVEL " +
    unlockedLevel +
    " / " +
    TOTAL_LEVELS +
    " UNLOCKED",
    width / 2,
    height - 27,
    11,
    "#8b999f"
  );

}

function menuButton(
  textValue,
  y
) {

  button(

    textValue,

    width / 2,
    y,

    Math.min(
      320,
      width * 0.82
    ),

    56

  );

}

// ================================================================
// LEVEL SELECT
// ================================================================

function drawLevels() {

  label(
    "SELECT LEVEL",
    width / 2,
    42,
    27,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

  label(
    "CURRENT RANK",
    width / 2,
    69,
    11,
    "#789aaa"
  );

  label(
    LEVEL_NAMES[
      unlockedLevel - 1
    ],
    width / 2,
    91,
    14,
    "#ead75b",
    CENTER,
    CENTER,
    true
  );

  const cols = 4;
  const gap = 9;

  const size =
    Math.min(
      66,
      (width - 48) /
      cols
    );

  const startY = 140;

  const total =
    cols * size +
    (cols - 1) * gap;

  const startX =
    width / 2 -
    total / 2 +
    size / 2;

  for (
    let n = 1;
    n <= TOTAL_LEVELS;
    n++
  ) {

    const col =
      (n - 1) % cols;

    const row =
      Math.floor(
        (n - 1) /
        cols
      );

    const x =
      startX +
      col *
      (size + gap);

    const y =
      startY +
      row *
      (size + 15);

    const open =
      n <= unlockedLevel;

    const dragon =
      isDragonLevel(n);

    rectMode(CENTER);

    stroke(
      open
        ? (
          dragon
            ? "#d76b58"
            : "#469ab7"
        )
        : "#3b4045"
    );

    strokeWeight(1.5);

    fill(
      open
        ? (
          dragon
            ? "#34191c"
            : "#071e30"
        )
        : "#11151a"
    );

    rect(
      x,
      y,
      size,
      size,
      10
    );

    label(

      open
        ? String(n)
        : "LOCK",

      x,
      y - 4,

      open
        ? 17
        : 10,

      open
        ? "#eef6f8"
        : "#777d81",

      CENTER,
      CENTER,
      true

    );

    if (open) {

      label(

        dragon
          ? "DRAGON"
          : "LEVEL",

        x,
        y + 19,

        8,

        dragon
          ? "#ff9278"
          : "#79aabd",

        CENTER,
        CENTER,
        true

      );

    }

  }

  homeButton();

}

// ================================================================
// ABOUT
// ================================================================

function drawAbout() {

  label(
    "ABOUT",
    width / 2,
    height * 0.13,
    30,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

  label(
    "Developed by",
    width / 2,
    height * 0.23,
    14,
    "#a0afb6"
  );

  label(
    "Aazad S Rana",
    width / 2,
    height * 0.30,
    23,
    "#ead75b",
    CENTER,
    CENTER,
    true
  );

  label(
    "OUR MISSION",
    width / 2,
    height * 0.39,
    13,
    "#78b2c7",
    CENTER,
    CENTER,
    true
  );

  const mission = [

    "Defend the galaxy from waves",
    "of alien invaders, survive",
    "increasingly dangerous battles,",
    "defeat the mighty Dragon bosses,",
    "and become the ultimate",
    "Space Dodger."

  ];

  for (
    let i = 0;
    i < mission.length;
    i++
  ) {

    label(

      mission[i],

      width / 2,

      height *
      (
        0.45 +
        i * 0.04
      ),

      12,

      i ===
      mission.length - 1
        ? "#ead34c"
        : "#d4dee2",

      CENTER,
      CENTER,

      i ===
      mission.length - 1

    );

  }

  label(
    "20 levels  •  Alien invasion  •  Boss battles",
    width / 2,
    height * 0.71,
    10,
    "#7e8f97"
  );

  homeButton();

}

// ================================================================
// SETTINGS
// ================================================================

function drawSettings() {

  label(
    "SETTINGS",
    width / 2,
    height * 0.14,
    29,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

  settingBox(

    "CONTROL LAYOUT",

    swappedControls
      ? "FIRE LEFT  •  MOVE RIGHT"
      : "MOVE LEFT  •  FIRE RIGHT",

    height * 0.32

  );

  settingBox(

    "SOUND",

    soundOn
      ? "ON"
      : "OFF",

    height * 0.48

  );

  label(
    "Tap a panel to change its setting.",
    width / 2,
    height * 0.62,
    11,
    "#7e9098"
  );

  homeButton();

}

function settingBox(
  title,
  value,
  y
) {

  rectMode(CENTER);

  stroke("#468ea8");
  strokeWeight(1.5);
  fill("#061622");

  rect(

    width / 2,
    y,

    Math.min(
      340,
      width * 0.84
    ),

    82,

    14

  );

  label(
    title,
    width / 2,
    y - 17,
    11,
    "#839ba6",
    CENTER,
    CENTER,
    true
  );

  label(
    value,
    width / 2,
    y + 14,
    15,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

}

// ================================================================
// RATING
// ================================================================

function drawRating() {

  label(
    "RATE SPACE DODGER",
    width / 2,
    height * 0.24,
    27,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

  label(
    "HOW WAS YOUR EXPERIENCE?",
    width / 2,
    height * 0.32,
    13,
    "#9aabb2"
  );

  const gap =
    Math.min(
      53,
      width * 0.13
    );

  const total =
    gap * 4;

  for (
    let i = 1;
    i <= 5;
    i++
  ) {

    const x =
      width / 2 -
      total / 2 +
      (i - 1) * gap;

    label(
      "★",
      x,
      height * 0.45,
      39,
      i <= rating
        ? "#ead34c"
        : "#555b60",
      CENTER,
      CENTER,
      true
    );

  }

  label(
    rating + " / 5",
    width / 2,
    height * 0.55,
    16,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

  button(
    "SUBMIT",
    width / 2,
    height * 0.65,
    250,
    52
  );

  button(
    "CANCEL",
    width / 2,
    height * 0.75,
    250,
    52
  );

}

// ================================================================
// PAUSE
// ================================================================

function drawPaused() {

  drawStaticGame();

  overlay();

  label(
    "PAUSED",
    width / 2,
    height * 0.30,
    38,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

  button(
    "RESUME",
    width / 2,
    height * 0.53,
    270,
    52
  );

  button(
    "HOME",
    width / 2,
    height * 0.64,
    240,
    52
  );

}

// ================================================================
// GAME OVER
// ================================================================

function drawGameOver() {

  overlay();

  label(
    "MISSION LOST",
    width / 2,
    height * 0.28,
    36,
    "#ef5963",
    CENTER,
    CENTER,
    true
  );

  label(
    "LEVEL " + level,
    width / 2,
    height * 0.38,
    17,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

  label(
    LEVEL_NAMES[level - 1],
    width / 2,
    height * 0.43,
    14,
    "#d9c65a",
    CENTER,
    CENTER,
    true
  );

  label(
    "SCORE  " + score,
    width / 2,
    height * 0.48,
    13,
    "#9eabb1"
  );

  label(
    "CAMPAIGN LIVES  " +
    campaignLives,
    width / 2,
    height * 0.53,
    11,
    "#789aa7"
  );

  button(
    "RETRY LEVEL",
    width / 2,
    height * 0.61,
    280,
    52
  );

  button(
    "HOME",
    width / 2,
    height * 0.72,
    240,
    52
  );

}

// ================================================================
// LEVEL UP
// ================================================================

function drawLevelUp() {

  overlay();

  const campaignComplete =
    level === TOTAL_LEVELS;

  label(

    campaignComplete
      ? "CAMPAIGN COMPLETE!"
      : "LEVEL " +
        level +
        " CLEARED!",

    width / 2,

    height * 0.30,

    Math.min(
      33,
      width * 0.082
    ),

    "#ead34c",

    CENTER,
    CENTER,
    true

  );

  label(
    "SCORE  " + score,
    width / 2,
    height * 0.40,
    18,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

  if (
    isDragonLevel(level)
  ) {

    label(
      "DRAGON DEFEATED",
      width / 2,
      height * 0.47,
      14,
      "#ff9278",
      CENTER,
      CENTER,
      true
    );

    label(
      "+1 CAMPAIGN LIFE",
      width / 2,
      height * 0.53,
      20,
      "#ead34c",
      CENTER,
      CENTER,
      true
    );

    label(
      "LIVES  " +
      campaignLives,
      width / 2,
      height * 0.59,
      14,
      "#edf7ff"
    );

  } else if (
    !campaignComplete
  ) {

    label(
      "NEW LEVEL UNLOCKED",
      width / 2,
      height * 0.50,
      15,
      "#78b2c7",
      CENTER,
      CENTER,
      true
    );

    label(
      "LEVEL " +
      (level + 1),
      width / 2,
      height * 0.56,
      22,
      "#edf7ff",
      CENTER,
      CENTER,
      true
    );

  }

  if (
    millis() -
    levelClearAt >
    2800
  ) {

    if (
      campaignComplete
    ) {

      state =
        "HOME";

    } else {

      startLevel(
        level + 1
      );

    }

  }

}

// ================================================================
// ARCHIVE
// ================================================================

let archiveScroll = 0;
let archiveTarget = 0;

let archiveTouch = false;
let archiveDrag = false;
let archiveBar = false;

let archiveSY = 0;
let archiveLY = 0;

function archiveGeo() {

  const top = 105;
  const bottom = height - 125;

  const vh =
    bottom - top;

  const cardH = 135;
  const gap = 14;

  const content =

    25 +
    SHIPS.length *
    cardH +

    (SHIPS.length - 1) *
    gap +

    55;

  return {

    top,
    bottom,
    vh,
    cardH,
    gap,
    content,

    max:
      Math.max(
        0,
        content - vh
      )

  };

}

function drawArchive() {

  const g =
    archiveGeo();

  archiveTarget =
    constrain(
      archiveTarget,
      0,
      g.max
    );

  archiveScroll =
    lerp(
      archiveScroll,
      archiveTarget,
      0.28
    );

  label(
    "SHIP ARCHIVE",
    width / 2,
    35,
    25,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );

  label(
    "SWIPE TO BROWSE",
    width / 2,
    61,
    11,
    "#789aaa"
  );

  push();

  drawingContext.save();

  drawingContext.beginPath();

  drawingContext.rect(
    0,
    g.top,
    width,
    g.vh
  );

  drawingContext.clip();

  for (
    let i = 0;
    i < SHIPS.length;
    i++
  ) {

    const y =

      g.top +
      25 +
      g.cardH / 2 +

      i *
      (
        g.cardH +
        g.gap
      ) -

      archiveScroll;

    drawShipCard(

      SHIPS[i],
      i,
      y,

      Math.min(
        350,
        width * 0.88
      ),

      g.cardH

    );

  }

  drawingContext.restore();

  pop();

  drawScrollbar(g);

  homeButton();

}

function drawShipCard(
  ship,
  index,
  y,
  w,
  h
) {

  const open =
    unlockedLevel >=
    ship.unlock;

  const selected =
    selectedShip ===
    index;

  rectMode(CENTER);

  stroke(

    selected
      ? "#ead34c"
      : open
        ? "#468fa9"
        : "#44484c"

  );

  strokeWeight(
    selected
      ? 2.5
      : 1.3
  );

  fill(
    open
      ? "#061421"
      : "#11151a"
  );

  rect(
    width / 2,
    y,
    w,
    h,
    14
  );

  drawMiniShip(

    width / 2 -
    w * 0.31,

    y,

    index,

    open
      ? 0.75
      : 0.6

  );

  if (open) {

    label(
      ship.name,
      width / 2 -
      w * 0.05,
      y - 35,
      13,
      "#eef7fa",
      LEFT,
      CENTER,
      true
    );

    label(
      ship.power,
      width / 2 -
      w * 0.05,
      y - 9,
      10,
      "#e4cc55",
      LEFT,
      CENTER,
      true
    );

    label(
      selected
        ? "SELECTED"
        : "TAP TO SELECT",
      width / 2 -
      w * 0.05,
      y + 30,
      9,
      selected
        ? "#ead34c"
        : "#78b1c6",
      LEFT,
      CENTER,
      true
    );

  } else {

    label(
      "LOCKED  •  LEVEL " +
      ship.unlock,
      width / 2,
      y + 45,
      10,
      "#858b8f",
      CENTER,
      CENTER,
      true
    );

  }

}

function drawMiniShip(
  x,
  y,
  index,
  scaleValue
) {

  const ship =
    SHIPS[index];

  push();

  translate(
    x,
    y
  );

  scale(
    scaleValue
  );

  stroke(ship.edge);
  strokeWeight(2.5);
  fill(ship.body);

  beginShape();

  vertex(0, -42);
  vertex(-13, -17);
  vertex(-40, -5);
  vertex(-24, 11);
  vertex(-14, 27);
  vertex(0, 18);
  vertex(14, 27);
  vertex(24, 11);
  vertex(40, -5);
  vertex(13, -17);

  endShape(CLOSE);

  noStroke();

  fill(ship.core);

  ellipse(
    0,
    -4,
    12,
    20
  );

  pop();

}

function drawScrollbar(g) {

  if (!g.max) {
    return;
  }

  const trackHeight =
    g.vh;

  const thumbHeight =
    Math.max(
      55,
      trackHeight *
      (g.vh / g.content)
    );

  const travel =
    trackHeight -
    thumbHeight;

  const ratio =
    archiveScroll /
    g.max;

  const y =

    g.top +
    thumbHeight / 2 +
    travel * ratio;

  noStroke();

  fill(
    255,
    255,
    255,
    25
  );

  rect(
    width - 10,
    g.top +
    trackHeight / 2,
    4,
    trackHeight,
    2
  );

  fill(
    55,
    165,
    200,
    225
  );

  rect(
    width - 10,
    y,
    11,
    thumbHeight,
    5
  );

}

function archivePointerDown(
  x,
  y
) {

  const g =
    archiveGeo();

  if (
    y >
    height - 95
  ) {

    state =
      "HOME";

    return;

  }

  archiveTouch = true;
  archiveDrag = false;

  archiveBar =
    x >
    width - 45;

  archiveSY = y;
  archiveLY = y;

  if (
    archiveBar
  ) {

    setArchiveFromY(y);

  }

}

function archivePointerMove(
  x,
  y
) {

  if (!archiveTouch) {
    return;
  }

  if (
    archiveBar
  ) {

    setArchiveFromY(y);

    return;

  }

  if (
    Math.abs(
      y -
      archiveSY
    ) > 8
  ) {

    archiveDrag = true;

  }

  if (
    archiveDrag
  ) {

    archiveTarget =
      constrain(

        archiveTarget +
        (
          archiveLY -
          y
        ) * 1.2,

        0,
        archiveGeo().max

      );

  }

  archiveLY = y;

}

function archivePointerUp(
  x,
  y
) {

  if (!archiveTouch) {
    return;
  }

  const tap =

    !archiveDrag &&
    !archiveBar &&

    Math.abs(
      y -
      archiveSY
    ) < 15;

  archiveTouch = false;
  archiveDrag = false;
  archiveBar = false;

  if (!tap) {
    return;
  }

  const g =
    archiveGeo();

  for (
    let i = 0;
    i < SHIPS.length;
    i++
  ) {

    const cy =

      g.top +
      25 +
      g.cardH / 2 +

      i *
      (
        g.cardH +
        g.gap
      ) -

      archiveScroll;

    if (

      inside(

        x,
        y,

        width / 2,
        cy,

        Math.min(
          360,
          width * 0.9
        ),

        g.cardH + 8

      )

    ) {

      if (
        unlockedLevel >=
        SHIPS[i].unlock
      ) {

        selectedShip = i;

        saveGame();

      }

      return;

    }

  }

}

function setArchiveFromY(y) {

  const g =
    archiveGeo();

  if (!g.max) {
    return;
  }

  const thumbHeight =
    Math.max(
      55,
      g.vh *
      g.vh /
      g.content
    );

  const travel =
    g.vh -
    thumbHeight;

  const center =
    constrain(

      y,

      g.top +
      thumbHeight / 2,

      g.top +
      g.vh -
      thumbHeight / 2

    );

  archiveTarget =

    (
      center -
      (
        g.top +
        thumbHeight / 2
      )
    ) /
    travel *
    g.max;

  archiveScroll =
    archiveTarget;

}

// ================================================================
// TAP ROUTER
// ================================================================

function handleTap(
  x,
  y
) {

  if (
    state ===
    "HOME"
  ) {

    const ys = [
      0.32,
      0.43,
      0.54,
      0.65,
      0.76
    ];

    for (
      let i = 0;
      i < ys.length;
      i++
    ) {

      if (

        inside(

          x,
          y,

          width / 2,
          height * ys[i],

          Math.min(
            340,
            width * 0.86
          ),

          75

        )

      ) {

        if (i === 0) {

          state =
            "LEVELS";

        } else if (i === 1) {

          archiveScroll = 0;
          archiveTarget = 0;

          state =
            "ARCHIVE";

        } else if (i === 2) {

          state =
            "ABOUT";

        } else if (i === 3) {

          state =
            "SETTINGS";

        } else {

          rating = 0;

          state =
            "RATING";

        }

        return;

      }

    }

    return;

  }

  if (
    state ===
    "LEVELS"
  ) {

    if (

      inside(

        x,
        y,

        width / 2,
        height - 58,

        230,
        70

      )

    ) {

      state =
        "HOME";

      return;

    }

    const cols = 4;
    const gap = 9;

    const size =
      Math.min(
        66,
        (width - 48) /
        cols
      );

    const startY = 140;

    const total =
      cols * size +
      (cols - 1) * gap;

    const startX =
      width / 2 -
      total / 2 +
      size / 2;

    for (
      let n = 1;
      n <= TOTAL_LEVELS;
      n++
    ) {

      const col =
        (n - 1) % cols;

      const row =
        Math.floor(
          (n - 1) /
          cols
        );

      const bx =
        startX +
        col *
        (size + gap);

      const by =
        startY +
        row *
        (size + 15);

      if (

        inside(

          x,
          y,

          bx,
          by,

          size + 12,
          size + 12

        )

      ) {

        if (
          n <= unlockedLevel
        ) {

          startLevel(n);

        }

        return;

      }

    }

    return;

  }

  if (
    state ===
    "ABOUT"
  ) {

    if (

      inside(

        x,
        y,

        width / 2,
        height - 58,

        230,
        70

      )

    ) {

      state =
        "HOME";

    }

    return;

  }

  if (
    state ===
    "SETTINGS"
  ) {

    if (

      inside(

        x,
        y,

        width / 2,
        height * 0.32,

        360,
        115

      )

    ) {

      swappedControls =
        !swappedControls;

      updateLayout();

      saveGame();

      return;

    }

    if (

      inside(

        x,
        y,

        width / 2,
        height * 0.48,

        360,
        115

      )

    ) {

      soundOn =
        !soundOn;

      saveGame();

      if (
        soundOn
      ) {

        initAudio();

        playPowerSound();

      }

      return;

    }

    if (

      inside(

        x,
        y,

        width / 2,
        height - 58,

        230,
        70

      )

    ) {

      state =
        "HOME";

    }

    return;

  }

  if (
    state ===
    "RATING"
  ) {

    const gap =
      Math.min(
        53,
        width * 0.13
      );

    const total =
      gap * 4;

    for (
      let i = 1;
      i <= 5;
      i++
    ) {

      const starX =

        width / 2 -
        total / 2 +
        (i - 1) *
        gap;

      if (

        sdDist(

          x,
          y,

          starX,
          height * 0.45

        ) < 42

      ) {

        rating = i;

        return;

      }

    }

    if (

      inside(

        x,
        y,

        width / 2,
        height * 0.65,

        280,
        75

      )

    ) {

      try {

        localStorage.setItem(
          "spaceDodgerRating",
          String(rating)
        );

      } catch (error) {}

      state =
        "HOME";

      return;

    }

    if (

      inside(

        x,
        y,

        width / 2,
        height * 0.75,

        280,
        75

      )

    ) {

      state =
        "HOME";

      return;

    }

  }

  if (
    state ===
    "PAUSED"
  ) {

    if (

      inside(

        x,
        y,

        width / 2,
        height * 0.53,

        310,
        75

      )

    ) {

      state =
        "PLAYING";

      return;

    }

    if (

      inside(

        x,
        y,

        width / 2,
        height * 0.64,

        280,
        75

      )

    ) {

      state =
        "HOME";

      return;

    }

  }

  if (
    state ===
    "GAMEOVER"
  ) {

    if (

      inside(

        x,
        y,

        width / 2,
        height * 0.61,

        310,
        75

      )

    ) {

      startLevel(level);

      return;

    }

    if (

      inside(

        x,
        y,

        width / 2,
        height * 0.72,

        280,
        75

      )

    ) {

      state =
        "HOME";

      return;

    }

  }

}

// ================================================================
// UI
// ================================================================

function label(
  textValue,
  x,
  y,
  size,
  colorValue,
  alignX = CENTER,
  alignY = CENTER,
  bold = false
) {

  noStroke();

  fill(colorValue);

  textSize(size);

  textAlign(
    alignX,
    alignY
  );

  textStyle(
    bold
      ? BOLD
      : NORMAL
  );

  text(
    textValue,
    x,
    y
  );

}

function button(
  textValue,
  x,
  y,
  w,
  h
) {

  rectMode(CENTER);

  stroke("#468ea8");
  strokeWeight(1.5);
  fill("#061622");

  rect(
    x,
    y,
    w,
    h,
    12
  );

  label(

    textValue,

    x,
    y,

    14,

    "#edf7ff",

    CENTER,
    CENTER,
    true

  );

}

function homeButton() {

  button(

    "HOME",

    width / 2,

    height - 58,

    Math.min(
      190,
      width * 0.55
    ),

    48

  );

}

function inside(
  px,
  py,
  cx,
  cy,
  w,
  h
) {

  return (

    px >=
    cx - w / 2 &&

    px <=
    cx + w / 2 &&

    py >=
    cy - h / 2 &&

    py <=
    cy + h / 2

  );

}

// ================================================================
// HUD
// ================================================================

function drawHUD() {

  label(
    "SCORE  " + score,
    14,
    12,
    14,
    "#edf2f3",
    LEFT,
    TOP,
    true
  );

  label(
    "LEVEL " + level,
    width / 2,
    12,
    14,
    "#edf2f3",
    CENTER,
    TOP,
    true
  );

  label(
    "LIVES  " + lives,
    width - 14,
    12,
    14,
    "#edf2f3",
    RIGHT,
    TOP,
    true
  );

  label(
    LEVEL_NAMES[level - 1],
    width / 2,
    32,
    9,
    "#9daab0"
  );

  const w =
    Math.min(
      300,
      width * 0.72
    );

  const x =
    width / 2 -
    w / 2;

  const y = 56;

  const elapsed =
    millis() -
    levelStartedAt;

  noStroke();

  fill(
    255,
    255,
    255,
    28
  );

  rect(
    x,
    y,
    w,
    7,
    3
  );

  fill("#4ba0be");

  rect(

    x,
    y,

    w *
    constrain(
      elapsed /
      levelDuration,
      0,
      1
    ),

    7,
    3

  );

  fill(
    255,
    255,
    255,
    28
  );

  rect(
    x,
    y + 18,
    w,
    7,
    3
  );

  fill("#cdb037");

  rect(

    x,
    y + 18,

    w *
    constrain(
      levelScore /
      levelTarget,
      0,
      1
    ),

    7,
    3

  );

  label(
    "SCORE  " +
    levelScore +
    " / " +
    levelTarget,

    width / 2,
    y + 37,

    9,
    "#87999f"
  );

  drawPause();
  drawHomeIcon();

}

// ================================================================
// GAME CONTROLS DISPLAY
// ================================================================

function drawControls() {

  // JOYSTICK

  stroke(
    70,
    180,
    210,
    120
  );

  strokeWeight(1.5);

  fill(
    0,
    120,
    170,
    20
  );

  circle(
    joy.x,
    joy.y,
    joy.r * 2
  );

  fill(
    70,
    190,
    220,
    90
  );

  circle(
    joy.knobX,
    joy.knobY,
    46
  );

  // FIRE

  stroke(
    230,
    75,
    90,
    170
  );

  fill(
    180,
    30,
    50,
    35
  );

  circle(
    fireBtn.x,
    fireBtn.y,
    fireBtn.r * 2
  );

  label(
    "FIRE",
    fireBtn.x,
    fireBtn.y,
    13,
    "#f0f3f4",
    CENTER,
    CENTER,
    true
  );

  // ============================================================
  // POWER BUTTON
  // ============================================================

  const now =
    millis();

  const ready =
    now >=
    specialReadyAt;

  const pressed =
    now <
    powerPressedUntil;

  if (
    pressed
  ) {

    stroke("#ffffff");
    strokeWeight(3);

    fill(
      255,
      220,
      70,
      85
    );

  } else if (
    ready
  ) {

    stroke(
      220,
      185,
      55,
      210
    );

    strokeWeight(2);

    fill(
      200,
      150,
      20,
      45
    );

  } else {

    stroke(
      130,
      125,
      90,
      110
    );

    strokeWeight(1.5);

    fill(
      90,
      85,
      45,
      28
    );

  }

  circle(
    powerBtn.x,
    powerBtn.y,
    powerBtn.r * 2
  );

  if (
    ready
  ) {

    label(
      "POWER",
      powerBtn.x,
      powerBtn.y,
      9,
      "#f0f3f4",
      CENTER,
      CENTER,
      true
    );

  } else {

    const remaining =
      Math.max(

        0,

        Math.ceil(

          (
            specialReadyAt -
            now
          ) / 1000

        )

      );

    label(
      remaining + "s",
      powerBtn.x,
      powerBtn.y,
      11,
      "#bdb7a0",
      CENTER,
      CENTER,
      true
    );

  }

}

function drawPause() {

  stroke("#468ea8");
  strokeWeight(1.5);

  fill(
    5,
    22,
    36,
    235
  );

  circle(
    pauseBtn.x,
    pauseBtn.y,
    44
  );

  noStroke();

  fill("#edf7ff");

  rect(
    pauseBtn.x - 5,
    pauseBtn.y,
    4,
    15,
    1
  );

  rect(
    pauseBtn.x + 5,
    pauseBtn.y,
    4,
    15,
    1
  );

}

function drawHomeIcon() {

  stroke("#468ea8");
  strokeWeight(1.5);

  fill(
    5,
    22,
    36,
    235
  );

  circle(
    homeBtn.x,
    homeBtn.y,
    44
  );

  stroke("#edf7ff");
  strokeWeight(2.2);

  noFill();

  beginShape();

  vertex(
    homeBtn.x - 9,
    homeBtn.y - 1
  );

  vertex(
    homeBtn.x,
    homeBtn.y - 9
  );

  vertex(
    homeBtn.x + 9,
    homeBtn.y - 1
  );

  vertex(
    homeBtn.x + 7,
    homeBtn.y - 1
  );

  vertex(
    homeBtn.x + 7,
    homeBtn.y + 8
  );

  vertex(
    homeBtn.x - 7,
    homeBtn.y + 8
  );

  vertex(
    homeBtn.x - 7,
    homeBtn.y - 1
  );

  endShape(CLOSE);

}

function drawStaticGame() {

  for (
    const enemy of enemies
  ) {

    enemy.draw();

  }

  for (
    const bullet of bullets
  ) {

    bullet.draw();

  }

  for (
    const drop of drops
  ) {

    drop.draw();

  }

  for (
    const shot of enemyShots
  ) {

    shot.draw();

  }

  if (boss) {
    boss.draw();
  }

  drawHUD();
  drawControls();

  shipPlayer.draw();

}

function overlay() {

  noStroke();

  fill(
    0,
    0,
    0,
    190
  );

  rect(
    0,
    0,
    width,
    height
  );

}

// ================================================================
// AUDIO
// ================================================================

function initAudio() {

  if (!soundOn) {
    return;
  }

  if (!audioCtx) {

    const AudioClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (AudioClass) {

      try {

        audioCtx =
          new AudioClass();

      } catch (error) {

        audioCtx = null;

      }

    }

  }

  if (

    audioCtx &&

    audioCtx.state ===
    "suspended"

  ) {

    audioCtx.resume();

  }

}

function tone(
  frequency1,
  frequency2,
  duration,
  volume,
  type = "triangle"
) {

  if (!soundOn) {
    return;
  }

  initAudio();

  if (!audioCtx) {
    return;
  }

  try {

    const now =
      audioCtx.currentTime;

    const oscillator =
      audioCtx.createOscillator();

    const gain =
      audioCtx.createGain();

    oscillator.type =
      type;

    oscillator.frequency.setValueAtTime(
      frequency1,
      now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      frequency2,
      now + duration
    );

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      now + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start(now);

    oscillator.stop(
      now +
      duration +
      0.01
    );

  } catch (error) {}

}

function playFireSound() {

  tone(
    760,
    170,
    0.08,
    0.045,
    "sawtooth"
  );

}

function playPowerSound() {

  tone(
    260,
    720,
    0.23,
    0.065,
    "triangle"
  );

}

// ================================================================
// BACKGROUND
// ================================================================

function createStars() {

  stars = [];

  for (
    let i = 0;
    i < 145;
    i++
  ) {

    stars.push({

      x:
        Math.random() *
        width,

      y:
        Math.random() *
        height,

      s:
        0.8 +
        Math.random() * 1.8,

      v:
        0.15 +
        Math.random() * 0.75,

      a:
        90 +
        Math.random() * 120

    });

  }

}

function drawStars() {

  noStroke();

  for (
    const star of stars
  ) {

    if (
      state ===
      "PLAYING"
    ) {

      star.y +=
        star.v;

      if (
        star.y >
        height
      ) {

        star.y = -4;

        star.x =
          Math.random() *
          width;

      }

    }

    fill(
      185,
      220,
      255,
      star.a
    );

    circle(
      star.x,
      star.y,
      star.s
    );

  }

}

// ================================================================
// RESIZE
// ================================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  createStars();

  updateLayout();

}

// ================================================================
// MOUSE WHEEL
// ================================================================

function mouseWheel(event) {

  if (
    state ===
    "ARCHIVE"
  ) {

    const g =
      archiveGeo();

    archiveTarget =
      constrain(

        archiveTarget +
        event.delta,

        0,
        g.max

      );

    return false;

  }

  return true;

}

// ================================================================
// UTILS
// ================================================================

function constrainInt(
  value,
  minimum,
  maximum
) {

  return Math.max(

    minimum,

    Math.min(

      maximum,

      Math.floor(
        Number(value) ||
        minimum
      )

    )

  );

}

function sdDist(
  ax,
  ay,
  bx,
  by
) {

  return Math.hypot(

    ax - bx,

    ay - by

  );

}

function sdRadians(
  degrees
) {

  return (
    degrees *
    Math.PI /
    180
  );

}

// ================================================================
// END
// ================================================================
