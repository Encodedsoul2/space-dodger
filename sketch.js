// ================================================================
// SPACE DODGER — GALACTIC CAMPAIGN
// STABLE MOBILE EDITION
// p5.js | 20 LEVELS | BOSS | POWERS | SHIPS | PORTALS
// ================================================================

let ship;
let bullets = [];
let meteors = [];
let particles = [];
let powerUps = [];
let enemyWaves = [];
let stars = [];

let portal = null;
let boss = null;

let gameState = "HOME";

let currentLevel = 1;
let unlockedLevel = 1;
let selectedShip = 0;

let score = 0;
let levelScore = 0;
let lives = 3;

let levelStartTime = 0;
let levelDuration = 45000;
let levelTargetScore = 500;

let currentTitle = "SPACE ROOKIE";

let lastMeteorTime = 0;
let lastPowerTime = 0;
let lastShotTime = 0;

let soundEnabled = true;
let controlsSwapped = false;

let audioCtx = null;

let bossActive = false;
let defeatedBossThisRun = false;

let currentGalaxy = 0;
let galaxyEndTime = 0;
let nextPortalScore = 900;

let novaWave = null;

let pauseStartTime = 0;

let multiShotEnd = 0;
let shieldEnd = 0;
let titanEnd = 0;
let twinEnd = 0;
let trinityEnd = 0;
let phantomEnd = 0;
let berserkerEnd = 0;
let cryoEnd = 0;
let celestialEnd = 0;

const TOTAL_LEVELS = 20;

