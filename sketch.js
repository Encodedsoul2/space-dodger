===========================================================
   SPACE DODGER V9.6
   BUG-FIXED + DYNAMIC SPACE + INTRO + 20 ALIEN DESIGNS
   COMPLETE SINGLE-FILE p5.js BUILD
   ---------------------------------------------------------------
   FIXES:
   • Elite objective counter fixed
   • Campaign lives now work correctly
   • One guaranteed Dragon Slayer per Dragon level
   • Wave spawning de-duplicated
   • Objectives can finish immediately when appropriate
   • SURVIVE / NO_DAMAGE remain timer based
   • Dragon Slayer gets stronger visual impact
   • Dragon levels have distinct visual themes
   • Better level-to-level enemy variety
   • Safer pointer / pause / home handling
   • Save data remains backward compatible
================================================================ */

const TOTAL_LEVELS=30, START_LIVES=5, MAX_LIVES=9;
const DRAGON_LEVELS=[5,10,15,20,25,30];
const DRAGON_DATA={
 5:{name:"METEOR DRAGON",title:"DRAGON CHALLENGER",badge:"METEOR HUNTER",color:"#ff8a45",reward:"COMBO DURATION +5%"},
 10:{name:"VOID DRAGON",title:"DRAGON SLAYER",badge:"VOID BREAKER",color:"#b56cff",reward:"WEAPON DURATION +5%"},
 15:{name:"PLASMA DRAGON",title:"DRAGON CONQUEROR",badge:"PLASMA DOMINATOR",color:"#ff4b3e",reward:"DAMAGE +8%"},
 20:{name:"STORM DRAGON",title:"DRAGON EMPEROR",badge:"STORM REAPER",color:"#45d9ff",reward:"SHOT SPEED +8%"},
 25:{name:"ABYSS DRAGON",title:"VOID EMPEROR",badge:"ABYSS BREAKER",color:"#e35cff",reward:"SHIELD +1"},
 30:{name:"ECLIPSE DRAGON",title:"SPACE LEGEND",badge:"ECLIPSE SLAYER",color:"#ffe15b",reward:"GALACTIC CHAMPION"}
};
const SAVE_KEY="spaceDodgerV9Save";
const PI2=Math.PI*2, HPI=Math.PI/2;
const PLAY_TOP=105, CONTROL_BOTTOM_OFFSET=148;
const SAFE_MAX_ENEMIES=10, SAFE_MAX_SHOTS=60, SAFE_MAX_BULLETS=60, SAFE_MAX_PARTICLES=320, SAFE_MAX_FLOATING=24;
let gameFaults=0, safeMode=false, lastFrameSeen=0;

let state="INTRO", level=1, unlockedLevel=1, selectedShip=0;
let introStart=0, introDuration=5200;
let campaignLives=START_LIVES, lives=START_LIVES;
let score=0, levelScore=0, levelStartedAt=0, levelDuration=42000;
let objectiveType="SCORE", objectiveTarget=500, objectiveProgress=0, objectiveComplete=false;
let enemiesDestroyedThisLevel=0, powerupsCollected=0, elitesDestroyedThisLevel=0, damageTakenThisLevel=0;
let waveNumber=0, waveActive=false, formationPulse=0, lastWaveAt=0, nextWaveDelay=1300;
let lastDropSpawn=0,lastWeaponSpawn=0,lastFire=0,specialReadyAt=0,powerPressedUntil=0;
let bossWarningUntil=0,combo=0,comboUntil=0,shake=0;
let movePointerId=null,firePointerId=null,fireHeld=false,joyAngle=0,joyStrength=0;
let audioCtx=null,shipPlayer,boss=null,bossActive=false,bossDefeated=false;
let bullets=[],enemies=[],enemyShots=[],drops=[],weaponDrops=[],particles=[],floatingTexts=[],stars=[];
let celebration=[],rating=0,swappedControls=false,soundOn=true,musicOn=true;
let musicTimer=null,musicStep=0;
let guaranteedSlayerSpawned=false;
let highestDragon=0,dragonBadge="",dragonTitle="";
let eventType="",eventUntil=0,nextEventAt=0;

const joy={x:90,y:0,r:54,knobX:90,knobY:0};
const fireBtn={x:0,y:0,r:49},powerBtn={x:0,y:0,r:39};
const pauseBtn={x:38,y:76,r:22},homeBtn={x:0,y:76,r:22};
const powers={MULTI:0,SHIELD:0,BERSERKER:0,CRYO:0};

const WEAPONS=[
 {id:"PLASMA",name:"PLASMA CANNON",symbol:"P",color:"#4de8ff",damage:22,dragonMultiplier:1.15,rate:150,duration:18000},
 {id:"VOID",name:"VOID BEAM",symbol:"V",color:"#d889ff",damage:38,dragonMultiplier:1.5,rate:240,duration:14000},
 {id:"SLAYER",name:"DRAGON SLAYER",symbol:"D",color:"#ff6a43",damage:80,dragonMultiplier:3.5,rate:360,duration:20000}
];
let activeWeapon=null,activeWeaponUntil=0,weaponLastFire=0;

const SHIPS=[
 {name:"NOVA SCOUT",unlock:1,edge:"#39d8ff",body:"#0a2b43",core:"#fff",power:"BALANCED"},
 {name:"SOLAR FANG",unlock:3,edge:"#ff9a35",body:"#51200b",core:"#fff0a0",power:"BURN SHOT"},
 {name:"NEBULA WING",unlock:5,edge:"#c77aff",body:"#32134d",core:"#fff3ff",power:"GRAVITY PULSE"},
 {name:"CRYO HAWK",unlock:7,edge:"#7eeaff",body:"#123b55",core:"#fff",power:"TIME FREEZE"},
 {name:"VOID SPEAR",unlock:9,edge:"#ff62dc",body:"#35102f",core:"#fff",power:"PHASE DODGE"},
 {name:"DRAGON BANE",unlock:10,edge:"#ff4c5c",body:"#55121b",core:"#ffe36a",power:"DRAGON RAGE"},
 {name:"QUANTUM EDGE",unlock:12,edge:"#00dfc5",body:"#073e43",core:"#efffff",power:"QUANTUM DASH"},
 {name:"STAR PALADIN",unlock:15,edge:"#ffe15b",body:"#51460d",core:"#fff",power:"HOLY SHIELD"},
 {name:"GALACTIC TITAN",unlock:18,edge:"#ee73ff",body:"#42194f",core:"#ffffbc",power:"TITAN CORE"},
 {name:"MULTIVERSE KING",unlock:20,edge:"#ffd43b",body:"#503d04",core:"#fff",power:"REALITY BREAK"}
];

const LEVEL_NAMES=[
 "SPACE ROOKIE","STAR CADET","ORBIT SCOUT","ALIEN HUNTER","DRAGON CHALLENGER",
 "COSMIC RANGER","NEBULA KNIGHT","VOID WALKER","STAR COMMANDER","DRAGON SLAYER",
 "GALAXY GUARDIAN","QUANTUM WARRIOR","COSMIC MASTER","STAR LORD","DRAGON CONQUEROR",
 "VOID EMPEROR","GALACTIC TITAN","COSMIC OVERLORD","MULTIVERSE MASTER","STORM EMPEROR",
 "NEBULA TITAN","QUANTUM LORD","REALITY HUNTER","GALAXY BREAKER","ABYSS EMPEROR",
 "STAR DESTROYER","COSMIC LEGEND","MULTIVERSE LORD","INFINITY GUARDIAN","SPACE LEGEND"
];

const OBJECTIVES=[
 {type:"SCORE",target:450,name:"REACH SCORE"},
 {type:"KILLS",target:16,name:"DESTROY ALIENS"},
 {type:"SURVIVE",target:1,name:"SURVIVE THE WAVE"},
 {type:"ELITE",target:6,name:"DESTROY ELITES"},
 {type:"BOSS",target:1,name:"DEFEAT METEOR DRAGON"},
 {type:"SCORE",target:1800,name:"REACH SCORE"},
 {type:"POWER",target:5,name:"COLLECT POWERS"},
 {type:"KILLS",target:36,name:"DESTROY ALIENS"},
 {type:"SURVIVE",target:1,name:"SURVIVE THE ASSAULT"},
 {type:"BOSS",target:1,name:"DEFEAT VOID DRAGON"},
 {type:"SCORE",target:3000,name:"REACH SCORE"},
 {type:"ELITE",target:12,name:"HUNT ELITES"},
 {type:"KILLS",target:52,name:"CLEAR THE INVASION"},
 {type:"POWER",target:7,name:"COLLECT POWERS"},
 {type:"BOSS",target:1,name:"DEFEAT PLASMA DRAGON"},
 {type:"SCORE",target:4500,name:"REACH SCORE"},
 {type:"KILLS",target:70,name:"ALIEN EXTERMINATION"},
 {type:"ELITE",target:20,name:"ELITE HUNTER"},
 {type:"SCORE",target:6500,name:"REACH SCORE"},
 {type:"BOSS",target:1,name:"DEFEAT STORM DRAGON"},
 {type:"KILLS",target:88,name:"SWARM BREAKER"},
 {type:"ELITE",target:24,name:"ELITE PURGE"},
 {type:"POWER",target:10,name:"MASTER THE ARSENAL"},
 {type:"SCORE",target:9000,name:"REACH SCORE"},
 {type:"BOSS",target:1,name:"DEFEAT ABYSS DRAGON"},
 {type:"KILLS",target:105,name:"GALACTIC EXTERMINATION"},
 {type:"ELITE",target:30,name:"ELITE COMMANDER"},
 {type:"SCORE",target:12000,name:"REACH SCORE"},
 {type:"SURVIVE",target:1,name:"SURVIVE THE FINAL ASSAULT"},
 {type:"BOSS",target:1,name:"DEFEAT ECLIPSE DRAGON"}
];

function setup(){
 createCanvas(windowWidth,windowHeight); pixelDensity(1);
 textFont("Arial"); loadSave(); createStars(); updateLayout(); shipPlayer=new SpacePlayer(); introStart=millis(); state="INTRO"; installPointerEvents();
}
function hardResetTransform(){
  try{ resetMatrix(); rectMode(CORNER); }catch(e){}
  try{ drawingContext.setTransform(1,0,0,1,0,0); }catch(e){}
}

function draw(){
  hardResetTransform();
  // Never replace the gameplay with a recovery/black screen. If one non-critical
  // subsystem throws, isolate that subsystem and keep the main loop alive.
  try{ background(2,6,17); drawStars(); }catch(e){}
  try{ applyShake(); }catch(e){}
  try{
    if(state==="INTRO")drawIntro();else if(state==="HOME")drawHome();else if(state==="LEVELS")drawLevels();else if(state==="ARCHIVE")drawArchive();
    else if(state==="ABOUT")drawAbout();else if(state==="SETTINGS")drawSettings();else if(state==="HELP")drawHelp();else if(state==="ACHIEVEMENTS")drawAchievements();
    else if(state==="RATING")drawRating();else if(state==="RATING_THANKS")drawRatingThanks();else if(state==="PLAYING")runGame();
    else if(state==="PAUSED")drawPaused();else if(state==="GAMEOVER")drawGameOver();else if(state==="LEVELUP")drawLevelUp();
  }catch(err){
    // Deliberately silent: no GAME RECOVERING overlay and no black patch.
    // The next frame continues normally.
    resetMatrix();
  }
  hardResetTransform(); lastFrameSeen=millis();
}
function applyShake(){if(shake<=0)return;translate(random(-shake,shake),random(-shake,shake));shake*=.84;if(shake<.2)shake=0}
function isDragonLevel(n){return DRAGON_LEVELS.includes(n)}
function difficulty(){return 1+(level-1)*.105}
function currentShip(){return SHIPS[selectedShip]}
function shipPower(){return currentShip().power}
function saveGame(){
 try{localStorage.setItem(SAVE_KEY,JSON.stringify({unlockedLevel,selectedShip,campaignLives,soundOn,swappedControls,musicOn,highestDragon,dragonBadge,dragonTitle}))}catch(e){}
}
function loadSave(){
 try{
  const d=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");
  unlockedLevel=sdClampInt(d.unlockedLevel||1,1,TOTAL_LEVELS);
  selectedShip=sdClampInt(d.selectedShip||0,0,SHIPS.length-1);
  if(unlockedLevel<SHIPS[selectedShip].unlock)selectedShip=0;
  campaignLives=sdClampInt(d.campaignLives||START_LIVES,START_LIVES,MAX_LIVES); lives=campaignLives;
  soundOn=d.soundOn!==false;swappedControls=d.swappedControls===true;musicOn=d.musicOn!==false;
   highestDragon=sdClampInt(d.highestDragon||0,0,TOTAL_LEVELS);dragonBadge=d.dragonBadge||"";dragonTitle=d.dragonTitle||"";
 }catch(e){unlockedLevel=1;selectedShip=0;campaignLives=START_LIVES;lives=START_LIVES;soundOn=true;swappedControls=false;musicOn=true;highestDragon=0;dragonBadge="";dragonTitle=""}
}
function resetPowers(){powers.MULTI=0;powers.SHIELD=0;powers.BERSERKER=0;powers.CRYO=0}
function startLevel(n){
 level=sdClampInt(n,1,TOTAL_LEVELS);score=0;levelScore=0;lives=campaignLives;
 const obj=OBJECTIVES[level-1];objectiveType=obj.type;objectiveTarget=obj.target;objectiveProgress=0;objectiveComplete=false;
 levelDuration=38000+(level-1)*3000;levelStartedAt=millis();lastDropSpawn=millis();lastWeaponSpawn=millis();
 eventType="";eventUntil=0;nextEventAt=millis()+15000+random(9000);
 lastFire=0;specialReadyAt=millis()+4000;powerPressedUntil=0;bossWarningUntil=0;
 enemies=[];bullets=[];enemyShots=[];drops=[];weaponDrops=[];particles=[];floatingTexts=[];
 boss=null;bossActive=false;bossDefeated=false;guaranteedSlayerSpawned=false;
 enemiesDestroyedThisLevel=0;powerupsCollected=0;elitesDestroyedThisLevel=0;damageTakenThisLevel=0;
 waveNumber=0;waveActive=false;formationPulse=0;lastWaveAt=millis();combo=0;comboUntil=0;
 resetPowers();clearActiveWeapon();shipPlayer=new SpacePlayer();clearPointers();safeMode=false;gameFaults=0;state="PLAYING";initAudio();startMusic();
}
function playerSpeed(){let s=5.5;if(shipPower()==="QUANTUM DASH")s*=1.3;if(shipPower()==="TITAN CORE")s*=.9;return s}
function playerDamageMultiplier(){
 let d=1;if(shipPower()==="BURN SHOT")d*=1.12;if(shipPower()==="DRAGON RAGE"&&bossActive)d*=1.75;
 if(shipPower()==="TITAN CORE")d*=1.5;if(shipPower()==="REALITY BREAK")d*=1.8;
 if(millis()<powers.BERSERKER)d*=1.5;if(combo>=10)d*=1.1;if(combo>=20)d*=1.2;return d;
}
function fireDelay(){let d=145;if(shipPower()==="QUANTUM DASH")d=92;if(shipPower()==="TITAN CORE")d=105;if(shipPower()==="REALITY BREAK")d=72;if(millis()<powers.BERSERKER)d=65;return d}

class SpacePlayer{
 constructor(){this.x=width/2;this.y=height*.78;this.angle=-HPI;this.r=17;this.vx=0;this.vy=0;this.invincibleUntil=0}
 update(){
  this.vx*=.78;this.vy*=.78;this.x+=this.vx;this.y+=this.vy;
  // INFINITE SPACE: no invisible wall. Leaving one side brings the ship back from the opposite side.
  const pad=34;
  if(this.x<-pad)this.x=width+pad; else if(this.x>width+pad)this.x=-pad;
  const top=PLAY_TOP-20,bottom=height-150;
  if(this.y<top)this.y=bottom; else if(this.y>bottom)this.y=top;
 }
 draw(){
  if(millis()<this.invincibleUntil&&Math.floor(millis()/75)%2===0)return;
  push();translate(this.x,this.y);rotate(this.angle+HPI);
  drawEngineFlame(0,30,0.72);
  drawMiniShip(0,0,selectedShip,0.62);
  pop();
  if(millis()<powers.SHIELD)drawShield(this.x,this.y);if(millis()<powers.CRYO)drawCryo(this.x,this.y);
 }
}
function drawShield(x,y){noFill();stroke(70,210,245,165);strokeWeight(2);circle(x,y,66+sin(frameCount*.08)*5)}
function drawCryo(x,y){noFill();stroke(130,235,255,110);strokeWeight(2);circle(x,y,76+sin(frameCount*.1)*6);stroke(220,250,255,60);circle(x,y,98+sin(frameCount*.07)*8)}

