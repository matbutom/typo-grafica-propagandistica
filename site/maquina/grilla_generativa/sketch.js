// =========================================================
// sketch.js: Grilla Generativa (Transmisor de LocalStorage)
// + abre /monitor_latente/monitor.html automáticamente
// =========================================================

const LATENT_DIM = 64;
const IMG_SIZE = 64;
const MODEL_BASE_URL = '../tfjs_models_final';

// 👇 ruta real del monitor
const MONITOR_URL = '../monitor_latente/monitor.html';

const NUM_CELLS = 144;
const FRAME_RATE_PER_CELL = 2;

let monitorWin = null;

let copiaVectorLatente = null;

function openMonitor() {
  if (monitorWin && !monitorWin.closed) {
    monitorWin.focus();
    return;
  }
  // se abre en nueva pestaña/ventana
  monitorWin = window.open(MONITOR_URL, 'monitor-latente');
}

async function main() {
  await tf.ready();
  console.log('TensorFlow.js listo.');

  // abrimos el monitor al iniciar
  openMonitor();

  const letters = [];
  for (let i = 65; i <= 90; i++) letters.push(String.fromCharCode(i));
  console.log(`Cargando ${letters.length} modelos (A-Z) en paralelo...`);

  const modelPromises = letters.map((letter) => {
    const modelPath = `${MODEL_BASE_URL}/decoder_${letter}/model.json`;
    return tf.loadGraphModel(modelPath);
  });

  let allModels;
  try {
    allModels = await Promise.all(modelPromises);
    console.log(`✅ Todos los ${letters.length} modelos base fueron cargados.`);
  } catch (error) {
    console.error('Error fatal al cargar los modelos base:', error);
    return;
  }

  const gridContainer = document.getElementById('grid-container');

  for (let i = 0; i < NUM_CELLS; i++) {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'grid-cell';
    gridContainer.appendChild(cellDiv);

    const randomModel = allModels[Math.floor(Math.random() * allModels.length)];
    const randomFrameRate = Math.random() * (15 - 2) + 2;
    const randomMutationSpeed = Math.random() * (0.1 - 0.02) + 0.02;

    new p5(sketchWrapper(randomModel, randomFrameRate, randomMutationSpeed, i), cellDiv);
  }
}

const sketchWrapper = (decoder, frameRate, mutationSpeed, cellID) => {
  return (s) => {
    let latentVector = new Array(LATENT_DIM).fill(0);
    let noiseOffset;

    s.setup = () => {
      s.createCanvas(IMG_SIZE, IMG_SIZE);
      s.noSmooth();
      s.frameRate(frameRate);
      noiseOffset = s.random(1000);
      updateLatentVector();
    };

    s.draw = async () => {
      if (!decoder) return;

      updateLatentVector(s.map(s.noise(noiseOffset), 0, 1, -5, 5));
      await generateImage(s, latentVector, decoder);

      noiseOffset += mutationSpeed;

      // transmitir solo desde la celda 0
      if (cellID === 0) {
        try {
          localStorage.setItem('live_latent_vector_z', JSON.stringify(latentVector));
        } catch (e) {}
      }
    };

    function updateLatentVector(global_offset = 0) {
      for (let i = 0; i < LATENT_DIM; i++) {
        latentVector[i] = s.map(s.noise(noiseOffset + i * 0.1), 0, 1, -5, 5) + global_offset;
        copiaVectorLatente = latentVector; // copia global para debug
      }
    }
  };
};

async function generateImage(s, z_vector, decoder) {
  const z_tensor = tf.tensor2d([z_vector]);
  try {
    const result_tensor = decoder.predict(z_tensor);
    const pixelData = await result_tensor.data();

    s.background(255);
    s.loadPixels();
    let index = 0;
    const threshold = 127.5;

    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        const grayValue = pixelData[index] * 255;
        const finalColor = grayValue > threshold ? 0 : 255;
        s.set(x, y, s.color(finalColor));
        index++;
      }
    }

    s.updatePixels();
    tf.dispose([z_tensor, result_tensor]);
  } catch (error) {
    tf.dispose([z_tensor]);
  }
}

main();
