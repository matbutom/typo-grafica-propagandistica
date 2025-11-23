"""
Generar flipbooks para todas las letras (A–Z + Ñ si existe).
Cada letra genera 30 imágenes 1080×1080 recorriendo el espacio latente.

Salida:
flipbook_imgs/<LETRA>/<LETRA>_001.png ... _030.png
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
THRESH = 0.55   # threshold para letras bien definidas

LETRAS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ") + ["Ñ"]

BASE = Path(__file__).resolve().parent.parent
SAVED_MODELS = BASE / "saved_models_temp"
OUT_BASE = BASE / "flipbook_imgs"


# =======================================
# FUNCIONES DE APOYO
# =======================================

def cargar_decoder(letra: str):
    """
    Carga decoder_X desde SavedModel.
    Si no existe, retorna None.
    """
    ruta = SAVED_MODELS / f"decoder_{letra}"
    if not ruta.exists():
        print(f"✗ No existe decoder_{letra} en {ruta}")
        return None

    print(f"🔍 Cargando decoder_{letra} desde SavedModel...")
    decoder = tf.saved_model.load(str(ruta))
    return decoder


def generar_latente(idx: int) -> np.ndarray:
    """
    Variación suave en el espacio latente.
    """
    coarse_len = 16
    xs_coarse = np.linspace(0, 1, coarse_len)
    xs_full = np.linspace(0, 1, LATENT_DIM)

    rng = np.random.default_rng(seed=idx * 2024)
    coarse = rng.normal(0, 1, coarse_len)
    smooth = np.interp(xs_full, xs_coarse, coarse)

    return smooth.astype("float32")[None, :]


def decodificar(decoder, z: np.ndarray) -> Image.Image:
    """
    Decodifica z → imagen → threshold → 1080x1080
    """

    fn = decoder.signatures["serving_default"]

    # nombre real del input y output
    nombre_input = list(fn.structured_input_signature[1].keys())[0]
    nombre_out = list(fn.structured_outputs.keys())[0]

    # ejecutar modelo
    z_tf = tf.convert_to_tensor(z, dtype=tf.float32)
    salida = fn(**{nombre_input: z_tf})
    arr = salida[nombre_out].numpy()[0, :, :, 0]

    # normalizar + threshold
    arr_norm = (arr - arr.min()) / max(1e-5, arr.max() - arr.min())
    arr_bw = (arr_norm > THRESH).astype(np.uint8) * 255

    # convertir a RGB con fondo blanco
    rgb = np.ones((64, 64, 3), dtype=np.uint8) * 255
    rgb[arr_bw < 128] = [0, 0, 0]

    # escalar a 1080x1080 sin suavizado
    img = Image.fromarray(rgb, mode="RGB")
    img = img.resize((IMG_OUT, IMG_OUT), Image.NEAREST)

    return img


# =======================================
# PROCESAR UNA LETRA
# =======================================

def procesar_letra(letra: str):
    decoder = cargar_decoder(letra)
    if decoder is None:
        return  # saltar letra

    out_dir = OUT_BASE / letra
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n🌀 Generando flipbook para letra {letra}...\n")

    for i in range(1, N_IMGS + 1):
        z = generar_latente(i)
        img = decodificar(decoder, z)

        nombre = f"{letra}_{i:03d}.png"
        salida = out_dir / nombre
        img.save(salida)

        print(f"✓ {letra}: guardado {salida}")

    print(f"\n🎉 Flipbook de {letra} listo en {out_dir}\n")


# =======================================
# MAIN
# =======================================

def main():
    print("=== GENERANDO FLIPBOOKS PARA TODAS LAS LETRAS ===")
    print("Buscando decoders en:", SAVED_MODELS, "\n")

    for letra in LETRAS:
        procesar_letra(letra)

    print("\n🏁 Proceso completo. Flipbooks disponibles en:")
    print(OUT_BASE)


if __name__ == "__main__":
    main()
