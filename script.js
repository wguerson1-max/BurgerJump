const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const rotateMsg = document.getElementById("rotateMsg");

// --------------------
// IMÁGENES
// --------------------
const bg = new Image();
bg.src = "img/fondo.png";

let bgReady = false;

bg.onload = () => {
  bgReady = true;
};

const playerImg = new Image();
playerImg.src = "img/player.png";

const heartImg = new Image();
heartImg.src = "img/corazon.png";

const scoreImg = new Image();
scoreImg.src = "img/score.png";

const bestImg = new Image();
bestImg.src = "img/trophy.png";

// --------------------
// HIGH SCORE
// --------------------
let highScore =
  localStorage.getItem("highScore") || 0;

// --------------------
// TIPOS
// --------------------
const foodTypes = [

  { type: "burger", src: "img/burger.png", points: 10 },

  { type: "pizza", src: "img/pizza.png", points: 6 },

  { type: "fries", src: "img/fries.png", points: 8 },

  { type: "broccoli", src: "img/broccoli.png", damage: 1 },

  { type: "carrot", src: "img/carrot.png", minus: 50 },

  { type: "poison", src: "img/poison.png", kill: true },

  { type: "heart", src: "img/corazon.png", heal: 1 },

  { type: "bacon", src: "img/bacon.png" }

];

const images = {};

foodTypes.forEach(f => {

  const img = new Image();

  img.src = f.src;

  images[f.type] = img;

});

// --------------------
// ESTADO
// --------------------
let player;

let items = [];

let effects = [];

let score = 0;

let lives = 3;

let gameOver = false;

let waitingRestart = false;

// dificultad
let spawnTimer = 0;

let difficulty = 0.6;

let difficultyTimer = 0;

// combo
let lastFoods = [];

// multiplicador
let scoreMultiplier = 1;

let multiplierTimer = 0;

// combo slow
let slowTimer = 0;

let slowMultiplier = 1;

// orientación
let isLocked = true;

// --------------------
// UTIL
// --------------------
function rand(min, max) {

  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;

}

// --------------------
// RESIZE
// --------------------
function resize() {

  canvas.width = window.innerWidth;

  canvas.height = window.innerHeight;

  canvas.style.width =
    window.innerWidth + "px";

  canvas.style.height =
    window.innerHeight + "px";

  if (player) {

    player.y =
      canvas.height - player.h - 10;
  }
}

window.addEventListener(
  "resize",
  resize
);

window.addEventListener(
  "orientationchange",
  () => {

    setTimeout(() => {

      resize();

      checkOrientation();

      hideBrowserBar();

    }, 250);

  }
);

// --------------------
// ORIENTACIÓN
// --------------------
function checkOrientation() {

  const vertical =
    window.innerHeight >
    window.innerWidth;

  rotateMsg.style.display =
    vertical ? "flex" : "none";

  isLocked = vertical;
}

window.addEventListener(
  "load",
  checkOrientation
);

window.addEventListener(
  "resize",
  checkOrientation
);

// --------------------
// FULLSCREEN
// --------------------
function hideBrowserBar() {

  setTimeout(() => {

    window.scrollTo(0, 1);

  }, 100);
}

// --------------------
// INPUT
// --------------------
function action() {

  if (isLocked) return;

  if (
    gameOver &&
    waitingRestart
  ) {

    reset();

    gameOver = false;

    waitingRestart = false;

    return;
  }

  if (!gameOver) {

    player.vy = -18;
  }
}

window.addEventListener(
  "pointerdown",
  action
);

// --------------------
// COLISIÓN
// --------------------
function hit(a, b) {

  return (

    a.x < b.x + b.w &&

    a.x + a.w > b.x &&

    a.y < b.y + b.h &&

    a.y + a.h > b.y

  );
}

