document.querySelectorAll(".thumb").forEach(thumb => {
  const img = thumb.querySelector("img");

  thumb.addEventListener("mousemove", e => {
    const rect = thumb.getBoundingClientRect();
    const x = e.clientX - rect.left;   // pos dentro del rectángulo
    const y = e.clientY - rect.top;

    const rotateX = ((y / rect.height) - 0.5) * 10; // hasta ±10°
    const rotateY = ((x / rect.width) - 0.5) * -10;

    img.style.transform = `scale(1.07) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  thumb.addEventListener("mouseleave", () => {
    img.style.transform = "scale(1) rotateX(0) rotateY(0)";
  });
});
