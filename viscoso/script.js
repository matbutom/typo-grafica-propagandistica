// === VISCOSO v2.9 + VISOR (rutas corregidas) ===
// Mateo Arce — Rafita Studio

let letras = [];
let rutas = [];
let dragging = null;

const IMAGEN_SIZE = 80;
const MAX_LETRAS_VISIBLES = 600;
const CENTER_W = 900;
const CENTER_H = 200;
const REPULSION_CENTRO = 0.02;
const FLOTAR_SPEED = 0.001;
const NOISE_SCALE = 0.0009;
const NOISE_SPEED = 0.0008;
const MAX_POR_LETRA = 15;
// ahora estamos dentro de /viscoso/
const JSON_PATH = "../recortes_letras_index.json";

let ultimoX = null;

// canal para hablar con el visor
const posterChannel = new BroadcastChannel("viscoso-posters");
let viewerWindow = null;

// ---------- CARGA DE DATOS ----------
function preload() {
  rutas = loadJSON(JSON_PATH, (data) => {
    if (!Array.isArray(data)) data = Object.values(data);
    rutas = data;
  });
}

// ---------- CONFIGURACIÓN INICIAL ----------
function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  noStroke();

  // abrir el visor una sola vez
  setTimeout(() => {
    viewerWindow = window.open("visor.html", "visor-viscoso");
  }, 500);

  if (!rutas || rutas.length === 0) return;

  const grupos = {};
  for (let ruta of rutas) {
    const letra = ruta.split("/")[1];
    if (!grupos[letra]) grupos[letra] = [];
    grupos[letra].push(ruta);
  }

  for (let letra in grupos) {
    let opciones = grupos[letra];
    let cantidad = min(MAX_POR_LETRA, opciones.length);
    for (let i = 0; i < cantidad; i++) {
      if (letras.length >= MAX_LETRAS_VISIBLES) break;
      let ruta = random(opciones);
      // 👇 importante: estamos en /viscoso/, así que subimos un nivel
      let img = loadImage("../" + ruta, () => {
        const pos = randomCanvasPosition();
        letras.push({
          x: pos.x,
          y: pos.y,
          tx: pos.x,
          ty: pos.y,
          img: img,
          ruta: ruta, // guardamos ruta SIN ../ para poder parsearla
          vx: random(-FLOTAR_SPEED, FLOTAR_SPEED),
          vy: random(-FLOTAR_SPEED, FLOTAR_SPEED),
          arrastrando: false,
          magnetica: false,
          noiseOffsetX: random(1000),
          noiseOffsetY: random(1000),
          rebote: 0,
        });
      });
    }
  }
}

// ---------- LOOP PRINCIPAL ----------
function draw() {
  background(250);

  // letras flotantes detrás
  for (let letra of letras) {
    if (!letra.magnetica && !letra.arrastrando) moverLetra(letra);

    letra.x = lerp(letra.x, letra.tx, 0.12);
    letra.y = lerp(letra.y, letra.ty, 0.12);

    if (letra.rebote > 0.01) {
      letra.y += sin(frameCount * 0.4) * letra.rebote;
      letra.rebote *= 0.9;
    }

    if (!letra.magnetica && !letra.arrastrando && letra.img) {
      image(letra.img, letra.x, letra.y, IMAGEN_SIZE, IMAGEN_SIZE);
    }
  }

  // rectángulo
  fill(255, 255, 255, 180);
  noStroke();
  rectMode(CENTER);
  rect(width / 2, height / 2, CENTER_W, CENTER_H, 20);

  // encima: magnetizadas y arrastradas
  for (let letra of letras) {
    if ((letra.magnetica || letra.arrastrando) && letra.img) {
      image(letra.img, letra.x, letra.y, IMAGEN_SIZE, IMAGEN_SIZE);
    }
  }
}

