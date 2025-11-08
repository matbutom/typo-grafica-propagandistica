"""
Generador experimental v3 — Tipográfica Propagandística (PNG transparente)
Autor: Mateo Arce — Rafita Studio

Incluye modos:
  - trama, ondas, duotono, topologico, modular, organico, textura_tipografica
Efectos aleatorios:
  - glitch, ondas, halftone, inversión, contraste, saturación, blur
Exporta:
  - PNG transparente 15 × 19.5 cm a 300 dpi
"""

import os, math, random, numpy as np
from collections import defaultdict
from PIL import Image, ImageOps, ImageEnhance, ImageDraw, ImageFilter

# --- (opcional) soporte de decoders Keras 3 (SavedModel -> TFSMLayer) ---
try:
    import tensorflow as tf  # noqa
    from keras.layers import TFSMLayer
    KERAS_OK = True
except Exception:
    KERAS_OK = False

# =========================
# Rutas / tamaños / control
# =========================
BASE_DIR    = os.path.dirname(os.path.dirname(__file__))
LETRAS_DIR  = os.path.join(BASE_DIR, "recortes_letras")
SALIDA_DIR  = os.path.join(BASE_DIR, "salidas_composiciones")
SUBMOD_DIR  = os.path.join(BASE_DIR, "maquina-de-contrapropaganda")
MODELOS_DIR = os.path.join(SUBMOD_DIR, "saved_models_temp")  # decoder_A ... decoder_Z

ANCHO_CM, ALTO_CM, DPI = 15, 19.5, 300
ANCHO_PX = int(ANCHO_CM / 2.54 * DPI)
ALTO_PX  = int(ALTO_CM  / 2.54 * DPI)

IMG_SIZE   = 64        # módulo base
LATENT_DIM = 64
COMPOSICIONES_POR_CORRIDA = 10
MODO_FIJO = None       # "trama" | "ondas" | "duotono" | "topologico" | "modular" | "organico" | "textura_tipografica" | None

# Rango de tiles por modo
TRAMA_TILE   = (18, 44)
ONDAS_TILE   = (22, 56)
DUO_TILE     = (60, 120)   # duotono (sin fondo; solo módulos duotonizados)
TOPO_TILE    = (28, 52)
MODU_TILE    = (28, 64)
ORGA_TILE    = (24, 50)
# Escala libre para “textura_tipografica”
ESCALA_VARIACION = (0.4, 4.5)

# =========================
# Utilidades de color / paletas
# =========================
def clamp_color_tuple(t): return tuple(int(max(0, min(255, v))) for v in t)

def random_duotono():
    """Duotono aleatorio (dos colores complementarios suaves)."""
    c1 = np.array([random.randint(20, 200) for _ in range(3)], dtype=np.int16)
    c2 = np.clip(255 - c1 + np.random.randint(-40, 40, 3), 0, 255)
    return clamp_color_tuple(tuple(c1)), clamp_color_tuple(tuple(c2))

