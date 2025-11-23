const container = document.getElementById("canvas-container");

const LATENT_DIM = 64;
const SIDE = 8; // grilla 8x8
let cells = [];

// Crear la grilla 8x8 de valores numéricos
for (let i = 0; i < LATENT_DIM; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";

    const valueSpan = document.createElement("span");
    valueSpan.className = "cell-value";
    valueSpan.textContent = "0.00";

    cell.appendChild(valueSpan);
    container.appendChild(cell);

    cells.push(valueSpan);
}

function update() {
    const raw = localStorage.getItem("live_latent_vector_z");
    if (!raw) return;

    let z;
    try {
        z = JSON.parse(raw);
    } catch {
        return;
    }

    for (let i = 0; i < LATENT_DIM; i++) {
        const v = z[i];
        cells[i].textContent = v.toFixed(2);

        // Color según intensidad (-5 a +5)
        const intensity = (v + 5) / 10; // map → 0 a 1
        const green = Math.floor(50 + intensity * 205); // 50–255
        const red = Math.floor(100 - intensity * 100);   // 100–0

        cells[i].parentElement.style.backgroundColor =
            `rgb(${red}, ${green}, 80)`;
    }
}

// actualización en tiempo real
setInterval(update, 50);
