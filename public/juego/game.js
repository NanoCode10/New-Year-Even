const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let BASE_WIDTH = 800;
let BASE_HEIGHT = 500;
let GROUND_Y = 420;
let PLAYER_SIZE = 44;
let GRAVITY = 0.58;
let JUMP_FORCE = -13.6;
const DASH_COOLDOWN = 42;
const DASH_DURATION = 12;
let PLAYER_START_X = 150;

const player = {
    x: PLAYER_START_X,
    y: GROUND_Y - PLAYER_SIZE,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    vy: 0,
    isJumping: false,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    glowIntensity: 1,
    trail: []
};

const obstaclePatterns = [
    [{ type: 'small', gap: 0 }],
    [{ type: 'wide', gap: 0 }],
    [{ type: 'small', gap: 0 }, { type: 'small', gap: 54 }],
    [{ type: 'tall', gap: 0 }],
    [{ type: 'small', gap: 0 }, { type: 'wide', gap: 84 }],
    [{ type: 'wide', gap: 0 }, { type: 'small', gap: 96 }],
    [{ type: 'small', gap: 0 }, { type: 'small', gap: 52 }, { type: 'wide', gap: 94 }],
    [{ type: 'tall', gap: 0 }, { type: 'small', gap: 106 }],
    [{ type: 'small', gap: 0 }, { type: 'tall', gap: 88 }],
    [{ type: 'wide', gap: 0 }, { type: 'wide', gap: 108 }]
];

let score = 0;
let highScore = 0;
let displayScore = 0;
let gameSpeed = 3.6;
let gameState = 'menu';
let obstacles = [];
let particles = [];
let shockwaves = [];
let scoreBursts = [];
let frameCount = 0;
let shakeAmount = 0;
let screenFlash = 0;
let scorePopScale = 1;
let soundEnabled = true;
let lastScoreTime = 0;
let comboCount = 0;
let comboTimer = 0;
let lastActionTime = 0;
let nextSpawnFrame = 70;
let scheduledPattern = [];
let impactTint = 0;

let audioCtx = null;
let playerSpriteReady = false;

function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
}

const scoreDisplay = document.getElementById('score');
const bestDisplay = document.getElementById('best');
const menuBest = document.getElementById('menu-best');
const menuScreen = document.getElementById('menu');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const newRecordEl = document.getElementById('new-record');
const soundToggle = document.getElementById('sound-toggle');
const comboDisplay = document.getElementById('combo-display');
const actionBtn = document.getElementById('action-btn');
const playerSprite = new Image();

playerSprite.src = 'mascota.png';
playerSprite.onload = () => {
    playerSpriteReady = true;
};

function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = Math.max(1, Math.round(rect.width));
    const displayHeight = Math.max(1, Math.round(rect.height));
    const isCompact = displayWidth <= 640;
    const previousGroundY = GROUND_Y;
    const previousPlayerSize = PLAYER_SIZE;

    BASE_WIDTH = isCompact ? 540 : 800;
    BASE_HEIGHT = isCompact
        ? Math.max(620, Math.round(BASE_WIDTH * (displayHeight / displayWidth)))
        : 500;
    GROUND_Y = isCompact ? BASE_HEIGHT - 86 : 420;
    PLAYER_SIZE = isCompact ? 56 : 44;
    PLAYER_START_X = isCompact ? Math.round(BASE_WIDTH * 0.18) : 150;
    GRAVITY = isCompact ? 0.62 : 0.58;
    JUMP_FORCE = isCompact ? -15.2 : -13.6;

    if (gameState !== 'playing') {
        player.x = PLAYER_START_X;
        player.y = GROUND_Y - PLAYER_SIZE;
        player.width = PLAYER_SIZE;
        player.height = PLAYER_SIZE;
    } else if (previousGroundY !== GROUND_Y || previousPlayerSize !== PLAYER_SIZE) {
        const groundOffset = previousGroundY - (player.y + player.height);
        player.width = PLAYER_SIZE;
        player.height = PLAYER_SIZE;
        player.y = Math.min(player.y, GROUND_Y - PLAYER_SIZE - Math.max(groundOffset, 0));
    }

    canvas.width = Math.round(displayWidth * ratio);
    canvas.height = Math.round(displayHeight * ratio);
    ctx.setTransform(
        (displayWidth * ratio) / BASE_WIDTH,
        0,
        0,
        (displayHeight * ratio) / BASE_HEIGHT,
        0,
        0
    );
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled || !audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch (type) {
        case 'jump':
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
            break;
        case 'land':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
            break;
        case 'dash':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
            break;
        case 'score':
            osc.type = 'sine';
            osc.frequency.setValueAtTime(720 + Math.min(comboCount * 40, 320), now);
            osc.frequency.exponentialRampToValueAtTime(1100, now + 0.07);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
            break;
        case 'milestone':
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.setValueAtTime(760, now + 0.07);
            osc.frequency.setValueAtTime(980, now + 0.14);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
            osc.start(now);
            osc.stop(now + 0.22);
            break;
        case 'death':
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
            break;
    }
}

