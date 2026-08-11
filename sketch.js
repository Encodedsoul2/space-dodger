/* ================================================================
   SPACE DODGER - p5.js v3 STABLE GAMEPLAY / CONTROL FIX
   FULL REPLACEMENT FOR sketch.js

   FIXES:
   - Enemies spawn from TOP only
   - Player starts near bottom
   - Player movement unlocks after first enemy kill
   - Fire works independently from movement
   - Robust mobile multitouch / pointer handling
   - Pointer Events are the ONLY control system
   - Removed conflicting p5 mouse handlers
   - Larger enemies reduced in size
   - Gameplay controls moved upward
   - Gameplay Home/Pause icons moved upward
   - Menu Home buttons moved upward
   - Existing campaign / ships / powers / bosses preserved
================================================================ */

// ---------- Safe constants ----------
const PI2 = Math.PI * 2;
const HALFPI = Math.PI / 2;
const QUARTERPI = Math.PI / 4;

// ---------- Campaign ----------
const TOTAL_LEVELS = 20;
const START_LIVES = 5;
const MAX_LIVES = 9;
const DRAGON_LEVELS = [5, 10, 15, 20];
const SAVE_KEY = "spaceDodgerCampaignV3";

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

// ================================================================
// GAME OBJECTS
// ================================================================

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

// ================================================================
// GAMEPLAY STATE
// ================================================================

let freeMovementUnlocked = false;
let enemiesDestroyedThisLevel = 0;

const INITIAL_PLAYER_Y_RATIO = 0.79;
const INITIAL_MOVEMENT_MIN_Y_RATIO = 0.66;

// ================================================================
// TIMERS
// ================================================================

let lastEnemySpawn = 0;
let lastDropSpawn = 0;
let lastFire = 0;

let specialReadyAt = 0;

let powerPressedUntil = 0;

let shake = 0;

// ================================================================
// TOUCH / POINTER
// ================================================================

let moveId = null;
let fireId = null;

let fireHeld = false;

// Desktop compatibility variables retained,
// but NOT used by p5 mouse handlers.
let mouseMoving = false;
let mouseFiring = false;

// ================================================================
// CONTROLS
// ================================================================

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
  y: 78,
  r: 22
};

const homeBtn = {
  x: 0,
  y: 78,
  r: 22
};

const MENU_HOME_OFFSET = 96;
const CONTROL_BOTTOM_OFFSET = 150;

let joyAngle = -HALFPI;
let joyStrength = 0;

// ================================================================
// AUDIO
// ================================================================

let audioCtx = null;

// ================================================================
// TEMPORARY POWERS
// ================================================================

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

  shipPlayer = new SpacePlayer();

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

  freeMovementUnlocked = false;
  enemiesDestroyedThisLevel = 0;

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
      height *
      INITIAL_PLAYER_Y_RATIO;

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

  // FIRE is controlled only by the fire pointer.
  // Releasing joystick cannot cancel FIRE.
  fireHeld =
    fireId !== null;

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

    // ALL NORMAL ENEMIES ENTER FROM TOP
    this.x =
      40 +
      Math.random() *
      Math.max(
        40,
        width - 80
      );

    this.y = -65;

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

      this.r = 22;
      this.hp = 2;

    }

    if (
      this.type ===
      "HEAVY"
    ) {

      this.r = 26;
      this.hp = 4;

      this.speed *= 0.65;

    }

    if (
      this.type ===
      "ELITE"
    ) {

      this.r = 25;
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

  vertex(0, -27);
  vertex(11, -16);
  vertex(24, -18);
  vertex(19, -3);
  vertex(27, 14);
  vertex(9, 10);
  vertex(0, 24);
  vertex(-9, 10);
  vertex(-27, 14);
  vertex(-19, -3);
  vertex(-24, -18);
  vertex(-11, -16);

  endShape(CLOSE);

  noStroke();

  fill("#fff0c7");

  ellipse(0, -2, 12, 17);

}

function drawHeavy() {

  stroke("#ff5757");
  strokeWeight(2.5);
  fill("#4b1518");

  beginShape();

  vertex(0, -28);
  vertex(15, -20);
  vertex(29, -6);
  vertex(25, 17);
  vertex(11, 24);
  vertex(0, 20);
  vertex(-11, 24);
  vertex(-25, 17);
  vertex(-29, -6);
  vertex(-15, -20);

  endShape(CLOSE);

  noStroke();

  fill("#ffb4b4");

  ellipse(0, -3, 13, 18);

}

function drawElite() {

  stroke("#b879ff");
  strokeWeight(2.5);
  fill("#32184d");

  beginShape();

  vertex(0, -30);
  vertex(12, -17);
  vertex(27, -10);
  vertex(19, 3);
  vertex(23, 20);
  vertex(8, 15);
  vertex(0, 26);
  vertex(-8, 15);
  vertex(-23, 20);
  vertex(-19, 3);
  vertex(-27, -10);
  vertex(-12, -17);

  endShape(CLOSE);

  noStroke();

  fill("#f3d9ff");

  ellipse(0, -4, 11, 17);

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

          enemiesDestroyedThisLevel++;

          if (
            !freeMovementUnlocked
          ) {

            freeMovementUnlocked = true;

            createCelebration();

          }

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

      enemiesDestroyedThisLevel++;

      if (
        !freeMovementUnlocked
      ) {

        freeMovementUnlocked = true;

      }

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

  if (
    now <
    specialReadyAt
  ) {

    return;

  }

  powerPressedUntil =
    now + 280;

  playPowerSound();

  const power =
    shipPower();

  if (
    power === "BALANCED" ||
    power === "BURN SHOT" ||
    power === "DRAGON RAGE" ||
    power === "TITAN CORE"
  ) {

    powers.BERSERKER =
      now + 6000;

  }

  else if (

    power === "GRAVITY PULSE" ||
    power === "TIME FREEZE"

  ) {

    powers.CRYO =
      now + 6500;

  }

  else if (

    power === "PHASE DODGE" ||
    power === "QUANTUM DASH"

  ) {

    shipPlayer.invincibleUntil =
      now + 4500;

  }

  else if (
    power === "HOLY SHIELD"
  ) {

    powers.SHIELD =
      now + 7000;

  }

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

      enemiesDestroyedThisLevel++;

      if (
        !freeMovementUnlocked
      ) {

        freeMovementUnlocked = true;

      }

    }

    if (
      boss
    ) {

      boss.hp -=
        boss.maxHp * 0.12;

    }

    shake = 18;

  }

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
// CONTROLS LAYOUT
// ================================================================

