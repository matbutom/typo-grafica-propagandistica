// =====================================================
//  Typo-Grafica Propagandistica — motor con PNGs
//  - Auto-escritura "humana"
//  - Modo usuario al teclear
//  - Cursor titilante
//  - 30 variantes por letra (A-Z) en type_imgs/
// =====================================================

// === TEXTO AUTOMÁTICO ===
let autoText = "Typografica Propagandistica es un proyecto exploratorio de la tipografia en afiches politicos chilenos y de latinoamerica usando codigo e inteligencia artificial";
let autoBuffer = "";
let autoIndex = 0;
let lastAutoType = 0;
let nextAutoDelay = 120; // se recalcula según carácter

// === TEXTO USUARIO ===
let userBuffer = "";
let userTyping = false;
let lastKeyTime = 0;

// === CURSOR ===
let cursorVisible = true;
let lastCursorBlink = 0;
const CURSOR_BLINK = 450;

// === CONFIG ===
const INACTIVITY_TIMEOUT = 3000; // ms sin teclear → volver a auto
const TEXT_SIZE = 80;            // tamaño "máquina de escribir"
const CELL_W = TEXT_SIZE * 1;    // ancho de celda por carácter
const CELL_H = TEXT_SIZE * 1.3;  // alto de línea

// === VARIANTES PNG POR LETRA ===
let variants = {};          // { "A": [img1, img2, ...], ... }
let assignedVariants = {};  // { indexEnTexto: img }

// ==========================
//           PRELOAD
// ==========================
function preload() {
  let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let c of letters) {
    variants[c] = [];

    // intentamos cargar hasta 30 variantes: A_001.png ... A_030.png
    for (let i = 1; i <= 30; i++) {
      let n = String(i).padStart(3, "0");
      let filename = `${c}_${n}.png`;
      let path = `type_imgs/${c}/${filename}`;

      // loadImage maneja bien los 404; solo añadimos las que cargan
      loadImage(
        path,
        img => {
          variants[c].push(img);
        },
        err => {
          // si no existe, no hacemos nada
        }
      );
    }
  }
}

// ==========================
//            SETUP
// ==========================
function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  background(255);
}

// ==========================
//             DRAW
// ==========================
function draw() {
  background(255);

  let now = millis();

  // cursor titilante
  if (now - lastCursorBlink > CURSOR_BLINK) {
    cursorVisible = !cursorVisible;
    lastCursorBlink = now;
  }

  const startX = 50;
  const startY = 90;
  let endPos;

  // ====== MODO USUARIO ======
  if (userTyping) {
    if (now - lastKeyTime > INACTIVITY_TIMEOUT) {
      userTyping = false;
      userBuffer = "";
      autoBuffer = "";
      autoIndex = 0;
      assignedVariants = {};
    }

    endPos = drawGlyphString(userBuffer, startX, startY);
    if (cursorVisible && endPos) drawCursor(endPos);
    return;
  }

  // ====== MODO AUTOMÁTICO ======
  if (now - lastAutoType > nextAutoDelay) {
    let ch = autoText.charAt(autoIndex % autoText.length);
    autoBuffer += ch;
    autoIndex++;

    lastAutoType = now;
    nextAutoDelay = computeHumanDelay(ch);
  }

  endPos = drawGlyphString(autoBuffer, startX, startY);
  if (cursorVisible && endPos) drawCursor(endPos);
}

// ====================================
//   VELOCIDAD HUMANA DEL AUTO TEXTO
// ====================================
function computeHumanDelay(ch) {
  let d = random(40, 140); // base rápida
  if (ch === " ") d += random(80, 220);         // pausa entre palabras
  if (".,;:!?…".includes(ch)) d += random(150, 320); // pausa en signos
  return d;
}

// ==========================
//  ENTRADA DE TECLADO
// ==========================
function keyTyped() {
  // siempre en mayúsculas (como afiches)
  let up = key.toUpperCase();

  if (!userTyping) {
    userTyping = true;
    autoBuffer = "";
    autoIndex = 0;
    userBuffer = "";
    assignedVariants = {};
  }

  userBuffer += up;
  lastKeyTime = millis();
}

function keyPressed() {
  if (keyCode === BACKSPACE) {
    if (userBuffer.length > 0) {
      // eliminar variante asociada al último índice
      let lastIndex = userBuffer.length - 1;
      delete assignedVariants[lastIndex];

      userBuffer = userBuffer.slice(0, -1);
      lastKeyTime = millis();
    }
    return false;
  }
}

// ================================
//   DIBUJAR CURSOR COMO LÍNEA
// ================================
function drawCursor(pos) {
  stroke(0);
  strokeWeight(3);
  let x = pos.x;
  let y = pos.y;
  line(x, y - TEXT_SIZE * 0.9, x, y + TEXT_SIZE * 0.2);
}

// =====================================
//    DIBUJAR VARIANTE PNG (INVERTIDA)
// =====================================
function drawVariantImage(img, x, y) {
  push();
  imageMode(CENTER);
  let s = TEXT_SIZE * 1.1;

  // 👉 Invertir colores usando modo DIFERENCIA sobre fondo blanco
  blendMode(DIFFERENCE);
  image(img, x + CELL_W / 2, y, s, s);

  pop();
}

// =====================================
//    DIBUJAR STRING CON PNGs
// =====================================
function drawGlyphString(txt, x, y) {
  let cx = x;
  let cy = y;
  let maxWidth = width - 80;

  for (let i = 0; i < txt.length; i++) {
    let c = txt[i];

    // saltos de línea manuales (por si acaso)
    if (c === "\n") {
      cx = x;
      cy += CELL_H;
      continue;
    }

    // espacios
    if (c === " ") {
      if (cx + CELL_W > maxWidth) {
        cx = x;
        cy += CELL_H;
      } else {
        cx += CELL_W * 0.6;
      }
      continue;
    }

    // cualquier otro carácter: intentamos letra A-Z
    let up = c.toUpperCase();
    let imgs = variants[up];

    // salto de línea si no cabe
    if (cx + CELL_W > maxWidth) {
      cx = x;
      cy += CELL_H;
    }

    if (imgs && imgs.length > 0 && up >= "A" && up <= "Z") {
      // asignar variante fija para este índice si no existe aún
      if (!assignedVariants[i]) {
        assignedVariants[i] = random(imgs);
      }
      drawVariantImage(assignedVariants[i], cx, cy);
    } else {
      // si no hay PNG para este carácter, dibujamos un rectángulo guía simple
      push();
      noFill();
      stroke(0);
      rect(cx, cy - TEXT_SIZE * 0.8, CELL_W * 0.6, TEXT_SIZE);
      pop();
    }

    cx += CELL_W;
  }

  // devolvemos posición final para el cursor
  return { x: cx, y: cy };
}

// ==========================
//  RESPONSIVE
// ==========================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
