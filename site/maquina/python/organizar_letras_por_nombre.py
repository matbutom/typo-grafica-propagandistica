"""
organizar_letras_individuales_v2.py
Autor: Mateo Arce — Rafita Studio
Clasifica letras individuales (A–Z) según su origen político
buscando coincidencias por nombre de archivo dentro de /recortes_letras/.
"""

import os
import shutil
import pandas as pd
import glob
from tqdm import tqdm

# === rutas ===
CSV_PATH = "../recortes_letras/_log_segmentacion.csv"
SRC_ROOT = "../recortes_letras"
DEST_ROOT = "../data/letras"
CSV_SALIDA = "../data/metadata_letras_clasificadas.csv"

MODO_COPIA = True   # True = copia, False = mueve
DRY_RUN = True      # cambia a False para ejecutar realmente

# === mapeo ideológico ===
MAPA_IDEOLOGIA = {
    "afiches_brigada_ramona_parra": "izquierda",
    "afiches_unidad_popular_chile": "izquierda",
    "afiches_socialistas_chile": "izquierda",
    "nueva_canción_chilena_posters": "izquierda",
    "afiches_guerra_civil_española": "izquierda",
    "propaganda_dictadura_pinochet": "izquierda",
    "carteles_dictadura_chile_1980": "izquierda",
    "propaganda_politica_chile": "izquierda",
    "political_posters_latin_america": "izquierda",
    "carteles_tipográficos_revolucionarios": "izquierda",
    "carteles_chicha_perú": "izquierda",
    "ben_shahn_poster_typography": "izquierda",
    "carteles_plebiscito_chile_1988": "derecha",
    "afiches_evelyn_matthei": "derecha",
    "carteles_de_campaña_presidencial_chile": "derecha",
    "propaganda_electoral_chile": "derecha",
    "afiches_politicos_chile": "neutral",
    "afiches_partidos_politicos_chilenos": "neutral",
}

def detectar_ideologia(nombre):
    nombre = nombre.lower()
    for clave, ideologia in MAPA_IDEOLOGIA.items():
        if clave in nombre:
            return ideologia
    return "neutral"

# === ejecución ===
df = pd.read_csv(CSV_PATH)
print("Columnas detectadas:", list(df.columns))
print(df.head(3))

moved, missing = [], []

for _, fila in tqdm(df.iterrows(), total=len(df), desc="Buscando letras"):
    origen_rel = str(fila["origen_rel"]).strip().replace("\\", "/")
    letra = str(fila["letra"]).strip().upper() if pd.notna(fila["letra"]) else "X"

    # nombre base sin extensión
    base = os.path.splitext(os.path.basename(origen_rel))[0]
    ideologia = detectar_ideologia(origen_rel)

    # busca coincidencia dentro de /recortes_letras/*/
    patron = os.path.join(SRC_ROOT, "*", f"{base}*.*")
    coincidencias = glob.glob(patron)

    if coincidencias:
        src_path = coincidencias[0]
        dest_dir = os.path.join(DEST_ROOT, letra, ideologia)
        os.makedirs(dest_dir, exist_ok=True)

        if not DRY_RUN:
            try:
                if MODO_COPIA:
                    shutil.copy(src_path, dest_dir)
                else:
                    shutil.move(src_path, dest_dir)
            except Exception as e:
                missing.append({"ruta": src_path, "motivo": f"error: {e}"})
        moved.append({
            "letra": letra,
            "ideologia": ideologia,
            "src_path": src_path,
            "destino": dest_dir
        })
    else:
        missing.append({
            "ruta_busqueda": patron,
            "motivo": "no encontrado"
        })

# === resumen ===
izq = sum(1 for x in moved if x["ideologia"] == "izquierda")
der = sum(1 for x in moved if x["ideologia"] == "derecha")
neu = sum(1 for x in moved if x["ideologia"] == "neutral")

print("✅ Completado.")
print(f"Encontradas: {len(moved)} | No encontradas: {len(missing)} | Dry-run: {DRY_RUN}")
print(f"→ Izquierda: {izq} | Derecha: {der} | Neutral: {neu}")

pd.DataFrame(moved).to_csv(CSV_SALIDA, index=False)
pd.DataFrame(missing).to_csv("../data/missing_letras.csv", index=False)