function updateLayout() {

  pauseBtn.x = 38;
  pauseBtn.y = 76;

  homeBtn.x =
    width - 38;

  homeBtn.y = 76;

  const y =
    Math.max(
      170,
      height - CONTROL_BOTTOM_OFFSET
    );

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

// ================================================================
// JOYSTICK
// ================================================================

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
    moveId === null
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

    if (
      !freeMovementUnlocked
    ) {

      const minimumY =
        height *
        INITIAL_MOVEMENT_MIN_Y_RATIO;

      if (
        shipPlayer.y <
        minimumY
      ) {

        shipPlayer.y =
          minimumY;

      }

    }

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

  canvas.style.webkitUserSelect =
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

// ================================================================
// POINTER DOWN
// ================================================================

function onPointerDown(event) {

  event.preventDefault();

  try {

    if (
      event.currentTarget
        .setPointerCapture
    ) {

      event.currentTarget
        .setPointerCapture(
          event.pointerId
        );

    }

  } catch (error) {}

  initAudio();

  const p =
    pointerPos(event);

  const x = p.x;
  const y = p.y;

  if (
    state ===
    "PLAYING"
  ) {

    // HOME FIRST
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

    // PAUSE
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

    // POWER
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

    // FIRE
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

    // JOYSTICK
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

// ================================================================
// POINTER MOVE
// ================================================================

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

// ================================================================
// POINTER UP
// ================================================================

function onPointerUp(event) {

  event.preventDefault();

  const p =
    pointerPos(event);

  if (
    state ===
    "PLAYING"
  ) {

    // Release only the joystick pointer.
    if (
      event.pointerId ===
      moveId
    ) {

      moveId = null;

      resetJoy();

    }

    // Release only the FIRE pointer.
    if (
      event.pointerId ===
      fireId
    ) {

      fireId = null;

    }

    // IMPORTANT:
    // Joystick release does not affect FIRE.
    fireHeld =
      fireId !== null;

    try {

      if (
        event.currentTarget
          .releasePointerCapture
      ) {

        event.currentTarget
          .releasePointerCapture(
            event.pointerId
          );

      }

    } catch (error) {}

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
    "#d9c65a"
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
  const bottom = height - 150;

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
    height -
    MENU_HOME_OFFSET
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

  // ============================================================
  // LEVELS
  // ============================================================

  if (
    state ===
    "LEVELS"
  ) {

    if (

      inside(

        x,
        y,

        width / 2,
        height -
        MENU_HOME_OFFSET,

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

  // ============================================================
  // ABOUT
  // ============================================================

  if (
    state ===
    "ABOUT"
  ) {

    if (

      inside(

        x,
        y,

        width / 2,
        height -
        MENU_HOME_OFFSET,

        230,
        70

      )

    ) {

      state =
        "HOME";

    }

    return;

  }

  // ============================================================
  // SETTINGS
  // ============================================================

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
        height -
        MENU_HOME_OFFSET,

        230,
        70

      )

    ) {

      state =
        "HOME";

    }

    return;

  }

  // ============================================================
  // RATING
  // ============================================================

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

  // ============================================================
  // PAUSED
  // ============================================================

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

  // ============================================================
  // GAME OVER
  // ============================================================

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

// ================================================================
// DEDICATED MENU HOME BUTTON
// ================================================================

function homeButton() {

  button(

    "HOME",

    width / 2,

    height -
    MENU_HOME_OFFSET,

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
      (
        millis() -
        levelStartedAt
      ) /
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

  // POWER

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

// ================================================================
// PAUSE ICON
// ================================================================

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

// ================================================================
// HOME ICON
// ================================================================

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

// ================================================================
// STATIC GAME
// ================================================================

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

// ================================================================
// OVERLAY
// ================================================================

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
/* ================================================================
   SPACE DODGER V4 - COMPLETE FEATURE PATCH
   ================================================================
   PASTE THIS ENTIRE BLOCK AT THE VERY END OF sketch.js

   IMPORTANT:
   - This is ONE complete V4 patch.
   - Do NOT paste the previous V4 patches.
   - Paste only this block after the V3 code.

   FIXES / FEATURES:
   - CR / CRYO booster now gives strong visible empowerment
   - CRYO frost aura around ship
   - CRYO ACTIVE HUD indicator
   - Stronger enemy slowdown during CRYO
   - Special attachable weapons
   - Plasma Cannon
   - Void Beam
   - Dragon Slayer
   - Dragon Slayer guaranteed on Dragon stages
   - Extra Dragon damage from special weapons
   - Weapon pickup effects
   - HELP / ARSENAL screen
   - SETTINGS remains fully functional
   - RATE US fixed
   - SUBMIT -> THANK YOU screen
   - CANCEL -> HOME
   - Rating saved locally
   - Level clear manual buttons
   - PLAY AGAIN
   - NEXT LEVEL
   - Campaign Complete
   - Confetti celebration
   - Safe integration with V3 draw / handleTap
================================================================ */


/* ================================================================
   V4 STATE
================================================================ */

let v4HelpReturnState = "HOME";

let v4RatingThanksUntil = 0;

let v4Weapon = null;
let v4WeaponUntil = 0;
let v4WeaponLastFire = 0;

let v4WeaponDrops = [];

let v4WeaponSpawned = false;
let v4DragonWeaponGiven = false;

let v4Celebration = [];

let v4CelebrationActive = false;


/* ================================================================
   SPECIAL WEAPONS
================================================================ */

const V4_WEAPONS = [

  {
    id: "PLASMA_CANNON",
    name: "PLASMA CANNON",
    symbol: "P",
    color: "#4de8ff",
    power: 2.5,
    dragon: 1.0,
    rate: 170,
    duration: 18000,
    desc: "Twin plasma cannon attached to the ship.",
    strength: "HIGH"
  },

  {
    id: "VOID_BEAM",
    name: "VOID BEAM",
    symbol: "V",
    color: "#d889ff",
    power: 4.0,
    dragon: 1.25,
    rate: 260,
    duration: 14000,
    desc: "Heavy piercing beam with extreme damage.",
    strength: "VERY HIGH"
  },

  {
    id: "DRAGON_SLAYER",
    name: "DRAGON SLAYER",
    symbol: "D",
    color: "#ff6a43",
    power: 7.0,
    dragon: 3.5,
    rate: 220,
    duration: 20000,
    desc: "Dragon hunter cannon with massive boss damage.",
    strength: "EXTREME"
  }

];


function v4WeaponById(id) {

  for (
    const weapon of V4_WEAPONS
  ) {

    if (
      weapon.id === id
    ) {

      return weapon;

    }

  }

  return V4_WEAPONS[0];

}


function v4WeaponActive() {

  return (

    v4Weapon !== null &&

    millis() <
    v4WeaponUntil

  );

}


function v4CurrentWeapon() {

  if (
    !v4WeaponActive()
  ) {

    return null;

  }

  return v4WeaponById(
    v4Weapon
  );

}


function v4ClearWeapon() {

  v4Weapon = null;

  v4WeaponUntil = 0;

  v4WeaponLastFire = 0;

}


/* ================================================================
   SAVE ORIGINAL V3 FUNCTIONS
================================================================ */

const V4_ORIGINAL_DRAW =
  draw;

const V4_ORIGINAL_HANDLE_TAP =
  handleTap;

const V4_ORIGINAL_SHOOT =
  shoot;

const V4_ORIGINAL_UPDATE_DROPS =
  updateDrops;

const V4_ORIGINAL_SPAWN_DROPS =
  spawnDrops;

const V4_ORIGINAL_START_LEVEL =
  startLevel;

const V4_ORIGINAL_COMPLETE_LEVEL =
  completeLevel;

const V4_ORIGINAL_COLLIDE_BOSS =
  collideBulletsBoss;

const V4_ORIGINAL_ACTIVATE_POWER =
  activatePower;

const V4_ORIGINAL_DRAW_HUD =
  drawHUD;


/* ================================================================
   V4 DRAW ROUTER
================================================================ */

draw = function() {

  if (
    state ===
    "HELP"
  ) {

    background(
      2,
      6,
      17
    );

    drawStars();

    v4DrawHelp();

    return;

  }


  if (
    state ===
    "RATING_THANKS"
  ) {

    background(
      2,
      6,
      17
    );

    drawStars();

    v4DrawRatingThanks();

    return;

  }


  /*
     IMPORTANT:

     Every existing V3 state including
     SETTINGS, ARCHIVE, ABOUT, LEVELS,
     RATING, PLAYING, PAUSED etc.
     goes through the original V3 draw.
  */

  V4_ORIGINAL_DRAW();


  if (
    state ===
    "PLAYING"
  ) {

    v4DrawWeaponDrops();

    v4DrawAttachedWeapon();

    v4DrawCryoEffect();

  }

};


/* ================================================================
   CRYO / CR BOOSTER UPGRADE
================================================================ */

const V4_ORIGINAL_ENEMY_UPDATE =
  Enemy.prototype.update;


Enemy.prototype.update =
  function() {

    V4_ORIGINAL_ENEMY_UPDATE.call(
      this
    );

    /*
       The original V3 already slows
       enemies when CRYO is active.

       V4 adds an additional strong
       slowdown so CR actually feels
       like a powerful booster.
    */

    if (
      millis() <
      powers.CRYO
    ) {

      /*
         Correct the movement slightly
         by reducing the effective
         displacement after original
         movement.

         This makes CRYO substantially
         stronger without changing
         the rest of the enemy AI.
      */

      const freezeStrength =
        0.48;

      this.x =
        shipPlayer.x +
        (
          this.x -
          shipPlayer.x
        ) *
        (
          1 -
          freezeStrength
        ) *
        0.08;

      this.y =
        shipPlayer.y +
        (
          this.y -
          shipPlayer.y
        ) *
        (
          1 -
          freezeStrength
        ) *
        0.08;

    }

  };


/* ================================================================
   CRYO ACTIVATION WRAPPER
================================================================ */

activatePower =
  function(type) {

    V4_ORIGINAL_ACTIVATE_POWER(
      type
    );


    if (
      type ===
      "CRYO"
    ) {

      /*
         Make CRYO stronger than the
         normal V3 7 second effect.
      */

      powers.CRYO =
        millis() + 8500;

      powerPressedUntil =
        millis() + 450;

      shake = 5;

    }

  };


/* ================================================================
   CRYO VISUAL EFFECT
================================================================ */

function v4DrawCryoEffect() {

  if (
    !shipPlayer
  ) {

    return;

  }


  if (
    millis() >=
    powers.CRYO
  ) {

    return;

  }


  const remaining =
    Math.max(

      0,

      Math.ceil(

        (
          powers.CRYO -
          millis()
        ) / 1000

      )

    );


  /*
     Outer frost rings
  */

  push();

  noFill();

  stroke(
    130,
    235,
    255,
    100
  );

  strokeWeight(2);

  circle(
    shipPlayer.x,
    shipPlayer.y,
    72 +
    Math.sin(
      frameCount * 0.10
    ) * 7
  );

  stroke(
    210,
    250,
    255,
    75
  );

  circle(
    shipPlayer.x,
    shipPlayer.y,
    92 +
    Math.sin(
      frameCount * 0.075
    ) * 9
  );


  /*
     Frost particles
  */

  for (
    let i = 0;
    i < 10;
    i++
  ) {

    const angle =
      frameCount *
      0.018 +
      i *
      PI2 /
      10;

    const radius =
      38 +
      Math.sin(
        frameCount *
        0.05 +
        i
      ) *
      8;

    const x =
      shipPlayer.x +
      Math.cos(angle) *
      radius;

    const y =
      shipPlayer.y +
      Math.sin(angle) *
      radius;

    stroke(
      220,
      250,
      255,
      170
    );

    strokeWeight(1.4);

    line(
      x - 4,
      y,
      x + 4,
      y
    );

    line(
      x,
      y - 4,
      x,
      y + 4
    );

  }

  pop();


  /*
     CRYO ACTIVE indicator
  */

  rectMode(CENTER);

  stroke(
    "#9eefff"
  );

  strokeWeight(1.5);

  fill(
    8,
    40,
    55,
    225
  );

  rect(
    width / 2,
    78,
    150,
    27,
    9
  );


  label(
    "❄ CRYO ACTIVE  " +
    remaining +
    "s",
    width / 2,
    78,
    10,
    "#bdf8ff",
    CENTER,
    CENTER,
    true
  );

}


/* ================================================================
   HELP SCREEN
================================================================ */

function v4DrawHelp() {

  label(
    "HELP • ARSENAL",
    width / 2,
    38,
    27,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );


  label(
    "WEAPONS & POWER BOOSTERS",
    width / 2,
    65,
    10,
    "#79aabd"
  );


  const weaponY = [
    112,
    185,
    258
  ];


  for (
    let i = 0;
    i < V4_WEAPONS.length;
    i++
  ) {

    v4HelpWeaponCard(
      V4_WEAPONS[i],
      width / 2,
      weaponY[i]
    );

  }


  label(
    "POWER BOOSTERS",
    width / 2,
    330,
    14,
    "#ead34c",
    CENTER,
    CENTER,
    true
  );


  const powersInfo = [

    [
      "M",
      "MULTI",
      "Triple shots for 7 seconds.",
      "#ffe600"
    ],

    [
      "S",
      "SHIELD",
      "Blocks enemy hits for 7 seconds.",
      "#00cfff"
    ],

    [
      "BR",
      "BERSERKER",
      "Boosts weapon damage.",
      "#ff3455"
    ],

    [
      "CR",
      "CRYO",
      "Massively slows alien movement.",
      "#9eefff"
    ],

    [
      "N",
      "NOVA",
      "Instantly destroys normal aliens.",
      "#ffffff"
    ]

  ];


  const start =
    380;


  for (
    let i = 0;
    i < powersInfo.length;
    i++
  ) {

    const row =
      i < 3
        ? 0
        : 1;

    const col =
      i < 3
        ? i
        : i - 3;

    const x =
      width *
      (
        row === 0
          ? 0.22 + col * 0.28
          : 0.36 + col * 0.28
      );

    const y =
      start +
      row * 88;


    v4HelpPower(
      powersInfo[i],
      x,
      y
    );

  }


  label(
    "Dragon stages: Dragon Slayer is guaranteed before the boss.",
    width / 2,
    height - 115,
    9,
    "#ff9278",
    CENTER,
    CENTER,
    true
  );


  button(
    "BACK",
    width / 2,
    height - MENU_HOME_OFFSET,
    190,
    48
  );

}


function v4HelpWeaponCard(
  weapon,
  x,
  y
) {

  const cardW =
    Math.min(
      350,
      width * 0.9
    );


  rectMode(CENTER);

  stroke(
    weapon.color
  );

  strokeWeight(1.7);

  fill(
    6,
    18,
    30,
    235
  );

  rect(
    x,
    y,
    cardW,
    62,
    12
  );


  noFill();

  stroke(
    weapon.color
  );

  strokeWeight(2);

  circle(
    x -
    cardW * 0.39,
    y,
    38
  );


  label(
    weapon.symbol,
    x -
    cardW * 0.39,
    y,
    16,
    weapon.color,
    CENTER,
    CENTER,
    true
  );


  label(
    weapon.name,
    x -
    cardW * 0.27,
    y - 16,
    11,
    "#edf7ff",
    LEFT,
    CENTER,
    true
  );


  label(
    weapon.desc,
    x -
    cardW * 0.27,
    y + 4,
    8,
    "#aab9bf",
    LEFT,
    CENTER
  );


  label(
    weapon.strength,
    x +
    cardW * 0.35,
    y + 17,
    7,
    weapon.color,
    CENTER,
    CENTER,
    true
  );

}


function v4HelpPower(
  info,
  x,
  y
) {

  stroke(
    info[3]
  );

  strokeWeight(1.5);

  fill(
    5,
    20,
    31,
    220
  );

  circle(
    x,
    y,
    40
  );


  label(
    info[0],
    x,
    y - 1,
    12,
    info[3],
    CENTER,
    CENTER,
    true
  );


  label(
    info[1],
    x,
    y + 27,
    7,
    "#edf7ff",
    CENTER,
    CENTER,
    true
  );


  label(
    info[2],
    x,
    y + 40,
    6,
    "#8fa2aa",
    CENTER,
    CENTER
  );

}


/* ================================================================
   SPECIAL WEAPON DROP
================================================================ */

class V4WeaponDrop {

  constructor(type) {

    this.type =
      type;

    this.x =
      width * 0.18 +
      Math.random() *
      width * 0.64;

    this.y =
      Math.max(
        150,
        height * 0.24
      );

    this.vy =
      0.55;

    this.r =
      25;

    this.life =
      1100;

    this.rot =
      0;

  }


  update() {

    this.y +=
      this.vy;

    this.rot +=
      0.045;

    this.life--;

  }


  dead() {

    return (

      this.life <= 0 ||

      this.y >
      height - 180

    );

  }


  draw() {

    const weapon =
      v4WeaponById(
        this.type
      );


    push();

    translate(
      this.x,
      this.y
    );

    rotate(
      this.rot
    );


    stroke(
      weapon.color
    );

    strokeWeight(2.5);

    fill(
      8,
      18,
      28,
      235
    );

    circle(
      0,
      0,
      52
    );


    noFill();

    stroke(
      weapon.color
    );

    circle(
      0,
      0,
      40 +
      Math.sin(
        frameCount *
        0.12
      ) * 4
    );


    label(
      weapon.symbol,
      0,
      0,
      18,
      weapon.color,
      CENTER,
      CENTER,
      true
    );


    pop();


    label(
      "GRAB",
      this.x,
      this.y + 35,
      8,
      weapon.color,
      CENTER,
      CENTER,
      true
    );

  }

}


/* ================================================================
   SPAWN WEAPON
================================================================ */

function v4SpawnWeapon(
  forceDragon
) {

  if (
    v4WeaponDrops.length > 0
  ) {

    return;

  }


  let type =
    "PLASMA_CANNON";


  if (
    forceDragon
  ) {

    type =
      "DRAGON_SLAYER";

  } else {

    const roll =
      Math.random();


    if (
      roll < 0.45
    ) {

      type =
        "PLASMA_CANNON";

    } else if (
      roll < 0.80
    ) {

      type =
        "VOID_BEAM";

    } else {

      type =
        "DRAGON_SLAYER";

    }

  }


  v4WeaponDrops.push(
    new V4WeaponDrop(
      type
    )
  );


  v4WeaponSpawned =
    true;

}


/* ================================================================
   WEAPON DROP UPDATE
================================================================ */

function v4UpdateWeaponDrops() {

  for (
    let i =
      v4WeaponDrops.length - 1;
    i >= 0;
    i--
  ) {

    const drop =
      v4WeaponDrops[i];


    drop.update();


    if (
      drop.dead()
    ) {

      v4WeaponDrops.splice(
        i,
        1
      );

      continue;

    }


    if (

      shipPlayer &&

      sdDist(

        shipPlayer.x,
        shipPlayer.y,

        drop.x,
        drop.y

      ) <

      shipPlayer.r +
      drop.r

    ) {

      const weapon =
        v4WeaponById(
          drop.type
        );


      v4Weapon =
        weapon.id;


      v4WeaponUntil =
        millis() +
        weapon.duration;


      v4WeaponLastFire =
        0;


      createExplosion(
        drop.x,
        drop.y,
        35,
        weapon.color
      );


      shake = 8;

      playPowerSound();


      v4WeaponDrops.splice(
        i,
        1
      );

    }

  }

}


/* ================================================================
   DRAW WEAPON DROPS
================================================================ */

function v4DrawWeaponDrops() {

  for (
    const drop of
      v4WeaponDrops
  ) {

    drop.draw();

  }

}


/* ================================================================
   ATTACHED WEAPON VISUAL
================================================================ */

function v4DrawAttachedWeapon() {

  if (
    !v4WeaponActive() ||
    !shipPlayer
  ) {

    return;

  }


  const weapon =
    v4CurrentWeapon();


  push();

  translate(
    shipPlayer.x,
    shipPlayer.y
  );

  rotate(
    shipPlayer.angle +
    HALFPI
  );


  stroke(
    weapon.color
  );

  strokeWeight(3);

  fill(
    10,
    25,
    36
  );


  /*
     LEFT CANNON
  */

  beginShape();

  vertex(-18, -5);
  vertex(-34, -2);
  vertex(-39, 10);
  vertex(-24, 10);

  endShape(CLOSE);


  /*
     RIGHT CANNON
  */

  beginShape();

  vertex(18, -5);
  vertex(34, -2);
  vertex(39, 10);
  vertex(24, 10);

  endShape(CLOSE);


  noStroke();

  fill(
    weapon.color
  );


  circle(
    -31,
    4,
    8
  );

  circle(
    31,
    4,
    8
  );


  pop();


  const remaining =
    Math.max(

      0,

      Math.ceil(

        (
          v4WeaponUntil -
          millis()
        ) / 1000

      )

    );


  rectMode(CENTER);

  stroke(
    weapon.color
  );

  strokeWeight(1.2);

  fill(
    4,
    20,
    30,
    225
  );

  rect(
    width / 2,
    96,
    180,
    25,
    8
  );


  label(
    "⚡ " +
    weapon.name +
    "  " +
    remaining +
    "s",
    width / 2,
    96,
    8.5,
    weapon.color,
    CENTER,
    CENTER,
    true
  );

}


/* ================================================================
   SPECIAL WEAPON SHOOT
================================================================ */

function v4WeaponShoot() {

  if (
    !v4WeaponActive()
  ) {

    return;

  }


  const weapon =
    v4CurrentWeapon();


  if (
    millis() -
    v4WeaponLastFire <
    weapon.rate
  ) {

    return;

  }


  v4WeaponLastFire =
    millis();


  const base =
    shipPlayer.angle;


  if (
    weapon.id ===
    "PLASMA_CANNON"
  ) {

    v4CreateWeaponBullet(
      -0.22,
      base,
      weapon
    );

    v4CreateWeaponBullet(
      0.22,
      base,
      weapon
    );

  }


  else if (
    weapon.id ===
    "VOID_BEAM"
  ) {

    v4CreateWeaponBullet(
      -0.10,
      base,
      weapon
    );

    v4CreateWeaponBullet(
      0.10,
      base,
      weapon
    );

  }


  else {

    v4CreateWeaponBullet(
      -0.14,
      base,
      weapon
    );

    v4CreateWeaponBullet(
      0,
      base,
      weapon
    );

    v4CreateWeaponBullet(
      0.14,
      base,
      weapon
    );

  }


  tone(
    420,
    120,
    0.09,
    0.055,
    "square"
  );

}


function v4CreateWeaponBullet(
  side,
  base,
  weapon
) {

  const angle =
    base + side;


  const bullet =
    new Bullet(

      shipPlayer.x +
      Math.cos(angle) *
      33,

      shipPlayer.y +
      Math.sin(angle) *
      33,

      angle,

      weapon.power

    );


  bullet.speed =
    weapon.id ===
    "VOID_BEAM"
      ? 14
      : 12.5;


  bullet.r =
    weapon.id ===
    "VOID_BEAM"
      ? 8
      : 6;


  bullet.life =
    130;


  bullet.v4Weapon =
    weapon.id;


  bullets.push(
    bullet
  );

}


/* ================================================================
   SHOOT WRAPPER
================================================================ */

shoot =
  function() {

    if (
      state !==
      "PLAYING"
    ) {

      return;

    }


    V4_ORIGINAL_SHOOT();


    if (
      v4WeaponActive()
    ) {

      v4WeaponShoot();

    }

  };


/* ================================================================
   DRAGON BONUS DAMAGE
================================================================ */

collideBulletsBoss =
  function() {

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

        let dragonMultiplier =
          1;


        if (
          bullet.v4Weapon
        ) {

          const weapon =
            v4WeaponById(
              bullet.v4Weapon
            );


          dragonMultiplier =
            weapon.dragon;

        }


        boss.hp -=

          (
            10 +
            bullet.power * 8
          ) *

          damageMultiplier() *

          dragonMultiplier;


        bullets.splice(
          i,
          1
        );


        createExplosion(

          bullet.x,
          bullet.y,

          bullet.v4Weapon ===
          "DRAGON_SLAYER"
            ? 10
            : 5,

          bullet.v4Weapon
            ? v4WeaponById(
                bullet.v4Weapon
              ).color
            : "#ff9a40"

        );

      }

    }

  };


/* ================================================================
   DROP UPDATE WRAPPER
================================================================ */

updateDrops =
  function() {

    V4_ORIGINAL_UPDATE_DROPS();

    v4UpdateWeaponDrops();

  };


/* ================================================================
   WEAPON SPAWN WRAPPER
================================================================ */

spawnDrops =
  function() {

    /*
       Keep all V3 boosters.
    */

    V4_ORIGINAL_SPAWN_DROPS();


    if (
      v4WeaponSpawned
    ) {

      return;

    }


    /*
       DRAGON STAGE

       Spawn Dragon Slayer shortly
       before the Dragon appears.
    */

    if (
      isDragonLevel(level)
    ) {

      const bossTime =
        levelStartedAt +
        levelDuration *
        0.58;


      if (

        millis() >=
        bossTime - 4200 &&

        !v4DragonWeaponGiven

      ) {

        v4SpawnWeapon(
          true
        );


        v4DragonWeaponGiven =
          true;

      }


      return;

    }


    /*
       NORMAL STAGES

       One special weapon has a
       small random chance to appear.
    */

    if (

      millis() -
      levelStartedAt >
      4500 &&

      Math.random() <
      0.0028

    ) {

      v4SpawnWeapon(
        false
      );

    }

  };


/* ================================================================
   START LEVEL WRAPPER
================================================================ */

startLevel =
  function(n) {

    V4_ORIGINAL_START_LEVEL(
      n
    );


    v4WeaponDrops =
      [];

    v4WeaponSpawned =
      false;

    v4DragonWeaponGiven =
      false;

    v4ClearWeapon();

    v4Celebration =
      [];

    v4CelebrationActive =
      false;

  };


/* ================================================================
   COMPLETE LEVEL
   Manual level-up screen
================================================================ */

completeLevel =
  function() {

    if (
      state !==
      "PLAYING"
    ) {

      return;

    }


    /*
       Clean battlefield completely.
    */

    enemies = [];

    enemyShots = [];

    bullets = [];

    drops = [];

    v4WeaponDrops = [];

    particles = [];

    boss = null;

    bossActive =
      false;

    bossDefeated =
      isDragonLevel(level);


    v4ClearWeapon();

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


    levelClearAt =
      millis();


    v4StartCelebration();


    state =
      "LEVELUP";

  };


/* ================================================================
   LEVEL UP DRAW OVERRIDE
================================================================ */

const V4_ORIGINAL_DRAW_LEVELUP =
  drawLevelUp;


drawLevelUp =
  function() {

    v4DrawLevelUp();

  };


function v4DrawLevelUp() {

  overlay();


  const complete =
    level ===
    TOTAL_LEVELS;


  const title =
    complete
      ? "CAMPAIGN COMPLETE!"
      : "LEVEL " +
        level +
        " CLEARED!";


  rectMode(CENTER);

  stroke(
    "#ead34c"
  );

  strokeWeight(2.5);

  fill(
    38,
    30,
    5,
    240
  );


  rect(

    width / 2,
    height * 0.23,

    Math.min(
      350,
      width * 0.9
    ),

    76,

    18

  );


  label(
    "✦  " +
    title +
    "  ✦",

    width / 2,
    height * 0.23,

    Math.min(
      26,
      width * 0.072
    ),

    "#ffe65a",

    CENTER,
    CENTER,
    true

  );


  label(
    LEVEL_NAMES[
      level - 1
    ],

    width / 2,
    height * 0.32,

    15,

    "#ffffff",

    CENTER,
    CENTER,
    true

  );


  label(
    "TITLE EARNED",

    width / 2,
    height * 0.375,

    10,

    "#ffdc57",

    CENTER,
    CENTER,
    true

  );


  label(
    LEVEL_NAMES[
      level - 1
    ],

    width / 2,
    height * 0.42,

    20,

    "#ead34c",

    CENTER,
    CENTER,
    true

  );


  label(
    "SCORE  " +
    score,

    width / 2,
    height * 0.49,

    16,

    "#edf7ff",

    CENTER,
    CENTER,
    true

  );


  if (
    isDragonLevel(level)
  ) {

    label(
      "🐉 DRAGON DEFEATED  •  +1 LIFE",

      width / 2,
      height * 0.55,

      12,

      "#ff9278",

      CENTER,
      CENTER,
      true

    );

  }


  button(
    "PLAY AGAIN",
    width / 2,
    height * 0.66,
    260,
    52
  );


  if (
    complete
  ) {

    button(
      "BACK TO HOME",
      width / 2,
      height * 0.76,
      260,
      52
    );

  } else {

    button(
      "NEXT LEVEL  ▶",
      width / 2,
      height * 0.76,
      260,
      52
    );

  }


  v4UpdateCelebration();

}


/* ================================================================
   CONFETTI
================================================================ */

function v4StartCelebration() {

  v4Celebration =
    [];

  v4CelebrationActive =
    true;


  const colors = [

    "#ffe600",
    "#00ddff",
    "#ff4dcc",
    "#ffffff",
    "#65ff8a",
    "#ff8a30"

  ];


  for (
    let i = 0;
    i < 180;
    i++
  ) {

    v4Celebration.push({

      x:
        Math.random() *
        width,

      y:
        -20 -
        Math.random() *
        height *
        0.4,

      vx:
        (
          Math.random() -
          0.5
        ) * 2.2,

      vy:
        1.2 +
        Math.random() * 4.2,

      size:
        3 +
        Math.random() * 5,

      rot:
        Math.random() *
        PI2,

      vr:
        (
          Math.random() -
          0.5
        ) * 0.18,

      color:
        colors[
          Math.floor(
            Math.random() *
            colors.length
          )
        ],

      life:
        240 +
        Math.random() *
        180

    });

  }


  tone(
    520,
    880,
    0.25,
    0.08,
    "triangle"
  );

}


function v4UpdateCelebration() {

  if (
    !v4CelebrationActive
  ) {

    return;

  }


  for (
    let i =
      v4Celebration.length - 1;
    i >= 0;
    i--
  ) {

    const p =
      v4Celebration[i];


    p.x +=
      p.vx;

    p.y +=
      p.vy;

    p.vy +=
      0.018;

    p.rot +=
      p.vr;

    p.life--;


    push();

    translate(
      p.x,
      p.y
    );

    rotate(
      p.rot
    );

    noStroke();

    fill(
      p.color
    );

    rectMode(CENTER);

    rect(
      0,
      0,
      p.size * 1.8,
      p.size
    );

    pop();


    if (

      p.life <= 0 ||

      p.y >
      height + 30

    ) {

      v4Celebration.splice(
        i,
        1
      );

    }

  }

}


/* ================================================================
   RATING THANK YOU SCREEN
================================================================ */

function v4DrawRatingThanks() {

  noStroke();

  fill(
    2,
    6,
    17
  );

  rect(
    0,
    0,
    width,
    height
  );


  /*
     Start with celebration particles.
  */

  v4UpdateCelebration();


  rectMode(CENTER);

  stroke(
    "#ead34c"
  );

  strokeWeight(2.5);

  fill(
    35,
    30,
    5,
    245
  );


  rect(

    width / 2,
    height * 0.39,

    Math.min(
      350,
      width * 0.9
    ),

    190,

    20

  );


  label(
    "THANK YOU! ❤️",

    width / 2,
    height * 0.32,

    30,

    "#ffe65a",

    CENTER,
    CENTER,
    true

  );


  label(
    "Your rating has been submitted.",

    width / 2,
    height * 0.43,

    12,

    "#edf7ff",

    CENTER,
    CENTER

  );


  label(
    "★★★★★",

    width / 2,
    height * 0.51,

    25,

    "#ead34c",

    CENTER,
    CENTER,
    true

  );


  button(
    "BACK TO HOME",
    width / 2,
    height * 0.68,
    250,
    52
  );

}


/* ================================================================
   HANDLE TAP V4 ROUTER
================================================================ */

handleTap =
  function(
    x,
    y
  ) {


    /* ============================================================
       HELP
    ============================================================ */

    if (
      state ===
      "HELP"
    ) {

      if (

        inside(

          x,
          y,

          width / 2,

          height -
          MENU_HOME_OFFSET,

          230,
          70

        )

      ) {

        state =
          v4HelpReturnState;

      }

      return;

    }


    /* ============================================================
       RATING THANKS
    ============================================================ */

    if (
      state ===
      "RATING_THANKS"
    ) {

      if (

        inside(

          x,
          y,

          width / 2,

          height * 0.68,

          280,
          80

        )

      ) {

        state =
          "HOME";

        v4CelebrationActive =
          false;

        v4Celebration =
          [];

      }

      return;

    }


    /* ============================================================
       LEVEL UP
    ============================================================ */

    if (
      state ===
      "LEVELUP"
    ) {

      const complete =
        level ===
        TOTAL_LEVELS;


      /*
         PLAY AGAIN
      */

      if (

        inside(

          x,
          y,

          width / 2,

          height * 0.66,

          300,
          80

        )

      ) {

        startLevel(
          level
        );

        return;

      }


      /*
         NEXT LEVEL / HOME
      */

      if (

        inside(

          x,
          y,

          width / 2,

          height * 0.76,

          300,
          80

        )

      ) {

        if (
          complete
        ) {

          state =
            "HOME";

          v4CelebrationActive =
            false;

        } else {

          startLevel(
            level + 1
          );

        }

        return;

      }


      return;

    }


    /* ============================================================
       HOME
    ============================================================ */

    if (
      state ===
      "HOME"
    ) {

      /*
         Existing V3 HOME buttons:

         PLAY       0.32
         ARCHIVE    0.43
         ABOUT      0.54
         SETTINGS   0.65
         RATE       0.76
      */


      const settingsY =
        height * 0.65;


      const rateY =
        height * 0.76;


      /*
         HELP is added below RATE.
      */

      const helpY =
        height * 0.87;


      /*
         Settings

         We intentionally handle this
         here before sending to V3.
      */

      if (

        inside(

          x,
          y,

          width / 2,

          settingsY,

          Math.min(
            340,
            width * 0.86
          ),

          78

        )

      ) {

        state =
          "SETTINGS";

        return;

      }


      /*
         RATE US
      */

      if (

        inside(

          x,
          y,

          width / 2,

          rateY,

          Math.min(
            340,
            width * 0.86
          ),

          78

        )

      ) {

        rating = 0;

        state =
          "RATING";

        return;

      }


      /*
         HELP

         V4 help button is positioned
         underneath the original menu.
      */

      if (

        helpY <
        height - 45 &&

        inside(

          x,
          y,

          width / 2,

          helpY,

          Math.min(
            340,
            width * 0.86
          ),

          65

        )

      ) {

        v4HelpReturnState =
          "HOME";

        state =
          "HELP";

        return;

      }


      /*
         Let original V3 handle
         PLAY / ARCHIVE / ABOUT.
      */

      V4_ORIGINAL_HANDLE_TAP(
        x,
        y
      );

      return;

    }


    /* ============================================================
       RATING
    ============================================================ */

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


      /*
         STAR SELECTION
      */

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

          rating =
            i;

          return;

        }

      }


      /*
         SUBMIT
      */

      if (

        inside(

          x,
          y,

          width / 2,

          height * 0.65,

          290,
          80

        )

      ) {

        /*
           Do not allow an empty rating.
        */

        if (
          rating < 1
        ) {

          tone(
            160,
            100,
            0.12,
            0.04,
            "square"
          );

          return;

        }


        try {

          localStorage.setItem(

            "spaceDodgerRating",

            String(
              rating
            )

          );

        }

        catch (
          error
        ) {}


        v4StartCelebration();


        v4RatingThanksUntil =
          millis() + 4500;


        state =
          "RATING_THANKS";


        return;

      }


      /*
         CANCEL -> HOME
      */

      if (

        inside(

          x,
          y,

          width / 2,

          height * 0.75,

          290,
          80

        )

      ) {

        state =
          "HOME";

        return;

      }


      return;

    }


    /* ============================================================
       SETTINGS
    ============================================================ */

    if (
      state ===
      "SETTINGS"
    ) {

      /*
         CONTROL LAYOUT
      */

      if (

        inside(

          x,
          y,

          width / 2,

          height * 0.32,

          370,
          120

        )

      ) {

        swappedControls =
          !swappedControls;

        updateLayout();

        saveGame();

        return;

      }


      /*
         SOUND
      */

      if (

        inside(

          x,
          y,

          width / 2,

          height * 0.48,

          370,
          120

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


      /*
         HOME
      */

      if (

        inside(

          x,
          y,

          width / 2,

          height -
          MENU_HOME_OFFSET,

          250,
          80

        )

      ) {

        state =
          "HOME";

        return;

      }


      return;

    }


    /* ============================================================
       EVERYTHING ELSE
    ============================================================ */

    V4_ORIGINAL_HANDLE_TAP(
      x,
      y
    );

  };


/* ================================================================
   V4 HUD ADDITIONS
================================================================ */

drawHUD =
  function() {

    V4_ORIGINAL_DRAW_HUD();


    /*
       CRYO HUD
    */

    if (

      state ===
      "PLAYING" &&

      millis() <
      powers.CRYO

    ) {

      const remaining =
        Math.max(

          0,

          Math.ceil(

            (
              powers.CRYO -
              millis()
            ) / 1000

          )

        );


      label(

        "❄ CRYO  " +
        remaining +
        "s",

        width -
        14,

        82,

        9,

        "#9eefff",

        RIGHT,
        CENTER,
        true

      );

    }


    /*
       Special weapon HUD
       is drawn separately by
       v4DrawAttachedWeapon().
    */

  };


/* ================================================================
   V4 HOME DRAW OVERRIDE
   Adds HELP without removing V3 menu.
================================================================ */

const V4_ORIGINAL_DRAW_HOME =
  drawHome;


drawHome =
  function() {

    /*
       Keep original V3 HOME.
    */

    V4_ORIGINAL_DRAW_HOME();


    /*
       Add HELP button below RATE.
       It is intentionally compact so
       the original V3 menu remains intact.
    */

    const helpY =
      height * 0.87;


    if (
      helpY <
      height - 40
    ) {

      menuButton(
        "HELP",
        helpY
      );

    }

  };


/* ================================================================
   V4 SETTINGS DRAW
   Replaces only the visual screen,
   NOT the routing.
================================================================ */

const V4_ORIGINAL_DRAW_SETTINGS =
  drawSettings;


drawSettings =
  function() {

    /*
       Explicit V4 settings screen.
       This prevents any blank-screen
       appearance while preserving the
       same V3 settings functionality.
    */

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


    label(
      "Controls can be swapped for your preferred hand.",
      width / 2,
      height * 0.67,
      9,
      "#61747d"
    );


    homeButton();

  };


/* ================================================================
   V4 STARTUP RESET
================================================================ */

if (
  typeof v4WeaponDrops ===
  "undefined"
) {

  v4WeaponDrops = [];

}


/* ================================================================
   END OF SPACE DODGER V4 COMPLETE PATCH
================================================================ */
