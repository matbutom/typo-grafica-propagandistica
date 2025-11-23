"""
Generar múltiples hojas A3 con variaciones profundas del espacio latente,
usando threshold robusto, barajado de letras y latentes más expresivos.

Typografica Propagandistica — Rafita Studio
"""

import tensorflow as tf
import numpy as np
from pathlib import Path
from PIL import Image
import random
import re

# =======================================
# CONFIG
# =======================================

LATENT_DIM = 64
IMG_SIZE = 64
NUEVAS_HOJAS = 10

ESCALA_LATENTE = 2.8          # mejor controlado
NOISE_EXTRA = 0.35            # más variabilidad por celda
THRESH = 0.55                 # threshold robusto

A3_DPI = 300

BASE = Path(__file__).resolve().parent.parent
SAVED_MODELS = BASE / "saved_models_temp"
OUTPUT_DIR = BASE / "abecedariosA3_grilla"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

LETRAS = [chr(c) for c in range(ord("A"), ord("Z") + 1)]


# =======================================
# CARGA DE DECODERS
# =======================================

def cargar_decoders():
    modelos = {}
    print(f"Cargando decoders desde: {SAVED_MODELS}\n")

    for letra in LETRAS:
        ruta = SAVED_MODELS / f"decoder_{letra}"
        if not ruta.exists():
            print(f"✗ No encontrado decoder_{letra}")
            continue

        try:
            modelos[letra] = tf.saved_model.load(str(ruta))
            print(f"✓ Cargado decoder_{letra}")
        except Exception as e:
            print(f"⚠️ Error cargando decoder_{letra}: {e}")

    print()
    return modelos


# =======================================
# DETECTAR NUMERACIÓN EXISTENTE
# =======================================

def detectar_ultimo_indice():
    patron = re.compile(r"abecedario_A3_grilla_(\d+)\.png")
    max_n = 0

    for archivo in OUTPUT_DIR.iterdir():
        m = patron.match(archivo.name)
        if m:
            max_n = max(max_n, int(m.group(1)))

    return max_n


# =======================================
# GENERAR LATENTE (mucho más variado)
# =======================================

def generar_latente(pagina_idx: int, celda_idx: int) -> np.ndarray:
    """
    Latente expresivo y muy variable.
    - Interpolación suave
    - Ruido por celda
    - Offset global por página
    """

    seed = pagina_idx * 10000 + celda_idx
    rng = np.random.default_rng(seed)

    # ruido interpolado
    coarse_len = 12
    xs_coarse = np.linspace(0, 1, coarse_len)
    xs_full = np.linspace(0, 1, LATENT_DIM)

    coarse_noise = rng.normal(0, 1, coarse_len)
    base_latent = np.interp(xs_full, xs_coarse, coarse_noise)

    # escala general
    base_latent *= ESCALA_LATENTE

    # ruido extra por celda
    base_latent += rng.normal(0, NOISE_EXTRA, LATENT_DIM)

    # offset global por página
    offset = np.sin(pagina_idx * 0.42) * 0.8
    base_latent += offset

    return base_latent.astype("float32")[None, :]


# =======================================
# GENERAR LETRA (threshold + blanco/negro)
# =======================================

def generar_letra(decoder, z: np.ndarray) -> Image.Image:
    fn = decoder.signatures["serving_default"]

    nombre_input = list(fn.structured_input_signature[1].keys())[0]
    nombre_out = list(fn.structured_outputs.keys())[0]

    z_tf = tf.convert_to_tensor(z, dtype=tf.float32)
    salida = fn(**{nombre_input: z_tf})
    arr = salida[nombre_out].numpy()[0, :, :, 0]

    # normalizar a 0–1
    arr_norm = (arr - arr.min()) / max(1e-5, arr.max() - arr.min())

    # threshold robusto: letra negra, fondo blanco
    arr_bw = (arr_norm > THRESH).astype(np.uint8) * 255

    rgb = np.ones((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8) * 255
    rgb[arr_bw < 128] = [0, 0, 0]

    return Image.fromarray(rgb, mode="RGB")


# =======================================
# GENERAR HOJA A3
# =======================================

def generar_hoja_A3(modelos, nombre_archivo: str, pagina_idx: int):
    A3_W = int(11.69 * A3_DPI)
    A3_H = int(16.54 * A3_DPI)

    lienzo = Image.new("RGB", (A3_W, A3_H), "white")

    COLS = 4
    ROWS = 8

    CELL_W = A3_W // (COLS + 1)
    CELL_H = A3_H // (ROWS + 1)

    # letras mezcladas para variabilidad entre hojas
    letras_shuffled = LETRAS.copy()
    random.seed(pagina_idx)
    random.shuffle(letras_shuffled)

    index = 0
    for fila in range(ROWS):
        for col in range(COLS):
            letra = letras_shuffled[index % len(LETRAS)]
            index += 1

            if letra not in modelos:
                continue

            decoder = modelos[letra]
            z = generar_latente(pagina_idx, index)

            img = generar_letra(decoder, z)
            img = img.resize((IMG_SIZE * 4, IMG_SIZE * 4), Image.NEAREST)

            x = (col + 1) * CELL_W - img.width // 2
            y = (fila + 1) * CELL_H - img.height // 2

            lienzo.paste(img, (x, y))

    salida = OUTPUT_DIR / nombre_archivo
    lienzo.save(salida, "PNG", dpi=(A3_DPI, A3_DPI))
    print("✓ Guardado:", salida)


# =======================================
# MAIN
# =======================================

def main():
    modelos = cargar_decoders()
    if not modelos:
        print("No se cargaron modelos.")
        return

    ultimo = detectar_ultimo_indice()
    print(f"Último índice existente: {ultimo}")

    inicio = ultimo + 1
    fin = ultimo + NUEVAS_HOJAS

    print(f"\nGenerando {NUEVAS_HOJAS} nuevas hojas A3...")
    print(f"Irán desde {inicio:03d} hasta {fin:03d}.\n")

    for i in range(inicio, fin + 1):
        nombre = f"abecedario_A3_grilla_{i:03d}.png"
        generar_hoja_A3(modelos, nombre, pagina_idx=i)

    print("\nListo. Nuevas hojas en:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