// --------------------
// RESET
// --------------------
function reset() {

  player = {

    x: 100,

    y: canvas.height - 80,

    w: 55,

    h: 55,

    vy: 0
  };

  items = [];

  effects = [];

  score = 0;

  lives = 3;

  spawnTimer = 0;

  difficulty = 0.6;

  difficultyTimer = 0;

  lastFoods = [];

  scoreMultiplier = 1;

  multiplierTimer = 0;

  slowTimer = 0;

  slowMultiplier = 1;
}

// --------------------
// SPAWN
// --------------------
function spawn() {

  let f =
    foodTypes[
      rand(0, foodTypes.length - 1)
    ];

  // menos corazones
  if (
    f.type === "heart" &&
    Math.random() > 0.09
  ) {
    return;
  }

  // menos carrot
  if (
    f.type === "carrot" &&
    Math.random() > 0.19
  ) {
    return;
  }

  // menos poison
  if (
    f.type === "poison" &&
    Math.random() > 0.19
  ) {
    return;
  }

  // menos bacon
  if (
    f.type === "bacon" &&
    Math.random() > 0.18
  ) {
    return;
  }

  const lanes = [

    canvas.height - 80,

    canvas.height - 140,

    canvas.height - 200

  ];

  const y =
    lanes[
      rand(0, lanes.length - 1)
    ];

  const spawnX = canvas.width;

  const MIN_DIST = 180;

  for (let i = 0; i < items.length; i++) {

    const it = items[i];

    if (

      Math.abs(it.x - spawnX)
      < MIN_DIST &&

      it.y === y

    ) {

      return;
    }
  }

  items.push({

    x: spawnX,

    y,

    w: 50,

    h: 50,

    type: f.type,

    data: f

  });
}

// --------------------
// UPDATE
// --------------------
function update() {

  if (
    isLocked ||
    gameOver
  ) return;

  // dificultad progresiva
  difficultyTimer++;

  if (difficultyTimer > 300) {

    difficulty += 0.12;

    difficultyTimer = 0;
  }

  if (difficulty > 15) {

    difficulty = 15;
  }

  // bacon timer
  if (multiplierTimer > 0) {

    multiplierTimer--;

    if (multiplierTimer <= 0) {

      scoreMultiplier = 1;
    }
  }

  // combo slow
  if (slowTimer > 0) {

    slowTimer--;

    slowMultiplier = 0.8;

  } else {

    slowMultiplier = 1;
  }

  // spawn
  spawnTimer++;

  const spawnRate =
    rand(30, 90) / difficulty;

  if (spawnTimer > spawnRate) {

    spawn();

    spawnTimer = 0;
  }

  // gravedad
  player.vy += 0.8;

  player.y += player.vy;

  // piso
  if (
    player.y >
    canvas.height - player.h - 10
  ) {

    player.y =
      canvas.height -
      player.h -
      10;

    player.vy = 0;
  }

  // items
  for (
    let i = items.length - 1;
    i >= 0;
    i--
  ) {

    const it = items[i];

    it.x -=
      5 *
      difficulty *
      slowMultiplier;

    // colisión
    if (hit(player, it)) {

      const d = it.data;

      // poison
      if (d.kill) {

        lives = 0;

        gameOver = true;

        waitingRestart = true;

        lastFoods = [];

        effects.push({

          x: it.x,

          y: it.y,

          text: "OUCH!",

          color: "red",

          life: 100

        });
      }

      // heal
      if (d.heal) {

        lives++;

        effects.push({

          x: it.x,

          y: it.y,

          text: "+1",

          color: "pink",

          life: 40

        });
      }

      // puntos positivos
      if (d.points) {

        const pts =
          d.points *
          scoreMultiplier;

        score += pts;

        effects.push({

          x: it.x,

          y: it.y,

          text: "+" + pts,

          color: "lime",

          life: 40

        });

        // combo SOLO comida positiva
        if (

          it.type === "burger" ||

          it.type === "pizza" ||

          it.type === "fries"

        ) {

          lastFoods.push(it.type);

          if (
            lastFoods.length > 3
          ) {

            lastFoods.shift();
          }

        }

        // combo x3
        if (

          lastFoods.length === 3 &&

          lastFoods[0] ===
          lastFoods[1] &&

          lastFoods[1] ===
          lastFoods[2]

        ) {

          score += 30;

          effects.push({

            x: it.x,

            y: it.y,

            text: "SLOW!",

            color: "cyan",

            life: 90

          });

          slowTimer = 600;

          lastFoods = [];
        }
      }

      // broccoli rompe combo
      if (
        it.type === "broccoli"
      ) {

        lives--;

        lastFoods = [];

        effects.push({

          x: it.x,

          y: it.y,

          text: "NO!",

          color: "red",

          life: 40

        });
      }

      // carrot rompe combo
      if (
        it.type === "carrot"
      ) {

        score -= 50;

        if (score < 0) {

          score = 0;
        }

        lastFoods = [];

        effects.push({

          x: it.x,

          y: it.y,

          text: "-50",

          color: "cyan",

          life: 40

        });
      }

      // bacon rompe combo
      if (
        it.type === "bacon"
      ) {

        scoreMultiplier = 2;

        multiplierTimer = 600;

        lastFoods = [];

        effects.push({

          x: it.x,

          y: it.y,

          text: "x2",

          color: "gold",

          life: 40

        });
      }

      items.splice(i, 1);
    }
  }

  // limpiar
  items = items.filter(
    it => it.x > -100
  );

  // high score
  if (lives <= 0) {

    gameOver = true;

    waitingRestart = true;

    if (score > highScore) {

      highScore = score;

      localStorage.setItem(
        "highScore",
        highScore
      );
    }
  }
}