function createParticles(x, y, color, count, speed, gravity = true) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = speed * (0.45 + Math.random() * 0.7);
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - (gravity ? 2 : 0),
            life: 1,
            color,
            size: Math.random() * 5 + 2,
            gravity
        });
    }
}

function createShockwave(x, y, color, maxRadius) {
    shockwaves.push({
        x,
        y,
        color,
        radius: 8,
        maxRadius,
        life: 1
    });
}

function createScoreBurst(x, y, text, color) {
    scoreBursts.push({
        x,
        y,
        text,
        color,
        life: 1,
        vy: -1.35
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) p.vy += 0.2;
        p.life -= 0.025;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function updateShockwaves() {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const shockwave = shockwaves[i];
        shockwave.radius += 4.5;
        shockwave.life -= 0.05;
        if (shockwave.life <= 0 || shockwave.radius >= shockwave.maxRadius) {
            shockwaves.splice(i, 1);
        }
    }
}

function updateScoreBursts() {
    for (let i = scoreBursts.length - 1; i >= 0; i--) {
        const burst = scoreBursts[i];
        burst.y += burst.vy;
        burst.life -= 0.025;
        if (burst.life <= 0) scoreBursts.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach((p) => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function drawShockwaves() {
    shockwaves.forEach((shockwave) => {
        ctx.save();
        ctx.globalAlpha = shockwave.life * 0.7;
        ctx.strokeStyle = shockwave.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = shockwave.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    });
}

function drawScoreBursts() {
    scoreBursts.forEach((burst) => {
        ctx.save();
        ctx.globalAlpha = burst.life;
        ctx.fillStyle = burst.color;
        ctx.font = 'bold 18px Courier New';
        ctx.textAlign = 'center';
        ctx.shadowColor = burst.color;
        ctx.shadowBlur = 12;
        ctx.fillText(burst.text, burst.x, burst.y);
        ctx.restore();
    });
}

function jump() {
    if (!player.isJumping && !player.isDashing && player.y >= GROUND_Y - player.height - 1) {
        player.vy = JUMP_FORCE;
        player.isJumping = true;
        playSound('jump');
        createParticles(player.x + player.width / 2, player.y + player.height, '#00ffff', 12, 7, false);
        createShockwave(player.x + player.width / 2, player.y + player.height, '#00ffff', 44);
    }
}

function dash() {
    if (player.dashCooldown <= 0 && !player.isDashing) {
        player.isDashing = true;
        player.dashTimer = DASH_DURATION;
        player.dashCooldown = DASH_COOLDOWN;
        player.vy = 0;
        playSound('dash');
        createParticles(player.x + player.width, player.y + player.height / 2, '#ff00ff', 26, 12, false);
        createShockwave(player.x + player.width / 2, player.y + player.height / 2, '#ff00ff', 52);
        shakeAmount = Math.max(shakeAmount, 7);
        impactTint = Math.max(impactTint, 0.22);
    }
}

function handlePrimaryAction() {
    const now = performance.now();

    if (gameState !== 'playing') {
        startGame();
        return;
    }

    if (!player.isJumping && player.y >= GROUND_Y - player.height - 1) {
        jump();
    } else if (!player.isDashing && player.dashCooldown <= 0 && now - lastActionTime > 90) {
        dash();
    }

    lastActionTime = now;
}

function createObstacle(type) {
    const obstacle = {
        x: BASE_WIDTH + 50,
        passed: false,
        glowPhase: Math.random() * Math.PI * 2,
        type
    };

    switch (type) {
        case 'small':
            obstacle.width = 28;
            obstacle.height = 38;
            obstacle.y = GROUND_Y - obstacle.height;
            obstacle.color = '#ff00ff';
            break;
        case 'tall':
            obstacle.width = 22;
            obstacle.height = 75;
            obstacle.y = GROUND_Y - obstacle.height;
            obstacle.color = '#00ff00';
            break;
        case 'wide':
            obstacle.width = 55;
            obstacle.height = 32;
            obstacle.y = GROUND_Y - obstacle.height;
            obstacle.color = '#ffff00';
            break;
    }

    return obstacle;
}

function getPatternPool() {
    if (score < 6) return obstaclePatterns.slice(0, 4);
    if (score < 16) return obstaclePatterns.slice(0, 8);
    return obstaclePatterns;
}

function getSpawnInterval() {
    if (score < 5) return 74;
    if (score < 12) return 66;
    if (score < 24) return 56;
    return 50;
}

function scheduleNextPattern() {
    const pool = getPatternPool();
    const pattern = pool[Math.floor(Math.random() * pool.length)];
    const pacingGap = getSpawnInterval() + Math.floor(Math.random() * 18);

    scheduledPattern = pattern.map((entry) => ({
        ...entry
    }));

    nextSpawnFrame = frameCount + pacingGap;
}

function syncPlayLayout() {
    document.body.classList.toggle('game-playing', gameState === 'playing');
}

function updateObstacles() {
    if (frameCount > 30 && scheduledPattern.length === 0 && frameCount >= nextSpawnFrame) {
        scheduleNextPattern();
    }

    if (scheduledPattern.length > 0 && frameCount >= nextSpawnFrame) {
        const nextEntry = scheduledPattern.shift();
        obstacles.push(createObstacle(nextEntry.type));

        if (scheduledPattern.length === 0) {
            nextSpawnFrame = frameCount + getSpawnInterval();
        } else {
            nextSpawnFrame = frameCount + scheduledPattern[0].gap;
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.x -= gameSpeed;
        obstacle.glowPhase += 0.1;

        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function circleRectCollision(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy < circle.radius * circle.radius;
}

function checkCollisions() {
    if (player.isDashing) return false;

    const circle = {
        x: player.x + player.width / 2,
        y: player.y + player.height / 2 + 2,
        radius: player.width * 0.32
    };

    for (const obstacle of obstacles) {
        if (circleRectCollision(circle, obstacle)) {
            return true;
        }
    }

    return false;
}

function updateComboDisplay() {
    if (comboCount > 1 && comboTimer > 0) {
        comboDisplay.textContent = `x${comboCount} FLOW`;
        comboDisplay.classList.remove('combo-hidden');
        comboDisplay.classList.add('combo-active');
    } else {
        comboDisplay.classList.remove('combo-active');
        comboDisplay.classList.add('combo-hidden');
    }
}

function awardScore(obstacle) {
    score++;

    if (score > 1 && Date.now() - lastScoreTime < 1100) {
        comboCount++;
    } else {
        comboCount = 1;
    }

    comboTimer = 90;
    lastScoreTime = Date.now();

    const milestone = comboCount >= 5 || score % 10 === 0;
    playSound(milestone ? 'milestone' : 'score');

    if (score % 6 === 0) {
        gameSpeed += 0.24;
    }

    player.glowIntensity = milestone ? 2.6 : 1.6;
    scorePopScale = milestone ? 1.38 : 1.18;
    shakeAmount = Math.max(shakeAmount, milestone ? 5 : 2);
    impactTint = Math.max(impactTint, milestone ? 0.18 : 0.08);

    createParticles(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.color, milestone ? 20 : 12, milestone ? 8 : 5, false);
    createShockwave(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.color, milestone ? 42 : 28);
    createScoreBurst(
        obstacle.x + obstacle.width / 2,
        obstacle.y - 12,
        score % 10 === 0 ? `+1 x${comboCount} BOOST` : comboCount > 1 ? `+1 x${comboCount}` : '+1',
        milestone ? '#ffff66' : '#7efcff'
    );

    updateComboDisplay();
}

function triggerGameOver() {
    gameState = 'over';
    syncPlayLayout();
    shakeAmount = 20;
    screenFlash = 1;
    impactTint = 0.3;
    playSound('death');

    createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ff0000', 60, 18);
    createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ff4444', 40, 12);
    createShockwave(player.x + player.width / 2, player.y + player.height / 2, '#ff3355', 80);

    finalScoreEl.textContent = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonDashBest', highScore);
        newRecordEl.style.display = 'block';
        bestDisplay.textContent = highScore;
        menuBest.textContent = highScore;
    } else {
        newRecordEl.style.display = 'none';
    }

    updateComboDisplay();
    setTimeout(() => gameOverScreen.classList.add('active'), 260);
}

function resetGame() {
    player.x = PLAYER_START_X;
    player.y = GROUND_Y - PLAYER_SIZE;
    player.vy = 0;
    player.isJumping = false;
    player.isDashing = false;
    player.dashTimer = 0;
    player.dashCooldown = 0;
    player.glowIntensity = 1;
    player.trail = [];

    score = 0;
    displayScore = 0;
    gameSpeed = 3.6;
    obstacles = [];
    particles = [];
    shockwaves = [];
    scoreBursts = [];
    frameCount = 0;
    shakeAmount = 0;
    screenFlash = 0;
    comboCount = 0;
    comboTimer = 0;
    lastScoreTime = 0;
    lastActionTime = 0;
    nextSpawnFrame = 70;
    scheduledPattern = [];
    impactTint = 0;

    scoreDisplay.textContent = '0';
    scoreDisplay.style.transform = 'scale(1)';
    updateComboDisplay();
}

function startGame() {
    initAudio();
    gameState = 'playing';
    syncPlayLayout();
    resizeCanvas();
    resetGame();
    menuScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
}

function update() {
    frameCount++;

    displayScore += (score - displayScore) * 0.22;
    scoreDisplay.textContent = Math.round(displayScore);

    if (screenFlash > 0) screenFlash *= 0.85;
    if (shakeAmount > 0.3) shakeAmount *= 0.88;
    if (impactTint > 0.01) impactTint *= 0.86;

    if (player.glowIntensity > 1) {
        player.glowIntensity -= 0.05;
        if (player.glowIntensity < 1) player.glowIntensity = 1;
    }

    if (scorePopScale > 1) {
        scorePopScale -= 0.08;
        if (scorePopScale < 1) scorePopScale = 1;
    }

    scoreDisplay.style.transform = `scale(${scorePopScale})`;

    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0 && comboCount > 1) {
            comboCount = 0;
            updateComboDisplay();
        }
    }

    updateParticles();
    updateShockwaves();
    updateScoreBursts();

    if (gameState !== 'playing') {
        return;
    }

    if (player.dashCooldown > 0) player.dashCooldown--;

    if (player.isDashing) {
        player.dashTimer--;
        player.trail.unshift({ x: player.x, y: player.y, alpha: 1 });
        if (player.trail.length > 9) player.trail.pop();
        if (player.dashTimer <= 0) player.isDashing = false;
    }

    player.trail.forEach((trailPiece) => {
        trailPiece.alpha -= 0.15;
    });
    player.trail = player.trail.filter((trailPiece) => trailPiece.alpha > 0);

    player.vy += GRAVITY;
    player.y += player.vy;

    if (player.y >= GROUND_Y - player.height) {
        if (player.isJumping) {
            playSound('land');
            createParticles(player.x + player.width / 2, GROUND_Y, '#00ffff', 6, 4);
            createShockwave(player.x + player.width / 2, GROUND_Y, '#00ffff', 32);
            shakeAmount = Math.max(shakeAmount, 3);
            impactTint = Math.max(impactTint, 0.08);
        }
        player.y = GROUND_Y - player.height;
        player.vy = 0;
        player.isJumping = false;
    }

    updateObstacles();

    for (const obstacle of obstacles) {
        if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
            obstacle.passed = true;
            awardScore(obstacle);
        }
    }

    if (checkCollisions()) {
        triggerGameOver();
    }
}

function drawPlayer() {
    player.trail.forEach((trailPiece, index) => {
        drawPlayerSprite(trailPiece.x, trailPiece.y, trailPiece.alpha * 0.24, '#ff00ff', 16 - index);
    });

    const glow = player.isDashing ? '#ff00ff' : '#00ffff';
    const intensity = player.isDashing ? 38 : 14 * player.glowIntensity;

    drawPlayerSprite(player.x, player.y, 1, glow, intensity);
}

function drawPlayerSprite(x, y, alpha, glowColor, glowBlur) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;

    if (playerSpriteReady) {
        ctx.drawImage(playerSprite, x, y, player.width, player.height);
    } else {
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(x + player.width / 2, y + player.height / 2, player.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    ctx.save();
    ctx.globalAlpha = Math.max(alpha * 0.85, 0.3);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = player.isDashing ? 3 : 2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = Math.max(glowBlur * 0.45, 7);
    ctx.beginPath();
    ctx.arc(x + player.width / 2, y + player.height / 2, player.width / 2 + 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawObstacles() {
    obstacles.forEach((obstacle) => {
        const pulse = 0.7 + Math.sin(obstacle.glowPhase) * 0.3;
        ctx.shadowColor = obstacle.color;
        ctx.shadowBlur = 12 * pulse;
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        ctx.strokeStyle = `rgba(255,255,255,${0.4 + pulse * 0.3})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x + 2, obstacle.y + 2, obstacle.width - 4, obstacle.height - 4);

        ctx.shadowBlur = 0;
    });
}

function drawCooldownBar() {
    if (player.dashCooldown > 0 && gameState === 'playing') {
        const barWidth = 48;
        const barHeight = 5;
        const x = player.x + player.width / 2 - barWidth / 2;
        const y = player.y - 14;
        const progress = 1 - player.dashCooldown / DASH_COOLDOWN;

        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 5;
        ctx.fillRect(x, y, barWidth * progress, barHeight);
        ctx.shadowBlur = 0;
    }
}

function drawGround() {
    const lightTheme = isLightTheme();
    const groundColor = lightTheme ? '#0f98ba' : '#00ffff';

    ctx.strokeStyle = groundColor;
    ctx.shadowColor = groundColor;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(BASE_WIDTH, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = lightTheme ? 'rgba(15, 152, 186, 0.06)' : 'rgba(0, 255, 255, 0.05)';
    ctx.fillRect(0, GROUND_Y, BASE_WIDTH, BASE_HEIGHT - GROUND_Y);
    ctx.shadowBlur = 0;
}

function drawBackground() {
    const lightTheme = isLightTheme();
    const backgroundDrift = lightTheme ? 0.11 : 0.3;
    const gradient = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
    gradient.addColorStop(0, lightTheme ? '#fffdfd' : '#070913');
    gradient.addColorStop(1, lightTheme ? '#eef7fb' : '#170b26');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    const gridOffset = (frameCount * backgroundDrift) % 40;
    ctx.strokeStyle = lightTheme ? 'rgba(15, 152, 186, 0.08)' : 'rgba(0, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = -gridOffset; x < BASE_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, BASE_HEIGHT);
        ctx.stroke();
    }
    for (let y = -gridOffset; y < BASE_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(BASE_WIDTH, y);
        ctx.stroke();
    }

    for (let i = 0; i < 30; i++) {
        const x = (i * 73 + frameCount * backgroundDrift) % BASE_WIDTH;
        const y = (i * 47) % BASE_HEIGHT;
        const twinkle = 0.28 + Math.sin(frameCount * 0.05 + i) * 0.3;
        ctx.fillStyle = lightTheme
            ? `rgba(15, 23, 45,${twinkle * 0.35})`
            : `rgba(255,255,255,${twinkle})`;
        ctx.fillRect(x, y, 2, 2);
    }

    if (impactTint > 0.01) {
        ctx.fillStyle = `rgba(255, 0, 255, ${impactTint * 0.35})`;
        ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    }
}

function draw() {
    ctx.save();

    if (shakeAmount > 0.5) {
        ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
    }

    drawBackground();
    drawGround();
    drawShockwaves();
    drawObstacles();
    drawPlayer();
    drawCooldownBar();
    drawParticles();
    drawScoreBursts();

    if (screenFlash > 0.05) {
        ctx.fillStyle = `rgba(255, 0, 0, ${screenFlash * 0.4})`;
        ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    }

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handlePrimaryAction();
    }

    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        if (gameState === 'playing') dash();
    }

    if (e.code === 'KeyR' && (gameState === 'over' || gameState === 'playing')) {
        startGame();
    }
});

canvas.addEventListener('click', () => {
    handlePrimaryAction();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handlePrimaryAction();
}, { passive: false });

actionBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handlePrimaryAction();
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (gameState === 'playing') dash();
});

soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    menuScreen.classList.add('active');
    gameState = 'menu';
    syncPlayLayout();
});

window.addEventListener('resize', resizeCanvas);

highScore = parseInt(localStorage.getItem('neonDashBest'), 10) || 0;
menuBest.textContent = highScore;
bestDisplay.textContent = highScore;
resizeCanvas();
updateComboDisplay();
syncPlayLayout();
gameLoop();