// ---------- MOVIMIENTO ----------
function moverLetra(letra) {
  if (letra.arrastrando || letra.magnetica) return;

  let ang =
    noise(
      letra.noiseOffsetX + letra.x * NOISE_SCALE,
      letra.noiseOffsetY + letra.y * NOISE_SCALE,
      frameCount * NOISE_SPEED
    ) *
    TWO_PI *
    2;

  letra.vx += cos(ang) * 0.02;
  letra.vy += sin(ang) * 0.02;

  // repulsión del rectángulo
  if (
    letra.x > width / 2 - CENTER_W / 2 - IMAGEN_SIZE / 2 &&
    letra.x < width / 2 + CENTER_W / 2 + IMAGEN_SIZE / 2 &&
    letra.y > height / 2 - CENTER_H / 2 - IMAGEN_SIZE / 2 &&
    letra.y < height / 2 + CENTER_H / 2 + IMAGEN_SIZE / 2
  ) {
    let dx = letra.x - width / 2;
    let dy = letra.y - height / 2;
    let mag = sqrt(dx * dx + dy * dy);
    if (mag > 0) {
      letra.vx += (dx / mag) * REPULSION_CENTRO;
      letra.vy += (dy / mag) * REPULSION_CENTRO;
    }
  }

  letra.x += letra.vx;
  letra.y += letra.vy;
  letra.vx *= 0.98;
  letra.vy *= 0.98;

  letra.tx = letra.x;
  letra.ty = letra.y;

  // reaparecer si se va lejos
  if (letra.x < -100 || letra.x > width + 100 || letra.y < -100 || letra.y > height + 100) {
    const pos = randomCanvasPosition();
    letra.x = pos.x;
    letra.y = pos.y;
    letra.tx = pos.x;
    letra.ty = pos.y;
  }
}

// ---------- INTERACCIÓN ----------
function mousePressed() {
  for (let letra of letras) {
    if (letra.img && dist(mouseX, mouseY, letra.x, letra.y) < IMAGEN_SIZE / 2) {
      letra.arrastrando = true;
      dragging = letra;
      break;
    }
  }
}

function mouseDragged() {
  if (dragging) {
    dragging.tx = mouseX;
    dragging.ty = mouseY;
  }
}

function mouseReleased() {
  if (!dragging) return;
  dragging.arrastrando = false;

  const dentro =
    dragging.x > width / 2 - CENTER_W / 2 &&
    dragging.x < width / 2 + CENTER_W / 2 &&
    dragging.y > height / 2 - CENTER_H / 2 &&
    dragging.y < height / 2 + CENTER_H / 2;

  if (dentro) {
    dragging.magnetica = true;

    // posición secuencial desde la izquierda
    if (ultimoX === null) {
      ultimoX = width / 2 - CENTER_W / 2 + IMAGEN_SIZE / 2 + 20;
    } else {
      ultimoX += IMAGEN_SIZE * 0.85;
    }

    dragging.tx = ultimoX + random(-3, 3);
    dragging.ty = height / 2 + random(-8, 8);
    dragging.rebote = random(6, 10);
    dragging.vx = 0;
    dragging.vy = 0;

    // ✉️ avisar al visor
    const posterPath = deducirPoster(dragging.ruta);
    posterChannel.postMessage({
      type: "nuevo-poster",
      recorte: "../" + dragging.ruta,   // para que el visor lo pueda ver
      poster: posterPath,               // ya viene con ../
      time: Date.now(),
    });
  } else {
    dragging.magnetica = false;
  }

  dragging = null;
}

// ---------- CLICK sobre letra magnetizada ----------
function mouseClicked() {
  for (let letra of letras) {
    if (letra.magnetica && letra.img) {
      if (dist(mouseX, mouseY, letra.x, letra.y) < IMAGEN_SIZE / 2) {
        const posterPath = deducirPoster(letra.ruta);
        posterChannel.postMessage({
          type: "nuevo-poster",
          recorte: "../" + letra.ruta,
          poster: posterPath,
          time: Date.now(),
        });
        break;
      }
    }
  }
}

// ---------- DEDUCIR POSTER ----------
function deducirPoster(rutaRecorte) {
  // ej: recortes_letras/R/R_afiches_evelyn_matthei_afiche_afiches_evelyn_matthei_088_crop_012_0034.png
  const nombre = rutaRecorte.split("/").pop(); // R_afiches_evelyn...

  // quitar prefijo de letra
  const sinLetra = nombre.replace(/^[A-Z]_/, "");

  const partes = sinLetra.split("_afiche_");
  if (partes.length < 2) {
    // fallback: mostramos el recorte original
    return "../" + rutaRecorte;
  }

  const carpeta = partes[0];         // afiches_evelyn_matthei
  const base = partes[1].split("_crop")[0]; // afiches_evelyn_matthei_088

  // ahora el visor está en /viscoso/, por eso subimos un nivel
  return `../poster_dataset/${carpeta}/afiche_${base}.jpg`;
}

// ---------- POSICIÓN ALEATORIA ----------
function randomCanvasPosition() {
  let x, y, dentro;
  do {
    x = random(width);
    y = random(height);
    dentro =
      x > width / 2 - CENTER_W / 2 - 100 &&
      x < width / 2 + CENTER_W / 2 + 100 &&
      y > height / 2 - CENTER_H / 2 - 100 &&
      y < height / 2 + CENTER_H / 2 + 100;
  } while (dentro);
  return { x, y };
}
