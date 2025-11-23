// =========================================================
// sketch.js: Motor de Galería (Instancias Múltiples)
// =========================================================

// (No hay variables globales de p5 aquí, este no es un sketch)

// Almacén de modelos A-Z cargados
let loadedModels = new Map();

/**
 * Clase GenerativeLetter (re-definida aquí)
 * Maneja la lógica de CADA letra individualmente.
 */
class GenerativeLetter {
    constructor(s, decoder, bgColor) {
        // 🚨 's' es la instancia de p5.js a la que pertenece esta letra
        this.s = s; 
        this.decoder = decoder;
        this.bgColor = bgColor;
        this.latentVector = new Array(GALLERY_SETTINGS.latentDim).fill(0);
        this.noiseOffset = s.random(1000);
        
        // Crea el canvas de 64x64 usando la instancia 's'
        this.canvas = s.createGraphics(GALLERY_SETTINGS.imgSize, GALLERY_SETTINGS.imgSize);
        this.canvas.noSmooth();
    }

    update() {
        this.noiseOffset += 0.02; 
        for (let i = 0; i < GALLERY_SETTINGS.latentDim; i++) {
            this.latentVector[i] = this.s.map(this.s.noise(this.noiseOffset + i * 0.1), 0, 1, -5, 5);
        }
        this.generate();
    }

    async generate() {
        const z_tensor = tf.tensor2d([this.latentVector]);
        try {
            const result_tensor = this.decoder.predict(z_tensor);
            const pixelData = await result_tensor.data();

            this.canvas.background(this.bgColor); 
            this.canvas.loadPixels();
            
            const threshold = 127.5;
            let index = 0;
            for (let y = 0; y < GALLERY_SETTINGS.imgSize; y++) {
                for (let x = 0; x < GALLERY_SETTINGS.imgSize; x++) {
                    let grayValue = pixelData[index] * 255;
                    let finalColor = (grayValue > threshold) ? this.s.color(0) : this.bgColor; 
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


/**
 * ----------------------------------------------------
 * "FÁBRICA" DE SKETCHES DE P5.JS
 * Esta función crea y devuelve la lógica para CADA afiche.
 * ----------------------------------------------------
 * @param {object} config - El objeto de configuración del afiche (de config.js)
 * @param {Map} models - El mapa de modelos A-Z ya cargados
 */
const posterSketch = (config, models) => {
    
    // Devuelve una función que p5.js usará como sketch
    return (s) => {
        let posterImg;
        let generativeTitles = [];
        let posterBgColor;

        s.preload = () => {
            // Cargar la imagen del afiche para ESTE sketch
            posterImg = s.loadImage(config.imagePath, 
                () => console.log(`Afiche cargado: ${config.imagePath}`),
                (e) => console.error(`Error al cargar afiche: ${e}`)
            );
        };

        s.setup = () => {
            s.createCanvas(posterImg.width, posterImg.height);
            s.noSmooth();
            
            // 1. Crear los títulos generativos para ESTE afiche
            for (const titleConfig of config.titles) {
                
                // Muestrear o asignar el color de fondo
                let bgColor;
                if (titleConfig.sampleBgColorAt) {
                    bgColor = posterImg.get(titleConfig.sampleBgColorAt[0], titleConfig.sampleBgColorAt[1]);
                } else {
                    bgColor = s.color(titleConfig.bgColor[0], titleConfig.bgColor[1], titleConfig.bgColor[2]);
                }

                // Crear las letras
                const lettersArray = createGenerativeTitle(s, titleConfig.text, bgColor, models);
                
                // Guardar el grupo de letras Y su configuración
                generativeTitles.push({
                    config: titleConfig,
                    letters: lettersArray
                });
            }
        };

        s.draw = () => {
            if (!posterImg) return;

            // 1. Dibuja el afiche original
            s.image(posterImg, 0, 0, s.width, s.height);
            
            // 2. Iterar sobre cada TÍTULO
            for (const title of generativeTitles) {
                const cfg = title.config; 
                let currentX = cfg.posX;
                
                // 3. Iterar sobre cada LETRA
                for (const letter of title.letters) {
                    letter.update(); // Actualiza la mutación
                    
                    // Dibuja la letra con su configuración de tamaño
                    s.image(letter.canvas, currentX, cfg.posY, cfg.letterWidth, cfg.letterHeight);
                    
                    currentX += cfg.letterWidth + cfg.letterSpacing;
                }
            }
        };
    };
}; // Fin de posterSketch


/**
 * Función auxiliar para crear un array de letras
 * @param {p5} s - La instancia de p5.js
 * @param {string} titleString - El texto (ej: "ALLENDE")
 * @param {p5.Color} bgColor - El color de fondo
 * @param {Map} models - Los modelos A-Z cargados
 */
function createGenerativeTitle(s, titleString, bgColor, models) {
    let newLetters = [];
    const filteredString = titleString.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    for (const char of filteredString.split('')) {
        if (!models.has(char)) {
            console.warn(`Carácter no alfabético o modelo no encontrado: '${char}'`);
            continue;
        }
        const model = models.get(char);
        if (model) {
            newLetters.push(new GenerativeLetter(s, model, bgColor));
        }
    }
    return newLetters;
}

/**
 * ----------------------------------------------------
 * FUNCIÓN PRINCIPAL (GESTOR)
 * ----------------------------------------------------
 */
async function main() {
    await tf.ready();
    console.log("Galería iniciada. Cargando todos los modelos A-Z...");

    // 1. Cargar todos los modelos A-Z una sola vez
    const lettersToLoad = [];
    for (let i = 65; i <= 90; i++) lettersToLoad.push(String.fromCharCode(i));

    for (const letter of lettersToLoad) {
        const modelPath = `${GALLERY_SETTINGS.modelBaseUrl}/decoder_${letter}/model.json`;
        try {
            const model = await tf.loadGraphModel(modelPath);
            loadedModels.set(letter, model);
        } catch (e) {
            console.error(`Error al cargar el modelo ${letter}: ${e}`);
        }
    }
    console.log(`✅ ${loadedModels.size} modelos base cargados.`);
    
    // 2. Iterar sobre el config y crear una instancia de p5.js por CADA afiche
    const galleryContainer = document.getElementById('gallery-container');
    
    for (const posterConfig of POSTER_CONFIGS) {
        // Crear un div wrapper para el canvas de este afiche
        let wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'poster-wrapper';
        
        // Crear la instancia de p5.js dentro del wrapper
        // Pasamos la config y los modelos a la "fábrica" de sketches
        new p5(posterSketch(posterConfig, loadedModels), wrapperDiv);
        
        // Añadir este afiche al contenedor principal
        galleryContainer.appendChild(wrapperDiv);
    }
}

// Iniciar todo el proceso
main();