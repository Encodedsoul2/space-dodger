// ================================================================
// SPACE DODGER — GALACTIC CAMPAIGN
// COMPLETE MOBILE-FIRST REBUILD
// p5.js single-file sketch.js
// ================================================================

// ================================================================
// GAME STATE
// ================================================================

let sdState = "HOME";
// HOME, LEVELS, ARCHIVE, ABOUT, SETTINGS,
// PLAYING, PAUSED, GAMEOVER, LEVELUP, RATING

let sdShip = null;

let sdBullets = [];
let sdAliens = [];
let sdParticles = [];
let sdPowerUps = [];
let sdEnemyShots = [];
let sdStars = [];

let sdBoss = null;
let sdPortal = null;

let sdCurrentLevel = 1;
let sdUnlockedLevel = 1;
let sdSelectedShip = 0;

let sdScore = 0;
let sdLevelScore = 0;
let sdLives = 3;

let sdLevelStart = 0;
let sdLevelDuration = 45000;
let sdTargetScore = 500;

let sdLastAlien = 0;
let sdLastPower = 0;
let sdLastShot = 0;

let sdLevelUpStart = 0;

let sdGalaxy = 0;
let sdGalaxyEnd = 0;

let sdBossActive = false;
let sdBossDefeated = false;

let sdSound = true;
let sdControlsSwapped = false;

let sdAudio = null;
let sdBossMusicTimer = null;
let sdBossMusicOn = false;

let sdShake = 0;

let sdRating = 0;

let sdArchiveScroll = 0;
let sdArchiveTarget = 0;
let sdArchiveDragging = false;
let sdArchiveLastY = 0;

let sdTouchStartY = 0;
let sdTouchStartX = 0;

let sdPauseStarted = 0;

let sdSafeBottom = 110;

let sdJoystick = {
  active: false,
  id: null,
  baseX: 90,
  baseY: 0,
  knobX: 90,
  knobY: 0,
  radius: 58
};

let sdFire = {
  x: 0,
  y: 0,
  radius: 52
};

let sdPowerButton = {
  x: 0,
  y: 0,
  radius: 42
};

let sdPauseButton = {
  x: 38,
  y: 60,
  radius: 23
};

let sdHomeButton = {
  x: 0,
  y: 60,
  radius: 23
};

let sdPowerReadyAt = 0;


// ================================================================
// CAMPAIGN
// ================================================================

const SD_TOTAL_LEVELS = 20;

const SD_LEVEL_TITLES = [
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

function sdDuration(level) {
  return 45000 + (level - 1) * 6000;
}

function sdTarget(level) {
  return floor(
    450 +
    (level - 1) * 180 +
    pow(level, 1.35) * 30
  );
}

function sdDifficulty(level) {
  return 1 + (level - 1) * 0.055;
}


// ================================================================
// SHIP ARCHIVE
// ================================================================

const SD_SHIPS = [

  {
    name: "NOVA SCOUT",
    unlock: 1,
    body: "#10204a",
    edge: "#00eaff",
    core: "#ffffff",
    power: "BALANCED",
    desc: "Balanced weapons and movement."
  },

  {
    name: "SOLAR FANG",
    unlock: 3,
    body: "#5b2410",
    edge: "#ff8a00",
    core: "#ffe066",
    power: "BURN SHOT",
    desc: "Shots ignite aliens for extra damage."
  },

  {
    name: "NEBULA WING",
    unlock: 5,
    body: "#32105b",
    edge: "#c66cff",
    core: "#ffffff",
    power: "GRAVITY PULSE",
    desc: "Nearby aliens are slowed."
  },

  {
    name: "CRYO HAWK",
    unlock: 7,
    body: "#103c60",
    edge: "#7ee8ff",
    core: "#dfffff",
    power: "TIME FREEZE",
    desc: "Enemies move much slower."
  },

  {
    name: "VOID SPEAR",
    unlock: 9,
    body: "#251033",
    edge: "#ff4ddd",
    core: "#ffffff",
    power: "PHASE DODGE",
    desc: "Chance to phase through attacks."
  },

  {
    name: "DRAGON BANE",
    unlock: 10,
    body: "#5c0715",
    edge: "#ff1744",
    core: "#ffe600",
    power: "DRAGON RAGE",
    desc: "Extra damage against the boss."
  },

  {
    name: "QUANTUM EDGE",
    unlock: 12,
    body: "#063f45",
    edge: "#00ffd5",
    core: "#ffffff",
    power: "QUANTUM DASH",
    desc: "Faster movement and rapid fire."
  },

  {
    name: "STAR PALADIN",
    unlock: 15,
    body: "#55490a",
    edge: "#fff176",
    core: "#ffffff",
    power: "HOLY SHIELD",
    desc: "Automatic protective shield."
  },

  {
    name: "GALACTIC TITAN",
    unlock: 18,
    body: "#431c58",
    edge: "#ff78ff",
    core: "#ffffaa",
    power: "TITAN CORE",
    desc: "Huge shots and increased damage."
  },

  {
    name: "MULTIVERSE KING",
    unlock: 20,
    body: "#5a3f00",
    edge: "#ffd700",
    core: "#ffffff",
    power: "REALITY BREAK",
    desc: "Extreme firepower and shield."
  }

];


// ================================================================
// POWER UPS
// ================================================================

const SD_POWER_TYPES = [
  "MULTI",
  "SHIELD",
  "TWIN",
  "TRINITY",
  "NOVA",
  "PHANTOM",
  "BERSERKER",
  "CRYO",
  "CELESTIAL"
];

let sdPowerEnds = {
  MULTI: 0,
  SHIELD: 0,
  TWIN: 0,
  TRINITY: 0,
  PHANTOM: 0,
  BERSERKER: 0,
  CRYO: 0,
  CELESTIAL: 0
};


// ================================================================
// SETUP
// ================================================================

function setup() {

  createCanvas(windowWidth, windowHeight);

  textFont("Arial");

  sdLoad();

  sdCreateStars();

  sdUpdateSafeArea();

  sdShip = new SDShip();

  sdResetControls();
}


// ================================================================
// SAVE / LOAD
// ================================================================

function sdLoad() {

  try {

    let raw = localStorage.getItem(
      "spaceDodgerSaveV4"
    );

    if (!raw) return;

    let d = JSON.parse(raw);

    sdUnlockedLevel = constrain(
      int(d.unlockedLevel || 1),
      1,
      SD_TOTAL_LEVELS
    );

    sdSelectedShip = constrain(
      int(d.selectedShip || 0),
      0,
      SD_SHIPS.length - 1
    );

    sdSound = d.sound !== false;

    sdControlsSwapped =
      d.controlsSwapped === true;

  } catch (e) {

    sdUnlockedLevel = 1;
    sdSelectedShip = 0;
  }
}


function sdSave() {

  try {

    localStorage.setItem(
      "spaceDodgerSaveV4",
      JSON.stringify({
        unlockedLevel: sdUnlockedLevel,
        selectedShip: sdSelectedShip,
        sound: sdSound,
        controlsSwapped: sdControlsSwapped
      })
    );

  } catch (e) {}
}


// ================================================================
// SAFE AREA
// ================================================================

function sdUpdateSafeArea() {

  /*
    The bottom of a mobile WebView may be partially occupied
    by Android gesture/navigation UI.

    Keep all interactive controls safely above that area.
  */

  sdSafeBottom = constrain(
    max(105, height * 0.13),
    105,
    145
  );

  sdJoystick.baseY =
    height - sdSafeBottom;

  sdFire.y =
    height - sdSafeBottom;

  sdPowerButton.y =
    height - sdSafeBottom;

  sdHomeButton.y =
    height - 52;

  sdPauseButton.y = 52;
}


// ================================================================
// DRAW
// ================================================================

function draw() {

  sdDrawBackground();

  sdDrawStars();

  if (sdState === "HOME") {
    sdDrawHome();
    return;
  }

  if (sdState === "LEVELS") {
    sdDrawLevels();
    return;
  }

  if (sdState === "ARCHIVE") {
    sdDrawArchive();
    return;
  }

  if (sdState === "ABOUT") {
    sdDrawAbout();
    return;
  }

  if (sdState === "SETTINGS") {
    sdDrawSettings();
    return;
  }

  if (sdState === "RATING") {
    sdDrawRating();
    return;
  }

  if (sdState === "PLAYING") {
    sdRunGame();
    return;
  }

  if (sdState === "PAUSED") {
    sdDrawFrozen();
    sdDrawPause();
    return;
  }

  if (sdState === "GAMEOVER") {
    sdDrawFrozen();
    sdDrawGameOver();
    return;
  }

  if (sdState === "LEVELUP") {
    sdUpdateParticles();
    sdDrawLevelUp();
  }
}


// ================================================================
// BACKGROUND
// ================================================================

function sdDrawBackground() {

  if (sdBossActive) {

    let pulse =
      sin(frameCount * 0.05) * 5;

    background(
      18 + pulse,
      2,
      10
    );

    return;
  }

  if (sdGalaxy === 1) {
    background(25, 3, 18);
  }

  else if (sdGalaxy === 2) {
    background(3, 10, 30);
  }

  else if (sdGalaxy === 3) {
    background(0, 22, 15);
  }

  else {
    background(2, 5, 17);
  }
}


// ================================================================
// STARS
// ================================================================

function sdCreateStars() {

  sdStars = [];

  for (let i = 0; i < 150; i++) {

    sdStars.push({
      x: random(width),
      y: random(height),
      s: random(1, 3),
      speed: random(0.2, 1.1),
      phase: random(TWO_PI)
    });
  }
}


function sdDrawStars() {

  noStroke();

  for (let s of sdStars) {

    s.phase += 0.025;

    if (sdState === "PLAYING") {
      s.y += s.speed;
    }

    if (s.y > height) {
      s.y = 0;
      s.x = random(width);
    }

    let alpha =
      130 +
      sin(s.phase) * 90;

    if (sdBossActive) {

      fill(
        255,
        60,
        60,
        alpha
      );

    }

    else if (sdGalaxy === 1) {

      fill(
        255,
        80,
        120,
        alpha
      );

    }

    else if (sdGalaxy === 2) {

      fill(
        80,
        190,
        255,
        alpha
      );

    }

    else if (sdGalaxy === 3) {

      fill(
        80,
        255,
        170,
        alpha
      );

    }

    else {

      fill(
        255,
        255,
        255,
        alpha
      );
    }

    circle(
      s.x,
      s.y,
      s.s
    );
  }
}


// ================================================================
// HOME
// ================================================================

function sdDrawHome() {

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);

  textStyle(BOLD);

  textSize(
    min(44, width * 0.105)
  );

  text(
    "SPACE DODGER",
    width / 2,
    height * 0.15
  );

  fill(255, 220, 60);

  textSize(15);

  text(
    "GALACTIC CAMPAIGN",
    width / 2,
    height * 0.205
  );

  sdMenuButton(
    "▶  PLAY",
    height * 0.34
  );

  sdMenuButton(
    "🚀  ARCHIVE",
    height * 0.45
  );

  sdMenuButton(
    "ℹ  ABOUT",
    height * 0.56
  );

  sdMenuButton(
    "⚙  SETTINGS",
    height * 0.67
  );

  sdMenuButton(
    "★  RATE US",
    height * 0.78
  );

  fill(180);

  textStyle(NORMAL);

  textSize(13);

  text(
    "Highest Level Unlocked: " +
    sdUnlockedLevel +
    " / 20",
    width / 2,
    height - sdSafeBottom + 25
  );
}


