const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth < 800 ? window.innerWidth * 0.95 : 800;
  canvas.height = window.innerHeight < 600 ? window.innerHeight * 0.6 : 600;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let playerWidth = canvas.width * 0.08;
let playerHeight = canvas.height * 0.1;
let playerSpeed = canvas.width * 0.02;
const bulletSpeed = canvas.height * 0.01;
const enemySpeed = 2;
const monsterSpeed = 1;
const initialBulletRate = 150;
let bulletRate = initialBulletRate;

let playerX = canvas.width / 2 - playerWidth / 2;
let playerY = canvas.height - playerHeight - 10;
let bullets = [];
let monsterBullets = [];
let enemies = [];
let monster = null;
let score = 0;
let gameInterval;
let enemyInterval;
let bulletInterval;
let monsterBulletInterval;
let isGameOver = false;
let isPaused = false;

const playerImage = new Image();
playerImage.src = 'player.png';

const enemyImage = new Image();
enemyImage.src = 'enemy.png';

const monsterImage = new Image();
monsterImage.src = 'monster.png';

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

function handleKeyDown(event) {
  if (event.code === 'ArrowLeft') {
    playerX -= playerSpeed;
    if (playerX < 0) playerX = 0;
  } else if (event.code === 'ArrowRight') {
    playerX += playerSpeed;
    if (playerX + playerWidth > canvas.width) playerX = canvas.width - playerWidth;
  }
}

function handleKeyUp(event) {
  if (event.code === 'Space' && !isGameOver) {
    shootBullet();
  }
}

function shootBullet() {
  bullets.push({ x: playerX + playerWidth / 2 - 2.5, y: playerY, width: 5, height: 10 });
}

function createEnemy() {
  const enemyWidth = 40;
  const enemyHeight = 40;
  const enemyX = Math.random() * (canvas.width - enemyWidth);
  enemies.push({ x: enemyX, y: 0, width: enemyWidth, height: enemyHeight });
}

function createMonster() {
  const monsterWidth = 80;
  const monsterHeight = 60;
  monster = {
    x: Math.random() * (canvas.width - monsterWidth),
    y: 0,
    width: monsterWidth,
    height: monsterHeight,
    speed: monsterSpeed,
    health: 5
  };
}

function shootMonsterBullet() {
  if (monster) {
    monsterBullets.push({ x: monster.x + monster.width / 2 - 2.5, y: monster.y + monster.height, width: 5, height: 10 });
  }
}

function getRandomDirection() {
  return Math.random() < 0.5 ? -1 : 1;
}

let monsterDirection = getRandomDirection();

