// =========================================================
// Abecedario Mutante — sketch.js
// Grilla A–Z controlada por MIDI (LaunchControl XL)
// + transmite vector latente a localStorage (monitor)
// + abre monitor_latente/monitor.html en pestaña aparte
// =========================================================


// =========================================================
// MIDI CONTROL — CC 13–20 modifican bloques del vector latente
// =========================================================

let perillasRaw = {};
let perillasMap = {};

// inicializamos CC 13–20
for (let cc = 13; cc <= 20; cc++) {
  perillasRaw[cc] = 0;
  perillasMap[cc] = 0;
}

async function initMIDI() {
  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });
    access.inputs.forEach(input => {
      input.onmidimessage = handleMIDI;
    });
  } catch (err) {
    console.error("Error MIDI:", err);
  }
}

function mapearMIDLatente(v) {
  return (v / 127) * 10 - 5; // 0–127 → -5..+5
}

function handleMIDI(message) {
  const [status, cc, value] = message.data;

  if (status !== 176) return;
  if (cc >= 13 && cc <= 20) {
    perillasRaw[cc] = value;
    perillasMap[cc] = mapearMIDLatente(value);
  }
}


// =========================================================
// CONFIG MODELOS + LATENTE
// =========================================================

const LATENT_DIM = 64;
const IMG_SIZE = 64;

const MODEL_BASE = "../tfjs_models_final";

const MONITOR_URL = "../monitor_latente/monitor.html";
let monitorWin = null;

function openMonitor() {
  if (monitorWin && !monitorWin.closed) {
    monitorWin.focus();
    return;
  }
  monitorWin = window.open(MONITOR_URL, "monitor-latente");
}

// Modelos disponibles por ahora
const AVAILABLE_MODELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

function modeloParaIndice(i) {
  return AVAILABLE_MODELS[i % AVAILABLE_MODELS.length];
}

const NUM_CELLS = 26; // A–Z
let globalLatentVector = new Array(LATENT_DIM).fill(0);


// =========================================================
// ACTUALIZAR VECTOR LATENTE SEGÚN PERILLAS
// =========================================================

function updateLatentVector() {
  const bloques = [
    [0, 7, 13],
    [8, 15, 14],
    [16, 23, 15],
    [24, 31, 16],
    [32, 39, 17],
    [40, 47, 18],
    [48, 55, 19],
    [56, 63, 20]
  ];

  bloques.forEach(([ini, fin, cc]) => {
    const valor = perillasMap[cc];
    for (let i = ini; i <= fin; i++) {
      globalLatentVector[i] = valor;
    }
  });
}


// =========================================================
// CREAR GRILLA A–Z
// =========================================================
// Esta función reemplaza por completo tu antiguo grid-container
// y ahora genera una grilla HORIZONTAL y SIMÉTRICA como pediste.
// El HTML debe tener:
// <div id="letters-grid"></div>
// =========================================================

function createGrid() {
  const grid = document.getElementById("letters-grid");
  grid.innerHTML = "";

  for (let i = 0; i < NUM_CELLS; i++) {
    const cell = document.createElement("div");
    cell.className = "letter-cell";
    grid.appendChild(cell);

    new p5((s) => {
      s.setup = () => {
        s.createCanvas(IMG_SIZE, IMG_SIZE);
        s.noSmooth();
      };

      s.draw = async () => {
        updateLatentVector();
        await drawLetter(s, globalLatentVector, allModels[i]);

        if (i === 0) {
          try {
            localStorage.setItem(
              "live_latent_vector_z",
              JSON.stringify(globalLatentVector)
            );
          } catch (e) {}
        }
      };
    }, cell);
  }
}


// =========================================================
// MAIN — carga modelos y arma grilla
// =========================================================

let allModels = [];

async function main() {
  initMIDI();
  await tf.ready();
  console.log("TensorFlow.js listo");

  openMonitor();

  const letters = [];
  for (let i = 65; i <= 90; i++) letters.push(String.fromCharCode(i));

  const selectedModels = letters.map((_, i) => modeloParaIndice(i));

  const modelPromises = selectedModels.map(letter =>
    tf.loadGraphModel(`${MODEL_BASE}/decoder_${letter}/model.json`)
  );

  try {
    allModels = await Promise.all(modelPromises);
  } catch (err) {
    console.error("Error cargando modelos:", err);
    return;
  }

  createGrid();
}


// =========================================================
// RENDER DE UNA LETRA (gris)
// =========================================================

async function drawLetter(s, z, decoder) {
  const zTensor = tf.tensor2d([z]);

  try {
    const result = decoder.predict(zTensor);
    const data = await result.data();

    s.background(255);
    s.loadPixels();

    let p = 0;
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        const gray = data[p] * 255;
        const tone = gray > 127 ? 70 : 220;

        s.set(x, y, s.color(tone));
        p++;
      }
    }

    s.updatePixels();
    tf.dispose([zTensor, result]);

  } catch (err) {
    tf.dispose(zTensor);
    console.error("Error en drawLetter:", err);
  }
}


// =========================================================
// arrancamos
// =========================================================

main();
