// Importamos las listas generadas automáticamente
import { serifImgs, sansserifImgs, displayImgs, rotulosImgs } from "./listas.js";

// Rutas base
const basePaths = {
  serif: "assets/tipografias/serif",
  sansserif: "assets/tipografias/sansserif",
  display: "assets/tipografias/display",
  rotulos: "assets/tipografias/rotulos",
};

// Unimos todas las imágenes en un solo array con sus rutas completas
const todasImagenes = [
  ...serifImgs.map(f => `${basePaths.serif}/${f}`),
  ...sansserifImgs.map(f => `${basePaths.sansserif}/${f}`),
  ...displayImgs.map(f => `${basePaths.display}/${f}`),
  ...rotulosImgs.map(f => `${basePaths.rotulos}/${f}`),
];

// Función para dividir un array en N partes lo más iguales posible
function dividirEnColumnas(arr, columnas) {
  const resultado = Array.from({ length: columnas }, () => []);
  arr.forEach((item, i) => {
    resultado[i % columnas].push(item);
  });
  return resultado;
}

// Renderizado del muro
function renderMuro() {
  const muro = document.getElementById("muro");
  muro.innerHTML = "";

  // Dividimos todas las imágenes en 6 columnas iguales
  const columnas = dividirEnColumnas(todasImagenes, 6);

  columnas.forEach(colImgs => {
    const col = document.createElement("div");
    col.classList.add("columna");

    // Insertar imágenes en la columna
    colImgs.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.classList.add("afiche");
      col.appendChild(img);
    });

    // Duplicar imágenes para la animación infinita
    colImgs.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.classList.add("afiche");
      col.appendChild(img);
    });

    muro.appendChild(col);
  });
}

// Ejecutamos la función al cargar
renderMuro();

function ajustarAlturaMuro() {
  const galeria = document.querySelector(".galeria");
  const muro = document.getElementById("muro");

  if (galeria && muro) {
    const galeriaBottom = galeria.offsetTop + galeria.offsetHeight;
    muro.style.height = galeriaBottom + 100 + "px"; // 👈 100px extra
  }
}

// Ajustar al cargar
window.addEventListener("load", ajustarAlturaMuro);
// Ajustar también al redimensionar
window.addEventListener("resize", ajustarAlturaMuro);
