let ship, meteors=[], bonusStars=[], particles=[];
let score=0, lives=3, gameOver=false, paused=false;
let spawnTimer=0, starTimer=0, shake=0, invincible=0;
let bestScore=Number(localStorage.getItem('spaceDodgerBest')||0);

function setup(){
  const c=createCanvas(windowWidth,windowHeight); c.parent('game');
  textAlign(CENTER,CENTER); strokeCap(ROUND);
  ship={x:width/2,y:height-100,size:50};
}

function draw(){
  background(8,12,30); drawSpace();
  if(paused&&!gameOver){ drawShip(); drawHUD(); drawPauseOverlay(); return; }
  push();
  if(shake>0){translate(random(-shake,shake),random(-shake,shake));shake*=0.84;}
  if(!gameOver) updateGame();
  drawBonusStars(); drawMeteors(); drawShip(); drawParticles();
  pop(); drawHUD();
  if(gameOver) drawGameOver();
}

function updateGame(){
  score+=0.02; if(invincible>0) invincible--;
  spawnTimer++; starTimer++;
  const spawnRate=max(20,62-floor(score/14));
  if(spawnTimer>spawnRate){createMeteor();spawnTimer=0;}
  if(starTimer>280){createBonusStar();starTimer=0;}
}

function drawSpace(){
  noStroke();
  for(let i=0;i<48;i++){
    const x=(i*97)%width, y=(i*181+frameCount*(1+i%3))%height, s=1+(i%3);
    fill(255,255,255,65+(i%3)*45); circle(x,y,s);
  }
}

function drawShip(){
  push(); translate(ship.x,ship.y);
  if(invincible>0 && frameCount%8<4) drawingContext.globalAlpha=0.35;
  noStroke(); fill(60,170,255,35); ellipse(0,25,45,70);
  fill(60,190,255,90); triangle(-12,18,12,18,0,55+random(-5,8));
  fill(70,110,210); triangle(-15,5,-38,25,-15,22); triangle(15,5,38,25,15,22);
  fill(210,225,255); triangle(0,-32,-20,25,20,25);
  fill(70,210,255); ellipse(0,-4,17,25); fill(255,255,255,170); ellipse(-3,-8,5,8);
  drawingContext.globalAlpha=1; pop();
}

function createMeteor(){
  const size=random(32,65);
  meteors.push({x:random(size,width-size),y:-size,size,speed:random(3.5,5.5)+score*0.015,rotation:random(360),spin:random(-3,3)});
}

function drawMeteors(){
  for(let i=meteors.length-1;i>=0;i--){
    const m=meteors[i]; if(!gameOver){m.y+=m.speed;m.rotation+=m.spin;}
    push(); translate(m.x,m.y); rotate(radians(m.rotation)); noStroke();
    fill(255,80,30,30); circle(0,0,m.size+20); fill(125,75,60); circle(0,0,m.size);
    fill(85,50,45); circle(-m.size*.15,-m.size*.1,m.size*.22); circle(m.size*.18,m.size*.15,m.size*.16); pop();
    if(!gameOver){
      const d=dist(ship.x,ship.y,m.x,m.y);
      if(invincible<=0 && d<ship.size*.35+m.size*.4){
        explosion(m.x,m.y,25); meteors.splice(i,1); lives--; shake=15; invincible=75;
        if(navigator.vibrate) navigator.vibrate(80);
        if(lives<=0) endGame(); continue;
      }
      if(m.y>height+m.size) meteors.splice(i,1);
    }
  }
}

function createBonusStar(){bonusStars.push({x:random(40,width-40),y:-40,speed:3,angle:0});}
function drawBonusStars(){
  for(let i=bonusStars.length-1;i>=0;i--){
    const s=bonusStars[i]; if(!gameOver){s.y+=s.speed;s.angle+=3;}
    push();translate(s.x,s.y);rotate(radians(s.angle));noStroke();fill(255,220,60,35);circle(0,0,45);fill(255,220,70);starShape(0,0,9,20,5);pop();
    if(!gameOver){
      if(dist(ship.x,ship.y,s.x,s.y)<38){score+=20;explosion(s.x,s.y,15);bonusStars.splice(i,1);if(navigator.vibrate) navigator.vibrate(25);continue;}
      if(s.y>height+50) bonusStars.splice(i,1);
    }
  }
}

function starShape(x,y,r1,r2,n){
  const a=TWO_PI/n,h=a/2;beginShape();
  for(let q=-PI/2;q<TWO_PI-PI/2;q+=a){vertex(x+cos(q)*r2,y+sin(q)*r2);vertex(x+cos(q+h)*r1,y+sin(q+h)*r1);}endShape(CLOSE);
}

function explosion(x,y,n){for(let i=0;i<n;i++)particles.push({x,y,vx:random(-6,6),vy:random(-6,6),life:255,size:random(4,10),g:random(100,220)});}
function drawParticles(){
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vx*=.96;p.vy*=.96;p.life-=8;noStroke();fill(255,p.g,40,p.life);circle(p.x,p.y,p.size);if(p.life<=0)particles.splice(i,1);}
}

function drawHUD(){
  noStroke();fill(255);textStyle(BOLD);textSize(22);text('SCORE  '+floor(score),width/2,38);
  textSize(18);fill(255,80,110);text('♥ '.repeat(max(0,lives)),width/2,70);
  fill(255,255,255,130);textSize(12);text('DRAG TO DODGE  •  COLLECT ★',width/2,100);
  fill(255,255,255,150);textSize(20);text('Ⅱ',width-34,38);
}

function drawGameOver(){
  noStroke();fill(5,8,25,225);rect(0,0,width,height);fill(255,80,100);textStyle(BOLD);textSize(40);text('GAME OVER',width/2,height/2-100);
  fill(255);textSize(25);text('Score: '+floor(score),width/2,height/2-40);fill(255,215,60);textSize(18);text('Best: '+bestScore,width/2,height/2);
  fill(180,210,255);textSize(16);text('TAP TO PLAY AGAIN',width/2,height/2+70);
}
function drawPauseOverlay(){noStroke();fill(5,8,25,210);rect(0,0,width,height);fill(255);textStyle(BOLD);textSize(38);text('PAUSED',width/2,height/2-25);textSize(16);fill(180,210,255);text('Tap to continue',width/2,height/2+35);}

function endGame(){gameOver=true;bestScore=max(bestScore,floor(score));localStorage.setItem('spaceDodgerBest',bestScore);}
function restartGame(){meteors=[];bonusStars=[];particles=[];score=0;lives=3;spawnTimer=0;starTimer=0;gameOver=false;paused=false;invincible=0;ship.x=width/2;}

function handlePress(x,y){
  if(gameOver){restartGame();return;}
  if(paused){paused=false;return;}
  if(x>width-75 && y<80){paused=true;return;}
  ship.x=constrain(x,35,width-35);
}
function mousePressed(){handlePress(mouseX,mouseY);return false;}
function mouseDragged(){if(!gameOver&&!paused)ship.x=constrain(mouseX,35,width-35);return false;}
function touchStarted(){handlePress(mouseX,mouseY);return false;}
function touchMoved(){if(!gameOver&&!paused)ship.x=constrain(mouseX,35,width-35);return false;}

function windowResized(){resizeCanvas(windowWidth,windowHeight);ship.y=height-100;ship.x=constrain(ship.x,35,width-35);}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!gameOver)paused=true;});
