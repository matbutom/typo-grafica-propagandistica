import os
import numpy as np
from PIL import Image
import tensorflow as tf

# === CONFIG ===
DECODER_PATH = "saved_models_temp/decoder_G"   # ruta corregida
OUTPUT_DIR = "flipbook_imgs/G"
N_IMGS = 30
Z_DIM = 64
IMG_OUT_SIZE = 1080
THRESHOLD_VALUE = 0.55   # ajustable (0.45–0.65 recomendable)

# Crear carpeta
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"🔍 Cargando decoder_G desde SavedModel: {DECODER_PATH}")
decoder = tf.saved_model.load(DECODER_PATH)

# La función de inferencia (varía segun SavedModel)
infer = decoder.signatures["serving_default"]

def sample_latent_vector():
    """z suave, explorando el espacio latente de forma continua."""
    return np.random.normal(0, 1, (1, Z_DIM)).astype(np.float32)

def apply_threshold(img_array):
    """
    Convierte a blanco y negro estilo 'recorte', sin tonos grises.
    """
    img_norm = (img_array - img_array.min()) / max(1e-5, img_array.max() - img_array.min())
    binary = (img_norm > THRESHOLD_VALUE).astype(np.uint8)
    return binary * 255

def upscale(img_array):
    """Escala a 1080x1080 sin interpolación suave (lo mantiene crudo)."""
    img = Image.fromarray(img_array)
    return img.resize((IMG_OUT_SIZE, IMG_OUT_SIZE), Image.NEAREST)

print("🌀 Generando 30 muestras de la letra G…")

for i in range(N_IMGS):
    z = sample_latent_vector()
    
    # ejecutar modelo
    out = infer(input_4=tf.constant(z))
    arr = out["conv2d_transpose_5"].numpy()[0, :, :, 0]  # (64x64)

    # aplicar threshold
    arr_bw = apply_threshold(arr)

    # escalar
    img_final = upscale(arr_bw)

    # guardar
    filename = os.path.join(OUTPUT_DIR, f"G_{i+1:03d}.png")
    img_final.save(filename)

    print(f"✓ {filename}")

print("🎉 Flipbook de G generado!")