// --------------------
// RENDER
// --------------------
function render() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // fondo
  if (bgReady) {

    const ratio = Math.max(

      canvas.width / bg.width,

      canvas.height / bg.height

    );

    const w = bg.width * ratio;

    const h = bg.height * ratio;

    const x =
      (canvas.width - w) / 2;

    const y =
      (canvas.height - h) / 2;

    ctx.drawImage(
      bg,
      x,
      y,
      w,
      h
    );
  }

  // player
  ctx.drawImage(

    playerImg,

    player.x,

    player.y,

    player.w,

    player.h

  );

  // items
  items.forEach(it => {

    ctx.drawImage(

      images[it.type],

      it.x,

      it.y,

      it.w,

      it.h

    );

  });

  // effects
  effects.forEach(e => {

    e.y -= 1;

    e.life--;

    ctx.globalAlpha =
      e.life / 40;

    ctx.fillStyle =
      e.color || "white";

    ctx.font =
      "22px Arial";

    ctx.shadowBlur = 6;

    ctx.shadowColor = "black";

    ctx.fillText(
      e.text,
      e.x,
      e.y
    );

    ctx.globalAlpha = 1;
  });

  effects =
    effects.filter(
      e => e.life > 0
    );

  // HUD
  ctx.fillStyle = "white";

  ctx.font =
    "20px Arial";

  ctx.shadowColor =
    "black";

  ctx.shadowBlur = 4;

  // score
  ctx.drawImage(
    scoreImg,
    20,
    10,
    30,
    30
  );

  ctx.fillText(
    score,
    60,
    32
  );

  // best
  ctx.drawImage(
    bestImg,
    20,
    45,
    30,
    30
  );

  ctx.fillText(
    highScore,
    60,
    67
  );

  // vidas
  ctx.drawImage(

    heartImg,

    canvas.width - 100,

    10,

    30,

    30

  );

  ctx.fillText(

    lives,

    canvas.width - 60,

    32

  );

  // game over
  if (gameOver) {

    ctx.font =
      "40px Arial";

    ctx.fillStyle =
      "white";

    ctx.fillText(

      "GAME OVER",

      canvas.width / 2 - 120,

      canvas.height / 2

    );
  }
}

// --------------------
// LOOP
// --------------------
function loop() {

  requestAnimationFrame(loop);

  update();

  render();
}

// --------------------
// INIT
// --------------------
window.addEventListener(
  "load",
  () => {

    resize();

    reset();

    checkOrientation();

    hideBrowserBar();

    loop();
  }
);