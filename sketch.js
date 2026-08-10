// ================================================================
// SPACE DODGER
// COMPLETE MOBILE BUILD
// ================================================================
// FIXED IN THIS BUILD
// ---------------------------------------------------------------
// 1. JOYSTICK-ONLY MOVEMENT
// 2. RANDOM SCREEN TOUCH DOES NOT MOVE SHIP
// 3. TRUE 360 DEGREE JOYSTICK
// 4. ARCHIVE FIRST/LAST SHIP FULLY VISIBLE
// 5. ARCHIVE SWIPE + DRAGGABLE SCROLLBAR
// 6. PAUSE / HOME ALIGNMENT
// 7. BALANCED BOTTOM CONTROLS
// 8. PLAYER/ALIEN COLLISION GLITCH FIX
// 9. GAME OVER FLICKER FIX
// 10. ZERO TEXT GLOW / ZERO TEXT SHADOW
// 11. FIRE SOUND
// 12. NO p5.js "key" VARIABLE CONFLICT
// ================================================================


let gameState = "HOME";

let player;

let bullets = [];
let aliens = [];
let enemyShots = [];
let powerUps = [];
let particles = [];
let stars = [];

let boss = null;
let bossActive = false;
let bossDefeated = false;

let currentLevel = 1;
let unlockedLevel = 1;
let selectedShip = 0;

let score = 0;
let levelScore = 0;
let lives = 3;

let levelStart = 0;
let levelDuration = 45000;
let targetScore = 500;

let lastAlienSpawn = 0;
let lastPowerSpawn = 0;
let lastShot = 0;

let levelClearTime = 0;

let powerReadyAt = 0;

let soundOn = true;
let swappedControls = false;

let audioCtx = null;

let shakeAmount = 0;

let rating = 0;


// ================================================================
// LAYOUT
// ================================================================

let safeBottom = 170;

let pauseButton = {
  x: 38,
  y: 95,
  radius: 23
};

let homeButton = {
  x: 0,
  y: 95,
  radius: 23
};

let joystick = {
  baseX: 95,
  baseY: 0,
  knobX: 95,
  knobY: 0,
  radius: 57,
  active: false
};

let fireButton = {
  x: 0,
  y: 0,
  radius: 52
};

let powerButton = {
  x: 0,
  y: 0,
  radius: 42
};


// ================================================================
// JOYSTICK INPUT STATE
// ================================================================

// IMPORTANT:
// Movement begins ONLY if touch starts inside joystick.
// A random touch elsewhere is ignored.

let joystickTouchActive = false;

let joystickStartX = 0;
let joystickStartY = 0;

let joystickLastX = 0;
let joystickLastY = 0;


// ================================================================
// ARCHIVE
// ================================================================

let archiveScroll = 0;
let archiveTargetScroll = 0;

let archiveTouching = false;
let archiveDragging = false;
let archiveDraggingScrollbar = false;

let archiveStartX = 0;
let archiveStartY = 0;

let archiveLastX = 0;
let archiveLastY = 0;


// ================================================================
// POWER TIMERS
// ================================================================

let powerEnds = {
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
// SHIPS
// ================================================================

const SHIPS = [

  {
    name: "NOVA SCOUT",
    unlock: 1,
    body: "#12324b",
    edge: "#29c9e8",
    core: "#f3ffff",
    power: "BALANCED",
    desc: "Balanced weapons and movement."
  },

  {
    name: "SOLAR FANG",
    unlock: 3,
    body: "#54200d",
    edge: "#ff8d26",
    core: "#fff0a0",
    power: "BURN SHOT",
    desc: "Shots deal increased damage."
  },

  {
    name: "NEBULA WING",
    unlock: 5,
    body: "#35144e",
    edge: "#bd6cff",
    core: "#fff2ff",
    power: "GRAVITY PULSE",
    desc: "Slows nearby enemies."
  },

  {
    name: "CRYO HAWK",
    unlock: 7,
    body: "#123e59",
    edge: "#72e6ff",
    core: "#efffff",
    power: "TIME FREEZE",
    desc: "Greatly slows enemy movement."
  },

  {
    name: "VOID SPEAR",
    unlock: 9,
    body: "#2b1033",
    edge: "#f15bda",
    core: "#ffffff",
    power: "PHASE DODGE",
    desc: "Temporary damage immunity."
  },

  {
    name: "DRAGON BANE",
    unlock: 10,
    body: "#551019",
    edge: "#ff4255",
    core: "#ffe56a",
    power: "DRAGON RAGE",
    desc: "Massive boss damage bonus."
  },

  {
    name: "QUANTUM EDGE",
    unlock: 12,
    body: "#073e43",
    edge: "#00d8c0",
    core: "#efffff",
    power: "QUANTUM DASH",
    desc: "Fast movement and rapid fire."
  },

  {
    name: "STAR PALADIN",
    unlock: 15,
    body: "#51470d",
    edge: "#ffe35c",
    core: "#ffffff",
    power: "HOLY SHIELD",
    desc: "Temporary protective shield."
  },

  {
    name: "GALACTIC TITAN",
    unlock: 18,
    body: "#421b55",
    edge: "#ed72ff",
    core: "#ffffbc",
    power: "TITAN CORE",
    desc: "Huge shots and high damage."
  },

  {
    name: "MULTIVERSE KING",
    unlock: 20,
    body: "#513c04",
    edge: "#ffd43b",
    core: "#ffffff",
    power: "REALITY BREAK",
    desc: "Extreme firepower and shield."
  }

];


// ================================================================
// LEVEL DATA
// ================================================================

const TOTAL_LEVELS = 20;

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


function levelTime(level) {

  return 45000 +
    (level - 1) * 6000;
}


function levelTarget(level) {

  return floor(
    450 +
    (level - 1) * 180 +
    pow(level, 1.35) * 30
  );
}


function difficulty(level) {

  return 1 +
    (level - 1) * 0.055;
}


function bossLevel(level) {

  return (
    level === 5 ||
    level === 10 ||
    level === 15 ||
    level === 20
  );
}


// ================================================================
// SETUP
// ================================================================

function setup() {

  createCanvas(
    windowWidth,
    windowHeight
  );

  pixelDensity(
    min(
      2,
      window.devicePixelRatio || 1
    )
  );

  textFont("Arial");

  loadSave();

  createStars();

  updateLayout();

  player = new Player();

  resetControls();
}


// ================================================================
// RESPONSIVE LAYOUT
// ================================================================

function updateLayout() {

  safeBottom = constrain(
    max(
      125,
      height * 0.125
    ),
    125,
    190
  );

  pauseButton.x = 38;
  pauseButton.y = 96;

  homeButton.x =
    width - 38;

  homeButton.y = 96;

  resetControls();
}


// ================================================================
// SAVE / LOAD
// ================================================================

function loadSave() {

  try {

    let raw =
      localStorage.getItem(
        "spaceDodgerCleanFinal"
      );

    if (!raw) return;

    let data =
      JSON.parse(raw);

    unlockedLevel =
      constrain(
        int(
          data.unlockedLevel || 1
        ),
        1,
        TOTAL_LEVELS
      );

    selectedShip =
      constrain(
        int(
          data.selectedShip || 0
        ),
        0,
        SHIPS.length - 1
      );

    soundOn =
      data.sound !== false;

    swappedControls =
      data.swappedControls === true;

  } catch (e) {

    unlockedLevel = 1;
    selectedShip = 0;
    soundOn = true;
    swappedControls = false;
  }
}


function saveGame() {

  try {

    localStorage.setItem(
      "spaceDodgerCleanFinal",
      JSON.stringify({

        unlockedLevel:
          unlockedLevel,

        selectedShip:
          selectedShip,

        sound:
          soundOn,

        swappedControls:
          swappedControls

      })
    );

  } catch (e) {}
}


// ================================================================
// PLAIN TEXT
// NO GLOW
// NO SHADOW
// ================================================================

function plainText(
  value,
  x,
  y,
  size,
  colorValue,
  alignX = CENTER,
  alignY = CENTER,
  styleValue = NORMAL
) {

  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor =
    "rgba(0,0,0,0)";
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;

  noStroke();

  fill(colorValue);

  textSize(size);

  textAlign(
    alignX,
    alignY
  );

  textStyle(styleValue);

  text(
    value,
    x,
    y
  );

  drawingContext.shadowBlur = 0;
}


// ================================================================
// MAIN DRAW
// ================================================================

function draw() {

  drawBackground();

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
    drawFrozenGame();
    drawPause();
    return;
  }

  if (gameState === "GAMEOVER") {
    drawFrozenGame();
    drawGameOver();
    return;
  }

  if (gameState === "LEVELUP") {
    updateParticles();
    drawLevelUp();
    return;
  }
}


// ================================================================
// BACKGROUND
// ================================================================

function drawBackground() {

  if (bossActive) {

    background(
      18,
      4,
      10
    );

  } else {

    background(
      2,
      6,
      17
    );
  }
}


// ================================================================
// STARS
// ================================================================

function createStars() {

  stars = [];

  for (
    let i = 0;
    i < 145;
    i++
  ) {

    stars.push({

      x: random(width),
      y: random(height),

      size:
        random(
          0.8,
          2.5
        ),

      speed:
        random(
          0.15,
          0.9
        ),

      alpha:
        random(
          90,
          210
        )

    });
  }
}


function drawStars() {

  noStroke();

  for (
    let star of stars
  ) {

    if (
      gameState ===
      "PLAYING"
    ) {

      star.y +=
        star.speed;

      if (
        star.y > height
      ) {

        star.y = -5;

        star.x =
          random(width);
      }
    }

    fill(
      185,
      220,
      255,
      star.alpha
    );

    circle(
      star.x,
      star.y,
      star.size
    );
  }
}


// ================================================================
// HOME
// ================================================================

