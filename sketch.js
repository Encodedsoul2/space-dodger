// ================================================================
// 🚀 SPACE DODGER — GALACTIC CAMPAIGN v4
// COMPLETE SINGLE sketch.js
// p5.js v2 compatible
// Mobile First
// ================================================================

// ================================================================
// GLOBAL STATE
// ================================================================

let gameState = "HOME";

let ship;

let bullets = [];
let aliens = [];
let enemyShots = [];
let particles = [];
let powerUps = [];
let stars = [];

let boss = null;

let currentLevel = 1;
let unlockedLevel = 1;
let selectedShip = 0;

let score = 0;
let levelScore = 0;
let lives = 3;

let levelStartTime = 0;
let levelDuration = 45000;
let levelTargetScore = 500;

let lastEnemySpawn = 0;
let lastPowerSpawn = 0;
let lastShot = 0;

let levelCompleteAt = 0;

let shakeUntil = 0;
let shakePower = 0;

let soundEnabled = true;
let controlsSwapped = false;

let audioCtx = null;

// Rating
let ratingOpen = false;
let selectedRating = 0;

// Archive scrolling
let archiveScroll = 0;
let archiveTargetScroll = 0;
let archiveDragging = false;
let archiveStartY = 0;
let archiveStartScroll = 0;
let archiveMoved = false;

// Pause
let pauseStarted = 0;

// Boss music
let bossMusicTimer = null;
let bossMusicStep = 0;

// ================================================================
// CAMPAIGN
// ================================================================

const TOTAL_LEVELS = 20;

const LEVEL_TITLES = [
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

function getLevelDuration(level) {
  return 40000 + (level - 1) * 5000;
}

function getLevelTarget(level) {
  return 350 + (level - 1) * 145 + floor(pow(level, 1.35) * 20);
}

function getEnemyDelay(level) {
  return max(350, 1050 - (level - 1) * 34);
}

function getDifficulty(level) {
  return 1 + (level - 1) * 0.06;
}

function isBossLevel() {
  return (
    currentLevel === 5 ||
    currentLevel === 10 ||
    currentLevel === 15 ||
    currentLevel === 20
  );
}

// ================================================================
// SHIP ARCHIVE
// ================================================================

const SHIPS = [
  {
    name: "NOVA SCOUT",
    unlock: 1,
    body: "#10204a",
    edge: "#00eaff",
    core: "#ffffff",
    power: "BALANCED",
    desc: "Balanced firepower"
  },

  {
    name: "SOLAR FANG",
    unlock: 3,
    body: "#5b2410",
    edge: "#ff8a00",
    core: "#ffe066",
    power: "BURN SHOT",
    desc: "Extra damage"
  },

  {
    name: "NEBULA WING",
    unlock: 5,
    body: "#32105b",
    edge: "#c66cff",
    core: "#ffffff",
    power: "RAPID FIRE",
    desc: "Faster lasers"
  },

  {
    name: "CRYO HAWK",
    unlock: 7,
    body: "#103c60",
    edge: "#7ee8ff",
    core: "#dfffff",
    power: "CRYO FIELD",
    desc: "Slows aliens"
  },

  {
    name: "VOID SPEAR",
    unlock: 9,
    body: "#251033",
    edge: "#ff4ddd",
    core: "#ffffff",
    power: "PIERCING",
    desc: "Shots pierce enemies"
  },

  {
    name: "DRAGON BANE",
    unlock: 10,
    body: "#5c0715",
    edge: "#ff1744",
    core: "#ffe600",
    power: "DRAGON HUNTER",
    desc: "Boss damage +50%"
  },

  {
    name: "QUANTUM EDGE",
    unlock: 12,
    body: "#063f45",
    edge: "#00ffd5",
    core: "#ffffff",
    power: "QUANTUM",
    desc: "Double-hit chance"
  },

  {
    name: "STAR PALADIN",
    unlock: 15,
    body: "#55490a",
    edge: "#fff176",
    core: "#ffffff",
    power: "AUTO SHIELD",
    desc: "Periodic protection"
  },

  {
    name: "GALACTIC TITAN",
    unlock: 18,
    body: "#431c58",
    edge: "#ff78ff",
    core: "#ffffaa",
    power: "TITAN CANNON",
    desc: "Heavy laser"
  },

  {
    name: "MULTIVERSE KING",
    unlock: 20,
    body: "#5a3f00",
    edge: "#ffd700",
    core: "#ffffff",
    power: "CELESTIAL",
    desc: "Five-way laser"
  }
];

// ================================================================
// POWER TIMERS
// ================================================================

let shieldUntil = 0;
let rapidUntil = 0;
let multiUntil = 0;
let cryoUntil = 0;
let celestialUntil = 0;

let autoShieldReady = 0;

function resetPowerTimers() {
  shieldUntil = 0;
  rapidUntil = 0;
  multiUntil = 0;
  cryoUntil = 0;
  celestialUntil = 0;
  autoShieldReady = 0;
}

// ================================================================
// TOUCH CONTROLS
// ================================================================

const joystick = {
  baseX: 90,
  baseY: 0,
  knobX: 90,
  knobY: 0,
  radius: 58,
  active: false
};

const fireButton = {
  x: 0,
  y: 0,
  radius: 52
};

const pauseButton = {
  x: 38,
  y: 90,
  radius: 22
};

const homeButton = {
  x: 0,
  y: 90,
  radius: 22
};

// ================================================================
// SETUP
// ================================================================

function setup() {
  createCanvas(windowWidth, windowHeight);

  textFont("Arial");

  loadSave();
  createStars();
  resetControls();

  ship = new PlayerShip();

  lastEnemySpawn = millis();
  lastPowerSpawn = millis();
}

// ================================================================
// SAVE
// ================================================================

function saveGame() {
  try {
    localStorage.setItem(
      "spaceDodgerSaveV4",
      JSON.stringify({
        unlockedLevel: unlockedLevel,
        selectedShip: selectedShip,
        soundEnabled: soundEnabled,
        controlsSwapped: controlsSwapped
      })
    );
  } catch (err) {
    // Storage may be unavailable in some preview environments.
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem("spaceDodgerSaveV4");

    if (!raw) return;

    const data = JSON.parse(raw);

    if (Number.isFinite(data.unlockedLevel)) {
      unlockedLevel = constrain(
        floor(data.unlockedLevel),
        1,
        TOTAL_LEVELS
      );
    }

    if (Number.isFinite(data.selectedShip)) {
      selectedShip = constrain(
        floor(data.selectedShip),
        0,
        SHIPS.length - 1
      );
    }

    soundEnabled = data.soundEnabled !== false;
    controlsSwapped = data.controlsSwapped === true;
  } catch (err) {
    // Ignore invalid save data.
  }
}

// ================================================================
// MAIN DRAW
// ================================================================

function draw() {
  drawBackground();
  updateStars();
  drawStars();

  if (gameState === "HOME") {
    drawHome();
    return;
  }

  if (gameState === "LEVELS") {
    drawLevels();
    return;
  }

  if (gameState === "ARCHIVE") {
    drawArchive();
    return;
  }

  if (gameState === "ABOUT") {
    drawAbout();
    return;
  }

  if (gameState === "SETTINGS") {
    drawSettings();
    return;
  }

  if (gameState === "RATING") {
    drawRating();
    return;
  }

  if (gameState === "PLAYING") {
    runGame();
    return;
  }

  if (gameState === "PAUSED") {
    drawFrozenWorld();
    drawHUD();
    drawPauseOverlay();
    return;
  }

  if (gameState === "GAMEOVER") {
    drawFrozenWorld();
    drawHUD();
    drawGameOver();
    return;
  }

  if (gameState === "LEVELUP") {
    updateParticles();
    drawLevelComplete();
  }
}

// ================================================================
// BACKGROUND
// ================================================================

function drawBackground() {
  if (boss) {
    const pulse = sin(frameCount * 0.05) * 5;
    background(18 + pulse, 2, 9);
    return;
  }

  if (currentLevel >= 15) {
    background(4, 3, 20);
  } else if (currentLevel >= 10) {
    background(2, 10, 24);
  } else if (currentLevel >= 5) {
    background(12, 4, 20);
  } else {
    background(2, 6, 18);
  }
}

// ================================================================
// STARS
// ================================================================

function createStars() {
  stars = [];

  for (let i = 0; i < 150; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      speed: random(0.2, 1.1),
      alpha: random(100, 230)
    });
  }
}

function updateStars() {
  for (const star of stars) {
    star.y += star.speed;

    if (star.y > height) {
      star.y = -2;
      star.x = random(width);
    }
  }
}

function drawStars() {
  noStroke();

  for (const star of stars) {
    fill(255, 255, 255, star.alpha);
    circle(star.x, star.y, star.size);
  }
}

// ================================================================
// HOME
// ================================================================

function drawHome() {
  push();

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);
  textStyle(BOLD);
  textSize(min(44, width * 0.115));

  text("SPACE DODGER", width / 2, height * 0.16);

  fill(255, 220, 50);
  textSize(14);
  text("GALACTIC CAMPAIGN", width / 2, height * 0.22);

  drawMenuButton("PLAY", height * 0.35);
  drawMenuButton("ARCHIVE", height * 0.45);
  drawMenuButton("ABOUT", height * 0.55);
  drawMenuButton("SETTINGS", height * 0.65);
  drawMenuButton("RATE US", height * 0.75);

  fill(180);
  textStyle(NORMAL);
  textSize(12);

  text(
    "Highest Level Unlocked: " +
      unlockedLevel +
      " / " +
      TOTAL_LEVELS,
    width / 2,
    height * 0.88
  );

  pop();
}

