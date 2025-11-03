const logo = document.getElementById("logo");
const logoImg = document.getElementById("logo-img");
const intro = document.getElementById("intro");

const introText = `Typográfica Propagandística investiga cómo la tipografía en afiches políticos latinoamericanos comunica ideas y emociones, apropiándonos de ella y dándole una nueva identidad generativa.`;

intro.textContent = ""; // vacío al inicio
typeIntro(introText);   // escribir lentamente

function typeIntro(text) {
  intro.textContent = "";
  let i = 0;
  const speed = 30;
  const timer = setInterval(() => {
    intro.textContent += text.charAt(i);
    i++;
    if (i >= text.length) clearInterval(timer);
  }, speed);
}

// hover logo
logo.addEventListener("mouseenter", () => {
  // mostrar logo plano y SIN rotación
  logoImg.style.animation = "none";
  logoImg.style.transform = "rotate(0deg)";
  logoImg.style.borderRadius = "0";
  logoImg.src = "assets/img/TP_logo.png";
});

logo.addEventListener("mouseleave", () => {
  // volver al avatar girando
  logoImg.src = "assets/img/typ_avtar.jpg";
  logoImg.style.borderRadius = "9999px";
  // forzar reflow para que vuelva la animación
  void logoImg.offsetWidth;
  logoImg.style.animation = "spin 12s linear infinite";
});
