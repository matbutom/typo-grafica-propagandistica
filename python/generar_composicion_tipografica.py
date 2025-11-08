"""
Generador de composiciones tipográficas artísticas
Proyecto: Tipográfica Propagandística / Máquina de Contrapropaganda
Autor: Mateo Arce — Rafita Studio
Versión: experimental + efectos ópticos + paletas cromáticas
"""

import os
import random
import numpy as np
from collections import defaultdict
from PIL import (
    Image,
    ImageOps,
    ImageEnhance,
    ImageDraw,
    ImageChops,
    ImageFilter
)
import tensorflow as tf
from keras.layers import TFSMLayer

# === CONFIGURACIÓN GENERAL ===
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
LETRAS_DIR = os.path.join(BASE_DIR, "recortes_letras")
SALIDA_DIR = os.path.join(BASE_DIR, "salidas_composiciones")
SUBMOD_DIR = os.path.join(BASE_DIR, "maquina-de-contrapropaganda")
MODELOS_DIR = os.path.join(SUBMOD_DIR, "saved_models_temp")

IMG_SIZE = 64
LATENT_DIM = 64
ANCHO_CM, ALTO_CM, DPI = 15, 19.5, 300
ANCHO_PX = int(ANCHO_CM / 2.54 * DPI)
ALTO_PX = int(ALTO_CM / 2.54 * DPI)

MODO_EXPERIMENTAL = True  # 🔥 ACTIVADO por defecto


# === CARGA DE MODELOS ===
def cargar_todos_los_modelos():
    modelos = {}
    for carpeta in sorted(os.listdir(MODELOS_DIR)):
        if carpeta.startswith("decoder_"):
            letra = carpeta.split("_")[-1].upper()
            ruta_modelo = os.path.join(MODELOS_DIR, carpeta)
            try:
                print(f"🧠 Cargando modelo para letra {letra} desde {ruta_modelo}")
                modelos[letra] = TFSMLayer(ruta_modelo, call_endpoint="serving_default")
            except Exception as e:
                print(f"⚠️ No se pudo cargar modelo {letra}: {e}")
    print(f"✅ {len(modelos)} modelos cargados correctamente.")
    return modelos


MODELOS_DECODER = cargar_todos_los_modelos()


