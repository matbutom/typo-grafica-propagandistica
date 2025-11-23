import cv2
import numpy as np
import os
from pathlib import Path

# === CONFIGURACIÓN ===
SRC_DIR = Path("flipbook_imgs")   # Carpeta que contiene A/, B/, C/...
OUT_DIR = Path("flipbook_clean")  # Output aquí

TARGET_SIZE = 1024  # Tamaño cuadrado final (puedes cambiarlo)

# === CREAR OUTPUT ===
OUT_DIR.mkdir(exist_ok=True)

# === FUNCIÓN: detecta letra blanca o negra ===
def detect_inversion(img_gray):
    mean_val = np.mean(img_gray)
    return mean_val > 127  # True → imagen clara (invertir)

# === FUNCIÓN: limpiar, convertir a negro, recortar y centrar ===
def normalize_image(img_path, out_path):
    img = cv2.imread(str(img_path), cv2.IMREAD_UNCHANGED)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # invertimos si la letra es clara
    if detect_inversion(gray):
        gray = 255 - gray

    # umbral para encontrar letra
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)

    coords = cv2.findNonZero(255 - thresh)
    if coords is None:
        return

    x, y, w, h = cv2.boundingRect(coords)
    cropped = gray[y:y + h, x:x + w]

    # 🔁 CORRECCIÓN: letra debe ser negra, fondo transparente
    _, mask = cv2.threshold(cropped, 200, 255, cv2.THRESH_BINARY)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = 0  # negro
    rgba[:, :, 3] = cv2.bitwise_not(mask)  # invertimos alpha 

    # === Redimensionar + centrar ===
    scale = min(TARGET_SIZE / h, TARGET_SIZE / w)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(rgba, (new_w, new_h), interpolation=cv2.INTER_NEAREST)

    canvas = np.zeros((TARGET_SIZE, TARGET_SIZE, 4), dtype=np.uint8)
    x_off = (TARGET_SIZE - new_w) // 2
    y_off = (TARGET_SIZE - new_h) // 2
    canvas[y_off:y_off + new_h, x_off:x_off + new_w] = resized

    cv2.imwrite(str(out_path), canvas)

# === PROCESAR TODAS LAS LETRAS ===
for letter_dir in SRC_DIR.iterdir():
    if letter_dir.is_dir():
        out_letter_dir = OUT_DIR / letter_dir.name
        out_letter_dir.mkdir(exist_ok=True)

        for img_file in letter_dir.glob("*.png"):
            normalize_image(img_file, out_letter_dir / img_file.name)

print("✨ Normalización completa (corregida)!")
print(f"Archivos guardados en → {OUT_DIR}")