function drawMenuButton(label, y) {
  const w = min(310, width * 0.78);

  push();

  rectMode(CENTER);

  stroke(0, 205, 255, 180);
  strokeWeight(2);
  fill(5, 22, 42, 235);

  rect(width / 2, y, w, 52, 13);

  noStroke();
  fill(255);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(16);

  text(label, width / 2, y);

  pop();
}

// ================================================================
// LEVEL SELECT
// ================================================================

function drawLevels() {
  push();

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);
  textStyle(BOLD);
  textSize(27);

  text("SELECT LEVEL", width / 2, 50);

  fill(255, 220, 50);
  textSize(12);

  text(
    "CURRENT RANK",
    width / 2,
    82
  );

  fill(255);
  textSize(17);

  text(
    LEVEL_TITLES[unlockedLevel - 1],
    width / 2,
    105
  );

  const cols = 4;
  const gap = 10;

  const size = min(
    65,
    (width - 48) / cols
  );

  const totalWidth =
    cols * size +
    (cols - 1) * gap;

  const startX =
    width / 2 -
    totalWidth / 2 +
    size / 2;

  const startY = 165;

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const col = (i - 1) % cols;
    const row = floor((i - 1) / cols);

    const x =
      startX +
      col * (size + gap);

    const y =
      startY +
      row * (size + 17);

    const unlocked = i <= unlockedLevel;

    rectMode(CENTER);

    stroke(
      unlocked
        ? color(0, 215, 255)
        : color(70)
    );

    strokeWeight(2);

    fill(
      unlocked
        ? color(5, 32, 52)
        : color(20, 20, 25)
    );

    rect(x, y, size, size, 11);

    noStroke();

    fill(unlocked ? 255 : 90);

    textStyle(BOLD);
    textSize(18);

    text(
      unlocked ? String(i) : "LOCK",
      x,
      y - 4
    );

    if (unlocked) {
      fill(140, 220, 255);
      textSize(8);
      text(
        isSpecialLevel(i) ? "BOSS" : "MISSION",
        x,
        y + 20
      );
    }
  }

  drawBackButton();

  pop();
}

function isSpecialLevel(level) {
  return (
    level === 5 ||
    level === 10 ||
    level === 15 ||
    level === 20
  );
}

// ================================================================
// ARCHIVE
// ================================================================

function archiveCardHeight() {
  return 142;
}

function archiveContentHeight() {
  return (
    145 +
    SHIPS.length * archiveCardHeight()
  );
}

function archiveMaxScroll() {
  const visible =
    height - 175;

  return max(
    0,
    archiveContentHeight() - visible
  );
}

function drawArchive() {
  push();

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);
  textStyle(BOLD);
  textSize(25);

  text(
    "SHIP ARCHIVE",
    width / 2,
    40
  );

  fill(175);
  textStyle(NORMAL);
  textSize(12);

  text(
    "Drag up/down to explore • Tap a ship to select",
    width / 2,
    70
  );

  // Clip archive content.
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(
    0,
    92,
    width,
    height - 150
  );
  drawingContext.clip();

  push();

  translate(
    0,
    100 - archiveScroll
  );

  const cardW = min(
    330,
    width * 0.84
  );

  const cardH = archiveCardHeight();

  for (let i = 0; i < SHIPS.length; i++) {
    drawShipCard(
      i,
      width / 2,
      75 + i * cardH,
      cardW,
      cardH - 10
    );
  }

  pop();

  drawingContext.restore();

  // Scroll bar.
  const trackX = width - 12;
  const trackY = 100;
  const trackH = height - 165;

  noStroke();
  fill(255, 255, 255, 35);

  rect(
    trackX,
    trackY,
    5,
    trackH,
    3
  );

  if (archiveMaxScroll() > 0) {
    const thumbH = max(
      45,
      trackH *
        ((height - 165) /
          archiveContentHeight())
    );

    const thumbY =
      trackY +
      (archiveScroll /
        archiveMaxScroll()) *
        (trackH - thumbH);

    fill(0, 220, 255, 170);

    rect(
      trackX,
      thumbY,
      5,
      thumbH,
      3
    );
  }

  drawBackButton();

  pop();
}

function drawShipCard(
  index,
  x,
  y,
  w,
  h
) {
  const data = SHIPS[index];

  const unlocked =
    unlockedLevel >= data.unlock;

  const selected =
    selectedShip === index;

  rectMode(CENTER);

  stroke(
    selected
      ? color(255, 220, 40)
      : unlocked
      ? color(data.edge)
      : color(65)
  );

  strokeWeight(selected ? 3 : 2);

  fill(5, 17, 31);

  rect(x, y, w, h, 15);

  if (unlocked) {
    drawArchiveShip(
      x - w * 0.26,
      y,
      index,
      0.9
    );

    noStroke();

    textAlign(LEFT, CENTER);

    fill(255);
    textStyle(BOLD);
    textSize(15);

    text(
      data.name,
      x - w * 0.02,
      y - 28
    );

    fill(0, 230, 255);
    textSize(12);

    text(
      data.power,
      x - w * 0.02,
      y
    );

    fill(175);
    textStyle(NORMAL);
    textSize(11);

    text(
      data.desc,
      x - w * 0.02,
      y + 22
    );

    fill(
      selected
        ? color(255, 220, 50)
        : color(120, 220, 255)
    );

    textStyle(BOLD);
    textSize(10);

    text(
      selected
        ? "SELECTED"
        : "TAP TO SELECT",
      x - w * 0.02,
      y + 43
    );
  } else {
    noStroke();

    fill(100);

    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(13);

    text(
      "LOCKED",
      x,
      y - 8
    );

    fill(150);
    textStyle(NORMAL);
    textSize(10);

    text(
      "UNLOCK AT LEVEL " + data.unlock,
      x,
      y + 18
    );
  }
}

function drawArchiveShip(
  x,
  y,
  index,
  scaleValue
) {
  const data = SHIPS[index];

  push();

  translate(x, y);
  scale(scaleValue);

  stroke(data.edge);
  strokeWeight(3);

  fill(data.body);

  beginShape();

  vertex(0, -40);
  vertex(-15, -8);
  vertex(-37, 22);
  vertex(-10, 14);
  vertex(0, 22);
  vertex(10, 14);
  vertex(37, 22);
  vertex(15, -8);

  endShape(CLOSE);

  noStroke();

  fill(data.core);

  ellipse(
    0,
    -5,
    11,
    17
  );

  fill(data.edge);

  triangle(
    -5,
    20,
    5,
    20,
    0,
    34
  );

  pop();
}

// ================================================================
// ABOUT
// ================================================================

function drawAbout() {
  push();

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);
  textStyle(BOLD);
  textSize(30);

  text("ABOUT", width / 2, height * 0.19);

  fill(190);
  textStyle(NORMAL);
  textSize(16);

  text(
    "Developed by",
    width / 2,
    height * 0.37
  );

  fill(255, 220, 50);
  textStyle(BOLD);
  textSize(19);

  text(
    "Aazad S Rana",
    width / 2,
    height * 0.44
  );

  fill(255);
  textStyle(NORMAL);
  textSize(15);

  text(
    "A mobile space adventure",
    width / 2,
    height * 0.52
  );

  fill(130, 210, 255);
  textSize(13);

  text(
    "20 levels • Alien battles • Dragon bosses",
    width / 2,
    height * 0.58
  );

  drawBackButton();

  pop();
}

// ================================================================
// SETTINGS
// ================================================================

function drawSettings() {
  push();

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);
  textStyle(BOLD);
  textSize(29);

  text("SETTINGS", width / 2, height * 0.18);

  drawSettingBox(
    "CONTROL LAYOUT",
    controlsSwapped
      ? "FIRE LEFT • MOVE RIGHT"
      : "MOVE LEFT • FIRE RIGHT",
    height * 0.36
  );

  drawSettingBox(
    "SOUND EFFECTS",
    soundEnabled ? "ON" : "OFF",
    height * 0.52
  );

  fill(160);
  textStyle(NORMAL);
  textSize(12);

  text(
    "Tap an option to change it",
    width / 2,
    height * 0.64
  );

  drawBackButton();

  pop();
}

function drawSettingBox(
  title,
  value,
  y
) {
  const w = min(
    330,
    width * 0.84
  );

  rectMode(CENTER);

  stroke(0, 210, 255);
  strokeWeight(2);

  fill(5, 25, 45);

  rect(
    width / 2,
    y,
    w,
    82,
    15
  );

  noStroke();

  fill(170);
  textStyle(NORMAL);
  textSize(12);

  text(title, width / 2, y - 18);

  fill(255);
  textStyle(BOLD);
  textSize(16);

  text(value, width / 2, y + 13);
}

// ================================================================
// RATING
// ================================================================

