"""
Generar 30 imágenes distintas de la letra A (1080x1080),
recorriendo el espacio latente del decoder_A.

Se guardan en:
flipbook_imgs/A
"""

import tensorflow as tf
import numpy as np
from pathlib import Path
from PIL import Image

# =======================================
# CONFIG
# =======================================

LATENT_DIM = 64
IMG_SIZE = 64           # tamaño que produce el decoder
FINAL_SIZE = 1080       # tamaño deseado para el flipbook
N_IMGS = 30             # cuántas letras generar

ESCALA_LATENTE = 3.0    # controla variación del espacio latente

BASE = Path(__file__).resolve().parent.parent
SAVED_MODELS = BASE / "saved_models_temp"

OUT_DIR = BASE / "flipbook_imgs" / "A"
OUT_DIR.mkdir(parents=True, exist_ok=True)


# =======================================
# CARGAR DECODER DE LA LETRA A
# =======================================

def cargar_decoder_A():
    ruta = SAVED_MODELS / "decoder_A"
    if not ruta.exists():
        raise FileNotFoundError(f"No encontré decoder_A en {ruta}")

    print("Cargando decoder_A...")
    decoder = tf.saved_model.load(str(ruta))
    return decoder


# =======================================
# GENERAR VECTOR LATENTE (con suavidad)
# =======================================

def generar_latente(idx: int) -> np.ndarray:
    """
    Genera un vector latente distinto para cada idx.
    Usa ruido suave interpolado para que las imágenes tengan continuidad.
    """
    coarse_len = 16
    xs_coarse = np.linspace(0, 1, coarse_len)
    xs_full = np.linspace(0, 1, LATENT_DIM)

    rng = np.random.default_rng(seed=idx * 1111)
    coarse_noise = rng.random(coarse_len)
    smoothed = np.interp(xs_full, xs_coarse, coarse_noise)

    z = (smoothed * 2 * ESCALA_LATENTE) - ESCALA_LATENTE
    return z.astype("float32")[None, :]


# =======================================
# DECODEAR A IMAGEN
# =======================================

def decodificar(decoder, z: np.ndarray) -> Image.Image:
    fn = decoder.signatures["serving_default"]
    nombre_input = list(fn.structured_input_signature[1].keys())[0]

    z_tf = tf.convert_to_tensor(z, dtype=tf.float32)
    salida = fn(**{nombre_input: z_tf})
    arr = list(salida.values())[0].numpy()[0]

    arr = (arr * 255).clip(0, 255).astype("uint8").squeeze()

    # convertir a RGB blanco/negro
    rgb = np.ones((IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8) * 255
    rgb[arr < 200] = [0, 0, 0]

    img = Image.fromarray(rgb, mode="RGB")
    img = img.resize((FINAL_SIZE, FINAL_SIZE), Image.NEAREST)
    return img


# =======================================
# MAIN
# =======================================

def main():
    decoder_A = cargar_decoder_A()

    print("Generando 30 letras A diferentes...\n")

    for i in range(1, N_IMGS + 1):
        z = generar_latente(i)
        img = decodificar(decoder_A, z)

        nombre = f"A_{i:03d}.png"
        salida = OUT_DIR / nombre
        img.save(salida)
        print("✓ Guardado", salida)

    print("\nListo. Imágenes del flipbook en:")
    print(OUT_DIR)


if __name__ == "__main__":
    main()