function sdMenuButton(label, y) {

  let w =
    min(310, width * 0.78);

  rectMode(CENTER);

  stroke(0, 210, 255, 180);

  strokeWeight(2);

  fill(5, 20, 40, 230);

  rect(
    width / 2,
    y,
    w,
    54,
    14
  );

  noStroke();

  fill(255);

  textStyle(BOLD);

  textSize(16);

  text(
    label,
    width / 2,
    y
  );
}


// ================================================================
// LEVELS
// ================================================================

function sdDrawLevels() {

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);

  textStyle(BOLD);

  textSize(28);

  text(
    "SELECT LEVEL",
    width / 2,
    55
  );

  fill(255, 220, 60);

  textSize(13);

  text(
    "CURRENT RANK",
    width / 2,
    88
  );

  fill(255);

  textSize(17);

  text(
    "★ " +
    SD_LEVEL_TITLES[
      sdUnlockedLevel - 1
    ] +
    " ★",
    width / 2,
    112
  );

  let cols = 4;
  let gap = 10;

  let size =
    min(
      67,
      (width - 50) / cols
    );

  let startY = 170;

  for (let i = 1; i <= 20; i++) {

    let col = (i - 1) % cols;
    let row = floor((i - 1) / cols);

    let total =
      cols * size +
      (cols - 1) * gap;

    let startX =
      width / 2 -
      total / 2 +
      size / 2;

    let x =
      startX +
      col * (size + gap);

    let y =
      startY +
      row * (size + 17);

    let open =
      i <= sdUnlockedLevel;

    rectMode(CENTER);

    stroke(
      open
        ? color(0, 220, 255)
        : color(70)
    );

    strokeWeight(2);

    fill(
      open
        ? color(5, 35, 55)
        : color(18, 18, 24)
    );

    rect(
      x,
      y,
      size,
      size,
      12
    );

    noStroke();

    fill(
      open
        ? 255
        : 100
    );

    textStyle(BOLD);

    textSize(18);

    text(
      open ? i : "🔒",
      x,
      y - 4
    );

    if (open) {

      fill(150, 225, 255);

      textSize(9);

      text(
        i === 5 ||
        i === 10 ||
        i === 15 ||
        i === 20
          ? "BOSS"
          : "LEVEL",
        x,
        y + 20
      );
    }
  }

  sdHomeBottomButton();
}


// ================================================================
// ARCHIVE
// ================================================================

function sdDrawArchive() {

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);

  textStyle(BOLD);

  textSize(27);

  text(
    "SPACE SHIP ARCHIVE",
    width / 2,
    38
  );

  fill(190);

  textStyle(NORMAL);

  textSize(13);

  text(
    "Swipe up / down to browse ships",
    width / 2,
    68
  );

  let cardW =
    min(350, width * 0.88);

  let cardH = 142;

  let gap = 16;

  let top = 105;

  let contentHeight =
    SD_SHIPS.length *
    (cardH + gap);

  let viewportTop = 90;

  let viewportBottom =
    height - sdSafeBottom - 35;

  let viewportHeight =
    viewportBottom -
    viewportTop;

  let maxScroll =
    max(
      0,
      contentHeight -
      viewportHeight
    );

  sdArchiveTarget =
    constrain(
      sdArchiveTarget,
      0,
      maxScroll
    );

  sdArchiveScroll = lerp(
    sdArchiveScroll,
    sdArchiveTarget,
    0.18
  );

  push();

  drawingContext.save();

  drawingContext.beginPath();

  drawingContext.rect(
    0,
    viewportTop,
    width,
    viewportHeight
  );

  drawingContext.clip();

  for (
    let i = 0;
    i < SD_SHIPS.length;
    i++
  ) {

    let y =
      top +
      i * (cardH + gap) -
      sdArchiveScroll;

    let unlocked =
      sdUnlockedLevel >=
      SD_SHIPS[i].unlock;

    let selected =
      sdSelectedShip === i;

    rectMode(CENTER);

    stroke(
      selected
        ? color(255, 220, 40)
        : unlocked
          ? color(SD_SHIPS[i].edge)
          : color(70)
    );

    strokeWeight(
      selected ? 3 : 2
    );

    fill(5, 15, 30);

    rect(
      width / 2,
      y,
      cardW,
      cardH,
      15
    );

    if (unlocked) {

      sdDrawArchiveShip(
        width / 2 - cardW * 0.30,
        y - 3,
        i,
        1.0
      );

      noStroke();

      textAlign(LEFT, CENTER);

      fill(255);

      textStyle(BOLD);

      textSize(14);

      text(
        SD_SHIPS[i].name,
        width / 2 - cardW * 0.05,
        y - 42
      );

      fill(255, 220, 60);

      textSize(12);

      text(
        "⚡ " +
        SD_SHIPS[i].power,
        width / 2 - cardW * 0.05,
        y - 15
      );

      fill(180);

      textStyle(NORMAL);

      textSize(10);

      text(
        SD_SHIPS[i].desc,
        width / 2 - cardW * 0.05,
        y + 10
      );

      fill(
        selected
          ? color(255, 220, 40)
          : color(100, 220, 255)
      );

      textStyle(BOLD);

      textSize(11);

      text(
        selected
          ? "SELECTED"
          : "TAP TO SELECT",
        width / 2 - cardW * 0.05,
        y + 39
      );

    } else {

      sdDrawArchiveShip(
        width / 2,
        y - 5,
        i,
        0.72
      );

      noStroke();

      fill(160);

      textAlign(CENTER, CENTER);

      textStyle(BOLD);

      textSize(12);

      text(
        "🔒  UNLOCK AT LEVEL " +
        SD_SHIPS[i].unlock,
        width / 2,
        y + 45
      );
    }
  }

  drawingContext.restore();

  pop();

  // Scroll indicators

  if (maxScroll > 0) {

    let barH =
      max(
        35,
        viewportHeight *
        (viewportHeight /
          contentHeight)
      );

    let barX = width - 12;

    let barTravel =
      viewportHeight - barH;

    let barY =
      viewportTop +
      barTravel *
      (sdArchiveScroll /
        maxScroll);

    noStroke();

    fill(0, 220, 255, 100);

    rect(
      barX,
      barY,
      5,
      barH,
      3
    );
  }

  sdHomeBottomButton();
}


function sdDrawArchiveShip(
  x,
  y,
  index,
  scaleValue
) {

  let d = SD_SHIPS[index];

  push();

  translate(x, y);

  scale(scaleValue);

  stroke(d.edge);

  strokeWeight(3);

  fill(d.body);

  beginShape();

  vertex(0, -42);
  vertex(-17, -8);
  vertex(-42, 25);
  vertex(-12, 18);
  vertex(0, 32);
  vertex(12, 18);
  vertex(42, 25);
  vertex(17, -8);

  endShape(CLOSE);

  noStroke();

  fill(d.core);

  ellipse(
    0,
    -5,
    13,
    20
  );

  fill(d.edge);

  triangle(
    -7,
    24,
    7,
    24,
    0,
    39
  );

  pop();
}


// ================================================================
// ABOUT
// ================================================================

function sdDrawAbout() {

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);

  textStyle(BOLD);

  textSize(31);

  text(
    "ABOUT",
    width / 2,
    height * 0.20
  );

  fill(255);

  textStyle(NORMAL);

  textSize(17);

  text(
    "Developed by",
    width / 2,
    height * 0.38
  );

  fill(255, 220, 60);

  textStyle(BOLD);

  textSize(
    min(24, width * 0.06)
  );

  text(
    "Aazad S Rana",
    width / 2,
    height * 0.46
  );

  fill(180);

  textStyle(NORMAL);

  textSize(14);

  text(
    "Space Dodger • Galactic Campaign",
    width / 2,
    height * 0.55
  );

  fill(150);

  textSize(12);

  text(
    "20 levels • Alien invasion • Boss battles",
    width / 2,
    height * 0.61
  );

  sdHomeBottomButton();
}


// ================================================================
// SETTINGS
// ================================================================

function sdDrawSettings() {

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);

  textStyle(BOLD);

  textSize(30);

  text(
    "SETTINGS",
    width / 2,
    height * 0.16
  );

  sdSettingBox(
    "CONTROL LAYOUT",
    sdControlsSwapped
      ? "FIRE LEFT  •  MOVE RIGHT"
      : "MOVE LEFT  •  FIRE RIGHT",
    height * 0.34
  );

  sdSettingBox(
    "SOUND",
    sdSound ? "ON" : "OFF",
    height * 0.50
  );

  fill(170);

  textStyle(NORMAL);

  textSize(13);

  text(
    "Tap an option to change it",
    width / 2,
    height * 0.63
  );

  sdHomeBottomButton();
}


function sdSettingBox(
  title,
  value,
  y
) {

  let w =
    min(330, width * 0.84);

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

  fill(180);

  textStyle(BOLD);

  textSize(13);

  text(
    title,
    width / 2,
    y - 18
  );

  fill(255);

  textSize(16);

  text(
    value,
    width / 2,
    y + 15
  );
}


// ================================================================
// RATING
// ================================================================

