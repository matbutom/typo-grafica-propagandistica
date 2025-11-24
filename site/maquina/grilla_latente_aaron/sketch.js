// =========================================================
// Abecedario Mutante — sketch.js (CARGA PROGRESIVA)
// =========================================================

// --- CONFIGURACIÓN ---
const LATENT_DIM = 64;
const IMG_SIZE = 64;
const MODEL_BASE = "../tfjs_models_final"; 
const MONITOR_URL = "../monitor_latente/monitor.html";

// --- ESTADO GLOBAL ---
let globalLatentVector = new Array(LATENT_DIM).fill(0);

// Inicializamos el array con NULL para saber qué letras faltan
const AVAILABLE_MODELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let allModels = new Array(AVAILABLE_MODELS.length).fill(null);

let canvasContexts = []; 
let lastLatentString = ""; 
let isMidiActive = false;

// --- MIDI CONTROL (Launch Control XL) ---
const CC_RANGES = [
  { start: 13, end: 20, type: "KNOBS_TOP" }, 
  { start: 29, end: 36, type: "KNOBS_MID" }, 
  { start: 49, end: 56, type: "KNOBS_BOT" }, 
  { start: 77, end: 84, type: "FADERS"    }  
];

let perillasRaw = {};
let perillasMap = {};

// Inicializar memoria de perillas
CC_RANGES.forEach(range => {
  for (let cc = range.start; cc <= range.end; cc++) {
    perillasRaw[cc] = 0;
    perillasMap[cc] = 0;
  }
});

async function initMIDI() {
  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });
    if (access.inputs.size > 0) {
        console.log("🎹 MIDI detectado: Launch Control XL");
        access.inputs.forEach(input => {
            input.onmidimessage = handleMIDI;
        });
        isMidiActive = true;
    }
  } catch (err) {
    console.error("Error MIDI:", err);
  }
}

function mapearMIDLatente(v) {
  return (v / 127) * 10 - 5; 
}

function handleMIDI(message) {
  const [status, cc, value] = message.data;
  const isValidCC = CC_RANGES.some(r => cc >= r.start && cc <= r.end);

  if ((status >= 176 && status <= 191) && isValidCC) {
    perillasRaw[cc] = value;
    perillasMap[cc] = mapearMIDLatente(value);
    
    // Forzamos actualización visual inmediata al mover perilla
    updateLatentVector();
    // Reset para que el loop detecte el cambio y dibuje
    lastLatentString = ""; 
  }
}

function updateLatentVector() {
  let globalIndex = 0; 
  CC_RANGES.forEach(range => {
    for (let cc = range.start; cc <= range.end; cc++) {
      const valor = perillasMap[cc];
      if (globalIndex < LATENT_DIM) globalLatentVector[globalIndex] = valor;
      if (globalIndex + 1 < LATENT_DIM) globalLatentVector[globalIndex + 1] = valor;
      globalIndex += 2; 
    }
  });
  
  try {
      localStorage.setItem("live_latent_vector_z", JSON.stringify(globalLatentVector));
  } catch (e) {}
}

// --- CARGA DE MODELOS (ASÍNCRONA Y UNO POR UNO) ---

async function loadModels() {
    console.log("🚀 Iniciando carga progresiva de modelos...");

    // No usamos Promise.all para no bloquear.
    // Lanzamos la carga de cada uno y cuando termine, se guarda en su posición.
    AVAILABLE_MODELS.forEach(async (letter, index) => {
        try {
            // Carga individual
            const model = await tf.loadGraphModel(`${MODEL_BASE}/decoder_${letter}/model.json`);
            
            // Guardamos el modelo en el array global en cuanto esté listo
            allModels[index] = model;
            
            console.log(`✅ Letra ${letter} cargada (${index+1}/26)`);
            
            // Forzamos un redibujado inmediato para que aparezca "pop"
            lastLatentString = ""; 

        } catch (err) {
            console.error(`❌ Falló carga de ${letter}:`, err);
        }
    });
}

// --- CREACIÓN DE LA GRILLA ---

