const container = document.getElementById("canvas-container");
const LATENT_DIM = 64;
let cells = [];

// Crear celdas
for (let i = 0; i < LATENT_DIM; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    
    const span = document.createElement("span");
    span.textContent = "0.0";
    cell.appendChild(span);
    
    container.appendChild(cell);
    cells.push({ div: cell, span: span });
}

function update() {
    const raw = localStorage.getItem("live_latent_vector_z");
    if (!raw) return;

    let z;
    try { z = JSON.parse(raw); } catch { return; }

    for (let i = 0; i < LATENT_DIM; i++) {
        const v = z[i];
        
        // Actualizar número
        cells[i].span.textContent = v.toFixed(1);

        // --- LÓGICA DE COLOR ESCALA DE GRISES ---
        // 0   = Gris Medio (127)
        // +5  = Blanco (255)
        // -5  = Negro (0)
        
        // Mapeamos el valor (-5 a 5) a rango de brillo (0 a 255)
        // Multiplicamos por 25 para dar sensibilidad (5 * 25 = 125 de rango hacia arriba/abajo)
        let brightness = 127 + (v * 30); 

        // Limitamos para que no se rompa el color (Clamp 0-255)
        brightness = Math.max(0, Math.min(255, brightness));
        
        // Aplicamos el color de fondo
        cells[i].div.style.backgroundColor = `rgb(${brightness}, ${brightness}, ${brightness})`;

        // --- CONTRASTE DEL TEXTO ---
        // Si el fondo es muy claro, texto negro. Si es oscuro, texto blanco.
        if (brightness > 140) {
            cells[i].div.style.color = "#000000"; // Texto Negro
        } else {
            cells[i].div.style.color = "#ffffff"; // Texto Blanco
        }
        
        // Si el valor es muy extremo (cerca de 5 o -5), ponemos negrita extra
        if (Math.abs(v) > 3) {
            cells[i].div.style.fontWeight = "900";
        } else {
            cells[i].div.style.fontWeight = "400";
        }
    }
}

// 60 FPS
setInterval(update, 16);