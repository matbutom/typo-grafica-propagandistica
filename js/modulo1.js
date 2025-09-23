// Importamos las listas desde listas.js (misma carpeta)
import { serifImgs, sansserifImgs, displayImgs, rotulosImgs } from "./listas.js";

const linksTipografias = document.querySelectorAll(".tipografias a");
const galeria = document.getElementById("galeria-afiches");

const data = {
  "serif": serifImgs,
  "sansserif": sansserifImgs,
  "display": displayImgs,
  "rotulos": rotulosImgs,
};

let imagenesActuales = [];
let indiceActual = 0;

linksTipografias.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const tipo = link.dataset.filter;
    cargarCarrusel(tipo);
  });
});

function cargarCarrusel(tipo) {
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

  const btnPrev = document.createElement("button");
  btnPrev.classList.add("carrusel-btn", "prev");
  btnPrev.innerHTML = "&#8592;";
  btnPrev.addEventListener("click", () => mostrarAnterior(tipo));

  const img = document.createElement("img");
  img.src = `../assets/tipografias/${tipo}/${imagenesActuales[indiceActual]}`;
  img.alt = `Afiche ${indiceActual + 1} de ${imagenesActuales.length}`;

  const btnNext = document.createElement("button");
  btnNext.classList.add("carrusel-btn", "next");
  btnNext.innerHTML = "&#8594;";
  btnNext.addEventListener("click", () => mostrarSiguiente(tipo));

  const contador = document.createElement("p");
  contador.classList.add("contador");
  contador.textContent = `${indiceActual + 1} / ${imagenesActuales.length}`;

  contenedor.appendChild(btnPrev);
  contenedor.appendChild(img);
  contenedor.appendChild(btnNext);

  galeria.appendChild(contenedor);
  galeria.appendChild(contador);
}

function mostrarAnterior(tipo) {
  indiceActual = (indiceActual - 1 + imagenesActuales.length) % imagenesActuales.length;
  renderCarrusel(tipo);
}

function mostrarSiguiente(tipo) {
  indiceActual = (indiceActual + 1) % imagenesActuales.length;
  renderCarrusel(tipo);
}