function runGame(){
 // Keep simulation/world rendering isolated from the fixed HUD layer.
 if(enemies.length>SAFE_MAX_ENEMIES)enemies.length=SAFE_MAX_ENEMIES;
 if(enemyShots.length>SAFE_MAX_SHOTS)enemyShots.splice(0,enemyShots.length-SAFE_MAX_SHOTS);
 if(bullets.length>SAFE_MAX_BULLETS)bullets.splice(0,bullets.length-SAFE_MAX_BULLETS);
 if(particles.length>SAFE_MAX_PARTICLES)particles.splice(0,particles.length-SAFE_MAX_PARTICLES);
 if(floatingTexts.length>SAFE_MAX_FLOATING)floatingTexts.splice(0,floatingTexts.length-SAFE_MAX_FLOATING);
 const S=(fn)=>{try{fn()}catch(e){hardResetTransform()}};
 S(updateKeyboardMovement); S(updateJoystickMovement);
 fireHeld=firePointerId!==null; if(fireHeld)S(shoot);
 S(()=>shipPlayer.update());
 S(updateBullets); S(updateEnemies); S(updateEnemyShots); S(updateDrops); S(updateWeaponDrops);
 S(updateParticles); S(updateFloatingTexts); S(updateWaves);
 if(bossActive)S(updateBoss);
 S(spawnDrops); S(spawnWeaponDrops); S(checkBossSpawn);
 S(collideBulletsEnemies); S(collideShipEnemies); S(collideShipShots); S(collideBulletsBoss);
 S(updateObjective); S(checkLevelComplete); S(updateLiveEvent);
 // Draw the player/world layer first. Then explicitly restore screen-space coordinates.
 hardResetTransform();
 S(()=>shipPlayer.draw()); S(drawWeaponAttachment);
 // Static UI pass: HUD, warnings and controls can NEVER inherit any world/object rotation.
 hardResetTransform();
 S(drawHUD); S(drawWeaponHUD); S(drawWaveWarning); S(drawBossWarning); S(drawControls);
}
function updateWaves(){
 if(bossActive)return;
 // FIX: release the wave lock after a formation is cleared.
 if(enemies.length===0&&waveActive)waveActive=false;
 if(enemies.length===0&&!waveActive&&millis()-lastWaveAt>nextWaveDelay)startWave();
}
function startWave(){
 waveNumber++;waveActive=true;formationPulse=millis();
 const count=Math.min(14,3+Math.floor(level*.48)+Math.floor(waveNumber/3)+floor(random(2)));
 spawnFormation(count);lastWaveAt=millis();nextWaveDelay=Math.max(620,1750-level*48);
}
function spawnFormation(count){
 const pattern=floor(random(4));
 for(let i=0;i<count;i++){
  let x;
  if(pattern===0)x=width/(count+1)*(i+1);
  else if(pattern===1)x=35+width/Math.max(2,count)*i;
  else if(pattern===2)x=width/2+(i-(count-1)/2)*48;
  else x=35+random(Math.max(50,width-70));
  enemies.push(new Enemy(x,-50-i*32));
 }
 // Guarantee at least one ELITE per wave while an ELITE objective is unfinished.
 if(objectiveType==="ELITE"&&elitesDestroyedThisLevel<objectiveTarget&&!enemies.some(e=>e.type==="ELITE")){
  const ex=constrain(width*.5+random(-width*.3,width*.3),40,width-40);
  const elite=new Enemy(ex,-80);
  elite.type="ELITE";elite.r=26;elite.hp=elite.maxHp=4;
  enemies.push(elite);
 }
}
function spawnDrops(){
 if(millis()-lastDropSpawn<Math.max(4600,7600-level*95)||drops.length>=1)return;
 drops.push(new PowerDrop());lastDropSpawn=millis();
}
function spawnWeaponDrops(){
 if(isDragonLevel(level)){
  const bt=levelStartedAt+levelDuration*.55;
  if(!guaranteedSlayerSpawned&&millis()>=bt-6500&&millis()<bt&&weaponDrops.length===0&&activeWeapon!=="SLAYER"){
   weaponDrops.push(new WeaponDrop("SLAYER"));guaranteedSlayerSpawned=true;
   addFloatingText("DRAGON SLAYER INCOMING",width/2,height*.30,"#ff7549",14);shake=5;
  }
  return;
 }
 if(millis()-lastWeaponSpawn>7000&&weaponDrops.length===0&&random()<.005){
  const r=random();weaponDrops.push(new WeaponDrop(r<.5?"PLASMA":r<.83?"VOID":"SLAYER"));lastWeaponSpawn=millis();
 }
}

class Enemy{
 constructor(x,y){
  this.type=chooseEnemyType();
  // Multiple alien silhouettes can appear in the same level and wave.
  this.variant=(level*3+waveNumber*5+floor(random(6)))%20;
  this.x=x;this.y=y;this.r=22;this.hp=1;this.maxHp=1;this.phase=random(PI2);this.rot=random(PI2);this.age=0;
  this.speed=(1.25+random(.8))*difficulty();this.lastShot=millis()+800+random(1400);this.dashUntil=0;
  if(this.type==="INTERCEPTOR")this.speed*=1.35;
  if(this.type==="HUNTER")this.hp=this.maxHp=2;
  if(this.type==="HEAVY"){this.r=27;this.hp=this.maxHp=5;this.speed*=.6}
  if(this.type==="ELITE"){this.r=26;this.hp=this.maxHp=4;this.speed*=.86}
 }
 update(){
  this.age++;let vx=0,vy=this.speed;if(millis()<powers.CRYO)vy*=.28;if(shipPower()==="GRAVITY PULSE")vy*=.55;if(shipPower()==="TIME FREEZE")vy*=.38;
  if(this.type==="SCOUT")vx=sin(frameCount*.026+this.phase)*.7;
  else if(this.type==="INTERCEPTOR"){vx=sin(frameCount*.085+this.phase)*2.5;if(this.y>120&&this.y<400&&random()<.006)this.dashUntil=millis()+450;if(millis()<this.dashUntil){vx*=2.5;vy*=1.8}}
  else if(this.type==="HUNTER"){vx=constrain((shipPlayer.x-this.x)*.022,-2.6,2.6);if(millis()-this.lastShot>max(950,2300-level*35)){this.fire();this.lastShot=millis()}}
  else if(this.type==="HEAVY"){vx=sin(frameCount*.018+this.phase)*.3;if(millis()-this.lastShot>max(1300,3000-level*30)){this.fireSpread();this.lastShot=millis()}}
  else{vx=constrain((shipPlayer.x-this.x)*.014,-1.7,1.7)+sin(frameCount*.055+this.phase);if(millis()-this.lastShot>max(800,1900-level*30)){this.fireSpread();this.lastShot=millis()}}
  this.x=constrain(this.x+vx,25,width-25);this.y+=vy;this.rot+=.025;
 }
 fire(){const a=atan2(shipPlayer.y-this.y,shipPlayer.x-this.x);if(enemyShots.length<SAFE_MAX_SHOTS)enemyShots.push(new EnemyShot(this.x,this.y,a,3.1+level*.035))}
 fireSpread(){const b=atan2(shipPlayer.y-this.y,shipPlayer.x-this.x),sp=this.type==="ELITE"?[-18,0,18]:[-12,12];for(const d of sp)if(enemyShots.length<SAFE_MAX_SHOTS)enemyShots.push(new EnemyShot(this.x,this.y,b+rad(d),this.type==="ELITE"?3.8:3.3))}
 draw(){push();translate(this.x,this.y);rotate(this.rot);drawAlienVariant(this.variant,this.type);pop();if(this.hp<this.maxHp)drawEnemyHealth(this)}
 dead(){return this.y>height+100||this.x<-150||this.x>width+150}
}
function chooseEnemyType(){
 const r=random();
 // FIX: Level 4 (and later ELITE missions) now actually spawn ELITEs.
 if(objectiveType==="ELITE"&&elitesDestroyedThisLevel<objectiveTarget){
  const chance=level===4?0.48:0.34;
  if(r<chance)return"ELITE";
 }
 if(level<=2)return r<.75?"SCOUT":"INTERCEPTOR";
 if(level<=5){if(r<.35)return"SCOUT";if(r<.62)return"INTERCEPTOR";if(r<.84)return"HUNTER";return"HEAVY"}
 if(level>=21){if(r<.16)return"SCOUT";if(r<.34)return"INTERCEPTOR";if(r<.56)return"HUNTER";if(r<.78)return"HEAVY";return"ELITE";}if(r<.25)return"SCOUT";if(r<.45)return"INTERCEPTOR";if(r<.68)return"HUNTER";if(r<.86)return"HEAVY";return"ELITE";
}
function drawAlienVariant(v,type){
  const palettes=[
   ["#65dff5","#183f58","#c8fbff"],["#ef5dce","#42143f","#ffe0f8"],["#ffad43","#572b14","#fff0c7"],
   ["#ff5757","#4b1518","#ffb4b4"],["#b879ff","#32184d","#f3d9ff"],["#57ff9a","#103f2b","#d9ffea"],
   ["#62a9ff","#102d55","#dff1ff"],["#ffdd52","#4d3b0b","#fff7c2"],["#ff704d","#4d1d12","#ffe0d4"],
   ["#00e0c5","#073f3b","#e0fffa"],["#9d7cff","#28164c","#efe5ff"],["#ff5aa8","#4c1232","#ffe1f0"],
   ["#7cf7ff","#123b46","#efffff"],["#f58cff","#40134b","#ffe9ff"],["#8cff57","#183f12","#efffe4"],
   ["#ff9b55","#4a2510","#fff0df"],["#5d8dff","#142550","#e4ecff"],["#e8e05b","#3e3c0b","#ffffdf"],
   ["#ff5f7a","#46111d","#ffe2e7"],["#d96cff","#36104b","#f5ddff"]
  ];
  const c=palettes[v%palettes.length],edge=c[0],body=c[1],core=c[2];
  stroke(edge);strokeWeight(2.2);fill(body);
  const q=v%10;
  if(q===0){
    beginShape();
    vertex(0,-30);vertex(-16,-10);vertex(-42,2);vertex(-20,15);
    vertex(0,25);vertex(20,15);vertex(42,2);vertex(16,-10);
    endShape(CLOSE)
  }
  else if(q===1){
    beginShape();
    vertex(0,-34);vertex(12,-12);vertex(35,-22);vertex(25,2);
    vertex(38,20);vertex(10,14);vertex(0,30);vertex(-10,14);
    vertex(-38,20);vertex(-25,2);vertex(-35,-22);vertex(-12,-12);
    endShape(CLOSE)
  }
  else if(q===2){
    beginShape();
    vertex(0,-34);vertex(24,-4);vertex(30,20);vertex(8,15);
    vertex(0,32);vertex(-8,15);vertex(-30,20);vertex(-24,-4);
    endShape(CLOSE)
  }
  else if(q===3){
    rectMode(CENTER);rect(0,0,48,38,10);
    triangle(-24,-5,-44,17,-20,12);
    triangle(24,-5,44,17,20,12)
  }
  else if(q===4){
    beginShape();
    vertex(0,-38);vertex(14,-8);vertex(40,-3);vertex(19,10);
    vertex(26,29);vertex(0,17);vertex(-26,29);vertex(-19,10);
    vertex(-40,-3);vertex(-14,-8);
    endShape(CLOSE)
  }
  else if(q===5){
    ellipse(0,0,52,34);
    triangle(-18,4,-42,25,-20,15);
    triangle(18,4,42,25,20,15)
  }
  else if(q===6){
    beginShape();
    vertex(-34,-20);vertex(0,-8);vertex(34,-20);vertex(24,25);
    vertex(0,14);vertex(-24,25);
    endShape(CLOSE)
  }
  else if(q===7){
    beginShape();
    vertex(0,-36);vertex(8,-13);vertex(31,-23);vertex(22,0);
    vertex(34,22);vertex(7,14);vertex(0,34);vertex(-7,14);
    vertex(-34,22);vertex(-22,0);vertex(-31,-23);vertex(-8,-13);
    endShape(CLOSE)
  }
  else if(q===8){
    ellipse(0,0,44,44);rectMode(CENTER);
    rect(-31,0,15,8,3);rect(31,0,15,8,3)
  }
  else {
    beginShape();
    vertex(0,-30);vertex(18,-15);vertex(45,-5);vertex(23,7);
    vertex(16,31);vertex(0,17);vertex(-16,31);vertex(-23,7);
    vertex(-45,-5);vertex(-18,-15);
    endShape(CLOSE)
  }
  noStroke();fill(core);ellipse(0,-4,11,17);
  fill(edge);circle(-15,8,4);circle(15,8,4);
  if(v>=10){
    noFill();stroke(edge,100);strokeWeight(1.4);
    ellipse(0,0,60+sin(frameCount*.05+v)*6,22)
  }
}

function drawEnemyHealth(e){
  const w=38,ratio=constrain(e.hp/e.maxHp,0,1);
  noStroke();
  fill(255,255,255,30);
  rect(e.x-w/2,e.y-e.r-8,w,4,2);
  fill("#ff6470");
  rect(e.x-w/2,e.y-e.r-8,w*ratio,4,2)
}

function drawScout(){
  stroke("#65dff5");strokeWeight(2);fill("#183f58");
  ellipse(0,5,48,20);ellipse(0,-2,28,18);
  noStroke();fill("#c8fbff");ellipse(0,-3,10,7);
  fill("#4de5ff");circle(-15,6,4);circle(0,9,4);circle(15,6,4)
}

function drawInterceptor(){
  stroke("#ef5dce");strokeWeight(2);fill("#42143f");
  beginShape();
  vertex(0,-27);vertex(13,-10);vertex(34,-5);vertex(20,7);
  vertex(11,24);vertex(0,13);vertex(-11,24);vertex(-20,7);
  vertex(-34,-5);vertex(-13,-10);
  endShape(CLOSE);
  noStroke();fill("#ffe0f8");ellipse(0,-2,9,14)
}

function drawHunter(){
  stroke("#ffad43");strokeWeight(2.2);fill("#572b14");
  beginShape();
  vertex(0,-27);vertex(11,-16);vertex(24,-18);vertex(19,-3);
  vertex(27,14);vertex(9,10);vertex(0,24);vertex(-9,10);
  vertex(-27,14);vertex(-19,-3);vertex(-24,-18);vertex(-11,-16);
  endShape(CLOSE);
  noStroke();fill("#fff0c7");ellipse(0,-2,12,17)
}

function drawHeavy(){
  stroke("#ff5757");strokeWeight(2.5);fill("#4b1518");
  beginShape();
  vertex(0,-28);vertex(15,-20);vertex(29,-6);vertex(25,17);
  vertex(11,24);vertex(0,20);vertex(-11,24);vertex(-25,17);
  vertex(-29,-6);vertex(-15,-20);
  endShape(CLOSE);
  noStroke();fill("#ffb4b4");ellipse(0,-3,13,18)
}

function drawElite(){
  stroke("#b879ff");strokeWeight(2.5);fill("#32184d");
  beginShape();
  vertex(0,-30);vertex(12,-17);vertex(27,-10);vertex(19,3);
  vertex(23,20);vertex(8,15);vertex(0,26);vertex(-8,15);
  vertex(-23,20);vertex(-19,3);vertex(-27,-10);vertex(-12,-17);
  endShape(CLOSE);
  noStroke();fill("#f3d9ff");ellipse(0,-4,11,17)
}

function updateEnemies(){
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    e.update();
    if(e.dead())enemies.splice(i,1);
    else e.draw()
  }
}

class Bullet{
  constructor(x,y,a,d){
    this.x=x;this.y=y;this.angle=a;this.damage=d;
    this.speed=12;this.r=5;this.life=105;this.weaponId=null
  }
  update(){
    if(!this.weaponId&&this.life<100){
      const t=findAimTarget(this.x,this.y,this.angle);
      if(t)this.angle=lerpAngle(
        this.angle,
        atan2(t.y-this.y,t.x-this.x),
        .025
      )
    }
    this.x+=cos(this.angle)*this.speed;
    this.y+=sin(this.angle)*this.speed;
    this.life--;
  }
  draw(){
    let c=currentShip().edge;
    if(this.weaponId)c=getWeapon(this.weaponId).color;
    stroke(c);
    strokeWeight(
      this.weaponId==="SLAYER"?7:
      this.weaponId==="VOID"?5:3.2
    );
    line(
      this.x,
      this.y,
      this.x-cos(this.angle)*18,
      this.y-sin(this.angle)*18
    )
  }
  dead(){
    return this.life<=0||
           this.x<-80||this.x>width+80||
           this.y<-80||this.y>height+80
  }
}

function findAimTarget(x,y,a){
  let n=null,nd=Infinity;
  for(const e of enemies){
    const d=dist(x,y,e.x,e.y);
    if(d>500)continue;
    const diff=abs(norm(
      atan2(e.y-y,e.x-x)-a
    ));
    if(diff<rad(12)&&d<nd){
      n=e;nd=d
    }
  }
  return n
}

function shoot(){
  if(state!=="PLAYING"||millis()-lastFire<fireDelay())return;
  lastFire=millis();
  playFireSound();

  let angles=[shipPlayer.angle];

  if(millis()<powers.MULTI)
    angles=[
      shipPlayer.angle-rad(13),
      shipPlayer.angle,
      shipPlayer.angle+rad(13)
    ];

  if(shipPower()==="REALITY BREAK")
    angles=[-.38,-.19,0,.19,.38]
      .map(o=>shipPlayer.angle+o);

  for(const a of angles)
    if(bullets.length<SAFE_MAX_BULLETS)
      bullets.push(
        new Bullet(
          shipPlayer.x+cos(a)*27,
          shipPlayer.y+sin(a)*27,
          a,
          10*playerDamageMultiplier()
        )
      );

  weaponShoot();
}

function updateBullets(){
  for(let i=bullets.length-1;i>=0;i--){
    bullets[i].update();
    if(bullets[i].dead())bullets.splice(i,1);
    else bullets[i].draw()
  }
}

function getWeapon(id){
  return WEAPONS.find(w=>w.id===id)||WEAPONS[0]
}

function weaponIsActive(){
  return activeWeapon!==null&&millis()<activeWeaponUntil
}

function currentWeapon(){
  return weaponIsActive()?getWeapon(activeWeapon):null
}

function clearActiveWeapon(){
  activeWeapon=null;
  activeWeaponUntil=0;
  weaponLastFire=0
}

function weaponShoot(){
  if(!weaponIsActive())return;
  const w=currentWeapon();
  if(millis()-weaponLastFire<w.rate)return;

  weaponLastFire=millis();
  const a=shipPlayer.angle;

  if(w.id==="PLASMA"){
    createWeaponBullet(a-.16,w);
    createWeaponBullet(a+.16,w)
  }
  else createWeaponBullet(a,w);

  tone(
    w.id==="SLAYER"?180:420,
    w.id==="SLAYER"?60:900,
    w.id==="SLAYER"?.22:.09,
    .045,
    "square"
  )
}

function createWeaponBullet(a,w){
  const b=new Bullet(
    shipPlayer.x+cos(a)*35,
    shipPlayer.y+sin(a)*35,
    a,
    w.damage
  );
  b.weaponId=w.id;

  if(w.id==="PLASMA"){
    b.speed=13.5;b.r=7;b.life=120
  }
  else if(w.id==="VOID"){
    b.speed=15;b.r=10;b.life=140
  }
  else{
    b.speed=11;b.r=13;b.life=170
  }

  if(bullets.length<SAFE_MAX_BULLETS)
    bullets.push(b);
}

class EnemyShot{
  constructor(x,y,a,s){
    this.x=x;this.y=y;this.angle=a;
    this.speed=s;this.r=7;this.life=220
  }
  update(){
    this.x+=cos(this.angle)*this.speed;
    this.y+=sin(this.angle)*this.speed;
    this.life--
  }
  draw(){
    stroke("#ff5265");strokeWeight(3.5);
    line(
      this.x,
      this.y,
      this.x-cos(this.angle)*14,
      this.y-sin(this.angle)*14
    )
  }
  dead(){
    return this.life<=0||
      this.x<-100||this.x>width+100||
      this.y<-100||this.y>height+100
  }
}