function sdDrawRating() {

  textAlign(CENTER, CENTER);

  fill(0, 225, 255);

  textStyle(BOLD);

  textSize(29);

  text(
    "RATE SPACE DODGER",
    width / 2,
    height * 0.25
  );

  fill(180);

  textStyle(NORMAL);

  textSize(14);

  text(
    "How was your experience?",
    width / 2,
    height * 0.33
  );

  let starGap =
    min(55, width * 0.13);

  let total =
    starGap * 4;

  for (let i = 1; i <= 5; i++) {

    let x =
      width / 2 -
      total / 2 +
      (i - 1) * starGap;

    fill(
      i <= sdRating
        ? color(255, 215, 40)
        : color(70)
    );

    textSize(42);

    text(
      "★",
      x,
      height * 0.46
    );
  }

  fill(255);

  textStyle(BOLD);

  textSize(18);

  text(
    sdRating +
    " / 5",
    width / 2,
    height * 0.56
  );

  sdActionButton(
    "SUBMIT",
    height * 0.66,
    250
  );

  sdActionButton(
    "CANCEL",
    height * 0.76,
    250
  );
}


// ================================================================
// START LEVEL
// ================================================================

function sdStartLevel(level) {

  sdCurrentLevel =
    constrain(
      level,
      1,
      SD_TOTAL_LEVELS
    );

  sdScore = 0;
  sdLevelScore = 0;
  sdLives = 3;

  sdLevelDuration =
    sdDuration(
      sdCurrentLevel
    );

  sdTargetScore =
    sdTarget(
      sdCurrentLevel
    );

  sdLevelStart =
    millis();

  sdLastAlien =
    millis();

  sdLastPower =
    millis();

  sdLastShot = 0;

  sdAliens = [];
  sdBullets = [];
  sdParticles = [];
  sdPowerUps = [];
  sdEnemyShots = [];

  sdBoss = null;
  sdBossActive = false;
  sdBossDefeated = false;

  sdPortal = null;

  sdGalaxy = 0;
  sdGalaxyEnd = 0;

  sdShake = 0;

  sdResetPowers();

  sdShip = new SDShip();

  sdResetControls();

  sdPowerReadyAt = millis() + 3000;

  sdState = "PLAYING";

  sdStopBossMusic();

  sdTone(
    350,
    700,
    0.25,
    "sine",
    0.04
  );
}


// ================================================================
// PLAYER SHIP
// ================================================================

class SDShip {

  constructor() {

    this.x = width / 2;
    this.y = height * 0.67;

    this.angle = -HALF_PI;

    this.radius = 18;

    this.invincibleUntil = 0;
  }

  update() {

    if (this.x < -45)
      this.x = width + 45;

    if (this.x > width + 45)
      this.x = -45;

    if (this.y < -45)
      this.y = height + 45;

    if (this.y > height + 45)
      this.y = -45;
  }

  display() {

    if (
      millis() <
      this.invincibleUntil &&
      floor(millis() / 100) % 2 === 0
    ) {
      return;
    }

    let d =
      SD_SHIPS[
        sdSelectedShip
      ];

    let scaleValue = 1;

    if (
      sdSelectedShip === 5
    ) {
      scaleValue = 1.12;
    }

    if (
      sdSelectedShip === 8
    ) {
      scaleValue = 1.25;
    }

    if (
      sdSelectedShip === 9
    ) {
      scaleValue = 1.3;
    }

    let power =
      d.power;

    let edge = d.edge;
    let body = d.body;
    let core = d.core;

    if (
      millis() <
      sdPowerEnds.BERSERKER
    ) {
      edge = "#ff1744";
      body = "#5b0715";
    }

    if (
      millis() <
      sdPowerEnds.CRYO
    ) {
      edge = "#8cecff";
      body = "#123b61";
    }

    push();

    translate(
      this.x,
      this.y
    );

    rotate(
      this.angle + HALF_PI
    );

    scale(scaleValue);

    drawingContext.shadowBlur = 18;
    drawingContext.shadowColor = edge;

    stroke(edge);

    strokeWeight(2.5);

    fill(body);

    beginShape();

    vertex(0, -34);
    vertex(-13, -8);
    vertex(-32, 20);
    vertex(-9, 13);
    vertex(0, 23);
    vertex(9, 13);
    vertex(32, 20);
    vertex(13, -8);

    endShape(CLOSE);

    noStroke();

    fill(core);

    ellipse(
      0,
      -5,
      10,
      17
    );

    fill(edge);

    triangle(
      -5,
      17,
      5,
      17,
      0,
      31
    );

    drawingContext.shadowBlur = 0;

    pop();

    if (
      sdHasShield()
    ) {
      sdDrawShield(
        this.x,
        this.y
      );
    }
  }
}


// ================================================================
// SHIP POWER LOGIC
// ================================================================

function sdShipPower() {

  return SD_SHIPS[
    sdSelectedShip
  ].power;
}


function sdHasShield() {

  return (
    millis() <
    sdPowerEnds.SHIELD ||
    sdShipPower() === "HOLY SHIELD" ||
    sdShipPower() === "REALITY BREAK"
  );
}


function sdShipDamageMultiplier() {

  let mult = 1;

  if (
    sdShipPower() === "BURN SHOT"
  ) mult = 1.12;

  if (
    sdShipPower() === "DRAGON RAGE" &&
    sdBossActive
  ) mult = 1.75;

  if (
    sdShipPower() === "TITAN CORE"
  ) mult = 1.65;

  if (
    sdShipPower() === "REALITY BREAK"
  ) mult = 2.1;

  if (
    millis() <
    sdPowerEnds.BERSERKER
  ) mult *= 1.55;

  return mult;
}


function sdShipFireDelay() {

  let delay = 155;

  if (
    sdShipPower() === "QUANTUM DASH"
  ) delay = 85;

  if (
    sdShipPower() === "TITAN CORE"
  ) delay = 105;

  if (
    sdShipPower() === "REALITY BREAK"
  ) delay = 75;

  if (
    millis() <
    sdPowerEnds.BERSERKER
  ) delay = 70;

  if (
    millis() <
    sdPowerEnds.CRYO
  ) delay = 125;

  return delay;
}


function sdShipMoveSpeed() {

  let speed = 5;

  if (
    sdShipPower() === "QUANTUM DASH"
  ) speed *= 1.35;

  if (
    sdShipPower() === "TITAN CORE"
  ) speed *= 0.9;

  if (
    sdShipPower() === "REALITY BREAK"
  ) speed *= 1.2;

  return speed;
}


// ================================================================
// SHIELD
// ================================================================

function sdDrawShield(x, y) {

  noFill();

  stroke(
    0,
    220,
    255,
    170
  );

  strokeWeight(3);

  circle(
    x,
    y,
    78 +
    sin(frameCount * 0.1) * 5
  );
}


// ================================================================
// MAIN GAME
// ================================================================

function sdRunGame() {

  sdUpdateShake();

  sdHandleMovement();

  sdShip.update();

  sdUpdateBullets();
  sdUpdateAliens();
  sdUpdateEnemyShots();
  sdUpdatePowerUps();
  sdUpdateParticles();

  if (sdBossActive) {
    sdUpdateBoss();
  }

  sdUpdatePortal();

  sdCollideBulletsAliens();
  sdCollideShipAliens();
  sdCollideShipShots();
  sdCollideBulletsBoss();

  sdSpawnAliens();
  sdSpawnPowerUps();

  sdCheckBoss();
  sdCheckLevelComplete();

  sdDrawHUD();
  sdDrawControls();

  sdShip.display();
}


// ================================================================
// SCREEN SHAKE
// ================================================================

function sdStartShake(amount) {

  sdShake =
    max(
      sdShake,
      amount
    );
}


function sdUpdateShake() {

  if (sdShake <= 0) return;

  push();

  translate(
    random(-sdShake, sdShake),
    random(-sdShake, sdShake)
  );

  sdShake *= 0.86;

  if (sdShake < 0.3)
    sdShake = 0;

  pop();
}


// ================================================================
// BULLET
// ================================================================

class SDBullet {

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

    this.speed =
      11 + power * 0.8;

    this.radius =
      4 + power;

    this.life = 110;
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