function createGrid() {
  const grid = document.getElementById("letters-grid");
  if (!grid) return;
  
  grid.innerHTML = "";
  canvasContexts = [];

  for (let i = 0; i < AVAILABLE_MODELS.length; i++) {
    const cell = document.createElement("div");
    cell.className = "letter-cell";
    
    const cvs = document.createElement("canvas");
    cvs.width = IMG_SIZE;
    cvs.height = IMG_SIZE;
    // Estilo pixelado
    cvs.style.imageRendering = "pixelated"; 
    
    cell.appendChild(cvs);
    grid.appendChild(cell);

    const ctx = cvs.getContext("2d");
    
    // Configuración de texto para el "Cargando..."
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const imgData = ctx.createImageData(IMG_SIZE, IMG_SIZE);
    canvasContexts.push({ ctx, imgData, letter: AVAILABLE_MODELS[i] });
  }
}

// --- BUCLE DE RENDERIZADO ---

async function drawAllLetters() {
    const zTensor = tf.tensor2d([globalLatentVector]);
    
    // Iteramos sobre las casillas
    for(let i=0; i < canvasContexts.length; i++) {
        const { ctx, imgData, letter } = canvasContexts[i];
        const model = allModels[i];

        // 1. SI EL MODELO NO HA CARGADO AÚN: DIBUJAR "LOADING"
        if (!model) {
            // Fondo gris claro
            ctx.fillStyle = "#eee";
            ctx.fillRect(0, 0, IMG_SIZE, IMG_SIZE);
            // Texto parpadeante (simple)
            ctx.fillStyle = "#999";
            ctx.fillText(letter, IMG_SIZE/2, IMG_SIZE/2 - 5);
            ctx.font = "8px sans-serif";
            ctx.fillText("...", IMG_SIZE/2, IMG_SIZE/2 + 8);
            continue; // Pasamos a la siguiente letra
        }

        // 2. SI EL MODELO YA EXISTE: PREDECIR Y DIBUJAR
        // Hacemos tidy por cada letra para evitar picos de memoria si son muchas
        tf.tidy(() => {
            const prediction = model.predict(zTensor);
            const data = prediction.dataSync(); // Síncrono rápido para 64x64

            const pixels = imgData.data; 
            for (let j = 0; j < data.length; j++) {
                const val = data[j] * 255; 
                // Umbral (Threshold)
                const tone = val > 127 ? 20 : 230; 

                const idx = j * 4;
                pixels[idx] = tone;     // R
                pixels[idx + 1] = tone; // G
                pixels[idx + 2] = tone; // B
                pixels[idx + 3] = 255;  // A
            }
        });
        
        ctx.putImageData(imgData, 0, 0);
    }

    zTensor.dispose();
}

function startAnimationLoop() {
    const loop = async () => {
        const currentLatentString = JSON.stringify(globalLatentVector);
        
        // Detectamos si cambió el vector O si todavía faltan modelos por cargar
        // (Si faltan modelos, forzamos refresco ocasional o confiamos en el callback de carga)
        const someModelsMissing = allModels.some(m => m === null);

        // Si cambió el MIDI o si se acaba de cargar un modelo nuevo (forzado por lastLatentString="")
        if (currentLatentString !== lastLatentString || someModelsMissing) {
             
             // Pequeña optimización: si no tocamos nada y faltan modelos, 
             // no redibujar a 60fps, solo cuando cargue uno nuevo (manejado arriba).
             // Pero para suavidad MIDI, dibujamos si hay cambio de input.
             
             if (currentLatentString !== lastLatentString) {
                await drawAllLetters();
                lastLatentString = currentLatentString;
             } else {
                 // Si el input no cambió, pero queremos ver si cargó una letra,
                 // drawAllLetters revisa allModels.
                 // Para no saturar, podemos redibujar solo si 'lastLatentString' fue reseteado.
                 await drawAllLetters();
             }
        }
        requestAnimationFrame(loop);
    };
    loop();
}

function openMonitor() {
  window.open(MONITOR_URL, "monitor-latente");
}

async function main() {
  await tf.ready();
  console.log("Backend TFJS:", tf.getBackend());
  
  createGrid(); 
  initMIDI();   
  openMonitor(); 
  
  // ARRANCAMOS EL LOOP VISUAL ANTES DE CARGAR LOS MODELOS
  startAnimationLoop();
  
  // INICIAMOS LA CARGA EN SEGUNDO PLANO
  loadModels(); 
}

// INICIO SEGURO
document.addEventListener("DOMContentLoaded", () => {
    main();
});