# === SISTEMA DE PALETAS CROMÁTICAS ===
def extraer_paletas():
    """Analiza las carpetas de recortes y obtiene colores dominantes por serie."""
    paletas = defaultdict(list)
    if not os.path.exists(LETRAS_DIR):
        return paletas

    for carpeta in os.listdir(LETRAS_DIR):
        ruta_carpeta = os.path.join(LETRAS_DIR, carpeta)
        if not os.path.isdir(ruta_carpeta):
            continue

        colores = []
        archivos = [f for f in os.listdir(ruta_carpeta) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
        for archivo in random.sample(archivos, min(5, len(archivos))):
            try:
                img = Image.open(os.path.join(ruta_carpeta, archivo)).convert("RGB")
                thumb = img.resize((32, 32))
                arr = np.array(thumb).reshape(-1, 3)
                muestras = arr[np.random.choice(len(arr), 8, replace=False)]
                for c in muestras:
                    colores.append(tuple(c))
            except:
                continue

        if colores:
            paletas[carpeta] = colores
    print(f"🎨 Paletas cromáticas generadas para {len(paletas)} carpetas.")
    return paletas


PALETAS = extraer_paletas()


# === GENERACIÓN DE LETRAS ===
def generar_letra(modelos, latent_dim=LATENT_DIM):
    if not modelos:
        raise ValueError("No hay modelos cargados.")

    modelo_elegido = random.choice(list(modelos.values()))
    z = np.random.normal(size=(1, latent_dim)).astype(np.float32)

    try:
        output = modelo_elegido(z, training=False)
        if isinstance(output, dict):
            output = list(output.values())[0]
        img = output.numpy()[0]
    except Exception as e:
        raise RuntimeError(f"Error al generar imagen con modelo: {e}")

    img = np.clip(img * 255, 0, 255).astype(np.uint8).reshape(IMG_SIZE, IMG_SIZE)
    return Image.fromarray(img, mode="L")


def cargar_letra_recortada():
    if not os.path.exists(LETRAS_DIR):
        return None
    carpetas = [f for f in os.listdir(LETRAS_DIR) if os.path.isdir(os.path.join(LETRAS_DIR, f))]
    if not carpetas:
        return None
    carpeta = random.choice(carpetas)
    ruta = os.path.join(LETRAS_DIR, carpeta)
    archivos = [f for f in os.listdir(ruta) if f.lower().endswith(".png")]
    if not archivos:
        return None
    return Image.open(os.path.join(ruta, random.choice(archivos))).convert("L"), carpeta


# === EFECTOS BASE ===
def aplicar_efectos(img):
    if random.random() < 0.4:
        img = ImageOps.invert(img)
    img = ImageEnhance.Contrast(img).enhance(random.uniform(0.5, 2.5))
    img = ImageEnhance.Brightness(img).enhance(random.uniform(0.6, 1.6))
    return img


def generar_textura_anexa(tamaño):
    tipo = random.choice(["ruido", "cuadricula", "trama", "papel"])
    tex = Image.new("L", tamaño, 255)
    px = tex.load()

    if tipo == "ruido":
        for y in range(tamaño[1]):
            for x in range(tamaño[0]):
                px[x, y] = int(random.gauss(128, 50))
    elif tipo == "cuadricula":
        step = random.randint(6, 18)
        for y in range(0, tamaño[1], step):
            for x in range(tamaño[0]):
                px[x, y] = random.randint(100, 180)
        for x in range(0, tamaño[0], step):
            for y in range(tamaño[1]):
                px[x, y] = random.randint(100, 180)
    elif tipo == "trama":
        for y in range(tamaño[1]):
            for x in range(tamaño[0]):
                val = 180 if (x + y) % random.randint(6, 12) == 0 else 255
                px[x, y] = val
    elif tipo == "papel":
        for y in range(tamaño[1]):
            for x in range(tamaño[0]):
                px[x, y] = 240 + int(random.gauss(0, 10))
    return tex


# === EFECTOS EXPERIMENTALES ===
def efecto_halftone(img, block=4):
    img = img.convert("L").resize((img.width // block, img.height // block), Image.NEAREST)
    img = img.resize((img.width * block, img.height * block), Image.NEAREST)
    img = img.point(lambda p: 255 if p > random.randint(100, 160) else 0)
    return img


def efecto_ondas(img):
    arr = np.array(img)
    h, w = arr.shape[:2]
    nueva = np.zeros_like(arr)
    freq = random.uniform(0.02, 0.08)
    amp = random.randint(4, 15)
    for y in range(h):
        shift = int(amp * np.sin(2 * np.pi * y * freq))
        nueva[y] = np.roll(arr[y], shift, axis=0)
    return Image.fromarray(nueva)


def efecto_duotono_posterizado(img):
    img = img.convert("L")
    img = img.point(lambda p: 255 if p > 128 else 0)
    color1 = tuple(np.random.randint(50, 200, 3))
    color2 = tuple(np.random.randint(100, 255, 3))
    img = ImageOps.colorize(img, black=color1, white=color2)
    return img


def efecto_glitch(img):
    arr = np.array(img)
    h, w = arr.shape[:2]
    for i in range(random.randint(5, 15)):
        y = random.randint(0, h - 1)
        shift = random.randint(-20, 20)
        arr[y] = np.roll(arr[y], shift, axis=0)
    return Image.fromarray(arr)


def efecto_morse(img):
    img = img.convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for _ in range(random.randint(50, 150)):
        if random.random() < 0.5:
            x = random.randint(0, img.width)
            y = random.randint(0, img.height)
            w = random.randint(5, 30)
            draw.rectangle([x, y, x + w, y + 2], fill=(0, 0, 0, random.randint(80, 150)))
        else:
            x = random.randint(0, img.width)
            y = random.randint(0, img.height)
            r = random.randint(2, 5)
            draw.ellipse([x, y, x + r, y + r], fill=(0, 0, 0, random.randint(80, 150)))
    return Image.alpha_composite(img, overlay).convert("RGB")


# === COMPOSICIÓN ===
def generar_composicion():
    lienzo = Image.new("RGB", (ANCHO_PX, ALTO_PX), (255, 255, 255))
    num_elementos = random.randint(40, 90)

    for _ in range(num_elementos):
        # recorte o generativa
        if random.random() < 0.55:
            letra_info = cargar_letra_recortada()
            if letra_info is None:
                continue
            letra, carpeta = letra_info
            paleta = PALETAS.get(carpeta, [(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))])
        else:
            letra = generar_letra(MODELOS_DECODER)
            paleta = [(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))]

        letra = aplicar_efectos(letra)

        # aplicar efectos extra aleatorios
        if random.random() < 0.25:
            letra = random.choice([
                efecto_halftone,
                efecto_ondas,
                efecto_duotono_posterizado,
                efecto_glitch,
                efecto_morse
            ])(letra)

        escala = random.uniform(1.2, 5.5)
        nuevo_tamaño = (int(IMG_SIZE * escala), int(IMG_SIZE * escala))
        letra = letra.resize(nuevo_tamaño, Image.LANCZOS)
        letra = letra.rotate(random.uniform(-45, 45), expand=True)

        color = random.choice(paleta)
        color_img = ImageOps.colorize(letra.convert("L"), black=color, white=(255, 255, 255))

        if random.random() < 0.4:
            textura = generar_textura_anexa(color_img.size)
            color_img = Image.composite(color_img, ImageOps.colorize(textura, "white", "black"), textura)

        x = random.randint(-IMG_SIZE, ANCHO_PX)
        y = random.randint(-IMG_SIZE, ALTO_PX)

        # ✅ correcciones clave
        mask = letra.convert("L").point(lambda p: 255 if p > 128 else 0)
        color_img = color_img.convert("RGB")

        lienzo.paste(color_img, (x, y), mask)

    if MODO_EXPERIMENTAL and random.random() < 0.5:
        lienzo = ImageOps.invert(lienzo)
        if random.random() < 0.3:
            lienzo = ImageEnhance.Color(lienzo).enhance(random.uniform(1.5, 2.5))
            lienzo = ImageEnhance.Contrast(lienzo).enhance(random.uniform(1.3, 2.2))
    return lienzo


# === EXPORTACIÓN ===
def exportar_composiciones(n=10):
    """
    Genera y guarda N composiciones nuevas,
    continuando la numeración existente sin sobrescribir.
    """
    os.makedirs(SALIDA_DIR, exist_ok=True)
    existentes = [
        f for f in os.listdir(SALIDA_DIR)
        if f.lower().startswith("composicion_") and f.lower().endswith(".jpg")
    ]
    if existentes:
        numeros = []
        for nombre in existentes:
            try:
                num = int(nombre.split("_")[-1].split(".")[0])
                numeros.append(num)
            except ValueError:
                continue
        ultimo = max(numeros) if numeros else 0
    else:
        ultimo = 0

    for i in range(n):
        numero_actual = ultimo + i + 1
        print(f"🎨 Generando composición {numero_actual:03d}...")
        img = generar_composicion()
        ruta = os.path.join(SALIDA_DIR, f"composicion_{numero_actual:03d}.jpg")
        img.save(ruta, dpi=(DPI, DPI), quality=95)
        print(f"🖼️ Guardada en {ruta}")

    print(f"✅ Se añadieron {n} nuevas composiciones (desde {ultimo+1:03d} hasta {ultimo+n:03d}).")


# === MAIN ===
if __name__ == "__main__":
    exportar_composiciones(n=10)
    print(f"✅ Composiciones generadas en: {SALIDA_DIR}")
