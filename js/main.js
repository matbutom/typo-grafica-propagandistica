const serifImgs = [
  "serif_afiche_00.jpg",
  "serif_afiche_01.jpg",
  "serif_afiche_02.jpg",
  "serif_afiche_03.jpg",
  "serif_afiche_04.jpg",
  "serif_afiche_05.jpg",
  "serif_afiche_06.jpg",
  "serif_afiche_07.jpg",
  "serif_afiche_08.jpg",
  "serif_afiche_09.jpg",
  "serif_afiche_10.jpg",
  "serif_afiche_11.jpg",
  "serif_afiche_12.jpg",
  "serif_afiche_13.jpg",
  "serif_afiche_14.jpg",
  "serif_afiche_15.jpg",
];
const sansserifImgs = [
  "sansserif_afiche_00.jpeg",
  "sansserif_afiche_01.jpeg",
  "sansserif_afiche_63.jpg",
  "sansserif_afiche_64.jpg",
];
const displayImgs = [
  "display_afiche_00.jpg",
  "display_afiche_01.jpg",
  "display_afiche_02.jpg",
  "display_afiche_03.jpg",
  "display_afiche_04.jpg",
  "display_afiche_05.jpg",
  "display_afiche_06.jpg",
  "display_afiche_07.jpg",
  "display_afiche_08.jpg",
  "display_afiche_09.jpg",
  "display_afiche_10.jpg",
  "display_afiche_11.jpg",
  "display_afiche_12.jpg",
  "display_afiche_13.jpg",
  "display_afiche_14.jpg",
];
const rotulosImgs = [
  "rotulos_afiche_00.jpg",
  "rotulos_afiche_01.jpg",
  "rotulos_afiche_02.jpg",
  "rotulos_afiche_03.jpg",
  "rotulos_afiche_04.jpg",
  "rotulos_afiche_05.jpg",
  "rotulos_afiche_06.jpg",
  "rotulos_afiche_07.jpg",
  "rotulos_afiche_08.jpg",
  "rotulos_afiche_09.jpg",
  "rotulos_afiche_10.jpg",
  "rotulos_afiche_11.jpg",
  "rotulos_afiche_12.jpg",
  "rotulos_afiche_13.jpg",
  "rotulos_afiche_14.jpg",
  "rotulos_afiche_15.jpg",
  "rotulos_afiche_16.jpg",
  "rotulos_afiche_17.jpg",
  "rotulos_afiche_18.jpg",
  "rotulos_afiche_19.jpg",
  "rotulos_afiche_20.jpg",
  "rotulos_afiche_21.jpg",
  "rotulos_afiche_22.jpg",
  "rotulos_afiche_23.jpg",
  "rotulos_afiche_24.jpg",
  "rotulos_afiche_25.jpg",
];

const basePaths = {
  serif: "assets/tipografias/serif",
  sansserif: "assets/tipografias/sansserif",
  display: "assets/tipografias/display",
  rotulos: "assets/tipografias/rotulos",
};

// Unir todo en un único array con rutas completas
const imagenes = [
  ...serifImgs.map((f) => `${basePaths.serif}/${f}`),
  ...sansserifImgs.map((f) => `${basePaths.sansserif}/${f}`),
  ...displayImgs.map((f) => `${basePaths.display}/${f}`),
  ...rotulosImgs.map((f) => `${basePaths.rotulos}/${f}`),
];

// Función para mezclar aleatoriamente
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

const muro = document.getElementById("muro");

function renderMuro() {
  muro.innerHTML = "";

  // Dividimos imágenes en 6 subconjuntos (uno por columna)
  const shuffled = shuffle([...imagenes]);
  const sets = Array.from({ length: 6 }, () => []);

  shuffled.forEach((img, i) => {
    sets[i % 6].push(img);
  });

  // Renderizamos cada columna
  sets.forEach((set, idx) => {
    const columna = document.createElement("div");
    columna.classList.add("columna");

    // Duplicamos solo ese set para que la animación sea continua
    // Duplicamos varias veces para dar altura infinita
    const finalSet = Array(10).fill(set).flat(); // 👈 repite 10 veces

    finalSet.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.classList.add("afiche");
      columna.appendChild(img);
    });

    muro.appendChild(columna);
  });
}

renderMuro();