function drawRating() {
  push();

  fill(0, 0, 0, 205);

  rectMode(CORNER);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);
  textStyle(BOLD);
  textSize(29);

  text(
    "RATE SPACE DODGER",
    width / 2,
    height * 0.28
  );

  fill(190);
  textStyle(NORMAL);
  textSize(14);

  text(
    "How was your experience?",
    width / 2,
    height * 0.36
  );

  const gap = min(
    48,
    width * 0.12
  );

  for (let i = 1; i <= 5; i++) {
    const x =
      width / 2 +
      (i - 3) * gap;

    fill(
      i <= selectedRating
        ? color(255, 215, 40)
        : color(70)
    );

    noStroke();

    textSize(42);

    text("★", x, height * 0.48);
  }

  fill(255);
  textStyle(BOLD);
  textSize(15);

  text(
    selectedRating > 0
      ? selectedRating + " / 5"
      : "SELECT A RATING",
    width / 2,
    height * 0.57
  );

  drawActionButton(
    "SUBMIT RATING",
    height * 0.67
  );

  drawActionButton(
    "CANCEL",
    height * 0.76
  );

  pop();
}

// ================================================================
// BACK BUTTON
// ================================================================

function drawBackButton() {
  push();

  rectMode(CENTER);

  stroke(0, 200, 255);
  strokeWeight(2);

  fill(5, 20, 35);

  rect(
    width / 2,
    height - 52,
    150,
    42,
    12
  );

  noStroke();

  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(14);

  text(
    "HOME",
    width / 2,
    height - 52
  );

  pop();
}

// ================================================================
// START LEVEL
// ================================================================

function startLevel(level) {
  stopBossMusic();

  currentLevel = constrain(
    floor(level),
    1,
    TOTAL_LEVELS
  );

  score = 0;
  levelScore = 0;
  lives = 3;

  levelDuration =
    getLevelDuration(currentLevel);

  levelTargetScore =
    getLevelTarget(currentLevel);

  levelStartTime = millis();

  bullets = [];
  aliens = [];
  enemyShots = [];
  particles = [];
  powerUps = [];

  boss = null;

  resetPowerTimers();

  autoShieldReady =
    millis() + 12000;

  ship = new PlayerShip();

  resetControls();

  lastEnemySpawn = millis();
  lastPowerSpawn = millis();
  lastShot = 0;

  shakeUntil = 0;
  shakePower = 0;

  gameState = "PLAYING";

  playTone(
    320,
    720,
    0.35,
    "sine",
    0.045
  );
}

// ================================================================
// PLAYER
// ================================================================

class PlayerShip {
  constructor() {
    this.x = width / 2;
    this.y = height * 0.68;

    this.angle = -HALF_PI;

    this.speed = 5.2;
    this.radius = 18;

    this.invincibleUntil = 0;
  }

  update() {
    if (this.x < -35) this.x = width + 35;
    if (this.x > width + 35) this.x = -35;

    if (this.y < 115) this.y = 115;
    if (this.y > height - 125) {
      this.y = height - 125;
    }
  }

  draw() {
    if (
      millis() < this.invincibleUntil &&
      floor(millis() / 100) % 2 === 0
    ) {
      return;
    }

    const data = SHIPS[selectedShip];

    push();

    translate(this.x, this.y);

    rotate(this.angle + HALF_PI);

    let scaleValue = 1;

    if (selectedShip === 7) {
      scaleValue = 1.06;
    }

    if (selectedShip === 8) {
      scaleValue = 1.15;
    }

    if (selectedShip === 9) {
      scaleValue = 1.2;
    }

    scale(scaleValue);

    stroke(data.edge);
    strokeWeight(2.5);

    fill(data.body);

    beginShape();

    vertex(0, -34);
    vertex(-13, -8);
    vertex(-32, 21);
    vertex(-9, 14);
    vertex(0, 21);
    vertex(9, 14);
    vertex(32, 21);
    vertex(13, -8);

    endShape(CLOSE);

    noStroke();

    fill(data.core);

    ellipse(
      0,
      -4,
      10,
      16
    );

    fill(data.edge);

    triangle(
      -5,
      20,
      5,
      20,
      0,
      random(29, 37)
    );

    pop();

    // Auto shield ship.
    if (
      selectedShip === 7 &&
      millis() > autoShieldReady
    ) {
      shieldUntil = millis() + 3500;
      autoShieldReady = millis() + 15000;
    }

    if (
      millis() < shieldUntil ||
      millis() < celestialUntil
    ) {
      drawShield(
        this.x,
        this.y
      );
    }
  }
}

// ================================================================
// PLAYER MOVEMENT
// ================================================================

function movePlayer() {
  if (!joystick.active) return;

  const dx =
    joystick.knobX -
    joystick.baseX;

  const dy =
    joystick.knobY -
    joystick.baseY;

  const distance =
    sqrt(dx * dx + dy * dy);

  if (distance < 4) return;

  const angle = atan2(dy, dx);

  ship.angle = angle;

  const strength = constrain(
    distance / joystick.radius,
    0,
    1
  );

  let speed = ship.speed;

  if (selectedShip === 2) {
    speed *= 1.05;
  }

  ship.x +=
    cos(angle) *
    speed *
    strength;

  ship.y +=
    sin(angle) *
    speed *
    strength;

  ship.update();
}

// ================================================================
// SHOOT
// ================================================================

function shoot() {
  if (gameState !== "PLAYING") return;

  let delay = 155;
  let damage = 1;

  if (selectedShip === 2) {
    delay = 85;
  }

  if (selectedShip === 5) {
    damage = 1.35;
  }

  if (selectedShip === 8) {
    delay = 120;
    damage = 2;
  }

  if (selectedShip === 9) {
    delay = 100;
    damage = 2.2;
  }

  if (
    millis() - lastShot <
    delay
  ) {
    return;
  }

  lastShot = millis();

  let angles = [
    ship.angle
  ];

  if (
    selectedShip === 9 ||
    millis() < celestialUntil
  ) {
    angles = [
      ship.angle - radians(20),
      ship.angle - radians(10),
      ship.angle,
      ship.angle + radians(10),
      ship.angle + radians(20)
    ];
  } else if (
    millis() < multiUntil
  ) {
    angles = [
      ship.angle - radians(14),
      ship.angle,
      ship.angle + radians(14)
    ];
  }

  for (const angle of angles) {
    bullets.push(
      new PlayerBullet(
        ship.x +
          cos(angle) * 28,
        ship.y +
          sin(angle) * 28,
        angle,
        damage
      )
    );
  }

  playTone(
    selectedShip === 8 ||
      selectedShip === 9
      ? 500
      : 850,
    170,
    0.07,
    "square",
    0.022
  );
}

// ================================================================
// PLAYER BULLET
// ================================================================