function drawHome() {

  plainText(
    "SPACE DODGER",
    width / 2,
    height * 0.14,
    min(
      42,
      width * 0.105
    ),
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    "GALACTIC CAMPAIGN",
    width / 2,
    height * 0.195,
    12,
    "#8aa9b9"
  );

  let buttons = [

    ["PLAY", height * 0.32],
    ["SHIP ARCHIVE", height * 0.43],
    ["ABOUT", height * 0.54],
    ["SETTINGS", height * 0.65],
    ["RATE US", height * 0.76]

  ];

  for (
    let i = 0;
    i < buttons.length;
    i++
  ) {

    menuButton(
      buttons[i][0],
      buttons[i][1]
    );
  }

  plainText(
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
  label,
  y
) {

  let w =
    min(
      320,
      width * 0.80
    );

  rectMode(CENTER);

  stroke("#468ea8");

  strokeWeight(1.5);

  fill("#061522");

  rect(
    width / 2,
    y,
    w,
    56,
    12
  );

  plainText(
    label,
    width / 2,
    y,
    15,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );
}


// ================================================================
// LEVEL SELECT
// ================================================================

function drawLevels() {

  plainText(
    "SELECT LEVEL",
    width / 2,
    42,
    27,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    "CURRENT RANK",
    width / 2,
    69,
    11,
    "#789aaa"
  );

  plainText(
    LEVEL_NAMES[
      unlockedLevel - 1
    ],
    width / 2,
    91,
    14,
    "#ead75b",
    CENTER,
    CENTER,
    BOLD
  );

  let cols = 4;
  let gap = 9;

  let size =
    min(
      66,
      (width - 48) /
      cols
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
    let level = 1;
    level <= TOTAL_LEVELS;
    level++
  ) {

    let col =
      (level - 1) %
      cols;

    let row =
      floor(
        (level - 1) /
        cols
      );

    let x =
      startX +
      col *
      (size + gap);

    let y =
      startY +
      row *
      (size + 15);

    let open =
      level <=
      unlockedLevel;

    let isBoss =
      bossLevel(level);

    rectMode(CENTER);

    stroke(
      open
        ? isBoss
          ? "#d76b58"
          : "#469ab7"
        : "#3b4045"
    );

    strokeWeight(1.5);

    fill(
      open
        ? isBoss
          ? "#34191c"
          : "#071e30"
        : "#11151a"
    );

    rect(
      x,
      y,
      size,
      size,
      10
    );

    if (open) {

      plainText(
        String(level),
        x,
        y - 5,
        17,
        "#eef6f8",
        CENTER,
        CENTER,
        BOLD
      );

      plainText(
        isBoss
          ? "BOSS"
          : "LEVEL",
        x,
        y + 19,
        8,
        isBoss
          ? "#ff9278"
          : "#79aabd",
        CENTER,
        CENTER,
        BOLD
      );

    } else {

      plainText(
        "LOCK",
        x,
        y,
        10,
        "#777d81",
        CENTER,
        CENTER,
        BOLD
      );
    }
  }

  homeBottomButton();
}


// ================================================================
// ARCHIVE GEOMETRY
// ================================================================
//
// IMPORTANT FIX:
// There is now TOP PADDING and BOTTOM PADDING inside the
// scroll content. This guarantees first and last ship can both
// reach a completely visible position.
// ================================================================

function archiveGeometry() {

  let viewportTop = 112;

  let viewportBottom =
    height -
    safeBottom -
    65;

  let viewportHeight =
    max(
      120,
      viewportBottom -
      viewportTop
    );

  let cardHeight = 145;
  let gap = 15;

  let topPadding = 28;
  let bottomPadding = 55;

  let contentHeight =
    topPadding +
    SHIPS.length *
    cardHeight +
    (SHIPS.length - 1) *
    gap +
    bottomPadding;

  let maxScroll =
    max(
      0,
      contentHeight -
      viewportHeight
    );

  return {

    top:
      viewportTop,

    bottom:
      viewportBottom,

    viewportHeight:
      viewportHeight,

    cardHeight:
      cardHeight,

    gap:
      gap,

    topPadding:
      topPadding,

    bottomPadding:
      bottomPadding,

    contentHeight:
      contentHeight,

    maxScroll:
      maxScroll
  };
}


function clampArchiveScroll() {

  let g =
    archiveGeometry();

  archiveTargetScroll =
    constrain(
      archiveTargetScroll,
      0,
      g.maxScroll
    );

  archiveScroll =
    constrain(
      archiveScroll,
      0,
      g.maxScroll
    );
}


// ================================================================
// ARCHIVE DRAW
// ================================================================

function drawArchive() {

  let g =
    archiveGeometry();

  clampArchiveScroll();

  plainText(
    "SHIP ARCHIVE",
    width / 2,
    35,
    25,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    "SWIPE TO BROWSE  •  DRAG SCROLLBAR",
    width / 2,
    61,
    11,
    "#789aaa"
  );

  archiveScroll =
    lerp(
      archiveScroll,
      archiveTargetScroll,
      0.28
    );

  clampArchiveScroll();

  push();

  drawingContext.save();

  drawingContext.beginPath();

  drawingContext.rect(
    0,
    g.top,
    width,
    g.viewportHeight
  );

  drawingContext.clip();

  let cardWidth =
    min(
      355,
      width * 0.89
    );

  // --------------------------------------------------------------
  // IMPORTANT:
  // Card positions use TOP PADDING.
  // First card is never hidden under title.
  // --------------------------------------------------------------

  for (
    let i = 0;
    i < SHIPS.length;
    i++
  ) {

    let cardY =
      g.top +
      g.topPadding +
      g.cardHeight / 2 +
      i *
      (
        g.cardHeight +
        g.gap
      ) -
      archiveScroll;

    drawArchiveCard(
      SHIPS[i],
      i,
      cardY,
      cardWidth,
      g.cardHeight
    );
  }

  drawingContext.restore();

  pop();

  drawArchiveScrollbar();

  homeBottomButton();
}


// ================================================================
// ARCHIVE CARD
// ================================================================

function drawArchiveCard(
  ship,
  index,
  cardY,
  cardWidth,
  cardHeight
) {

  let unlocked =
    unlockedLevel >=
    ship.unlock;

  let selected =
    selectedShip ===
    index;

  rectMode(CENTER);

  stroke(
    selected
      ? "#ead34c"
      : unlocked
        ? "#468fa9"
        : "#44484c"
  );

  strokeWeight(
    selected
      ? 2.5
      : 1.3
  );

  fill(
    unlocked
      ? "#061421"
      : "#11151a"
  );

  rect(
    width / 2,
    cardY,
    cardWidth,
    cardHeight,
    14
  );

  if (unlocked) {

    drawArchiveShip(
      width / 2 -
      cardWidth * 0.31,
      cardY,
      index,
      0.84
    );

    plainText(
      ship.name,
      width / 2 -
      cardWidth * 0.05,
      cardY - 40,
      13,
      "#eef7fa",
      LEFT,
      CENTER,
      BOLD
    );

    plainText(
      ship.power,
      width / 2 -
      cardWidth * 0.05,
      cardY - 14,
      10,
      "#e4cc55",
      LEFT,
      CENTER,
      BOLD
    );

    plainText(
      ship.desc,
      width / 2 -
      cardWidth * 0.05,
      cardY + 10,
      9,
      "#9aaeb8",
      LEFT
    );

    plainText(
      selected
        ? "SELECTED"
        : "TAP TO SELECT",
      width / 2 -
      cardWidth * 0.05,
      cardY + 38,
      9,
      selected
        ? "#ead34c"
        : "#78b1c6",
      LEFT,
      CENTER,
      BOLD
    );

  } else {

    drawArchiveShip(
      width / 2,
      cardY - 5,
      index,
      0.65
    );

    plainText(
      "LOCKED  •  LEVEL " +
      ship.unlock,
      width / 2,
      cardY + 48,
      10,
      "#858b8f",
      CENTER,
      CENTER,
      BOLD
    );
  }
}


// ================================================================
// ARCHIVE SCROLLBAR
// ================================================================

function archiveScrollbarInfo() {

  let g =
    archiveGeometry();

  if (
    g.maxScroll <= 0
  ) {

    return null;
  }

  let trackX =
    width - 10;

  let trackTop =
    g.top;

  let trackHeight =
    g.viewportHeight;

  let thumbHeight =
    max(
      55,
      trackHeight *
      (
        g.viewportHeight /
        g.contentHeight
      )
    );

  let travel =
    trackHeight -
    thumbHeight;

  let ratio =
    archiveScroll /
    g.maxScroll;

  let thumbY =
    trackTop +
    thumbHeight / 2 +
    travel *
    constrain(
      ratio,
      0,
      1
    );

  return {

    x: trackX,

    top:
      thumbY -
      thumbHeight / 2,

    bottom:
      thumbY +
      thumbHeight / 2,

    thumbHeight:
      thumbHeight,

    travel:
      travel,

    trackTop:
      trackTop,

    trackHeight:
      trackHeight,

    maxScroll:
      g.maxScroll
  };
}


function drawArchiveScrollbar() {

  let info =
    archiveScrollbarInfo();

  if (!info) return;

  noStroke();

  fill(
    255,
    255,
    255,
    22
  );

  rect(
    info.x,
    info.trackTop +
    info.trackHeight / 2,
    4,
    info.trackHeight,
    2
  );

  stroke("#59b5d2");

  strokeWeight(1);

  fill(
    45,
    150,
    185,
    215
  );

  rect(
    info.x,
    (
      info.top +
      info.bottom
    ) / 2,
    10,
    info.thumbHeight,
    5
  );
}


function isOnArchiveScrollbar(
  x,
  y
) {

  let info =
    archiveScrollbarInfo();

  if (!info)
    return false;

  return (
    x >
      width - 38 &&
    y >=
      info.top - 12 &&
    y <=
      info.bottom + 12
  );
}


function setArchiveScrollFromScrollbar(
  y
) {

  let info =
    archiveScrollbarInfo();

  if (!info)
    return;

  let center =
    constrain(
      y,
      info.trackTop +
      info.thumbHeight / 2,

      info.trackTop +
      info.trackHeight -
      info.thumbHeight / 2
    );

  let ratio =
    info.travel > 0
      ? (
          center -
          (
            info.trackTop +
            info.thumbHeight / 2
          )
        ) /
        info.travel
      : 0;

  archiveTargetScroll =
    ratio *
    info.maxScroll;

  archiveScroll =
    archiveTargetScroll;
}


// ================================================================
// ARCHIVE SHIP ART
// ================================================================

function drawArchiveShip(
  x,
  y,
  index,
  scaleValue
) {

  let ship =
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

  fill(ship.edge);

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

function drawAbout() {

  plainText(
    "ABOUT",
    width / 2,
    height * 0.18,
    30,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    "Developed by",
    width / 2,
    height * 0.34,
    14,
    "#a0afb6"
  );

  plainText(
    "Aazad S Rana",
    width / 2,
    height * 0.42,
    min(
      23,
      width * 0.06
    ),
    "#ead75b",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    "Space Dodger  •  Galactic Campaign",
    width / 2,
    height * 0.51,
    12,
    "#a0afb6"
  );

  plainText(
    "20 levels  •  Alien invasion  •  Boss battles",
    width / 2,
    height * 0.57,
    11,
    "#7e8f97"
  );

  plainText(
    "Built for mobile arcade gameplay.",
    width / 2,
    height * 0.62,
    11,
    "#7e8f97"
  );

  homeBottomButton();
}


// ================================================================
// SETTINGS
// ================================================================

function drawSettings() {

  plainText(
    "SETTINGS",
    width / 2,
    height * 0.15,
    29,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );

  settingBox(
    "CONTROL LAYOUT",
    swappedControls
      ? "FIRE LEFT  •  MOVE RIGHT"
      : "MOVE LEFT  •  FIRE RIGHT",
    height * 0.33
  );

  settingBox(
    "SOUND",
    soundOn
      ? "ON"
      : "OFF",
    height * 0.49
  );

  plainText(
    "Tap a panel to change its setting.",
    width / 2,
    height * 0.63,
    11,
    "#7e9098"
  );

  homeBottomButton();
}


function settingBox(
  title,
  value,
  y
) {

  let w =
    min(
      340,
      width * 0.84
    );

  rectMode(CENTER);

  stroke("#468ea8");

  strokeWeight(1.5);

  fill("#061622");

  rect(
    width / 2,
    y,
    w,
    82,
    14
  );

  plainText(
    title,
    width / 2,
    y - 18,
    11,
    "#839ba6",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    value,
    width / 2,
    y + 14,
    15,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );
}


// ================================================================
// RATING
// ================================================================

function drawRating() {

  plainText(
    "RATE SPACE DODGER",
    width / 2,
    height * 0.24,
    27,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    "HOW WAS YOUR EXPERIENCE?",
    width / 2,
    height * 0.32,
    13,
    "#9aabb2"
  );

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

    let x =
      width / 2 -
      total / 2 +
      (i - 1) *
      gap;

    plainText(
      "★",
      x,
      height * 0.45,
      39,
      i <= rating
        ? "#ead34c"
        : "#555b60",
      CENTER,
      CENTER,
      BOLD
    );
  }

  plainText(
    rating +
    " / 5",
    width / 2,
    height * 0.55,
    16,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );

  actionButton(
    "SUBMIT",
    height * 0.65,
    250
  );

  actionButton(
    "CANCEL",
    height * 0.75,
    250
  );
}


// ================================================================
// START LEVEL
// ================================================================

function startLevel(level) {

  currentLevel =
    constrain(
      level,
      1,
      TOTAL_LEVELS
    );

  score = 0;
  levelScore = 0;
  lives = 3;

  levelDuration =
    levelTime(
      currentLevel
    );

  targetScore =
    levelTarget(
      currentLevel
    );

  levelStart =
    millis();

  lastAlienSpawn =
    millis();

  lastPowerSpawn =
    millis();

  lastShot = 0;

  bullets = [];
  aliens = [];
  enemyShots = [];
  powerUps = [];
  particles = [];

  boss = null;

  bossActive = false;
  bossDefeated = false;

  resetPowers();

  player =
    new Player();

  resetControls();

  powerReadyAt =
    millis() + 3000;

  gameState =
    "PLAYING";
}


// ================================================================
// PLAYER
// ================================================================

class Player {

  constructor() {

    this.x =
      width / 2;

    this.y =
      height * 0.67;

    this.angle =
      -HALF_PI;

    this.radius = 17;

    this.invincibleUntil = 0;
  }

  update() {

    // No automatic movement.
    // Movement happens ONLY through joystick.

    // Horizontal wrapping.

    if (
      this.x < -40
    ) {

      this.x =
        width + 40;
    }

    if (
      this.x >
      width + 40
    ) {

      this.x = -40;
    }

    // Vertical wrapping.

    if (
      this.y < -40
    ) {

      this.y =
        height + 40;
    }

    if (
      this.y >
      height + 40
    ) {

      this.y = -40;
    }
  }

  display() {

    if (
      millis() <
      this.invincibleUntil &&
      floor(
        millis() / 120
      ) % 2 === 0
    ) {

      return;
    }

    let ship =
      SHIPS[
        selectedShip
      ];

    push();

    translate(
      this.x,
      this.y
    );

    rotate(
      this.angle +
      HALF_PI
    );

    stroke(ship.edge);

    strokeWeight(2.3);

    fill(ship.body);

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

    fill(ship.core);

    ellipse(
      0,
      -5,
      9,
      16
    );

    fill(ship.edge);

    triangle(
      -5,
      17,
      5,
      17,
      0,
      29
    );

    pop();

    if (hasShield()) {

      drawShield(
        this.x,
        this.y
      );
    }
  }
}


// ================================================================
// SHIP POWER
// ================================================================

function shipPower() {

  return SHIPS[
    selectedShip
  ].power;
}


function damageMultiplier() {

  let multiplier = 1;

  if (
    shipPower() ===
    "BURN SHOT"
  ) {

    multiplier = 1.12;
  }

  if (
    shipPower() ===
    "DRAGON RAGE" &&
    bossActive
  ) {

    multiplier = 1.75;
  }

  if (
    shipPower() ===
    "TITAN CORE"
  ) {

    multiplier = 1.65;
  }

  if (
    shipPower() ===
    "REALITY BREAK"
  ) {

    multiplier = 2.1;
  }

  if (
    millis() <
    powerEnds.BERSERKER
  ) {

    multiplier *= 1.55;
  }

  return multiplier;
}


function fireDelay() {

  let delay = 155;

  if (
    shipPower() ===
    "QUANTUM DASH"
  ) {

    delay = 85;
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
    powerEnds.BERSERKER
  ) {

    delay = 70;
  }

  return delay;
}


function moveSpeed() {

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


// ================================================================
// SHIELD
// ================================================================

function hasShield() {

  return (
    millis() <
    powerEnds.SHIELD
  );
}


function drawShield(
  x,
  y
) {

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
    sin(
      frameCount * 0.08
    ) * 4
  );
}


// ================================================================
// GAME LOOP
// ================================================================

function runGame() {

  updateShake();

  handleJoystickMovement();

  player.update();

  updateBullets();

  updateAliens();

  updateEnemyShots();

  updatePowerUps();

  updateParticles();

  if (bossActive) {
    updateBoss();
  }

  collideBulletsAliens();

  collideShipAliens();

  collideShipShots();

  collideBulletsBoss();

  spawnAliens();

  spawnPowerUps();

  checkBoss();

  checkLevelComplete();

  drawHUD();

  drawControls();

  player.display();
}


// ================================================================
// SHAKE
// ================================================================

function startShake(amount) {

  shakeAmount =
    max(
      shakeAmount,
      amount
    );
}


function updateShake() {

  if (
    shakeAmount <= 0
  ) {

    return;
  }

  shakeAmount *= 0.86;

  if (
    shakeAmount < 0.25
  ) {

    shakeAmount = 0;
  }
}


// ================================================================
// BULLET
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

    this.speed =
      11 +
      power * 0.8;

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

    let edge =
      SHIPS[
        selectedShip
      ].edge;

    stroke(edge);

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
// AUDIO
// ================================================================

function initAudio() {

  if (!soundOn) {
    return;
  }

  if (!audioCtx) {

    let AudioClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (AudioClass) {

      try {

        audioCtx =
          new AudioClass();

      } catch (e) {

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


function playFireSound() {

  if (!soundOn) return;

  if (!audioCtx) {
    initAudio();
  }

  if (!audioCtx) return;

  try {

    let now =
      audioCtx.currentTime;

    let oscillator =
      audioCtx.createOscillator();

    let gain =
      audioCtx.createGain();

    oscillator.type =
      "sawtooth";

    oscillator.frequency.setValueAtTime(
      760,
      now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      170,
      now + 0.075
    );

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.055,
      now + 0.008
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.085
    );

    oscillator.connect(gain);

    gain.connect(
      audioCtx.destination
    );

    oscillator.start(now);

    oscillator.stop(
      now + 0.09
    );

  } catch (e) {}
}


function playPowerSound() {

  if (!soundOn) return;

  if (!audioCtx) {
    initAudio();
  }

  if (!audioCtx) return;

  try {

    let now =
      audioCtx.currentTime;

    let oscillator =
      audioCtx.createOscillator();

    let gain =
      audioCtx.createGain();

    oscillator.type =
      "triangle";

    oscillator.frequency.setValueAtTime(
      260,
      now
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      720,
      now + 0.18
    );

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.07,
      now + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.24
    );

    oscillator.connect(gain);

    gain.connect(
      audioCtx.destination
    );

    oscillator.start(now);

    oscillator.stop(
      now + 0.25
    );

  } catch (e) {}
}


// ================================================================
// SHOOT
// ================================================================

function shoot() {

  if (
    gameState !==
    "PLAYING"
  ) {

    return;
  }

  let now =
    millis();

  if (
    now -
    lastShot <
    fireDelay()
  ) {

    return;
  }

  lastShot = now;

  playFireSound();

  let offsets = [0];

  if (
    now <
    powerEnds.TRINITY
  ) {

    offsets =
      [-22, 0, 22];

  } else if (
    now <
    powerEnds.TWIN
  ) {

    offsets =
      [-17, 17];
  }

  let angles = [
    player.angle
  ];

  if (
    now <
    powerEnds.MULTI
  ) {

    angles = [

      player.angle -
      radians(12),

      player.angle,

      player.angle +
      radians(12)

    ];
  }

  if (
    shipPower() ===
    "TITAN CORE"
  ) {

    angles = [

      player.angle -
      radians(8),

      player.angle,

      player.angle +
      radians(8)

    ];
  }

  if (
    shipPower() ===
    "REALITY BREAK"
  ) {

    angles = [

      player.angle -
      radians(20),

      player.angle -
      radians(10),

      player.angle,

      player.angle +
      radians(10),

      player.angle +
      radians(20)

    ];
  }

  for (
    let offset of offsets
  ) {

    let sx =
      player.x +
      cos(
        player.angle +
        HALF_PI
      ) *
      offset;

    let sy =
      player.y +
      sin(
        player.angle +
        HALF_PI
      ) *
      offset;

    for (
      let bulletAngle of angles
    ) {

      bullets.push(
        new Bullet(

          sx +
          cos(
            bulletAngle
          ) * 27,

          sy +
          sin(
            bulletAngle
          ) * 27,

          bulletAngle,

          damageMultiplier()

        )
      );
    }
  }
}


// ================================================================
// BULLETS UPDATE
// ================================================================

function updateBullets() {

  for (
    let i =
      bullets.length - 1;
    i >= 0;
    i--
  ) {

    let bullet =
      bullets[i];

    bullet.update();

    if (
      bullet.dead()
    ) {

      bullets.splice(
        i,
        1
      );

    } else {

      bullet.display();
    }
  }
}


// ================================================================
// ALIEN
// ================================================================

class Alien {

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
      currentLevel <= 3
    ) {

      this.type =
        random([
          "SCOUT",
          "INTERCEPTOR"
        ]);
    }

    let side =
      floor(
        random(4)
      );

    if (side === 0) {

      this.x =
        random(width);

      this.y = -70;

    } else if (side === 1) {

      this.x =
        width + 70;

      this.y =
        random(
          height * 0.17,
          height * 0.70
        );

    } else if (side === 2) {

      this.x =
        random(width);

      this.y =
        height + 70;

    } else {

      this.x = -70;

      this.y =
        random(
          height * 0.17,
          height * 0.70
        );
    }

    this.radius = 22;

    this.hp = 1;

    if (
      this.type ===
      "INTERCEPTOR"
    ) {

      this.radius = 20;
      this.hp = 1;
    }

    if (
      this.type ===
      "HUNTER"
    ) {

      this.radius = 24;
      this.hp = 2;
    }

    if (
      this.type ===
      "HEAVY"
    ) {

      this.radius = 32;
      this.hp = 4;
    }

    if (
      this.type ===
      "ELITE"
    ) {

      this.radius = 29;
      this.hp = 3;
    }

    this.speed =
      random(
        1.35,
        2.15
      ) *
      difficulty(
        currentLevel
      );

    if (
      this.type ===
      "INTERCEPTOR"
    ) {

      this.speed *= 1.35;
    }

    if (
      this.type ===
      "HEAVY"
    ) {

      this.speed *= 0.65;
    }

    this.phase =
      random(TWO_PI);

    this.rotation =
      random(TWO_PI);

    this.rotationSpeed =
      random(
        -0.025,
        0.025
      );

    this.lastShot =
      millis() +
      random(
        1200,
        3000
      );
  }

  update() {

    let dx =
      player.x -
      this.x;

    let dy =
      player.y -
      this.y;

    let angle =
      atan2(
        dy,
        dx
      );

    let speed =
      this.speed;

    if (
      shipPower() ===
      "GRAVITY PULSE"
    ) {

      speed *= 0.35;
    }

    if (
      shipPower() ===
      "TIME FREEZE"
    ) {

      speed *= 0.28;
    }

    if (
      millis() <
      powerEnds.CRYO
    ) {

      speed *= 0.45;
    }

    if (
      this.type ===
      "INTERCEPTOR"
    ) {

      angle +=
        sin(
          frameCount *
          0.045 +
          this.phase
        ) *
        0.55;
    }

    if (
      this.type ===
      "HUNTER"
    ) {

      angle +=
        sin(
          frameCount *
          0.025 +
          this.phase
        ) *
        0.18;
    }

    if (
      this.type ===
      "ELITE"
    ) {

      angle +=
        sin(
          frameCount *
          0.035 +
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

    this.rotation +=
      this.rotationSpeed;

    if (
      this.type ===
      "HUNTER" ||
      this.type ===
      "ELITE"
    ) {

      if (
        millis() -
        this.lastShot >
        max(
          1500,
          2700 -
          currentLevel * 28
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
        player.y -
        this.y,
        player.x -
        this.x
      );

    enemyShots.push(
      new EnemyShot(
        this.x,
        this.y,
        angle,
        this.type ===
        "ELITE"
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

    rotate(
      this.rotation
    );

    if (
      this.type ===
      "SCOUT"
    ) {

      alienScout();

    } else if (
      this.type ===
      "INTERCEPTOR"
    ) {

      alienInterceptor();

    } else if (
      this.type ===
      "HUNTER"
    ) {

      alienHunter();

    } else if (
      this.type ===
      "HEAVY"
    ) {

      alienHeavy();

    } else {

      alienElite();
    }

    pop();
  }

  dead() {

    return (

      this.x < -160 ||
      this.x >
      width + 160 ||
      this.y < -160 ||
      this.y >
      height + 160

    );
  }
}


// ================================================================
// ALIEN VISUALS
// ================================================================

function alienScout() {

  stroke("#65dff5");

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

  fill("#c8fbff");

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


function alienInterceptor() {

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

  ellipse(
    0,
    -2,
    9,
    14
  );
}


function alienHunter() {

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
}


function alienHeavy() {

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

  ellipse(
    0,
    -4,
    15,
    20
  );
}


function alienElite() {

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
}


// ================================================================
// ALIEN SPAWN
// ================================================================

function spawnAliens() {

  if (bossActive)
    return;

  let delay =
    max(
      470,
      1100 -
      currentLevel * 32
    );

  if (
    millis() -
    lastAlienSpawn >
    delay
  ) {

    let count = 1;

    if (
      currentLevel >= 7 &&
      random() < 0.17
    ) {

      count = 2;
    }

    if (
      currentLevel >= 14 &&
      random() < 0.12
    ) {

      count = 3;
    }

    for (
      let i = 0;
      i < count;
      i++
    ) {

      aliens.push(
        new Alien()
      );
    }

    lastAlienSpawn =
      millis();
  }
}


function updateAliens() {

  for (
    let i =
      aliens.length - 1;
    i >= 0;
    i--
  ) {

    let alien =
      aliens[i];

    alien.update();

    if (
      alien.dead()
    ) {

      aliens.splice(
        i,
        1
      );

    } else {

      alien.display();
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


function updateEnemyShots() {

  for (
    let i =
      enemyShots.length - 1;
    i >= 0;
    i--
  ) {

    let shot =
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

      shot.display();
    }
  }
}


// ================================================================
// COLLISION: BULLET -> ALIEN
// ================================================================

function collideBulletsAliens() {

  for (
    let i =
      aliens.length - 1;
    i >= 0;
    i--
  ) {

    let alien =
      aliens[i];

    for (
      let j =
        bullets.length - 1;
      j >= 0;
      j--
    ) {

      let bullet =
        bullets[j];

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

        bullets.splice(
          j,
          1
        );

        createExplosion(
          bullet.x,
          bullet.y,
          4,
          SHIPS[
            selectedShip
          ].edge
        );

        if (
          alien.hp <= 0
        ) {

          let points = 30;

          if (
            alien.type ===
            "HUNTER"
          )
            points = 45;

          if (
            alien.type ===
            "HEAVY"
          )
            points = 70;

          if (
            alien.type ===
            "ELITE"
          )
            points = 100;

          score += points;
          levelScore += points;

          createExplosion(
            alien.x,
            alien.y,
            alien.type ===
            "HEAVY"
              ? 32
              : 22,
            SHIPS[
              selectedShip
            ].edge
          );

          startShake(
            alien.type ===
            "HEAVY"
              ? 7
              : 3
          );

          aliens.splice(
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
// COLLISION: PLAYER -> ALIEN
// FIXED:
// • Enemy is removed first.
// • Player receives invulnerability.
// • No player deletion.
// • No multiple collision chain.
// ================================================================

function collideShipAliens() {

  if (
    millis() <
    player.invincibleUntil
  ) {

    return;
  }

  for (
    let i =
      aliens.length - 1;
    i >= 0;
    i--
  ) {

    let alien =
      aliens[i];

    let d =
      dist(
        player.x,
        player.y,
        alien.x,
        alien.y
      );

    if (
      d <
      player.radius +
      alien.radius * 0.72
    ) {

      // Shield collision

      if (hasShield()) {

        createExplosion(
          alien.x,
          alien.y,
          28,
          "#00cfff"
        );

        aliens.splice(
          i,
          1
        );

        startShake(5);

        return;
      }

      // PHASE DODGE

      if (
        shipPower() ===
        "PHASE DODGE" &&
        random() < 0.65
      ) {

        player.invincibleUntil =
          millis() + 500;

        return;
      }

      // IMPORTANT:
      // Remove enemy before damaging player.
      // This prevents the visual overlap glitch.

      createExplosion(
        alien.x,
        alien.y,
        28,
        SHIPS[
          selectedShip
        ].edge
      );

      aliens.splice(
        i,
        1
      );

      damagePlayer();

      return;
    }
  }
}


// ================================================================
// COLLISION: PLAYER -> ENEMY BULLET
// ================================================================

function collideShipShots() {

  if (
    millis() <
    player.invincibleUntil
  ) {

    return;
  }

  for (
    let i =
      enemyShots.length - 1;
    i >= 0;
    i--
  ) {

    let shot =
      enemyShots[i];

    if (
      dist(
        player.x,
        player.y,
        shot.x,
        shot.y
      ) <
      player.radius +
      shot.radius
    ) {

      if (hasShield()) {

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

        startShake(4);

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
// PLAYER DAMAGE
// ================================================================

function damagePlayer() {

  lives--;

  createExplosion(
    player.x,
    player.y,
    35,
    "#ff5968"
  );

  player.invincibleUntil =
    millis() + 1800;

  startShake(11);

  if (
    lives <= 0
  ) {

    // Clear active objects so Game Over cannot
    // draw a conflicting collision frame.

    bullets = [];
    enemyShots = [];
    aliens = [];
    powerUps = [];

    gameState =
      "GAMEOVER";
  }
}


// ================================================================
// POWER UPS
// ================================================================

class PowerUp {

  constructor() {

    this.type =
      random([

        "MULTI",
        "SHIELD",
        "TWIN",
        "TRINITY",
        "NOVA",
        "PHANTOM",
        "BERSERKER",
        "CRYO",
        "CELESTIAL"

      ]);

    this.x =
      random(
        55,
        width - 55
      );

    this.y =
      random(
        145,
        height -
        safeBottom -
        50
      );

    this.radius = 22;

    this.life = 850;

    this.rotation = 0;
  }

  update() {

    this.rotation +=
      0.035;

    this.life--;
  }

  display() {

    let cfg =
      powerConfig(
        this.type
      );

    push();

    translate(
      this.x,
      this.y
    );

    rotate(
      this.rotation
    );

    stroke(cfg.color);

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

    plainText(
      cfg.label,
      0,
      0,
      9,
      "#f2f5f6",
      CENTER,
      CENTER,
      BOLD
    );

    pop();
  }
}


function powerConfig(type) {

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


function spawnPowerUps() {

  if (
    millis() -
    lastPowerSpawn <
    max(
      7000,
      9500 -
      currentLevel * 90
    )
  ) {

    return;
  }

  if (
    powerUps.length < 1
  ) {

    powerUps.push(
      new PowerUp()
    );
  }

  lastPowerSpawn =
    millis();
}


function updatePowerUps() {

  for (
    let i =
      powerUps.length - 1;
    i >= 0;
    i--
  ) {

    let power =
      powerUps[i];

    power.update();

    if (
      power.life <= 0
    ) {

      powerUps.splice(
        i,
        1
      );

    } else {

      power.display();
    }
  }

  for (
    let i =
      powerUps.length - 1;
    i >= 0;
    i--
  ) {

    let power =
      powerUps[i];

    if (
      dist(
        player.x,
        player.y,
        power.x,
        power.y
      ) <
      player.radius +
      power.radius
    ) {

      activatePower(
        power.type
      );

      createExplosion(
        power.x,
        power.y,
        22,
        powerConfig(
          power.type
        ).color
      );

      score += 50;
      levelScore += 50;

      powerUps.splice(
        i,
        1
      );

      break;
    }
  }
}


function activatePower(type) {

  playPowerSound();

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

  powerEnds[type] =
    millis() +
    duration;

  if (
    type ===
    "NOVA"
  ) {

    for (
      let i =
        aliens.length - 1;
      i >= 0;
      i--
    ) {

      createExplosion(
        aliens[i].x,
        aliens[i].y,
        18
      );

      aliens.splice(
        i,
        1
      );

      score += 20;
      levelScore += 20;
    }

    startShake(14);
  }

  if (
    type ===
    "TWIN"
  ) {

    powerEnds.TRINITY = 0;
  }

  if (
    type ===
    "TRINITY"
  ) {

    powerEnds.TWIN = 0;
  }
}


// ================================================================
// BOSS
// ================================================================

class Boss {

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
      currentLevel * 170;

    this.hp =
      this.maxHp;

    this.phase = 1;

    this.motion = 0;

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

    this.motion +=
      this.phase === 3
        ? 0.021
        : 0.014;

    this.x =
      width / 2 +
      sin(
        this.motion
      ) *
      width *
      0.28;

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
        player.y -
        this.y,
        player.x -
        this.x
      );

    let spread =
      this.phase === 1
        ? [0]
        : this.phase === 2
          ? [-16, 0, 16]
          : [
              -30,
              -15,
              0,
              15,
              30
            ];

    for (
      let degrees of spread
    ) {

      enemyShots.push(
        new EnemyShot(
          this.x,
          this.y + 35,
          base +
          radians(degrees),
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

    ellipse(-14, -34, 11, 8);
    ellipse(14, -34, 11, 8);

    pop();
  }
}


function checkBoss() {

  if (
    !bossLevel(
      currentLevel
    ) ||
    bossActive ||
    bossDefeated
  ) {

    return;
  }

  let elapsed =
    millis() -
    levelStart;

  if (
    elapsed >
    levelDuration *
    0.55
  ) {

    boss =
      new Boss();

    bossActive = true;

    aliens = [];

    powerUps = [];

    startShake(15);
  }
}


function updateBoss() {

  if (!boss)
    return;

  boss.update();

  boss.display();

  drawBossHealth();

  if (
    boss.hp <= 0
  ) {

    score +=
      1000 +
      currentLevel * 100;

    levelScore +=
      1000 +
      currentLevel * 100;

    createExplosion(
      boss.x,
      boss.y,
      100,
      "#ff6735"
    );

    startShake(24);

    enemyShots = [];

    boss = null;

    bossActive = false;

    bossDefeated = true;
  }
}


function drawBossHealth() {

  if (!boss)
    return;

  let w =
    min(
      330,
      width * 0.74
    );

  let x =
    width / 2 -
    w / 2;

  let y = 113;

  let ratio =
    constrain(
      boss.hp /
      boss.maxHp,
      0,
      1
    );

  plainText(
    "METEOR DRAGON  •  PHASE " +
    boss.phase,
    width / 2,
    y - 7,
    12,
    "#e8a08a",
    CENTER,
    BOTTOM,
    BOLD
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

    let bullet =
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

      startShake(1.5);
    }
  }
}


// ================================================================
// LEVEL COMPLETE
// ================================================================

function checkLevelComplete() {

  let elapsed =
    millis() -
    levelStart;

  let timeDone =
    elapsed >=
    levelDuration;

  let scoreDone =
    levelScore >=
    targetScore;

  let bossDone =
    !bossLevel(
      currentLevel
    ) ||
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
    gameState !==
    "PLAYING"
  ) {

    return;
  }

  gameState =
    "LEVELUP";

  levelClearTime =
    millis();

  if (
    currentLevel <
    TOTAL_LEVELS
  ) {

    unlockedLevel =
      max(
        unlockedLevel,
        currentLevel + 1
      );

    saveGame();
  }

  createCelebration();
}


// ================================================================
// LEVEL UP
// ================================================================

function drawLevelUp() {

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

  plainText(
    currentLevel ===
    TOTAL_LEVELS
      ? "CAMPAIGN COMPLETE!"
      : "LEVEL " +
        currentLevel +
        " CLEARED!",
    width / 2,
    height * 0.30,
    min(
      33,
      width * 0.082
    ),
    "#ead34c",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    "SCORE  " +
    score,
    width / 2,
    height * 0.40,
    18,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );

  if (
    currentLevel <
    TOTAL_LEVELS
  ) {

    plainText(
      "NEW LEVEL UNLOCKED",
      width / 2,
      height * 0.49,
      15,
      "#78b2c7",
      CENTER,
      CENTER,
      BOLD
    );

    plainText(
      "LEVEL " +
      (
        currentLevel + 1
      ),
      width / 2,
      height * 0.55,
      22,
      "#edf7ff",
      CENTER,
      CENTER,
      BOLD
    );

    plainText(
      LEVEL_NAMES[
        currentLevel
      ],
      width / 2,
      height * 0.61,
      14,
      "#ead34c",
      CENTER,
      CENTER,
      BOLD
    );

  } else {

    plainText(
      "You conquered the Multiverse.",
      width / 2,
      height * 0.53,
      16,
      "#aab8be"
    );
  }

  if (
    millis() -
    levelClearTime >
    3200
  ) {

    if (
      currentLevel <
      TOTAL_LEVELS
    ) {

      startLevel(
        currentLevel + 1
      );

    } else {

      gameState =
        "HOME";
    }
  }
}


// ================================================================
// HUD
// ================================================================

function drawHUD() {

  drawingContext.shadowBlur = 0;
  drawingContext.shadowColor =
    "rgba(0,0,0,0)";
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;

  plainText(
    "SCORE  " +
    score,
    14,
    12,
    14,
    "#edf2f3",
    LEFT,
    TOP,
    BOLD
  );

  plainText(
    "LEVEL " +
    currentLevel,
    width / 2,
    12,
    14,
    "#edf2f3",
    CENTER,
    TOP,
    BOLD
  );

  plainText(
    "LIVES  " +
    lives,
    width - 14,
    12,
    14,
    "#edf2f3",
    RIGHT,
    TOP,
    BOLD
  );

  plainText(
    LEVEL_NAMES[
      currentLevel - 1
    ],
    width / 2,
    32,
    9,
    "#9daab0",
    CENTER,
    TOP
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
    levelStart;

  let timeRatio =
    constrain(
      elapsed /
      levelDuration,
      0,
      1
    );

  let scoreRatio =
    constrain(
      levelScore /
      targetScore,
      0,
      1
    );

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

  fill(
    75,
    160,
    190
  );

  rect(
    x,
    y,
    w * timeRatio,
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

  fill(
    205,
    175,
    55
  );

  rect(
    x,
    y + 18,
    w * scoreRatio,
    7,
    3
  );

  plainText(
    "SURVIVAL  " +
    floor(
      min(
        elapsed / 1000,
        levelDuration / 1000
      )
    ) +
    " / " +
    floor(
      levelDuration / 1000
    ) +
    " SEC",
    width / 2,
    y + 37,
    9,
    "#87999f"
  );

  plainText(
    "SCORE  " +
    levelScore +
    " / " +
    targetScore,
    width / 2,
    y + 51,
    9,
    "#87999f"
  );

  // Proper symmetrical buttons

  drawPauseIconButton(
    pauseButton.x,
    pauseButton.y
  );

  drawHomeIconButton(
    homeButton.x,
    homeButton.y
  );
}


// ================================================================
// PAUSE ICON
// ================================================================

function drawPauseIconButton(
  x,
  y
) {

  stroke("#468ea8");

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
    44
  );

  noStroke();

  fill("#edf7ff");

  rect(
    x - 5,
    y,
    4,
    15,
    1
  );

  rect(
    x + 5,
    y,
    4,
    15,
    1
  );
}


// ================================================================
// HOME ICON
// ================================================================

function drawHomeIconButton(
  x,
  y
) {

  stroke("#468ea8");

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
    44
  );

  stroke("#edf7ff");

  strokeWeight(2.2);

  noFill();

  beginShape();

  vertex(
    x - 9,
    y - 1
  );

  vertex(
    x,
    y - 9
  );

  vertex(
    x + 9,
    y - 1
  );

  vertex(
    x + 7,
    y - 1
  );

  vertex(
    x + 7,
    y + 8
  );

  vertex(
    x - 7,
    y + 8
  );

  vertex(
    x - 7,
    y - 1
  );

  endShape(CLOSE);
}


// ================================================================
// CONTROLS
// ================================================================

function resetControls() {

  let moveX =
    swappedControls
      ? width - 96
      : 96;

  let fireX =
    swappedControls
      ? 96
      : width - 96;

  joystick.baseX =
    moveX;

  joystick.baseY =
    height -
    safeBottom;

  joystick.knobX =
    moveX;

  joystick.knobY =
    joystick.baseY;

  joystick.active = false;

  fireButton.x =
    fireX;

  fireButton.y =
    height -
    safeBottom;

  powerButton.x =
    width / 2;

  powerButton.y =
    height -
    safeBottom;
}


// ================================================================
// JOYSTICK-ONLY MOVEMENT
// ================================================================
//
// THIS IS THE IMPORTANT FIX.
//
// A touch must START inside the joystick.
// Touching anywhere else on the gameplay screen does NOTHING.
// ================================================================

function handleJoystickMovement() {

  if (
    !joystickTouchActive
  ) {

    resetJoystickVisual();

    return;
  }

  if (
    touches.length === 0
  ) {

    joystickTouchActive =
      false;

    resetJoystickVisual();

    return;
  }

  // Find the touch closest to the joystick's current
  // controlled position. This allows simultaneous fire touch.

  let chosen = null;

  let bestDistance =
    Infinity;

  for (
    let touch of touches
  ) {

    let d =
      dist(
        touch.x,
        touch.y,
        joystickLastX,
        joystickLastY
      );

    if (
      d < bestDistance
    ) {

      bestDistance = d;

      chosen = touch;
    }
  }

  if (!chosen)
    return;

  joystickLastX =
    chosen.x;

  joystickLastY =
    chosen.y;

  let dx =
    chosen.x -
    joystickStartX;

  let dy =
    chosen.y -
    joystickStartY;

  let distance =
    sqrt(
      dx * dx +
      dy * dy
    );

  if (
    distance >
    joystick.radius
  ) {

    let angle =
      atan2(
        dy,
        dx
      );

    dx =
      cos(angle) *
      joystick.radius;

    dy =
      sin(angle) *
      joystick.radius;

    distance =
      joystick.radius;
  }

  joystick.knobX =
    joystickStartX +
    dx;

  joystick.knobY =
    joystickStartY +
    dy;

  // 360 degree movement

  if (
    distance > 5
  ) {

    let angle =
      atan2(
        dy,
        dx
      );

    player.angle =
      angle;

    let strength =
      constrain(
        distance /
        joystick.radius,
        0,
        1
      );

    let speed =
      moveSpeed();

    player.x +=
      cos(angle) *
      speed *
      strength;

    player.y +=
      sin(angle) *
      speed *
      strength;
  }
}


function resetJoystickVisual() {

  let x =
    swappedControls
      ? width - 96
      : 96;

  joystick.baseX =
    x;

  joystick.baseY =
    height -
    safeBottom;

  joystick.knobX =
    x;

  joystick.knobY =
    joystick.baseY;

  joystick.active = false;
}


// ================================================================
// CONTROL DRAW
// ================================================================

function drawControls() {

  let y =
    height -
    safeBottom;

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
    joystick.baseX,
    y,
    joystick.radius * 2
  );

  fill(
    70,
    190,
    220,
    90
  );

  circle(
    joystick.knobX,
    joystick.knobY,
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
    fireButton.x,
    y,
    fireButton.radius * 2
  );

  plainText(
    "FIRE",
    fireButton.x,
    y,
    13,
    "#f0f3f4",
    CENTER,
    CENTER,
    BOLD
  );

  // POWER

  if (
    powerReadyAt <=
    millis()
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
      powerButton.x,
      y,
      powerButton.radius * 2
    );

    plainText(
      "POWER",
      powerButton.x,
      y,
      10,
      "#f0f3f4",
      CENTER,
      CENTER,
      BOLD
    );
  }
}


// ================================================================
// BOTTOM HOME BUTTON
// ================================================================

function homeBottomButton() {

  let y =
    height -
    safeBottom +
    22;

  let w =
    min(
      190,
      width * 0.55
    );

  rectMode(CENTER);

  stroke("#468ea8");

  strokeWeight(1.5);

  fill("#051522");

  rect(
    width / 2,
    y,
    w,
    48,
    12
  );

  plainText(
    "HOME",
    width / 2,
    y,
    14,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );
}


// ================================================================
// ACTION BUTTON
// ================================================================

function actionButton(
  label,
  y,
  w
) {

  rectMode(CENTER);

  stroke("#468ea8");

  strokeWeight(1.5);

  fill("#051723");

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

  plainText(
    label,
    width / 2,
    y,
    14,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );
}


// ================================================================
// PAUSE
// ================================================================

function pauseGame() {

  if (
    gameState ===
    "PLAYING"
  ) {

    joystickTouchActive =
      false;

    resetJoystickVisual();

    gameState =
      "PAUSED";
  }
}


function resumeGame() {

  if (
    gameState !==
    "PAUSED"
  ) {

    return;
  }

  resetJoystickVisual();

  gameState =
    "PLAYING";
}


// ================================================================
// FROZEN GAME
// ================================================================

function drawFrozenGame() {

  // IMPORTANT:
  // Never draw a dying player during GAMEOVER.
  // This eliminates final-frame flicker.

  if (
    gameState !==
    "GAMEOVER"
  ) {

    if (player)
      player.display();
  }

  for (
    let alien of aliens
  ) {

    alien.display();
  }

  for (
    let bullet of bullets
  ) {

    bullet.display();
  }

  for (
    let power of powerUps
  ) {

    power.display();
  }

  for (
    let shot of enemyShots
  ) {

    shot.display();
  }

  if (boss)
    boss.display();

  drawHUD();

  updateParticles();
}


// ================================================================
// PAUSE SCREEN
// ================================================================

function drawPause() {

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

  plainText(
    "PAUSED",
    width / 2,
    height * 0.30,
    38,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    "LEVEL " +
    currentLevel +
    "  •  " +
    LEVEL_NAMES[
      currentLevel - 1
    ],
    width / 2,
    height * 0.38,
    14,
    "#89adbb"
  );

  actionButton(
    "RESUME",
    height * 0.53,
    270
  );

  actionButton(
    "HOME",
    height * 0.64,
    240
  );
}


// ================================================================
// GAME OVER
// ================================================================

function drawGameOver() {

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

  plainText(
    "MISSION LOST",
    width / 2,
    height * 0.28,
    36,
    "#ef5963",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    "LEVEL " +
    currentLevel,
    width / 2,
    height * 0.38,
    17,
    "#edf7ff",
    CENTER,
    CENTER,
    BOLD
  );

  plainText(
    LEVEL_NAMES[
      currentLevel - 1
    ],
    width / 2,
    height * 0.43,
    14,
    "#d9c65a",
    CENTER,
    CENTER,
    BOLD
  );

  actionButton(
    "RETRY LEVEL",
    height * 0.55,
    280
  );

  actionButton(
    "HOME",
    height * 0.66,
    240
  );
}


// ================================================================
// PARTICLES
// ================================================================

class Particle {

  constructor(
    x,
    y,
    tint
  ) {

    this.x = x;
    this.y = y;

    let angle =
      random(TWO_PI);

    let speed =
      random(
        1,
        6
      );

    this.vx =
      cos(angle) *
      speed;

    this.vy =
      sin(angle) *
      speed;

    this.life = 230;

    this.size =
      random(
        2,
        6
      );

    this.tint =
      tint ||
      "#ff8a30";
  }

  update() {

    this.x +=
      this.vx;

    this.y +=
      this.vy;

    this.vx *= 0.97;
    this.vy *= 0.97;

    this.life -= 7;
  }

  display() {

    let c =
      color(
        this.tint
      );

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
  count,
  tint
) {

  for (
    let i = 0;
    i < count;
    i++
  ) {

    particles.push(
      new Particle(
        x,
        y,
        tint
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

    let particle =
      particles[i];

    particle.update();

    particle.display();

    if (
      particle.life <= 0
    ) {

      particles.splice(
        i,
        1
      );
    }
  }
}


function createCelebration() {

  for (
    let i = 0;
    i < 80;
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
// SPECIAL POWER
// ================================================================

function useSpecial() {

  if (
    powerReadyAt >
    millis()
  ) {

    return;
  }

  let power =
    shipPower();

  playPowerSound();

  if (
    power ===
    "BURN SHOT"
  ) {

    powerEnds.BERSERKER =
      millis() + 5000;

  } else if (
    power ===
    "GRAVITY PULSE"
  ) {

    powerEnds.CRYO =
      millis() + 4500;

  } else if (
    power ===
    "TIME FREEZE"
  ) {

    powerEnds.CRYO =
      millis() + 6500;

  } else if (
    power ===
    "PHASE DODGE"
  ) {

    player.invincibleUntil =
      millis() + 4500;

  } else if (
    power ===
    "DRAGON RAGE"
  ) {

    powerEnds.BERSERKER =
      millis() + 6500;

  } else if (
    power ===
    "QUANTUM DASH"
  ) {

    player.invincibleUntil =
      millis() + 2200;

    powerEnds.BERSERKER =
      millis() + 5000;

  } else if (
    power ===
    "HOLY SHIELD"
  ) {

    powerEnds.SHIELD =
      millis() + 7000;

  } else if (
    power ===
    "TITAN CORE"
  ) {

    powerEnds.BERSERKER =
      millis() + 6500;

  } else if (
    power ===
    "REALITY BREAK"
  ) {

    powerEnds.CELESTIAL =
      millis() + 6500;

    powerEnds.SHIELD =
      millis() + 6500;

    for (
      let i =
        aliens.length - 1;
      i >= 0;
      i--
    ) {

      createExplosion(
        aliens[i].x,
        aliens[i].y,
        15
      );

      aliens.splice(
        i,
        1
      );

      score += 35;
      levelScore += 35;
    }

    if (boss) {

      boss.hp -=
        boss.maxHp *
        0.12;
    }

    startShake(18);

  } else {

    powerEnds.MULTI =
      millis() + 6000;
  }

  powerReadyAt =
    millis() + 15000;
}


// ================================================================
// RESET POWERS
// ================================================================

function resetPowers() {

  for (
    let powerName in
    powerEnds
  ) {

    powerEnds[
      powerName
    ] = 0;
  }
}


// ================================================================
// TOUCH START
// ================================================================

function touchStarted() {

  initAudio();

  let x =
    touches.length
      ? touches[0].x
      : mouseX;

  let y =
    touches.length
      ? touches[0].y
      : mouseY;


  // ============================================================
  // ARCHIVE
  // ============================================================

  if (
    gameState ===
    "ARCHIVE"
  ) {

    if (
      touches.length === 0
    ) {

      return false;
    }

    let touch =
      touches[0];

    if (
      isArchiveHomeButton(
        touch.x,
        touch.y
      )
    ) {

      archiveTouching = false;
      archiveDragging = false;
      archiveDraggingScrollbar = false;

      archiveScroll = 0;
      archiveTargetScroll = 0;

      gameState =
        "HOME";

      return false;
    }

    if (
      isOnArchiveScrollbar(
        touch.x,
        touch.y
      )
    ) {

      archiveTouching = true;
      archiveDragging = true;
      archiveDraggingScrollbar = true;

      archiveStartX =
        touch.x;

      archiveStartY =
        touch.y;

      archiveLastX =
        touch.x;

      archiveLastY =
        touch.y;

      setArchiveScrollFromScrollbar(
        touch.y
      );

      return false;
    }

    let g =
      archiveGeometry();

    if (
      touch.y < g.top ||
      touch.y > g.bottom
    ) {

      return false;
    }

    archiveTouching = true;
    archiveDragging = false;
    archiveDraggingScrollbar = false;

    archiveStartX =
      touch.x;

    archiveStartY =
      touch.y;

    archiveLastX =
      touch.x;

    archiveLastY =
      touch.y;

    return false;
  }


  // ============================================================
  // GAMEPLAY
  // ============================================================

  if (
    gameState ===
    "PLAYING"
  ) {

    // ----------------------------------------------------------
    // IMPORTANT:
    // First determine whether touch starts inside JOYSTICK.
    // ----------------------------------------------------------

    if (
      isInsideJoystick(
        x,
        y
      )
    ) {

      joystickTouchActive =
        true;

      joystick.active = true;

      joystickStartX =
        joystick.baseX;

      joystickStartY =
        joystick.baseY;

      joystickLastX =
        x;

      joystickLastY =
        y;

      return false;
    }

    // ----------------------------------------------------------
    // FIRE
    // ----------------------------------------------------------

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

      return false;
    }

    // ----------------------------------------------------------
    // POWER
    // ----------------------------------------------------------

    if (
      dist(
        x,
        y,
        powerButton.x,
        powerButton.y
      ) <
      powerButton.radius +
      15
    ) {

      useSpecial();

      return false;
    }

    // ----------------------------------------------------------
    // PAUSE
    // ----------------------------------------------------------

    if (
      dist(
        x,
        y,
        pauseButton.x,
        pauseButton.y
      ) < 34
    ) {

      pauseGame();

      return false;
    }

    // ----------------------------------------------------------
    // HOME
    // ----------------------------------------------------------

    if (
      dist(
        x,
        y,
        homeButton.x,
        homeButton.y
      ) < 34
    ) {

      joystickTouchActive =
        false;

      gameState =
        "HOME";

      return false;
    }

    // ----------------------------------------------------------
    // ANY OTHER SCREEN TOUCH = NOTHING
    // ----------------------------------------------------------

    return false;
  }


  // ============================================================
  // OTHER SCREENS
  // ============================================================

  handleTap(
    x,
    y
  );

  return false;
}


// ================================================================
// TOUCH MOVE
// ================================================================

function touchMoved() {

  // --------------------------------------------------------------
  // ARCHIVE
  // --------------------------------------------------------------

  if (
    gameState ===
    "ARCHIVE"
  ) {

    if (
      !archiveTouching ||
      touches.length === 0
    ) {

      return false;
    }

    let touch =
      touches[0];

    if (
      archiveDraggingScrollbar
    ) {

      setArchiveScrollFromScrollbar(
        touch.y
      );

      archiveLastX =
        touch.x;

      archiveLastY =
        touch.y;

      return false;
    }

    let movement =
      dist(
        archiveStartX,
        archiveStartY,
        touch.x,
        touch.y
      );

    if (
      movement > 10
    ) {

      archiveDragging =
        true;
    }

    let deltaY =
      archiveLastY -
      touch.y;

    if (
      archiveDragging
    ) {

      let g =
        archiveGeometry();

      archiveTargetScroll +=
        deltaY * 1.15;

      archiveTargetScroll =
        constrain(
          archiveTargetScroll,
          0,
          g.maxScroll
        );
    }

    archiveLastX =
      touch.x;

    archiveLastY =
      touch.y;

    return false;
  }


  // --------------------------------------------------------------
  // GAMEPLAY
  // --------------------------------------------------------------

  if (
    gameState ===
    "PLAYING"
  ) {

    // If movement did not start in joystick,
    // movement remains disabled.

    return false;
  }

  return false;
}


// ================================================================
// TOUCH END
// ================================================================

function touchEnded() {

  // --------------------------------------------------------------
  // JOYSTICK
  // --------------------------------------------------------------

  if (
    gameState ===
    "PLAYING"
  ) {

    joystickTouchActive =
      false;

    resetJoystickVisual();

    return false;
  }


  // --------------------------------------------------------------
  // ARCHIVE
  // --------------------------------------------------------------

  if (
    gameState ===
    "ARCHIVE"
  ) {

    if (
      !archiveTouching
    ) {

      return false;
    }

    let wasScrollbar =
      archiveDraggingScrollbar;

    let movement =
      dist(
        archiveStartX,
        archiveStartY,
        archiveLastX,
        archiveLastY
      );

    let wasTap =
      movement < 14 &&
      !archiveDragging &&
      !archiveDraggingScrollbar;

    archiveTouching = false;
    archiveDragging = false;
    archiveDraggingScrollbar = false;

    if (
      isArchiveHomeButton(
        archiveLastX,
        archiveLastY
      )
    ) {

      gameState =
        "HOME";

      archiveScroll = 0;
      archiveTargetScroll = 0;

      return false;
    }

    if (
      wasScrollbar
    ) {

      clampArchiveScroll();

      return false;
    }

    if (
      wasTap
    ) {

      handleArchiveTap(
        archiveStartX,
        archiveStartY
      );
    }

    clampArchiveScroll();

    return false;
  }

  return false;
}


// ================================================================
// JOYSTICK HIT
// ================================================================

function isInsideJoystick(
  x,
  y
) {

  return (
    dist(
      x,
      y,
      joystick.baseX,
      joystick.baseY
    ) <=
    joystick.radius + 12
  );
}


// ================================================================
// ARCHIVE HOME
// ================================================================

function isArchiveHomeButton(
  x,
  y
) {

  let homeY =
    height -
    safeBottom +
    22;

  return insideRect(
    x,
    y,
    width / 2,
    homeY,
    min(
      220,
      width * 0.65
    ),
    70
  );
}


// ================================================================
// MOUSE WHEEL
// ================================================================

function mouseWheel(event) {

  if (
    gameState ===
    "ARCHIVE"
  ) {

    let g =
      archiveGeometry();

    archiveTargetScroll +=
      event.delta;

    archiveTargetScroll =
      constrain(
        archiveTargetScroll,
        0,
        g.maxScroll
      );

    return false;
  }

  return true;
}


// ================================================================
// MOUSE PRESS
// ================================================================

function mousePressed() {

  initAudio();

  if (
    gameState ===
    "ARCHIVE"
  ) {

    if (
      isArchiveHomeButton(
        mouseX,
        mouseY
      )
    ) {

      gameState =
        "HOME";

      archiveScroll = 0;
      archiveTargetScroll = 0;

      return false;
    }

    if (
      isOnArchiveScrollbar(
        mouseX,
        mouseY
      )
    ) {

      archiveDraggingScrollbar =
        true;

      archiveTouching =
        true;

      archiveDragging =
        true;

      setArchiveScrollFromScrollbar(
        mouseY
      );

      archiveLastX =
        mouseX;

      archiveLastY =
        mouseY;

      return false;
    }

    archiveTouching =
      true;

    archiveDragging =
      false;

    archiveDraggingScrollbar =
      false;

    archiveStartX =
      mouseX;

    archiveStartY =
      mouseY;

    archiveLastX =
      mouseX;

    archiveLastY =
      mouseY;

    return false;
  }


  if (
    gameState ===
    "PLAYING"
  ) {

    // Desktop joystick

    if (
      isInsideJoystick(
        mouseX,
        mouseY
      )
    ) {

      joystickTouchActive =
        true;

      joystick.active =
        true;

      joystickStartX =
        joystick.baseX;

      joystickStartY =
        joystick.baseY;

      joystickLastX =
        mouseX;

      joystickLastY =
        mouseY;

      return false;
    }

    if (
      dist(
        mouseX,
        mouseY,
        fireButton.x,
        fireButton.y
      ) <
      fireButton.radius +
      20
    ) {

      shoot();

      return false;
    }

    if (
      dist(
        mouseX,
        mouseY,
        powerButton.x,
        powerButton.y
      ) <
      powerButton.radius +
      15
    ) {

      useSpecial();

      return false;
    }

    if (
      dist(
        mouseX,
        mouseY,
        pauseButton.x,
        pauseButton.y
      ) < 34
    ) {

      pauseGame();

      return false;
    }

    if (
      dist(
        mouseX,
        mouseY,
        homeButton.x,
        homeButton.y
      ) < 34
    ) {

      gameState =
        "HOME";

      return false;
    }

    // Other screen area does nothing.

    return false;
  }

  handleTap(
    mouseX,
    mouseY
  );

  return false;
}


// ================================================================
// MOUSE DRAGGED
// ================================================================

function mouseDragged() {

  if (
    gameState ===
    "ARCHIVE"
  ) {

    if (
      archiveDraggingScrollbar
    ) {

      setArchiveScrollFromScrollbar(
        mouseY
      );

      return false;
    }

    if (
      archiveTouching
    ) {

      let deltaY =
        archiveLastY -
        mouseY;

      archiveTargetScroll +=
        deltaY;

      let g =
        archiveGeometry();

      archiveTargetScroll =
        constrain(
          archiveTargetScroll,
          0,
          g.maxScroll
        );

      archiveLastX =
        mouseX;

      archiveLastY =
        mouseY;

      archiveDragging =
        true;

      return false;
    }
  }


  if (
    gameState ===
    "PLAYING" &&
    joystickTouchActive
  ) {

    joystickLastX =
      mouseX;

    joystickLastY =
      mouseY;

    let dx =
      mouseX -
      joystickStartX;

    let dy =
      mouseY -
      joystickStartY;

    let distance =
      sqrt(
        dx * dx +
        dy * dy
      );

    if (
      distance >
      joystick.radius
    ) {

      let angle =
        atan2(
          dy,
          dx
        );

      dx =
        cos(angle) *
        joystick.radius;

      dy =
        sin(angle) *
        joystick.radius;
    }

    joystick.knobX =
      joystickStartX +
      dx;

    joystick.knobY =
      joystickStartY +
      dy;

    return false;
  }

  return false;
}


// ================================================================
// MOUSE RELEASE
// ================================================================

function mouseReleased() {

  if (
    gameState ===
    "PLAYING"
  ) {

    joystickTouchActive =
      false;

    resetJoystickVisual();

    return false;
  }

  if (
    gameState ===
    "ARCHIVE"
  ) {

    archiveDraggingScrollbar =
      false;

    archiveDragging =
      false;

    archiveTouching =
      false;

    clampArchiveScroll();

    return false;
  }

  return false;
}


// ================================================================
// UNIVERSAL TAP
// ================================================================

function handleTap(
  x,
  y
) {

  // ============================================================
  // HOME
  // ============================================================

  if (
    gameState ===
    "HOME"
  ) {

    let buttonYs = [

      height * 0.32,
      height * 0.43,
      height * 0.54,
      height * 0.65,
      height * 0.76

    ];

    for (
      let i = 0;
      i < buttonYs.length;
      i++
    ) {

      if (
        insideRect(
          x,
          y,
          width / 2,
          buttonYs[i],
          min(
            320,
            width * 0.80
          ),
          70
        )
      ) {

        if (i === 0) {

          gameState =
            "LEVELS";

        } else if (i === 1) {

          gameState =
            "ARCHIVE";

          archiveScroll = 0;
          archiveTargetScroll = 0;

        } else if (i === 2) {

          gameState =
            "ABOUT";

        } else if (i === 3) {

          gameState =
            "SETTINGS";

        } else if (i === 4) {

          rating = 0;

          gameState =
            "RATING";
        }

        return;
      }
    }

    return;
  }


  // ============================================================
  // MENU HOME
  // ============================================================

  if (
    gameState === "LEVELS" ||
    gameState === "ABOUT" ||
    gameState === "SETTINGS"
  ) {

    let homeY =
      height -
      safeBottom +
      22;

    if (
      insideRect(
        x,
        y,
        width / 2,
        homeY,
        min(
          210,
          width * 0.60
        ),
        68
      )
    ) {

      gameState =
        "HOME";

      return;
    }
  }


  // ============================================================
  // LEVEL SELECT
  // ============================================================

  if (
    gameState ===
    "LEVELS"
  ) {

    let cols = 4;
    let gap = 9;

    let size =
      min(
        66,
        (width - 48) /
        cols
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
      let level = 1;
      level <= TOTAL_LEVELS;
      level++
    ) {

      let col =
        (level - 1) %
        cols;

      let row =
        floor(
          (level - 1) /
          cols
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
        insideRect(
          x,
          y,
          bx,
          by,
          size + 12,
          size + 12
        )
      ) {

        if (
          level <=
          unlockedLevel
        ) {

          startLevel(
            level
          );
        }

        return;
      }
    }

    return;
  }


  // ============================================================
  // SETTINGS
  // ============================================================

  if (
    gameState ===
    "SETTINGS"
  ) {

    if (
      insideRect(
        x,
        y,
        width / 2,
        height * 0.33,
        min(
          350,
          width * 0.88
        ),
        100
      )
    ) {

      swappedControls =
        !swappedControls;

      resetControls();

      saveGame();

      return;
    }

    if (
      insideRect(
        x,
        y,
        width / 2,
        height * 0.49,
        min(
          350,
          width * 0.88
        ),
        100
      )
    ) {

      soundOn =
        !soundOn;

      saveGame();

      if (soundOn) {
        initAudio();
      }

      return;
    }

    return;
  }


  // ============================================================
  // RATING
  // ============================================================

  if (
    gameState ===
    "RATING"
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

      let starX =
        width / 2 -
        total / 2 +
        (i - 1) *
        gap;

      if (
        dist(
          x,
          y,
          starX,
          height * 0.45
        ) < 35
      ) {

        rating = i;

        return;
      }
    }

    if (
      insideRect(
        x,
        y,
        width / 2,
        height * 0.65,
        280,
        68
      )
    ) {

      gameState =
        "HOME";

      return;
    }

    if (
      insideRect(
        x,
        y,
        width / 2,
        height * 0.75,
        280,
        68
      )
    ) {

      gameState =
        "HOME";

      return;
    }

    return;
  }


  // ============================================================
  // PAUSED
  // ============================================================

  if (
    gameState ===
    "PAUSED"
  ) {

    if (
      insideRect(
        x,
        y,
        width / 2,
        height * 0.53,
        300,
        70
      )
    ) {

      resumeGame();

      return;
    }

    if (
      insideRect(
        x,
        y,
        width / 2,
        height * 0.64,
        270,
        70
      )
    ) {

      gameState =
        "HOME";

      return;
    }

    return;
  }


  // ============================================================
  // GAME OVER
  // ============================================================

  if (
    gameState ===
    "GAMEOVER"
  ) {

    if (
      insideRect(
        x,
        y,
        width / 2,
        height * 0.55,
        300,
        70
      )
    ) {

      startLevel(
        currentLevel
      );

      return;
    }

    if (
      insideRect(
        x,
        y,
        width / 2,
        height * 0.66,
        270,
        70
      )
    ) {

      gameState =
        "HOME";

      return;
    }
  }
}


// ================================================================
// ARCHIVE TAP
// ================================================================

function handleArchiveTap(
  x,
  y
) {

  if (
    isArchiveHomeButton(
      x,
      y
    )
  ) {

    gameState =
      "HOME";

    archiveScroll = 0;
    archiveTargetScroll = 0;

    return;
  }

  let g =
    archiveGeometry();

  if (
    y < g.top ||
    y > g.bottom
  ) {

    return;
  }

  if (
    x >
    width - 38
  ) {

    return;
  }

  let cardWidth =
    min(
      355,
      width * 0.89
    );

  for (
    let i = 0;
    i < SHIPS.length;
    i++
  ) {

    let cardY =
      g.top +
      g.topPadding +
      g.cardHeight / 2 +
      i *
      (
        g.cardHeight +
        g.gap
      ) -
      archiveScroll;

    if (
      insideRect(
        x,
        y,
        width / 2,
        cardY,
        cardWidth + 12,
        g.cardHeight + 12
      )
    ) {

      if (
        unlockedLevel >=
        SHIPS[i].unlock
      ) {

        selectedShip =
          i;

        saveGame();
      }

      return;
    }
  }
}


// ================================================================
// HIT TEST
// ================================================================

function insideRect(
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
// RESIZE
// ================================================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  createStars();

  updateLayout();

  clampArchiveScroll();
}