def extraer_paletas():
    """Paletas por carpeta de /recortes_letras (para modular color)."""
    paletas = defaultdict(list)
    if not os.path.exists(LETRAS_DIR): return paletas
    for carpeta in os.listdir(LETRAS_DIR):
        ruta = os.path.join(LETRAS_DIR, carpeta)
        if not os.path.isdir(ruta): continue
        archivos = [f for f in os.listdir(ruta) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
        if not archivos: continue
        colores = []
        for archivo in random.sample(archivos, min(5, len(archivos))):
            try:
                img = Image.open(os.path.join(ruta, archivo)).convert("RGB")
                arr = np.array(img.resize((32, 32))).reshape(-1, 3)
                k = 12 if len(arr) >= 12 else len(arr)
                muestras = arr[np.random.choice(len(arr), k, replace=False)]
                for c in muestras:
                    colores.append(clamp_color_tuple(c))
            except Exception:
                pass
        if colores:
            paletas[carpeta] = colores
    print(f"🎨 Paletas cromáticas generadas para {len(paletas)} carpetas.")
    return paletas

PALETAS = extraer_paletas()

# =========================
# Carga de decoders (opcional)
# =========================
def cargar_todos_los_modelos():
    if not (KERAS_OK and os.path.exists(MODELOS_DIR)): return {}
    modelos = {}
    for carpeta in sorted(os.listdir(MODELOS_DIR)):
        if not carpeta.startswith("decoder_"): continue
        letra = carpeta.split("_")[-1].upper()
        ruta = os.path.join(MODELOS_DIR, carpeta)
        try:
            print(f"🧠 Cargando modelo {letra} desde {ruta}")
            modelos[letra] = TFSMLayer(ruta, call_endpoint="serving_default")
        except Exception as e:
            print(f"⚠️ No se pudo cargar {letra}: {e}")
    print(f"✅ {len(modelos)} modelos cargados.")
    return modelos

MODELOS_DECODER = cargar_todos_los_modelos()

# =========================
# Módulos (recortes/generados)
# =========================
def obtener_modulo_desde_recortes():
    if not os.path.exists(LETRAS_DIR): return None
    carpetas = [c for c in os.listdir(LETRAS_DIR) if os.path.isdir(os.path.join(LETRAS_DIR, c))]
    if not carpetas: return None
    carpeta = random.choice(carpetas)
    ruta = os.path.join(LETRAS_DIR, carpeta)
    pngs = [f for f in os.listdir(ruta) if f.lower().endswith(".png")]
    if not pngs: return None
    try:
        return Image.open(os.path.join(ruta, random.choice(pngs))).convert("L")
    except Exception:
        return None

def obtener_modulo_generado():
    if not MODELOS_DECODER: return None
    modelo = random.choice(list(MODELOS_DECODER.values()))
    z = np.random.normal(size=(1, LATENT_DIM)).astype(np.float32)
    try:
        out = modelo(z, training=False)
        if isinstance(out, dict): out = list(out.values())[0]
        arr = np.clip(out.numpy()[0] * 255, 0, 255).astype(np.uint8).reshape(IMG_SIZE, IMG_SIZE)
        return Image.fromarray(arr, mode="L")
    except Exception:
        return None

def obtener_modulo():
    """Letra L (grayscale), tamaño libre (no se normaliza aquí)."""
    if random.random() < 0.55:
        img = obtener_modulo_desde_recortes()
        if img is not None: return img
    return obtener_modulo_generado() or obtener_modulo_desde_recortes()

# =========================
# Efectos locales del módulo
# =========================
def fx_halftone(img, block=4):
    img = img.resize((max(1, img.width // block), max(1, img.height // block)), Image.NEAREST)
    img = img.resize((img.width * block, img.height * block), Image.NEAREST)
    th = random.randint(100, 165)
    return img.point(lambda p: 255 if p > th else 0)

def fx_ondas(img):
    arr = np.array(img)
    h, w = arr.shape[:2]
    nueva = np.zeros_like(arr)
    freq = random.uniform(0.02, 0.08)
    amp  = random.randint(4, 15)
    for y in range(h):
        shift = int(amp * math.sin(2 * math.pi * y * freq))
        nueva[y] = np.roll(arr[y], shift, axis=0)
    return Image.fromarray(nueva)

def fx_glitch(img):
    arr = np.array(img)
    h, w = arr.shape[:2]
    for _ in range(random.randint(4, 12)):
        y = random.randint(0, h - 1)
        shift = random.randint(-18, 18)
        arr[y] = np.roll(arr[y], shift, axis=0)
    return Image.fromarray(arr)

def ajustar_L(imgL):
    """Aleatorización ligera sobre la forma en L."""
    if random.random() < 0.25: imgL = fx_ondas(imgL)
    if random.random() < 0.18: imgL = fx_glitch(imgL)
    if random.random() < 0.18: imgL = fx_halftone(imgL, block=random.randint(3, 6))
    imgL = ImageEnhance.Contrast(imgL).enhance(random.uniform(0.85, 1.6))
    imgL = ImageEnhance.Brightness(imgL).enhance(random.uniform(0.85, 1.3))
    return imgL

def colorizar_duotono(imgL, color_a, color_b):
    return ImageOps.colorize(imgL.convert("L"), black=color_a, white=color_b).convert("RGBA")

def colorizar_paleta(imgL, paleta):
    if paleta:
        color = clamp_color_tuple(random.choice(paleta))
    else:
        color = (random.randint(0,255), random.randint(0,255), random.randint(0,255))
    return ImageOps.colorize(imgL.convert("L"), black=color, white=(255, 255, 255)).convert("RGBA")

# =========================
# Helpers
# =========================
def paste_modulo_alpha(lienzo_rgba, modRGBA, modL, x, y):
    mask = modL.convert("L").point(lambda p: 255 if p > 128 else 0)
    # aseguremos alfa de módulo según máscara (respetando alfa propio)
    A = mask
    m = modRGBA.copy()
    m.putalpha(A)
    lienzo_rgba.alpha_composite(m, (x, y))

def perlin2(x, y, seed=0):
    """Ruido pseudo-Perlin 2D simple reproducible."""
    xi = int(x * 73856093)
    yi = int(y * 19349663)
    random.seed(xi ^ yi ^ int(seed))
    return random.uniform(-1.0, 1.0)

# =========================
# Modos
# =========================
def modo_trama(lienzo_rgba, paletas):
    tile = random.randint(*TRAMA_TILE)
    cols, rows = max(1, ANCHO_PX // tile), max(1, ALTO_PX // tile)
    paleta_global = random.choice(list(paletas.values())) if paletas else None
    baseL = ajustar_L(obtener_modulo() or Image.new("L", (IMG_SIZE, IMG_SIZE), 255)).resize((tile, tile), Image.LANCZOS)

    ang = random.uniform(-10, 10) * math.pi/180.0
    jx, jy = int(tile*0.25), int(tile*0.25)
    skew_x = random.uniform(-0.4, 0.4)

    for j in range(rows):
        for i in range(cols):
            modL = baseL.copy() if random.random() > 0.08 else ajustar_L(
                (obtener_modulo() or baseL).resize((tile, tile), Image.LANCZOS)
            )
            modRGBA = colorizar_paleta(modL, paleta_global)
            if random.random() < 0.18:
                ang_local = random.uniform(-20, 20)
                modLr = modL.rotate(ang_local, expand=True)
                modRGBr = modRGBA.rotate(ang_local, expand=True)
                cx, cy  = modRGBr.width//2, modRGBr.height//2
                modRGBA = modRGBr.crop((cx-tile//2, cy-tile//2, cx+tile//2, cy+tile//2))
                modL    = modLr.crop((modLr.width//2 - tile//2, modLr.height//2 - tile//2,
                                      modLr.width//2 + tile//2, modLr.height//2 + tile//2))

            base_x = int(i*tile + j*skew_x*tile)
            base_y = j*tile
            x = int(base_x*math.cos(ang) - base_y*math.sin(ang)) + random.randint(-jx, jx)
            y = int(base_x*math.sin(ang) + base_y*math.cos(ang)) + random.randint(-jy, jy)
            paste_modulo_alpha(lienzo_rgba, modRGBA, modL, x, y)

def modo_ondas(lienzo_rgba, paletas):
    tile = random.randint(*ONDAS_TILE)
    n = random.randint(140, 260)
    paleta_global = random.choice(list(paletas.values())) if paletas else None
    freq_x, freq_y = random.uniform(0.0012,0.0035), random.uniform(0.0012,0.0035)
    amp_x, amp_y   = random.randint(60,180), random.randint(60,180)
    fase           = random.uniform(0, math.pi*2)

    for k in range(n):
        modL = ajustar_L(obtener_modulo() or Image.new("L", (IMG_SIZE, IMG_SIZE), 255)).resize((tile, tile), Image.LANCZOS)
        modRGBA = colorizar_paleta(modL, paleta_global)
        t = k * random.uniform(3.0, 7.0)
        cx = ANCHO_PX//2 + int(amp_x * math.sin(t*freq_x + fase)) + random.randint(-90, 90)
        cy = ALTO_PX//2  + int(amp_y * math.sin(t*freq_y + fase*0.7)) + random.randint(-90, 90)

        if random.random() < 0.4:
            ang = random.uniform(-35, 35)
            sca = random.uniform(0.8, 1.3)
            w   = max(1, int(tile*sca))
            modLr = modL.resize((w, w), Image.LANCZOS).rotate(ang, expand=True)
            modRGBr = modRGBA.resize((w, w), Image.LANCZOS).rotate(ang, expand=True)
            cx2, cy2 = modRGBr.width//2, modRGBr.height//2
            modRGBA  = modRGBr.crop((cx2-w//2, cy2-w//2, cx2+w//2, cy2+w//2))
            modL     = modLr.crop((modLr.width//2 - w//2, modLr.height//2 - w//2,
                                   modLr.width//2 + w//2, modLr.height//2 + w//2))
            paste_modulo_alpha(lienzo_rgba, modRGBA, modL, cx - w//2, cy - w//2)
        else:
            paste_modulo_alpha(lienzo_rgba, modRGBA, modL, cx - tile//2, cy - tile//2)

def modo_duotono(lienzo_rgba, paletas):
    """Sin fondo: solo módulos duotonizados."""
    tile = random.randint(*DUO_TILE)
    cols, rows = max(1, ANCHO_PX // tile), max(1, ALTO_PX // tile)
    color_a, color_b = random_duotono()
    baseL = ajustar_L(obtener_modulo() or Image.new("L", (IMG_SIZE, IMG_SIZE), 255))
    densidad = random.uniform(0.35, 0.85)

    for j in range(rows):
        for i in range(cols):
            if random.random() > densidad: continue
            modL = baseL.resize((tile, tile), Image.LANCZOS)
            modRGBA = colorizar_duotono(modL, color_a, color_b)
            if random.random() < 0.25: modRGBA = ImageOps.mirror(modRGBA)
            if random.random() < 0.20: modRGBA = ImageOps.flip(modRGBA)
            if random.random() < 0.35:
                ang = random.uniform(-25, 25)
                modRGBA = modRGBA.rotate(ang, expand=True)
                modL    = modL.rotate(ang,   expand=True)
                # recorte central a tile x tile (si se desea cuadrícula estricta)
                cx, cy = modRGBA.width//2, modRGBA.height//2
                modRGBA = modRGBA.crop((cx-tile//2, cy-tile//2, cx+tile//2, cy+tile//2))
                modL    = modL.crop((modL.width//2 - tile//2, modL.height//2 - tile//2,
                                     modL.width//2 + tile//2, modL.height//2 + tile//2))
            paste_modulo_alpha(lienzo_rgba, modRGBA, modL, i*tile, j*tile)

def modo_topologico(lienzo_rgba, paletas):
    tile = random.randint(*TOPO_TILE)
    pasos_por_trayecta = random.randint(18, 36)
    trayectas = random.randint(16, 36)
    paleta_global = random.choice(list(paletas.values())) if paletas else None
    seed = random.randint(0, 10000)

    for _ in range(trayectas):
        x, y = random.randint(0, ANCHO_PX), random.randint(0, ALTO_PX)
        ang = random.uniform(0, math.pi*2)
        for s in range(pasos_por_trayecta):
            v = perlin2((x+s*3)/80.0, (y+s*3)/80.0, seed=seed)
            ang += v * 0.8
            step = tile * random.uniform(0.6, 1.2)
            x += int(math.cos(ang) * step)
            y += int(math.sin(ang) * step)

            modL = ajustar_L(obtener_modulo() or Image.new("L", (IMG_SIZE, IMG_SIZE), 255))
            size = int(tile * random.uniform(0.8, 1.3))
            modL = modL.resize((size, size), Image.LANCZOS)
            modRGBA = colorizar_paleta(modL, paleta_global)

            rot = math.degrees(ang) + random.uniform(-10, 10)
            modRGBr = modRGBA.rotate(rot, expand=True)
            modLr   = modL.rotate(rot,   expand=True)
            paste_modulo_alpha(lienzo_rgba, modRGBr, modLr, x - modRGBr.width//2, y - modRGBr.height//2)

def patron_cruz(tile):
    offs = []
    paso = max(3, tile // 6)
    for yy in range(-tile//2, tile//2 + 1, paso): offs.append((0, yy))
    for xx in range(-tile//2, tile//2 + 1, paso): offs.append((xx, 0))
    return offs

def patron_anillo(tile, radio_ratio=0.35):
    offs = []
    r = int(tile * radio_ratio)
    pasos = max(8, int(2*math.pi*r/ max(3, tile//8)))
    for k in range(pasos):
        a = 2*math.pi * k / pasos
        offs.append((int(r*math.cos(a)), int(r*math.sin(a))))
    return offs

def modo_modular(lienzo_rgba, paletas):
    tile = random.randint(*MODU_TILE)
    cols, rows = max(1, ANCHO_PX // (tile*2)), max(1, ALTO_PX // (tile*2))
    paleta_global = random.choice(list(paletas.values())) if paletas else None
    motif = random.choice(["cruz", "anillo", "diagonal"])

    for j in range(rows):
        for i in range(cols):
            cx, cy = i*tile*2 + tile, j*tile*2 + tile
            baseL = ajustar_L(obtener_modulo() or Image.new("L", (IMG_SIZE, IMG_SIZE), 255))

            if motif == "cruz":
                offs = patron_cruz(tile)
            elif motif == "anillo":
                offs = patron_anillo(tile, radio_ratio=random.uniform(0.3, 0.45))
            else:
                paso = max(3, tile//6)
                offs = [(k, k) for k in range(-tile//2, tile//2+1, paso)]

            for dx, dy in offs:
                size = int(tile * random.uniform(0.55, 0.95))
                modL   = baseL.resize((size, size), Image.LANCZOS)
                modRGBA= colorizar_paleta(modL, paleta_global)
                if random.random() < 0.25:
                    rot = random.uniform(-30, 30)
                    modRGBA = modRGBA.rotate(rot, expand=True)
                    modL    = modL.rotate(rot,   expand=True)
                paste_modulo_alpha(lienzo_rgba, modRGBA, modL, cx + dx - modRGBA.width//2, cy + dy - modRGBA.height//2)

def modo_organico(lienzo_rgba, paletas):
    tile = random.randint(*ORGA_TILE)
    cols, rows = max(1, ANCHO_PX // tile), max(1, ALTO_PX // tile)
    paleta_global = random.choice(list(paletas.values())) if paletas else None
    seed = random.randint(0, 10000)
    th   = random.uniform(-0.15, 0.25)
    warp = random.uniform(60.0, 120.0)

    for j in range(rows):
        for i in range(cols):
            x, y = i*tile, j*tile
            v = perlin2((x+200)/warp, (y-150)/warp, seed=seed)
            if v < th: continue
            modL = ajustar_L(obtener_modulo() or Image.new("L", (IMG_SIZE, IMG_SIZE), 255))
            size = int(tile * random.uniform(0.8, 1.2))
            modL = modL.resize((size, size), Image.LANCZOS)
            modRGBA = colorizar_paleta(modL, paleta_global)
            if random.random() < 0.25:
                ang = random.uniform(-25, 25)
                modRGBA = modRGBA.rotate(ang, expand=True)
                modL    = modL.rotate(ang,   expand=True)
            paste_modulo_alpha(lienzo_rgba, modRGBA, modL, x, y)

def modo_textura_tipografica(lienzo_rgba):
    color_a, color_b = random_duotono()
    n_letras  = random.randint(180, 420)
    base_scale= random.uniform(0.8, 2.2)
    for _ in range(n_letras):
        letraL = obtener_modulo()
        if letraL is None: continue
        letraL = ajustar_L(letraL)
        esc  = base_scale * random.uniform(*ESCALA_VARIACION)
        size = max(8, int(64 * esc))
        letraL = letraL.resize((size, size), Image.LANCZOS)
        letraRGBA = colorizar_duotono(letraL, color_a, color_b)

        if random.random() < 0.7:
            rot = random.uniform(-45, 45)
            letraRGBA = letraRGBA.rotate(rot, expand=True)

        x = random.randint(-int(size*0.8), ANCHO_PX - int(size*0.2))
        y = random.randint(-int(size*0.8), ALTO_PX  - int(size*0.2))
        alpha = random.randint(100, 255)
        letraRGBA.putalpha(alpha)
        lienzo_rgba.alpha_composite(letraRGBA, (x, y))

    # postprocesos suaves
    if random.random() < 0.30:
        lienzo_rgba = lienzo_rgba.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 2.0)))
    if random.random() < 0.30:
        lienzo_rgba = ImageOps.posterize(lienzo_rgba.convert("RGB"), bits=random.choice([2,3,4])).convert("RGBA")
    return lienzo_rgba

# =========================
# Ensamblado por composición
# =========================
def efectos_globales_rgba(img_rgba):
    # aplicar efectos sobre RGB preservando alfa
    rgb = img_rgba.convert("RGB")
    a   = img_rgba.split()[-1]
    if random.random() < 0.22: rgb = ImageOps.invert(rgb)
    if random.random() < 0.35: rgb = ImageEnhance.Color(rgb).enhance(random.uniform(1.1, 1.8))
    if random.random() < 0.35: rgb = ImageEnhance.Contrast(rgb).enhance(random.uniform(1.1, 1.7))
    if random.random() < 0.20: rgb = rgb.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.2, 0.9)))
    out = rgb.convert("RGBA")
    out.putalpha(a)
    return out

def generar_composicion():
    lienzo = Image.new("RGBA", (ANCHO_PX, ALTO_PX), (0,0,0,0))
    modo = MODO_FIJO or random.choice(
        ["trama", "ondas", "duotono", "topologico", "modular", "organico", "textura_tipografica"]
    )
    if   modo == "trama":               modo_trama(lienzo, PALETAS)
    elif modo == "ondas":               modo_ondas(lienzo, PALETAS)
    elif modo == "duotono":             modo_duotono(lienzo, PALETAS)
    elif modo == "topologico":          modo_topologico(lienzo, PALETAS)
    elif modo == "modular":             modo_modular(lienzo, PALETAS)
    elif modo == "organico":            modo_organico(lienzo, PALETAS)
    elif modo == "textura_tipografica": lienzo = modo_textura_tipografica(lienzo)

    lienzo = efectos_globales_rgba(lienzo)
    return lienzo

# =========================
# Exportación (PNG transparente)
# =========================
def exportar_composiciones(n=COMPOSICIONES_POR_CORRIDA):
    os.makedirs(SALIDA_DIR, exist_ok=True)
    existentes = [f for f in os.listdir(SALIDA_DIR) if f.lower().startswith("composicion_")]
    nums = []
    for nm in existentes:
        try: nums.append(int(nm.split("_")[-1].split(".")[0]))
        except Exception: pass
    last = max(nums) if nums else 0

    for i in range(n):
        idx = last + i + 1
        print(f"🎨 Generando composición {idx:03d}...")
        img = generar_composicion()
        ruta_png = os.path.join(SALIDA_DIR, f"composicion_{idx:03d}.png")
        img.save(ruta_png, dpi=(DPI, DPI))
        print(f"🖼️ Guardada: {ruta_png}")

    print(f"✅ Se añadieron {n} composiciones (desde {last+1:03d} hasta {last+n:03d}).")

# =========================
# Main
# =========================
if __name__ == "__main__":
    exportar_composiciones()
    print(f"✅ Composiciones PNG generadas en: {SALIDA_DIR}")
