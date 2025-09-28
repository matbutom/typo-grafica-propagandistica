// Configuración inicial de décadas y estilos
const timeline = [
  {
    period: "1930-1950",
    font: "'Times New Roman', serif",
    effect: "tipos_moviles",
    context: "La letra como ideología: gótica en Europa, sans-serif manual en Chile.",
  },
  {
    period: "1960-1973",
    font: "'Helvetica', sans-serif",
    effect: "reticula_modernista",
    context: "Modernismo gráfico y muralismo popular conviven en Chile.",
  }
  // ... puedes ir sumando más décadas
];

let currentIndex = 0;
const wordEl = document.getElementById("word");
const contextEl = document.getElementById("context-text");

// Función para actualizar pantalla
function renderDecade(index) {
  const decade = timeline[index];
  wordEl.style.fontFamily = decade.font;
  wordEl.textContent = "NO"; // palabra fija de prueba
  contextEl.textContent = `${decade.period}: ${decade.context}`;

  // Animaciones simples según efecto
  if (decade.effect === "tipos_moviles") {
    wordEl.style.transform = "scale(0.1)";
    setTimeout(() => {
      wordEl.style.transform = "scale(1)";
    }, 100);
  }

  if (decade.effect === "reticula_modernista") {
    wordEl.style.letterSpacing = "-0.1em";
    setTimeout(() => {
      wordEl.style.letterSpacing = "0em";
    }, 500);
  }
}

// Navegación
document.getElementById("next").addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % timeline.length;
  renderDecade(currentIndex);
});

document.getElementById("prev").addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + timeline.length) % timeline.length;
  renderDecade(currentIndex);
});

// Iniciar con primera década
renderDecade(currentIndex);
