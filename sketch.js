// ================================================================
// SPACE DODGER — GALACTIC CAMPAIGN
// POLISHED MOBILE EDITION
// Complete single-file p5.js sketch.js
// ================================================================


// ================================================================
// GAME STATE
// ================================================================

let sdState = "HOME";
// HOME, LEVELS, ARCHIVE, ABOUT, SETTINGS, RATING,
// PLAYING, PAUSED, GAMEOVER, LEVELUP

let sdShip = null;

let sdBullets = [];
let sdAliens = [];
let sdEnemyShots = [];
let sdPowerUps = [];
let sdParticles = [];
let sdStars = [];

let sdBoss = null;

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

let sdBossActive = false;
let sdBossDefeated = false;

let sdSound = true;
let sdControlsSwapped = false;

let sdAudio = null;

let sdShake = 0;

let sdRating = 0;

let sdArchiveScroll = 0;
let sdArchiveTarget = 0;
let sdArchiveDragging = false;
let sdArchiveLastY = 0;

let sdTouchStartX = 0;
let sdTouchStartY = 0;

let sdPauseStarted = 0;

let sdSafeBottom = 110;

let sdPowerReadyAt = 0;

let sdMenuPressed = -1;
let sdMenuPressTime = 0;


// ================================================================
// CONTROLS
// ================================================================

let sdJoystick = {
  active: false,
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
  y: 52,
  radius: 23
};

let sdHomeButton = {
  x: 0,
  y: 52,
  radius: 23
};


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

function sdIsBossLevel(level) {
  return (
    level === 5 ||
    level === 10 ||
    level === 15 ||
    level === 20
  );
}


// ================================================================
// SHIP ARCHIVE
// ================================================================

const SD_SHIPS = [

  {
    name: "NOVA SCOUT",
    unlock: 1,
    body: "#10284b",
    edge: "#00d9ff",
    core: "#eaffff",
    power: "BALANCED",
    desc: "Balanced weapons and movement."
  },

  {
    name: "SOLAR FANG",
    unlock: 3,
    body: "#54210e",
    edge: "#ff8a00",
    core: "#ffe28a",
    power: "BURN SHOT",
    desc: "Shots deal increased damage."
  },

  {
    name: "NEBULA WING",
    unlock: 5,
    body: "#35114f",
    edge: "#c46cff",
    core: "#f5eaff",
    power: "GRAVITY PULSE",
    desc: "Slows nearby enemies."
  },

  {
    name: "CRYO HAWK",
    unlock: 7,
    body: "#103c5b",
    edge: "#7ee9ff",
    core: "#efffff",
    power: "TIME FREEZE",
    desc: "Greatly slows enemy movement."
  },

  {
    name: "VOID SPEAR",
    unlock: 9,
    body: "#28102f",
    edge: "#ff55d5",
    core: "#ffffff",
    power: "PHASE DODGE",
    desc: "Temporary damage immunity."
  },

  {
    name: "DRAGON BANE",
    unlock: 10,
    body: "#550915",
    edge: "#ff3455",
    core: "#ffe26a",
    power: "DRAGON RAGE",
    desc: "Massive boss damage bonus."
  },

  {
    name: "QUANTUM EDGE",
    unlock: 12,
    body: "#073d43",
    edge: "#00e0c0",
    core: "#efffff",
    power: "QUANTUM DASH",
    desc: "Fast movement and rapid fire."
  },

  {
    name: "STAR PALADIN",
    unlock: 15,
    body: "#50450a",
    edge: "#ffe45c",
    core: "#ffffff",
    power: "HOLY SHIELD",
    desc: "Temporary protective shield."
  },

  {
    name: "GALACTIC TITAN",
    unlock: 18,
    body: "#421b56",
    edge: "#ed72ff",
    core: "#ffffbb",
    power: "TITAN CORE",
    desc: "Huge shots and high damage."
  },

  {
    name: "MULTIVERSE KING",
    unlock: 20,
    body: "#523b00",
    edge: "#ffd43b",
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

  pixelDensity(min(2, window.devicePixelRatio || 1));

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
      "spaceDodgerSaveV5"
    );

    if (!raw) {

      // Backward compatibility
      raw = localStorage.getItem(
        "spaceDodgerSaveV4"
      );
    }

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
    sdSound = true;
    sdControlsSwapped = false;
  }
}