class PlayerBullet {
  constructor(
    x,
    y,
    angle,
    damage
  ) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.damage = damage;
    this.speed = 12;
    this.life = 100;
    this.radius = 4;
  }

  update() {
    this.x +=
      cos(this.angle) *
      this.speed;

    this.y +=
      sin(this.angle) *
      this.speed;

    this.life--;
  }

  draw() {
    let c = "#00ffff";

    if (selectedShip === 1) {
      c = "#ff9d22";
    }

    if (selectedShip === 2) {
      c = "#c66cff";
    }

    if (selectedShip === 3) {
      c = "#8cecff";
    }

    if (selectedShip === 4) {
      c = "#ff4ddd";
    }

    if (selectedShip === 5) {
      c = "#ff1744";
    }

    if (selectedShip === 6) {
      c = "#00ffd5";
    }

    if (selectedShip === 7) {
      c = "#fff176";
    }

    if (selectedShip === 8) {
      c = "#ff78ff";
    }

    if (selectedShip === 9) {
      c = "#ffd700";
    }

    stroke(c);
    strokeWeight(4);

    line(
      this.x,
      this.y,
      this.x -
        cos(this.angle) * 18,
      this.y -
        sin(this.angle) * 18
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

// ================================================================
// ALIEN
// ================================================================

class AlienShip {
  constructor() {
    this.radius = random(
      17,
      26 + currentLevel * 0.4
    );

    this.x = random(
      30,
      width - 30
    );

    this.y = -60;

    this.speed =
      random(1.1, 2.1) *
      getDifficulty(currentLevel);

    this.hp =
      1 +
      floor(currentLevel / 6);

    this.maxHp = this.hp;

    this.phase = random(TWO_PI);
    this.type = floor(random(3));

    this.points =
      20 +
      currentLevel * 2;
  }

  update() {
    let slow = 1;

    if (
      selectedShip === 3 ||
      millis() < cryoUntil
    ) {
      slow = 0.52;
    }

    this.phase += 0.035;

    this.y +=
      this.speed *
      slow;

    this.x +=
      sin(this.phase) *
      0.8;

    if (
      this.y > height * 0.48
    ) {
      this.y +=
        this.speed *
        0.25 *
        slow;
    }
  }

  draw() {
    let edge;
    let body;

    if (this.type === 0) {
      edge = "#ff4d70";
      body = "#42152a";
    } else if (this.type === 1) {
      edge = "#a86cff";
      body = "#29144b";
    } else {
      edge = "#36e6a3";
      body = "#103b30";
    }

    push();

    translate(
      this.x,
      this.y
    );

    rotate(
      sin(this.phase) * 0.18
    );

    stroke(edge);
    strokeWeight(2);

    fill(body);

    beginShape();

    vertex(0, -25);
    vertex(-25, -7);
    vertex(-18, 18);
    vertex(0, 25);
    vertex(18, 18);
    vertex(25, -7);

    endShape(CLOSE);

    noStroke();

    fill(edge);

    ellipse(
      -8,
      -2,
      7,
      9
    );

    ellipse(
      8,
      -2,
      7,
      9
    );

    fill(255);

    ellipse(
      -8,
      -2,
      2.5,
      3
    );

    ellipse(
      8,
      -2,
      2.5,
      3
    );

    pop();
  }

  dead() {
    return this.y > height + 90;
  }
}

// ================================================================
// SPAWN ALIENS
// ================================================================

function spawnAliens() {
  const delay =
    boss
      ? 1800
      : getEnemyDelay(currentLevel);

  if (
    millis() -
      lastEnemySpawn <
    delay
  ) {
    return;
  }

  let count = 1;

  if (
    currentLevel >= 6 &&
    random() < 0.2
  ) {
    count = 2;
  }

  if (
    currentLevel >= 13 &&
    random() < 0.15
  ) {
    count = 3;
  }

  if (boss) {
    count = 1;
  }

  for (let i = 0; i < count; i++) {
    aliens.push(
      new AlienShip()
    );
  }

  lastEnemySpawn = millis();
}

// ================================================================
// UPDATE BULLETS
// ================================================================

function updateBullets() {
  for (
    let i = bullets.length - 1;
    i >= 0;
    i--
  ) {
    bullets[i].update();

    if (bullets[i].dead()) {
      bullets.splice(i, 1);
    }
  }
}

function drawBullets() {
  for (const bullet of bullets) {
    bullet.draw();
  }
}

// ================================================================
// UPDATE ALIENS
// ================================================================

function updateAliens() {
  for (
    let i = aliens.length - 1;
    i >= 0;
    i--
  ) {
    aliens[i].update();

    if (aliens[i].dead()) {
      aliens.splice(i, 1);
    }
  }
}

function drawAliens() {
  for (const alien of aliens) {
    alien.draw();
  }
}

// ================================================================
// BULLET / ALIEN COLLISION
// ================================================================

function bulletAlienCollisions() {
  for (
    let i = aliens.length - 1;
    i >= 0;
    i--
  ) {
    const alien = aliens[i];

    for (
      let j = bullets.length - 1;
      j >= 0;
      j--
    ) {
      const bullet = bullets[j];

      if (
        dist(
          alien.x,
          alien.y,
          bullet.x,
          bullet.y
        ) <
        alien.radius +
          bullet.radius
      ) {
        let damage =
          bullet.damage;

        if (selectedShip === 1) {
          damage *= 1.25;
        }

        if (
          selectedShip === 6 &&
          random() < 0.4
        ) {
          damage *= 2;
        }

        alien.hp -= damage;

        // Piercing ship.
        if (
          selectedShip !== 4
        ) {
          bullets.splice(j, 1);
        }

        if (alien.hp <= 0) {
          destroyAlien(
            i
          );
        }

        break;
      }
    }
  }
}

function destroyAlien(index) {
  if (!aliens[index]) return;

  const alien =
    aliens[index];

  createExplosion(
    alien.x,
    alien.y,
    28,
    "#ff6688"
  );

  score += alien.points;
  levelScore += alien.points;

  screenShake(9, 180);

  explosionSound();

  aliens.splice(
    index,
    1
  );
}

// ================================================================
// SHIP / ALIEN COLLISION
// ================================================================

function playerAlienCollision() {
  if (
    millis() <
    ship.invincibleUntil
  ) {
    return;
  }

  for (
    let i = aliens.length - 1;
    i >= 0;
    i--
  ) {
    const alien = aliens[i];

    if (
      dist(
        ship.x,
        ship.y,
        alien.x,
        alien.y
      ) <
      ship.radius +
        alien.radius * 0.8
    ) {
      if (
        millis() < shieldUntil ||
        millis() < celestialUntil
      ) {
        createExplosion(
          alien.x,
          alien.y,
          24,
          "#00ccff"
        );

        screenShake(8, 180);

        aliens.splice(i, 1);

        return;
      }

      aliens.splice(i, 1);

      damagePlayer();

      return;
    }
  }
}

// ================================================================
// DAMAGE
// ================================================================

function damagePlayer() {
  lives--;

  ship.invincibleUntil =
    millis() + 1800;

  screenShake(
    15,
    300
  );

  playTone(
    180,
    50,
    0.28,
    "sawtooth",
    0.055
  );

  if (lives <= 0) {
    gameState = "GAMEOVER";

    createExplosion(
      ship.x,
      ship.y,
      60,
      "#00ddff"
    );
  }
}

// ================================================================
// ENEMY SHOOTS
// ================================================================

function enemyAttackUpdate() {
  for (const alien of aliens) {
    if (
      random() <
      0.0009 *
        getDifficulty(currentLevel)
    ) {
      const angle =
        atan2(
          ship.y - alien.y,
          ship.x - alien.x
        );

      enemyShots.push(
        new EnemyShot(
          alien.x,
          alien.y,
          angle
        )
      );
    }
  }
}

// ================================================================
// ENEMY SHOT
// ================================================================

class EnemyShot {
  constructor(
    x,
    y,
    angle
  ) {
    this.x = x;
    this.y = y;
    this.angle = angle;

    this.speed = 4;
    this.radius = 8;
    this.life = 260;
  }

  update() {
    let slow =
      selectedShip === 3 ||
      millis() < cryoUntil
        ? 0.55
        : 1;

    this.x +=
      cos(this.angle) *
      this.speed *
      slow;

    this.y +=
      sin(this.angle) *
      this.speed *
      slow;

    this.life--;
  }

  draw() {
    noFill();

    stroke(255, 60, 100);
    strokeWeight(4);

    circle(
      this.x,
      this.y,
      this.radius * 2
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

function updateEnemyShots() {
  for (
    let i = enemyShots.length - 1;
    i >= 0;
    i--
  ) {
    enemyShots[i].update();

    if (
      enemyShots[i].dead()
    ) {
      enemyShots.splice(i, 1);
    }
  }
}

function drawEnemyShots() {
  for (const shot of enemyShots) {
    shot.draw();
  }
}

function enemyShotCollision() {
  if (
    millis() <
    ship.invincibleUntil
  ) {
    return;
  }

  for (
    let i = enemyShots.length - 1;
    i >= 0;
    i--
  ) {
    const shot =
      enemyShots[i];

    if (
      dist(
        ship.x,
        ship.y,
        shot.x,
        shot.y
      ) <
      ship.radius +
        shot.radius
    ) {
      if (
        millis() < shieldUntil ||
        millis() < celestialUntil
      ) {
        enemyShots.splice(
          i,
          1
        );

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

// ================================================================
// POWER UPS
// ================================================================

const POWER_TYPES = [
  "SHIELD",
  "MULTI",
  "RAPID",
  "CRYO",
  "NOVA",
  "CELESTIAL"
];

class PowerUp {
  constructor() {
    this.type =
      random(POWER_TYPES);

    this.x = random(
      60,
      width - 60
    );

    this.y = random(
      150,
      height - 170
    );

    this.radius = 22;

    this.life = 900;

    this.rotation = 0;
  }

  update() {
    this.rotation += 0.04;
    this.life--;
  }

  draw() {
    const config =
      getPowerConfig(
        this.type
      );

    push();

    translate(
      this.x,
      this.y
    );

    rotate(this.rotation);

    stroke(config.color);
    strokeWeight(3);

    fill(
      red(config.colorValue),
      green(config.colorValue),
      blue(config.colorValue),
      55
    );

    circle(
      0,
      0,
      48
    );

    noStroke();

    fill(255);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(10);

    text(
      config.label,
      0,
      0
    );

    pop();
  }
}

function getPowerConfig(type) {
  const map = {
    SHIELD: {
      label: "SHIELD",
      color: "#00cfff"
    },

    MULTI: {
      label: "3X",
      color: "#ffe600"
    },

    RAPID: {
      label: "RAPID",
      color: "#c66cff"
    },

    CRYO: {
      label: "CRYO",
      color: "#9eefff"
    },

    NOVA: {
      label: "NOVA",
      color: "#ffffff"
    },

    CELESTIAL: {
      label: "5X",
      color: "#ffd700"
    }
  };

  const data =
    map[type] || map.SHIELD;

  return {
    label: data.label,
    color: data.color,
    colorValue: color(data.color)
  };
}

function spawnPowerUps() {
  const delay =
    boss
      ? 5000
      : max(
          6500,
          9500 -
            currentLevel * 100
        );

  if (
    millis() -
      lastPowerSpawn <
    delay
  ) {
    return;
  }

  if (
    powerUps.length < 2
  ) {
    powerUps.push(
      new PowerUp()
    );
  }

  lastPowerSpawn = millis();
}

function updatePowerUps() {
  for (
    let i = powerUps.length - 1;
    i >= 0;
    i--
  ) {
    powerUps[i].update();

    if (
      powerUps[i].life <= 0
    ) {
      powerUps.splice(i, 1);
    }
  }
}

function drawPowerUps() {
  for (const power of powerUps) {
    power.draw();
  }
}

function powerCollision() {
  for (
    let i = powerUps.length - 1;
    i >= 0;
    i--
  ) {
    const p =
      powerUps[i];

    if (
      dist(
        ship.x,
        ship.y,
        p.x,
        p.y
      ) <
      ship.radius +
        p.radius
    ) {
      activatePower(
        p.type
      );

      createExplosion(
        p.x,
        p.y,
        25,
        getPowerConfig(p.type)
          .color
      );

      score += 50;
      levelScore += 50;

      powerUps.splice(
        i,
        1
      );

      return;
    }
  }
}

function activatePower(type) {
  const now = millis();

  if (type === "SHIELD") {
    shieldUntil =
      now + 9000;
  }

  if (type === "MULTI") {
    multiUntil =
      now + 9000;
  }

  if (type === "RAPID") {
    rapidUntil =
      now + 9000;
  }

  if (type === "CRYO") {
    cryoUntil =
      now + 8500;
  }

  if (type === "CELESTIAL") {
    celestialUntil =
      now + 7000;

    shieldUntil =
      max(
        shieldUntil,
        now + 4500
      );
  }

  if (type === "NOVA") {
    for (
      let i = aliens.length - 1;
      i >= 0;
      i--
    ) {
      createExplosion(
        aliens[i].x,
        aliens[i].y,
        20,
        "#ffffff"
      );

      score += 15;
      levelScore += 15;

      aliens.splice(i, 1);
    }

    if (boss) {
      boss.hp -=
        boss.maxHp * 0.12;
    }

    screenShake(
      18,
      350
    );
  }

  powerSound(type);
}

// ================================================================
// SHIELD
// ================================================================

function drawShield(
  x,
  y
) {
  noFill();

  stroke(
    0,
    215,
    255,
    190
  );

  strokeWeight(4);

  circle(
    x,
    y,
    82 +
      sin(frameCount * 0.1) *
        6
  );
}

// ================================================================
// BOSS
// ================================================================

class DragonBoss {
  constructor() {
    this.x = width / 2;
    this.y = -120;

    this.targetY =
      max(
        145,
        height * 0.2
      );

    this.radius = 78;

    this.maxHp =
      850 +
      currentLevel * 180;

    this.hp =
      this.maxHp;

    this.phase = 1;

    this.move = 0;

    this.lastAttack = millis();
  }

  update() {
    const ratio =
      this.hp /
      this.maxHp;

    this.phase =
      ratio > 0.65
        ? 1
        : ratio > 0.32
        ? 2
        : 3;

    if (
      this.y <
      this.targetY
    ) {
      this.y += 1.3;
      return;
    }

    this.move +=
      this.phase === 3
        ? 0.025
        : 0.015;

    this.x =
      width / 2 +
      sin(this.move) *
        width *
        0.28;

    const attackDelay =
      this.phase === 1
        ? 2200
        : this.phase === 2
        ? 1600
        : 1100;

    if (
      millis() -
        this.lastAttack >
      attackDelay
    ) {
      this.attack();

      this.lastAttack =
        millis();
    }
  }

  attack() {
    const angle =
      atan2(
        ship.y - this.y,
        ship.x - this.x
      );

    let spread;

    if (this.phase === 1) {
      spread = [0];
    } else if (
      this.phase === 2
    ) {
      spread = [-16, 0, 16];
    } else {
      spread = [
        -28,
        -14,
        0,
        14,
        28
      ];
    }

    for (const degrees of spread) {
      enemyShots.push(
        new BossShot(
          this.x,
          this.y + 38,
          angle +
            radians(degrees),
          this.phase
        )
      );
    }

    playTone(
      130,
      45,
      0.22,
      "sawtooth",
      0.045
    );
  }

  draw() {
    push();

    translate(
      this.x,
      this.y
    );

    const edge =
      this.phase === 3
        ? "#ff1744"
        : "#ff6a00";

    stroke(edge);
    strokeWeight(4);

    fill(
      this.phase === 3
        ? "#650019"
        : "#54170e"
    );

    // Wings
    beginShape();

    vertex(-25, -10);
    vertex(-100, -50);
    vertex(-67, 0);
    vertex(-105, 40);
    vertex(-30, 25);

    endShape(CLOSE);

    beginShape();

    vertex(25, -10);
    vertex(100, -50);
    vertex(67, 0);
    vertex(105, 40);
    vertex(30, 25);

    endShape(CLOSE);

    ellipse(
      0,
      12,
      94,
      120
    );

    beginShape();

    vertex(0, -76);
    vertex(-38, -40);
    vertex(-30, 10);
    vertex(0, 32);
    vertex(30, 10);
    vertex(38, -40);

    endShape(CLOSE);

    noStroke();

    fill(
      this.phase === 3
        ? "#ff1744"
        : "#ffe600"
    );

    ellipse(
      -15,
      -34,
      11,
      8
    );

    ellipse(
      15,
      -34,
      11,
      8
    );

    pop();
  }
}

class BossShot {
  constructor(
    x,
    y,
    angle,
    phase
  ) {
    this.x = x;
    this.y = y;
    this.angle = angle;

    this.phase = phase;

    this.speed =
      phase === 3
        ? 4.3
        : phase === 2
        ? 3.7
        : 3.1;

    this.radius = 15;
    this.life = 280;
  }

  update() {
    const slow =
      selectedShip === 3 ||
      millis() < cryoUntil
        ? 0.55
        : 1;

    this.x +=
      cos(this.angle) *
      this.speed *
      slow;

    this.y +=
      sin(this.angle) *
      this.speed *
      slow;

    this.life--;
  }

  draw() {
    noFill();

    stroke(255, 30, 60);
    strokeWeight(
      this.phase === 3
        ? 6
        : 4
    );

    circle(
      this.x,
      this.y,
      this.radius * 2
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

function startBossIfNeeded() {
  if (
    !isBossLevel() ||
    boss
  ) {
    return;
  }

  const elapsed =
    millis() -
    levelStartTime;

  if (
    elapsed >
    levelDuration * 0.45
  ) {
    boss =
      new DragonBoss();

    aliens = [];
    powerUps = [];
    enemyShots = [];

    startBossMusic();

    screenShake(
      12,
      400
    );

    playTone(
      50,
      95,
      1.0,
      "sawtooth",
      0.065
    );
  }
}

function updateBoss() {
  if (!boss) return;

  boss.update();

  for (
    let i = bullets.length - 1;
    i >= 0;
    i--
  ) {
    const bullet =
      bullets[i];

    if (
      dist(
        bullet.x,
        bullet.y,
        boss.x,
        boss.y
      ) <
      boss.radius +
        bullet.radius
    ) {
      let damage =
        10 +
        bullet.damage * 8;

      if (
        selectedShip === 5
      ) {
        damage *= 1.5;
      }

      boss.hp -= damage;

      bullets.splice(
        i,
        1
      );

      createExplosion(
        bullet.x,
        bullet.y,
        3,
        "#ff9900"
      );
    }
  }

  if (boss.hp <= 0) {
    defeatBoss();
  }
}

function drawBoss() {
  if (!boss) return;

  boss.draw();

  const w = min(
    330,
    width * 0.72
  );

  const x =
    width / 2 -
    w / 2;

  const y = 122;

  const ratio = constrain(
    boss.hp /
      boss.maxHp,
    0,
    1
  );

  rectMode(CORNER);

  noStroke();

  fill(
    255,
    255,
    255,
    45
  );

  rect(
    x,
    y,
    w,
    11,
    5
  );

  fill(
    boss.phase === 3
      ? color(255, 0, 60)
      : color(255, 70, 30)
  );

  rect(
    x,
    y,
    w * ratio,
    11,
    5
  );

  fill(255, 90, 70);

  textAlign(CENTER, BOTTOM);
  textStyle(BOLD);
  textSize(12);

  text(
    "METEOR DRAGON • PHASE " +
      boss.phase,
    width / 2,
    y - 8
  );
}

function defeatBoss() {
  if (!boss) return;

  createExplosion(
    boss.x,
    boss.y,
    120,
    "#ff6a00"
  );

  screenShake(
    25,
    800
  );

  const bonus =
    1000 +
    currentLevel * 120;

  score += bonus;
  levelScore += bonus;

  boss = null;

  enemyShots = [];

  stopBossMusic();

  playTone(
    100,
    1000,
    0.9,
    "sine",
    0.07
  );
}

// ================================================================
// BOSS MUSIC
// ================================================================

function startBossMusic() {
  stopBossMusic();

  if (
    !soundEnabled
  ) {
    return;
  }

  initAudio();

  if (!audioCtx) {
    return;
  }

  bossMusicStep = 0;

  const notes = [
    110,
    130,
    146,
    98,
    123,
    110,
    164,
    98
  ];

  bossMusicTimer =
    setInterval(
      function () {
        if (
          gameState !==
            "PLAYING" ||
          !boss ||
          !soundEnabled
        ) {
          return;
        }

        const note =
          notes[
            bossMusicStep %
              notes.length
          ];

        playTone(
          note,
          note * 0.82,
          0.18,
          bossMusicStep % 2 === 0
            ? "sawtooth"
            : "triangle",
          0.035
        );

        bossMusicStep++;
      },
      280
    );
}

function stopBossMusic() {
  if (
    bossMusicTimer !== null
  ) {
    clearInterval(
      bossMusicTimer
    );

    bossMusicTimer = null;
  }
}

// ================================================================
// LEVEL COMPLETION
// ================================================================

function checkLevelCompletion() {
  if (
    gameState !==
    "PLAYING"
  ) {
    return;
  }

  const elapsed =
    millis() -
    levelStartTime;

  const minimumTime =
    min(
      12000,
      levelDuration
    );

  const scoreDone =
    levelScore >=
    levelTargetScore;

  const timeReady =
    elapsed >=
    minimumTime;

  const bossDone =
    !isBossLevel() ||
    !boss;

  if (
    scoreDone &&
    timeReady &&
    bossDone
  ) {
    completeLevel();
  }

  // Prevent a normal stage from getting stuck forever.
  if (
    elapsed >=
      levelDuration &&
    scoreDone &&
    !isBossLevel()
  ) {
    completeLevel();
  }
}

function completeLevel() {
  if (
    gameState !==
    "PLAYING"
  ) {
    return;
  }

  stopBossMusic();

  if (
    currentLevel <
    TOTAL_LEVELS
  ) {
    if (
      currentLevel + 1 >
      unlockedLevel
    ) {
      unlockedLevel =
        currentLevel + 1;

      saveGame();
    }
  }

  levelCompleteAt =
    millis();

  createCelebration();

  playLevelUpSound();

  gameState = "LEVELUP";
}

// ================================================================
// LEVEL COMPLETE
// ================================================================

function drawLevelComplete() {
  // IMPORTANT:
  // Explicit CORNER mode fixes the old black-segment bug.

  push();

  rectMode(CORNER);

  fill(
    0,
    0,
    12,
    220
  );

  rect(
    0,
    0,
    width,
    height
  );

  textAlign(
    CENTER,
    CENTER
  );

  fill(255, 220, 40);
  textStyle(BOLD);
  textSize(
    min(
      35,
      width * 0.085
    )
  );

  text(
    currentLevel ===
      TOTAL_LEVELS
      ? "CAMPAIGN COMPLETE!"
      : "LEVEL " +
          currentLevel +
          " CLEARED!",
    width / 2,
    height * 0.34
  );

  fill(0, 225, 255);
  textSize(16);

  if (
    currentLevel <
    TOTAL_LEVELS
  ) {
    text(
      "NEW LEVEL UNLOCKED",
      width / 2,
      height * 0.45
    );

    fill(255);
    textSize(20);

    text(
      "LEVEL " +
        (currentLevel + 1),
      width / 2,
      height * 0.51
    );

    fill(255, 220, 50);
    textSize(15);

    text(
      LEVEL_TITLES[
        currentLevel
      ],
      width / 2,
      height * 0.57
    );
  } else {
    fill(255);
    textSize(18);

    text(
      "You conquered the Multiverse.",
      width / 2,
      height * 0.51
    );
  }

  fill(255);
  textStyle(NORMAL);
  textSize(12);

  text(
    "Score: " + score,
    width / 2,
    height * 0.65
  );

  pop();

  if (
    millis() -
      levelCompleteAt >
    3000
  ) {
    if (
      currentLevel <
      TOTAL_LEVELS
    ) {
      startLevel(
        currentLevel + 1
      );
    } else {
      gameState = "HOME";
    }
  }
}

// ================================================================
// GAME OVER
// ================================================================

function drawGameOver() {
  push();

  rectMode(CORNER);

  fill(
    0,
    0,
    0,
    215
  );

  rect(
    0,
    0,
    width,
    height
  );

  textAlign(
    CENTER,
    CENTER
  );

  fill(255, 70, 90);
  textStyle(BOLD);
  textSize(37);

  text(
    "MISSION LOST",
    width / 2,
    height * 0.30
  );

  fill(255);
  textSize(17);

  text(
    "LEVEL " +
      currentLevel,
    width / 2,
    height * 0.39
  );

  fill(255, 220, 50);
  textSize(14);

  text(
    LEVEL_TITLES[
      currentLevel - 1
    ],
    width / 2,
    height * 0.44
  );

  drawActionButton(
    "RETRY LEVEL " +
      currentLevel,
    height * 0.56
  );

  drawActionButton(
    "HOME",
    height * 0.66
  );

  pop();
}

// ================================================================
// PAUSE
// ================================================================

function pauseGame() {
  if (
    gameState ===
    "PLAYING"
  ) {
    pauseStarted =
      millis();

    stopBossMusic();

    gameState = "PAUSED";
  }
}

function resumeGame() {
  if (
    gameState !==
    "PAUSED"
  ) {
    return;
  }

  const pausedFor =
    millis() -
    pauseStarted;

  levelStartTime +=
    pausedFor;

  lastEnemySpawn +=
    pausedFor;

  lastPowerSpawn +=
    pausedFor;

  lastShot +=
    pausedFor;

  ship.invincibleUntil +=
    pausedFor;

  shieldUntil +=
    pausedFor;

  rapidUntil +=
    pausedFor;

  multiUntil +=
    pausedFor;

  cryoUntil +=
    pausedFor;

  celestialUntil +=
    pausedFor;

  if (boss) {
    boss.lastAttack +=
      pausedFor;
  }

  gameState = "PLAYING";

  if (boss) {
    startBossMusic();
  }
}

// ================================================================
// PAUSE OVERLAY
// ================================================================

function drawPauseOverlay() {
  push();

  rectMode(CORNER);

  fill(
    0,
    0,
    0,
    210
  );

  rect(
    0,
    0,
    width,
    height
  );

  textAlign(
    CENTER,
    CENTER
  );

  fill(255);
  textStyle(BOLD);
  textSize(38);

  text(
    "PAUSED",
    width / 2,
    height * 0.34
  );

  fill(0, 220, 255);
  textSize(14);

  text(
    "LEVEL " +
      currentLevel +
      " • " +
      LEVEL_TITLES[
        currentLevel - 1
      ],
    width / 2,
    height * 0.41
  );

  drawActionButton(
    "RESUME",
    height * 0.54
  );

  drawActionButton(
    "HOME",
    height * 0.64
  );

  pop();
}

function drawActionButton(
  label,
  y
) {
  const w = min(
    280,
    width * 0.74
  );

  rectMode(CENTER);

  stroke(0, 210, 255);
  strokeWeight(2);

  fill(5, 25, 45);

  rect(
    width / 2,
    y,
    w,
    50,
    13
  );

  noStroke();

  fill(255);

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(BOLD);
  textSize(15);

  text(
    label,
    width / 2,
    y
  );
}

// ================================================================
// FROZEN WORLD
// ================================================================

function drawFrozenWorld() {
  push();

  drawWorldObjects();

  pop();
}

function drawWorldObjects() {
  drawBullets();
  drawAliens();
  drawEnemyShots();
  drawPowerUps();

  if (boss) {
    drawBoss();
  }

  ship.draw();

  drawParticles();
}

// ================================================================
// GAME LOOP
// ================================================================

function runGame() {
  detectGameplayControls();
  movePlayer();

  updateBullets();
  updateAliens();
  updateEnemyShots();
  updatePowerUps();

  enemyAttackUpdate();

  startBossIfNeeded();

  if (boss) {
    updateBoss();
  }

  bulletAlienCollisions();
  playerAlienCollision();
  enemyShotCollision();
  powerCollision();

  spawnAliens();
  spawnPowerUps();

  updateParticles();

  checkLevelCompletion();

  // Screen shake only affects game world.
  push();

  if (
    millis() <
    shakeUntil
  ) {
    translate(
      random(
        -shakePower,
        shakePower
      ),
      random(
        -shakePower,
        shakePower
      )
    );
  }

  drawWorldObjects();

  pop();

  drawHUD();

  drawControls();
}

// ================================================================
// HUD
// ================================================================

function drawHUD() {
  push();

  textStyle(BOLD);

  // Score
  fill(255);
  textAlign(LEFT, TOP);
  textSize(15);

  text(
    "SCORE " + score,
    14,
    12
  );

  // Lives
  textAlign(RIGHT, TOP);

  fill(255);
  textSize(15);

  text(
    "LIVES " + lives,
    width - 14,
    12
  );

  // Level
  textAlign(
    CENTER,
    TOP
  );

  fill(0, 225, 255);
  textSize(15);

  text(
    "LEVEL " +
      currentLevel,
    width / 2,
    11
  );

  fill(255, 220, 50);
  textSize(11);

  text(
    LEVEL_TITLES[
      currentLevel - 1
    ],
    width / 2,
    32
  );

  // Progress bars in CENTER.
  const w = min(
    260,
    width * 0.62
  );

  const x =
    width / 2 -
    w / 2;

  const y = 55;

  const elapsed =
    millis() -
    levelStartTime;

  const timeRatio =
    constrain(
      elapsed /
        levelDuration,
      0,
      1
    );

  const scoreRatio =
    constrain(
      levelScore /
        levelTargetScore,
      0,
      1
    );

  // Survival
  textAlign(LEFT, CENTER);

  fill(190);
  textStyle(NORMAL);
  textSize(9);

  text(
    "SURVIVAL",
    x,
    y + 4
  );

  const barX =
    x + 58;

  const barW =
    w - 58;

  rectMode(CORNER);

  noStroke();

  fill(
    255,
    255,
    255,
    35
  );

  rect(
    barX,
    y,
    barW,
    7,
    4
  );

  fill(0, 220, 255);

  rect(
    barX,
    y,
    barW * timeRatio,
    7,
    4
  );

  // Mission
  fill(190);
  textSize(9);

  text(
    "MISSION",
    x,
    y + 18
  );

  fill(
    255,
    255,
    255,
    35
  );

  rect(
    barX,
    y + 14,
    barW,
    7,
    4
  );

  fill(255, 215, 40);

  rect(
    barX,
    y + 14,
    barW * scoreRatio,
    7,
    4
  );

  // Target information
  fill(170);
  textAlign(
    CENTER,
    CENTER
  );

  textSize(9);

  text(
    levelScore +
      " / " +
      levelTargetScore,
    width / 2,
    y + 34
  );

  // Controls at top.
  drawTopControl(
    pauseButton.x,
    pauseButton.y,
    "II"
  );

  drawTopControl(
    homeButton.x,
    homeButton.y,
    "H"
  );

  pop();
}

function drawTopControl(
  x,
  y,
  label
) {
  push();

  circleModeSafe();

  stroke(
    0,
    210,
    255,
    170
  );

  strokeWeight(2);

  fill(
    5,
    25,
    45,
    225
  );

  circle(
    x,
    y,
    42
  );

  noStroke();

  fill(255);

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(BOLD);
  textSize(14);

  text(
    label,
    x,
    y
  );

  pop();
}

function circleModeSafe() {
  // Kept intentionally empty.
  // Circle drawing uses p5's normal center mode.
}

// ================================================================
// GAMEPLAY CONTROLS
// ================================================================

function resetControls() {
  const moveX =
    controlsSwapped
      ? width - 90
      : 90;

  const fireX =
    controlsSwapped
      ? 90
      : width - 90;

  joystick.baseX =
    moveX;

  joystick.baseY =
    height - 100;

  joystick.knobX =
    moveX;

  joystick.knobY =
    height - 100;

  joystick.active = false;

  fireButton.x =
    fireX;

  fireButton.y =
    height - 100;

  pauseButton.x = 38;
  pauseButton.y = 92;

  homeButton.x =
    width - 38;

  homeButton.y = 92;
}

function detectGameplayControls() {
  if (
    gameState !==
    "PLAYING"
  ) {
    return;
  }

  let moveTouch = null;
  let firing = false;

  for (const t of touches) {
    if (
      dist(
        t.x,
        t.y,
        fireButton.x,
        fireButton.y
      ) <
      fireButton.radius + 20
    ) {
      firing = true;
      continue;
    }

    const movementSide =
      controlsSwapped
        ? t.x > width * 0.45
        : t.x < width * 0.55;

    if (
      movementSide &&
      t.y > height * 0.40
    ) {
      moveTouch = t;
    }
  }

  if (firing) {
    shoot();
  }

  if (moveTouch) {
    if (
      !joystick.active
    ) {
      joystick.active = true;

      joystick.baseX =
        moveTouch.x;

      joystick.baseY =
        moveTouch.y;
    }

    let dx =
      moveTouch.x -
      joystick.baseX;

    let dy =
      moveTouch.y -
      joystick.baseY;

    const d =
      sqrt(
        dx * dx +
        dy * dy
      );

    if (
      d >
      joystick.radius
    ) {
      const a =
        atan2(
          dy,
          dx
        );

      dx =
        cos(a) *
        joystick.radius;

      dy =
        sin(a) *
        joystick.radius;
    }

    joystick.knobX =
      joystick.baseX +
      dx;

    joystick.knobY =
      joystick.baseY +
      dy;
  } else {
    resetJoystick();
  }
}

function resetJoystick() {
  joystick.active = false;

  const x =
    controlsSwapped
      ? width - 90
      : 90;

  joystick.baseX = x;
  joystick.baseY =
    height - 100;

  joystick.knobX = x;
  joystick.knobY =
    height - 100;
}

function drawControls() {
  push();

  stroke(
    0,
    220,
    255,
    120
  );

  strokeWeight(2);

  fill(
    0,
    150,
    255,
    25
  );

  circle(
    joystick.baseX,
    joystick.baseY,
    joystick.radius * 2
  );

  fill(
    0,
    220,
    255,
    100
  );

  circle(
    joystick.knobX,
    joystick.knobY,
    52
  );

  stroke(
    255,
    70,
    90
  );

  fill(
    255,
    30,
    60,
    55
  );

  circle(
    fireButton.x,
    fireButton.y,
    fireButton.radius * 2
  );

  noStroke();

  fill(255);

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(BOLD);
  textSize(15);

  text(
    "FIRE",
    fireButton.x,
    fireButton.y
  );

  pop();
}

// ================================================================
// SCREEN SHAKE
// ================================================================

function screenShake(
  power,
  duration
) {
  shakePower =
    max(
      shakePower,
      power
    );

  shakeUntil =
    max(
      shakeUntil,
      millis() + duration
    );
}

// ================================================================
// PARTICLES
// ================================================================

class Particle {
  constructor(
    x,
    y,
    particleColor = null
  ) {
    this.x = x;
    this.y = y;

    const angle =
      random(TWO_PI);

    const speed =
      random(1, 7);

    this.vx =
      cos(angle) *
      speed;

    this.vy =
      sin(angle) *
      speed;

    this.life = 255;

    this.size =
      random(2, 7);

    this.color =
      particleColor;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.97;
    this.vy *= 0.97;

    this.life -= 7;
  }

  draw() {
    noStroke();

    if (this.color) {
      const c =
        color(this.color);

      fill(
        red(c),
        green(c),
        blue(c),
        this.life
      );
    } else {
      fill(
        255,
        140,
        40,
        this.life
      );
    }

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
  particleColor = null
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
        particleColor
      )
    );
  }
}

function updateParticles() {
  for (
    let i = particles.length - 1;
    i >= 0;
    i--
  ) {
    particles[i].update();

    if (
      particles[i].life <= 0
    ) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    p.draw();
  }
}

function createCelebration() {
  for (
    let i = 0;
    i < 100;
    i++
  ) {
    particles.push(
      new Particle(
        random(width),
        random(
          height * 0.25,
          height
        ),
        random([
          "#ffe600",
          "#00ddff",
          "#ff4dcc",
          "#ffffff"
        ])
      )
    );
  }
}

// ================================================================
// AUDIO
// ================================================================

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (
      AudioContextClass
    ) {
      audioCtx =
        new AudioContextClass();
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

function playTone(
  startFrequency,
  endFrequency,
  duration,
  oscillatorType = "sine",
  volume = 0.04
) {
  if (
    !soundEnabled ||
    !audioCtx
  ) {
    return;
  }

  try {
    const oscillator =
      audioCtx.createOscillator();

    const gain =
      audioCtx.createGain();

    oscillator.type =
      oscillatorType;

    oscillator.frequency.setValueAtTime(
      max(
        1,
        startFrequency
      ),
      audioCtx.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      max(
        1,
        endFrequency
      ),
      audioCtx.currentTime +
        duration
    );

    gain.gain.setValueAtTime(
      volume,
      audioCtx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime +
        duration
    );

    oscillator.connect(gain);
    gain.connect(
      audioCtx.destination
    );

    oscillator.start();

    oscillator.stop(
      audioCtx.currentTime +
        duration
    );
  } catch (err) {
    // Audio errors must never stop gameplay.
  }
}

function powerSound(type) {
  const sounds = {
    SHIELD: [180, 850, "sine"],
    MULTI: [400, 1100, "square"],
    RAPID: [600, 1500, "triangle"],
    CRYO: [1200, 240, "sine"],
    NOVA: [70, 1200, "sawtooth"],
    CELESTIAL: [300, 1800, "sine"]
  };

  const sound =
    sounds[type];

  if (!sound) return;

  playTone(
    sound[0],
    sound[1],
    0.4,
    sound[2],
    0.045
  );
}

function explosionSound() {
  playTone(
    150,
    45,
    0.16,
    "sawtooth",
    0.035
  );
}

function playLevelUpSound() {
  playTone(
    420,
    620,
    0.18,
    "sine",
    0.045
  );

  setTimeout(
    function () {
      playTone(
        620,
        900,
        0.18,
        "sine",
        0.045
      );
    },
    180
  );

  setTimeout(
    function () {
      playTone(
        900,
        1350,
        0.28,
        "sine",
        0.05
      );
    },
    360
  );
}

// ================================================================
// TAP ROUTER
// ================================================================

function touchStarted() {
  initAudio();

  const x =
    touches.length > 0
      ? touches[0].x
      : mouseX;

  const y =
    touches.length > 0
      ? touches[0].y
      : mouseY;

  handleTap(
    x,
    y
  );

  return false;
}

function mousePressed() {
  initAudio();

  handleTap(
    mouseX,
    mouseY
  );

  return false;
}

function handleTap(
  x,
  y
) {
  // HOME
  if (
    gameState ===
    "HOME"
  ) {
    if (
      hitY(
        y,
        height * 0.35
      )
    ) {
      gameState = "LEVELS";
      return;
    }

    if (
      hitY(
        y,
        height * 0.45
      )
    ) {
      archiveScroll = 0;
      archiveTargetScroll = 0;
      gameState = "ARCHIVE";
      return;
    }

    if (
      hitY(
        y,
        height * 0.55
      )
    ) {
      gameState = "ABOUT";
      return;
    }

    if (
      hitY(
        y,
        height * 0.65
      )
    ) {
      gameState = "SETTINGS";
      return;
    }

    if (
      hitY(
        y,
        height * 0.75
      )
    ) {
      selectedRating = 0;
      gameState = "RATING";
      return;
    }

    return;
  }

  // LEVELS
  if (
    gameState ===
    "LEVELS"
  ) {
    if (
      y >
        height - 90
    ) {
      gameState = "HOME";
      return;
    }

    const cols = 4;
    const gap = 10;

    const size = min(
      65,
      (width - 48) / cols
    );

    const totalWidth =
      cols * size +
      (cols - 1) * gap;

    const startX =
      width / 2 -
      totalWidth / 2 +
      size / 2;

    const startY = 165;

    for (
      let i = 1;
      i <= TOTAL_LEVELS;
      i++
    ) {
      const col =
        (i - 1) % cols;

      const row =
        floor(
          (i - 1) / cols
        );

      const bx =
        startX +
        col *
          (size + gap);

      const by =
        startY +
        row *
          (size + 17);

      if (
        abs(x - bx) <
          size / 2 &&
        abs(y - by) <
          size / 2
      ) {
        if (
          i <=
          unlockedLevel
        ) {
          startLevel(i);
        } else {
          playTone(
            140,
            80,
            0.12,
            "square",
            0.025
          );
        }

        return;
      }
    }

    return;
  }

  // ARCHIVE
  if (
    gameState ===
    "ARCHIVE"
  ) {
    if (
      y >
        height - 90
    ) {
      gameState = "HOME";
      return;
    }

    // Do not select while dragging.
    if (
      archiveMoved
    ) {
      return;
    }

    const cardW = min(
      330,
      width * 0.84
    );

    const cardH =
      archiveCardHeight();

    const contentY =
      y +
      archiveScroll -
      100;

    const index =
      floor(
        (contentY - 75) /
          cardH
      );

    if (
      index >= 0 &&
      index < SHIPS.length
    ) {
      const cardCenterY =
        100 -
        archiveScroll +
        75 +
        index * cardH;

      if (
        abs(
          y -
            cardCenterY
        ) <
        (cardH - 10) / 2 &&
        abs(
          x -
            width / 2
        ) <
        cardW / 2
      ) {
        if (
          unlockedLevel >=
          SHIPS[index].unlock
        ) {
          selectedShip =
            index;

          saveGame();

          playTone(
            300,
            900,
            0.22,
            "sine",
            0.035
          );
        }

        return;
      }
    }

    return;
  }

  // ABOUT
  if (
    gameState ===
    "ABOUT"
  ) {
    if (
      y >
        height - 90
    ) {
      gameState = "HOME";
      return;
    }

    return;
  }

  // SETTINGS
  if (
    gameState ===
    "SETTINGS"
  ) {
    if (
      y >
        height - 90
    ) {
      gameState = "HOME";
      return;
    }

    if (
      abs(
        y -
          height * 0.36
      ) < 45
    ) {
      controlsSwapped =
        !controlsSwapped;

      resetControls();
      saveGame();

      playTone(
        300,
        700,
        0.18,
        "sine",
        0.035
      );

      return;
    }

    if (
      abs(
        y -
          height * 0.52
      ) < 45
    ) {
      soundEnabled =
        !soundEnabled;

      saveGame();

      if (
        soundEnabled
      ) {
        initAudio();

        playTone(
          400,
          800,
          0.2,
          "sine",
          0.04
        );
      } else {
        stopBossMusic();
      }

      return;
    }

    return;
  }

  // RATING
  if (
    gameState ===
    "RATING"
  ) {
    const gap = min(
      48,
      width * 0.12
    );

    for (
      let i = 1;
      i <= 5;
      i++
    ) {
      const sx =
        width / 2 +
        (i - 3) * gap;

      if (
        dist(
          x,
          y,
          sx,
          height * 0.48
        ) <
        28
      ) {
        selectedRating =
          i;

        return;
      }
    }

    if (
      abs(
        y -
          height * 0.67
      ) < 30
    ) {
      if (
        selectedRating >
        0
      ) {
        saveRating(
          selectedRating
        );

        gameState = "HOME";

        playTone(
          500,
          1000,
          0.25,
          "sine",
          0.04
        );
      }

      return;
    }

    if (
      abs(
        y -
          height * 0.76
      ) < 30
    ) {
      gameState = "HOME";
      return;
    }

    return;
  }

  // PLAYING
  if (
    gameState ===
    "PLAYING"
  ) {
    if (
      dist(
        x,
        y,
        pauseButton.x,
        pauseButton.y
      ) < 32
    ) {
      pauseGame();
      return;
    }

    if (
      dist(
        x,
        y,
        homeButton.x,
        homeButton.y
      ) < 32
    ) {
      stopBossMusic();

      gameState =
        "HOME";

      resetJoystick();

      return;
    }

    if (
      dist(
        x,
        y,
        fireButton.x,
        fireButton.y
      ) <
      fireButton.radius +
        20
    ) {
      shoot();
      return;
    }

    return;
  }

  // PAUSED
  if (
    gameState ===
    "PAUSED"
  ) {
    if (
      abs(
        y -
          height * 0.54
      ) < 30
    ) {
      resumeGame();
      return;
    }

    if (
      abs(
        y -
          height * 0.64
      ) < 30
    ) {
      stopBossMusic();

      gameState =
        "HOME";

      return;
    }

    return;
  }

  // GAME OVER
  if (
    gameState ===
    "GAMEOVER"
  ) {
    if (
      abs(
        y -
          height * 0.56
      ) < 30
    ) {
      startLevel(
        currentLevel
      );

      return;
    }

    if (
      abs(
        y -
          height * 0.66
      ) < 30
    ) {
      gameState =
        "HOME";

      return;
    }
  }
}

function hitY(
  y,
  target
) {
  return (
    abs(
      y - target
    ) < 30
  );
}

// ================================================================
// ARCHIVE TOUCH SCROLL
// ================================================================

function touchMoved() {
  if (
    gameState !==
    "ARCHIVE"
  ) {
    return false;
  }

  if (
    touches.length === 0
  ) {
    return false;
  }

  const currentY =
    touches[0].y;

  if (
    !archiveDragging
  ) {
    archiveDragging =
      true;

    archiveStartY =
      currentY;

    archiveStartScroll =
      archiveScroll;

    archiveMoved = false;
  }

  const delta =
    archiveStartY -
    currentY;

  if (
    abs(delta) > 8
  ) {
    archiveMoved =
      true;
  }

  archiveTargetScroll =
    constrain(
      archiveStartScroll +
        delta,
      0,
      archiveMaxScroll()
    );

  archiveScroll =
    lerp(
      archiveScroll,
      archiveTargetScroll,
      0.35
    );

  return false;
}

function touchEnded() {
  if (
    gameState ===
    "ARCHIVE"
  ) {
    archiveDragging =
      false;

    archiveScroll =
      constrain(
        archiveScroll,
        0,
        archiveMaxScroll()
      );

    archiveTargetScroll =
      archiveScroll;

    setTimeout(
      function () {
        archiveMoved =
          false;
      },
      50
    );
  }

  return false;
}

// Mouse archive dragging.
function mouseDragged() {
  if (
    gameState !==
    "ARCHIVE"
  ) {
    return false;
  }

  if (
    !archiveDragging
  ) {
    archiveDragging =
      true;

    archiveStartY =
      mouseY;

    archiveStartScroll =
      archiveScroll;

    archiveMoved = false;
  }

  const delta =
    archiveStartY -
    mouseY;

  if (
    abs(delta) > 8
  ) {
    archiveMoved =
      true;
  }

  archiveTargetScroll =
    constrain(
      archiveStartScroll +
        delta,
      0,
      archiveMaxScroll()
    );

  archiveScroll =
    archiveTargetScroll;

  return false;
}

function mouseReleased() {
  if (
    gameState ===
    "ARCHIVE"
  ) {
    archiveDragging =
      false;

    setTimeout(
      function () {
        archiveMoved =
          false;
      },
      50
    );
  }

  return false;
}

// ================================================================
// RATING SAVE
// ================================================================

function saveRating(rating) {
  try {
    localStorage.setItem(
      "spaceDodgerRating",
      String(rating)
    );
  } catch (err) {
    // Ignore storage errors.
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
  resetControls();

  archiveScroll =
    constrain(
      archiveScroll,
      0,
      archiveMaxScroll()
    );

  archiveTargetScroll =
    archiveScroll;

  if (ship) {
    ship.x =
      constrain(
        ship.x,
        20,
        width - 20
      );

    ship.y =
      constrain(
        ship.y,
        120,
        height - 130
      );
  }
}

// ================================================================
// END OF SPACE DODGER v4
// ================================================================