function updateEnemyShots(){
  for(let i=enemyShots.length-1;i>=0;i--){
    const s=enemyShots[i];
    s.update();
    if(s.dead())enemyShots.splice(i,1);
    else s.draw()
  }
}

class DragonBoss{
  constructor(){
    const d=DRAGON_DATA[level]||DRAGON_DATA[5];
    this.name=d.name;
    this.color=d.color;
    this.x=width/2;
    this.y=-145;
    this.targetY=max(135,height*.18);
    this.r=105;
    this.maxHp=1150+level*280;
    this.hp=this.maxHp;
    this.phase=1;
    this.t=0;
    this.lastAttack=millis();
    this.variant=DRAGON_LEVELS.indexOf(level);
  }

  update(){
    if(this.y<this.targetY){
      this.y+=1.55;
      return
    }

    const ratio=this.hp/this.maxHp,old=this.phase;
    this.phase=ratio>.62?1:ratio>.32?2:3;

    if(old!==this.phase){
      shake=18;
      createExplosion(this.x,this.y,60,this.color);
      addFloatingText(
        "PHASE "+this.phase,
        this.x,
        this.y-110,
        this.color,
        18
      );
      playBossPhaseSound()
    }

    const sm=this.phase===1?1:
             this.phase===2?1.55:2.15;

    this.t+=.014*sm;
    this.x=width/2+
      sin(this.t)*width*(.22+.025*this.variant);

    const delay=Math.max(
      520,
      (this.phase===1?1900:
       this.phase===2?1250:760)-level*3
    );

    if(millis()-this.lastAttack>delay){
      this.attack();
      this.lastAttack=millis()
    }
  }

  attack(){
    const base=atan2(
      shipPlayer.y-this.y,
      shipPlayer.x-this.x
    );

    bossWarningUntil=millis()+450;

    const spreads=
      this.phase===1?[0]:
      this.phase===2?[-18,0,18]:
      [-34,-17,0,17,34];

    const speed=
      3.3+level*.045+(this.phase-1)*.55;

    for(const d of spreads)
      if(enemyShots.length<SAFE_MAX_SHOTS)
        enemyShots.push(
          new EnemyShot(
            this.x,
            this.y+40,
            base+rad(d),
            speed
          )
        );

    if(this.phase>=2&&enemyShots.length<SAFE_MAX_SHOTS)
      enemyShots.push(
        new EnemyShot(
          this.x,
          this.y+40,
          HPI,
          2.8+level*.02
        )
      );

    if(this.phase>=3&&enemyShots.length<SAFE_MAX_SHOTS)
      enemyShots.push(
        new EnemyShot(
          this.x,
          this.y+40,
          HPI+Math.PI,
          2.8+level*.02
        )
      );

    if(this.phase===3){
      for(let i=0;i<3&&enemyShots.length<SAFE_MAX_SHOTS;i++)
        enemyShots.push(
          new EnemyShot(
            this.x+(i-1)*45,
            this.y+42,
            base+rad((i-1)*10),
            5.1
          )
        );
      shake=8
    }
  }

  draw(){
    const d=DRAGON_DATA[level]||DRAGON_DATA[5],
          edge=this.phase===3?
            "#ff304d":
            this.phase===2?d.color:d.color;

    push();
    translate(this.x,this.y);
    noFill();
    stroke(edge);
    strokeWeight(3.2);
    circle(
      0,
      0,
      225+sin(frameCount*.08)*12
    );

    const v=this.variant;

    if(v===0){
      fill("#52180e");
      beginShape();
      vertex(-25,-4);vertex(-105,-48);vertex(-65,5);
      vertex(-110,40);vertex(-30,27);
      endShape(CLOSE);

      beginShape();
      vertex(25,-4);vertex(105,-48);vertex(65,5);
      vertex(110,40);vertex(30,27);
      endShape(CLOSE);

      ellipse(0,8,98,125)
    }
    else if(v===1){
      fill("#24133f");
      beginShape();
      vertex(0,-75);vertex(34,-28);vertex(92,-38);
      vertex(52,12);vertex(76,68);vertex(0,40);
      vertex(-76,68);vertex(-52,12);vertex(-92,-38);
      vertex(-34,-28);
      endShape(CLOSE);
      ellipse(0,0,105,130)
    }
    else if(v===2){
      fill("#54120d");
      beginShape();
      vertex(0,-80);vertex(48,-30);vertex(108,-8);
      vertex(58,20);vertex(85,74);vertex(20,45);
      vertex(0,86);vertex(-20,45);vertex(-85,74);
      vertex(-58,20);vertex(-108,-8);vertex(-48,-30);
      endShape(CLOSE);
      ellipse(0,4,112,138)
    }
    else if(v===3){
      fill("#123c50");
      ellipse(0,0,118,145);
      triangle(-42,-28,-112,-60,-72,0);
      triangle(42,-28,112,-60,72,0);
      triangle(-35,42,-95,70,-48,62);
      triangle(35,42,95,70,48,62)
    }
    else if(v===4){
      fill("#351047");
      ellipse(0,0,125,150);
      for(let a=-1;a<=1;a+=2){
        triangle(a*38,-38,a*112,-90,a*76,-8);
        triangle(a*45,35,a*105,72,a*60,56)
      }
    }
    else{
      fill("#4d3b05");
      ellipse(0,0,132,158);
      triangle(-45,-30,-120,-110,-82,-8);
      triangle(45,-30,120,-110,82,-8);
      triangle(-45,45,-118,96,-58,70);
      triangle(45,45,118,96,58,70)
    }

    noStroke();
    fill(this.phase===3?"#ff1744":"#fff05a");
    ellipse(-17,-35,14,10);
    ellipse(17,-35,14,10);

    fill(edge);
    triangle(-18,45,0,70,18,45);

    pop();
  }
}

function checkBossSpawn(){
  if(!isDragonLevel(level)||bossActive||bossDefeated)return;

  if(millis()>=levelStartedAt+levelDuration*.34){
    boss=new DragonBoss();
    bossActive=true;
    enemies=[];
    drops=[];
    enemyShots=[];
    bossWarningUntil=millis()+3000;
    shake=20;
    playBossSound()
  }
}

function updateBoss(){
  if(!boss)return;

  boss.update();
  boss.draw();
  drawBossBar();

  if(boss.hp<=0){
    const reward=1300+level*180;
    score+=reward;
    levelScore+=reward;

    createExplosion(
      boss.x,boss.y,150,"#ff6735"
    );
    createExplosion(
      boss.x,boss.y,90,"#ffe15b"
    );
    createExplosion(
      boss.x,boss.y,55,"#fff"
    );

    enemyShots=[];
    boss=null;
    bossActive=false;
    bossDefeated=true;
    shake=28;
    combo+=10;

    const bd=DRAGON_DATA[level];

    if(bd&&level>highestDragon){
      highestDragon=level;
      dragonBadge=bd.badge;
      dragonTitle=bd.title;
      saveGame()
    }

    comboUntil=millis()+5000;

    addFloatingText(
      "DRAGON DESTROYED!",
      width/2,
      height*.35,
      "#ffe65a",
      22
    );

    playBossDeathSound()
  }
}

function drawBossBar(){
  if(!boss)return;

  const w=min(360,width*.78),
        x=width/2-w/2,
        y=115,
        r=constrain(
          boss.hp/boss.maxHp,
          0,
          1
        );

  label(
    (DRAGON_DATA[level]||DRAGON_DATA[5]).name+
    " • PHASE "+boss.phase,
    width/2,
    y-15,
    10,
    boss.phase===3?
      "#ff6573":
      (DRAGON_DATA[level]||DRAGON_DATA[5]).color,
    CENTER,
    CENTER,
    true
  );

  noStroke();
  fill(255,255,255,35);
  rect(x,y,w,12,5);

  fill(
    boss.phase===3?
      "#ff304d":
      "#eb4637"
  );

  rect(x,y,w*r,12,5)
}

function drawBossWarning(){
  if(millis()>bossWarningUntil)return;

  const p=.5+.5*sin(millis()*.025);

  push();
  resetMatrix();
  noStroke();
  fill(255,35,45,7+p*8);

  ellipse(
    0,
    height*.18,
    170+p*30,
    170+p*30
  );
  ellipse(
    width,
    height*.18,
    170+p*30,
    170+p*30
  );
  ellipse(
    0,
    height*.82,
    170+p*30,
    170+p*30
  );
  ellipse(
    width,
    height*.82,
    170+p*30,
    170+p*30
  );

  pop();

  label(
    "⚠ DRAGON ATTACK",
    width/2,
    height*.24,
    16,
    "#ff6872",
    CENTER,
    CENTER,
    true
  )
}

function drawWaveWarning(){
  if(!waveActive||bossActive)return;

  if(millis()-formationPulse>1100){
    waveActive=false;
    return
  }

  label(
    "WAVE "+waveNumber,
    width/2,
    height*.24,
    15,
    "#77dfff",
    CENTER,
    CENTER,
    true
  )
}

function collideBulletsEnemies(){
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];

    for(let j=bullets.length-1;j>=0;j--){
      const b=bullets[j];

      if(dist(e.x,e.y,b.x,b.y)<e.r+b.r){
        e.hp-=b.damage;
        bullets.splice(j,1);

        createHitSpark(
          b.x,
          b.y,
          b.weaponId?
            getWeapon(b.weaponId).color:
            currentShip().edge
        );

        if(e.hp<=0){
          destroyEnemy(i);
          break
        }
      }
    }
  }
}

function destroyEnemy(i){
  const e=enemies[i];
  if(!e)return;

  let p=
    e.type==="SCOUT"?30:
    e.type==="INTERCEPTOR"?40:
    e.type==="HUNTER"?55:
    e.type==="HEAVY"?85:
    125;

  if(e.type==="ELITE")
    elitesDestroyedThisLevel++;

  combo++;
  comboUntil=millis()+2400;

  const frenzy=
    (eventType==="FRENZY"&&millis()<eventUntil)?
      2:1;

  const pts=floor(
    p*
    min(3,1+combo*.035)*
    frenzy
  );

  score+=pts;
  levelScore+=pts;
  enemiesDestroyedThisLevel++;

  createExplosion(
    e.x,
    e.y,
    e.type==="HEAVY"?42:
      e.type==="ELITE"?38:24,
    getEnemyColor(e.type)
  );

  createHitRing(
    e.x,
    e.y,
    getEnemyColor(e.type)
  );

  shake=
    e.type==="HEAVY"?7:
    e.type==="ELITE"?5:
    2.8;

  addFloatingText(
    "+"+pts,
    e.x,
    e.y-20,
    combo>=10?"#ffe45a":"#dceff5",
    combo>=10?13:11
  );

  if([10,20,30].includes(combo)){
    addFloatingText(
      "COMBO x"+combo,
      e.x,
      e.y-45,
      "#ffdf55",
      16
    );
    shake=7
  }

  enemies.splice(i,1)
}

function collideBulletsBoss(){
  if(!bossActive||!boss)return;

  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];

    if(dist(
      b.x,
      b.y,
      boss.x,
      boss.y
    )<boss.r+b.r){

      let m=
        b.weaponId?
          getWeapon(b.weaponId).dragonMultiplier:
          1;

      boss.hp-=b.damage*m;
      bullets.splice(i,1);

      createHitSpark(
        b.x,
        b.y,
        b.weaponId?
          getWeapon(b.weaponId).color:
          "#ff9a40"
      );

      if(b.weaponId==="SLAYER"){
        createHitRing(
          b.x,
          b.y,
          "#ff6a43"
        );
        createExplosion(
          b.x,
          b.y,
          4,
          "#ffe05a"
        )
      }
    }
  }
}

function collideShipEnemies(){
  if(millis()<shipPlayer.invincibleUntil)return;

  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];

    if(dist(
      shipPlayer.x,
      shipPlayer.y,
      e.x,
      e.y
    )<shipPlayer.r+e.r*.72){

      if(millis()<powers.SHIELD){
        enemies.splice(i,1);
        createExplosion(
          e.x,e.y,28,"#00cfff"
        );
        shake=5;
        return
      }

      if(shipPower()==="PHASE DODGE"&&random()<.65){
        shipPlayer.invincibleUntil=millis()+650;
        createHitRing(
          shipPlayer.x,
          shipPlayer.y,
          "#ff62dc"
        );
        return
      }

      enemies.splice(i,1);
      damagePlayer();
      return
    }
  }
}

function collideShipShots(){
  if(millis()<shipPlayer.invincibleUntil)return;

  for(let i=enemyShots.length-1;i>=0;i--){
    const s=enemyShots[i];

    if(dist(
      shipPlayer.x,
      shipPlayer.y,
      s.x,
      s.y
    )<shipPlayer.r+s.r){

      if(millis()<powers.SHIELD){
        enemyShots.splice(i,1);
        createHitRing(
          s.x,
          s.y,
          "#00cfff"
        );
        shake=4;
        return
      }

      enemyShots.splice(i,1);
      damagePlayer();
      return
    }
  }
}

function damagePlayer(){
  lives--;
  damageTakenThisLevel++;
  combo=0;
  comboUntil=0;

  createExplosion(
    shipPlayer.x,
    shipPlayer.y,
    50,
    "#ff5968"
  );

  createHitRing(
    shipPlayer.x,
    shipPlayer.y,
    "#ff5968"
  );

  shipPlayer.invincibleUntil=millis()+1800;
  shake=13;

  addFloatingText(
    "-1 LIFE",
    shipPlayer.x,
    shipPlayer.y-45,
    "#ff6672",
    16
  );

  playHitSound();

  if(lives<=0){
    campaignLives=Math.max(
      START_LIVES,
      campaignLives-1
    );

    saveGame();
    clearPointers();
    stopMusic();
    state="GAMEOVER"
  }
}

class PowerDrop{
  constructor(){
    this.type=random([
      "MULTI",
      "SHIELD",
      "NOVA",
      "BERSERKER",
      "CRYO"
    ]);
    this.x=50+random(
      max(50,width-100)
    );
    this.y=145+random(
      max(80,height-360)
    );
    this.r=23;
    this.life=850;
    this.rot=0
  }

  update(){
    this.rot+=.045;
    this.life--
  }

  draw(){
    const cm={
      MULTI:"#ffe600",
      SHIELD:"#00cfff",
      NOVA:"#fff",
      BERSERKER:"#ff3455",
      CRYO:"#9eefff"
    };

    const c=cm[this.type];

    push();
    translate(this.x,this.y);
    rotate(this.rot);
    stroke(c);
    strokeWeight(2);
    fill(10,30,40,225);
    circle(0,0,48);
    noFill();
    circle(
      0,
      0,
      38+sin(frameCount*.1)*5
    );
    pop();

    label(
      this.type==="BERSERKER"?"BR":
      this.type==="SHIELD"?"S":
      this.type==="MULTI"?"M":
      this.type==="NOVA"?"N":"CR",
      this.x,
      this.y,
      10,
      c,
      CENTER,
      CENTER,
      true
    )
  }
}

function updateDrops(){
  for(let i=drops.length-1;i>=0;i--){
    const d=drops[i];
    d.update();

    if(d.life<=0){
      drops.splice(i,1);
      continue
    }

    d.draw();

    if(dist(
      shipPlayer.x,
      shipPlayer.y,
      d.x,
      d.y
    )<shipPlayer.r+d.r){

      activatePower(d.type);
      score+=50;
      levelScore+=50;
      powerupsCollected++;

      createExplosion(
        d.x,
        d.y,
        30,
        "#ffe15b"
      );

      addFloatingText(
        powerName(d.type),
        d.x,
        d.y-30,
        powerColor(d.type),
        14
      );

      drops.splice(i,1)
    }
  }
}

function powerName(t){
  return t==="MULTI"?"TRIPLE SHOT":
    t==="SHIELD"?"SHIELD ONLINE":
    t==="NOVA"?"NOVA BLAST":
    t==="BERSERKER"?"BERSERKER":
    "CRYO FREEZE"
}

function powerColor(t){
  return t==="MULTI"?"#ffe600":
    t==="SHIELD"?"#00cfff":
    t==="NOVA"?"#fff":
    t==="BERSERKER"?"#ff3455":
    "#9eefff"
}

function activatePower(t){
  const now=millis(),
        dur=t==="CRYO"?9000:7000;

  if(t==="MULTI")
    powers.MULTI=now+dur;

  else if(t==="SHIELD")
    powers.SHIELD=now+dur;

  else if(t==="BERSERKER")
    powers.BERSERKER=now+dur;

  else if(t==="CRYO"){
    powers.CRYO=now+dur;
    shake=5
  }

  else if(t==="NOVA"){
    for(let i=enemies.length-1;i>=0;i--){
      createExplosion(
        enemies[i].x,
        enemies[i].y,
        25,
        "#fff"
      );
      score+=20;
      levelScore+=20;
      enemies.splice(i,1)
    }

    if(bossActive&&boss)
      boss.hp-=boss.maxHp*.08;

    shake=15
  }

  powerPressedUntil=now+350;
  playPowerSound()
}

function useSpecial(){
  if(state!=="PLAYING"||millis()<specialReadyAt)return;

  const now=millis(),
        p=shipPower();

  if([
    "BALANCED",
    "BURN SHOT",
    "DRAGON RAGE",
    "TITAN CORE"
  ].includes(p))
    powers.BERSERKER=now+6000;

  else if([
    "GRAVITY PULSE",
    "TIME FREEZE"
  ].includes(p))
    powers.CRYO=now+6500;

  else if([
    "PHASE DODGE",
    "QUANTUM DASH"
  ].includes(p))
    shipPlayer.invincibleUntil=now+4500;

  else if(p==="HOLY SHIELD")
    powers.SHIELD=now+7000;

  else if(p==="REALITY BREAK"){
    powers.SHIELD=now+6500;
    powers.BERSERKER=now+6500;

    for(let i=enemies.length-1;i>=0;i--){
      createExplosion(
        enemies[i].x,
        enemies[i].y,
        25,
        "#ffd43b"
      );
      enemies.splice(i,1);
      score+=35;
      levelScore+=35
    }

    if(boss)
      boss.hp-=boss.maxHp*.12;

    shake=20
  }

  specialReadyAt=now+15000;
  playPowerSound();

  addFloatingText(
    p,
    shipPlayer.x,
    shipPlayer.y-50,
    currentShip().edge,
    14
  )
}

class WeaponDrop{
  constructor(type){
    this.type=type;
    this.x=width*.18+random(width*.64);
    this.y=max(145,height*.25);
    this.vy=.45;
    this.r=28;
    this.life=1050;
    this.rot=0
  }

  update(){
    this.y+=this.vy;
    this.rot+=.05;
    this.life--
  }