function sdSave() {

  try {

    localStorage.setItem(
      "spaceDodgerSaveV5",
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

  sdSafeBottom = constrain(
    max(105, height * 0.13),
    105,
    150
  );

  sdResetControls();
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

    background(17, 3, 9);

    return;
  }

  background(2, 6, 17);
}


// ================================================================
// STARS
// ================================================================

function sdCreateStars() {

  sdStars = [];

  for (let i = 0; i < 145; i++) {

    sdStars.push({
      x: random(width),
      y: random(height),
      size: random(0.8, 2.5),
      speed: random(0.15, 0.9),
      alpha: random(90, 210)
    });
  }
}


function sdDrawStars() {

  noStroke();

  for (let s of sdStars) {

    if (sdState === "PLAYING") {

      s.y += s.speed;

      if (s.y > height) {

        s.y = -5;
        s.x = random(width);
      }
    }

    fill(
      185,
      220,
      255,
      s.alpha
    );

    circle(
      s.x,
      s.y,
      s.size
    );
  }
}


// ================================================================
// HOME
// ================================================================

function sdDrawHome() {

  textAlign(CENTER, CENTER);

  // Title
  fill(225, 245, 255);

  textStyle(BOLD);

  textSize(
    min(42, width * 0.105)
  );

  text(
    "SPACE DODGER",
    width / 2,
    height * 0.14
  );

  // Small accent
  fill(130, 190, 215);

  textStyle(NORMAL);

  textSize(12);

  text(
    "GALACTIC CAMPAIGN",
    width / 2,
    height * 0.195
  );

  let buttons = [
    ["PLAY", height * 0.32],
    ["SHIP ARCHIVE", height * 0.43],
    ["ABOUT", height * 0.54],
    ["SETTINGS", height * 0.65],
    ["RATE US", height * 0.76]
  ];

  for (let i = 0; i < buttons.length; i++) {

    sdMenuButton(
      buttons[i][0],
      buttons[i][1],
      i
    );
  }

  fill(135);

  textSize(11);

  text(
    "LEVEL " +
    sdUnlockedLevel +
    " / " +
    SD_TOTAL_LEVELS +
    " UNLOCKED",
    width / 2,
    height - 27
  );
}


// ================================================================
// MENU BUTTON
// ================================================================

function sdMenuButton(
  label,
  y,
  index
) {

  let w = min(
    320,
    width * 0.80
  );

  let h = 56;

  let pressed =
    sdMenuPressed === index &&
    millis() - sdMenuPressTime < 180;

  rectMode(CENTER);

  stroke(
    pressed
      ? color(220, 245, 255)
      : color(70, 150, 180)
  );

  strokeWeight(
    pressed ? 3 : 1.5
  );

  fill(
    pressed
      ? color(13, 42, 62)
      : color(6, 20, 35)
  );

  rect(
    width / 2,
    y,
    w,
    h,
    12
  );

  noStroke();

  fill(
    pressed
      ? 255
      : 225
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
// LEVEL SELECT
// ================================================================

function sdDrawLevels() {

  textAlign(CENTER, CENTER);

  fill(225, 245, 255);

  textStyle(BOLD);

  textSize(27);

  text(
    "SELECT LEVEL",
    width / 2,
    42
  );

  fill(120, 175, 200);

  textStyle(NORMAL);

  textSize(11);

  text(
    "CURRENT RANK",
    width / 2,
    69
  );

  fill(255, 220, 75);

  textStyle(BOLD);

  textSize(14);

  text(
    SD_LEVEL_TITLES[
      sdUnlockedLevel - 1
    ],
    width / 2,
    91
  );

  let cols = 4;

  let gap = 9;

  let size = min(
    66,
    (width - 48) / cols
  );

  let startY = 140;

  let totalWidth =
    cols * size +
    (cols - 1) * gap;

  let startX =
    width / 2 -
    totalWidth / 2 +
    size / 2;

  for (
    let i = 1;
    i <= SD_TOTAL_LEVELS;
    i++
  ) {

    let col =
      (i - 1) % cols;

    let row =
      floor((i - 1) / cols);

    let x =
      startX +
      col * (size + gap);

    let y =
      startY +
      row * (size + 15);

    let open =
      i <= sdUnlockedLevel;

    let boss =
      sdIsBossLevel(i);

    rectMode(CENTER);

    stroke(
      open
        ? boss
          ? color(225, 115, 80)
          : color(65, 155, 190)
        : color(55)
    );

    strokeWeight(1.5);

    fill(
      open
        ? boss
          ? color(52, 24, 26)
          : color(7, 30, 48)
        : color(17, 18, 23)
    );

    rect(
      x,
      y,
      size,
      size,
      10
    );

    noStroke();

    fill(
      open
        ? 240
        : 95
    );

    textStyle(BOLD);

    textSize(17);

    text(
      open
        ? i
        : "LOCK",
      x,
      y - 5
    );

    if (open) {

      fill(
        boss
          ? color(255, 145, 100)
          : color(115, 185, 210)
      );

      textSize(8);

      text(
        boss
          ? "BOSS"
          : "LEVEL",
        x,
        y + 19
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

  fill(225, 245, 255);

  textStyle(BOLD);

  textSize(25);

  text(
    "SHIP ARCHIVE",
    width / 2,
    35
  );

  fill(120, 175, 200);

  textStyle(NORMAL);

  textSize(11);

  text(
    "SWIPE TO BROWSE • TAP TO SELECT",
    width / 2,
    61
  );

  let cardW =
    min(355, width * 0.89);

  let cardH = 145;

  let gap = 15;

  let top = 100;

  let viewportTop = 83;

  let viewportBottom =
    height - sdSafeBottom - 32;

  let viewportHeight =
    viewportBottom -
    viewportTop;

  let contentHeight =
    SD_SHIPS.length *
    (cardH + gap);

  let maxScroll =
    max(
      0,
      contentHeight -
      viewportHeight +
      20
    );

  sdArchiveTarget =
    constrain(
      sdArchiveTarget,
      0,
      maxScroll
    );

  sdArchiveScroll =
    lerp(
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

    let ship =
      SD_SHIPS[i];

    let unlocked =
      sdUnlockedLevel >=
      ship.unlock;

    let selected =
      sdSelectedShip === i;

    rectMode(CENTER);

    stroke(
      selected
        ? color(255, 220, 65)
        : unlocked
          ? color(70, 155, 185)
          : color(60)
    );

    strokeWeight(
      selected ? 2.5 : 1.3
    );

    fill(
      unlocked
        ? color(6, 19, 32)
        : color(16, 17, 23)
    );

    rect(
      width / 2,
      y,
      cardW,
      cardH,
      14
    );

    if (unlocked) {

      sdDrawArchiveShip(
        width / 2 -
        cardW * 0.31,
        y,
        i,
        0.85
      );

      textAlign(LEFT, CENTER);

      fill(245);

      textStyle(BOLD);

      textSize(13);

      text(
        ship.name,
        width / 2 -
        cardW * 0.05,
        y - 40
      );

      fill(255, 215, 70);

      textSize(10);

      text(
        ship.power,
        width / 2 -
        cardW * 0.05,
        y - 14
      );

      fill(165);

      textStyle(NORMAL);

      textSize(9);

      text(
        ship.desc,
        width / 2 -
        cardW * 0.05,
        y + 10
      );

      fill(
        selected
          ? color(255, 220, 65)
          : color(95, 185, 215)
      );

      textStyle(BOLD);

      textSize(9);

      text(
        selected
          ? "SELECTED"
          : "TAP TO SELECT",
        width / 2 -
        cardW * 0.05,
        y + 38
      );

    } else {

      sdDrawArchiveShip(
        width / 2,
        y - 5,
        i,
        0.65
      );

      textAlign(CENTER, CENTER);

      fill(135);

      textStyle(BOLD);

      textSize(10);

      text(
        "LOCKED • LEVEL " +
        ship.unlock,
        width / 2,
        y + 48
      );
    }
  }

  drawingContext.restore();

  pop();

  if (maxScroll > 0) {

    let barH =
      max(
        35,
        viewportHeight *
        (viewportHeight /
          contentHeight)
      );

    let barTravel =
      viewportHeight -
      barH;

    let barY =
      viewportTop +
      barTravel *
      (sdArchiveScroll /
        maxScroll);

    noStroke();

    fill(
      80,
      160,
      190,
      130
    );

    rect(
      width - 9,
      barY,
      4,
      barH,
      2
    );
  }

  sdHomeBottomButton();
}


// ================================================================
// ARCHIVE SHIP DRAW
// ================================================================

function sdDrawArchiveShip(
  x,
  y,
  index,
  scaleValue
) {

  let d =
    SD_SHIPS[index];

  push();

  translate(x, y);

  scale(scaleValue);

  stroke(d.edge);

  strokeWeight(2.5);

  fill(d.body);

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

  fill(d.core);

  ellipse(
    0,
    -4,
    12,
    20
  );

  fill(d.edge);

  triangle(
    -7,
    25,
    7,
    25,
    0,
    38
  );

  pop();
}


// ================================================================
// ABOUT
// ================================================================

function sdDrawAbout() {

  textAlign(CENTER, CENTER);

  fill(225, 245, 255);

  textStyle(BOLD);

  textSize(30);

  text(
    "ABOUT",
    width / 2,
    height * 0.18
  );

  fill(170);

  textStyle(NORMAL);

  textSize(14);

  text(
    "Developed by",
    width / 2,
    height * 0.34
  );

  fill(255, 220, 70);

  textStyle(BOLD);

  textSize(
    min(23, width * 0.06)
  );

  text(
    "Aazad S Rana",
    width / 2,
    height * 0.42
  );

  fill(175);

  textStyle(NORMAL);

  textSize(12);

  text(
    "Space Dodger • Galactic Campaign",
    width / 2,
    height * 0.51
  );

  fill(125);

  textSize(11);

  text(
    "20 levels • Alien invasion • Boss battles",
    width / 2,
    height * 0.57
  );

  text(
    "Built for mobile arcade gameplay.",
    width / 2,
    height * 0.62
  );

  sdHomeBottomButton();
}


// ================================================================
// SETTINGS
// ================================================================

function sdDrawSettings() {

  textAlign(CENTER, CENTER);

  fill(225, 245, 255);

  textStyle(BOLD);

  textSize(29);

  text(
    "SETTINGS",
    width / 2,
    height * 0.15
  );

  sdSettingBox(
    "CONTROL LAYOUT",
    sdControlsSwapped
      ? "FIRE LEFT  •  MOVE RIGHT"
      : "MOVE LEFT  •  FIRE RIGHT",
    height * 0.33,
    0
  );

  sdSettingBox(
    "SOUND",
    sdSound ? "ON" : "OFF",
    height * 0.49,
    1
  );

  fill(125);

  textStyle(NORMAL);

  textSize(11);

  text(
    "Tap a panel to change its setting.",
    width / 2,
    height * 0.63
  );

  sdHomeBottomButton();
}


function sdSettingBox(
  title,
  value,
  y,
  index
) {

  let w =
    min(340, width * 0.84);

  rectMode(CENTER);

  stroke(
    sdMenuPressed === index
      ? color(220, 245, 255)
      : color(65, 150, 180)
  );

  strokeWeight(1.6);

  fill(6, 22, 37);

  rect(
    width / 2,
    y,
    w,
    82,
    14
  );

  noStroke();

  fill(145);

  textStyle(BOLD);

  textSize(11);

  text(
    title,
    width / 2,
    y - 18
  );

  fill(245);

  textSize(15);

  text(
    value,
    width / 2,
    y + 14
  );
}


// ================================================================
// RATING
// ================================================================

function sdDrawRating() {

  textAlign(CENTER, CENTER);

  fill(225, 245, 255);

  textStyle(BOLD);

  textSize(27);

  text(
    "RATE SPACE DODGER",
    width / 2,
    height * 0.24
  );

  fill(155);

  textStyle(NORMAL);

  textSize(13);

  text(
    "HOW WAS YOUR EXPERIENCE?",
    width / 2,
    height * 0.32
  );

  let gap =
    min(53, width * 0.13);

  let total =
    gap * 4;

  for (
    let i = 1;
    i <= 5;
    i++
  ) {

    let x =
      width / 2 -
      total / 2 +
      (i - 1) * gap;

    fill(
      i <= sdRating
        ? color(255, 215, 50)
        : color(65)
    );

    textSize(39);

    text(
      "★",
      x,
      height * 0.45
    );
  }

  fill(245);

  textStyle(BOLD);

  textSize(16);

  text(
    sdRating + " / 5",
    width / 2,
    height * 0.55
  );

  sdActionButton(
    "SUBMIT",
    height * 0.65,
    250
  );

  sdActionButton(
    "CANCEL",
    height * 0.75,
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

  sdLevelStart = millis();

  sdLastAlien = millis();
  sdLastPower = millis();
  sdLastShot = 0;

  sdAliens = [];
  sdBullets = [];
  sdEnemyShots = [];
  sdPowerUps = [];
  sdParticles = [];

  sdBoss = null;
  sdBossActive = false;
  sdBossDefeated = false;

  sdResetPowers();

  sdShip =
    new SDShip();

  sdResetControls();

  sdPowerReadyAt =
    millis() + 3000;

  sdState = "PLAYING";

  sdTone(
    350,
    700,
    0.22,
    "sine",
    0.025
  );
}


// ================================================================
// PLAYER SHIP
// ================================================================

class SDShip {

  constructor() {

    this.x = width / 2;
    this.y = height * 0.68;

    this.angle = -HALF_PI;

    this.radius = 17;

    this.invincibleUntil = 0;
  }


  update() {

    // Screen wrapping.
    if (this.x < -40)
      this.x = width + 40;

    if (this.x > width + 40)
      this.x = -40;

    if (this.y < -40)
      this.y = height + 40;

    if (this.y > height + 40)
      this.y = -40;
  }


  display() {

    if (
      millis() <
      this.invincibleUntil &&
      floor(millis() / 90) % 2 === 0
    ) {
      return;
    }

    let d =
      SD_SHIPS[
        sdSelectedShip
      ];

    let scaleValue = 1;

    if (sdSelectedShip === 8)
      scaleValue = 1.15;

    if (sdSelectedShip === 9)
      scaleValue = 1.2;

    push();

    translate(
      this.x,
      this.y
    );

    rotate(
      this.angle + HALF_PI
    );

    scale(scaleValue);

    // No heavy glow.
    stroke(d.edge);

    strokeWeight(2.2);

    fill(d.body);

    beginShape();

    vertex(0, -32);
    vertex(-11, -9);
    vertex(-29, 17);
    vertex(-9, 12);
    vertex(0, 23);
    vertex(9, 12);
    vertex(29, 17);
    vertex(11, -9);

    endShape(CLOSE);

    noStroke();

    fill(d.core);

    ellipse(
      0,
      -5,
      9,
      16
    );

    fill(d.edge);

    triangle(
      -5,
      17,
      5,
      17,
      0,
      29
    );

    pop();

    if (sdHasShield()) {

      sdDrawShield(
        this.x,
        this.y
      );
    }
  }
}


// ================================================================
// SHIP POWER
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
  ) {
    mult = 1.12;
  }

  if (
    sdShipPower() === "DRAGON RAGE" &&
    sdBossActive
  ) {
    mult = 1.75;
  }

  if (
    sdShipPower() === "TITAN CORE"
  ) {
    mult = 1.65;
  }

  if (
    sdShipPower() === "REALITY BREAK"
  ) {
    mult = 2.1;
  }

  if (
    millis() <
    sdPowerEnds.BERSERKER
  ) {
    mult *= 1.55;
  }

  return mult;
}


function sdShipFireDelay() {

  let delay = 155;

  if (
    sdShipPower() === "QUANTUM DASH"
  ) {
    delay = 85;
  }

  if (
    sdShipPower() === "TITAN CORE"
  ) {
    delay = 105;
  }

  if (
    sdShipPower() === "REALITY BREAK"
  ) {
    delay = 75;
  }

  if (
    millis() <
    sdPowerEnds.BERSERKER
  ) {
    delay = 70;
  }

  if (
    millis() <
    sdPowerEnds.CRYO
  ) {
    delay = 125;
  }

  return delay;
}


function sdShipMoveSpeed() {

  let speed = 5;

  if (
    sdShipPower() === "QUANTUM DASH"
  ) {
    speed *= 1.35;
  }

  if (
    sdShipPower() === "TITAN CORE"
  ) {
    speed *= 0.9;
  }

  if (
    sdShipPower() === "REALITY BREAK"
  ) {
    speed *= 1.2;
  }

  return speed;
}


// ================================================================
// SHIELD
// ================================================================

function sdDrawShield(x, y) {

  noFill();

  stroke(
    70,
    210,
    245,
    150
  );

  strokeWeight(2);

  circle(
    x,
    y,
    66 +
    sin(frameCount * 0.08) * 4
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
    max(sdShake, amount);
}


function sdUpdateShake() {

  if (sdShake <= 0)
    return;

  sdShake *= 0.86;

  if (sdShake < 0.25)
    sdShake = 0;
}


// ================================================================
// PLAYER BULLET
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
      11 +
      power * 0.8;

    this.radius =
      4 +
      power;

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
    ) c = "#ff3455";

    if (
      sdShipPower() === "TIME FREEZE"
    ) c = "#8cecff";

    if (
      sdShipPower() === "REALITY BREAK"
    ) c = "#ffd84a";

    stroke(c);

    strokeWeight(
      2.5 +
      this.power
    );

    line(
      this.x,
      this.y,
      this.x -
      cos(this.angle) * 15,
      this.y -
      sin(this.angle) * 15
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
    copies = [-22, 0, 22];
  }

  else if (
    now <
    sdPowerEnds.TWIN
  ) {
    copies = [-17, 17];
  }

  let angles = [
    sdShip.angle
  ];

  if (
    now <
    sdPowerEnds.MULTI
  ) {

    angles = [
      sdShip.angle - radians(12),
      sdShip.angle,
      sdShip.angle + radians(12)
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
      sdShip.angle - radians(20),
      sdShip.angle - radians(10),
      sdShip.angle,
      sdShip.angle + radians(10),
      sdShip.angle + radians(20)
    ];
  }

  for (let off of copies) {

    let sx =
      sdShip.x +
      cos(
        sdShip.angle + HALF_PI
      ) *
      off;

    let sy =
      sdShip.y +
      sin(
        sdShip.angle + HALF_PI
      ) *
      off;

    for (let a of angles) {

      sdBullets.push(
        new SDBullet(
          sx +
          cos(a) * 27,
          sy +
          sin(a) * 27,
          a,
          sdShipDamageMultiplier()
        )
      );
    }
  }

  sdTone(
    800,
    1000,
    0.05,
    "square",
    0.014
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

    let b =
      sdBullets[i];

    b.update();

    if (b.dead()) {

      sdBullets.splice(i, 1);

    } else {

      b.display();
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
      this.y = -70;

    } else if (side === 1) {

      this.x = width + 70;
      this.y =
        random(
          height * 0.16,
          height * 0.75
        );

    } else if (side === 2) {

      this.x = random(width);
      this.y = height + 70;

    } else {

      this.x = -70;
      this.y =
        random(
          height * 0.16,
          height * 0.75
        );
    }

    this.radius = 22;
    this.hp = 1;

    if (this.type === "INTERCEPTOR") {
      this.radius = 20;
      this.hp = 1;
    }

    if (this.type === "HUNTER") {
      this.radius = 24;
      this.hp = 2;
    }

    if (this.type === "HEAVY") {
      this.radius = 32;
      this.hp = 4;
    }

    if (this.type === "ELITE") {
      this.radius = 29;
      this.hp = 3;
    }

    this.speed =
      random(1.35, 2.15) *
      sdDifficulty(
        sdCurrentLevel
      );

    if (
      this.type === "INTERCEPTOR"
    ) {
      this.speed *= 1.35;
    }

    if (
      this.type === "HEAVY"
    ) {
      this.speed *= 0.65;
    }

    this.phase =
      random(TWO_PI);

    this.rot =
      random(TWO_PI);

    this.rotSpeed =
      random(-0.025, 0.025);

    this.lastShot =
      millis() +
      random(1200, 3000);
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

    let speed =
      this.speed;

    if (
      sdShipPower() === "GRAVITY PULSE"
    ) {
      speed *= 0.35;
    }

    if (
      sdShipPower() === "TIME FREEZE"
    ) {
      speed *= 0.28;
    }

    if (
      millis() <
      sdPowerEnds.CRYO
    ) {
      speed *= 0.45;
    }

    if (
      this.type === "INTERCEPTOR"
    ) {

      angle +=
        sin(
          frameCount * 0.045 +
          this.phase
        ) *
        0.55;
    }

    if (
      this.type === "HUNTER"
    ) {

      angle +=
        sin(
          frameCount * 0.025 +
          this.phase
        ) *
        0.18;
    }

    if (
      this.type === "ELITE"
    ) {

      angle +=
        sin(
          frameCount * 0.035 +
          this.phase
        ) *
        0.28;
    }

    this.x +=
      cos(angle) *
      speed;

    this.y +=
      sin(angle) *
      speed;

    this.rot +=
      this.rotSpeed;

    if (
      this.type === "HUNTER" ||
      this.type === "ELITE"
    ) {

      if (
        millis() -
        this.lastShot >
        max(
          1500,
          2700 -
          sdCurrentLevel * 28
        )
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
          ? 4.2
          : 3.0
      )
    );
  }


  display() {

    push();

    translate(
      this.x,
      this.y
    );

    rotate(this.rot);

    if (
      this.type === "SCOUT"
    ) {

      sdAlienScout();

    } else if (
      this.type === "INTERCEPTOR"
    ) {

      sdAlienInterceptor();

    } else if (
      this.type === "HUNTER"
    ) {

      sdAlienHunter();

    } else if (
      this.type === "HEAVY"
    ) {

      sdAlienHeavy();

    } else {

      sdAlienElite();
    }

    pop();
  }


  dead() {

    return (
      this.x < -160 ||
      this.x > width + 160 ||
      this.y < -160 ||
      this.y > height + 160
    );
  }
}


// ================================================================
// ALIEN VISUALS
// Proper alien silhouettes — no generic triangles.
// ================================================================

function sdAlienScout() {

  // Classic flying-saucer alien craft.

  stroke("#66dff5");
  strokeWeight(2);

  fill("#183f58");

  ellipse(
    0,
    5,
    48,
    20
  );

  ellipse(
    0,
    -2,
    28,
    18
  );

  noStroke();

  fill("#bdfaff");

  ellipse(
    0,
    -3,
    10,
    7
  );

  fill("#4de5ff");

  circle(-15, 6, 4);
  circle(0, 9, 4);
  circle(15, 6, 4);
}


function sdAlienInterceptor() {

  // Fast insect / manta-like alien craft.

  stroke("#f05bcf");
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

  fill("#ffd9f7");

  ellipse(
    0,
    -2,
    9,
    14
  );

  fill("#ff6de0");

  circle(-22, -4, 5);
  circle(22, -4, 5);
}


function sdAlienHunter() {

  // Organic predator-like ship.

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

  ellipse(
    0,
    -2,
    13,
    18
  );

  fill("#ff9c38");

  circle(-18, -8, 4);
  circle(18, -8, 4);
}


function sdAlienHeavy() {

  // Armored alien cruiser.

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

  stroke("#8c2b31");
  strokeWeight(2);

  line(-27, -3, -10, 7);
  line(27, -3, 10, 7);

  noStroke();

  fill("#ffb4b4");

  ellipse(
    0,
    -4,
    15,
    20
  );

  fill("#ff5555");

  circle(-20, 10, 5);
  circle(20, 10, 5);
}


function sdAlienElite() {

  // Advanced alien crystal / command craft.

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

  ellipse(
    0,
    -5,
    12,
    18
  );

  fill("#c879ff");

  circle(-19, -8, 4);
  circle(19, -8, 4);
}


// ================================================================
// ALIEN SPAWN
// ================================================================

function sdSpawnAliens() {

  if (sdBossActive)
    return;

  let delay =
    max(
      470,
      1100 -
      sdCurrentLevel * 32
    );

  if (
    millis() -
    sdLastAlien >
    delay
  ) {

    let count = 1;

    if (
      sdCurrentLevel >= 7 &&
      random() < 0.17
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

    let a =
      sdAliens[i];

    a.update();

    if (a.dead()) {

      sdAliens.splice(i, 1);

    } else {

      a.display();
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

    this.radius = 7;

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
      70,
      90
    );

    strokeWeight(3);

    line(
      this.x,
      this.y,
      this.x -
      cos(this.angle) * 11,
      this.y -
      sin(this.angle) * 11
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

    let s =
      sdEnemyShots[i];

    s.update();

    if (s.dead()) {

      sdEnemyShots.splice(i, 1);

    } else {

      s.display();
    }
  }
}


// ================================================================
// BULLET / ALIEN COLLISION
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
          4,
          SD_SHIPS[
            sdSelectedShip
          ].edge
        );

        if (
          alien.hp <= 0
        ) {

          let points = 30;

          if (
            alien.type === "HUNTER"
          ) points = 45;

          if (
            alien.type === "HEAVY"
          ) points = 70;

          if (
            alien.type === "ELITE"
          ) points = 100;

          sdScore += points;
          sdLevelScore += points;

          sdCreateExplosion(
            alien.x,
            alien.y,
            alien.type === "HEAVY"
              ? 32
              : 22,
            SD_SHIPS[
              sdSelectedShip
            ].edge
          );

          sdStartShake(
            alien.type === "HEAVY"
              ? 7
              : 3
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
  ) {
    return;
  }

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

      if (sdHasShield()) {

        sdCreateExplosion(
          a.x,
          a.y,
          22,
          "#00cfff"
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
  ) {
    return;
  }

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

      if (sdHasShield()) {

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

  sdStartShake(11);

  sdTone(
    180,
    55,
    0.25,
    "sawtooth",
    0.04
  );

  if (sdLives <= 0) {

    sdState = "GAMEOVER";

    sdCreateExplosion(
      sdShip.x,
      sdShip.y,
      60
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

    this.radius = 22;

    this.life = 850;

    this.rot = 0;
  }


  update() {

    this.rot += 0.035;

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

    strokeWeight(2);

    fill(
      red(cfg.color),
      green(cfg.color),
      blue(cfg.color),
      35
    );

    circle(
      0,
      0,
      44
    );

    noStroke();

    fill(245);

    textAlign(
      CENTER,
      CENTER
    );

    textStyle(BOLD);

    textSize(9);

    text(
      cfg.label,
      0,
      0
    );

    pop();
  }
}


function sdPowerConfig(type) {

  const data = {

    MULTI: {
      color: "#ffe600",
      label: "M"
    },

    SHIELD: {
      color: "#00cfff",
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
      color: "#ff3455",
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

    let p =
      sdPowerUps[i];

    p.update();

    if (p.life <= 0) {

      sdPowerUps.splice(i, 1);

    } else {

      p.display();
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
        22,
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

  if (type === "NOVA") {

    for (
      let i = sdAliens.length - 1;
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

      sdScore += 20;
      sdLevelScore += 20;
    }

    sdStartShake(14);
  }

  if (type === "TWIN") {
    sdPowerEnds.TRINITY = 0;
  }

  if (type === "TRINITY") {
    sdPowerEnds.TWIN = 0;
  }

  sdTone(
    300,
    1100,
    0.3,
    "sine",
    0.035
  );
}


// ================================================================
// BOSS
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

      this.y += 1.2;

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

    for (let d of spread) {

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
  }


  display() {

    let edge =
      this.phase === 3
        ? "#ff304d"
        : "#ff8238";

    let body =
      this.phase === 3
        ? "#65101b"
        : "#52180e";

    push();

    translate(
      this.x,
      this.y
    );

    stroke(edge);

    strokeWeight(3.5);

    fill(body);

    // Left wing
    beginShape();

    vertex(-25, -4);
    vertex(-95, -45);
    vertex(-65, 5);
    vertex(-105, 38);
    vertex(-30, 25);

    endShape(CLOSE);

    // Right wing
    beginShape();

    vertex(25, -4);
    vertex(95, -45);
    vertex(65, 5);
    vertex(105, 38);
    vertex(30, 25);

    endShape(CLOSE);

    // Body
    ellipse(
      0,
      8,
      92,
      120
    );

    beginShape();

    vertex(0, -75);
    vertex(-38, -38);
    vertex(-28, 10);
    vertex(0, 31);
    vertex(28, 10);
    vertex(38, -38);

    endShape(CLOSE);

    noStroke();

    fill(
      this.phase === 3
        ? "#ff1744"
        : "#fff05a"
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

  if (
    !sdIsBossLevel(
      sdCurrentLevel
    ) ||
    sdBossActive ||
    sdBossDefeated
  ) {
    return;
  }

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

    sdStartShake(15);

    sdTone(
      50,
      120,
      0.8,
      "sawtooth",
      0.04
    );
  }
}


function sdUpdateBoss() {

  if (!sdBoss)
    return;

  sdBoss.update();

  sdBoss.display();

  sdDrawBossHealth();

  if (
    sdBoss.hp <= 0
  ) {

    let reward =
      1000 +
      sdCurrentLevel * 100;

    sdScore += reward;
    sdLevelScore += reward;

    sdCreateExplosion(
      sdBoss.x,
      sdBoss.y,
      100,
      "#ff6735"
    );

    sdStartShake(24);

    sdEnemyShots = [];

    sdBoss = null;

    sdBossActive = false;

    sdBossDefeated = true;

    sdTone(
      100,
      900,
      0.8,
      "sine",
      0.05
    );
  }
}


function sdDrawBossHealth() {

  if (!sdBoss)
    return;

  let w =
    min(
      330,
      width * 0.74
    );

  let x =
    width / 2 -
    w / 2;

  let y = 91;

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

  fill(255, 120, 90);

  textStyle(BOLD);

  textSize(12);

  text(
    "METEOR DRAGON  •  PHASE " +
    sdBoss.phase,
    width / 2,
    y - 7
  );

  noStroke();

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
    4
  );

  fill(
    235,
    70,
    55
  );

  rect(
    x,
    y,
    w * ratio,
    9,
    4
  );
}


// ================================================================
// BULLET / BOSS
// ================================================================

function sdCollideBulletsBoss() {

  if (
    !sdBossActive ||
    !sdBoss
  ) {
    return;
  }

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
        3,
        "#ff9a40"
      );

      sdStartShake(1.5);
    }
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

  let bossDone =
    !sdIsBossLevel(
      sdCurrentLevel
    ) ||
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
  ) {
    return;
  }

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

  sdStartShake(8);

  sdPlayVictory();
}


// ================================================================
// LEVEL UP
// ================================================================

function sdDrawLevelUp() {

  noStroke();

  fill(
    2,
    6,
    20,
    238
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

  fill(255, 220, 55);

  textStyle(BOLD);

  textSize(
    min(33, width * 0.082)
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

  fill(245);

  textSize(18);

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

    fill(90, 205, 235);

    textSize(15);

    text(
      "NEW LEVEL UNLOCKED",
      width / 2,
      height * 0.49
    );

    fill(245);

    textSize(22);

    text(
      "LEVEL " +
      (sdCurrentLevel + 1),
      width / 2,
      height * 0.55
    );

    fill(255, 220, 60);

    textSize(14);

    text(
      SD_LEVEL_TITLES[
        sdCurrentLevel
      ],
      width / 2,
      height * 0.61
    );

  } else {

    fill(180);

    textSize(16);

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

  fill(255, 75, 85);

  textStyle(BOLD);

  textSize(36);

  text(
    "MISSION LOST",
    width / 2,
    height * 0.28
  );

  fill(245);

  textSize(17);

  text(
    "LEVEL " +
    sdCurrentLevel,
    width / 2,
    height * 0.38
  );

  fill(255, 220, 50);

  textSize(14);

  text(
    SD_LEVEL_TITLES[
      sdCurrentLevel - 1
    ],
    width / 2,
    height * 0.43
  );

  sdActionButton(
    "RETRY LEVEL",
    height * 0.55,
    280
  );

  sdActionButton(
    "HOME",
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
  ) {
    return;
  }

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
    sdBoss
  ) {

    sdBoss.lastAttack +=
      paused;
  }

  sdState = "PLAYING";
}


function sdDrawFrozen() {

  if (sdShip)
    sdShip.display();

  for (let a of sdAliens)
    a.display();

  for (let b of sdBullets)
    b.display();

  for (let p of sdPowerUps)
    p.display();

  for (let s of sdEnemyShots)
    s.display();

  if (sdBoss)
    sdBoss.display();

  sdDrawHUD();
}


// ================================================================
// PAUSE SCREEN
// ================================================================

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

  fill(245);

  textStyle(BOLD);

  textSize(38);

  text(
    "PAUSED",
    width / 2,
    height * 0.30
  );

  fill(90, 200, 230);

  textSize(14);

  text(
    "LEVEL " +
    sdCurrentLevel +
    "  •  " +
    SD_LEVEL_TITLES[
      sdCurrentLevel - 1
    ],
    width / 2,
    height * 0.38
  );

  sdActionButton(
    "RESUME",
    height * 0.53,
    270
  );

  sdActionButton(
    "HOME",
    height * 0.64,
    240
  );
}


// ================================================================
// HUD
// Clean, no unnecessary glow.
// ================================================================

function sdDrawHUD() {

  textStyle(BOLD);

  // Score
  textAlign(
    LEFT,
    TOP
  );

  fill(240);

  textSize(14);

  text(
    "SCORE  " +
    sdScore,
    14,
    12
  );

  // Lives
  textAlign(
    RIGHT,
    TOP
  );

  fill(240);

  text(
    "LIVES  " +
    sdLives,
    width - 14,
    12
  );

  // Level
  textAlign(
    CENTER,
    TOP
  );

  fill(215, 240, 250);

  textSize(14);

  text(
    "LEVEL " +
    sdCurrentLevel,
    width / 2,
    12
  );

  fill(150, 185, 200);

  textStyle(NORMAL);

  textSize(9);

  text(
    SD_LEVEL_TITLES[
      sdCurrentLevel - 1
    ],
    width / 2,
    32
  );

  let w =
    min(
      300,
      width * 0.72
    );

  let x =
    width / 2 -
    w / 2;

  let y = 56;

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

  // SURVIVAL BAR
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

  fill(80, 170, 205);

  rect(
    x,
    y,
    w * timeRatio,
    7,
    3
  );

  // SCORE BAR
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

  fill(220, 180, 60);

  rect(
    x,
    y + 18,
    w * scoreRatio,
    7,
    3
  );

  // Small labels only.
  fill(140, 170, 180);

  textSize(9);

  text(
    "SURVIVAL  " +
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
    " SEC",
    width / 2,
    y + 31
  );

  text(
    "SCORE  " +
    sdLevelScore +
    " / " +
    sdTargetScore,
    width / 2,
    y + 45
  );

  // Top controls.
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
}


// ================================================================
// GAME CONTROLS
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

  let movement = null;

  let firing = false;

  for (let t of touches) {

    if (
      dist(
        t.x,
        t.y,
        sdFire.x,
        sdFire.y
      ) <
      sdFire.radius + 18
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
      t.y > height * 0.40
    ) {

      movement = t;
    }
  }

  if (firing) {
    sdShoot();
  }

  if (movement) {

    if (!sdJoystick.active) {

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
        atan2(dy, dx);

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
  ) {
    return;
  }

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

  if (mag < 4)
    return;

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


// ================================================================
// CONTROL DISPLAY
// ================================================================

function sdDrawControls() {

  let y =
    height -
    sdSafeBottom;

  // MOVE
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
    sdJoystick.baseX,
    y,
    sdJoystick.radius * 2
  );

  fill(
    70,
    190,
    220,
    90
  );

  circle(
    sdJoystick.knobX,
    sdJoystick.knobY,
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
    sdFire.x,
    y,
    sdFire.radius * 2
  );

  noStroke();

  fill(245);

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(BOLD);

  textSize(13);

  text(
    "FIRE",
    sdFire.x,
    y
  );

  // POWER
  if (
    sdPowerReadyAt <= millis()
  ) {

    stroke(
      220,
      185,
      55,
      160
    );

    fill(
      200,
      150,
      20,
      30
    );

    circle(
      sdPowerButton.x,
      y,
      sdPowerButton.radius * 2
    );

    noStroke();

    fill(245);

    textSize(9);

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
    65,
    145,
    175
  );

  strokeWeight(1.5);

  fill(
    5,
    22,
    36,
    235
  );

  circle(
    x,
    y,
    43
  );

  noStroke();

  fill(245);

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(BOLD);

  textSize(17);

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
    65,
    150,
    180
  );

  strokeWeight(1.5);

  fill(
    5,
    20,
    34
  );

  rect(
    width / 2,
    y,
    w,
    48,
    12
  );

  noStroke();

  fill(235);

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(BOLD);

  textSize(14);

  text(
    "HOME",
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
    65,
    150,
    180
  );

  strokeWeight(1.5);

  fill(
    5,
    23,
    38
  );

  rect(
    width / 2,
    y,
    min(
      w,
      width * 0.80
    ),
    52,
    12
  );

  noStroke();

  fill(245);

  textAlign(
    CENTER,
    CENTER
  );

  textStyle(BOLD);

  textSize(14);

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
      random(1, 6);

    this.vx =
      cos(a) * speed;

    this.vy =
      sin(a) * speed;

    this.life = 230;

    this.size =
      random(2, 6);

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

    let p =
      sdParticles[i];

    p.update();
    p.display();

    if (
      p.life <= 0
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
    i < 80;
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
    sdAudio.state === "suspended"
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
  ) {
    return;
  }

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
    0.14,
    "sawtooth",
    0.03
  );
}


function sdPlayVictory() {

  sdTone(
    400,
    600,
    0.16,
    "sine",
    0.035
  );

  setTimeout(
    function() {

      sdTone(
        600,
        850,
        0.16,
        "sine",
        0.035
      );

    },
    170
  );

  setTimeout(
    function() {

      sdTone(
        850,
        1300,
        0.25,
        "sine",
        0.04
      );

    },
    340
  );
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

  if (
    sdState === "ARCHIVE"
  ) {

    sdArchiveDragging = false;
    sdArchiveLastY = y;
  }

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

      let delta =
        sdArchiveLastY -
        y;

      if (
        abs(delta) > 0
      ) {

        sdArchiveTarget +=
          delta * 1.25;

        sdArchiveDragging = true;
      }

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
// UNIVERSAL TAP ROUTER
// This is the important menu fix.
// Every screen uses explicit rectangular hit zones.
// ================================================================

function sdHandleTap(
  x,
  y
) {

  // ------------------------------------------------------------
  // HOME
  // ------------------------------------------------------------

  if (
    sdState === "HOME"
  ) {

    let buttons = [
      height * 0.32,
      height * 0.43,
      height * 0.54,
      height * 0.65,
      height * 0.76
    ];

    for (
      let i = 0;
      i < buttons.length;
      i++
    ) {

      if (
        sdPointInRect(
          x,
          y,
          width / 2,
          buttons[i],
          min(320, width * 0.80),
          70
        )
      ) {

        sdMenuPressed =
          i;

        sdMenuPressTime =
          millis();

        if (i === 0) {

          sdState = "LEVELS";

        } else if (i === 1) {

          sdState = "ARCHIVE";

          sdArchiveScroll = 0;
          sdArchiveTarget = 0;

        } else if (i === 2) {

          sdState = "ABOUT";

        } else if (i === 3) {

          sdState = "SETTINGS";

        } else if (i === 4) {

          sdRating = 0;
          sdState = "RATING";
        }

        sdMenuPressed = -1;

        return;
      }
    }

    return;
  }


  // ------------------------------------------------------------
  // COMMON HOME BUTTON
  // ------------------------------------------------------------

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
      sdPointInRect(
        x,
        y,
        width / 2,
        homeY,
        min(210, width * 0.60),
        68
      )
    ) {

      sdState = "HOME";

      return;
    }
  }


  // ------------------------------------------------------------
  // LEVEL SELECT
  // ------------------------------------------------------------

  if (
    sdState === "LEVELS"
  ) {

    let cols = 4;

    let gap = 9;

    let size =
      min(
        66,
        (width - 48) / cols
      );

    let startY = 140;

    let totalWidth =
      cols * size +
      (cols - 1) * gap;

    let startX =
      width / 2 -
      totalWidth / 2 +
      size / 2;

    for (
      let i = 1;
      i <= SD_TOTAL_LEVELS;
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
        (size + 15);

      if (
        sdPointInRect(
          x,
          y,
          bx,
          by,
          size + 12,
          size + 12
        )
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
            0.12,
            "square",
            0.02
          );
        }

        return;
      }
    }

    return;
  }


  // ------------------------------------------------------------
  // ARCHIVE
  // ------------------------------------------------------------

  if (
    sdState === "ARCHIVE"
  ) {

    if (
      sdArchiveDragging
    ) {
      return;
    }

    let cardW =
      min(
        355,
        width * 0.89
      );

    let cardH = 145;

    let gap = 15;

    let top = 100;

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
        sdPointInRect(
          x,
          y,
          width / 2,
          cy,
          cardW + 12,
          cardH + 12
        )
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
            0.2,
            "sine",
            0.025
          );
        }

        return;
      }
    }

    return;
  }


  // ------------------------------------------------------------
  // SETTINGS
  // ------------------------------------------------------------

  if (
    sdState === "SETTINGS"
  ) {

    if (
      sdPointInRect(
        x,
        y,
        width / 2,
        height * 0.33,
        min(350, width * 0.88),
        100
      )
    ) {

      sdControlsSwapped =
        !sdControlsSwapped;

      sdResetControls();

      sdSave();

      sdMenuPressed = 0;
      sdMenuPressTime = millis();

      return;
    }

    if (
      sdPointInRect(
        x,
        y,
        width / 2,
        height * 0.49,
        min(350, width * 0.88),
        100
      )
    ) {

      sdSound =
        !sdSound;

      sdSave();

      if (sdSound) {

        sdTone(
          400,
          800,
          0.18,
          "sine",
          0.035
        );
      }

      sdMenuPressed = 1;
      sdMenuPressTime = millis();

      return;
    }

    return;
  }


  // ------------------------------------------------------------
  // RATING
  // ------------------------------------------------------------

  if (
    sdState === "RATING"
  ) {

    let gap =
      min(
        53,
        width * 0.13
      );

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
          height * 0.45
        ) < 35
      ) {

        sdRating =
          i;

        sdTone(
          450,
          850,
          0.12,
          "sine",
          0.025
        );

        return;
      }
    }

    if (
      sdPointInRect(
        x,
        y,
        width / 2,
        height * 0.65,
        280,
        68
      )
    ) {

      sdTone(
        500,
        900,
        0.18,
        "sine",
        0.03
      );

      sdState =
        "HOME";

      return;
    }

    if (
      sdPointInRect(
        x,
        y,
        width / 2,
        height * 0.75,
        280,
        68
      )
    ) {

      sdState =
        "HOME";

      return;
    }

    return;
  }


  // ------------------------------------------------------------
  // PLAYING
  // ------------------------------------------------------------

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

    return;
  }


  // ------------------------------------------------------------
  // PAUSED
  // ------------------------------------------------------------

  if (
    sdState === "PAUSED"
  ) {

    if (
      sdPointInRect(
        x,
        y,
        width / 2,
        height * 0.53,
        300,
        70
      )
    ) {

      sdResumeGame();

      return;
    }

    if (
      sdPointInRect(
        x,
        y,
        width / 2,
        height * 0.64,
        270,
        70
      )
    ) {

      sdState =
        "HOME";

      return;
    }

    return;
  }


  // ------------------------------------------------------------
  // GAME OVER
  // ------------------------------------------------------------

  if (
    sdState === "GAMEOVER"
  ) {

    if (
      sdPointInRect(
        x,
        y,
        width / 2,
        height * 0.55,
        300,
        70
      )
    ) {

      sdStartLevel(
        sdCurrentLevel
      );

      return;
    }

    if (
      sdPointInRect(
        x,
        y,
        width / 2,
        height * 0.66,
        270,
        70
      )
    ) {

      sdState =
        "HOME";

      return;
    }
  }
}


