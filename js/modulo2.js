// --- Módulo 2 centrado + dos columnas (actualizado) ---
// Requiere: ../datasets/modulo2-data.js (exporta fontAliases, fontStacks, recorridoTipografico)
// Asegúrate de cargar el dataset ANTES de este archivo en el HTML.

// ====== Referencias UI ======
const wordEl = document.getElementById("word");
const contextEl = document.getElementById("context-text");
const periodEl = document.getElementById("info-period");
const yearEl = document.getElementById("info-year");
const fontNameEl = document.getElementById("info-font-name");
const fontPreviewEl = document.getElementById("font-preview");
const stackEl = document.getElementById("info-stack");

const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");

let idx = 0;

// ====== Cache de familias resueltas ======
const resolvedFamilies = new Map();

/**
 * Resuelve una familia realmente disponible probando:
 * - alias por nombre histórico (item.fuenteHistorica)
 * - alias por clave de stack (item.stack)
 * - el primer font del fallback stack
 */
async function resolveFontFamily({ aliasKey, stackKey, fallbackStack, desiredWeight = 700 }) {
  const cacheKey = `${aliasKey || ""}|${stackKey || ""}|${desiredWeight}`;
  if (resolvedFamilies.has(cacheKey)) return resolvedFamilies.get(cacheKey);

  const norm = s => (s || "").trim().replace(/^['"]|['"]$/g, "");
  const takeFirstFromStack = (fallbackStack.split(",")[0] || "").trim();

  const aliasList =
    (fontAliases?.[aliasKey] || [])
      .concat(fontAliases?.[stackKey] || [])
      .map(norm);

  const candidates = [
    ...aliasList,
    norm(takeFirstFromStack)
  ].filter(Boolean);

  for (const fam of candidates) {
    try {
      if (document.fonts.check(`${desiredWeight} 32px ${fam}`)) {
        resolvedFamilies.set(cacheKey, fam);
        return fam;
      }
      await document.fonts.load(`${desiredWeight} 32px ${fam}`);
      if (document.fonts.check(`${desiredWeight} 32px ${fam}`)) {
        resolvedFamilies.set(cacheKey, fam);
        return fam;
      }
    } catch { /* noop */ }
  }
  // Si nada carga, usa el primer font del stack (o Montserrat como red)
  const fallbackFirst = takeFirstFromStack || "'Montserrat'";
  resolvedFamilies.set(cacheKey, fallbackFirst);
  return fallbackFirst;
}

// ====== Efectos por período ======
const effectByPeriod = {
  "1930-1950": "tipos_moviles",
  "1950-1960": "reticula_modernista",
  "1960-1973": "reticula_modernista",
  "1973-1980": "glitch_control",
  "1980-1990": "impacto_calle",
  "1990-2000": "fade_slide",
  "2000-2010": "reticula_modernista",
  "2010-2025": "fade_slide"
};

// ====== Inyección de animaciones (si no existen) ======
(function injectFxCSS(){
  if (document.getElementById("fxStyles")) return;
  const css = `
  .fx-reset { transition: none; filter: none; transform: none; letter-spacing: normal; }
  .fx-scale-in { animation: fxScaleIn 420ms cubic-bezier(.2,.7,.1,1) both; }
  .fx-tracking { animation: fxTracking 700ms ease-out both; }
  .fx-fade-slide { animation: fxFadeSlide 520ms ease both; }
  .fx-glitch { position: relative; animation: fxGlitchPhase 680ms steps(2,end); }
  .fx-glitch::before, .fx-glitch::after {
    content: attr(data-text);
    position: absolute; left: 0; top: 0; mix-blend-mode: screen; opacity: .6; clip-path: inset(0 0 0 0);
  }
  .fx-glitch::before { transform: translate(1px,0); filter: hue-rotate(35deg) contrast(1.1); }
  .fx-glitch::after  { transform: translate(-1px,0); filter: hue-rotate(-35deg) contrast(1.1); }
  .fx-stencil { text-shadow: 0 0 0.01px currentColor, 0 0 8px rgba(255,255,255,0.08);
    filter: drop-shadow(0 2px 0 rgba(0,0,0,.35)); animation: fxSpray 900ms ease-out both; }
  @keyframes fxScaleIn {
    0% { transform: scale(.1) rotate(-1deg); filter: blur(4px); opacity: 0; }
    40%{ transform: scale(1.06) rotate(.2deg); filter: blur(0); opacity: 1; }
    100%{ transform: scale(1) rotate(0deg); }
  }
  @keyframes fxTracking {
    0% { letter-spacing: .35em; opacity: 0; }
    60%{ letter-spacing: -.06em; opacity: 1; }
    100%{ letter-spacing: 0em; }
  }
  @keyframes fxFadeSlide {
    0% { transform: translateY(10px); opacity: 0; filter: saturate(.8) brightness(.9); }
    100%{ transform: translateY(0);   opacity: 1; filter: none; }
  }
  @keyframes fxGlitchPhase {
    0%,100% { clip-path: inset(0 0 0 0); }
    30% { clip-path: inset(5% 0 40% 0); }
    60% { clip-path: inset(40% 0 5% 0); }
  }
  @keyframes fxSpray {
    0% { text-shadow: 0 0 0 currentColor; opacity: 0; letter-spacing: .12em; }
    70%{ opacity: 1; letter-spacing: -.03em; }
    100%{ letter-spacing: 0; }
  }`;
  const style = document.createElement("style");
  style.id = "fxStyles";
  style.textContent = css;
  document.head.appendChild(style);
})();

// ====== Helpers de efectos ======
function clearFx() {
  wordEl.classList.remove("fx-scale-in","fx-tracking","fx-glitch","fx-stencil","fx-fade-slide","fx-reset");
  void wordEl.offsetWidth; // reflow para reiniciar animación
}
function applyEffect(effect, textForPseudo) {
  clearFx();
  if (textForPseudo) wordEl.setAttribute("data-text", textForPseudo);
  switch (effect) {
    case "tipos_moviles": wordEl.classList.add("fx-scale-in"); break;
    case "reticula_modernista": wordEl.classList.add("fx-tracking"); break;
    case "glitch_control": wordEl.classList.add("fx-glitch"); break;
    case "impacto_calle": wordEl.classList.add("fx-stencil"); break;
    default: wordEl.classList.add("fx-fade-slide");
  }
}

// ====== Ajuste responsivo del tamaño de la palabra ======
function fitWord() {
  const container = document.getElementById("word-container");
  const max = Math.min(container.clientWidth, Math.max(220, window.innerHeight * 0.23));
  const txt = wordEl.textContent.trim();
  const base = (txt.length <= 4) ? 13 : (txt.length <= 8 ? 10 : 8);
  wordEl.style.fontSize = `min(${base}vw, ${max}px)`;
}

// ====== Render principal (async para cargar fuente) ======
async function render() {
  const item = recorridoTipografico[idx];

  // Palabra + contexto
  wordEl.textContent = item.palabra;
  contextEl.textContent = `${item.periodo}${item.anio ? " ("+item.anio+")" : ""}: ${item.contexto}`;

  // Columna izquierda
  periodEl.textContent = item.periodo;
  yearEl.textContent = `Año: ${item.anio ?? "—"}`;

  // Stack abierto (Adobe→caídas) desde dataset (ahora se llama item.stack)
  const stackKey = item.stack;
  const openStack =
    fontStacks?.[stackKey] ||
    fontStacks?.montserrat ||
    "Montserrat, Helvetica, Arial, sans-serif";

  // Nombre a mostrar: usa fuente histórica si existe, si no la clave de stack
  fontNameEl.textContent = item.fuenteHistorica || stackKey;
  stackEl.textContent = openStack;

  // Peso deseado (del dataset) con fallback
  const desiredWeight = Number(item.peso) || 700;

  // Resolver familia real (Adobe/alias) + aplicar
  const resolved = await resolveFontFamily({
    aliasKey: item.fuenteHistorica, // p.ej. "Akzidenz Grotesk"
    stackKey,                       // p.ej. "akzidenz"
    fallbackStack: openStack,
    desiredWeight
  });
  const finalStack = `${resolved}, ${openStack}`;

  // Aplicar stacks y pesos
  wordEl.style.fontFamily = finalStack;
  wordEl.style.fontWeight = desiredWeight;

// Mostrar el nombre de la tipografía usando la tipografía resuelta
const strip = s => (s || "").toString().replace(/^['"]|['"]$/g, "");
let displayName = strip(resolved);

// Si existe fontAliases (del dataset), intenta mapear a nombre humano
try {
  for (const [human, arr] of Object.entries(fontAliases || {})) {
    if (arr.some(a => strip(a).toLowerCase() === displayName.toLowerCase())) {
      displayName = human;
      break;
    }
  }
} catch { /* noop */ }

fontPreviewEl.style.fontFamily = finalStack;
fontPreviewEl.style.fontWeight = 400;
fontPreviewEl.textContent = displayName; // ← nombre mostrado con la misma fuente
    fontPreviewEl.style.fontSize = "3rem";

  // Efecto por período + fondo reactivo
  const fx = effectByPeriod[item.periodo] || "fade_slide";
  applyEffect(fx, item.palabra);
  document.body.setAttribute("data-period", item.periodo);

  // Ajuste tamaño
  fitWord();
}

// ====== Navegación ======
function next() { idx = (idx + 1) % recorridoTipografico.length; render(); }
function prev() { idx = (idx - 1 + recorridoTipografico.length) % recorridoTipografico.length; render(); }

btnNext.addEventListener("click", next);
btnPrev.addEventListener("click", prev);
wordEl.addEventListener("click", next);
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") next();
  if (e.key === "ArrowLeft") prev();
});
window.addEventListener("resize", fitWord);

// ====== Inicio ======
render();
