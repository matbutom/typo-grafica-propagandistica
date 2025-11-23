// =========================================================
// sketch.js: Intervención Generativa de Afiches (Versión Estilizada + Bachelet Pixelada)
// =========================================================

const OBRAS_CONFIG = [
  {
    name: "Allende",
    posterPath:
      "../poster_dataset/afiches_partidos_políticos_chilenos/afiche_afiches_partidos_politicos_chilenos_039.jpg",
    titleString: "ALLENDE",
    titleX: 0,
    titleY: 1280,
    letterWidth: 160,
    letterHeight: 290,
    letterSpacing: 0,
  },
  {
    name: "Pinochet",
    posterPath: "../poster_dataset/sipinochet.png",
    titleString: "PINOCHET",
    titleX: 60,
    titleY: 1100,
    letterWidth: 100,
    letterHeight: 140,
    letterSpacing: 5,
  },
  {
    name: "Bachelet",
    posterPath: "../poster_dataset/bacheletafiche.jpg",
    titleString: "BACHELET",
    titleX: 100,
    titleY: 1150,
    letterWidth: 120,
    letterHeight: 160,
    letterSpacing: 5,
  },
];

// =========================================================
// 🌐 VARIABLES GLOBALES
// =========================================================
const LATENT_DIM = 64;
const IMG_SIZE = 64;
const MODEL_BASE_URL = "../tfjs_models_final";

let currentObraIndex = getInitialObraIndex();
let currentObra;
let posterImg;
let generativeLetters = [];
let loadedModels = new Map();
let posterBgColor;
let sampledBlue = null;
window.setupExecuted = false;

// =========================================================
// 🔧 FUNCIONES DE UTILIDAD
// =========================================================
function getInitialObraIndex() {
  const storedIndex = sessionStorage.getItem("selectedObraIndex");
  if (storedIndex !== null && !isNaN(storedIndex)) {
    return parseInt(storedIndex, 10);
  }
  return 0;
}

function loadObraConfig(obra) {
  currentObra = obra;
  posterImg = loadImage(
    currentObra.posterPath,
    () => {
      console.log(`Obra cargada: ${currentObra.name}`);
      posterImg.loadPixels();

      posterBgColor = posterImg.get(20, 20);
      console.log("🟡 Fondo muestreado:", posterBgColor);

      if (currentObra.name === "Pinochet") {
        const sampleX = 800;
        const sampleY = 500;
        sampledBlue = posterImg.get(sampleX, sampleY);
        console.log("🔵 Azul muestreado del SI:", sampledBlue);
      }
    },
    (e) => console.error("Error al cargar el afiche:", e)
  );
}

window.reloadObra = function () {
  const selectElement = document.getElementById("obra-select");
  if (!selectElement) return;

  const newIndex = parseInt(selectElement.value, 10);
  if (newIndex !== currentObraIndex) {
    sessionStorage.setItem("selectedObraIndex", newIndex);
    window.location.reload();
  }
};

function initializeSelector() {
  const selector = document.getElementById("obra-select");
  if (!selector) return;

  selector.innerHTML = "";
  OBRAS_CONFIG.forEach((obra, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = obra.name;
    selector.appendChild(option);
  });
  selector.value = currentObraIndex;
}

// =========================================================
// 🧠 CICLO P5.JS
// =========================================================
function preload() {
  loadObraConfig(OBRAS_CONFIG[currentObraIndex]);
}

async function setup() {
  initializeSelector();
  createCanvas(posterImg.width, posterImg.height);
  noSmooth();
  window.setupExecuted = true;

  await tf.ready();
  await loadGenerativeTitle();
  console.log("✅ Título generativo cargado.");
}

function draw() {
  image(posterImg, 0, 0, width, height);

  if (currentObra.name === "Bachelet") {
    renderBacheletPixelated(); // 👈 efecto especial solo para esta obra
    return;
  }

  let currentX = currentObra.titleX;
  for (const letter of generativeLetters) {
    letter.update();
    image(
      letter.canvas,
      currentX,
      currentObra.titleY,
      currentObra.letterWidth,
      currentObra.letterHeight
    );
    currentX += currentObra.letterWidth + currentObra.letterSpacing;
  }
}

