"""
Generar 30 imágenes distintas de la letra E (1080x1080),
recorriendo el espacio latente del decoder_E.

Se guardan en:
flipbook_imgs/E
"""

import tensorflow as tf
import numpy as np
from pathlib import Path
from PIL import Image

# =======================================
# CONFIG
# =======================================

LATENT_DIM = 64
IMG_OUT = 1080
N_IMGS = 30
THRESH = 0.55  # threshold real para letras nítidas (ajustable)

BASE = Path(__file__).resolve().parent.parent
SAVED_MODELS = BASE / "saved_models_temp"

OUT_DIR = BASE / "flipbook_imgs" / "E"
OUT_DIR.mkdir(parents=True, exist_ok=True)


# =======================================
# CARGAR DECODER DE LA LETRA E
# =======================================

def cargar_decoder_E():
    ruta = SAVED_MODELS / "decoder_E"
    if not ruta.exists():
        raise FileNotFoundError(f"No encontré decoder_E en {ruta}")

    print(f"🔍 Cargando decoder_E desde SavedModel: {ruta}")
    decoder = tf.saved_model.load(str(ruta))
    return decoder


# =======================================
# GENERAR VECTOR LATENTE (suavizado)
# =======================================

def generar_latente(idx: int) -> np.ndarray:
    """
    Variación suave del espacio latente, continua pero diversa.
    Igual filosofía aplicada en la letra G.
    """
    coarse_len = 16
    xs_coarse = np.linspace(0, 1, coarse_len)
    xs_full = np.linspace(0, 1, LATENT_DIM)

    rng = np.random.default_rng(seed=idx * 2024)
    coarse = rng.normal(0, 1, coarse_len)

    smooth = np.interp(xs_full, xs_coarse, coarse)

    return smooth.astype("float32")[None, :]


# =======================================
# DECODIFICAR → THRESHOLD → ESCALAR
# =======================================

def decodificar(decoder, z: np.ndarray) -> Image.Image:

    fn = decoder.signatures["serving_default"]

    # detectar nombre real del input
    nombre_input = list(fn.structured_input_signature[1].keys())[0]
    nombre_out = list(fn.structured_outputs.keys())[0]

    # ejecutar modelo
    z_tf = tf.convert_to_tensor(z, dtype=tf.float32)
    salida = fn(**{nombre_input: z_tf})
    arr = salida[nombre_out].numpy()[0, :, :, 0]  # (64,64)

    # =====================
    # Normalizar y threshold
    # =====================
    arr_norm = (arr - arr.min()) / max(1e-5, arr.max() - arr.min())
    arr_bw = (arr_norm > THRESH).astype(np.uint8) * 255

    # Convertir a RGB fondo blanco
    rgb = np.ones((64, 64, 3), dtype=np.uint8) * 255
    rgb[arr_bw < 128] = [0, 0, 0]

    # Escalar a 1080 sin suavizado
    img = Image.fromarray(rgb, mode="RGB")
    img = img.resize((IMG_OUT, IMG_OUT), Image.NEAREST)

    return img


# =======================================
# MAIN
# =======================================

def main():
    decoder = cargar_decoder_E()

    print("\n🌀 Generando 30 letras E distintas...\n")

    for i in range(1, N_IMGS + 1):
        z = generar_latente(i)
        img = decodificar(decoder, z)

        nombre = f"E_{i:03d}.png"
        ruta_salida = OUT_DIR / nombre
        img.save(ruta_salida)

        print(f"✓ Guardado {ruta_salida}")

    print("\n🎉 Flipbook listo en:")
    print(OUT_DIR)


if __name__ == "__main__":
    main()
