"""
exportar_latentes_json.py

Versión MUY acotada:
- SOLO letra "A"
- Pocos vectores y dimensión baja
- Genera:
  - latentes_A.json            → JSON compacto y pequeño
  - latentes_A_parrafo.txt     → texto con saltos de línea cada 10 "palabras"
"""

import json
import random
from datetime import datetime
from pathlib import Path

# ==========================
# CONFIGURACIÓN
# ==========================

LATENT_DIM = 16          # dimensión del espacio latente (acotada)
VECTORES_POR_LETRA = 5   # cantidad de vectores (acotado)
ESCALA_LATENTE = 1.0     # desviación estándar del ruido
SEED = 1234              # para reproducibilidad

BASE = Path(__file__).resolve().parent  # carpeta donde está este .py
OUTPUT_JSON = BASE / "latentes_A.json"
OUTPUT_PARRAFO = BASE / "latentes_A_parrafo.txt"

LETRAS = ["A"]           # solo trabajamos con la letra A


# ==========================
# GENERACIÓN
# ==========================

def generar_vector_latente():
    """Devuelve un vector latente con distribución normal N(0, ESCALA_LATENTE^2)."""
    return [random.gauss(0.0, ESCALA_LATENTE) for _ in range(LATENT_DIM)]


def main():
    random.seed(SEED)

    data = {
        "proyecto": "Typografica Propagandistica",
        "descripcion": "Muestrario ultra acotado de valores del espacio latente para la letra A.",
        "latent_dim": LATENT_DIM,
        "vectores_por_letra": VECTORES_POR_LETRA,
        "escala_latente": ESCALA_LATENTE,
        "seed": SEED,
        "generado_en": datetime.now().isoformat(timespec="seconds"),
        "data": []
    }

    # Guardamos info básica y los vectores
    for letra in LETRAS:
        for i in range(VECTORES_POR_LETRA):
            vec = generar_vector_latente()
            vec_redondeado = [round(v, 4) for v in vec]

            item = {
                "id": f"{letra}_{i:03d}",
                "letra": letra,
                "vector": vec_redondeado,
                "vector_str": ", ".join(f"{v:.4f}" for v in vec_redondeado),
            }
            data["data"].append(item)

    # ==========================
    # 1) JSON COMPACTO Y PEQUEÑO
    # ==========================
    with OUTPUT_JSON.open("w", encoding="utf-8") as f_json:
        json.dump(
            data,
            f_json,
            ensure_ascii=False,
            separators=(",", ":")  # sin espacios → más compacto
        )

    # ==========================
    # 2) TEXTO CON SALTOS CADA 10 PALABRAS
    # ==========================
    # Construimos una lista de "palabras" a partir de los datos:
    # usamos id, letra y los números del vector.
    tokens = []

    for item in data["data"]:
        tokens.append(item["id"])         # ej: A_000
        tokens.append(item["letra"])      # "A"
        for v in item["vector"]:
            tokens.append(f"{v:.4f}")     # números como palabras

    # Ahora agrupamos de 10 en 10 para meter un Enter
    lineas = []
    CHUNK = 10  # cantidad de "palabras" por línea

    for i in range(0, len(tokens), CHUNK):
        chunk = tokens[i:i + CHUNK]
        linea = " ".join(chunk)
        lineas.append(linea)

    parrafo = "\n".join(lineas)

    with OUTPUT_PARRAFO.open("w", encoding="utf-8") as f_txt:
        f_txt.write(parrafo)

    print("✅ JSON compacto:", OUTPUT_JSON.resolve())
    print("✅ Texto con saltos cada 10 palabras:", OUTPUT_PARRAFO.resolve())


if __name__ == "__main__":
    main()