// =========================================================
// 🧬 CARGA DE MODELOS
// =========================================================
async function loadGenerativeTitle() {
  const lettersNeeded = [...new Set(currentObra.titleString.split(""))];

  for (const letter of lettersNeeded) {
    if (!loadedModels.has(letter)) {
      const modelPath = `${MODEL_BASE_URL}/decoder_${letter.toUpperCase()}/model.json`;
      try {
        const model = await tf.loadGraphModel(modelPath);
        loadedModels.set(letter, model);
      } catch (e) {
        console.error(`Error al cargar modelo para ${letter}:`, e);
      }
    }
  }

  generativeLetters = [];
  for (const char of currentObra.titleString.split("")) {
    const model = loadedModels.get(char);
    if (model) generativeLetters.push(new GenerativeLetter(model));
    else console.warn(`No se pudo crear la letra ${char}`);
  }
}

// =========================================================
// ✳️ CLASE DE LETRA GENERATIVA
// =========================================================
class GenerativeLetter {
  constructor(decoder) {
    this.decoder = decoder;
    this.latentVector = new Array(LATENT_DIM).fill(0);
    this.noiseOffset = random(1000);
    this.canvas = createGraphics(IMG_SIZE, IMG_SIZE);
    this.canvas.setAttributes("willReadFrequently", true);
  }

  update() {
    this.noiseOffset += 0.02;
    for (let i = 0; i < LATENT_DIM; i++) {
      this.latentVector[i] = map(
        noise(this.noiseOffset + i * 0.1),
        0,
        1,
        -5,
        5
      );
    }
    this.generate();
  }

  async generate() {
    const z_tensor = tf.tensor2d([this.latentVector]);
    try {
      const result_tensor = this.decoder.predict(z_tensor);
      const pixelData = await result_tensor.data();

      this.canvas.clear();
      this.canvas.loadPixels();

      const threshold = 127.5;
      let index = 0;

      for (let y = 0; y < IMG_SIZE; y++) {
        for (let x = 0; x < IMG_SIZE; x++) {
          const grayValue = pixelData[index] * 255;
          let finalColor;

          if (currentObra.name === "Pinochet") {
            if (grayValue > threshold) {
              finalColor = color("#1f538b");
            } else {
              finalColor = color(255, 255, 255, 0);
            }
          } else if (currentObra.name === "Allende") {
            if (grayValue > threshold) {
              finalColor = color(0);
            } else {
              finalColor = color(posterBgColor);
            }
          } else if (currentObra.name === "Bachelet") {
            // las letras se usan para pixelado, no render individual
            if (grayValue > threshold) {
              finalColor = color(255);
            } else {
              finalColor = color(255, 255, 255, 0);
            }
          }

          this.canvas.set(x, y, finalColor);
          index++;
        }
      }

      this.canvas.updatePixels();
      tf.dispose([z_tensor, result_tensor]);
    } catch (e) {
      tf.dispose([z_tensor]);
    }
  }
}
// =========================================================
// 🧩 MOSAICO GENERATIVO DE BACHELET
// (Todas las letras + menos densidad + optimización)
// =========================================================

let bacheletBuffer;
let bacheletGrid = [];

const pixelSize = 25;        // 🔹 tamaño de celda: más grande → menos carga
const updateFraction = 0.004; // 🔹 menos actualizaciones por frame
const latentDrift = 0.02;
const contrastMode = "adaptive";
const breathDuration = 15000;
let lastCycleTime = 0;

