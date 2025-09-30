// --- Módulo 2: centrado + dos columnas con modos experimentales ---
// Requiere: ../datasets/modulo2-data.js (fontStacks, recorridoTipografico)
// Cárgalo ANTES que este archivo en el HTML.

// ====== Referencias UI ======
const wordEl        = document.getElementById("word");
const contextEl     = document.getElementById("context-text");
const periodEl      = document.getElementById("info-period");
const yearEl        = document.getElementById("info-year");
const fontNameEl    = document.getElementById("info-font-name");
const fontPreviewEl = document.getElementById("font-preview");
const stackEl       = document.getElementById("info-stack");

const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");

let idx = 0;

// === Captura segura de los datos y stacks aunque no estén en window ===
const DATA = (() => {
  try {
    // si fue declarado como const en otro script, existe en el ámbito global
    if (typeof recorridoTipografico !== "undefined") return recorridoTipografico;
  } catch {}
  return (window.recorridoTipografico || []);
})();

const STACKS = (() => {
  try {
    if (typeof fontStacks !== "undefined") return fontStacks;
  } catch {}
  return (window.fontStacks || {});
})();

// =========================================
// Aliases (ajusta según tu kit de Adobe)
// =========================================
const adobeAliasesByKey = {
  akzidenz: ["akzidenz-grotesk-next","akzidenz-grotesk-pro","'Akzidenz Grotesk'"],
  helvetica: ["helvetica-lt-pro","'Helvetica Neue'","Helvetica","'Helvetica LT Pro'"],
  univers: ["univers-next-pro","'Univers'"],
  frutiger: ["neue-frutiger-world","'Frutiger'"],
  tradegothic: ["trade-gothic-next","'Trade Gothic'"],
  franklin: ["franklin-gothic","'ITC Franklin Gothic'","'Franklin Gothic'"],
  gillsans: ["gill-sans-nova","'Gill Sans'"],
  kabel: ["neue-kabel","'Kabel'"],
  avantgarde: ["itc-avant-garde-gothic-pro","'ITC Avant Garde'"],
  times: ["times-new-roman","'Times New Roman'","Times"],
  palatino: ["palatino-linotype","'Palatino Linotype'","Palatino"],
  bodoni: ["bodoni-egyptian-pro","'Bodoni Egyptian Pro'","'Bodoni Moda'","Bodoni"],
  trajan: ["trajan-pro-3","'Trajan Pro 3'"],
  bookman: ["bookman-jf-pro","'ITC Bookman'","'Bookman Old Style'"],
  matrix: ["matrix-ii","'Matrix II'"],
  cooper: ["cooper-black-std","'Cooper Black Std'","'Cooper Black'"],
  broadway: ["ltc-broadway","'Broadway'"],
  stencil: ["stencil-std","'Stencil Std'","Stencil"],
  ocr: ["ocr-a-std","'OCR A Std'","'OCR A'"],
  arnold: ["arnold-bocklin-mn","'Arnold Böcklin'"],
  mistral: ["mistral-mn","Mistral"],
  impact: ["impact","Impact"],
  verdana: ["verdana","Verdana"],
  georgia: ["georgia","Georgia"],
  futura: ["futura-pt","'Futura PT'","Futura","'Avenir Next'"],
  centurygothic: ["century-gothic","'Century Gothic'"],
  templategothic: ["template-gothic","'Template Gothic'"],
  din: ["'FF DIN'","din-2014","din-next","'DIN 1451'"],
  gotham: ["Gotham","'Gotham Narrow'"],
  museo: ["Museo","'Museo Sans'"],
  montserrat: ["Montserrat"],
  roboto: ["Roboto"],
  oswald: ["Oswald"],
  lato: ["Lato"],
  opensans: ["'Open Sans'"],
  librefranklin: ["'Libre Franklin'"],
  inter: ["Inter"],
  sourcesans: ["'Source Sans 3'","'Source Sans Pro'"],
  bebas: ["'Bebas Neue'"],
  arial: ["Arial"],
  courier: ["'Courier New'","Courier"],
  didot: ["Didot","'GFS Didot'"],
  optima: ["Optima"]
};

// Cache de familias resueltas
const resolvedFamilies = new Map();