  display() {

    let c =
      SD_SHIPS[
        sdSelectedShip
      ].edge;

    if (
      sdShipPower() === "BURN SHOT"
    ) c = "#ff8a00";

    if (
      sdShipPower() === "DRAGON RAGE"
    ) c = "#ff1744";

    if (
      sdShipPower() === "TIME FREEZE"
    ) c = "#8cecff";

    if (
      sdShipPower() === "REALITY BREAK"
    ) c = "#ffd700";

    stroke(c);

    strokeWeight(
      3 + this.power
    );

    line(
      this.x,
      this.y,
      this.x -
      cos(this.angle) * 17,
      this.y -
      sin(this.angle) * 17
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
// SHOOT
// ================================================================

function sdShoot() {

  if (
    sdState !== "PLAYING"
  ) return;

  let now = millis();

  if (
    now - sdLastShot <
    sdShipFireDelay()
  ) {
    return;
  }

  sdLastShot = now;

  let copies = [0];

  if (
    now <
    sdPowerEnds.TRINITY
  ) {
    copies = [-24, 0, 24];
  }

  else if (
    now <
    sdPowerEnds.TWIN
  ) {
    copies = [-18, 18];
  }

  let angles = [
    sdShip.angle
  ];

  if (
    now <
    sdPowerEnds.MULTI
  ) {

    angles = [
      sdShip.angle - radians(14),
      sdShip.angle,
      sdShip.angle + radians(14)
    ];
  }

  if (
    sdShipPower() === "TITAN CORE"
  ) {

    angles = [
      sdShip.angle - radians(8),
      sdShip.angle,
      sdShip.angle + radians(8)
    ];
  }

  if (
    sdShipPower() === "REALITY BREAK"
  ) {

    angles = [
      sdShip.angle - radians(22),
      sdShip.angle - radians(11),
      sdShip.angle,
      sdShip.angle + radians(11),
      sdShip.angle + radians(22)
    ];
  }

  for (let off of copies) {

    let sx =
      sdShip.x +
      cos(sdShip.angle + HALF_PI) *
      off;

    let sy =
      sdShip.y +
      sin(sdShip.angle + HALF_PI) *
      off;

    for (let a of angles) {

      sdBullets.push(
        new SDBullet(
          sx +
          cos(a) * 28,

          sy +
          sin(a) * 28,

          a,

          sdShipDamageMultiplier()
        )
      );
    }
  }

  sdTone(
    800,
    1000,
    0.06,
    "square",
    0.018
  );
}


// ================================================================
// BULLET UPDATE
// ================================================================

function sdUpdateBullets() {

  for (
    let i = sdBullets.length - 1;
    i >= 0;
    i--
  ) {

    sdBullets[i].update();

    if (
      !sdBullets[i].dead()
    ) {
      sdBullets[i].display();
    } else {
      sdBullets.splice(i, 1);
    }
  }
}


// ================================================================
// ALIEN
// ================================================================

class SDAAlien {

  constructor() {

    this.type =
      random([
        "SCOUT",
        "INTERCEPTOR",
        "HUNTER",
        "HEAVY",
        "ELITE"
      ]);

    if (
      sdCurrentLevel <= 3
    ) {

      this.type =
        random([
          "SCOUT",
          "INTERCEPTOR"
        ]);
    }

    let side =
      floor(random(4));

    if (side === 0) {
      this.x = random(width);
      this.y = -60;
    }

    else if (side === 1) {
      this.x = width + 60;
      this.y = random(height * 0.15, height * 0.8);
    }

    else if (side === 2) {
      this.x = random(width);
      this.y = -60;
    }

    else {
      this.x = -60;
      this.y = random(height * 0.15, height * 0.8);
    }

    this.radius = 22;

    this.hp = 1;

    if (this.type === "HEAVY") {
      this.radius = 31;
      this.hp = 4;
    }

    if (this.type === "ELITE") {
      this.radius = 27;
      this.hp = 3;
    }

    this.speed =
      random(1.4, 2.2) *
      sdDifficulty(
        sdCurrentLevel
      );

    if (this.type === "INTERCEPTOR")
      this.speed *= 1.35;

    if (this.type === "HEAVY")
      this.speed *= 0.65;

    this.phase =
      random(TWO_PI);

    this.rot =
      random(TWO_PI);

    this.rotSpeed =
      random(-0.04, 0.04);

    this.lastShot =
      millis() +
      random(1000, 3500);
  }


  update() {

    let dx =
      sdShip.x -
      this.x;

    let dy =
      sdShip.y -
      this.y;

    let angle =
      atan2(dy, dx);

    if (
      sdShipPower() === "GRAVITY PULSE"
    ) {
      this.speed *= 0.994;
    }

    if (
      sdShipPower() === "TIME FREEZE"
    ) {
      this.speed *= 0.985;
    }

    if (
      millis() <
      sdPowerEnds.CRYO
    ) {
      this.speed *= 0.985;
    }

    if (
      this.type === "INTERCEPTOR"
    ) {

      angle +=
        sin(
          frameCount * 0.04 +
          this.phase
        ) *
        0.35;
    }

    if (
      this.type === "HEAVY"
    ) {
      angle +=
        sin(frameCount * 0.015) *
        0.12;
    }

    this.x +=
      cos(angle) *
      this.speed;

    this.y +=
      sin(angle) *
      this.speed;

    this.rot +=
      this.rotSpeed;

    if (
      this.type === "HUNTER" ||
      this.type === "ELITE"
    ) {

      if (
        millis() -
        this.lastShot >
        2600 -
        sdCurrentLevel * 25
      ) {

        this.fire();

        this.lastShot =
          millis();
      }
    }
  }


  fire() {

    let angle =
      atan2(
        sdShip.y - this.y,
        sdShip.x - this.x
      );

    sdEnemyShots.push(
      new SDEnemyShot(
        this.x,
        this.y,
        angle,
        this.type === "ELITE"
          ? 4.3
          : 3.1
      )
    );
  }


  display() {

    let edge =
      "#66eaff";

    let body =
      "#173f68";

    if (
      this.type === "INTERCEPTOR"
    ) {
      edge = "#ff4dd2";
      body = "#4d154e";
    }

    if (
      this.type === "HUNTER"
    ) {
      edge = "#ffb13b";
      body = "#553014";
    }

    if (
      this.type === "HEAVY"
    ) {
      edge = "#ff4b4b";
      body = "#4f1515";
    }

    if (
      this.type === "ELITE"
    ) {
      edge = "#b66cff";
      body = "#30154d";
    }

    push();

    translate(
      this.x,
      this.y
    );

    rotate(this.rot);

    stroke(edge);

    strokeWeight(2.5);

    fill(body);

    beginShape();

    if (
      this.type === "SCOUT"
    ) {

      vertex(0, -22);
      vertex(-24, 14);
      vertex(0, 8);
      vertex(24, 14);

    }

    else if (
      this.type === "INTERCEPTOR"
    ) {

      vertex(0, -28);
      vertex(-32, 18);
      vertex(-7, 10);
      vertex(0, 24);
      vertex(7, 10);
      vertex(32, 18);

    }

    else if (
      this.type === "HUNTER"
    ) {

      vertex(0, -25);
      vertex(-28, -4);
      vertex(-18, 22);
      vertex(0, 14);
      vertex(18, 22);
      vertex(28, -4);

    }

    else {

      vertex(0, -30);
      vertex(-30, -10);
      vertex(-27, 22);
      vertex(0, 14);
      vertex(27, 22);
      vertex(30, -10);
    }

    endShape(CLOSE);

    noStroke();

    fill(
      this.type === "ELITE"
        ? "#ffddff"
        : "#ffffff"
    );

    ellipse(
      0,
      -3,
      9,
      13
    );

    pop();
  }


  dead() {

    return (
      this.x < -150 ||
      this.x > width + 150 ||
      this.y < -150 ||
      this.y > height + 150
    );
  }
}


// ================================================================
// ALIEN SPAWN
// ================================================================

function sdSpawnAliens() {

  if (
    sdBossActive
  ) return;

  let delay =
    max(
      430,
      1100 -
      sdCurrentLevel * 34
    );

  if (
    millis() -
    sdLastAlien >
    delay
  ) {

    let count = 1;

    if (
      sdCurrentLevel >= 7 &&
      random() < 0.18
    ) {
      count = 2;
    }

    if (
      sdCurrentLevel >= 14 &&
      random() < 0.12
    ) {
      count = 3;
    }

    for (
      let i = 0;
      i < count;
      i++
    ) {

      sdAliens.push(
        new SDAAlien()
      );
    }

    sdLastAlien =
      millis();
  }
}


// ================================================================
// ALIEN UPDATE
// ================================================================

function sdUpdateAliens() {

  for (
    let i = sdAliens.length - 1;
    i >= 0;
    i--
  ) {

    sdAliens[i].update();

    if (
      !sdAliens[i].dead()
    ) {

      sdAliens[i].display();

    } else {

      sdAliens.splice(i, 1);
    }
  }
}


// ================================================================
// ENEMY SHOT
// ================================================================

class SDEnemyShot {

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

    this.radius = 8;

    this.life = 220;
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

  display() {

    stroke(
      255,
      50,
      80
    );

    strokeWeight(4);

    line(
      this.x,
      this.y,
      this.x -
      cos(this.angle) * 12,
      this.y -
      sin(this.angle) * 12
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


function sdUpdateEnemyShots() {

  for (
    let i = sdEnemyShots.length - 1;
    i >= 0;
    i--
  ) {

    sdEnemyShots[i].update();

    if (
      !sdEnemyShots[i].dead()
    ) {

      sdEnemyShots[i].display();

    } else {

      sdEnemyShots.splice(i, 1);
    }
  }
}


// ================================================================
// BULLET / ALIEN
// ================================================================

function sdCollideBulletsAliens() {

  for (
    let i = sdAliens.length - 1;
    i >= 0;
    i--
  ) {

    let alien =
      sdAliens[i];

    for (
      let j = sdBullets.length - 1;
      j >= 0;
      j--
    ) {

      let bullet =
        sdBullets[j];

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

        alien.hp -=
          bullet.power;

        sdBullets.splice(
          j,
          1
        );

        sdCreateExplosion(
          bullet.x,
          bullet.y,
          5,
          SD_SHIPS[
            sdSelectedShip
          ].edge
        );

        if (
          alien.hp <= 0
        ) {

          let points =
            alien.type === "HEAVY"
              ? 70
              : alien.type === "ELITE"
                ? 100
                : alien.type === "HUNTER"
                  ? 45
                  : 30;

          if (
            sdShipPower() === "BURN SHOT"
          ) {
            points += 10;
          }

          sdScore += points;
          sdLevelScore += points;

          sdCreateExplosion(
            alien.x,
            alien.y,
            alien.type === "HEAVY"
              ? 38
              : 25,
            SD_SHIPS[
              sdSelectedShip
            ].edge
          );

          sdStartShake(
            alien.type === "HEAVY"
              ? 8
              : 4
          );

          sdExplosionSound();

          sdAliens.splice(
            i,
            1
          );
        }

        break;
      }
    }
  }
}


// ================================================================
// SHIP / ALIENS
// ================================================================

function sdCollideShipAliens() {

  if (
    millis() <
    sdShip.invincibleUntil
  ) return;

  for (
    let i = sdAliens.length - 1;
    i >= 0;
    i--
  ) {

    let a =
      sdAliens[i];

    if (
      dist(
        sdShip.x,
        sdShip.y,
        a.x,
        a.y
      ) <
      sdShip.radius +
      a.radius * 0.7
    ) {

      if (
        sdHasShield()
      ) {

        sdCreateExplosion(
          a.x,
          a.y,
          24,
          "#00ccff"
        );

        sdAliens.splice(
          i,
          1
        );

        sdStartShake(5);

        return;
      }

      if (
        sdShipPower() ===
        "PHASE DODGE" &&
        random() < 0.65
      ) {

        sdShip.invincibleUntil =
          millis() + 300;

        return;
      }

      sdAliens.splice(
        i,
        1
      );

      sdDamagePlayer();

      return;
    }
  }
}


// ================================================================
// SHIP / ENEMY SHOTS
// ================================================================

function sdCollideShipShots() {

  if (
    millis() <
    sdShip.invincibleUntil
  ) return;

  for (
    let i = sdEnemyShots.length - 1;
    i >= 0;
    i--
  ) {

    let s =
      sdEnemyShots[i];

    if (
      dist(
        sdShip.x,
        sdShip.y,
        s.x,
        s.y
      ) <
      sdShip.radius +
      s.radius
    ) {

      if (
        sdHasShield()
      ) {

        sdEnemyShots.splice(
          i,
          1
        );

        sdStartShake(4);

        return;
      }

      if (
        sdShipPower() ===
        "PHASE DODGE" &&
        random() < 0.7
      ) {

        sdEnemyShots.splice(
          i,
          1
        );

        return;
      }

      sdEnemyShots.splice(
        i,
        1
      );

      sdDamagePlayer();

      return;
    }
  }
}


// ================================================================
// DAMAGE
// ================================================================

function sdDamagePlayer() {

  sdLives--;

  sdShip.invincibleUntil =
    millis() + 1800;

  sdStartShake(12);

  sdTone(
    180,
    55,
    0.28,
    "sawtooth",
    0.05
  );

  if (
    sdLives <= 0
  ) {

    sdState = "GAMEOVER";

    sdCreateExplosion(
      sdShip.x,
      sdShip.y,
      65
    );
  }
}


// ================================================================
// POWER UPS
// ================================================================

class SDPowerUp {

  constructor() {

    this.type =
      random(
        SD_POWER_TYPES
      );

    this.x =
      random(
        55,
        width - 55
      );

    this.y =
      random(
        130,
        height -
        sdSafeBottom -
        50
      );

    this.radius = 23;

    this.life = 850;

    this.rot = 0;
  }

  update() {

    this.rot += 0.04;

    this.life--;
  }

  display() {

    let cfg =
      sdPowerConfig(
        this.type
      );

    push();

    translate(
      this.x,
      this.y
    );

    rotate(this.rot);

    stroke(cfg.color);

    strokeWeight(3);

    fill(
      red(cfg.color),
      green(cfg.color),
      blue(cfg.color),
      45
    );

    circle(
      0,
      0,
      50
    );

    noStroke();

    fill(255);

    textAlign(
      CENTER,
      CENTER
    );

    textStyle(BOLD);

    textSize(10);

    text(
      cfg.label,
      0,
      0
    );

    pop();
  }
}


function sdPowerConfig(type) {

  let data = {

    MULTI: {
      color: "#ffe600",
      label: "M"
    },

    SHIELD: {
      color: "#00bfff",
      label: "S"
    },

    TWIN: {
      color: "#b66cff",
      label: "2X"
    },

    TRINITY: {
      color: "#ff4db8",
      label: "3X"
    },

    NOVA: {
      color: "#ffffff",
      label: "N"
    },

    PHANTOM: {
      color: "#d66cff",
      label: "PH"
    },

    BERSERKER: {
      color: "#ff1744",
      label: "BR"
    },

    CRYO: {
      color: "#9eefff",
      label: "CR"
    },

    CELESTIAL: {
      color: "#fff176",
      label: "CX"
    }

  };

  return data[type];
}


function sdSpawnPowerUps() {

  if (
    millis() -
    sdLastPower <
    max(
      7000,
      9500 -
      sdCurrentLevel * 90
    )
  ) {
    return;
  }

  if (
    sdPowerUps.length < 1
  ) {

    sdPowerUps.push(
      new SDPowerUp()
    );
  }

  sdLastPower =
    millis();
}


function sdUpdatePowerUps() {

  for (
    let i = sdPowerUps.length - 1;
    i >= 0;
    i--
  ) {

    sdPowerUps[i].update();
    sdPowerUps[i].display();

    if (
      sdPowerUps[i].life <= 0
    ) {

      sdPowerUps.splice(
        i,
        1
      );
    }
  }

  for (
    let i = sdPowerUps.length - 1;
    i >= 0;
    i--
  ) {

    let p =
      sdPowerUps[i];

    if (
      dist(
        sdShip.x,
        sdShip.y,
        p.x,
        p.y
      ) <
      sdShip.radius +
      p.radius
    ) {

      sdActivatePower(
        p.type
      );

      sdCreateExplosion(
        p.x,
        p.y,
        25,
        sdPowerConfig(
          p.type
        ).color
      );

      sdScore += 50;
      sdLevelScore += 50;

      sdPowerUps.splice(
        i,
        1
      );

      break;
    }
  }
}


function sdActivatePower(type) {

  let duration = {
    MULTI: 9000,
    SHIELD: 9000,
    TWIN: 9000,
    TRINITY: 8500,
    PHANTOM: 8000,
    BERSERKER: 7500,
    CRYO: 8500,
    CELESTIAL: 7000
  }[type] || 7000;

  sdPowerEnds[type] =
    millis() + duration;

  if (
    type === "NOVA"
  ) {

    for (
      let i = sdAliens.length - 1;
      i >= 0;
      i--
    ) {

      sdCreateExplosion(
        sdAliens[i].x,
        sdAliens[i].y,
        20
      );

      sdAliens.splice(
        i,
        1
      );

      sdScore += 20;
      sdLevelScore += 20;
    }

    if (
      sdBossActive &&
      sdBoss
    ) {

      sdBoss.hp -=
        sdBoss.maxHp *
        0.15;
    }

    sdStartShake(16);
  }

  if (
    type === "TWIN"
  ) {
    sdPowerEnds.TRINITY = 0;
  }

  if (
    type === "TRINITY"
  ) {
    sdPowerEnds.TWIN = 0;
  }

  sdTone(
    300,
    1100,
    0.35,
    "sine",
    0.045
  );
}


// ================================================================
// BOSS DRAGON
// ================================================================

class SDBoss {

  constructor() {

    this.x =
      width / 2;

    this.y = -120;

    this.targetY =
      max(
        130,
        height * 0.18
      );

    this.radius = 82;

    this.maxHp =
      900 +
      sdCurrentLevel * 170;

    this.hp =
      this.maxHp;

    this.phase = 1;

    this.move = 0;

    this.lastAttack =
      millis();
  }


  update() {

    if (
      this.y <
      this.targetY
    ) {

      this.y += 1;

      return;
    }

    let ratio =
      this.hp /
      this.maxHp;

    this.phase =
      ratio > 0.6
        ? 1
        : ratio > 0.3
          ? 2
          : 3;

    this.move +=
      this.phase === 3
        ? 0.021
        : 0.014;

    this.x =
      width / 2 +
      sin(this.move) *
      width * 0.28;

    let delay =
      this.phase === 1
        ? 2300
        : this.phase === 2
          ? 1650
          : 1150;

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

    let base =
      atan2(
        sdShip.y -
        this.y,
        sdShip.x -
        this.x
      );

    let spread =
      this.phase === 1
        ? [0]
        : this.phase === 2
          ? [-16, 0, 16]
          : [-30, -15, 0, 15, 30];

    for (
      let d of spread
    ) {

      sdEnemyShots.push(
        new SDEnemyShot(
          this.x,
          this.y + 35,
          base + radians(d),
          this.phase === 3
            ? 4.2
            : 3.2
        )
      );
    }

    sdTone(
      100,
      45,
      0.3,
      "sawtooth",
      0.04
    );
  }


  display() {

    let edge =
      this.phase === 3
        ? "#ff1744"
        : "#ff7a00";

    let body =
      this.phase === 3
        ? "#650019"
        : "#54170e";

    push();

    translate(
      this.x,
      this.y
    );

    stroke(edge);

    strokeWeight(4);

    fill(body);

    beginShape();

    vertex(-25, -5);
    vertex(-100, -48);
    vertex(-68, 5);
    vertex(-108, 40);
    vertex(-30, 25);

    endShape(CLOSE);

    beginShape();

    vertex(25, -5);
    vertex(100, -48);
    vertex(68, 5);
    vertex(108, 40);
    vertex(30, 25);

    endShape(CLOSE);

    ellipse(
      0,
      10,
      92,
      122
    );

    beginShape();

    vertex(0, -76);
    vertex(-38, -38);
    vertex(-28, 10);
    vertex(0, 30);
    vertex(28, 10);
    vertex(38, -38);

    endShape(CLOSE);

    noStroke();

    fill(
      this.phase === 3
        ? "#ff0044"
        : "#ffff00"
    );

    ellipse(
      -14,
      -34,
      11,
      8
    );

    ellipse(
      14,
      -34,
      11,
      8
    );

    pop();
  }
}


// ================================================================
// BOSS LOGIC
// ================================================================

function sdCheckBoss() {

  let isBoss =
    sdCurrentLevel === 5 ||
    sdCurrentLevel === 10 ||
    sdCurrentLevel === 15 ||
    sdCurrentLevel === 20;

  if (
    !isBoss ||
    sdBossActive ||
    sdBossDefeated
  ) return;

  let elapsed =
    millis() -
    sdLevelStart;

  if (
    elapsed >
    sdLevelDuration *
    0.55
  ) {

    sdBoss =
      new SDBoss();

    sdBossActive = true;

    sdAliens = [];
    sdPowerUps = [];

    sdStartShake(18);

    sdStartBossMusic();

    sdTone(
      50,
      120,
      1.1,
      "sawtooth",
      0.055
    );
  }
}


function sdUpdateBoss() {

  if (
    !sdBoss
  ) return;

  sdBoss.update();
  sdBoss.display();

  sdDrawBossHealth();

  if (
    sdBoss.hp <= 0
  ) {

    let reward =
      1000 +
      sdCurrentLevel *
      100;

    sdScore += reward;
    sdLevelScore += reward;

    sdCreateExplosion(
      sdBoss.x,
      sdBoss.y,
      120,
      "#ff5b30"
    );

    sdStartShake(28);

    sdEnemyShots = [];

    sdBoss = null;

    sdBossActive = false;

    sdBossDefeated = true;

    sdStopBossMusic();

    sdTone(
      100,
      900,
      0.9,
      "sine",
      0.06
    );
  }
}


function sdDrawBossHealth() {

  if (!sdBoss) return;

  let w =
    min(
      340,
      width * 0.76
    );

  let x =
    width / 2 -
    w / 2;

  let y = 92;

  let ratio =
    constrain(
      sdBoss.hp /
      sdBoss.maxHp,
      0,
      1
    );

  textAlign(
    CENTER,
    BOTTOM
  );

  fill(255, 80, 60);

  textStyle(BOLD);

  textSize(14);

  text(
    "METEOR DRAGON • PHASE " +
    sdBoss.phase,
    width / 2,
    y - 7
  );

  noStroke();

  fill(
    255,
    255,
    255,
    40
  );

  rect(
    x,
    y,
    w,
    12,
    6
  );

  fill(
    255,
    60,
    50
  );

  rect(
    x,
    y,
    w * ratio,
    12,
    6
  );
}


// ================================================================
// BULLET / BOSS
// ================================================================

function sdCollideBulletsBoss() {

  if (
    !sdBossActive ||
    !sdBoss
  ) return;

  for (
    let i = sdBullets.length - 1;
    i >= 0;
    i--
  ) {

    let b =
      sdBullets[i];

    if (
      dist(
        b.x,
        b.y,
        sdBoss.x,
        sdBoss.y
      ) <
      sdBoss.radius +
      b.radius
    ) {

      sdBoss.hp -=
        (10 + b.power * 8) *
        sdShipDamageMultiplier();

      sdBullets.splice(
        i,
        1
      );

      sdCreateExplosion(
        b.x,
        b.y,
        4,
        "#ff9a40"
      );

      sdStartShake(2);
    }
  }
}


// ================================================================
// PORTAL
// ================================================================

class SDPortal {

  constructor() {

    this.x =
      random(
        width * 0.25,
        width * 0.75
      );

    this.y =
      random(
        height * 0.25,
        height * 0.55
      );

    this.radius = 50;

    this.life = 800;

    this.rot = 0;
  }

  update() {

    this.rot += 0.04;

    this.life--;
  }

  display() {

    push();

    translate(
      this.x,
      this.y
    );

    rotate(this.rot);

    noFill();

    stroke(
      180,
      70,
      255,
      190
    );

    strokeWeight(5);

    circle(
      0,
      0,
      this.radius * 2
    );

    stroke(
      80,
      200,
      255,
      160
    );

    strokeWeight(3);

    circle(
      0,
      0,
      this.radius * 1.45
    );

    pop();
  }
}


function sdUpdatePortal() {

  if (
    sdBossActive
  ) return;

  if (
    !sdPortal &&
    sdLevelScore >
    850 +
    sdCurrentLevel * 100
  ) {

    sdPortal =
      new SDPortal();
  }

  if (!sdPortal) return;

  sdPortal.update();
  sdPortal.display();

  if (
    dist(
      sdShip.x,
      sdShip.y,
      sdPortal.x,
      sdPortal.y
    ) <
    sdPortal.radius
  ) {

    sdGalaxy =
      floor(
        random(1, 4)
      );

    sdGalaxyEnd =
      millis() + 15000;

    sdPortal = null;

    sdAliens = [];

    sdTone(
      900,
      100,
      0.6,
      "sawtooth",
      0.04
    );
  }

  if (
    sdGalaxy !== 0 &&
    millis() >
    sdGalaxyEnd
  ) {

    sdGalaxy = 0;

    sdAliens = [];
  }
}


// ================================================================
// LEVEL COMPLETE
// ================================================================

function sdCheckLevelComplete() {

  let elapsed =
    millis() -
    sdLevelStart;

  let timeDone =
    elapsed >=
    sdLevelDuration;

  let scoreDone =
    sdLevelScore >=
    sdTargetScore;

  let bossRequired =
    sdCurrentLevel === 5 ||
    sdCurrentLevel === 10 ||
    sdCurrentLevel === 15 ||
    sdCurrentLevel === 20;

  let bossDone =
    !bossRequired ||
    sdBossDefeated;

  if (
    timeDone &&
    scoreDone &&
    bossDone
  ) {

    sdCompleteLevel();
  }
}


function sdCompleteLevel() {

  if (
    sdState !== "PLAYING"
  ) return;

  sdState = "LEVELUP";

  sdLevelUpStart =
    millis();

  if (
    sdCurrentLevel <
    SD_TOTAL_LEVELS
  ) {

    sdUnlockedLevel =
      max(
        sdUnlockedLevel,
        sdCurrentLevel + 1
      );

    sdSave();
  }

  sdCreateCelebration();

  sdStartShake(10);

  sdStopBossMusic();

  sdPlayVictory();
}


// ================================================================
// LEVEL UP SCREEN
// ================================================================

function sdDrawLevelUp() {

  // Full canvas overlay — no partial black rectangle.

  noStroke();

  fill(
    2,
    6,
    20,
    235
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

  fill(
    255,
    220,
    50
  );

  textStyle(BOLD);

  textSize(
    min(34, width * 0.085)
  );

  text(
    sdCurrentLevel ===
    SD_TOTAL_LEVELS
      ? "CAMPAIGN COMPLETE!"
      : "LEVEL " +
        sdCurrentLevel +
        " CLEARED!",
    width / 2,
    height * 0.30
  );

  fill(255);

  textSize(19);

  text(
    "SCORE  " +
    sdScore,
    width / 2,
    height * 0.40
  );

  if (
    sdCurrentLevel <
    SD_TOTAL_LEVELS
  ) {

    fill(0, 225, 255);

    textSize(17);

    text(
      "NEW LEVEL UNLOCKED",
      width / 2,
      height * 0.49
    );

    fill(255);

    textSize(23);

    text(
      "LEVEL " +
      (sdCurrentLevel + 1),
      width / 2,
      height * 0.55
    );

    fill(255, 220, 60);

    textSize(16);

    text(
      SD_LEVEL_TITLES[
        sdCurrentLevel
      ],
      width / 2,
      height * 0.61
    );

  } else {

    fill(255);

    textSize(18);

    text(
      "You conquered the Multiverse.",
      width / 2,
      height * 0.53
    );
  }

  if (
    millis() -
    sdLevelUpStart >
    3200
  ) {

    if (
      sdCurrentLevel <
      SD_TOTAL_LEVELS
    ) {

      sdStartLevel(
        sdCurrentLevel + 1
      );

    } else {

      sdState = "HOME";
    }
  }
}


// ================================================================
// GAME OVER
// ================================================================

function sdDrawGameOver() {

  noStroke();

  fill(
    0,
    0,
    0,
    225
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

  fill(255, 70, 80);

  textStyle(BOLD);

  textSize(38);

  text(
    "MISSION LOST",
    width / 2,
    height * 0.28
  );

  fill(255);

  textSize(18);

  text(
    "LEVEL " +
    sdCurrentLevel,
    width / 2,
    height * 0.38
  );

  fill(255, 220, 50);

  textSize(15);

  text(
    SD_LEVEL_TITLES[
      sdCurrentLevel - 1
    ],
    width / 2,
    height * 0.43
  );

  sdActionButton(
    "↻  RETRY LEVEL",
    height * 0.55,
    280
  );

  sdActionButton(
    "⌂  HOME",
    height * 0.66,
    240
  );
}


// ================================================================
// PAUSE
// ================================================================

function sdPauseGame() {

  if (
    sdState === "PLAYING"
  ) {

    sdState = "PAUSED";

    sdPauseStarted =
      millis();
  }
}


function sdResumeGame() {

  if (
    sdState !== "PAUSED"
  ) return;

  let paused =
    millis() -
    sdPauseStarted;

  sdLevelStart += paused;

  sdLastAlien += paused;
  sdLastPower += paused;
  sdLastShot += paused;

  sdPowerReadyAt += paused;

  for (
    let key in sdPowerEnds
  ) {
    sdPowerEnds[key] += paused;
  }

  if (
    sdGalaxy !== 0
  ) {
    sdGalaxyEnd += paused;
  }

  if (
    sdBoss
  ) {
    sdBoss.lastAttack += paused;
  }

  sdState = "PLAYING";
}


function sdDrawFrozen() {

  if (sdShip)
    sdShip.display();

  for (
    let a of sdAliens
  ) a.display();

  for (
    let b of sdBullets
  ) b.display();

  for (
    let p of sdPowerUps
  ) p.display();

  for (
    let s of sdEnemyShots
  ) s.display();

  if (sdBoss)
    sdBoss.display();

  sdDrawHUD();
}


function sdDrawPause() {

  noStroke();

  fill(
    0,
    0,
    0,
    205
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
    height * 0.30
  );

  fill(0, 220, 255);

  textSize(15);

  text(
    "LEVEL " +
    sdCurrentLevel +
    " • " +
    SD_LEVEL_TITLES[
      sdCurrentLevel - 1
    ],
    width / 2,
    height * 0.38
  );

  sdActionButton(
    "▶  RESUME",
    height * 0.53,
    270
  );

  sdActionButton(
    "⌂  HOME",
    height * 0.64,
    240
  );
}


// ================================================================
// HUD
// ================================================================

function sdDrawHUD() {

  textStyle(BOLD);

  textAlign(
    LEFT,
    TOP
  );

  fill(255);

  textSize(15);

  text(
    "SCORE  " +
    sdScore,
    14,
    12
  );

  textAlign(
    RIGHT,
    TOP
  );

  text(
    "♥ " +
    sdLives,
    width - 14,
    12
  );

  textAlign(
    CENTER,
    TOP
  );

  fill(0, 225, 255);

  textSize(15);

  text(
    "LEVEL " +
    sdCurrentLevel,
    width / 2,
    12
  );

  fill(255, 220, 60);

  textSize(11);

  text(
    SD_LEVEL_TITLES[
      sdCurrentLevel - 1
    ],
    width / 2,
    33
  );

  let w =
    min(
      300,
      width * 0.72
    );

  let x =
    width / 2 -
    w / 2;

  let y = 58;

  let elapsed =
    millis() -
    sdLevelStart;

  let timeRatio =
    constrain(
      elapsed /
      sdLevelDuration,
      0,
      1
    );

  let scoreRatio =
    constrain(
      sdLevelScore /
      sdTargetScore,
      0,
      1
    );

  fill(
    255,
    255,
    255,
    35
  );

  rect(
    x,
    y,
    w,
    9,
    5
  );

  fill(0, 220, 255);

  rect(
    x,
    y,
    w * timeRatio,
    9,
    5
  );

  fill(
    255,
    255,
    255,
    35
  );

  rect(
    x,
    y + 22,
    w,
    9,
    5
  );

  fill(
    255,
    220,
    40
  );

  rect(
    x,
    y + 22,
    w * scoreRatio,
    9,
    5
  );

  fill(210);

  textSize(11);

  text(
    "SURVIVAL   " +
    floor(
      min(
        elapsed / 1000,
        sdLevelDuration / 1000
      )
    ) +
    " / " +
    floor(
      sdLevelDuration / 1000
    ) +
    " sec",
    width / 2,
    y + 36
  );

  fill(210);

  text(
    "SCORE   " +
    sdLevelScore +
    " / " +
    sdTargetScore,
    width / 2,
    y + 52
  );

  sdTopButton(
    sdPauseButton.x,
    sdPauseButton.y,
    "Ⅱ"
  );

  sdTopButton(
    sdHomeButton.x,
    sdHomeButton.y,
    "⌂"
  );

  if (
    sdBossActive
  ) {
    // Boss health is drawn separately.
  }
}


// ================================================================
// CONTROLS
// ================================================================

function sdResetControls() {

  let moveX =
    sdControlsSwapped
      ? width - 95
      : 95;

  let fireX =
    sdControlsSwapped
      ? 95
      : width - 95;

  sdJoystick.baseX =
    moveX;

  sdJoystick.baseY =
    height -
    sdSafeBottom;

  sdJoystick.knobX =
    moveX;

  sdJoystick.knobY =
    sdJoystick.baseY;

  sdFire.x =
    fireX;

  sdFire.y =
    height -
    sdSafeBottom;

  sdPowerButton.x =
    width / 2;

  sdPowerButton.y =
    height -
    sdSafeBottom;

  sdHomeButton.x =
    width - 38;

  sdHomeButton.y =
    52;

  sdPauseButton.x =
    38;

  sdPauseButton.y =
    52;

  sdJoystick.active =
    false;
}


function sdHandleMovement() {

  let movement =
    null;

  let firing =
    false;

  for (
    let t of touches
  ) {

    if (
      dist(
        t.x,
        t.y,
        sdFire.x,
        sdFire.y
      ) <
      sdFire.radius + 20
    ) {

      firing = true;

      continue;
    }

    let movementSide =
      sdControlsSwapped
        ? t.x > width * 0.45
        : t.x < width * 0.55;

    if (
      movementSide &&
      t.y >
      height * 0.40
    ) {

      movement = t;
    }
  }

  if (firing) {
    sdShoot();
  }

  if (movement) {

    if (
      !sdJoystick.active
    ) {

      sdJoystick.active = true;

      sdJoystick.baseX =
        movement.x;

      sdJoystick.baseY =
        movement.y;
    }

    let dx =
      movement.x -
      sdJoystick.baseX;

    let dy =
      movement.y -
      sdJoystick.baseY;

    let distance =
      sqrt(
        dx * dx +
        dy * dy
      );

    if (
      distance >
      sdJoystick.radius
    ) {

      let angle =
        atan2(
          dy,
          dx
        );

      dx =
        cos(angle) *
        sdJoystick.radius;

      dy =
        sin(angle) *
        sdJoystick.radius;
    }

    sdJoystick.knobX =
      sdJoystick.baseX + dx;

    sdJoystick.knobY =
      sdJoystick.baseY + dy;

  } else {

    sdResetJoystick();
  }

  sdMoveShip();
}


function sdMoveShip() {

  if (
    !sdJoystick.active
  ) return;

  let dx =
    sdJoystick.knobX -
    sdJoystick.baseX;

  let dy =
    sdJoystick.knobY -
    sdJoystick.baseY;

  let mag =
    sqrt(
      dx * dx +
      dy * dy
    );

  if (
    mag < 4
  ) return;

  let angle =
    atan2(
      dy,
      dx
    );

  sdShip.angle =
    angle;

  let strength =
    constrain(
      mag /
      sdJoystick.radius,
      0,
      1
    );

  let speed =
    sdShipMoveSpeed();

  sdShip.x +=
    cos(angle) *
    speed *
    strength;

  sdShip.y +=
    sin(angle) *
    speed *
    strength;
}


function sdResetJoystick() {

  sdJoystick.active =
    false;

  let x =
    sdControlsSwapped
      ? width - 95
      : 95;

  sdJoystick.baseX =
    x;

  sdJoystick.baseY =
    height -
    sdSafeBottom;

  sdJoystick.knobX =
    x;

  sdJoystick.knobY =
    sdJoystick.baseY;
}


function sdDrawControls() {

  let y =
    height -
    sdSafeBottom;

  // Joystick

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
    sdJoystick.baseX,
    y,
    sdJoystick.radius * 2
  );

  fill(
    0,
    220,
    255,
    100
  );

  circle(
    sdJoystick.knobX,
    sdJoystick.knobY,
    50
  );

  // Fire

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
    sdFire.x,
    y,
    sdFire.radius * 2
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
    sdFire.x,
    y
  );

  // Special power

  if (
    sdPowerReadyAt <= millis()
  ) {

    stroke(
      255,
      220,
      50,
      180
    );

    fill(
      255,
      190,
      20,
      50
    );

    circle(
      sdPowerButton.x,
      y,
      sdPowerButton.radius * 2
    );

    noStroke();

    fill(255);

    textSize(10);

    text(
      "POWER",
      sdPowerButton.x,
      y
    );
  }
}


// ================================================================
// TOP BUTTON
// ================================================================

function sdTopButton(
  x,
  y,
  label
) {

  stroke(
    0,
    210,
    255,
    180
  );

  strokeWeight(2);

  fill(
    5,
    25,
    45,
    230
  );

  circle(
    x,
    y,
    44
  );

  noStroke();

  fill(255);

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(BOLD);

  textSize(18);

  text(
    label,
    x,
    y
  );
}


// ================================================================
// HOME BUTTON
// ================================================================

function sdHomeBottomButton() {

  /*
    IMPORTANT:
    This button is now positioned using the mobile-safe
    bottom zone instead of raw height - 55.
  */

  let y =
    height -
    sdSafeBottom +
    20;

  let w =
    min(
      190,
      width * 0.55
    );

  rectMode(CENTER);

  stroke(
    0,
    210,
    255
  );

  strokeWeight(2);

  fill(
    5,
    20,
    35
  );

  rect(
    width / 2,
    y,
    w,
    48,
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
    "←  HOME",
    width / 2,
    y
  );
}


// ================================================================
// ACTION BUTTON
// ================================================================

function sdActionButton(
  label,
  y,
  w
) {

  rectMode(CENTER);

  stroke(
    0,
    210,
    255
  );

  strokeWeight(2);

  fill(
    5,
    25,
    45
  );

  rect(
    width / 2,
    y,
    min(w, width * 0.80),
    52,
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
// PARTICLES
// ================================================================

class SDParticle {

  constructor(
    x,
    y,
    tint
  ) {

    this.x = x;
    this.y = y;

    let a =
      random(TWO_PI);

    let speed =
      random(1, 7);

    this.vx =
      cos(a) * speed;

    this.vy =
      sin(a) * speed;

    this.life = 255;

    this.size =
      random(2, 7);

    this.tint =
      tint || "#ff8a30";
  }

  update() {

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.97;
    this.vy *= 0.97;

    this.life -= 7;
  }

  display() {

    let c =
      color(this.tint);

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


function sdCreateExplosion(
  x,
  y,
  count,
  tint
) {

  for (
    let i = 0;
    i < count;
    i++
  ) {

    sdParticles.push(
      new SDParticle(
        x,
        y,
        tint
      )
    );
  }
}


function sdUpdateParticles() {

  for (
    let i =
      sdParticles.length - 1;
    i >= 0;
    i--
  ) {

    sdParticles[i].update();
    sdParticles[i].display();

    if (
      sdParticles[i].life <= 0
    ) {

      sdParticles.splice(
        i,
        1
      );
    }
  }
}


function sdCreateCelebration() {

  for (
    let i = 0;
    i < 100;
    i++
  ) {

    sdParticles.push(
      new SDParticle(
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

function sdInitAudio() {

  if (!sdAudio) {

    let AC =
      window.AudioContext ||
      window.webkitAudioContext;

    if (AC) {
      sdAudio =
        new AC();
    }
  }

  if (
    sdAudio &&
    sdAudio.state ===
    "suspended"
  ) {

    sdAudio.resume();
  }
}


function sdTone(
  start,
  end,
  duration,
  type,
  volume
) {

  if (
    !sdSound ||
    !sdAudio
  ) return;

  try {

    let osc =
      sdAudio.createOscillator();

    let gain =
      sdAudio.createGain();

    osc.type =
      type || "sine";

    osc.frequency.setValueAtTime(
      max(1, start),
      sdAudio.currentTime
    );

    osc.frequency.exponentialRampToValueAtTime(
      max(1, end),
      sdAudio.currentTime +
      duration
    );

    gain.gain.setValueAtTime(
      volume || 0.03,
      sdAudio.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      sdAudio.currentTime +
      duration
    );

    osc.connect(gain);
    gain.connect(
      sdAudio.destination
    );

    osc.start();

    osc.stop(
      sdAudio.currentTime +
      duration
    );

  } catch (e) {}
}


function sdExplosionSound() {

  sdTone(
    150,
    45,
    0.16,
    "sawtooth",
    0.035
  );
}


function sdPlayVictory() {

  sdTone(
    400,
    600,
    0.18,
    "sine",
    0.045
  );

  setTimeout(
    function() {

      sdTone(
        600,
        850,
        0.18,
        "sine",
        0.045
      );

    },
    180
  );

  setTimeout(
    function() {

      sdTone(
        850,
        1300,
        0.3,
        "sine",
        0.05
      );

    },
    360
  );
}


// ================================================================
// PROCEDURAL BOSS MUSIC
// ================================================================

function sdStartBossMusic() {

  if (
    sdBossMusicOn
  ) return;

  sdBossMusicOn = true;

  if (
    !sdSound ||
    !sdAudio
  ) return;

  let notes = [
    110,
    130.8,
    146.8,
    98,
    123.5,
    110
  ];

  let index = 0;

  sdBossMusicTimer =
    setInterval(
      function() {

        if (
          !sdBossMusicOn ||
          sdState !== "PLAYING" ||
          !sdBossActive
        ) {

          return;
        }

        let n =
          notes[
            index %
            notes.length
          ];

        sdTone(
          n,
          n * 0.97,
          0.28,
          "triangle",
          0.025
        );

        sdTone(
          n * 2,
          n * 1.8,
          0.12,
          "sawtooth",
          0.009
        );

        index++;

      },
      360
    );
}


function sdStopBossMusic() {

  sdBossMusicOn = false;

  if (
    sdBossMusicTimer
  ) {

    clearInterval(
      sdBossMusicTimer
    );

    sdBossMusicTimer = null;
  }
}


// ================================================================
// POWER RESET
// ================================================================

function sdResetPowers() {

  for (
    let key in sdPowerEnds
  ) {

    sdPowerEnds[key] = 0;
  }
}


// ================================================================
// TOUCH
// ================================================================

function touchStarted() {

  sdInitAudio();

  let x =
    touches.length
      ? touches[0].x
      : mouseX;

  let y =
    touches.length
      ? touches[0].y
      : mouseY;

  sdTouchStartX = x;
  sdTouchStartY = y;

  sdHandleTap(
    x,
    y
  );

  return false;
}


function touchMoved() {

  if (
    sdState === "ARCHIVE"
  ) {

    if (
      touches.length
    ) {

      let y =
        touches[0].y;

      if (
        sdArchiveDragging
      ) {

        let delta =
          sdArchiveLastY -
          y;

        sdArchiveTarget +=
          delta * 1.3;
      }

      sdArchiveDragging =
        true;

      sdArchiveLastY =
        y;
    }

    return false;
  }

  return false;
}


function touchEnded() {

  if (
    sdState === "ARCHIVE"
  ) {

    sdArchiveDragging =
      false;

    return false;
  }

  return false;
}


// ================================================================
// TAP ROUTER
// ================================================================

function sdHandleTap(x, y) {

  // HOME

  if (
    sdState === "HOME"
  ) {

    if (
      sdNearY(
        y,
        height * 0.34
      )
    ) {

      sdState =
        "LEVELS";

      return;
    }

    if (
      sdNearY(
        y,
        height * 0.45
      )
    ) {

      sdState =
        "ARCHIVE";

      sdArchiveScroll = 0;
      sdArchiveTarget = 0;

      return;
    }

    if (
      sdNearY(
        y,
        height * 0.56
      )
    ) {

      sdState =
        "ABOUT";

      return;
    }

    if (
      sdNearY(
        y,
        height * 0.67
      )
    ) {

      sdState =
        "SETTINGS";

      return;
    }

    if (
      sdNearY(
        y,
        height * 0.78
      )
    ) {

      sdRating = 0;

      sdState =
        "RATING";

      return;
    }
  }


  // HOME BUTTON ON MENUS

  if (
    sdState === "LEVELS" ||
    sdState === "ARCHIVE" ||
    sdState === "ABOUT" ||
    sdState === "SETTINGS"
  ) {

    let homeY =
      height -
      sdSafeBottom +
      20;

    if (
      abs(y - homeY) < 32
    ) {

      sdState =
        "HOME";

      return;
    }
  }


  // LEVELS

  if (
    sdState === "LEVELS"
  ) {

    let cols = 4;

    let gap = 10;

    let size =
      min(
        67,
        (width - 50) /
        cols
      );

    let startY = 170;

    let total =
      cols * size +
      (cols - 1) *
      gap;

    let startX =
      width / 2 -
      total / 2 +
      size / 2;

    for (
      let i = 1;
      i <= 20;
      i++
    ) {

      let col =
        (i - 1) % cols;

      let row =
        floor(
          (i - 1) / cols
        );

      let bx =
        startX +
        col *
        (size + gap);

      let by =
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
          sdUnlockedLevel
        ) {

          sdStartLevel(i);

        } else {

          sdTone(
            150,
            80,
            0.15,
            "square",
            0.025
          );
        }

        return;
      }
    }
  }


  // ARCHIVE

  if (
    sdState === "ARCHIVE"
  ) {

    let cardW =
      min(
        350,
        width * 0.88
      );

    let cardH = 142;

    let gap = 16;

    let top = 105;

    for (
      let i = 0;
      i < SD_SHIPS.length;
      i++
    ) {

      let cy =
        top +
        i *
        (cardH + gap) -
        sdArchiveScroll;

      if (
        abs(
          x -
          width / 2
        ) <
        cardW / 2 &&
        abs(
          y -
          cy
        ) <
        cardH / 2
      ) {

        if (
          sdUnlockedLevel >=
          SD_SHIPS[i].unlock
        ) {

          sdSelectedShip =
            i;

          sdSave();

          sdTone(
            300,
            900,
            0.25,
            "sine",
            0.035
          );
        }

        return;
      }
    }
  }


  // SETTINGS

  if (
    sdState === "SETTINGS"
  ) {

    if (
      abs(
        y -
        height * 0.34
      ) < 45
    ) {

      sdControlsSwapped =
        !sdControlsSwapped;

      sdResetControls();

      sdSave();

      return;
    }

    if (
      abs(
        y -
        height * 0.50
      ) < 45
    ) {

      sdSound =
        !sdSound;

      sdSave();

      if (sdSound) {

        sdTone(
          400,
          800,
          0.2,
          "sine",
          0.04
        );
      }

      return;
    }
  }


  // RATING

  if (
    sdState === "RATING"
  ) {

    let gap =
      min(55, width * 0.13);

    let total =
      gap * 4;

    for (
      let i = 1;
      i <= 5;
      i++
    ) {

      let sx =
        width / 2 -
        total / 2 +
        (i - 1) * gap;

      if (
        dist(
          x,
          y,
          sx,
          height * 0.46
        ) < 30
      ) {

        if (
          sdRating === i
        ) {

          sdRating = 0;

        } else {

          sdRating = i;
        }

        return;
      }
    }

    if (
      abs(
        y -
        height * 0.66
      ) < 30
    ) {

      sdTone(
        500,
        900,
        0.2,
        "sine",
        0.035
      );

      sdState =
        "HOME";

      return;
    }

    if (
      abs(
        y -
        height * 0.76
      ) < 30
    ) {

      sdState =
        "HOME";

      return;
    }
  }


  // PLAYING TOP CONTROLS

  if (
    sdState === "PLAYING"
  ) {

    if (
      dist(
        x,
        y,
        sdPauseButton.x,
        sdPauseButton.y
      ) < 32
    ) {

      sdPauseGame();

      return;
    }

    if (
      dist(
        x,
        y,
        sdHomeButton.x,
        sdHomeButton.y
      ) < 32
    ) {

      sdStopBossMusic();

      sdState =
        "HOME";

      sdResetJoystick();

      return;
    }

    if (
      dist(
        x,
        y,
        sdFire.x,
        sdFire.y
      ) <
      sdFire.radius + 20
    ) {

      sdShoot();

      return;
    }

    if (
      dist(
        x,
        y,
        sdPowerButton.x,
        sdPowerButton.y
      ) <
      sdPowerButton.radius + 15
    ) {

      sdUseShipSpecial();

      return;
    }
  }


  // PAUSED

  if (
    sdState === "PAUSED"
  ) {

    if (
      abs(
        y -
        height * 0.53
      ) < 32
    ) {

      sdResumeGame();

      return;
    }

    if (
      abs(
        y -
        height * 0.64
      ) < 32
    ) {

      sdStopBossMusic();

      sdState =
        "HOME";

      return;
    }
  }


  // GAME OVER

  if (
    sdState === "GAMEOVER"
  ) {

    if (
      abs(
        y -
        height * 0.55
      ) < 32
    ) {

      sdStartLevel(
        sdCurrentLevel
      );

      return;
    }

    if (
      abs(
        y -
        height * 0.66
      ) < 32
    ) {

      sdState =
        "HOME";

      return;
    }
  }
}


// ================================================================
// SPECIAL SHIP ABILITIES
// ================================================================

function sdUseShipSpecial() {

  if (
    sdPowerReadyAt >
    millis()
  ) return;

  let p =
    sdShipPower();

  if (
    p === "BURN SHOT"
  ) {

    sdPowerEnds.BERSERKER =
      millis() + 5000;
  }

  else if (
    p === "GRAVITY PULSE"
  ) {

    for (
      let a of sdAliens
    ) {

      a.speed *= 0.3;
    }

    sdPowerEnds.CRYO =
      millis() + 4500;
  }

  else if (
    p === "TIME FREEZE"
  ) {

    sdPowerEnds.CRYO =
      millis() + 6500;
  }

  else if (
    p === "PHASE DODGE"
  ) {

    sdShip.invincibleUntil =
      millis() + 4500;
  }

  else if (
    p === "DRAGON RAGE"
  ) {

    sdPowerEnds.BERSERKER =
      millis() + 6500;
  }

  else if (
    p === "QUANTUM DASH"
  ) {

    sdShip.invincibleUntil =
      millis() + 2200;

    sdPowerEnds.BERSERKER =
      millis() + 5000;
  }

  else if (
    p === "HOLY SHIELD"
  ) {

    sdPowerEnds.SHIELD =
      millis() + 7000;
  }

  else if (
    p === "TITAN CORE"
  ) {

    sdPowerEnds.BERSERKER =
      millis() + 6500;
  }

  else if (
    p === "REALITY BREAK"
  ) {

    sdPowerEnds.CELESTIAL =
      millis() + 6500;

    sdPowerEnds.SHIELD =
      millis() + 6500;

    for (
      let i =
        sdAliens.length - 1;
      i >= 0;
      i--
    ) {

      sdCreateExplosion(
        sdAliens[i].x,
        sdAliens[i].y,
        18
      );

      sdAliens.splice(
        i,
        1
      );

      sdScore += 35;
      sdLevelScore += 35;
    }

    if (
      sdBoss
    ) {

      sdBoss.hp -=
        sdBoss.maxHp *
        0.12;
    }

    sdStartShake(20);
  }

  else {

    sdPowerEnds.MULTI =
      millis() + 6000;
  }

  sdPowerReadyAt =
    millis() + 15000;

  sdTone(
    250,
    1200,
    0.4,
    "sine",
    0.05
  );
}


// ================================================================
// UTILITY
// ================================================================

function sdNearY(
  y,
  target
) {

  return (
    abs(
      y -
      target
    ) < 32
  );
}


// ================================================================
// MOUSE
// ================================================================

function mousePressed() {

  sdInitAudio();

  sdHandleTap(
    mouseX,
    mouseY
  );

  return false;
}


// ================================================================
// RESIZE
// ================================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  sdUpdateSafeArea();

  sdCreateStars();

  sdResetControls();
}
