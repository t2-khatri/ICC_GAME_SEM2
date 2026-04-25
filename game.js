// ================= GAME STATE =================
let gameState = "start"; // "start", "play", "gameover"

// ================= GAME VARIABLES =================
let player, bullets = [], enemies = [], explosions = [];
let bg, bg2;
let score = 0, level = 1, startTime;
let enemyImages = [], rocketImg;
let health = 3;
let shootSound;

// ================= PRELOAD =================
// Load images and sound before game starts
function preload() {
    bg = loadImage("images/canvas.webp"); // Level 1 background
    bg2 = loadImage("images/canvas2.webp"); // Level 2 background
    rocketImg = loadImage("images/rocket.png"); // Player rocket

    // Load enemy images
    for (let i = 1; i <= 5; i++) {
        enemyImages.push(loadImage(`images/enemy${i}.png`));
    }

    // Load shooting sound
    shootSound = loadSound("sounds/bulletsound.mp3");
}

// ================= SETUP =================
function setup() {
    createCanvas(windowWidth, windowHeight);
    player = new Player();
    startTime = millis();
}

// ================= MAIN LOOP =================
function draw() {

    // Start screen
    if (gameState === "start") {
        displayStartScreen();
        return;
    }

    // Game over screen
    if (gameState === "gameover") {
        displayGameOverScreen();
        return;
    }

    // Game running
    background(level === 1 ? bg : bg2);

    player.show();
    player.move();

    handleBullets();
    handleEnemies();
    handleExplosions();
    checkCollisions();

    displayScore();
    displayHealth();
    checkLevelProgress();
}

// ================= PLAYER =================
class Player {
    constructor() {
        this.x = width / 2;
        this.y = height - 80;
        this.width = 50;
        this.height = 50;
    }

    // Draw player
    show() {
        image(rocketImg, this.x, this.y, this.width, this.height);
    }

    // Move left/right
    move() {
        if (keyIsDown(LEFT_ARROW) && this.x > 0) this.x -= 5;
        if (keyIsDown(RIGHT_ARROW) && this.x < width - this.width) this.x += 5;
    }
}

// ================= BULLET =================
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 15;
        this.speed = 7;
    }

    show() {
        fill("red");
        rect(this.x, this.y, this.width, this.height);
    }

    move() {
        this.y -= this.speed;
    }
}

// ================= ENEMY =================
class Enemy {
    constructor() {
        this.x = random(50, width - 50);
        this.y = -50;
        this.width = 50;
        this.height = 50;

        // Faster enemies in level 2
        this.speed = level === 1 ? 2 : 4;

        this.type = floor(random(0, 5));
        this.scoreValue = (this.type + 1) * 10;
    }

    show() {
        image(enemyImages[this.type], this.x, this.y, this.width, this.height);
    }

    move() {
        this.y += this.speed;
    }
}

// ================= EXPLOSION =================
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.alpha = 255;
    }

    // Expand and fade
    update() {
        this.size += 2;
        this.alpha -= 10;
    }

    show() {
        noStroke();
        fill(255, 150, 0, this.alpha);
        ellipse(this.x, this.y, this.size);
    }
}

// ================= BULLETS =================
function handleBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].move();
        bullets[i].show();

        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
}

// ================= ENEMIES =================
let lastEnemySpawn = 0;
const enemySpawnDelay = 1000;

function handleEnemies() {
    if (millis() - lastEnemySpawn > enemySpawnDelay) {
        enemies.push(new Enemy());
        lastEnemySpawn = millis();
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].move();
        enemies[i].show();

        if (enemies[i].y > height) {
            enemies.splice(i, 1);
        }
    }
}

// ================= EXPLOSIONS =================
function handleExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].update();
        explosions[i].show();

        if (explosions[i].alpha <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// ================= COLLISIONS =================
function checkCollisions() {

    // Bullet hits enemy
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {

            if (collideRectRect(
                bullets[i].x, bullets[i].y, bullets[i].width, bullets[i].height,
                enemies[j].x, enemies[j].y, enemies[j].width, enemies[j].height
            )) {
                score += enemies[j].scoreValue;

                // Create explosion effect
                explosions.push(new Explosion(enemies[j].x, enemies[j].y));

                bullets.splice(i, 1);
                enemies.splice(j, 1);
                break;
            }
        }
    }

    // Enemy hits player
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (collideRectRect(
            player.x, player.y, player.width, player.height,
            enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height
        )) {
            health--;
            enemies.splice(i, 1);

            if (health <= 0) {
                gameOver();
            }

            break;
        }
    }
}

// ================= SHOOTING =================
let lastShot = 0;
const shotDelay = 300;

function keyPressed() {

    // Start game
    if (gameState === "start" && keyCode === 32) {
        gameState = "play";
        return;
    }

    // Shoot bullet
    if (gameState === "play" && keyCode === 32) {
        if (millis() - lastShot > shotDelay) {
            bullets.push(new Bullet(player.x + player.width / 2 - 2.5, player.y));
            lastShot = millis();

            if (shootSound && shootSound.isLoaded()) {
                shootSound.play();
            }
        }
    }
}

// ================= UI =================

// Display score and level
function displayScore() {
    fill("white");

    // Animated score text
    textSize(24 + sin(frameCount * 0.1) * 2);

    text(`Score: ${score}`, 20, 30);
    text(`Level: ${level}`, 20, 60);
}

// Display health
function displayHealth() {
    textSize(24);
    for (let i = 0; i < health; i++) {
        text("❤️", 20 + i * 30, 90);
    }
}

// ================= LEVEL SYSTEM =================
function checkLevelProgress() {
    let time = (millis() - startTime) / 1000;

    if (level === 1 && score >= 300) {
        level = 2;
        score = 0;
        startTime = millis();
    }

    if (level === 1 && time > 30 && score < 300) {
        gameOver();
    }
}

// ================= SCREENS =================

// Start screen
function displayStartScreen() {
    background(0);
    fill("white");
    textAlign(CENTER);
    textSize(50);
    text("GALAXY ATTACK", width / 2, height / 2 - 50);

    textSize(25);
    text("Press SPACE to Start", width / 2, height / 2 + 20);
}

// Game over screen
function displayGameOverScreen() {
    background(0);
    fill("red");
    textAlign(CENTER);
    textSize(50);
    text("GAME OVER", width / 2, height / 2);

    fill("white");
    textSize(25);
    text("Refresh to Restart", width / 2, height / 2 + 50);
}

// ================= GAME OVER =================
function gameOver() {
    gameState = "gameover";
}

// ================= COLLISION FUNCTION =================
function collideRectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 &&
           x1 + w1 > x2 &&
           y1 < y2 + h2 &&
           y1 + h1 > y2;
}
