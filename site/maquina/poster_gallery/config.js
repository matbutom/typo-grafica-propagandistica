// =========================================================
// 🧠 CONFIGURACIÓN DE LA GALERÍA
// =========================================================

const GALLERY_SETTINGS = {
    rotationInterval: 10000, 
    modelBaseUrl: '../tfjs_models_final',
    latentDim: 64,
    imgSize: 64
};

// =========================================================
// 🖼️ LISTA DE AFICHES (¡ARQUITECTURA NUEVA!)
// =========================================================
const POSTER_CONFIGS = [
    {
        // Afiche 1: Allende (Ahora usa la nueva estructura de array 'titles')
        imagePath: '../poster_dataset/afiches_partidos_políticos_chilenos/afiche_afiches_partidos_politicos_chilenos_039.jpg',
        titles: [
            {
                text: "ALLENDE",
                posX: 0,
                posY: 1280,
                letterWidth: 160,
                letterHeight: 290,
                letterSpacing: 0,
                sampleBgColorAt: [10, 1290]
            }
        ]
    },
    {
        // AFICHE 2: Bachelet
// imagePath: '../poster_dataset/bachelet02.png',
//         titles: [
//             {
//                 text: "MICHELLE",
//                 posX: 170,         // Ajustado
//                 posY: 770,         // Ajustado
//                 letterWidth: 100,
//                 letterHeight: 120,
//                 letterSpacing: 0, // Añadido espaciado
//                 angle: 30,        // 🚨 Ángulo (aprox 30° es mucho, -11° es más parecido)
//                 letterColor: [255, 255, 255], // 🚨 Letras Blancas
//                 bgColor: [27, 0, 59]       // 🚨 Color de fondo (Azul de la franja)
//             },
//             {
//                 text: "Chile de todos", // Se ve mejor con minúsculas
//                 posX: 50,         // Ajustado
//                 posY: 890,         // Ajustado
//                 letterWidth: 55,
//                 letterHeight: 70,
//                 letterSpacing: 0,
//                 angle: 30,        // 🚨 Mismo ángulo
//                 letterColor: [255, 255, 255], // 🚨 Letras Blancas
//                 bgColor: [27, 0, 59]       // 🚨 Mismo fondo azul
//             },
//             {
//                 text: "NUEVA MAYORIA",
//                 posX: 600,         // Ajustado
//                 posY: 1040,        // Ajustado
//                 letterWidth: 50,
//                 letterHeight: 60,
//                 letterSpacing: 5,
//                 angle: 0,          // Sin ángulo
//                 letterColor: [0, 0, 0], // 🚨 Letras Negras
//                 bgColor: [230, 226, 224]    // 🚨 Color de fondo (Crema del afiche)
//             }
//         ]
    }
];