function update() {
  if (isPaused || isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(playerImage, playerX, playerY, playerWidth, playerHeight);

  ctx.fillStyle = '#ff0';
  bullets = bullets.filter(bullet => bullet.y > 0);
  bullets.forEach(bullet => {
    bullet.y -= bulletSpeed;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  ctx.fillStyle = '#0ff';
  monsterBullets = monsterBullets.filter(bullet => bullet.y < canvas.height);
  monsterBullets.forEach(bullet => {
    bullet.y += bulletSpeed / 3;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  ctx.fillStyle = '#f00';
  enemies = enemies.filter(enemy => enemy.y < canvas.height);
  enemies.forEach(enemy => {
    enemy.y += enemySpeed;
    ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  if (monster) {
    ctx.fillStyle = '#00f';
    monster.y += monster.speed;

    if (Math.random() < 0.01) monsterDirection = getRandomDirection();
    monster.x += monsterDirection * monster.speed;
    if (monster.x < 0) {
      monster.x = 0;
      monsterDirection = 1;
    } else if (monster.x + monster.width > canvas.width) {
      monster.x = canvas.width - monster.width;
      monsterDirection = -1;
    }

    if (score >= 50) {
      bullets.forEach(bullet => {
        if (Math.abs(bullet.x - monster.x) < 30) {
          if (bullet.x < monster.x && monster.x + monster.width < canvas.width) {
            monster.x += monster.speed * 2;
          } else if (bullet.x > monster.x && monster.x > 0) {
            monster.x -= monster.speed * 2;
          }
        }
      });
    }
    ctx.drawImage(monsterImage, monster.x, monster.y, monster.width, monster.height);
  }

  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x && bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y) {
        enemies.splice(enemyIndex, 1);
        bullets.splice(bulletIndex, 1);
        score++;
        if (score >= 12 && !monster) createMonster();
        if (score >= 12) {
          bulletRate = initialBulletRate / 2;
          clearInterval(bulletInterval);
          bulletInterval = setInterval(shootBullet, bulletRate);
        }
        if (score >= 30 && !monsterBulletInterval) {
          monsterBulletInterval = setInterval(shootMonsterBullet, bulletRate * 4);
        }
      }
    });

    if (monster && bullet.x < monster.x + monster.width && bullet.x + bullet.width > monster.x && bullet.y < monster.y + monster.height && bullet.y + bullet.height > monster.y) {
      bullets.splice(bulletIndex, 1);
      monster.health -= 1;
      if (monster.health <= 0) {
        monster = null;
        score += 5;
        clearInterval(monsterBulletInterval);
        monsterBulletInterval = null;
      }
    }
  });

  monsterBullets.forEach((bullet, bulletIndex) => {
    if (bullet.x < playerX + playerWidth && bullet.x + bullet.width > playerX && bullet.y < playerY + playerHeight && bullet.y + bullet.height > playerY) {
      monsterBullets.splice(bulletIndex, 1);
      clearInterval(gameInterval);
      clearInterval(enemyInterval);
      clearInterval(bulletInterval);
      clearInterval(monsterBulletInterval);
      isGameOver = true;
      ctx.fillStyle = '#f00';
      ctx.font = '50px Arial';
      ctx.fillText('Game Over', canvas.width / 2 - 150, canvas.height / 2);
    }
  });

  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText(`Score: ${score}`, 10, 20);

  if (enemies.some(enemy => enemy.y + enemy.height > playerY) || (monster && monster.y + monster.height > playerY)) {
    clearInterval(gameInterval);
    clearInterval(enemyInterval);
    clearInterval(bulletInterval);
    clearInterval(monsterBulletInterval);
    isGameOver = true;
    ctx.fillStyle = '#f00';
    ctx.font = '50px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 150, canvas.height / 2);
  }
}

function startGame() {
  if (!isGameOver && !isPaused) {
    gameInterval = setInterval(update, 1000 / 60);
    enemyInterval = setInterval(createEnemy, 2000);
    bulletInterval = setInterval(shootBullet, bulletRate);
  }
}

function pauseGame() {
  clearInterval(gameInterval);
  clearInterval(enemyInterval);
  clearInterval(bulletInterval);
  clearInterval(monsterBulletInterval);
  isPaused = true;
  ctx.fillStyle = '#f00';
  ctx.font = '35px Arial';
  ctx.fillText('Click Resume to start the game', canvas.width / 2 - 230, canvas.height / 2);
}

function resumeGame() {
  if (isPaused && !isGameOver) {
    isPaused = false;
    startGame();
  }
}

function exitGame() {
  clearInterval(gameInterval);
  clearInterval(enemyInterval);
  clearInterval(bulletInterval);
  clearInterval(monsterBulletInterval);
  isGameOver = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f00';
  ctx.font = '50px Arial';
  ctx.fillText('Game Exited', canvas.width / 2 - 150, canvas.height / 2);
}

document.getElementById('playButton').addEventListener('click', () => {
  if (isGameOver) {
    isGameOver = false;
    score = 0;
    bullets = [];
    monsterBullets = [];
    enemies = [];
    monster = null;
    bulletRate = initialBulletRate;
    resizeCanvas();
    playerWidth = canvas.width * 0.08;
    playerHeight = canvas.height * 0.1;
    playerSpeed = canvas.width * 0.02;
    playerX = canvas.width / 2 - playerWidth / 2;
    playerY = canvas.height - playerHeight - 10;
  }
  startGame();
});

document.getElementById('pauseResumeButton').addEventListener('click', () => {
  if (isPaused) {
    resumeGame();
    document.getElementById('pauseResumeButton').textContent = 'Pause';
  } else {
    pauseGame();
    document.getElementById('pauseResumeButton').textContent = 'Resume';
  }
});

document.getElementById('exitButton').addEventListener('click', exitGame);

// Mobile touch controls
const mobilePlayButton = document.getElementById('mobilePlayButton');
const exitButtonMobile = document.getElementById('exitButtonMobile');

mobilePlayButton.addEventListener('click', () => {
  if (isGameOver) {
    isGameOver = false;
    score = 0;
    bullets = [];
    monsterBullets = [];
    enemies = [];
    monster = null;
    bulletRate = initialBulletRate;
    resizeCanvas();
    playerWidth = canvas.width * 0.08;
    playerHeight = canvas.height * 0.1;
    playerSpeed = canvas.width * 0.02;
    playerX = canvas.width / 2 - playerWidth / 2;
    playerY = canvas.height - playerHeight - 10;
    mobilePlayButton.textContent = 'Pause';
    startGame();
  } else if (isPaused) {
    resumeGame();
    mobilePlayButton.textContent = 'Pause';
  } else {
    pauseGame();
    mobilePlayButton.textContent = 'Resume';
  }

  if (isGameOver) {
    mobilePlayButton.textContent = 'Restart';
  }
});

exitButtonMobile.addEventListener('click', () => {
  exitGame();
  mobilePlayButton.textContent = 'Play';
});

// Mobile left-right controls
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

let isHoldingLeft = false;
let isHoldingRight = false;

function handleTouchMove() {
  if (isHoldingLeft) {
    playerX -= playerSpeed;
    if (playerX < 0) playerX = 0;
  } else if (isHoldingRight) {
    playerX += playerSpeed;
    if (playerX + playerWidth > canvas.width) playerX = canvas.width - playerWidth;
  }
  if (isHoldingLeft || isHoldingRight) requestAnimationFrame(handleTouchMove);
}

leftBtn.addEventListener('touchstart', () => {
  isHoldingLeft = true;
  handleTouchMove();
});
leftBtn.addEventListener('touchend', () => isHoldingLeft = false);

rightBtn.addEventListener('touchstart', () => {
  isHoldingRight = true;
  handleTouchMove();
});
rightBtn.addEventListener('touchend', () => isHoldingRight = false);

// Exit function on mobile screen
function exitGame() {
  clearInterval(gameInterval);
  clearInterval(enemyInterval);
  clearInterval(bulletInterval);
  clearInterval(monsterBulletInterval);
  isGameOver = true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f00';
  ctx.font = '50px Arial';
  ctx.fillText('Game Exited', canvas.width / 2 - 150, canvas.height / 2);
  mobilePlayButton.textContent = 'Play'; // Add this line
}