// Devuelve una familia disponible (alias → stack abierto)
async function resolveFontFamily(key, fallbackStack, desiredWeight = 700) {
  if (resolvedFamilies.has(key)) return resolvedFamilies.get(key);

  const firstFromStack = (fallbackStack.split(",")[0] || "").trim().replace(/^['"]|['"]$/g, "");
  const candidates = [
    ...(adobeAliasesByKey[key] || []),
    firstFromStack
  ].filter(Boolean);

  for (const fam of candidates) {
    try {
      if (document.fonts.check(`${desiredWeight} 32px ${fam}`)) {
        resolvedFamilies.set(key, fam);
        return fam;
      }
      await document.fonts.load(`${desiredWeight} 32px ${fam}`);
      if (document.fonts.check(`${desiredWeight} 32px ${fam}`)) {
        resolvedFamilies.set(key, fam);
        return fam;
      }
    } catch {}
  }
  const fb = (firstFromStack || "Montserrat");
  resolvedFamilies.set(key, fb);
  return fb;
}

// ====== tamaño palabra ======
function fitWord() {
  const container = document.getElementById("word-container");
  const max = Math.min(container.clientWidth, Math.max(220, window.innerHeight * 0.23));
  const txt = (wordEl.textContent || "").trim();
  const base = (txt.length <= 4) ? 13 : (txt.length <= 8 ? 10 : 8);
  wordEl.style.fontSize = `min(${base}vw, ${max}px)`;
}

// ====== helpers de presentación ======
function setLetters(el, word) {
  el.innerHTML = "";
  [...word].forEach((ch,i)=>{
    const s = document.createElement("span");
    s.className = "w-letter";
    s.style.setProperty("--i", i);
    s.textContent = ch;
    el.appendChild(s);
  });
}
function resetWordPresentation() {
  wordEl.className = "fx-reset";
  wordEl.style.removeProperty("-webkit-text-stroke");
  wordEl.style.removeProperty("-webkit-text-fill-color");
  wordEl.style.removeProperty("background");
  wordEl.style.removeProperty("-webkit-background-clip");
  wordEl.style.removeProperty("color");
}

// microtexto SVG como background
function svgMicrotextBG(micro="BANG", font="monospace", size=10, gap=2, color="#ff3ad7") {
  const svg = `
<svg xmlns='http://www.w3.org/2000/svg' width='${size*6}' height='${size*6}'>
  <style>.t{ font:${size}px ${font}; fill:${color}; }</style>
  <defs>
    <pattern id='p' width='${size*6}' height='${size*6}' patternUnits='userSpaceOnUse'>
      ${Array.from({length:6}).map((_,r)=>(
        Array.from({length:6}).map((__,c)=>
          `<text class='t' x='${c*(size+gap)}' y='${(r+1)*(size+gap)}'>${micro}</text>`
        ).join("")
      )).join("")}
    </pattern>
  </defs>
  <rect width='100%' height='100%' fill='url(#p)'/>
</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// ====== Modos experimentales ======
let modeOrder = ["columns","microtext","trail","blocks"];
let currentMode = "columns";

function applyMode(mode, palabra) {
  resetWordPresentation();
  switch(mode){
    case "columns": {
      setLetters(wordEl, palabra);
      wordEl.classList.add("fx-columns");
      break;
    }
    case "microtext": {
      wordEl.textContent = palabra;
      const token = (palabra.length<=5 ? palabra : "BANG");
      const bg = svgMicrotextBG(token, "monospace", 10, 2, "#ff3ad7");
      wordEl.style.background = bg;
      wordEl.style.webkitBackgroundClip = "text";
      wordEl.style.color = "transparent";
      wordEl.style.webkitTextStroke = "1px rgba(255,255,255,.12)";
      break;
    }
    case "trail": {
      setLetters(wordEl, palabra);
      wordEl.classList.add("fx-trail");
      break;
    }
    case "blocks": {
      setLetters(wordEl, palabra);
      wordEl.classList.add("fx-blocks");
      break;
    }
    default: {
      wordEl.textContent = palabra;
    }
  }
}

// ====== Render principal ======
async function render() {
  if (!Array.isArray(DATA) || !DATA.length) {
    console.warn("Dataset vacío o no cargado.");
    return;
  }

  const item = DATA[idx] || DATA[0];
  if (!item) return;

  // Texto + contexto
  contextEl.textContent = `${item.periodo}${item.anio ? " ("+item.anio+")" : ""}: ${item.contexto || ""}`;
  periodEl.textContent  = item.periodo || "";
  yearEl.textContent    = `Año: ${item.anio ?? "—"}`;

  // Clave y stack abierto
  const key = String(item.stack || "montserrat").toLowerCase();
  const openStack = STACKS[key] || STACKS.montserrat || "'Montserrat', sans-serif";

  // Resuelve familia (Adobe si está disponible)
  const desiredWeight = Number(item.peso ?? 700);
  const resolved = await resolveFontFamily(key, openStack, desiredWeight);
  const finalStack = `${resolved}, ${openStack}`;

  // Aplicar tipografía a la palabra
  wordEl.style.fontFamily = finalStack;
  wordEl.style.fontWeight = desiredWeight;

  // Previsualización: nombre histórico con su tipografía
  const pretty = String(item.fuenteHistorica || resolved || key)
    .replace(/^['"]|['"]$/g,"")
    .replace(/-/g," ")
    .replace(/\b([a-z])/g, m => m.toUpperCase());
  fontPreviewEl.style.fontFamily = finalStack;
  fontPreviewEl.style.fontWeight = 400;
  fontPreviewEl.textContent = pretty;

  // Nota de stack abierto
  stackEl.textContent = openStack;

  // Modo experimental sobre la palabra
  applyMode(currentMode, item.palabra || "");

  // Ajuste de tamaño + matiz por período
  fitWord();
  if (item.periodo) document.body.setAttribute("data-period", item.periodo);
}

// ====== Navegación ======
function next() { idx = (idx + 1) % (DATA.length || 1); render(); }
function prev() { idx = (idx - 1 + (DATA.length || 1)) % (DATA.length || 1); render(); }

btnNext?.addEventListener("click", next);
btnPrev?.addEventListener("click", prev);
wordEl?.addEventListener("click", next);
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") next();
  if (e.key === "ArrowLeft") prev();
  if (e.key==="m" || e.key==="M") cycleMode(1);
  if (e.key==="1") { currentMode="columns"; render(); }
  if (e.key==="2") { currentMode="microtext"; render(); }
  if (e.key==="3") { currentMode="trail"; render(); }
  if (e.key==="4") { currentMode="blocks"; render(); }
});
window.addEventListener("resize", fitWord);

// ====== Cambio de modo ======
function cycleMode(dir=1){
  const i = modeOrder.indexOf(currentMode);
  currentMode = modeOrder[(i + dir + modeOrder.length) % modeOrder.length];
  render();
}

// ====== Inicio ======
render();
