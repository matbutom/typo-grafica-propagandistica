// =========================================================
// sketch.js: CÓDIGO FINAL (Corregido para GitHub Pages)
// =========================================================

// --- Variables Globales ---
const LATENT_DIM = 64; // Confirmado desde tu Celda 3
const IMG_SIZE = 64;

// 🚨 CORRECCIÓN CLAVE: Usamos una ruta relativa.
// Esto asume que tu index.html está en /web y los modelos en /tfjs_models_final
const MODEL_BASE_URL = '../tfjs_models_final'; 

// Variables de ml5/p5
let currentDecoder; 
let currentLetter = 'A'; 
let latentVector = new Array(LATENT_DIM).fill(0); 
let latentSliders = [];

// Elementos HTML
let letterSelect;
let generateButton;
let slidersContainer;

// ---------------------------------------------------------
// 1. Funciones de p5.js (ASÍNCRONAS)
// ---------------------------------------------------------

async function setup() {
    console.log("Esperando inicialización de TensorFlow.js...");
    await tf.ready(); 
    console.log("TensorFlow.js listo. Inicializando p5.js...");

    const canvas = createCanvas(IMG_SIZE, IMG_SIZE);
    canvas.parent('canvas-container');
    pixelDensity(1); 
    
    // Asignar elementos HTML
    letterSelect = select('#letter-select');
    generateButton = select('#generate-button');
    slidersContainer = select('#sliders-container');

    generateButton.mousePressed(generateNewLatentVector);

    // Llenar el selector de letras (A-Z)
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        letterSelect.option(letter);
    }

    setupLatentSliders();
    letterSelect.changed(changeLetter);
    
    // Iniciar la carga del primer modelo
    changeLetter();
}

function draw() {
    noLoop(); 
}

// ---------------------------------------------------------
// 2. Lógica de Sliders y Vector Latente
// ---------------------------------------------------------

function setupLatentSliders() {
    const N_SLIDERS = 5; 
    slidersContainer.html('');
    latentSliders = [];
    
    for (let i = 0; i < N_SLIDERS; i++) {
        const slider = createSlider(-3, 3, 0, 0.05);
        slider.changed(updateLatentVector);
        slider.input(updateLatentVector); 
        slider.parent(slidersContainer);
        
        const label = createDiv(`Z${i+1}:`);
        label.parent(slidersContainer);
        label.style('display', 'inline-block');
        createDiv('').parent(slidersContainer).style('clear', 'both');

        latentSliders.push(slider);
    }
    updateLatentVector(); 
}

function updateLatentVector() {
    for(let i = 0; i < latentSliders.length; i++) {
        latentVector[i] = latentSliders[i].value();
    }
    generateImage();
}

function generateNewLatentVector() {
    for (let i = 0; i < LATENT_DIM; i++) {
        latentVector[i] = randomGaussian(); 
    }
    for(let i = 0; i < latentSliders.length; i++) {
        const clampedValue = constrain(latentVector[i], -3, 3); 
        latentSliders[i].value(clampedValue);
    }
    generateImage();
}

// ---------------------------------------------------------
// 3. Carga y Generación del Modelo (Usando tf.loadGraphModel)
// ---------------------------------------------------------

async function changeLetter() {
    currentLetter = letterSelect.value();
    
    // Construye la ruta relativa (ej: ../tfjs_models_final/decoder_A/model.json)
    const modelPath = `${MODEL_BASE_URL}/decoder_${currentLetter}/model.json`;

    // Mensaje de carga
    background(50);
    fill(255);
    textAlign(CENTER, CENTER);
    text('CARGANDO...', width / 2, height / 2);

    try {
        console.log(`Cargando GraphModel desde: ${modelPath}`);
        // Usamos tf.loadGraphModel() que SÍ entiende tus archivos .json
        currentDecoder = await tf.loadGraphModel(modelPath);
        modelLoaded(); 
        
    } catch (error) {
        console.error(`Error al cargar el GraphModel para ${currentLetter}:`, error);
        // Si esto falla ahora, es porque la carpeta tfjs_models_final no está en la raíz
    }
}

function modelLoaded() {
    console.log(`Modelo ${currentLetter} cargado. Generando vector Z inicial...`);
    if (latentVector.length === 0) {
        latentVector = new Array(LATENT_DIM).fill(0);
    }
    generateImage();
}

async function generateImage() {
    if (!currentDecoder) {
        console.log("Generación detenida, el decodificador no está listo.");
        return;
    }

    // 1. Crear el tensor de entrada: [1, LATENT_DIM]
    const z_tensor = tf.tensor2d([latentVector]);

    try {
        // 2. Ejecutar la predicción
        const result_tensor = currentDecoder.predict(z_tensor);

        // 3. Obtener los datos del tensor [64, 64, 1]
        const pixelData = await result_tensor.data(); // Usamos .data() asíncrono

        // 4. Dibujar la imagen en el Canvas (Escala de Grises)
        loadPixels();
        let index = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let grayValue = pixelData[index] * 255;
                set(x, y, color(grayValue, grayValue, grayValue));
                index++; 
            }
        }
        updatePixels();

        // 5. Limpieza de memoria (¡MUY IMPORTANTE!)
        tf.dispose([z_tensor, result_tensor]);

    } catch (error) {
        console.error("Error durante la predicción:", error);
        tf.dispose([z_tensor]);
    }
}