  draw(){
    const w=getWeapon(this.type);

    push();
    translate(this.x,this.y);
    rotate(this.rot);
    stroke(w.color);
    strokeWeight(2.5);
    fill(8,18,28,240);
    circle(0,0,58);
    noFill();
    circle(
      0,
      0,
      44+sin(frameCount*.12)*5
    );
    pop();

    label(
      w.symbol,
      this.x,
      this.y,
      19,
      w.color,
      CENTER,
      CENTER,
      true
    );

    label(
      "GRAB",
      this.x,
      this.y+38,
      8,
      w.color,
      CENTER,
      CENTER,
      true
    )
  }

  dead(){
    return this.life<=0||this.y>height-175
  }
}

function updateWeaponDrops(){
  for(let i=weaponDrops.length-1;i>=0;i--){
    const d=weaponDrops[i];
    d.update();

    if(d.dead()){
      weaponDrops.splice(i,1);
      continue
    }

    d.draw();

    if(dist(
      shipPlayer.x,
      shipPlayer.y,
      d.x,
      d.y
    )<shipPlayer.r+d.r){

      activeWeapon=d.type;
      activeWeaponUntil=
        millis()+getWeapon(d.type).duration;
      weaponLastFire=0;

      createExplosion(
        d.x,
        d.y,
        55,
        getWeapon(d.type).color
      );

      shake=9;

      addFloatingText(
        getWeapon(d.type).name+"!",
        d.x,
        d.y-45,
        getWeapon(d.type).color,
        15
      );

      playWeaponPickupSound();
      weaponDrops.splice(i,1)
    }
  }
}

function drawWeaponAttachment(){
  if(!weaponIsActive())return;

  const w=currentWeapon();

  push();
  translate(
    shipPlayer.x,
    shipPlayer.y
  );
  rotate(shipPlayer.angle+HPI);
  stroke(w.color);
  strokeWeight(3);
  fill(10,25,36);

  beginShape();
  vertex(-18,-5);
  vertex(-34,-2);
  vertex(-40,11);
  vertex(-24,10);
  endShape(CLOSE);

  beginShape();
  vertex(18,-5);
  vertex(34,-2);
  vertex(40,11);
  vertex(24,10);
  endShape(CLOSE);

  noStroke();
  fill(w.color);
  circle(-31,4,9);
  circle(31,4,9);

  pop()
}

function drawWeaponHUD(){
  if(!weaponIsActive())return;

  const w=currentWeapon(),
        r=max(
          0,
          ceil(
            (activeWeaponUntil-millis())/1000
          )
        );

  rectMode(CENTER);
  stroke(w.color);
  fill(4,20,30,235);
  rect(width/2,94,205,26,8);

  label(
    w.name+" "+r+"s",
    width/2,
    94,
    8.5,
    w.color,
    CENTER,
    CENTER,
    true
  )
}

class Particle{
  constructor(x,y,c){
    const a=random(PI2),
          s=1+random(5.5);

    this.x=x;
    this.y=y;
    this.vx=cos(a)*s;
    this.vy=sin(a)*s;
    this.life=180;
    this.size=1.5+random(4);
    this.color=color(c||"#ff8a30");
    this.r=red(this.color);
    this.g=green(this.color);
    this.b=blue(this.color)
  }

  update(){
    this.x+=this.vx;
    this.y+=this.vy;
    this.vx*=.965;
    this.vy*=.965;
    this.life-=8
  }

  draw(){
    noStroke();
    fill(
      this.r,
      this.g,
      this.b,
      this.life
    );
    circle(
      this.x,
      this.y,
      this.size
    )
  }
}

function createExplosion(x,y,n,c){
  const room=Math.max(
    0,
    SAFE_MAX_PARTICLES-particles.length
  );

  const count=Math.min(
    n,
    room,
    45
  );

  for(let i=0;i<count;i++)
    particles.push(
      new Particle(x,y,c)
    )
}

function createHitSpark(x,y,c){
  for(let i=0;i<7;i++)
    particles.push(
      new Particle(x,y,c)
    );

  noFill();
  stroke(c);
  strokeWeight(2);
  circle(
    x,
    y,
    15+random(10)
  )
}

function createHitRing(x,y,c){
  noFill();
  stroke(c);
  strokeWeight(2);
  circle(x,y,28)
}

function updateParticles(){
  for(let i=particles.length-1;i>=0;i--){
    particles[i].update();
    particles[i].draw();

    if(particles[i].life<=0)
      particles.splice(i,1)
  }
}

function addFloatingText(t,x,y,c,s){
  floatingTexts.push({
    text:t,
    x,
    y,
    life:65,
    color:c,
    size:s
  })
}

function updateFloatingTexts(){
  for(let i=floatingTexts.length-1;i>=0;i--){
    const f=floatingTexts[i];

    f.y-=.55;
    f.life--;

    label(
      f.text,
      f.x,
      f.y,
      f.size,
      colorWithAlpha(
        f.color,
        constrain(f.life*4,0,255)
      ),
      CENTER,
      CENTER,
      true
    );

    if(f.life<=0)
      floatingTexts.splice(i,1)
  }
}

function updateObjective(){
  if(objectiveType==="SCORE")
    objectiveProgress=levelScore;

  else if(objectiveType==="KILLS")
    objectiveProgress=enemiesDestroyedThisLevel;

  else if(objectiveType==="ELITE")
    objectiveProgress=elitesDestroyedThisLevel;

  else if(objectiveType==="POWER")
    objectiveProgress=powerupsCollected;

  else if(objectiveType==="SURVIVE")
    objectiveProgress=
      millis()-levelStartedAt>=levelDuration?1:0;

  else if(objectiveType==="NO_DAMAGE")
    objectiveProgress=
      damageTakenThisLevel===0&&
      millis()-levelStartedAt>=levelDuration?1:0;

  else if(objectiveType==="BOSS")
    objectiveProgress=bossDefeated?1:0;

  objectiveComplete=
    objectiveProgress>=objectiveTarget
}

function checkLevelComplete(){
  updateObjective();

  const elapsed=
    millis()-levelStartedAt;

  // Dragon stages are boss stages: only the Dragon kill can finish them.
  if(isDragonLevel(level)){
    if(bossDefeated)completeLevel();
    return
  }

  // Score / kills / elites / power objectives finish as soon as the target is actually reached.
  if([
    "SCORE",
    "KILLS",
    "ELITE",
    "POWER"
  ].includes(objectiveType)){
    if(objectiveComplete)
      completeLevel();
    return
  }

  // Survival stages have a real timer and can never become permanently impossible.
  if(
    elapsed>=levelDuration&&
    objectiveComplete
  )
    completeLevel()
}

function completeLevel(){
  if(state!=="PLAYING")return;

  clearPointers();
  enemies=[];
  bullets=[];
  enemyShots=[];
  drops=[];
  weaponDrops=[];

  if(
    isDragonLevel(level)&&
    campaignLives<MAX_LIVES
  )
    campaignLives++;

  lives=campaignLives;

  if(level<TOTAL_LEVELS)
    unlockedLevel=
      max(unlockedLevel,level+1);

  saveGame();
  stopMusic();
  createCelebration();
  state="LEVELUP"
}

function updateLiveEvent(){
  if(state!=="PLAYING"||isDragonLevel(level))
    return;

  const now=millis();

  if(now>=nextEventAt){
    eventType=
      random()<.55?
        "FRENZY":
        "AMBUSH";

    eventUntil=
      now+
      (
        eventType==="FRENZY"?
          9000:
          3500
      );

    nextEventAt=
      now+
      22000+
      random(14000);

    if(eventType==="AMBUSH"){
      for(
        let i=0;
        i<Math.min(4,2+Math.floor(level/8));
        i++
      )
        if(enemies.length<SAFE_MAX_ENEMIES)
          enemies.push(
            new Enemy(
              random(35,width-35),
              -45
            )
          );
    }

    shake=6
  }

  if(now<eventUntil){
    if(eventType==="FRENZY")
      label(
        "⚡ FRENZY • 2X SCORE",
        width/2,
        height*.18,
        14,
        "#ffe15b",
        CENTER,
        CENTER,
        true
      );
    else
      label(
        "⚠ AMBUSH",
        width/2,
        height*.18,
        14,
        "#ff6573",
        CENTER,
        CENTER,
        true
      );
  }
}

function drawDragonBadge(){
  if(!dragonBadge)return;

  const bd=
    DRAGON_DATA[highestDragon]||
    DRAGON_DATA[5];

  const x=width-92,
        y=25,
        sz=25;

  // Compact medal-style insignia: ribbon + small metal medallion, no text/box.
  push();
  resetMatrix();
  translate(x,y);
  noStroke();

  fill(0,0,0,55);
  rectMode(CENTER);
  rect(-5,13,6,16,2);
  rect(5,13,6,16,2);

  fill(bd.color);
  rect(-5,13,4,15,1);

  fill(255,255,255,150);
  rect(5,13,4,15,1);

  fill(18,24,31);
  stroke(bd.color);
  strokeWeight(1.6);
  circle(0,-2,sz);

  noStroke();
  fill(bd.color);
  circle(0,-2,sz-7);

  fill(9,18,27);
  circle(0,-2,sz-13);

  stroke(255,255,255,150);
  strokeWeight(1);
  noFill();
  circle(0,-2,sz-17);

  noStroke();
  fill(bd.color);

  beginShape();
  vertex(0,-11);
  vertex(3,-6);
  vertex(9,-6);
  vertex(5,-1);
  vertex(7,6);
  vertex(0,3);
  vertex(-7,6);
  vertex(-5,-1);
  vertex(-9,-6);
  vertex(-3,-6);
  endShape(CLOSE);

  pop();
}
function drawHUD(){
 label("SCORE",14,11,8,"#718b96",LEFT,TOP,true);
 label(score,14,25,15,"#edf2f3",LEFT,TOP,true);
 label("LV "+level,width/2,12,14,"#edf2f3",CENTER,TOP,true);
 label("LIVES "+lives,width-14,12,13,"#edf2f3",RIGHT,TOP,true);
 label(LEVEL_NAMES[level-1],width/2,34,8.5,"#9daab0");
 drawDragonBadge();

 const w=min(300,width*.72),
       x=width/2-w/2,
       y=55;

 noStroke();
 fill(255,255,255,25);
 rect(x,y,w,6,3);
 fill("#4ba0be");
 rect(
   x,
   y,
   w*constrain(
     (millis()-levelStartedAt)/levelDuration,
     0,
     1
   ),
   6,
   3
 );

 fill(255,255,255,25);
 rect(x,y+15,w,6,3);
 fill("#cdb037");
 rect(
   x,
   y+15,
   w*constrain(
     levelScore/max(
       1,
       objectiveType==="SCORE"?
         objectiveTarget:
         400+level*160
     ),
     0,
     1
   ),
   6,
   3
 );

 label(
   objectiveLabel(),
   width/2,
   y+35,
   8.5,
   objectiveComplete?
     "#68ff9b":
     "#87999f"
 );

 if(
   combo>=2&&
   millis()<comboUntil
 )
   label(
     "COMBO x"+combo,
     width/2,
     84,
     12,
     combo>=20?
       "#ffdc4f":
       "#77dfff",
     CENTER,
     CENTER,
     true
   );

 if(millis()<powers.CRYO)
   label(
     "CRYO "+
     ceil(
       (powers.CRYO-millis())/1000
     )+"s",
     width-14,
     82,
     8.5,
     "#9eefff",
     RIGHT,
     CENTER,
     true
   );

 drawPause();
 drawHomeIcon();
}

function objectiveLabel(){
 if(objectiveType==="NO_DAMAGE")
   return damageTakenThisLevel===0?
     "NO DAMAGE • CLEAN RUN":
     "NO DAMAGE • FAILED";

 if(objectiveType==="SURVIVE")
   return "SURVIVE • "+
     floor(
       max(
         0,
         levelDuration-
         (millis()-levelStartedAt)
       )/1000
     )+"s";

 return OBJECTIVES[level-1].name+
   " • "+
   floor(
     min(
       objectiveProgress,
       objectiveTarget
     )
   )+
   "/"+
   objectiveTarget;
}

function drawControls(){
 stroke(70,180,210,125);
 strokeWeight(1.5);
 fill(0,120,170,20);
 circle(
   joy.x,
   joy.y,
   joy.r*2
 );

 fill(70,190,220,95);
 circle(
   joy.knobX,
   joy.knobY,
   43
 );

 stroke(230,75,90,175);
 fill(180,30,50,35);
 circle(
   fireBtn.x,
   fireBtn.y,
   fireBtn.r*2
 );

 label(
   "FIRE",
   fireBtn.x,
   fireBtn.y,
   12,
   "#f0f3f4",
   CENTER,
   CENTER,
   true
 );

 const ready=millis()>=specialReadyAt,
       pressed=millis()<powerPressedUntil;

 stroke(
   ready?
     "#ead34c":
     "#827d5a"
 );

 fill(
   ready?
     color(200,150,20,pressed?85:45):
     color(90,85,45,28)
 );

 circle(
   powerBtn.x,
   powerBtn.y,
   powerBtn.r*2
 );

 label(
   ready?
     "POWER":
     max(
       0,
       ceil(
         (specialReadyAt-millis())/1000
       )
     )+"s",
   powerBtn.x,
   powerBtn.y,
   ready?8.5:10,
   ready?
     "#f0f3f4":
     "#bdb7a0",
   CENTER,
   CENTER,
   true
 );
}

function drawPause(){
 stroke("#468ea8");
 strokeWeight(1.5);
 fill(5,22,36,235);
 circle(
   pauseBtn.x,
   pauseBtn.y,
   44
 );

 noStroke();
 fill("#edf7ff");
 rect(
   pauseBtn.x-5,
   pauseBtn.y,
   4,
   15,
   1
 );
 rect(
   pauseBtn.x+5,
   pauseBtn.y,
   4,
   15,
   1
 );
}

function drawHomeIcon(){
 stroke("#468ea8");
 strokeWeight(1.5);
 fill(5,22,36,235);
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
   homeBtn.x-9,
   homeBtn.y-1
 );
 vertex(
   homeBtn.x,
   homeBtn.y-9
 );
 vertex(
   homeBtn.x+9,
   homeBtn.y-1
 );
 vertex(
   homeBtn.x+7,
   homeBtn.y-1
 );
 vertex(
   homeBtn.x+7,
   homeBtn.y+8
 );
 vertex(
   homeBtn.x-7,
   homeBtn.y+8
 );
 vertex(
   homeBtn.x-7,
   homeBtn.y-1
 );
 endShape(CLOSE);
}

