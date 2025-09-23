// Importamos las listas desde listas.js (misma carpeta)
import {
  serifImgs,
  sansserifImgs,
  displayImgs,
  rotulosImgs,
} from "./listas.js";

const linksTipografias = document.querySelectorAll(".tipografias a");
const galeria = document.getElementById("galeria-afiches");
console.log("Contenedor galería encontrado:", galeria); // 🔎

const data = {
  serif: serifImgs,
  sansserif: sansserifImgs,
  display: displayImgs,
  rotulos: rotulosImgs,
};

let imagenesActuales = [];
let indiceActual = 0;

linksTipografias.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const tipo = link.dataset.filter;
    console.log("Click detectado en:", tipo); // 🔎
    cargarCarrusel(tipo);
  });
});

function cargarCarrusel(tipo) {
  console.log("Cargando carrusel de:", tipo, data[tipo]); // 🔎
  if (!data[tipo]) return;

  imagenesActuales = data[tipo];
  indiceActual = 0;

  renderCarrusel(tipo);
}

function renderCarrusel(tipo) {
  galeria.innerHTML = "";

  if (imagenesActuales.length === 0) {
    galeria.innerHTML = "<p>No hay afiches disponibles.</p>";
    return;
  }

  const contenedor = document.createElement("div");
  contenedor.classList.add("carrusel");

  // Marco fijo
  const marco = document.createElement("div");
  marco.classList.add("marco");

  // Imagen actual
  const img = document.createElement("img");
  img.src = `../assets/tipografias/${tipo}/${imagenesActuales[indiceActual]}`;
  img.alt = `Afiche ${indiceActual + 1} de ${imagenesActuales.length}`;

  marco.appendChild(img);

  // Botones
  const btnPrev = document.createElement("button");
  btnPrev.classList.add("carrusel-btn", "prev");
  btnPrev.innerHTML = "&#8592;";
  btnPrev.addEventListener("click", () => mostrarAnterior(tipo));

  const btnNext = document.createElement("button");
  btnNext.classList.add("carrusel-btn", "next");
  btnNext.innerHTML = "&#8594;";
  btnNext.addEventListener("click", () => mostrarSiguiente(tipo));

  // Contador
  const contador = document.createElement("p");
  contador.classList.add("contador");
  contador.textContent = `${indiceActual + 1} / ${imagenesActuales.length}`;

  // Insertar
  contenedor.appendChild(marco);
  contenedor.appendChild(btnPrev);
  contenedor.appendChild(btnNext);
  contenedor.appendChild(contador);

  galeria.appendChild(contenedor);
}

function mostrarAnterior(tipo) {
  indiceActual =
    (indiceActual - 1 + imagenesActuales.length) % imagenesActuales.length;
  renderCarrusel(tipo);
}

function mostrarSiguiente(tipo) {
  indiceActual = (indiceActual + 1) % imagenesActuales.length;
  renderCarrusel(tipo);
}