function renderBacheletPixelated() {
  // 1️⃣ crear mosaico inicial
  if (!bacheletBuffer) {
    console.log("🧱 Generando mosaico inicial de Bachelet (opt.)...");
    posterImg.loadPixels();
    bacheletBuffer = createGraphics(posterImg.width, posterImg.height);

    // 🔸 combinar TODAS las letras generativas cargadas
    const allLetters = Array.from(loadedModels.values()).map(
      (decoder) => new GenerativeLetter(decoder)
    );

    for (let y = 0; y < posterImg.height; y += pixelSize) {
      for (let x = 0; x < posterImg.width; x += pixelSize) {
        const baseColor = posterImg.get(x, y);
        const letter = random(allLetters);
        if (!letter) continue;

        const latentVector = new Array(LATENT_DIM)
          .fill(0)
          .map(() => random(-2, 2));

        bacheletGrid.push({
          x,
          y,
          c: baseColor,
          letter,
          latentVector,
          offset: random(1000),
          visible: true,
        });

        letter.latentVector = latentVector;
        letter.generate();
      }
    }
    console.log("✅ Mosaico inicial listo (" + bacheletGrid.length + " celdas)");
  }

  // 2️⃣ controlar fases del ciclo respiratorio
  const elapsed = millis() - lastCycleTime;
  const cycleProgress = constrain(elapsed / breathDuration, 0, 1);
  const phase = cycleProgress < 0.5 ? "fadeOut" : "fadeIn";
  const progress = cycleProgress < 0.5
    ? map(cycleProgress, 0, 0.5, 0, 1)
    : map(cycleProgress, 0.5, 1, 0, 1);

  image(posterImg, 0, 0, width, height); // fondo base

  // 3️⃣ actualizar deriva del espacio latente
  const updatesPerFrame = int(bacheletGrid.length * updateFraction);
  for (let i = 0; i < updatesPerFrame; i++) {
    const cell = random(bacheletGrid);
    const { letter, latentVector } = cell;

    for (let j = 0; j < LATENT_DIM; j++) {
      latentVector[j] += map(
        noise(cell.offset + frameCount * 0.001 + j * 0.01),
        0,
        1,
        -latentDrift,
        latentDrift
      );
      latentVector[j] = constrain(latentVector[j], -3, 3);
    }

    letter.latentVector = latentVector;
    letter.generate();
  }

  // 4️⃣ desvanecimiento granular (por celdas)
  const totalCells = bacheletGrid.length;
  const cellsPerStep = int(totalCells * 0.008); // 🔹 un poco menos por frame

  if (phase === "fadeOut") {
    for (let i = 0; i < cellsPerStep; i++) {
      const cell = random(bacheletGrid);
      if (cell.visible && random() < progress) cell.visible = false;
    }
  } else {
    for (let i = 0; i < cellsPerStep; i++) {
      const cell = random(bacheletGrid);
      if (!cell.visible && random() < progress) cell.visible = true;
    }
  }

  // 5️⃣ dibujar letras visibles con su color ajustado
  noTint();
  for (const cell of bacheletGrid) {
    if (!cell.visible) continue;
    const adjustedColor = adjustLetterColor(cell.c, contrastMode);
    push();
    tint(adjustedColor);
    image(cell.letter.canvas, cell.x, cell.y, pixelSize, pixelSize);
    pop();
  }

  // 6️⃣ regeneración parcial al final del ciclo
  if (elapsed > breathDuration) {
    console.log("🔁 Regeneración parcial (nuevo ciclo)");
    lastCycleTime = millis();

    const renewCount = int(bacheletGrid.length * 0.15); // 🔹 solo 15% cambia
    for (let i = 0; i < renewCount; i++) {
      const cell = random(bacheletGrid);
      const { letter } = cell;
      cell.latentVector = new Array(LATENT_DIM)
        .fill(0)
        .map(() => random(-2, 2));
      cell.offset = random(1000);
      letter.latentVector = cell.latentVector;
      letter.generate();
    }
  }
}

// =========================================================
// 🎨 AJUSTE DE COLOR CON CONTRASTE ADAPTATIVO
// =========================================================
function adjustLetterColor(baseColor, mode = "adaptive") {
  const r = red(baseColor);
  const g = green(baseColor);
  const b = blue(baseColor);
  const brightness = (r + g + b) / 3;

  if (mode === "adaptive") {
    const factor = brightness > 128 ? 0.55 : 1.4;
    return color(
      constrain(r * factor, 0, 255),
      constrain(g * factor, 0, 255),
      constrain(b * factor, 0, 255)
    );
  }

  return baseColor;
}
 