// ================================================================
// RECTANGLE HIT TEST
// ================================================================

function sdPointInRect(
  px,
  py,
  cx,
  cy,
  w,
  h
) {

  return (
    px >= cx - w / 2 &&
    px <= cx + w / 2 &&
    py >= cy - h / 2 &&
    py <= cy + h / 2
  );
}


// ================================================================
// SPECIAL SHIP ABILITIES
// ================================================================

function sdUseShipSpecial() {

  if (
    sdPowerReadyAt >
    millis()
  ) {
    return;
  }

  let p =
    sdShipPower();

  if (
    p === "BURN SHOT"
  ) {

    sdPowerEnds.BERSERKER =
      millis() + 5000;

  } else if (
    p === "GRAVITY PULSE"
  ) {

    for (
      let a of sdAliens
    ) {
      a.speed *= 0.3;
    }

    sdPowerEnds.CRYO =
      millis() + 4500;

  } else if (
    p === "TIME FREEZE"
  ) {

    sdPowerEnds.CRYO =
      millis() + 6500;

  } else if (
    p === "PHASE DODGE"
  ) {

    sdShip.invincibleUntil =
      millis() + 4500;

  } else if (
    p === "DRAGON RAGE"
  ) {

    sdPowerEnds.BERSERKER =
      millis() + 6500;

  } else if (
    p === "QUANTUM DASH"
  ) {

    sdShip.invincibleUntil =
      millis() + 2200;

    sdPowerEnds.BERSERKER =
      millis() + 5000;

  } else if (
    p === "HOLY SHIELD"
  ) {

    sdPowerEnds.SHIELD =
      millis() + 7000;

  } else if (
    p === "TITAN CORE"
  ) {

    sdPowerEnds.BERSERKER =
      millis() + 6500;

  } else if (
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
        15
      );

      sdAliens.splice(
        i,
        1
      );

      sdScore += 35;
      sdLevelScore += 35;
    }

    if (sdBoss) {

      sdBoss.hp -=
        sdBoss.maxHp * 0.12;
    }

    sdStartShake(18);
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
    0.35,
    "sine",
    0.04
  );
}


// ================================================================
// MOUSE SUPPORT
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

  sdCreateStars();

  sdUpdateSafeArea();

  sdResetControls();
}