function drawIntro(){
 const t=millis()-introStart;

 for(let r=0;r<7;r++){
   noStroke();
   fill(
     10+r*3,
     18+r*3,
     38+r*5,
     18
   );

   circle(
     width/2,
     height*.46,
     80+r*120+
     sin(frameCount*.01+r)*8
   );
 }

 const cx=width/2,
       cy=height*.47;

 drawIntroShip(
   cx,
   cy+8,
   min(1.35,width/390)
 );

 label(
   "SPACE DODGER",
   cx,
   height*.17,
   min(46,width*.11),
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 label(
   "A GALACTIC SURVIVAL RUN",
   cx,
   height*.245,
   12,
   "#9ab5c1",
   CENTER,
   CENTER,
   false
 );

 drawIndiaFlag(
   width-34,
   32,
   28,
   18
 );

 button(
   "START",
   cx,
   height*.86,
   min(250,width*.62),
   56
 );

 // Keep the intro on screen until the player explicitly starts.
}

function drawEngineFlame(x,y,sc){
 push();
 translate(x,y);
 scale(sc);

 const pulse=
   .92+
   sin(frameCount*.32)*.12;

 noStroke();

 fill(
   55,
   210,
   255,
   38
 );

 ellipse(
   0,
   20,
   30*pulse,
   48*pulse
 );

 fill(
   40,
   155,
   255,
   90
 );

 triangle(
   -11,
   0,
   11,
   0,
   0,
   48*pulse
 );

 fill(
   255,
   188,
   65,
   210
 );

 triangle(
   -7,
   0,
   7,
   0,
   0,
   34*pulse
 );

 fill(
   255,
   248,
   215,
   235
 );

 triangle(
   -3.5,
   0,
   3.5,
   0,
   0,
   22*pulse
 );

 fill(
   100,
   225,
   255,
   130
 );

 ellipse(
   0,
   8,
   8,
   17*pulse
 );

 pop();
}

function drawIntroShip(x,y,sc){
 push();
 translate(x,y);
 scale(sc);

 const bob=
   sin(frameCount*.045)*5;

 translate(0,bob);

 drawEngineFlame(
   0,
   30,
   .95
 );

 stroke("#56e8ff");
 strokeWeight(2.4);
 fill("#081b31");

 beginShape();
 vertex(0,-58);
 vertex(-15,-24);
 vertex(-58,16);
 vertex(-28,15);
 vertex(-12,38);
 vertex(0,29);
 vertex(12,38);
 vertex(28,15);
 vertex(58,16);
 vertex(15,-24);
 endShape(CLOSE);

 // cockpit
 fill("#e9fbff");
 ellipse(
   0,
   -16,
   20,
   30
 );

 fill("#4edcff");
 ellipse(
   0,
   -17,
   12,
   20
 );

 // wing lights
 noStroke();
 fill("#8effff");
 circle(-37,12,5);
 circle(37,12,5);

 // animated energy rings
 noFill();
 stroke(100,230,255,90);
 strokeWeight(1.2);

 ellipse(
   0,
   0,
   130+
   sin(frameCount*.04)*8,
   48
 );

 pop();
}

function drawHome(){
 label(
   "SPACE DODGER",
   width/2,
   height*.12,
   min(42,width*.105),
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 label(
   "GALACTIC CAMPAIGN • V9.3",
   width/2,
   height*.175,
   12,
   "#9ab5c1",
   CENTER,
   CENTER,
   false
 );

 drawIndiaFlag(
   width-34,
   32,
   28,
   18
 );

 [
   ["PLAY",.29],
   ["SHIP ARCHIVE",.40],
   ["ABOUT",.51],
   ["SETTINGS",.62],
   ["ACHIEVEMENTS",.73]
 ].forEach(a=>
   menuButton(
     a[0],
     height*a[1]
   )
 );

 if(height>560)
   menuButton(
     "HELP",
     height*.84
   );
}

function menuButton(t,y){
 button(
   t,
   width/2,
   y,
   min(320,width*.82),
   52
 );
}

function drawIndiaFlag(x,y,w,h){
 push();
 resetMatrix();
 rectMode(CORNER);
 noStroke();

 fill(255,153,51);
 rect(
   x-w/2,
   y-h/2,
   w,
   h/3
 );

 fill(255);
 rect(
   x-w/2,
   y-h/6,
   w,
   h/3
 );

 fill(19,136,78);
 rect(
   x-w/2,
   y+h/6,
   w,
   h/3
 );

 stroke(35,70,145);
 strokeWeight(1);
 noFill();

 circle(
   x,
   y,
   w*.22
 );

 line(
   x-w*.11,
   y,
   x+w*.11,
   y
 );

 line(
   x,
   y-h*.11,
   x,
   y+h*.11
 );

 pop();
}

function drawLevels(){
 label(
   "SELECT LEVEL",
   width/2,
   42,
   27,
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 label(
   LEVEL_NAMES[unlockedLevel-1],
   width/2,
   78,
   12,
   "#ead75b"
 );

 const cols=4,
       gap=9,
       size=min(
         66,
         (width-48)/cols
       ),
       startY=140,
       total=
         cols*size+
         (cols-1)*gap,
       startX=
         width/2-
         total/2+
         size/2;

 for(
   let n=1;
   n<=TOTAL_LEVELS;
   n++
 ){
   const col=(n-1)%cols,
         row=floor((n-1)/cols),
         x=startX+
           col*(size+gap),
         y=startY+
           row*(size+15),
         open=n<=unlockedLevel,
         dragon=isDragonLevel(n);

   rectMode(CENTER);

   stroke(
     open?
       (dragon?
         "#d76b58":
         "#469ab7"):
       "#3b4045"
   );

   fill(
     open?
       (dragon?
         "#34191c":
         "#071e30"):
       "#11151a"
   );

   rect(
     x,
     y,
     size,
     size,
     10
   );

   label(
     open?
       String(n):
       "LOCK",
     x,
     y-4,
     open?17:9,
     open?
       "#eef6f8":
       "#777d81",
     CENTER,
     CENTER,
     true
   );

   if(open)
     label(
       dragon?
         "DRAGON":
         "LEVEL",
       x,
       y+19,
       7,
       dragon?
         "#ff9278":
         "#79aabd"
     );
 }

 homeButton();
}

function panelBox(
 x,
 y,
 w,
 h,
 title,
 bodyLines,
 titleColor="#79d8ff"
){
 rectMode(CENTER);
 stroke("#27677f");
 strokeWeight(1.2);
 fill(3,14,25,225);

 rect(
   x,
   y,
   w,
   h,
   14
 );

 label(
   title,
   x,
   y-h*.34,
   13,
   titleColor,
   CENTER,
   CENTER,
   true
 );

 if(bodyLines==null){
 }else if(Array.isArray(bodyLines)){
   bodyLines.forEach(
     (t,i)=>
       label(
         t,
         x,
         y-h*.05+i*17,
         12,
         "#dce6ea",
         CENTER,
         CENTER,
         false
       )
   );
 }else{
   label(
     bodyLines,
     x,
     y+4,
     15,
     "#edf7ff",
     CENTER,
     CENTER,
     false
   );
 }
}

function drawAbout(){
 drawIndiaFlag(
   width-34,
   32,
   28,
   18
 );

 label(
   "ABOUT",
   width/2,
   42,
   27,
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 panelBox(
   width/2,
   height*.27,
   min(340,width*.86),
   105,
   "DEVELOPED BY",
   ["Aazad S Rana"],
   "#ead75b"
 );

 panelBox(
   width/2,
   height*.51,
   min(340,width*.86),
   185,
   "ABOUT THE GAME",
   [
     "Defend the galaxy from waves of alien invaders.",
     "Survive increasingly dangerous battles.",
     "Defeat unique Dragon bosses and earn medals.",
     "Master ships, weapons and power boosters.",
     "Clear all 30 levels and become the",
     "ultimate Space Dodger."
   ],
   "#79d8ff"
 );

 homeButton();
}

function powerInfoIcon(
 x,
 y,
 sym,
 col
){
 noStroke();
 fill(col);
 circle(x,y,34);

 fill("#07131f");

 label(
   sym,
   x,
   y,
   12,
   "#fff",
   CENTER,
   CENTER,
   true
 );
}

function drawHelp(){
 label(
   "HELP • ARSENAL",
   width/2,
   42,
   25,
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 const w=min(350,width*.88),
       x=width/2;

 // Weapons: short, wrapped descriptions keep everything inside the card.
 panelBox(
   x,
   112,
   w,
   78,
   "PLASMA CANNON",
   null,
   "#4de8ff"
 );

 powerInfoIcon(
   x-w*.38,
   112,
   "P",
   "#4de8ff"
 );

 label(
   "Basic weapon",
   x+5,
   104,
   10.5,
   "#dce6ea",
   LEFT,
   CENTER,
   false
 );

 label(
   "Reliable damage",
   x+5,
   121,
   10.5,
   "#dce6ea",
   LEFT,
   CENTER,
   false
 );

 panelBox(
   x,
   195,
   w,
   78,
   "VOID BEAM",
   null,
   "#d889ff"
 );

 powerInfoIcon(
   x-w*.38,
   195,
   "V",
   "#d889ff"
 );

 label(
   "Heavy beam",
   x+5,
   187,
   10.5,
   "#dce6ea",
   LEFT,
   CENTER,
   false
 );

 label(
   "Stronger hits",
   x+5,
   204,
   10.5,
   "#dce6ea",
   LEFT,
   CENTER,
   false
 );

 panelBox(
   x,
   278,
   w,
   78,
   "DRAGON SLAYER",
   null,
   "#ff6a43"
 );

 powerInfoIcon(
   x-w*.38,
   278,
   "D",
   "#ff6a43"
 );

 label(
   "Special weapon",
   x+5,
   270,
   10.5,
   "#dce6ea",
   LEFT,
   CENTER,
   false
 );

 label(
   "Huge Dragon damage",
   x+5,
   287,
   10.5,
   "#dce6ea",
   LEFT,
   CENTER,
   false
 );

 const boosterTop=430,
       boosterH=235;

 panelBox(
   x,
   boosterTop,
   w,
   boosterH,
   "POWER BOOSTERS",
   null,
   "#ead34c"
 );

 const infos=[
   [
     "×3",
     "#ffe600",
     "TRIPLE SHOT",
     "Fires three shots at once."
   ],
   [
     "SH",
     "#00cfff",
     "SHIELD",
     "Blocks incoming hits."
   ],
   [
     "N",
     "#fff",
     "NOVA",
     "Clears nearby aliens instantly."
   ],
   [
     "B",
     "#ff3455",
     "BERSERKER",
     "Boosts damage + fire rate."
   ],
   [
     "❄",
     "#9eefff",
     "CRYO",
     "Slows enemies briefly."
   ]
 ];

 const rowYs=[
   382,
   416,
   450,
   484,
   518
 ];

 infos.forEach(
   (a,i)=>{
     powerInfoIcon(
       x-w*.37,
       rowYs[i],
       a[0],
       a[1]
     );

     label(
       a[2],
       x-w*.25,
       rowYs[i]-6,
       10.5,
       a[1],
       LEFT,
       CENTER,
       true
     );

     label(
       a[3],
       x-w*.25,
       rowYs[i]+10,
       9.5,
       "#dce6ea",
       LEFT,
       CENTER,
       false
     );
   }
 );

 label(
   "FIRE + joystick can be used together.",
   x,
   560,
   9.5,
   "#9fb2ba",
   CENTER,
   CENTER,
   false
 );

 homeButton();
}

function drawSettings(){
 drawIndiaFlag(
   width-34,
   32,
   28,
   18
 );

 label(
   "SETTINGS",
   width/2,
   42,
   27,
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 const w=min(350,width*.88),
       x=width/2;

 // Keep controls compact: this screen is for toggles, not a full tutorial.
 panelBox(
   x,
   150,
   w,
   82,
   "CONTROLS",
   [
     "MOVE: joystick  •  FIRE: hold  •  POWER: tap",
     "PAUSE / HOME: top controls"
   ],
   "#79d8ff"
 );

 button(
   soundOn?
     "SOUND: ON":
     "SOUND: OFF",
   x,
   270,
   w*.72,
   46
 );

 button(
   musicOn?
     "MUSIC: ON":
     "MUSIC: OFF",
   x,
   330,
   w*.72,
   46
 );

 panelBox(
   x,
   430,
   w,
   82,
   "TOUCH LAYOUT",
   [
     swappedControls?
       "FIRE: LEFT  •  MOVE: RIGHT":
       "MOVE: LEFT  •  FIRE: RIGHT"
   ],
   "#79d8ff"
 );

 button(
   swappedControls?
     "SWAP TO DEFAULT":
     "SWAP CONTROLS",
   x,
   500,
   w*.72,
   46
 );

 panelBox(
   x,
   590,
   w,
   68,
   "AUDIO",
   [
     "Music: original liminal arcade ambience"
   ],
   "#ead34c"
 );

 homeButton();
}

function drawAchievements(){
 drawIndiaFlag(
   width-34,
   32,
   28,
   18
 );

 label(
   "ACHIEVEMENTS",
   width/2,
   42,
   27,
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 const w=min(350,width*.88),
       x=width/2;

 label(
   "DRAGON MEDALS",
   x,
   91,
   13,
   "#79d8ff",
   CENTER,
   CENTER,
   true
 );

 // Backward-compatible achievement recovery: if an older save unlocked past a
 // Dragon level but did not store highestDragon, reconstruct the earned medals.
 let inferred=0;

 for(const n of DRAGON_LEVELS)
   if(unlockedLevel>n)
     inferred=n;

 if(inferred>highestDragon){
   highestDragon=inferred;

   const bd=DRAGON_DATA[inferred];

   if(bd){
     dragonBadge=bd.badge;
     dragonTitle=bd.title;
   }

   saveGame();
 }

 const unlocked=
   DRAGON_LEVELS.filter(
     n=>n<=highestDragon
   );

 const boxTop=108;
 const cols=3;
 const gap=7;
 const cardW=
   (w-28-(cols-1)*gap)/cols;
 const rowH=78;

 const rows=
   unlocked.length?
     Math.ceil(unlocked.length/cols):
     1;

 const boxH=
   unlocked.length?
     Math.max(
       150,
       rows*rowH+34
     ):
     120;

 rectMode(CENTER);
 stroke("#27677f");
 strokeWeight(1.2);
 fill(3,14,25,230);

 rect(
   x,
   boxTop+boxH/2,
   w,
   boxH,
   14
 );

 if(!unlocked.length){
   label(
     "No achievements yet",
     x,
     boxTop+boxH/2,
     15,
     "#9eabb1",
     CENTER,
     CENTER,
     false
   );
 }else{
   unlocked.forEach(
     (n,i)=>{
       const col=i%cols,
             row=floor(i/cols);

       const cx=
         x-w/2+
         14+
         cardW/2+
         col*(cardW+gap);

       const cy=
         boxTop+
         24+
         row*rowH+
         rowH/2;

       rectMode(CENTER);
       stroke("#1e5368");
       strokeWeight(1);
       fill(5,20,32,190);

       rect(
         cx,
         cy,
         cardW,
         rowH-8,
         9
       );

       drawAchievementMedal(
         cx-cardW*.30,
         cy-2,
         DRAGON_DATA[n].color,
         n
       );

       const tx=
         cx-cardW*.03;

       label(
         "LEVEL "+n,
         tx,
         cy-18,
         7.5,
         "#7f9aa5",
         LEFT,
         CENTER,
         true
       );

       const parts=
         DRAGON_DATA[n].badge.split(" ");

       if(parts.length>1){
         label(
           parts[0],
           tx,
           cy-2,
           7.6,
           "#edf7ff",
           LEFT,
           CENTER,
           true
         );

         label(
           parts.slice(1).join(" "),
           tx,
           cy+12,
           7.6,
           "#edf7ff",
           LEFT,
           CENTER,
           true
         );
       }else{
         label(
           DRAGON_DATA[n].badge,
           tx,
           cy+5,
           7.6,
           "#edf7ff",
           LEFT,
           CENTER,
           true
         );
       }
     }
   );
 }

 // Rating is deliberately part of the same screen, below the medals.
 const ratingTitleY=
   boxTop+boxH+30;

 label(
   "RATE YOUR EXPERIENCE",
   x,
   ratingTitleY,
   12.5,
   "#79d8ff",
   CENTER,
   CENTER,
   true
 );

 const starY=
   ratingTitleY+38;

 const ratingGap=
   min(
     42,
     width*.11
   );

 const total=
   ratingGap*4;

 for(let i=1;i<=5;i++)
   label(
     "★",
     x-total/2+
       (i-1)*ratingGap,
     starY,
     28,
     i<=rating?
       "#ead34c":
       "#4b555b",
     CENTER,
     CENTER,
     true
   );

 label(
   rating?
     rating+" / 5":
     "SELECT A RATING",
   x,
   starY+27,
   10.5,
   "#dce6ea",
   CENTER,
   CENTER,
   false
 );

 button(
   "SUBMIT RATING",
   x,
   starY+67,
   min(250,width*.70),
   44
 );

 homeButton();
}

function drawAchievementMedal(x,y,col,n){
 push();
 resetMatrix();
 translate(x,y);

 noStroke();
 fill(col);
 rectMode(CENTER);

 rect(
   -5,
   15,
   6,
   18,
   2
 );

 rect(
   5,
   15,
   6,
   18,
   2
 );

 fill(
   255,
   255,
   255,
   145
 );

 rect(
   5,
   15,
   3,
   16,
   1
 );

 stroke(col);
 strokeWeight(1.3);
 fill(12,21,30);

 circle(
   0,
   -1,
   34
 );

 noStroke();
 fill(col);

 circle(
   0,
   -1,
   28
 );

 fill(10,18,27);

 circle(
   0,
   -1,
   21
 );

 label(
   String(n),
   0,
   -1,
   9.5,
   "#fff",
   CENTER,
   CENTER,
   true
 );

 pop();
}

function drawRating(){
 drawAchievements();
}

function drawRatingThanks(){
 updateCelebration();

 label(
   "THANK YOU!",
   width/2,
   height*.32,
   31,
   "#ffe65a",
   CENTER,
   CENTER,
   true
 );

 label(
   "Your rating has been submitted.",
   width/2,
   height*.42,
   12,
   "#edf7ff",
   CENTER,
   CENTER,
   false
 );

 label(
   "★★★★★",
   width/2,
   height*.52,
   26,
   "#ead34c",
   CENTER,
   CENTER,
   true
 );

 homeButton();
}

function overlay(){
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

function drawPaused(){
 drawStaticGame();
 overlay();

 label(
   "PAUSED",
   width/2,
   height*.30,
   38,
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 button(
   "RESUME",
   width/2,
   height*.53,
   270,
   52
 );

 button(
   "HOME",
   width/2,
   height*.64,
   240,
   52
 );
}

function drawGameOver(){
 overlay();

 label(
   "MISSION LOST",
   width/2,
   height*.28,
   36,
   "#ef5963",
   CENTER,
   CENTER,
   true
 );

 label(
   "LEVEL "+level,
   width/2,
   height*.38,
   17,
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 label(
   LEVEL_NAMES[level-1],
   width/2,
   height*.43,
   14,
   "#d9c65a"
 );

 label(
   "SCORE "+score,
   width/2,
   height*.48,
   13,
   "#9eabb1"
 );

 label(
   "CAMPAIGN LIVES "+campaignLives,
   width/2,
   height*.53,
   11,
   "#789aa7"
 );

 button(
   "RETRY LEVEL",
   width/2,
   height*.61,
   280,
   52
 );

 button(
   "HOME",
   width/2,
   height*.72,
   240,
   52
 );
}

function drawLevelUp(){
 overlay();
 updateCelebration();

 const done=
   level===TOTAL_LEVELS;

 label(
   done?
     "GALACTIC ASCENSION!":
     "LEVEL "+level+" CLEARED!",
   width/2,
   height*.27,
   min(30,width*.075),
   "#ffe65a",
   CENTER,
   CENTER,
   true
 );

 label(
   LEVEL_NAMES[level-1],
   width/2,
   height*.35,
   16,
   "#fff",
   CENTER,
   CENTER,
   true
 );

 label(
   "SCORE "+score,
   width/2,
   height*.43,
   17,
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 label(
   OBJECTIVES[level-1].name+
   " COMPLETE",
   width/2,
   height*.50,
   12,
   "#68ff9b",
   CENTER,
   CENTER,
   true
 );

 if(isDragonLevel(level)){
   const bd=
     DRAGON_DATA[level];

   label(
     "DRAGON DEFEATED",
     width/2,
     height*.56,
     13,
     bd.color,
     CENTER,
     CENTER,
     true
   );

   label(
     "🏅 "+bd.badge,
     width/2,
     height*.61,
     14,
     bd.color,
     CENTER,
     CENTER,
     true
   );

   label(
     bd.reward,
     width/2,
     height*.65,
     10,
     "#d6e0e5",
     CENTER,
     CENTER,
     true
   );

   if(level===TOTAL_LEVELS){
     label(
       "30 WORLDS CONQUERED",
       width/2,
       height*.70,
       15,
       "#fff",
       CENTER,
       CENTER,
       true
     );

     label(
       "KARMIX GALACTIC CHAMPION",
       width/2,
       height*.75,
       12,
       "#ffe15b",
       CENTER,
       CENTER,
       true
     )
   }
 }

 button(
   "PLAY AGAIN",
   width/2,
   height*(done?.84:.72),
   260,
   52
 );

 button(
   done?
     "BACK TO HOME":
     "NEXT LEVEL  >",
   width/2,
   height*(done?.92:.82),
   260,
   52
 );
}

function drawStaticGame(){
 hardResetTransform();

 enemies.forEach(
   e=>e.draw()
 );

 bullets.forEach(
   b=>b.draw()
 );

 drops.forEach(
   d=>d.draw()
 );

 enemyShots.forEach(
   s=>s.draw()
 );

 weaponDrops.forEach(
   w=>w.draw()
 );

 if(boss){
   boss.draw();
   drawBossBar();
 }

 hardResetTransform();

 shipPlayer.draw();
 drawWeaponAttachment();

 hardResetTransform();

 drawHUD();
 drawWeaponHUD();
 drawControls();
}

let archiveScroll=0,
    archiveTarget=0,
    archiveTouch=false,
    archiveDrag=false,
    archiveBar=false,
    archiveStartY=0,
    archiveLastY=0;

function archiveGeometry(){
 const top=105,
       bottom=height-150,
       vh=bottom-top,
       cardH=135,
       gap=14,
       content=
         25+
         SHIPS.length*cardH+
         (SHIPS.length-1)*gap+
         55;

 return {
   top,
   bottom,
   vh,
   cardH,
   gap,
   content,
   max:max(
     0,
     content-vh
   )
 };
}

function drawArchive(){
 const g=
   archiveGeometry();

 archiveTarget=
   constrain(
     archiveTarget,
     0,
     g.max
   );

 archiveScroll=
   lerp(
     archiveScroll,
     archiveTarget,
     .24
   );

 label(
   "SHIP ARCHIVE",
   width/2,
   35,
   25,
   "#edf7ff",
   CENTER,
   CENTER,
   true
 );

 label(
   "SWIPE TO BROWSE",
   width/2,
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

 for(
   let i=0;
   i<SHIPS.length;
   i++
 ){
   const y=
     g.top+
     25+
     g.cardH/2+
     i*(g.cardH+g.gap)-
     archiveScroll;

   drawShipCard(
     SHIPS[i],
     i,
     y,
     min(350,width*.88),
     g.cardH
   );
 }

 drawingContext.restore();
 pop();

 drawScrollbar(g);
 homeButton();
}

function drawShipCard(
 s,
 i,
 y,
 w,
 h
){
 const open=
   unlockedLevel>=s.unlock;

 const sel=
   selectedShip===i;

 rectMode(CENTER);

 stroke(
   sel?
     "#ead34c":
     open?
       "#468fa9":
       "#44484c"
 );

 strokeWeight(
   sel?
     2.5:
     1.3
 );

 fill(
   open?
     "#061421":
     "#11151a"
 );

 rect(
   width/2,
   y,
   w,
   h,
   14
 );

 drawMiniShip(
   width/2-w*.31,
   y,
   i,
   open?.75:.6
 );

 if(open){
   label(
     s.name,
     width/2-w*.05,
     y-35,
     13,
     "#eef7fa",
     LEFT,
     CENTER,
     true
   );

   label(
     s.power,
     width/2-w*.05,
     y-9,
     10,
     "#e4cc55",
     LEFT,
     CENTER,
     true
   );

   label(
     sel?
       "SELECTED":
       "TAP TO SELECT",
     width/2-w*.05,
     y+30,
     9,
     sel?
       "#ead34c":
       "#78b1c6",
     LEFT,
     CENTER,
     true
   );
 }else{
   label(
     "LOCKED • LEVEL "+s.unlock,
     width/2,
     y+45,
     10,
     "#858b8f",
     CENTER,
     CENTER,
     true
   );
 }
}

function drawMiniShip(x,y,i,sc){
 const s=SHIPS[i],
       q=i%10;

 push();

 translate(x,y);
 scale(sc);

 noStroke();
 fill(s.edge+"18");

 ellipse(
   0,
   4,
   112,
   72
 );

 stroke(s.edge);
 strokeWeight(2.4);
 fill(s.body);

 if(q===0){
   beginShape();
   vertex(0,-46);
   vertex(-10,-22);
   vertex(-48,5);
   vertex(-25,11);
   vertex(-12,30);
   vertex(0,20);
   vertex(12,30);
   vertex(25,11);
   vertex(48,5);
   vertex(10,-22);
   endShape(CLOSE);

   line(-24,4,-7,12);
   line(24,4,7,12);
 }
 else if(q===1){
   beginShape();
   vertex(0,-48);
   vertex(13,-18);
   vertex(47,-25);
   vertex(30,2);
   vertex(43,25);
   vertex(12,17);
   vertex(0,35);
   vertex(-12,17);
   vertex(-43,25);
   vertex(-30,2);
   vertex(-47,-25);
   vertex(-13,-18);
   endShape(CLOSE);
 }
 else if(q===2){
   beginShape();
   vertex(0,-48);
   vertex(21,-12);
   vertex(51,0);
   vertex(25,9);
   vertex(16,35);
   vertex(0,20);
   vertex(-16,35);
   vertex(-25,9);
   vertex(-51,0);
   vertex(-21,-12);
   endShape(CLOSE);

   line(-45,0,-20,3);
   line(45,0,20,3);
 }
 else if(q===3){
   rectMode(CENTER);

   rect(
     0,
     2,
     50,
     55,
     12
   );

   triangle(
     -25,-12,
     -48,25,
     -20,16
   );

   triangle(
     25,-12,
     48,25,
     20,16
   );

   line(
     -20,-17,
     20,-17
   );
 }
 else if(q===4){
   beginShape();
   vertex(0,-50);
   vertex(16,-23);
   vertex(53,-8);
   vertex(25,7);
   vertex(32,35);
   vertex(0,20);
   vertex(-32,35);
   vertex(-25,7);
   vertex(-53,-8);
   vertex(-16,-23);
   endShape(CLOSE);
 }
 else if(q===5){
   ellipse(
     0,
     2,
     64,
     45
   );

   triangle(
     -22,4,
     -55,29,
     -22,20
   );

   triangle(
     22,4,
     55,29,
     22,20
   );

   noFill();
   stroke(s.edge);

   ellipse(
     0,
     2,
     78,
     28
   );
 }
 else if(q===6){
   beginShape();
   vertex(-48,-22);
   vertex(-8,-12);
   vertex(0,-38);
   vertex(8,-12);
   vertex(48,-22);
   vertex(28,27);
   vertex(8,17);
   vertex(0,38);
   vertex(-8,17);
   vertex(-28,27);
   endShape(CLOSE);
 }
 else if(q===7){
   beginShape();
   vertex(0,-52);
   vertex(10,-19);
   vertex(38,-34);
   vertex(25,-5);
   vertex(50,16);
   vertex(17,12);
   vertex(0,40);
   vertex(-17,12);
   vertex(-50,16);
   vertex(-25,-5);
   vertex(-38,-34);
   vertex(-10,-19);
   endShape(CLOSE);
 }
 else if(q===8){
   ellipse(
     0,
     0,
     54,
     54
   );

   rectMode(CENTER);

   rect(
     -38,
     0,
     23,
     12,
     5
   );

   rect(
     38,
     0,
     23,
     12,
     5
   );

   line(
     -26,-18,
     26,-18
   );

   line(
     -26,18,
     26,18
   );
 }
 else{
   beginShape();
   vertex(0,-48);
   vertex(20,-24);
   vertex(54,-10);
   vertex(28,8);
   vertex(18,38);
   vertex(0,22);
   vertex(-18,38);
   vertex(-28,8);
   vertex(-54,-10);
   vertex(-20,-24);
   endShape(CLOSE);

   line(-32,-8,-12,0);
   line(32,-8,12,0);
 }

 noStroke();

 fill(s.edge+"44");
 ellipse(
   0,
   -4,
   24,
   34
 );

 fill(s.core);
 ellipse(
   0,
   -5,
   13,
   22
 );

 fill(s.edge);
 circle(-20,12,5);
 circle(20,12,5);

 fill("#ffffff55");
 ellipse(-10,28,6,12);
 ellipse(10,28,6,12);

 if(i>=5){
   noFill();
   stroke(s.edge);
   strokeWeight(1.2);

   ellipse(
     0,
     2,
     76+
     sin(frameCount*.05+i)*8,
     34
   );

   ellipse(
     0,
     2,
     58,
     52+
     cos(frameCount*.04+i)*5
   );
 }

 pop();
}

function drawScrollbar(g){
 if(!g.max)return;

 const th=
   max(
     55,
     g.vh*(g.vh/g.content)
   );

 const travel=
   g.vh-th;

 const y=
   g.top+
   th/2+
   travel*
   (archiveScroll/g.max);

 noStroke();

 fill(
   255,
   255,
   255,
   25
 );

 rect(
   width-10,
   g.top+g.vh/2,
   4,
   g.vh,
   2
 );

 fill(
   55,
   165,
   200,
   225
 );

 rect(
   width-10,
   y,
   11,
   th,
   5
 );
}

function archivePointerDown(x,y){
 if(y>height-94){
   state="HOME";
   return
 }

 archiveTouch=true;
 archiveDrag=false;
 archiveBar=x>width-45;
 archiveStartY=y;
 archiveLastY=y;

 if(archiveBar)
   setArchiveFromY(y);
}

function archivePointerMove(x,y){
 if(!archiveTouch)return;

 if(archiveBar){
   setArchiveFromY(y);
   return
 }

 if(abs(y-archiveStartY)>8)
   archiveDrag=true;

 if(archiveDrag)
   archiveTarget=
     constrain(
       archiveTarget+
       (archiveLastY-y)*1.2,
       0,
       archiveGeometry().max
     );

 archiveLastY=y;
}

function archivePointerUp(x,y){
 if(!archiveTouch)return;

 const tap=
   !archiveDrag&&
   !archiveBar&&
   abs(y-archiveStartY)<15;

 archiveTouch=false;
 archiveDrag=false;
 archiveBar=false;

 if(!tap)return;

 const g=
   archiveGeometry();

 for(
   let i=0;
   i<SHIPS.length;
   i++
 ){
   const cy=
     g.top+
     25+
     g.cardH/2+
     i*(g.cardH+g.gap)-
     archiveScroll;

   if(
     sdInside(
       x,
       y,
       width/2,
       cy,
       min(360,width*.9),
       g.cardH+8
     )
   ){
     if(
       unlockedLevel>=
       SHIPS[i].unlock
     ){
       selectedShip=i;
       saveGame();
     }

     return
   }
 }
}

function setArchiveFromY(y){
 const g=
   archiveGeometry();

 if(!g.max)return;

 const th=
   max(
     55,
     g.vh*g.vh/g.content
   );

 const travel=
   g.vh-th;

 const center=
   constrain(
     y,
     g.top+th/2,
     g.top+g.vh-th/2
   );

 archiveTarget=
   (
     center-
     (g.top+th/2)
   )/travel*g.max;

 archiveScroll=
   archiveTarget;
}

function homeButton(){
 button(
   "HOME",
   width/2,
   height-94,
   min(190,width*.55),
   48
 );
}

function button(t,x,y,w,h){
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
   t,
   x,
   y,
   16,
   "#edf7ff",
   CENTER,
   CENTER,
   false
 );
}

function handleTap(x,y){
 if(state==="INTRO"){
   if(
     sdInside(
       x,
       y,
       width/2,
       height*.86,
       min(250,width*.62),
       60
     )
   ){
     state="HOME";
     clearPointers();
     initAudio();
     return
   }

   return
 }

 if(state==="HOME"){
   stopMusic();

   const ys=[
     .29,
     .40,
     .51,
     .62,
     .73
   ];

   for(
     let i=0;
     i<ys.length;
     i++
   ){
     if(
       sdInside(
         x,
         y,
         width/2,
         height*ys[i],
         min(340,width*.86),
         70
       )
     ){
       state=[
         "LEVELS",
         "ARCHIVE",
         "ABOUT",
         "SETTINGS",
         "ACHIEVEMENTS"
       ][i];

       if(i===1){
         archiveScroll=0;
         archiveTarget=0;
       }

       if(i===4)
         rating=0;

       return
     }
   }

   if(
     height>560&&
     sdInside(
       x,
       y,
       width/2,
       height*.84,
       min(340,width*.86),
       70
     )
   ){
     state="HELP";
   }

   return
 }

 if(state==="LEVELS"){
   if(
     sdInside(
       x,
       y,
       width/2,
       height-94,
       240,
       70
     )
   ){
     state="HOME";
     return
   }

   const cols=4,
         gap=9,
         size=min(
           66,
           (width-48)/cols
         ),
         startY=140,
         total=
           cols*size+
           (cols-1)*gap,
         startX=
           width/2-
           total/2+
           size/2;

   for(
     let n=1;
     n<=TOTAL_LEVELS;
     n++
   ){
     const col=(n-1)%cols,
           row=floor((n-1)/cols),
           bx=
             startX+
             col*(size+gap),
           by=
             startY+
             row*(size+15);

     if(
       sdInside(
         x,
         y,
         bx,
         by,
         size+12,
         size+12
       )
     ){
       if(n<=unlockedLevel)
         startLevel(n);

       return
     }
   }

   return
 }

 if(
   state==="ABOUT"||
   state==="HELP"
 ){
   if(
     sdInside(
       x,
       y,
       width/2,
       height-94,
       230,
       70
     )
   )
     state="HOME";

   return
 }

 if(state==="SETTINGS"){
   const w=min(350,width*.88),
         cx=width/2;

   if(
     sdInside(
       x,
       y,
       cx,
       270,
       w*.72,
       50
     )
   ){
     soundOn=!soundOn;
     saveGame();

     if(soundOn){
       initAudio();
       playPowerSound();
     }

     return
   }

   if(
     sdInside(
       x,
       y,
       cx,
       330,
       w*.72,
       50
     )
   ){
     musicOn=!musicOn;
     saveGame();

     if(
       musicOn&&
       state==="SETTINGS"
     )
       initAudio();
     else if(!musicOn)
       stopMusic();

     return
   }

   if(
     sdInside(
       x,
       y,
       cx,
       500,
       w*.72,
       50
     )
   ){
     swappedControls=!swappedControls;
     updateLayout();
     saveGame();
     return
   }

   if(
     sdInside(
       x,
       y,
       cx,
       height-94,
       230,
       70
     )
   ){
     state="HOME";
     stopMusic();
     return
   }

   return
 }

 if(
   state==="ACHIEVEMENTS"||
   state==="RATING"
 ){
   const w=min(350,width*.88),
         boxTop=108,
         cols=3,
         gapCard=7,
         cardW=
           (w-28-
            (cols-1)*gapCard)/
           cols;

   const earned=
     DRAGON_LEVELS.filter(
       n=>n<=highestDragon
     );

   const rows=
     earned.length?
       Math.ceil(
         earned.length/cols
       ):
       1;

   const boxH=
     earned.length?
       Math.max(
         150,
         rows*78+34
       ):
       120;

   const ratingTitleY=
     boxTop+boxH+30;

   const starY=
     ratingTitleY+38;

   const starGap=
     min(42,width*.11);

   const starTotal=
     starGap*4;

   for(
     let i=1;
     i<=5;
     i++
   ){
     const sx=
       width/2-
       starTotal/2+
       (i-1)*starGap;

     if(
       dist(
         x,
         y,
         sx,
         starY
       )<25
     ){
       rating=i;
       return
     }
   }

   if(
     sdInside(
       x,
       y,
       width/2,
       starY+67,
       min(250,width*.70),
       50
     )
   ){
     if(rating<1)return;

     try{
       localStorage.setItem(
         "spaceDodgerRating",
         String(rating)
       )
     }catch(e){}

     createCelebration();
     state="RATING_THANKS";
     stopMusic();
     return
   }

   if(
     sdInside(
       x,
       y,
       width/2,
       height-94,
       230,
       70
     )
   ){
     state="HOME";
     stopMusic();
   }

   return
 }

 if(state==="RATING_THANKS"){
   if(
     sdInside(
       x,
       y,
       width/2,
       height-94,
       230,
       70
     )
   ){
     celebration=[];
     state="HOME";
   }

   return
 }

 if(state==="PAUSED"){
   if(
     sdInside(
       x,
       y,
       width/2,
       height*.53,
       310,
       75
     )
   ){
     state="PLAYING";

     if(musicOn)
       startMusic();

     return
   }

   if(
     sdInside(
       x,
       y,
       width/2,
       height*.64,
       280,
       75
     )
   ){
     state="HOME";
     stopMusic();
     return
   }

   return
 }

 if(state==="GAMEOVER"){
   if(
     sdInside(
       x,
       y,
       width/2,
       height*.61,
       310,
       75
     )
   ){
     startLevel(level);
     return
   }

   if(
     sdInside(
       x,
       y,
       width/2,
       height*.72,
       280,
       75
     )
   ){
     state="HOME";
     return
   }

   return
 }

 if(state==="LEVELUP"){
   const done=
     level===TOTAL_LEVELS;

   const retryY=
     height*(done?.84:.72);

   const nextY=
     height*(done?.92:.82);

   if(
     sdInside(
       x,
       y,
       width/2,
       retryY,
       300,
       80
     )
   ){
     startLevel(level);
     return
   }

   if(
     sdInside(
       x,
       y,
       width/2,
       nextY,
       300,
       80
     )
   ){
     state=
       done?
         "HOME":
         (
           startLevel(level+1),
           state
         );

     return
   }
 }
}
/*======================================================
   PART 4
   POINTER / TOUCH / KEYBOARD / LAYOUT / STARFIELD / AUDIO
================================================================ */

function installPointerEvents(){
  const c=document.querySelector("canvas");
  if(!c)return;

  c.addEventListener(
    "pointerdown",
    e=>{
      e.preventDefault();

      const p=canvasPoint(e);

      if(state==="ARCHIVE"){
        archivePointerDown(p.x,p.y);
        return;
      }

      if(state!=="PLAYING"){
        handleTap(p.x,p.y);
        return;
      }

      if(
        sdInside(
          p.x,
          p.y,
          pauseBtn.x,
          pauseBtn.y,
          55,
          55
        )
      ){
        togglePause();
        return;
      }

      if(
        sdInside(
          p.x,
          p.y,
          homeBtn.x,
          homeBtn.y,
          55,
          55
        )
      ){
        goHome();
        return;
      }

      const fireSide=
        swappedControls?
          p.x<width*.32:
          p.x>width*.68;

      const powerSide=
        p.x>width*.38&&
        p.x<width*.62&&
        p.y>height-220;

      if(fireSide&&
         dist(
           p.x,
           p.y,
           fireBtn.x,
           fireBtn.y
         )<fireBtn.r+25){

        firePointerId=e.pointerId;
        fireHeld=true;
        shoot();
        return;
      }

      if(powerSide&&
         dist(
           p.x,
           p.y,
           powerBtn.x,
           powerBtn.y
         )<powerBtn.r+25){

        useSpecial();
        return;
      }

      const moveSide=
        swappedControls?
          p.x>width*.68:
          p.x<width*.32;

      if(
        moveSide&&
        dist(
          p.x,
          p.y,
          joy.x,
          joy.y
        )<joy.r+45
      ){
        movePointerId=e.pointerId;
        updateJoystick(
          p.x,
          p.y
        );
      }
    },
    {passive:false}
  );

  c.addEventListener(
    "pointermove",
    e=>{
      e.preventDefault();

      const p=canvasPoint(e);

      if(state==="ARCHIVE"){
        archivePointerMove(
          p.x,
          p.y
        );
        return;
      }

      if(
        state==="PLAYING"&&
        e.pointerId===movePointerId
      ){
        updateJoystick(
          p.x,
          p.y
        );
      }
    },
    {passive:false}
  );

  c.addEventListener(
    "pointerup",
    e=>{
      e.preventDefault();

      const p=canvasPoint(e);

      if(state==="ARCHIVE"){
        archivePointerUp(
          p.x,
          p.y
        );
        return;
      }

      if(e.pointerId===movePointerId){
        movePointerId=null;
        joyStrength=0;
        joyAngle=0;
        joy.knobX=joy.x;
        joy.knobY=joy.y;
      }

      if(e.pointerId===firePointerId){
        firePointerId=null;
        fireHeld=false;
      }
    },
    {passive:false}
  );

  c.addEventListener(
    "pointercancel",
    e=>{
      if(e.pointerId===movePointerId){
        movePointerId=null;
        joyStrength=0;
        joyAngle=0;
        joy.knobX=joy.x;
        joy.knobY=joy.y;
      }

      if(e.pointerId===firePointerId){
        firePointerId=null;
        fireHeld=false;
      }
    },
    {passive:false}
  );
}

function canvasPoint(e){
  const r=
    document.querySelector("canvas")
      .getBoundingClientRect();

  return {
    x:(e.clientX-r.left)*
      (width/r.width),

    y:(e.clientY-r.top)*
      (height/r.height)
  };
}

function updateJoystick(x,y){
  const dx=x-joy.x;
  const dy=y-joy.y;
  const d=sqrt(dx*dx+dy*dy);

  if(d<1){
    joyStrength=0;
    joyAngle=0;
    joy.knobX=joy.x;
    joy.knobY=joy.y;
    return;
  }

  joyAngle=atan2(dy,dx);
  joyStrength=constrain(
    d/joy.r,
    0,
    1
  );

  const rr=
    min(
      d,
      joy.r
    );

  joy.knobX=
    joy.x+
    cos(joyAngle)*rr;

  joy.knobY=
    joy.y+
    sin(joyAngle)*rr;
}

function updateJoystickMovement(){
  if(
    state!=="PLAYING"||
    movePointerId===null
  )
    return;

  const sp=
    playerSpeed()*
    joyStrength;

  shipPlayer.vx+=
    cos(joyAngle)*
    sp*.20;

  shipPlayer.vy+=
    sin(joyAngle)*
    sp*.20;

  const maxV=
    playerSpeed()*
    1.15;

  shipPlayer.vx=
    constrain(
      shipPlayer.vx,
      -maxV,
      maxV
    );

  shipPlayer.vy=
    constrain(
      shipPlayer.vy,
      -maxV,
      maxV
    );

  if(
    joyStrength>.12
  )
    shipPlayer.angle=
      lerpAngle(
        shipPlayer.angle,
        joyAngle,
        .14
      );
}

function updateKeyboardMovement(){
  if(state!=="PLAYING")return;

  let dx=0;
  let dy=0;

  if(
    keyIsDown(LEFT_ARROW)||
    keyIsDown(65)
  )
    dx--;

  if(
    keyIsDown(RIGHT_ARROW)||
    keyIsDown(68)
  )
    dx++;

  if(
    keyIsDown(UP_ARROW)||
    keyIsDown(87)
  )
    dy--;

  if(
    keyIsDown(DOWN_ARROW)||
    keyIsDown(83)
  )
    dy++;

  if(dx===0&&dy===0)return;

  const d=sqrt(
    dx*dx+
    dy*dy
  );

  dx/=d;
  dy/=d;

  const sp=
    playerSpeed();

  shipPlayer.vx+=
    dx*sp*.18;

  shipPlayer.vy+=
    dy*sp*.18;

  shipPlayer.vx=
    constrain(
      shipPlayer.vx,
      -sp,
      sp
    );

  shipPlayer.vy=
    constrain(
      shipPlayer.vy,
      -sp,
      sp
    );

  shipPlayer.angle=
    lerpAngle(
      shipPlayer.angle,
      atan2(dy,dx),
      .12
    );
}

function keyPressed(){
  if(
    key===" "||
    keyCode===32
  ){
    if(state==="PLAYING")
      shoot();

    return false;
  }

  if(
    key==="p"||
    key==="P"
  ){
    if(
      state==="PLAYING"||
      state==="PAUSED"
    )
      togglePause();

    return false;
  }

  if(
    key==="q"||
    key==="Q"
  ){
    if(state==="PLAYING")
      useSpecial();

    return false;
  }

  if(
    key==="Escape"
  ){
    if(state==="PLAYING"||
       state==="PAUSED")
      togglePause();

    return false;
  }
}

function togglePause(){
  if(state==="PLAYING"){
    state="PAUSED";
    clearPointers();
    stopMusic();
  }
  else if(state==="PAUSED"){
    state="PLAYING";

    if(musicOn)
      startMusic();
  }
}

function goHome(){
  clearPointers();
  stopMusic();
  state="HOME";
}

function clearPointers(){
  movePointerId=null;
  firePointerId=null;
  fireHeld=false;

  joyStrength=0;
  joyAngle=0;

  if(
    typeof joy!=="undefined"
  ){
    joy.knobX=joy.x;
    joy.knobY=joy.y;
  }
}

function updateLayout(){
  const bottom=
    height-
    CONTROL_BOTTOM_OFFSET;

  const leftX=
    swappedControls?
      width-90:
      90;

  const rightX=
    swappedControls?
      90:
      width-90;

  joy.x=leftX;
  joy.y=bottom;

  joy.knobX=joy.x;
  joy.knobY=joy.y;

  fireBtn.x=rightX;
  fireBtn.y=bottom;

  powerBtn.x=
    width/2;

  powerBtn.y=
    bottom;
}

function windowResized(){
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  updateLayout();

  if(
    typeof shipPlayer!=="undefined"&&
    shipPlayer
  ){
    shipPlayer.x=
      constrain(
        shipPlayer.x,
        0,
        width
      );

    shipPlayer.y=
      constrain(
        shipPlayer.y,
        PLAY_TOP,
        height-150
      );
  }
}

function createStars(){
  stars=[];

  const count=
    Math.min(
      170,
      Math.max(
        70,
        Math.floor(
          width*height/7000
        )
      )
    );

  for(
    let i=0;
    i<count;
    i++
  ){
    stars.push({
      x:random(width),
      y:random(height),
      z:random(.2,1),
      size:random(.6,2.3),
      phase:random(PI2)
    });
  }
}

function drawStars(){
  if(!stars.length)
    createStars();

  noStroke();

  for(const s of stars){
    const twinkle=
      .55+
      .45*
      sin(
        frameCount*.018+
        s.phase
      );

    fill(
      160,
      205,
      225,
      80+
      120*
      twinkle*
      s.z
    );

    circle(
      s.x,
      s.y,
      s.size*
      (0.7+s.z)
    );

    // A small amount of vertical movement creates depth
    // without rotating the static HUD.
    s.y+=
      .12+
      s.z*.18;

    if(s.y>height+4){
      s.y=-4;
      s.x=random(width);
    }
  }
}

function drawWarpStars(){
  for(const s of stars){
    const len=
      3+
      s.z*13;

    stroke(
      160,
      220,
      255,
      90
    );

    strokeWeight(
      .5+
      s.z
    );

    line(
      s.x,
      s.y,
      s.x,
      s.y+len
    );
  }
}

function createCelebration(){
  celebration=[];

  for(
    let i=0;
    i<70;
    i++
  ){
    celebration.push({
      x:width/2,
      y:height*.48,
      vx:random(-5,5),
      vy:random(-7,-1),
      gravity:.12,
      life:100+
        random(70),
      size:random(3,7),
      rot:random(PI2),
      spin:random(-.12,.12)
    });
  }
}

function updateCelebration(){
  for(
    let i=celebration.length-1;
    i>=0;
    i--
  ){
    const p=
      celebration[i];

    p.x+=p.vx;
    p.y+=p.vy;
    p.vy+=p.gravity;
    p.rot+=p.spin;
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
      random(170,255),
      random(150,245),
      random(60,255),
      constrain(
        p.life*3,
        0,
        255
      )
    );

    rectMode(CENTER);

    rect(
      0,
      0,
      p.size,
      p.size*1.8
    );

    pop();

    if(p.life<=0)
      celebration.splice(i,1);
  }
}

/* ================================================================
   AUDIO
   The game uses WebAudio-generated ambience so the JS remains
   self-contained and does not require an external MP3 file.
================================================================ */

function initAudio(){
  if(!soundOn&&
     !musicOn)
    return;

  try{
    if(!audioCtx){
      audioCtx=
        new (
          window.AudioContext||
          window.webkitAudioContext
        )();
    }

    if(
      audioCtx.state==="suspended"
    )
      audioCtx.resume();

  }catch(e){
    audioCtx=null;
  }
}

function tone(
  freq,
  duration,
  volume=.08,
  attack=.01,
  wave="sine"
){
  if(!soundOn)return;

  try{
    initAudio();

    if(!audioCtx)return;

    const now=
      audioCtx.currentTime;

    const osc=
      audioCtx.createOscillator();

    const gain=
      audioCtx.createGain();

    osc.type=wave;
    osc.frequency.setValueAtTime(
      freq,
      now
    );

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      Math.max(.0002,volume),
      now+attack
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now+duration
    );

    osc.connect(gain);
    gain.connect(
      audioCtx.destination
    );

    osc.start(now);
    osc.stop(
      now+
      duration+
      .03
    );

  }catch(e){}
}

function playFireSound(){
  tone(
    610,
    .055,
    .035,
    .004,
    "square"
  );

  tone(
    920,
    .035,
    .018,
    .002,
    "triangle"
  );
}

function playHitSound(){
  tone(
    105,
    .18,
    .09,
    .004,
    "sawtooth"
  );

  tone(
    72,
    .24,
    .05,
    .004,
    "square"
  );
}

function playPowerSound(){
  tone(
    520,
    .12,
    .055,
    .005,
    "triangle"
  );

  setTimeout(
    ()=>{
      tone(
        780,
        .16,
        .045,
        .005,
        "triangle"
      );
    },
    70
  );
}

function playWeaponPickupSound(){
  tone(
    300,
    .12,
    .055,
    .005,
    "square"
  );

  setTimeout(
    ()=>{
      tone(
        600,
        .18,
        .055,
        .005,
        "square"
      );
    },
    75
  );

  setTimeout(
    ()=>{
      tone(
        900,
        .2,
        .04,
        .005,
        "triangle"
      );
    },
    150
  );
}

function playBossSound(){
  tone(
    80,
    .8,
    .08,
    .02,
    "sawtooth"
  );

  setTimeout(
    ()=>{
      tone(
        55,
        .9,
        .065,
        .02,
        "sawtooth"
      );
    },
    130
  );

  setTimeout(
    ()=>{
      tone(
        110,
        .7,
        .05,
        .01,
        "triangle"
      );
    },
    280
  );
}

function playBossPhaseSound(){
  tone(
    140,
    .35,
    .06,
    .01,
    "sawtooth"
  );

  setTimeout(
    ()=>{
      tone(
        280,
        .3,
        .045,
        .01,
        "square"
      );
    },
    100
  );
}

function playBossDeathSound(){
  tone(
    220,
    .3,
    .07,
    .01,
    "sawtooth"
  );

  setTimeout(
    ()=>{
      tone(
        110,
        .4,
        .065,
        .01,
        "sawtooth"
      );
    },
    120
  );

  setTimeout(
    ()=>{
      tone(
        55,
        .65,
        .055,
        .01,
        "triangle"
      );
    },
    260
  );
}

/* ================================================================
   LIMINAL / BACKROOMS-STYLE ARCADE AMBIENCE
   Generated with oscillators, so there is no external asset.
================================================================ */

function startMusic(){
  if(!musicOn)return;

  try{
    initAudio();

    if(!audioCtx)return;

    if(
      musicTimer!==null
    )
      return;

    musicStep=0;

    musicTimer=
      setInterval(
        musicTick,
        900
      );

    // Start softly rather than with a sudden loud tone.
    musicTick();

  }catch(e){
    musicTimer=null;
  }
}

function musicTick(){
  if(
    !musicOn||
    !audioCtx
  )
    return;

  const roots=[
    55,
    58.27,
    65.41,
    61.74
  ];

  const root=
    roots[
      musicStep%
      roots.length
    ];

  const notes=[
    root,
    root*1.189,
    root*1.498,
    root*1.682
  ];

  const n=
    notes[
      musicStep%
      notes.length
    ];

  tone(
    n,
    .65,
    .012,
    .08,
    "sine"
  );

  if(
    musicStep%4===0
  ){
    tone(
      root/2,
      .8,
      .009,
      .1,
      "triangle"
    );
  }

  if(
    musicStep%7===0
  ){
    tone(
      root*2.01,
      .22,
      .007,
      .04,
      "sine"
    );
  }

  musicStep++;
}

function stopMusic(){
  if(
    musicTimer!==null
  ){
    clearInterval(
      musicTimer
    );

    musicTimer=null;
  }
}

function playMenuSelect(){
  tone(
    440,
    .07,
    .025,
    .005,
    "triangle"
  );
}

/* ================================================================
   MATH / UTILITY HELPERS
================================================================ */

function sdClampInt(v,minV,maxV){
  v=parseInt(v,10);

  if(!Number.isFinite(v))
    v=minV;

  return constrain(
    v,
    minV,
    maxV
  );
}

function sdInside(
  px,
  py,
  cx,
  cy,
  w,
  h
){
  return(
    px>=cx-w/2&&
    px<=cx+w/2&&
    py>=cy-h/2&&
    py<=cy+h/2
  );
}

function norm(a){
  while(a>Math.PI)
    a-=PI2;

  while(a<-Math.PI)
    a+=PI2;

  return a;
}

function lerpAngle(
  a,
  b,
  amt
){
  return a+
    norm(b-a)*
    amt;
}

function rad(d){
  return d*Math.PI/180;
}

function colorWithAlpha(
  c,
  a
){
  try{
    const cc=color(c);

    return color(
      red(cc),
      green(cc),
      blue(cc),
      a
    );
  }catch(e){
    return color(
      255,
      a
    );
  }
}

function getEnemyColor(type){
  if(type==="SCOUT")
    return "#65dff5";

  if(type==="INTERCEPTOR")
    return "#ef5dce";

  if(type==="HUNTER")
    return "#ffad43";

  if(type==="HEAVY")
    return "#ff5757";

  return "#b879ff";
}

function label(
  txt,
  x,
  y,
  size=12,
  col="#fff",
  h= CENTER,
  v= CENTER,
  bold=false
){
  push();

  resetMatrix();

  textAlign(
    h,
    v
  );

  textSize(size);

  textStyle(
    bold?
      BOLD:
      NORMAL
  );

  fill(col);

  noStroke();

  text(
    txt,
    x,
    y
  );

  pop();
}
function handleTap(x,y){
  if(state==="INTRO"){
    if(
      sdInside(
        x,
        y,
        width/2,
        height*.86,
        min(250,width*.62),
        60
      )
    ){
      state="HOME";
      clearPointers();
      initAudio();
      return;
    }
    return;
  }

  if(state==="HOME"){
    stopMusic();

    const ys=[
      .29,
      .40,
      .51,
      .62,
      .73
    ];

    for(
      let i=0;
      i<ys.length;
      i++
    ){
      if(
        sdInside(
          x,
          y,
          width/2,
          height*ys[i],
          min(340,width*.86),
          70
        )
      ){
        state=[
          "LEVELS",
          "ARCHIVE",
          "ABOUT",
          "SETTINGS",
          "ACHIEVEMENTS"
        ][i];

        if(i===1){
          archiveScroll=0;
          archiveTarget=0;
        }

        if(i===4)
          rating=0;

        return;
      }
    }

    if(
      height>560&&
      sdInside(
        x,
        y,
        width/2,
        height*.84,
        min(340,width*.86),
        70
      )
    ){
      state="HELP";
    }

    return;
  }

  if(state==="LEVELS"){
    if(
      sdInside(
        x,
        y,
        width/2,
        height-94,
        240,
        70
      )
    ){
      state="HOME";
      return;
    }

    const cols=4,
          gap=9,
          size=min(
            66,
            (width-48)/cols
          ),
          startY=140,
          total=
            cols*size+
            (cols-1)*gap,
          startX=
            width/2-
            total/2+
            size/2;

    for(
      let n=1;
      n<=TOTAL_LEVELS;
      n++
    ){
      const col=(n-1)%cols,
            row=floor((n-1)/cols),
            bx=
              startX+
              col*(size+gap),
            by=
              startY+
              row*(size+15);

      if(
        sdInside(
          x,
          y,
          bx,
          by,
          size+12,
          size+12
        )
      ){
        if(n<=unlockedLevel)
          startLevel(n);

        return;
      }
    }

    return;
  }

  if(
    state==="ABOUT"||
    state==="HELP"
  ){
    if(
      sdInside(
        x,
        y,
        width/2,
        height-94,
        230,
        70
      )
    )
      state="HOME";

    return;
  }

  if(state==="SETTINGS"){
    const w=min(
      350,
      width*.88
    );

    const cx=width/2;

    if(
      sdInside(
        x,
        y,
        cx,
        270,
        w*.72,
        50
      )
    ){
      soundOn=!soundOn;
      saveGame();

      if(soundOn){
        initAudio();
        playPowerSound();
      }

      return;
    }

    if(
      sdInside(
        x,
        y,
        cx,
        330,
        w*.72,
        50
      )
    ){
      musicOn=!musicOn;
      saveGame();

      if(
        musicOn&&
        state==="SETTINGS"
      ){
        initAudio();
      }
      else if(!musicOn){
        stopMusic();
      }

      return;
    }

    if(
      sdInside(
        x,
        y,
        cx,
        500,
        w*.72,
        50
      )
    ){
      swappedControls=!swappedControls;
      updateLayout();
      saveGame();
      return;
    }

    if(
      sdInside(
        x,
        y,
        cx,
        height-94,
        230,
        70
      )
    ){
      state="HOME";
      stopMusic();
      return;
    }

    return;
  }

  if(
    state==="ACHIEVEMENTS"||
    state==="RATING"
  ){
    const w=min(
      350,
      width*.88
    );

    const boxTop=108,
          cols=3,
          gapCard=7,
          cardW=
            (
              w-
              28-
              (cols-1)*gapCard
            )/cols;

    const earned=
      DRAGON_LEVELS.filter(
        n=>n<=highestDragon
      );

    const rows=
      earned.length?
        Math.ceil(
          earned.length/cols
        ):
        1;

    const boxH=
      earned.length?
        Math.max(
          150,
          rows*78+34
        ):
        120;

    const ratingTitleY=
      boxTop+
      boxH+
      30;

    const starY=
      ratingTitleY+
      38;

    const starGap=
      min(
        42,
        width*.11
      );

    const starTotal=
      starGap*4;

    for(
      let i=1;
      i<=5;
      i++
    ){
      const sx=
        width/2-
        starTotal/2+
        (i-1)*starGap;

      if(
        dist(
          x,
          y,
          sx,
          starY
        )<25
      ){
        rating=i;
        return;
      }
    }

    if(
      sdInside(
        x,
        y,
        width/2,
        starY+67,
        min(250,width*.70),
        50
      )
    ){
      if(rating<1)
        return;

      try{
        localStorage.setItem(
          "spaceDodgerRating",
          String(rating)
        );
      }catch(e){}

      createCelebration();
      state="RATING_THANKS";
      stopMusic();
      return;
    }

    if(
      sdInside(
        x,
        y,
        width/2,
        height-94,
        230,
        70
      )
    ){
      state="HOME";
      stopMusic();
      return;
    }

    return;
  }

  if(state==="RATING_THANKS"){
    if(
      sdInside(
        x,
        y,
        width/2,
        height-94,
        230,
        70
      )
    ){
      celebration=[];
      state="HOME";
    }

    return;
  }

  if(state==="PAUSED"){
    if(
      sdInside(
        x,
        y,
        width/2,
        height*.53,
        310,
        75
      )
    ){
      state="PLAYING";

      if(musicOn)
        startMusic();

      return;
    }

    if(
      sdInside(
        x,
        y,
        width/2,
        height*.64,
        280,
        75
      )
    ){
      state="HOME";
      stopMusic();
      return;
    }

    return;
  }

  if(state==="GAMEOVER"){
    if(
      sdInside(
        x,
        y,
        width/2,
        height*.61,
        310,
        75
      )
    ){
      startLevel(level);
      return;
    }

    if(
      sdInside(
        x,
        y,
        width/2,
        height*.72,
        280,
        75
      )
    ){
      state="HOME";
      return;
    }

    return;
  }

  if(state==="LEVELUP"){
    const done=
      level===TOTAL_LEVELS;

    const retryY=
      height*(done?.84:.72);

    const nextY=
      height*(done?.92:.82);

    if(
      sdInside(
        x,
        y,
        width/2,
        retryY,
        300,
        80
      )
    ){
      startLevel(level);
      return;
    }

    if(
      sdInside(
        x,
        y,
        width/2,
        nextY,
        300,
        80
      )
    ){
      state=
        done?
          "HOME":
          (
            startLevel(level+1),
            state
          );

      return;
    }
  }
}

function installPointerEvents(){
  const c=
    document.querySelector(
      "canvas"
    );

  if(!c)
    return;

  c.style.touchAction="none";
  c.style.userSelect="none";

  c.addEventListener(
    "pointerdown",
    onPointerDown,
    {passive:false}
  );

  c.addEventListener(
    "pointermove",
    onPointerMove,
    {passive:false}
  );

  c.addEventListener(
    "pointerup",
    onPointerUp,
    {passive:false}
  );

  c.addEventListener(
    "pointercancel",
    onPointerUp,
    {passive:false}
  );
}

function pointerPosition(e){
  const r=
    e.currentTarget
      .getBoundingClientRect();

  return{
    x:
      (e.clientX-r.left)*
      width/r.width,

    y:
      (e.clientY-r.top)*
      height/r.height
  };
}

function onPointerDown(e){
  e.preventDefault();

  try{
    e.currentTarget
      .setPointerCapture(
        e.pointerId
      );
  }catch(err){}

  initAudio();

  const p=
    pointerPosition(e);

  const x=p.x,
        y=p.y;

  if(state==="PLAYING"){
    if(
      dist(
        x,
        y,
        homeBtn.x,
        homeBtn.y
      )<=34
    ){
      state="HOME";
      clearPointers();
      return;
    }

    if(
      dist(
        x,
        y,
        pauseBtn.x,
        pauseBtn.y
      )<=34
    ){
      state="PAUSED";
      clearPointers();
      return;
    }

    if(
      dist(
        x,
        y,
        powerBtn.x,
        powerBtn.y
      )<=
      powerBtn.r+22
    ){
      useSpecial();
      return;
    }

    if(
      firePointerId===null&&
      dist(
        x,
        y,
        fireBtn.x,
        fireBtn.y
      )<=
      fireBtn.r+22
    ){
      firePointerId=
        e.pointerId;

      fireHeld=true;
      shoot();
      return;
    }

    if(
      movePointerId===null&&
      dist(
        x,
        y,
        joy.x,
        joy.y
      )<=
      joy.r+32
    ){
      movePointerId=
        e.pointerId;

      updateJoystick(
        x,
        y
      );

      return;
    }

    return;
  }

  if(state==="ARCHIVE"){
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

function onPointerMove(e){
  e.preventDefault();

  const p=
    pointerPosition(e);

  if(
    state==="PLAYING"&&
    e.pointerId===movePointerId
  )
    updateJoystick(
      p.x,
      p.y
    );

  if(
    state==="ARCHIVE"
  )
    archivePointerMove(
      p.x,
      p.y
    );
}

function onPointerUp(e){
  e.preventDefault();

  const p=
    pointerPosition(e);

  if(state==="PLAYING"){
    if(
      e.pointerId===
      movePointerId
    ){
      movePointerId=null;
      resetJoystick();
    }

    if(
      e.pointerId===
      firePointerId
    )
      firePointerId=null;

    fireHeld=
      firePointerId!==null;

    try{
      e.currentTarget
        .releasePointerCapture(
          e.pointerId
        );
    }catch(err){}

    return;
  }

  if(state==="ARCHIVE")
    archivePointerUp(
      p.x,
      p.y
    );
}

function updateJoystick(x,y){
  let dx=x-joy.x,
      dy=y-joy.y,
      d=Math.hypot(
        dx,
        dy
      );

  if(d>joy.r){
    const a=
      atan2(
        dy,
        dx
      );

    dx=
      cos(a)*
      joy.r;

    dy=
      sin(a)*
      joy.r;

    d=joy.r;
  }

  joy.knobX=
    joy.x+dx;

  joy.knobY=
    joy.y+dy;

  if(d>5){
    joyAngle=
      atan2(
        dy,
        dx
      );

    joyStrength=
      constrain(
        d/joy.r,
        0,
        1
      );

    shipPlayer.angle=
      lerpAngle(
        shipPlayer.angle,
        joyAngle,
        .52
      );
  }
}

function updateKeyboardMovement(){
  let kx=0,
      ky=0;

  if(
    keyIsDown(LEFT_ARROW)||
    keyIsDown(65)
  )
    kx-=1;

  if(
    keyIsDown(RIGHT_ARROW)||
    keyIsDown(68)
  )
    kx+=1;

  if(
    keyIsDown(UP_ARROW)||
    keyIsDown(87)
  )
    ky-=1;

  if(
    keyIsDown(DOWN_ARROW)||
    keyIsDown(83)
  )
    ky+=1;

  if(
    kx!==0||
    ky!==0
  ){
    const m=
      Math.hypot(
        kx,
        ky
      )||1;

    const s=
      playerSpeed();

    shipPlayer.vx=
      lerp(
        shipPlayer.vx,
        (kx/m)*s,
        .55
      );

    shipPlayer.vy=
      lerp(
        shipPlayer.vy,
        (ky/m)*s,
        .55
      );
  }
}

function updateJoystickMovement(){
  if(
    movePointerId===null
  ){
    joyStrength=0;
    return;
  }

  if(
    joyStrength<=0
  )
    return;

  const s=
    playerSpeed()*
    joyStrength;

  shipPlayer.vx=
    lerp(
      shipPlayer.vx,
      cos(joyAngle)*s,
      .55
    );

  shipPlayer.vy=
    lerp(
      shipPlayer.vy,
      sin(joyAngle)*s,
      .55
    );
}

function resetJoystick(){
  joy.knobX=joy.x;
  joy.knobY=joy.y;
  joyStrength=0;
}

function clearPointers(){
  movePointerId=null;
  firePointerId=null;
  fireHeld=false;
  resetJoystick();
}

function updateLayout(){
  pauseBtn.x=38;
  pauseBtn.y=76;

  homeBtn.x=
    width-38;

  homeBtn.y=76;

  const y=
    max(
      170,
      height-
      CONTROL_BOTTOM_OFFSET
    );

  joy.x=
    swappedControls?
      width-90:
      90;

  joy.y=y;

  joy.knobX=joy.x;
  joy.knobY=y;

  fireBtn.x=
    swappedControls?
      90:
      width-90;

  fireBtn.y=y;

  powerBtn.x=
    width/2;

  powerBtn.y=y;
}

function createStars(){
  stars=[];

  for(
    let i=0;
    i<190;
    i++
  ){
    stars.push({
      x:
        random(
          -width*.65,
          width*.65
        ),

      y:
        random(
          -height*.5,
          height*.5
        ),

      z:
        random(.08,1),

      pz:1,

      s:
        .7+
        random(2.2),

      a:
        70+
        random(150)
    });
  }
}

function drawStars(){
  const cx=
    width/2;

  const cy=
    height*.43;

  for(
    const s of stars
  ){
    const moving=
      state==="PLAYING";

    const speed=
      moving?
        .012+
        level*.00055:
        .0025;

    const oldZ=s.z;

    s.z-=speed;

    if(
      s.z<.025
    ){
      s.x=
        random(
          -width*.65,
          width*.65
        );

      s.y=
        random(
          -height*.5,
          height*.5
        );

      s.z=1;
    }

    const x1=
      cx+
      s.x/s.z;

    const y1=
      cy+
      s.y/s.z;

    const z2=
      min(
        1,
        s.z+
        speed*1.9
      );

    const x2=
      cx+
      s.x/z2;

    const y2=
      cy+
      s.y/z2;

    if(
      x1<-30||
      x1>width+30||
      y1<-30||
      y1>height+30
    )
      continue;

    const near=
      constrain(
        1-s.z,
        0,
        1
      );

    const sz=
      s.s*
      (.7+
      near*2.8);

    const alpha=
      s.a*
      (.45+
      near*.7);

    noStroke();

    fill(
      185,
      220,
      255,
      alpha
    );

    circle(
      x1,
      y1,
      sz
    );

    if(
      moving&&
      near>.18
    ){
      stroke(
        170,
        225,
        255,
        alpha*.55
      );

      strokeWeight(
        max(
          .6,
          sz*.35
        )
      );

      line(
        x2,
        y2,
        x1,
        y1
      );
    }
  }

  if(
    state==="PLAYING"
  )
    drawWarpLanes(
      cx,
      cy
    );
}

function drawWarpLanes(cx,cy){
  const pulse=
    .5+
    .5*
    sin(
      frameCount*.035
    );

  noFill();

  stroke(
    70,
    160,
    210,
    18+
    18*pulse
  );

  strokeWeight(1);

  for(
    let i=1;
    i<=5;
    i++
  ){
    const w=
      width*
      (.15+
      i*.17);

    const h=
      height*
      (.08+
      i*.11);

    ellipse(
      cx,
      cy,
      w,
      h
    );
  }
}

function initAudio(){
  if(!audioCtx){
    const A=
      window.AudioContext||
      window.webkitAudioContext;

    if(A)
      try{
        audioCtx=
          new A();
      }catch(e){
        audioCtx=null;
      }
  }

  if(
    audioCtx&&
    audioCtx.state==="suspended"
  )
    try{
      audioCtx.resume();
    }catch(e){}
}

function musicTone(
  freq,
  dur,
  gain=.018,
  type="sine",
  when=0
){
  if(!musicOn)
    return;

  initAudio();

  if(!audioCtx)
    return;

  try{
    const now=
      audioCtx.currentTime+
      when;

    const o=
      audioCtx.createOscillator();

    const g=
      audioCtx.createGain();

    o.type=type;

    o.frequency.setValueAtTime(
      freq,
      now
    );

    g.gain.setValueAtTime(
      .0001,
      now
    );

    g.gain.exponentialRampToValueAtTime(
      gain,
      now+.08
    );

    g.gain.exponentialRampToValueAtTime(
      .0001,
      now+dur
    );

    o.connect(g);

    g.connect(
      audioCtx.destination
    );

    o.start(now);

    o.stop(
      now+
      dur+
      .03
    );

  }catch(e){}
}

function startMusic(){
  if(!musicOn)
    return;

  initAudio();

  if(
    !audioCtx||
    musicTimer
  )
    return;

  musicStep=0;

  // Original liminal/Backrooms-inspired arcade ambience:
  // low drone + sparse melody.
  const notes=[
    110,
    130.81,
    146.83,
    123.47,
    98,
    116.54,
    138.59,
    103.83
  ];

  const playBar=()=>{
    if(
      !musicOn||
      state!=="PLAYING"
    )
      return;

    const n=
      notes[
        musicStep%
        notes.length
      ];

    musicTone(
      n,
      1.35,
      .012,
      "sine"
    );

    musicTone(
      n*2,
      .55,
      .006,
      "triangle",
      .18
    );

    if(
      musicStep%4===0
    )
      musicTone(
        n*.5,
        2.2,
        .009,
        "sine",
        .02
      );

    if(
      musicStep%8===7
    )
      musicTone(
        n*1.5,
        .7,
        .004,
        "sine",
        .3
      );

    musicStep++;
  };

  playBar();

  musicTimer=
    setInterval(
      playBar,
      1450
    );
}

function stopMusic(){
  if(musicTimer){
    clearInterval(
      musicTimer
    );

    musicTimer=null;
  }
}

function tone(
  f1,
  f2,
  d,
  v,
  type="triangle"
){
  if(!soundOn)
    return;

  initAudio();

  if(!audioCtx)
    return;

  try{
    const now=
      audioCtx.currentTime;

    const o=
      audioCtx.createOscillator();

    const g=
      audioCtx.createGain();

    o.type=type;

    o.frequency.setValueAtTime(
      f1,
      now
    );

    o.frequency.exponentialRampToValueAtTime(
      max(20,f2),
      now+d
    );

    g.gain.setValueAtTime(
      .0001,
      now
    );

    g.gain.exponentialRampToValueAtTime(
      v,
      now+.01
    );

    g.gain.exponentialRampToValueAtTime(
      .0001,
      now+d
    );

    o.connect(g);

    g.connect(
      audioCtx.destination
    );

    o.start(now);

    o.stop(
      now+d+.01
    );

  }catch(e){}
}

function playFireSound(){
  tone(
    760,
    170,
    .06,
    .04,
    "sawtooth"
  );
}

function playPowerSound(){
  tone(
    260,
    720,
    .23,
    .065
  );
}

function playHitSound(){
  tone(
    120,
    60,
    .16,
    .07,
    "square"
  );
}

function playBossSound(){
  tone(
    90,
    35,
    .45,
    .08,
    "sawtooth"
  );
}

function playBossPhaseSound(){
  tone(
    150,
    700,
    .35,
    .09,
    "sawtooth"
  );
}

function playBossDeathSound(){
  tone(
    500,
    45,
    .65,
    .1,
    "sawtooth"
  );
}

function playWeaponPickupSound(){
  tone(
    300,
    1000,
    .28,
    .08,
    "square"
  );
}

function createCelebration(){
  celebration=[];

  const cs=[
    "#ffe600",
    "#00ddff",
    "#ff4dcc",
    "#fff",
    "#65ff8a",
    "#ff8a30"
  ];

  for(
    let i=0;
    i<180;
    i++
  ){
    celebration.push({
      x:random(width),

      y:
        -20-
        random(
          height*.4
        ),

      vx:
        (random()-.5)*
        2.2,

      vy:
        1.2+
        random(4.2),

      size:
        3+
        random(5),

      rot:
        random(PI2),

      vr:
        (random()-.5)*
        .18,

      color:
        random(cs),

      life:280
    });
  }

  tone(
    520,
    880,
    .25,
    .08
  );
}

function updateCelebration(){
  for(
    let i=
      celebration.length-1;
    i>=0;
    i--
  ){
    const p=
      celebration[i];

    p.x+=p.vx;
    p.y+=p.vy;
    p.vy+=.018;
    p.rot+=p.vr;
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
      p.size*1.8,
      p.size
    );

    pop();

    if(
      p.life<=0||
      p.y>height+30
    )
      celebration.splice(
        i,
        1
      );
  }
}

function label(
  t,
  x,
  y,
  s,
  c,
  a=CENTER,
  ay=CENTER,
  b=false
){
  noStroke();

  fill(c);

  textSize(s);

  textAlign(
    a,
    ay
  );

  textStyle(
    b?
      BOLD:
      NORMAL
  );

  text(
    t,
    x,
    y
  );
}

function sdDistance(
  ax,
  ay,
  bx,
  by
){
  return Math.hypot(
    ax-bx,
    ay-by
  );
}

function sdInside(
  px,
  py,
  cx,
  cy,
  w,
  h
){
  return(
    px>=cx-w/2&&
    px<=cx+w/2&&
    py>=cy-h/2&&
    py<=cy+h/2
  );
}

function sdClampInt(
  v,
  mn,
  mx
){
  return Math.max(
    mn,
    Math.min(
      mx,
      Math.floor(
        Number(v)||mn
      )
    )
  );
}

function rad(d){
  return d*Math.PI/180;
}

function lerpAngle(
  c,
  t,
  a
){
  let d=t-c;

  while(
    d>Math.PI
  )
    d-=PI2;

  while(
    d<-Math.PI
  )
    d+=PI2;

  return c+d*a;
}

function norm(a){
  while(
    a>Math.PI
  )
    a-=PI2;

  while(
    a<-Math.PI
  )
    a+=PI2;

  return a;
}

function colorWithAlpha(
  v,
  a
){
  const c=color(v);

  return color(
    red(c),
    green(c),
    blue(c),
    a
  );
}

function getEnemyColor(t){
  return t==="SCOUT"?
    "#4de5ff":
    t==="INTERCEPTOR"?
      "#ef5dce":
      t==="HUNTER"?
        "#ffad43":
        t==="HEAVY"?
          "#ff5757":
          "#b879ff";
}

function windowResized(){
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  createStars();
  updateLayout();
}

function mouseWheel(e){
  if(
    state==="ARCHIVE"
  ){
    const g=
      archiveGeometry();

    archiveTarget=
      constrain(
        archiveTarget+
        e.delta,
        0,
        g.max
      );

    return false;
  }

  return true;
}
