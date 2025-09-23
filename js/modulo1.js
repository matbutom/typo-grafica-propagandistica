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
let modoDetalle = false;

// Detectar clicks en las tipografías
linksTipografias.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const tipo = link.dataset.filter;
    console.log("Click detectado en:", tipo); // 🔎

    // 🔥 quitar clase active de todos
    linksTipografias.forEach((l) => l.classList.remove("active"));

    // 🔥 añadir clase active al seleccionado
    link.classList.add("active");

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

  // Activar modo detalle al clickear
  img.addEventListener("click", () => activarDetalle(tipo));

  marco.appendChild(img);

  // Contador
  const contador = document.createElement("p");
  contador.classList.add("contador");
  contador.textContent = `${indiceActual + 1} / ${imagenesActuales.length}`;

  // Botones
  const btnPrev = document.createElement("button");
  btnPrev.classList.add("carrusel-btn", "prev");
  btnPrev.innerHTML = "&#8592;";
  btnPrev.addEventListener("click", () =>
    cambiarImagen(tipo, -1, img, contador)
  );

  const btnNext = document.createElement("button");
  btnNext.classList.add("carrusel-btn", "next");
  btnNext.innerHTML = "&#8594;";
  btnNext.addEventListener("click", () =>
    cambiarImagen(tipo, 1, img, contador)
  );

  // Insertar
  contenedor.appendChild(marco);
  contenedor.appendChild(btnPrev);
  contenedor.appendChild(btnNext);
  contenedor.appendChild(contador);

  galeria.appendChild(contenedor);

  if (modoDetalle) {
    renderInfoLateral(tipo);
  }
}

// Transición suave entre imágenes
function cambiarImagen(tipo, direccion, img, contador) {
  img.classList.add("fade-out");

  img.addEventListener(
    "transitionend",
    () => {
      indiceActual =
        (indiceActual + direccion + imagenesActuales.length) %
        imagenesActuales.length;
      img.src = `../assets/tipografias/${tipo}/${imagenesActuales[indiceActual]}`;
      img.classList.remove("fade-out");

      // 🔥 Actualizar contador
      if (contador) {
        contador.textContent = `${indiceActual + 1} / ${imagenesActuales.length}`;
      }

      if (modoDetalle) {
        renderInfoLateral(tipo);
      }
    },
    { once: true }
  );
}

// =====================
//   MODO DETALLE
// =====================

// Crear botón volver
const btnVolver = document.createElement("button");
btnVolver.textContent = "← Volver";
btnVolver.classList.add("btn-volver");
document.body.appendChild(btnVolver);

btnVolver.addEventListener("click", salirDetalle);

// Activa el modo detalle
function activarDetalle(tipo) {
  document.body.classList.add("detalle-activo");
  modoDetalle = true;
  renderInfoLateral(tipo);
}

// Sale del modo detalle
function salirDetalle() {
  document.body.classList.remove("detalle-activo");
  modoDetalle = false;

  // Quitar info lateral
  const prevInfos = document.querySelectorAll(".info-lateral");
  prevInfos.forEach((el) => el.remove());
}

// Renderiza info lateral
function renderInfoLateral(tipo) {
  // Limpiar anteriores
  const prevInfos = document.querySelectorAll(".info-lateral");
  prevInfos.forEach((el) => el.remove());

  const infoIzq = document.createElement("div");
  infoIzq.classList.add("info-lateral", "left");
  infoIzq.innerHTML = `
    <p><strong>Tipografía:</strong> ${tipo}</p>
    <p><strong>Año:</strong> ???</p>
    <p><strong>Autor:</strong> ???</p>
  `;

  const infoDer = document.createElement("div");
  infoDer.classList.add("info-lateral", "right");
  infoDer.innerHTML = `
    <p>Información adicional</p>
    <p>Notas históricas, contexto, etc.</p>
  `;

  document.body.appendChild(infoIzq);
  document.body.appendChild(infoDer);
}

// =====================
//   TECLAS DE ATAJO
// =====================

// Esc para salir del modo detalle
document.addEventListener("keydown", (e) => {
  if (modoDetalle && e.key === "Escape") {
    salirDetalle();
  }
});