const LEVEL_TITLES = [
  "SPACE ROOKIE",
  "STAR CADET",
  "ORBIT SCOUT",
  "METEOR HUNTER",
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

const SHIP_ARCHIVE = [
  {name:"NOVA SCOUT",unlock:1,body:"#10204a",edge:"#00eaff",core:"#ffffff"},
  {name:"SOLAR FANG",unlock:3,body:"#5b2410",edge:"#ff8a00",core:"#ffe066"},
  {name:"NEBULA WING",unlock:5,body:"#32105b",edge:"#c66cff",core:"#ffffff"},
  {name:"CRYO HAWK",unlock:7,body:"#103c60",edge:"#7ee8ff",core:"#dfffff"},
  {name:"VOID SPEAR",unlock:9,body:"#251033",edge:"#ff4ddd",core:"#ffffff"},
  {name:"DRAGON BANE",unlock:10,body:"#5c0715",edge:"#ff1744",core:"#ffe600"},
  {name:"QUANTUM EDGE",unlock:12,body:"#063f45",edge:"#00ffd5",core:"#ffffff"},
  {name:"STAR PALADIN",unlock:15,body:"#55490a",edge:"#fff176",core:"#ffffff"},
  {name:"GALACTIC TITAN",unlock:18,body:"#431c58",edge:"#ff78ff",core:"#ffffaa"},
  {name:"MULTIVERSE KING",unlock:20,body:"#5a3f00",edge:"#ffd700",core:"#ffffff"}
];

const POWER_TYPES = [
  "MULTI",
  "SHIELD",
  "TITAN",
  "TWIN",
  "TRINITY",
  "NOVA",
  "PHANTOM",
  "BERSERKER",
  "CRYO",
  "CELESTIAL"
];

const POWER_DURATION = {
  MULTI:9000,
  SHIELD:9000,
  TITAN:8500,
  TWIN:9000,
  TRINITY:8500,
  PHANTOM:8000,
  BERSERKER:7500,
  CRYO:8500,
  CELESTIAL:7000
};

let joystick = {
  active:false,
  baseX:90,
  baseY:500,
  knobX:90,
  knobY:500,
  radius:58
};

let fireButton = {
  x:300,
  y:500,
  radius:50
};

let pauseButton = {
  x:38,
  y:92
};

let homeButton = {
  x:0,
  y:92
};


// ================================================================
// SETUP
// ================================================================

function setup(){

  createCanvas(windowWidth,windowHeight);

  textFont("Arial");

  loadProgress();

  createStars();

  ship = new Ship();

  resetControls();
}


// ================================================================
// SAVE / LOAD
// ================================================================

function saveProgress(){

  try{

    localStorage.setItem(
      "spaceDodgerSave",
      JSON.stringify({
        unlockedLevel:unlockedLevel,
        selectedShip:selectedShip,
        soundEnabled:soundEnabled,
        controlsSwapped:controlsSwapped
      })
    );

  }catch(e){}

}


function loadProgress(){

  try{

    let raw =
      localStorage.getItem("spaceDodgerSave");

    if(!raw) return;

    let d = JSON.parse(raw);

    unlockedLevel =
      constrain(
        Number(d.unlockedLevel)||1,
        1,
        TOTAL_LEVELS
      );

    selectedShip =
      constrain(
        Number(d.selectedShip)||0,
        0,
        SHIP_ARCHIVE.length-1
      );

    soundEnabled =
      d.soundEnabled !== false;

    controlsSwapped =
      d.controlsSwapped === true;

  }catch(e){}

}


// ================================================================
// DRAW
// ================================================================

function draw(){

  drawBackground();
  drawStars();

  if(gameState==="HOME"){
    drawHome();
    return;
  }

  if(gameState==="LEVELS"){
    drawLevelSelection();
    return;
  }

  if(gameState==="ARCHIVE"){
    drawArchive();
    return;
  }

  if(gameState==="ABOUT"){
    drawAbout();
    return;
  }

  if(gameState==="SETTINGS"){
    drawSettings();
    return;
  }

  if(gameState==="PLAYING"){
    runGame();
    return;
  }

  if(gameState==="PAUSED"){
    drawFrozenGame();
    drawPauseOverlay();
    return;
  }

  if(gameState==="GAMEOVER"){
    drawFrozenGame();
    drawGameOver();
    return;
  }

  if(gameState==="LEVELUP"){
    updateParticles();
    drawLevelComplete();
  }
}


// ================================================================
// BACKGROUND
// ================================================================

function drawBackground(){

  if(bossActive){

    let pulse =
      sin(frameCount*.04)*6;

    background(
      15+pulse,
      1,
      8
    );

    return;
  }

  if(currentGalaxy===1)
    background(27,3,17);

  else if(currentGalaxy===2)
    background(2,10,33);

  else if(currentGalaxy===3)
    background(0,24,16);

  else
    background(2,5,18);
}


// ================================================================
// STARS
// ================================================================

function createStars(){

  stars=[];

  for(let i=0;i<150;i++){

    stars.push({
      x:random(width),
      y:random(height),
      s:random(1,3),
      speed:random(.2,1.1),
      phase:random(TWO_PI)
    });

  }

}


function drawStars(){

  noStroke();

  for(let s of stars){

    s.phase += .025;
    s.y += s.speed;

    if(s.y>height){
      s.y=0;
      s.x=random(width);
    }

    let alpha =
      130 + sin(s.phase)*90;

    if(bossActive)
      fill(255,70,60,alpha);

    else if(currentGalaxy===1)
      fill(255,80,130,alpha);

    else if(currentGalaxy===2)
      fill(80,190,255,alpha);

    else if(currentGalaxy===3)
      fill(80,255,170,alpha);

    else
      fill(255,255,255,alpha);

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

function drawHome(){

  push();

  textAlign(CENTER,CENTER);

  drawingContext.shadowBlur=30;
  drawingContext.shadowColor="#00ddff";

  fill(0,230,255);

  textStyle(BOLD);

  textSize(min(48,width*.12));

  text(
    "SPACE DODGER",
    width/2,
    height*.17
  );

  drawingContext.shadowBlur=0;

  fill(255,220,60);

  textSize(14);

  text(
    "GALACTIC CAMPAIGN",
    width/2,
    height*.23
  );

  drawMenuButton("▶  PLAY",height*.37);
  drawMenuButton("🚀  ARCHIVE",height*.47);
  drawMenuButton("ℹ  ABOUT",height*.57);
  drawMenuButton("⚙  SETTINGS",height*.67);
  drawMenuButton("★  RATE US",height*.77);

  fill(160);

  textStyle(NORMAL);

  textSize(11);

  text(
    "Highest Level Unlocked: "+
    unlockedLevel+
    " / "+
    TOTAL_LEVELS,
    width/2,
    height*.89
  );

  pop();

}


function drawMenuButton(label,y){

  let w=min(300,width*.78);

  push();

  rectMode(CENTER);

  stroke(0,210,255,170);
  strokeWeight(2);

  fill(5,20,40,220);

  rect(
    width/2,
    y,
    w,
    52,
    14
  );

  noStroke();

  fill(255);

  textAlign(CENTER,CENTER);
  textStyle(BOLD);
  textSize(16);

  text(
    label,
    width/2,
    y
  );

  pop();

}


// ================================================================
// LEVELS
// ================================================================

function drawLevelSelection(){

  push();

  textAlign(CENTER,CENTER);

  fill(0,225,255);
  textStyle(BOLD);
  textSize(27);

  text(
    "SELECT LEVEL",
    width/2,
    55
  );

  fill(255,220,60);
  textSize(12);

  text(
    "RANK",
    width/2,
    86
  );

  fill(255);
  textSize(17);

  text(
    "★ "+
    LEVEL_TITLES[unlockedLevel-1]+
    " ★",
    width/2,
    110
  );

  let cols=4;
  let gap=10;

  let size=min(
    68,
    (width-50)/cols
  );

  let totalWidth =
    cols*size+
    (cols-1)*gap;

  let startX =
    width/2-totalWidth/2+
    size/2;

  let startY=165;

  for(let i=1;i<=TOTAL_LEVELS;i++){

    let col=(i-1)%cols;
    let row=floor((i-1)/cols);

    let x =
      startX+
      col*(size+gap);

    let y =
      startY+
      row*(size+17);

    let open =
      i<=unlockedLevel;

    rectMode(CENTER);

    stroke(
      open
        ? color(0,220,255)
        : color(70)
    );

    fill(
      open
        ? color(5,35,55)
        : color(20,20,25)
    );

    rect(
      x,y,
      size,size,
      12
    );

    noStroke();

    fill(open?255:90);

    textStyle(BOLD);
    textSize(18);

    text(
      open?i:"🔒",
      x,y-4
    );

    if(open){

      fill(120,220,255);

      textSize(7);

      text(
        [5,10,15,20].includes(i)
          ?"BOSS"
          :"LEVEL",
        x,
        y+20
      );

    }

  }

  drawBackButton();

  pop();

}


// ================================================================
// ARCHIVE
// ================================================================

function drawArchive(){

  push();

  textAlign(CENTER,CENTER);

  fill(0,230,255);

  textStyle(BOLD);
  textSize(26);

  text(
    "SPACE DODGER ARCHIVE",
    width/2,
    48
  );

  fill(170);
  textStyle(NORMAL);
  textSize(10);

  text(
    "Unlock ships by reaching campaign levels",
    width/2,
    78
  );

  let cardW=min(160,width*.43);
  let cardH=105;
  let gapX=14;
  let gapY=12;

  for(let i=0;i<SHIP_ARCHIVE.length;i++){

    let col=i%2;
    let row=floor(i/2);

    let x =
      width/2+
      (
        col===0
          ?-(cardW/2+gapX/2)
          :(cardW/2+gapX/2)
      );

    let y =
      130+
      row*(cardH+gapY);

    let d=SHIP_ARCHIVE[i];

    let unlocked =
      unlockedLevel>=d.unlock;

    let selected =
      selectedShip===i;

    rectMode(CENTER);

    stroke(
      selected
        ? color(255,220,40)
        : unlocked
          ? color(d.edge)
          : color(70)
    );

    strokeWeight(selected?3:2);

    fill(5,15,30);

    rect(
      x,y,
      cardW,cardH,
      12
    );

    if(unlocked){

      drawMiniShip(x,y-18,i);

      noStroke();

      fill(255);
      textSize(9);

      text(
        d.name,
        x,y+25
      );

      fill(
        selected
          ? color(255,220,40)
          : color(120,220,255)
      );

      textSize(8);

      text(
        selected
          ?"SELECTED"
          :"TAP TO SELECT",
        x,y+42
      );

    }else{

      noStroke();

      fill(100);
      textSize(22);

      text("🔒",x,y-12);

      textSize(8);

      text(
        "UNLOCK AT LEVEL "+d.unlock,
        x,y+24
      );

    }

  }

  drawBackButton();

  pop();

}


function drawMiniShip(x,y,index){

  let d=SHIP_ARCHIVE[index];

  push();

  translate(x,y);
  scale(.65);

  drawingContext.shadowBlur=16;
  drawingContext.shadowColor=d.edge;

  stroke(d.edge);
  strokeWeight(2);

  fill(d.body);

  beginShape();

  vertex(0,-28);
  vertex(-20,17);
  vertex(0,9);
  vertex(20,17);

  endShape(CLOSE);

  noStroke();

  fill(d.core);

  ellipse(0,-4,8,14);

  drawingContext.shadowBlur=0;

  pop();

}


// ================================================================
// ABOUT
// ================================================================

function drawAbout(){

  push();

  textAlign(CENTER,CENTER);

  fill(0,225,255);
  textStyle(BOLD);
  textSize(30);

  text(
    "ABOUT",
    width/2,
    height*.22
  );

  fill(255);
  textStyle(NORMAL);
  textSize(16);

  text(
    "SPACE DODGER",
    width/2,
    height*.38
  );

  fill(255,220,60);
  textStyle(BOLD);

  text(
    "GALACTIC CAMPAIGN",
    width/2,
    height*.44
  );

  fill(180);
  textStyle(NORMAL);
  textSize(13);

  text(
    "20-Level Mobile Space Adventure",
    width/2,
    height*.51
  );

  fill(0,225,255);

  text(
    "Developed by Mohan & Puchki",
    width/2,
    height*.58
  );

  drawBackButton();

  pop();

}


// ================================================================
// SETTINGS
// ================================================================

function drawSettings(){

  push();

  textAlign(CENTER,CENTER);

  fill(0,225,255);
  textStyle(BOLD);
  textSize(29);

  text(
    "SETTINGS",
    width/2,
    height*.18
  );

  drawSettingBox(
    "CONTROL LAYOUT",
    controlsSwapped
      ?"FIRE LEFT • MOVE RIGHT"
      :"MOVE LEFT • FIRE RIGHT",
    height*.37
  );

  drawSettingBox(
    "SOUND EFFECTS",
    soundEnabled
      ?"🔊 ON"
      :"🔇 OFF",
    height*.53
  );

  fill(140);
  textStyle(NORMAL);
  textSize(11);

  text(
    "Tap an option to change it",
    width/2,
    height*.64
  );

  drawBackButton();

  pop();

}


function drawSettingBox(title,value,y){

  let w=min(320,width*.82);

  rectMode(CENTER);

  stroke(0,210,255);
  fill(5,25,45);

  rect(
    width/2,
    y,
    w,80,
    15
  );

  noStroke();

  fill(150);
  textSize(10);

  text(title,width/2,y-18);

  fill(255);
  textStyle(BOLD);
  textSize(13);

  text(value,width/2,y+12);

}


// ================================================================
// BACK
// ================================================================

function drawBackButton(){

  push();

  rectMode(CENTER);

  stroke(0,200,255);

  fill(5,20,35);

  rect(
    width/2,
    height-50,
    150,42,
    12
  );

  noStroke();

  fill(255);

  textStyle(BOLD);
  textSize(14);

  text(
    "← HOME",
    width/2,
    height-50
  );

  pop();

}


// ================================================================
// LEVEL START
// ================================================================

function startLevel(lvl){

  currentLevel =
    constrain(
      lvl,
      1,
      TOTAL_LEVELS
    );

  currentTitle =
    LEVEL_TITLES[currentLevel-1];

  score=0;
  levelScore=0;
  lives=3;

  levelDuration =
    45000+
    (currentLevel-1)*6000;

  levelTargetScore =
    450+
    (currentLevel-1)*180+
    floor(pow(currentLevel,1.45)*28);

  levelStartTime=millis();

  bullets=[];
  meteors=[];
  particles=[];
  powerUps=[];
  enemyWaves=[];

  portal=null;
  boss=null;

  bossActive=false;
  defeatedBossThisRun=false;

  currentGalaxy=0;

  nextPortalScore =
    850+
    currentLevel*100;

  resetPowerTimers();

  ship=new Ship();

  resetControls();

  lastMeteorTime=millis();
  lastPowerTime=millis();
  lastShotTime=0;

  gameState="PLAYING";

  playTone(
    350,
    700,
    .25,
    "sine",
    .05
  );

}


// ================================================================
// PLAYER
// ================================================================

class Ship{

  constructor(){

    this.x=width/2;
    this.y=height*.7;

    this.angle=-HALF_PI;

    this.speed=4.8;

    this.radius=17;

    this.invincibleUntil=0;

  }


  update(){

    if(this.x<-45)
      this.x=width+45;

    if(this.x>width+45)
      this.x=-45;

    if(this.y<-45)
      this.y=height+45;

    if(this.y>height+45)
      this.y=-45;

  }


  display(){

    if(
      millis()<this.invincibleUntil &&
      floor(millis()/100)%2===0
    )
      return;

    let offsets=[0];

    if(millis()<trinityEnd)
      offsets=[-24,0,24];

    else if(millis()<twinEnd)
      offsets=[-19,19];

    for(let off of offsets)
      this.drawShip(
        off,
        offsets.length>1
      );

    if(
      millis()<shieldEnd ||
      millis()<celestialEnd
    )
      drawShield(this.x,this.y);

  }


  drawShip(offset,mini){

    let d=SHIP_ARCHIVE[selectedShip];

    let form=getTransformation();

    let edge=d.edge;
    let body=d.body;
    let core=d.core;

    let scaleValue=mini?.83:1;

    if(form==="TITAN"){
      edge="#ff8a00";
      body="#5b1c10";
      core="#ffe600";
      scaleValue*=1.4;
    }

    if(form==="BERSERKER"){
      edge="#ff1744";
      body="#590719";
      core="#ffffff";
      scaleValue*=1.5;
    }

    if(form==="PHANTOM"){
      edge="#d66cff";
      body="#260a45";
      core="#ffffff";
      scaleValue*=1.12;
    }

    if(form==="CRYO"){
      edge="#8cecff";
      body="#123b61";
      core="#ffffff";
      scaleValue*=1.2;
    }

    if(form==="CELESTIAL"){
      edge="#fff176";
      body="#69550c";
      core="#ffffff";
      scaleValue*=1.32;
    }

    let ox=
      cos(this.angle+HALF_PI)*offset;

    let oy=
      sin(this.angle+HALF_PI)*offset;

    push();

    translate(
      this.x+ox,
      this.y+oy
    );

    rotate(
      this.angle+HALF_PI
    );

    scale(scaleValue);

    drawingContext.shadowBlur=24;
    drawingContext.shadowColor=edge;

    noStroke();

    fill(edge);

    triangle(
      -4,15,
      4,15,
      0,random(25,34)
    );

    stroke(edge);
    strokeWeight(2.5);
    fill(body);

    if(form==="BERSERKER"){

      beginShape();

      vertex(0,-36);
      vertex(-13,-12);
      vertex(-34,8);
      vertex(-18,25);
      vertex(0,15);
      vertex(18,25);
      vertex(34,8);
      vertex(13,-12);

      endShape(CLOSE);

    }else if(form==="PHANTOM"){

      beginShape();

      vertex(0,-34);
      vertex(-10,-10);
      vertex(-29,17);
      vertex(-8,12);
      vertex(0,21);
      vertex(8,12);
      vertex(29,17);
      vertex(10,-10);

      endShape(CLOSE);

    }else{

      beginShape();

      vertex(0,-30);
      vertex(-18,17);
      vertex(0,10);
      vertex(18,17);

      endShape(CLOSE);

    }

    if(form==="TITAN"){

      triangle(
        -9,0,
        -32,20,
        -10,15
      );

      triangle(
        9,0,
        32,20,
        10,15
      );

    }

    noStroke();

    fill(core);

    ellipse(
      0,-4,
      10,16
    );

    drawingContext.shadowBlur=0;

    pop();

  }

}


// ================================================================
// TRANSFORMATION
// ================================================================

function getTransformation(){

  if(millis()<celestialEnd)
    return "CELESTIAL";

  if(millis()<berserkerEnd)
    return "BERSERKER";

  if(millis()<titanEnd)
    return "TITAN";

  if(millis()<phantomEnd)
    return "PHANTOM";

  if(millis()<cryoEnd)
    return "CRYO";

  return "NORMAL";

}


// ================================================================
// SHIELD
// ================================================================

function drawShield(x,y){

  push();

  noFill();

  drawingContext.shadowBlur=25;
  drawingContext.shadowColor="#00ccff";

  stroke(0,210,255,190);
  strokeWeight(4);

  circle(
    x,y,
    82+sin(frameCount*.1)*6
  );

  drawingContext.shadowBlur=0;

  pop();

}


// ================================================================
// MAIN LOOP
// ================================================================

function runGame(){

  detectControls();
  moveShip();

  ship.update();

  updateBullets();
  updateMeteors();
  updatePowerUps();
  updateParticles();
  updateEnemyWaves();

  updatePortal();
  updateNova();

  if(bossActive)
    updateBoss();

  bulletMeteorCollisions();
  shipMeteorCollisions();
  shipPowerCollisions();

  bulletBossCollisions();
  enemyWaveCollisions();

  spawnMeteors();
  spawnPowerUps();

  checkPortal();
  checkBoss();
  checkLevelCompletion();

  ship.display();

  drawHUD();
  drawControls();

}


// ================================================================
// BULLETS
// ================================================================

class Bullet{

  constructor(x,y,angle,power=1){

    this.x=x;
    this.y=y;
    this.angle=angle;
    this.power=power;

    this.speed=11+power;
    this.radius=4+power;

    this.life=120;

  }


  update(){

    this.x+=
      cos(this.angle)*
      this.speed;

    this.y+=
      sin(this.angle)*
      this.speed;

    this.life--;

  }


  display(){

    let form=getTransformation();

    let c="#00ffff";

    if(form==="TITAN")c="#ffd000";
    if(form==="BERSERKER")c="#ff1744";
    if(form==="PHANTOM")c="#d66cff";
    if(form==="CRYO")c="#a8efff";
    if(form==="CELESTIAL")c="#fff59d";

    push();

    drawingContext.shadowBlur=18;
    drawingContext.shadowColor=c;

    stroke(c);
    strokeWeight(3+this.power);

    line(
      this.x,
      this.y,
      this.x-cos(this.angle)*18,
      this.y-sin(this.angle)*18
    );

    drawingContext.shadowBlur=0;

    pop();

  }


  dead(){

    return(
      this.life<=0||
      this.x<-80||
      this.x>width+80||
      this.y<-80||
      this.y>height+80
    );

  }

}


// ================================================================
// SHOOT
// ================================================================

function shoot(){

  if(gameState!=="PLAYING")
    return;

  let form=getTransformation();

  let delay=155;
  let power=1;

  if(form==="TITAN"){
    delay=105;
    power=2;
  }

  if(form==="BERSERKER"){
    delay=75;
    power=3;
  }

  if(form==="PHANTOM"){
    delay=115;
    power=1.5;
  }

  if(form==="CRYO"){
    delay=125;
    power=1.7;
  }

  if(form==="CELESTIAL"){
    delay=85;
    power=2.8;
  }

  if(
    millis()-lastShotTime<
    delay
  )
    return;

  lastShotTime=millis();

  let copies=[0];

  if(millis()<trinityEnd)
    copies=[-24,0,24];

  else if(millis()<twinEnd)
    copies=[-18,18];

  for(let offset of copies){

    let sx=
      ship.x+
      cos(ship.angle+HALF_PI)*
      offset;

    let sy=
      ship.y+
      sin(ship.angle+HALF_PI)*
      offset;

    let angles=[ship.angle];

    if(millis()<multiShotEnd){

      angles=[
        ship.angle-radians(14),
        ship.angle,
        ship.angle+radians(14)
      ];

    }

    if(form==="CELESTIAL"){

      angles=[
        ship.angle-radians(20),
        ship.angle-radians(10),
        ship.angle,
        ship.angle+radians(10),
        ship.angle+radians(20)
      ];

    }

    for(let a of angles){

      bullets.push(
        new Bullet(
          sx+cos(a)*28,
          sy+sin(a)*28,
          a,
          power
        )
      );

    }

  }

}


// ================================================================
// BULLET UPDATE
// ================================================================

function updateBullets(){

  for(
    let i=bullets.length-1;
    i>=0;
    i--
  ){

    bullets[i].update();
    bullets[i].display();

    if(bullets[i].dead())
      bullets.splice(i,1);

  }

}


// ================================================================
// METEOR
// ================================================================

class Meteor{

  constructor(){

    this.radius=
      random(
        18,
        32+currentLevel*.7
      );

    let side=floor(random(4));

    if(side===0){
      this.x=random(width);
      this.y=-50;
    }else if(side===1){
      this.x=width+50;
      this.y=random(height);
    }else if(side===2){
      this.x=random(width);
      this.y=height+50;
    }else{
      this.x=-50;
      this.y=random(height);
    }

    let a=
      atan2(
        ship.y+random(-180,180)-this.y,
        ship.x+random(-180,180)-this.x
      );

    let speed=
      random(1.2,2.2)*
      getDifficultyMultiplier(
        currentLevel
      );

    if(currentGalaxy!==0)
      speed*=1.12;

    this.vx=cos(a)*speed;
    this.vy=sin(a)*speed;

    this.rot=random(TWO_PI);
    this.rotSpeed=random(-.035,.035);

    this.points=[];

    for(let i=0;i<9;i++)
      this.points.push(
        this.radius*random(.72,1.18)
      );

  }


  update(){

    let slow=
      millis()<cryoEnd?.6:1;

    this.x+=this.vx*slow;
    this.y+=this.vy*slow;

    this.rot+=this.rotSpeed;

  }


  display(){

    push();

    translate(this.x,this.y);
    rotate(this.rot);

    let edge="#ff7433";
    let body="#4c2b24";

    if(currentGalaxy===1){
      edge="#ff3355";
      body="#601020";
    }

    if(currentGalaxy===2){
      edge="#66ddff";
      body="#173c62";
    }

    if(currentGalaxy===3){
      edge="#55ffaa";
      body="#14553b";
    }

    drawingContext.shadowBlur=12;
    drawingContext.shadowColor=edge;

    stroke(edge);
    strokeWeight(2);
    fill(body);

    beginShape();

    for(let i=0;i<this.points.length;i++){

      let a=
        map(
          i,
          0,
          this.points.length,
          0,
          TWO_PI
        );

      vertex(
        cos(a)*this.points[i],
        sin(a)*this.points[i]
      );

    }

    endShape(CLOSE);

    drawingContext.shadowBlur=0;

    pop();

  }


  dead(){

    return(
      this.x<-220||
      this.x>width+220||
      this.y<-220||
      this.y>height+220
    );

  }

}


// ================================================================
// METEOR SPAWN
// ================================================================

function spawnMeteors(){

  let delay=
    max(
      300,
      1150-(currentLevel-1)*38
    );

  if(
    millis()-lastMeteorTime>
    delay
  ){

    let count=1;

    if(currentLevel>=6&&random()<.18)
      count=2;

    if(currentLevel>=13&&random()<.12)
      count=3;

    if(bossActive)
      count=1;

    for(let i=0;i<count;i++)
      meteors.push(
        new Meteor()
      );

    lastMeteorTime=millis();

  }

}


// ================================================================
// METEOR UPDATE
// ================================================================

function updateMeteors(){

  for(
    let i=meteors.length-1;
    i>=0;
    i--
  ){

    meteors[i].update();
    meteors[i].display();

    if(meteors[i].dead())
      meteors.splice(i,1);

  }

}


// ================================================================
// POWER UPS
// ================================================================

class PowerUp{

  constructor(){

    this.type=random(POWER_TYPES);

    this.x=random(60,width-60);
    this.y=random(130,height-160);

    this.radius=24;
    this.life=900;
    this.rot=0;

  }


  update(){

    this.rot+=.035;
    this.life--;

  }


  display(){

    let cfg=powerColor(this.type);

    push();

    translate(this.x,this.y);
    rotate(this.rot);

    drawingContext.shadowBlur=30;
    drawingContext.shadowColor=cfg.c;

    stroke(cfg.c);
    strokeWeight(3);

    fill(cfg.fill);

    circle(
      0,
      0,
      this.radius*2+
      sin(frameCount*.1)*5
    );

    noFill();

    circle(
      0,
      0,
      this.radius*1.35
    );

    rotate(-this.rot);

    noStroke();

    fill(255);

    textAlign(CENTER,CENTER);
    textStyle(BOLD);
    textSize(9);

    text(
      cfg.label,
      0,1
    );

    drawingContext.shadowBlur=0;

    pop();

  }

}


function powerColor(type){

  let data={

    MULTI:["#ffe600","M"],
    SHIELD:["#00bfff","S"],
    TITAN:["#ff7a00","T"],
    TWIN:["#b66cff","2X"],
    TRINITY:["#ff4db8","3X"],
    NOVA:["#ffffff","N"],
    PHANTOM:["#d66cff","PH"],
    BERSERKER:["#ff1744","BR"],
    CRYO:["#9eefff","CR"],
    CELESTIAL:["#fff176","CX"]

  }[type];

  let c=color(data[0]);

  return{
    c:data[0],
    label:data[1],
    fill:color(
      red(c),
      green(c),
      blue(c),
      50
    )
  };

}


// ================================================================
// POWER SPAWN
// ================================================================

function spawnPowerUps(){

  let delay=
    bossActive
      ?4300
      :max(
        6500,
        9000-currentLevel*80
      );

  if(
    millis()-lastPowerTime>
    delay
  ){

    if(powerUps.length<
      (bossActive?2:1)
    ){

      powerUps.push(
        new PowerUp()
      );

    }

    lastPowerTime=millis();

  }

}


// ================================================================
// POWER UPDATE
// ================================================================

function updatePowerUps(){

  for(
    let i=powerUps.length-1;
    i>=0;
    i--
  ){

    powerUps[i].update();
    powerUps[i].display();

    if(powerUps[i].life<=0)
      powerUps.splice(i,1);

  }

}


// ================================================================
// POWER COLLISION
// ================================================================

function shipPowerCollisions(){

  for(
    let i=powerUps.length-1;
    i>=0;
    i--
  ){

    let p=powerUps[i];

    if(
      dist(
        ship.x,
        ship.y,
        p.x,
        p.y
      )<
      ship.radius+p.radius
    ){

      activatePower(p.type);

      createExplosion(
        p.x,
        p.y,
        25,
        p.type
      );

      powerUps.splice(i,1);

      score+=50;
      levelScore+=50;

      break;

    }

  }

}


// ================================================================
// ACTIVATE POWER
// ================================================================

function activatePower(type){

  let duration=
    (POWER_DURATION[type]||0)*
    (bossActive?1.6:1);

  let now=millis();

  if(type==="MULTI")
    multiShotEnd=now+duration;

  else if(type==="SHIELD")
    shieldEnd=now+duration;

  else if(type==="TITAN")
    titanEnd=now+duration;

  else if(type==="TWIN"){
    twinEnd=now+duration;
    trinityEnd=0;
  }

  else if(type==="TRINITY"){
    trinityEnd=now+duration;
    twinEnd=0;
  }

  else if(type==="PHANTOM")
    phantomEnd=now+duration;

  else if(type==="BERSERKER")
    berserkerEnd=now+duration;

  else if(type==="CRYO")
    cryoEnd=now+duration;

  else if(type==="CELESTIAL"){
    celestialEnd=now+duration;

    shieldEnd=
      max(
        shieldEnd,
        now+duration*.65
      );
  }

  else if(type==="NOVA")
    activateNova();

  powerSound(type);

}


// ================================================================
// NOVA
// ================================================================

function activateNova(){

  novaWave={
    radius:10,
    alpha:255
  };

  for(
    let i=meteors.length-1;
    i>=0;
    i--
  ){

    createExplosion(
      meteors[i].x,
      meteors[i].y,
      20
    );

    meteors.splice(i,1);

    score+=15;
    levelScore+=15;

  }

  if(bossActive&&boss)
    boss.hp-=boss.maxHp*.17;

}


function updateNova(){

  if(!novaWave)
    return;

  novaWave.radius+=24;
  novaWave.alpha-=7;

  push();

  noFill();

  drawingContext.shadowBlur=35;
  drawingContext.shadowColor="#ffffff";

  stroke(
    150,
    240,
    255,
    novaWave.alpha
  );

  strokeWeight(7);

  circle(
    ship.x,
    ship.y,
    novaWave.radius*2
  );

  drawingContext.shadowBlur=0;

  pop();

  if(novaWave.alpha<=0)
    novaWave=null;

}


// ================================================================
// COLLISIONS
// ================================================================

function bulletMeteorCollisions(){

  for(
    let i=meteors.length-1;
    i>=0;
    i--
  ){

    for(
      let j=bullets.length-1;
      j>=0;
      j--
    ){

      if(
        dist(
          meteors[i].x,
          meteors[i].y,
          bullets[j].x,
          bullets[j].y
        )<
        meteors[i].radius+
        bullets[j].radius
      ){

        createExplosion(
          meteors[i].x,
          meteors[i].y,
          22
        );

        let gain=
          floor(
            20+
            bullets[j].power*6
          );

        score+=gain;
        levelScore+=gain;

        meteors.splice(i,1);
        bullets.splice(j,1);

        break;

      }

    }

  }

}


function shipMeteorCollisions(){

  if(
    millis()<
    ship.invincibleUntil
  )
    return;

  for(
    let i=meteors.length-1;
    i>=0;
    i--
  ){

    let m=meteors[i];

    if(
      dist(
        ship.x,
        ship.y,
        m.x,
        m.y
      )<
      ship.radius+
      m.radius*.7
    ){

      let form=getTransformation();

      if(
        millis()<shieldEnd||
        form==="CELESTIAL"
      ){

        createExplosion(
          m.x,
          m.y,
          20,
          "SHIELD"
        );

        meteors.splice(i,1);

        return;

      }

      if(
        form==="TITAN"||
        form==="BERSERKER"
      ){

        createExplosion(
          m.x,
          m.y,
          30
        );

        meteors.splice(i,1);

        score+=20;
        levelScore+=20;

        return;

      }

      if(
        form==="PHANTOM"&&
        random()<.65
      ){

        meteors.splice(i,1);

        return;

      }

      meteors.splice(i,1);

      damagePlayer();

      return;

    }

  }

}


function damagePlayer(){

  lives--;

  ship.invincibleUntil=
    millis()+1800;

  playTone(
    190,
    45,
    .3,
    "sawtooth",
    .06
  );

  if(lives<=0){

    gameState="GAMEOVER";

    createExplosion(
      ship.x,
      ship.y,
      60
    );

  }

}


// ================================================================
// PORTAL
// ================================================================

class Portal{

  constructor(){

    this.x=
      random(
        width*.25,
        width*.75
      );

    this.y=
      random(
        height*.25,
        height*.55
      );

    this.radius=50;
    this.life=800;
    this.rot=0;

  }


  update(){

    this.rot+=.04;
    this.life--;

  }


  display(){

    push();

    translate(
      this.x,
      this.y
    );

    rotate(this.rot);

    drawingContext.shadowBlur=35;
    drawingContext.shadowColor="#b000ff";

    noFill();

    for(let i=0;i<4;i++){

      stroke(
        100+i*30,
        40,
        255,
        190
      );

      strokeWeight(5-i);

      arc(
        0,
        0,
        this.radius*2-i*10,
        this.radius*2-i*10,
        i,
        PI+i
      );

    }

    drawingContext.shadowBlur=0;

    pop();

  }

}


function checkPortal(){

  if(
    bossActive||
    currentGalaxy!==0
  )
    return;

  if(
    !portal&&
    levelScore>=nextPortalScore
  ){

    portal=new Portal();

    nextPortalScore+=
      900+
      currentLevel*120;

  }

  if(!portal)
    return;

  if(
    dist(
      ship.x,
      ship.y,
      portal.x,
      portal.y
    )<
    portal.radius
  ){

    currentGalaxy=
      floor(
        random(1,4)
      );

    galaxyEndTime=
      millis()+15000;

    portal=null;

    meteors=[];

    playTone(
      900,
      100,
      .7,
      "sawtooth",
      .05
    );

  }

}


function updatePortal(){

  if(!portal){

    if(
      currentGalaxy!==0&&
      millis()>galaxyEndTime
    ){

      currentGalaxy=0;
      meteors=[];

    }

    return;

  }

  portal.update();
  portal.display();

  if(portal.life<=0)
    portal=null;

}


// ================================================================
// BOSS
// ================================================================

class MeteorDragon{

  constructor(level){

    this.level=level;

    this.x=width/2;
    this.y=-100;

    this.targetY=max(
      130,
      height*.18
    );

    this.radius=75;

    this.maxHp=
      900+
      level*170;

    this.hp=this.maxHp;

    this.phase=1;
    this.move=0;
    this.lastAttack=millis();

  }


  update(){

    let ratio=
      this.hp/
      this.maxHp;

    this.phase=
      ratio>.6
        ?1
        :ratio>.3
          ?2
          :3;

    if(this.y<this.targetY){

      this.y+=1;
      return;

    }

    this.move+=
      this.phase===3
        ?.018
        :.012;

    this.x=
      width/2+
      sin(this.move)*
      width*.27;

    let delay=
      this.phase===1
        ?2400
        :this.phase===2
          ?1800
          :1250;

    if(
      millis()-this.lastAttack>
      delay
    ){

      this.attack();

      this.lastAttack=millis();

    }

  }


  attack(){

    let a=
      atan2(
        ship.y-this.y,
        ship.x-this.x
      );

    let spread=
      this.phase===1
        ?[0]
        :this.phase===2
          ?[-15,0,15]
          :[-28,-14,0,14,28];

    for(let d of spread){

      enemyWaves.push(
        new EnemyWave(
          this.x,
          this.y+35,
          a+radians(d),
          this.phase
        )
      );

    }

  }


  display(){

    push();

    translate(
      this.x,
      this.y
    );

    let edge=
      this.phase===3
        ?"#ff0044"
        :"#ff6a00";

    drawingContext.shadowBlur=35;
    drawingContext.shadowColor=edge;

    stroke(edge);
    strokeWeight(4);

    fill(
      this.phase===3
        ?"#650019"
        :"#54170e"
    );

    beginShape();

    vertex(-25,-5);
    vertex(-95,-48);
    vertex(-67,5);
    vertex(-105,38);
    vertex(-30,25);

    endShape(CLOSE);

    beginShape();

    vertex(25,-5);
    vertex(95,-48);
    vertex(67,5);
    vertex(105,38);
    vertex(30,25);

    endShape(CLOSE);

    ellipse(
      0,
      10,
      90,
      120
    );

    beginShape();

    vertex(0,-75);
    vertex(-37,-38);
    vertex(-28,10);
    vertex(0,30);
    vertex(28,10);
    vertex(37,-38);

    endShape(CLOSE);

    noStroke();

    fill(
      this.phase===3
        ?"#ff0044"
        :"#ffff00"
    );

    ellipse(-14,-34,10,7);
    ellipse(14,-34,10,7);

    drawingContext.shadowBlur=0;

    pop();

  }

}


// ================================================================
// BOSS CHECK
// ================================================================

function checkBoss(){

  let bossLevel=
    currentLevel===5||
    currentLevel===10||
    currentLevel===15||
    currentLevel===20;

  if(
    !bossLevel||
    defeatedBossThisRun||
    bossActive
  )
    return;

  if(
    millis()-levelStartTime>
    levelDuration*.55
  ){

    boss=
      new MeteorDragon(
        currentLevel
      );

    bossActive=true;

    meteors=[];
    powerUps=[];

    lastPowerTime=
      millis()-3000;

  }

}


// ================================================================
// BOSS UPDATE
// ================================================================

function updateBoss(){

  if(!boss)
    return;

  boss.update();
  boss.display();

  drawBossHealth();

  if(boss.hp<=0){

    createExplosion(
      boss.x,
      boss.y,
      100
    );

    let gain=
      1000+
      currentLevel*100;

    score+=gain;
    levelScore+=gain;

    boss=null;
    bossActive=false;
    defeatedBossThisRun=true;

    enemyWaves=[];

  }

}


function drawBossHealth(){

  let w=min(
    330,
    width*.75
  );

  let ratio=
    constrain(
      boss.hp/boss.maxHp,
      0,
      1
    );

  let x=
    width/2-w/2;

  let y=115;

  push();

  textAlign(CENTER,BOTTOM);

  fill(255,70,50);

  textStyle(BOLD);
  textSize(13);

  text(
    "METEOR DRAGON • PHASE "+
    boss.phase,
    width/2,
    y-7
  );

  noStroke();

  fill(255,255,255,45);

  rect(
    x,y,
    w,12,
    6
  );

  fill(
    boss.phase===3
      ?color(255,0,60)
      :color(255,70,30)
  );

  rect(
    x,y,
    w*ratio,
    12,
    6
  );

  pop();

}


// ================================================================
// BOSS BULLETS
// ================================================================

function bulletBossCollisions(){

  if(!bossActive||!boss)
    return;

  for(
    let i=bullets.length-1;
    i>=0;
    i--
  ){

    let b=bullets[i];

    if(
      dist(
        b.x,
        b.y,
        boss.x,
        boss.y
      )<
      boss.radius+
      b.radius
    ){

      boss.hp-=
        10+
        b.power*8;

      bullets.splice(i,1);

    }

  }

}


// ================================================================
// ENEMY WAVES
// ================================================================

class EnemyWave{

  constructor(x,y,angle,phase){

    this.x=x;
    this.y=y;
    this.angle=angle;
    this.phase=phase;

    this.speed=
      phase===3
        ?4
        :phase===2
          ?3.5
          :3;

    this.radius=15;
    this.life=260;

  }


  update(){

    let slow=
      millis()<cryoEnd?.55:1;

    this.x+=
      cos(this.angle)*
      this.speed*
      slow;

    this.y+=
      sin(this.angle)*
      this.speed*
      slow;

    this.life--;

  }


  display(){

    push();

    noFill();

    drawingContext.shadowBlur=25;
    drawingContext.shadowColor="#ff0033";

    stroke(255,30,60);

    strokeWeight(
      this.phase===3
        ?6
        :4
    );

    circle(
      this.x,
      this.y,
      this.radius*2
    );

    drawingContext.shadowBlur=0;

    pop();

  }


  dead(){

    return(
      this.life<=0||
      this.x<-100||
      this.x>width+100||
      this.y<-100||
      this.y>height+100
    );

  }

}


function updateEnemyWaves(){

  for(
    let i=enemyWaves.length-1;
    i>=0;
    i--
  ){

    enemyWaves[i].update();
    enemyWaves[i].display();

    if(enemyWaves[i].dead())
      enemyWaves.splice(i,1);

  }

}


function enemyWaveCollisions(){

  for(
    let i=enemyWaves.length-1;
    i>=0;
    i--
  ){

    let w=enemyWaves[i];

    if(
      dist(
        ship.x,
        ship.y,
        w.x,
        w.y
      )<
      ship.radius+
      w.radius
    ){

      let form=
        getTransformation();

      if(
        millis()<shieldEnd||
        form==="CELESTIAL"
      ){

        enemyWaves.splice(i,1);
        return;

      }

      if(
        form==="PHANTOM"&&
        random()<.7
      ){

        enemyWaves.splice(i,1);
        return;

      }

      if(
        millis()<
        ship.invincibleUntil
      )
        return;

      enemyWaves.splice(i,1);

      damagePlayer();

      return;

    }

  }

}


// ================================================================
// LEVEL COMPLETION
// ================================================================

function checkLevelCompletion(){

  let elapsed=
    millis()-levelStartTime;

  let bossRequired=
    currentLevel===5||
    currentLevel===10||
    currentLevel===15||
    currentLevel===20;

  let timeDone=
    elapsed>=levelDuration;

  let scoreDone=
    levelScore>=levelTargetScore;

  let bossDone=
    !bossRequired||
    defeatedBossThisRun;

  if(
    timeDone&&
    scoreDone&&
    bossDone
  )
    completeLevel();

}


function completeLevel(){

  if(currentLevel<TOTAL_LEVELS){

    if(
      currentLevel+1>
      unlockedLevel
    ){

      unlockedLevel=
        currentLevel+1;

      saveProgress();

    }

  }

  gameState="LEVELUP";

  createCelebration();

  playLevelUpSound();

}


// ================================================================
// LEVEL COMPLETE
// ================================================================

function drawLevelComplete(){

  push();

  fill(0,0,15,205);

  rect(
    0,0,
    width,height
  );

  textAlign(CENTER,CENTER);

  textStyle(BOLD);

  drawingContext.shadowBlur=30;
  drawingContext.shadowColor="#ffe600";

  fill(255,225,40);

  textSize(
    min(36,width*.09)
  );

  text(
    currentLevel===TOTAL_LEVELS
      ?"CAMPAIGN COMPLETE!"
      :"LEVEL "+
       currentLevel+
       " CLEARED!",
    width/2,
    height*.35
  );

  drawingContext.shadowBlur=0;

  if(currentLevel<TOTAL_LEVELS){

    fill(0,225,255);
    textSize(16);

    text(
      "NEW LEVEL UNLOCKED",
      width/2,
      height*.45
    );

    fill(255);
    textSize(21);

    text(
      "LEVEL "+
      (currentLevel+1),
      width/2,
      height*.50
    );

    fill(255,220,60);
    textSize(15);

    text(
      "★ "+
      LEVEL_TITLES[currentLevel]+
      " ★",
      width/2,
      height*.56
    );

  }else{

    fill(255);
    textSize(18);

    text(
      "You conquered the Multiverse.",
      width/2,
      height*.5
    );

  }

  pop();

  if(
    frameCount%60===0
  ){

    // Short delay is handled by a timer below.

  }

  if(
    !window._levelCompleteTimer
  )
    window._levelCompleteTimer=millis();

  if(
    millis()-
    window._levelCompleteTimer>
    3500
  ){

    window._levelCompleteTimer=null;

    if(currentLevel<TOTAL_LEVELS)
      startLevel(currentLevel+1);

    else
      gameState="HOME";

  }

}


// ================================================================
// GAME OVER
// ================================================================

function drawGameOver(){

  push();

  fill(0,0,0,205);

  rect(
    0,0,
    width,height
  );

  textAlign(CENTER,CENTER);

  textStyle(BOLD);

  fill(255,60,80);

  textSize(38);

  text(
    "MISSION LOST",
    width/2,
    height*.30
  );

  fill(255);
  textSize(18);

  text(
    "LEVEL "+
    currentLevel,
    width/2,
    height*.39
  );

  fill(255,220,50);
  textSize(14);

  text(
    currentTitle,
    width/2,
    height*.44
  );

  drawActionButton(
    "↻ RETRY LEVEL "+
    currentLevel,
    height*.56
  );

  drawActionButton(
    "🏠 HOME",
    height*.66
  );

  pop();

}


// ================================================================
// PAUSE
// ================================================================

function pauseGame(){

  if(gameState==="PLAYING"){

    gameState="PAUSED";
    pauseStartTime=millis();

  }

}


function resumeGame(){

  if(gameState!=="PAUSED")
    return;

  let pausedFor=
    millis()-pauseStartTime;

  levelStartTime+=pausedFor;

  multiShotEnd+=pausedFor;
  shieldEnd+=pausedFor;
  titanEnd+=pausedFor;
  twinEnd+=pausedFor;
  trinityEnd+=pausedFor;
  phantomEnd+=pausedFor;
  berserkerEnd+=pausedFor;
  cryoEnd+=pausedFor;
  celestialEnd+=pausedFor;

  if(currentGalaxy!==0)
    galaxyEndTime+=pausedFor;

  lastMeteorTime+=pausedFor;
  lastPowerTime+=pausedFor;
  lastShotTime+=pausedFor;

  if(boss)
    boss.lastAttack+=pausedFor;

  gameState="PLAYING";

}


function drawFrozenGame(){

  ship.display();

  for(let m of meteors)
    m.display();

  for(let b of bullets)
    b.display();

  for(let p of powerUps)
    p.display();

  for(let w of enemyWaves)
    w.display();

  if(portal)
    portal.display();

  if(boss)
    boss.display();

  drawHUD();

}


function drawPauseOverlay(){

  push();

  fill(0,0,0,195);

  rect(
    0,0,
    width,height
  );

  textAlign(CENTER,CENTER);

  fill(255);
  textStyle(BOLD);
  textSize(38);

  text(
    "PAUSED",
    width/2,
    height*.34
  );

  fill(0,220,255);
  textSize(14);

  text(
    "LEVEL "+
    currentLevel+
    " • "+
    currentTitle,
    width/2,
    height*.40
  );

  drawActionButton(
    "▶ RESUME",
    height*.54
  );

  drawActionButton(
    "🏠 HOME",
    height*.64
  );

  pop();

}


// ================================================================
// BUTTON
// ================================================================

function drawActionButton(label,y){

  let w=min(
    270,
    width*.72
  );

  rectMode(CENTER);

  stroke(0,210,255);
  strokeWeight(2);

  fill(5,25,45);

  rect(
    width/2,
    y,
    w,50,
    13
  );

  noStroke();

  fill(255);

  textAlign(CENTER,CENTER);
  textStyle(BOLD);
  textSize(15);

  text(
    label,
    width/2,
    y
  );

}


// ================================================================
// HUD
// ================================================================

function drawHUD(){

  push();

  textStyle(BOLD);

  fill(255);
  textSize(14);

  textAlign(LEFT,TOP);

  text(
    "SCORE "+
    score,
    14,12
  );

  textAlign(RIGHT,TOP);

  text(
    "♥ "+
    lives,
    width-14,12
  );

  textAlign(CENTER,TOP);

  fill(0,225,255);

  text(
    "LEVEL "+
    currentLevel,
    width/2,12
  );

  fill(255,220,50);

  textSize(10);

  text(
    currentTitle,
    width/2,31
  );

  let w=min(
    220,
    width*.55
  );

  let x=
    width/2-w/2;

  let y=52;

  let elapsed=
    millis()-levelStartTime;

  let timeRatio=
    constrain(
      elapsed/levelDuration,
      0,1
    );

  let scoreRatio=
    constrain(
      levelScore/levelTargetScore,
      0,1
    );

  noStroke();

  fill(255,255,255,35);

  rect(
    x,y,w,7,4
  );

  fill(0,220,255);

  rect(
    x,y,w*timeRatio,7,4
  );

  fill(255,255,255,35);

  rect(
    x,y+11,w,5,3
  );

  fill(255,220,40);

  rect(
    x,y+11,w*scoreRatio,5,3
  );

  fill(180);

  textSize(8);

  text(
    "SURVIVAL  •  SCORE",
    width/2,
    y+20
  );

  drawTopControlButton(
    pauseButton.x,
    pauseButton.y,
    "Ⅱ"
  );

  drawTopControlButton(
    homeButton.x,
    homeButton.y,
    "⌂"
  );

  pop();

}


function drawTopControlButton(x,y,label){

  push();

  drawingContext.shadowBlur=12;
  drawingContext.shadowColor="#00ccff";

  stroke(0,210,255,180);
  strokeWeight(2);

  fill(5,25,45,220);

  circle(
    x,y,42
  );

  noStroke();

  fill(255);

  textAlign(CENTER,CENTER);
  textStyle(BOLD);
  textSize(18);

  text(
    label,
    x,y-1
  );

  drawingContext.shadowBlur=0;

  pop();

}


// ================================================================
// CONTROLS
// ================================================================

function resetControls(){

  let moveX=
    controlsSwapped
      ?width-90
      :90;

  let fireX=
    controlsSwapped
      ?90
      :width-90;

  joystick.baseX=moveX;
  joystick.baseY=height-100;

  joystick.knobX=moveX;
  joystick.knobY=height-100;

  joystick.active=false;

  fireButton.x=fireX;
  fireButton.y=height-100;

  pauseButton.x=38;
  pauseButton.y=92;

  homeButton.x=width-38;
  homeButton.y=92;

}


function resetJoystickOnly(){

  joystick.active=false;

  let x=
    controlsSwapped
      ?width-90
      :90;

  joystick.baseX=x;
  joystick.baseY=height-100;

  joystick.knobX=x;
  joystick.knobY=height-100;

}


function detectControls(){

  let moveTouch=null;
  let firing=false;

  for(let t of touches){

    if(
      dist(
        t.x,t.y,
        fireButton.x,
        fireButton.y
      )<
      fireButton.radius+30
    ){

      firing=true;
      continue;

    }

    let movementSide=
      controlsSwapped
        ?t.x>width*.45
        :t.x<width*.55;

    if(
      movementSide&&
      t.y>height*.45
    )
      moveTouch=t;

  }

  if(firing)
    shoot();

  if(moveTouch){

    if(!joystick.active){

      joystick.active=true;
      joystick.baseX=moveTouch.x;
      joystick.baseY=moveTouch.y;

    }

    let dx=
      moveTouch.x-
      joystick.baseX;

    let dy=
      moveTouch.y-
      joystick.baseY;

    let d=
      sqrt(dx*dx+dy*dy);

    if(d>joystick.radius){

      let a=atan2(dy,dx);

      dx=
        cos(a)*
        joystick.radius;

      dy=
        sin(a)*
        joystick.radius;

    }

    joystick.knobX=
      joystick.baseX+dx;

    joystick.knobY=
      joystick.baseY+dy;

  }else{

    resetJoystickOnly();

  }

}


function moveShip(){

  if(!joystick.active)
    return;

  let dx=
    joystick.knobX-
    joystick.baseX;

  let dy=
    joystick.knobY-
    joystick.baseY;

  let mag=
    sqrt(dx*dx+dy*dy);

  if(mag<4)
    return;

  let a=
    atan2(dy,dx);

  ship.angle=a;

  let strength=
    constrain(
      mag/joystick.radius,
      0,1
    );

  let speed=ship.speed;

  if(getTransformation()==="PHANTOM")
    speed*=1.3;

  if(getTransformation()==="CELESTIAL")
    speed*=1.2;

  ship.x+=
    cos(a)*
    speed*
    strength;

  ship.y+=
    sin(a)*
    speed*
    strength;

}


function drawControls(){

  push();

  stroke(0,220,255,120);
  strokeWeight(2);

  fill(0,150,255,25);

  circle(
    joystick.baseX,
    joystick.baseY,
    joystick.radius*2
  );

  fill(0,220,255,100);

  circle(
    joystick.knobX,
    joystick.knobY,
    52
  );

  drawingContext.shadowBlur=18;
  drawingContext.shadowColor="#ff304f";

  stroke(255,70,90);

  fill(255,30,60,55);

  circle(
    fireButton.x,
    fireButton.y,
    fireButton.radius*2
  );

  noStroke();

  fill(255);

  textAlign(CENTER,CENTER);
  textStyle(BOLD);
  textSize(15);

  text(
    "FIRE",
    fireButton.x,
    fireButton.y
  );

  drawingContext.shadowBlur=0;

  pop();

}


// ================================================================
// PARTICLES
// ================================================================

class Particle{

  constructor(x,y,tint=null){

    this.x=x;
    this.y=y;

    let a=random(TWO_PI);
    let s=random(1,7);

    this.vx=cos(a)*s;
    this.vy=sin(a)*s;

    this.life=255;
    this.size=random(2,7);
    this.tint=tint;

  }


  update(){

    this.x+=this.vx;
    this.y+=this.vy;

    this.vx*=.97;
    this.vy*=.97;

    this.life-=7;

  }


  display(){

    noStroke();

    if(this.tint){

      let c=color(this.tint);

      fill(
        red(c),
        green(c),
        blue(c),
        this.life
      );

    }else{

      fill(
        255,
        120,
        30,
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


function createExplosion(x,y,count,type=null){

  let tint=null;

  if(
    type&&
    POWER_TYPES.includes(type)
  )
    tint=powerColor(type).c;

  for(let i=0;i<count;i++)
    particles.push(
      new Particle(
        x,y,tint
      )
    );

}


function createCelebration(){

  for(let i=0;i<80;i++){

    particles.push(
      new Particle(
        random(width),
        random(height*.4,height),
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


function updateParticles(){

  for(
    let i=particles.length-1;
    i>=0;
    i--
  ){

    particles[i].update();
    particles[i].display();

    if(particles[i].life<=0)
      particles.splice(i,1);

  }

}


// ================================================================
// RESET POWERS
// ================================================================

function resetPowerTimers(){

  multiShotEnd=0;
  shieldEnd=0;
  titanEnd=0;

  twinEnd=0;
  trinityEnd=0;

  phantomEnd=0;
  berserkerEnd=0;
  cryoEnd=0;
  celestialEnd=0;

  novaWave=null;

}


// ================================================================
// AUDIO
// ================================================================

function initAudio(){

  if(!audioCtx){

    let AC=
      window.AudioContext||
      window.webkitAudioContext;

    if(AC)
      audioCtx=new AC();

  }

  if(
    audioCtx&&
    audioCtx.state==="suspended"
  )
    audioCtx.resume();

}


function playTone(
  startFreq,
  endFreq,
  duration,
  type="sine",
  volume=.04
){

  if(
    !soundEnabled||
    !audioCtx
  )
    return;

  let osc=
    audioCtx.createOscillator();

  let gain=
    audioCtx.createGain();

  osc.type=type;

  osc.frequency.setValueAtTime(
    max(1,startFreq),
    audioCtx.currentTime
  );

  osc.frequency.exponentialRampToValueAtTime(
    max(1,endFreq),
    audioCtx.currentTime+duration
  );

  gain.gain.setValueAtTime(
    volume,
    audioCtx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    .001,
    audioCtx.currentTime+duration
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();

  osc.stop(
    audioCtx.currentTime+
    duration
  );

}


function powerSound(type){

  let tones={

    MULTI:[500,1300,"square"],
    SHIELD:[180,800,"sine"],
    TITAN:[80,500,"sawtooth"],
    TWIN:[300,850,"sine"],
    TRINITY:[350,1200,"sine"],
    NOVA:[70,1200,"sawtooth"],
    PHANTOM:[220,1100,"triangle"],
    BERSERKER:[55,620,"sawtooth"],
    CRYO:[1400,260,"sine"],
    CELESTIAL:[300,1800,"sine"]

  };

  let t=tones[type];

  if(!t)
    return;

  playTone(
    t[0],
    t[1],
    .45,
    t[2],
    .055
  );

}


function playLevelUpSound(){

  playTone(
    400,
    600,
    .18,
    "sine",
    .05
  );

  setTimeout(
    ()=>{
      playTone(
        600,
        850,
        .18,
        "sine",
        .05
      );
    },
    170
  );

  setTimeout(
    ()=>{
      playTone(
        850,
        1300,
        .3,
        "sine",
        .06
      );
    },
    340
  );

}


// ================================================================
// INPUT
// ================================================================

function touchStarted(){

  initAudio();

  handleTap(
    touches.length
      ?touches[0].x
      :mouseX,
    touches.length
      ?touches[0].y
      :mouseY
  );

  return false;

}


function mousePressed(){

  initAudio();

  handleTap(
    mouseX,
    mouseY
  );

  return false;

}


function handleTap(x,y){

  if(gameState==="HOME"){

    if(hitMenuY(y,height*.37)){
      gameState="LEVELS";
      return;
    }

    if(hitMenuY(y,height*.47)){
      gameState="ARCHIVE";
      return;
    }

    if(hitMenuY(y,height*.57)){
      gameState="ABOUT";
      return;
    }

    if(hitMenuY(y,height*.67)){
      gameState="SETTINGS";
      return;
    }

    if(hitMenuY(y,height*.77)){

      playTone(
        500,
        900,
        .2,
        "sine",
        .04
      );

      return;

    }

  }


  if(
    gameState==="LEVELS"||
    gameState==="ARCHIVE"||
    gameState==="ABOUT"||
    gameState==="SETTINGS"
  ){

    if(
      abs(
        y-(height-50)
      )<30
    ){

      gameState="HOME";
      return;

    }

  }


  if(gameState==="LEVELS"){

    let cols=4;
    let gap=10;

    let size=min(
      68,
      (width-50)/cols
    );

    let totalWidth=
      cols*size+
      (cols-1)*gap;

    let startX=
      width/2-totalWidth/2+
      size/2;

    let startY=165;

    for(let i=1;i<=TOTAL_LEVELS;i++){

      let col=(i-1)%cols;
      let row=floor((i-1)/cols);

      let bx=
        startX+
        col*(size+gap);

      let by=
        startY+
        row*(size+17);

      if(
        abs(x-bx)<size/2&&
        abs(y-by)<size/2
      ){

        if(i<=unlockedLevel)
          startLevel(i);

        else
          playTone(
            150,
            90,
            .15,
            "square",
            .03
          );

        return;

      }

    }

  }


  if(gameState==="ARCHIVE"){

    let cardW=min(
      160,
      width*.43
    );

    let cardH=105;
    let gapX=14;
    let gapY=12;

    for(
      let i=0;
      i<SHIP_ARCHIVE.length;
      i++
    ){

      let col=i%2;
      let row=floor(i/2);

      let bx=
        width/2+
        (
          col===0
            ?-(cardW/2+gapX/2)
            :(cardW/2+gapX/2)
        );

      let by=
        130+
        row*(cardH+gapY);

      if(
        abs(x-bx)<cardW/2&&
        abs(y-by)<cardH/2
      ){

        if(
          unlockedLevel>=
          SHIP_ARCHIVE[i].unlock
        ){

          selectedShip=i;

          saveProgress();

        }

        return;

      }

    }

  }


  if(gameState==="SETTINGS"){

    if(
      abs(
        y-height*.37
      )<45
    ){

      controlsSwapped=
        !controlsSwapped;

      resetControls();
      saveProgress();

      return;

    }

    if(
      abs(
        y-height*.53
      )<45
    ){

      soundEnabled=
        !soundEnabled;

      saveProgress();

      if(soundEnabled)
        playTone(
          400,
          800,
          .2,
          "sine",
          .05
        );

      return;

    }

  }


  if(gameState==="PLAYING"){

    if(
      dist(
        x,y,
        pauseButton.x,
        pauseButton.y
      )<32
    ){

      pauseGame();
      return;

    }

    if(
      dist(
        x,y,
        homeButton.x,
        homeButton.y
      )<32
    ){

      gameState="HOME";
      resetJoystickOnly();
      return;

    }

    if(
      dist(
        x,y,
        fireButton.x,
        fireButton.y
      )<
      fireButton.radius+20
    ){

      shoot();
      return;

    }

  }


  if(gameState==="PAUSED"){

    if(
      abs(
        y-height*.54
      )<30
    ){

      resumeGame();
      return;

    }

    if(
      abs(
        y-height*.64
      )<30
    ){

      gameState="HOME";
      return;

    }

  }


  if(gameState==="GAMEOVER"){

    if(
      abs(
        y-height*.56
      )<30
    ){

      startLevel(currentLevel);
      return;

    }

    if(
      abs(
        y-height*.66
      )<30
    ){

      gameState="HOME";
      return;

    }

  }

}


function hitMenuY(y,target){

  return abs(y-target)<30;

}


function touchMoved(){
  return false;
}


function touchEnded(){
  return false;
}


// ================================================================
// RESIZE
// ================================================================

function windowResized(){

  resizeCanvas(
    windowWidth,
    windowHeight
  );

  createStars();
  resetControls();

}
