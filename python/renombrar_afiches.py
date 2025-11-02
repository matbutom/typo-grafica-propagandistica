import os
import unicodedata
import csv
import json
import re

# === CONFIGURACIÓN ===
ROOT_DIR = os.path.join(os.path.dirname(__file__), "../poster_dataset")
ROOT_DIR = os.path.abspath(ROOT_DIR)

VALID_EXT = (".png", ".jpg", ".jpeg", ".tiff")
DRY_RUN = False  # True = simula, False = renombra realmente
EXPORT_CSV = True
EXPORT_JSON = True

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../datasets")
os.makedirs(OUTPUT_DIR, exist_ok=True)
CSV_PATH = os.path.join(OUTPUT_DIR, "poster_dataset_list.csv")
JSON_PATH = os.path.join(OUTPUT_DIR, "poster_dataset_list.json")

# === FUNCIONES ===

def normalizar_nombre(nombre):
    """Elimina tildes y ñ, reemplaza espacios y guiones por guiones bajos."""
    nombre = nombre.lower()
    nombre = unicodedata.normalize("NFD", nombre).encode("ascii", "ignore").decode("utf-8")
    nombre = nombre.replace("ñ", "n")
    nombre = nombre.replace(" ", "_").replace("-", "_")
    return nombre

def extraer_metadatos(nombre_carpeta):
    """Intenta inferir país y década a partir del nombre de la carpeta."""
    pais = None
    decada = None

    # Países más probables (puedes añadir más)
    paises = {
        "chile": "Chile",
        "espana": "España",
        "peru": "Perú",
        "argentina": "Argentina",
        "mexico": "México",
        "latin_america": "Latinoamérica"
    }

    for clave, valor in paises.items():
        if clave in nombre_carpeta:
            pais = valor
            break

    # Detectar década
    match = re.search(r"(19|20)\d{2}", nombre_carpeta)
    if match:
        year = int(match.group())
        decada = f"{(year // 10) * 10}s"

    return pais, decada

def renombrar_afiches(root_dir, dry_run=True):
    """Recorre subcarpetas, renombra imágenes y genera metadatos enriquecidos."""
    registros = []

    for carpeta in os.listdir(root_dir):
        carpeta_path = os.path.join(root_dir, carpeta)
        if not os.path.isdir(carpeta_path):
            continue

        carpeta_normalizada = normalizar_nombre(carpeta)
        pais, decada = extraer_metadatos(carpeta_normalizada)

        print(f"\n📂 Carpeta: {carpeta_normalizada}")
        if pais or decada:
            print(f"   ↳ Metadatos detectados: {pais or '---'}, {decada or '---'}")

        contador = 1
        archivos = sorted(os.listdir(carpeta_path))

        for archivo in archivos:
            if archivo.lower().endswith(VALID_EXT):
                ext = os.path.splitext(archivo)[1].lower()
                nuevo_nombre = f"afiche_{carpeta_normalizada}_{contador:03d}{ext}"
                origen = os.path.join(carpeta_path, archivo)
                destino = os.path.join(carpeta_path, nuevo_nombre)

                if dry_run:
                    print(f"  🟡 Simulación: {archivo} → {nuevo_nombre}")
                else:
                    os.rename(origen, destino)
                    print(f"  ✅ Renombrado: {archivo} → {nuevo_nombre}")

                registros.append({
                    "nombre_original": archivo,
                    "nombre_final": nuevo_nombre,
                    "carpeta": carpeta_normalizada,
                    "pais": pais,
                    "decada": decada,
                    "ruta_relativa": os.path.relpath(destino, start=os.path.dirname(__file__)),
                    "ruta_absoluta": os.path.abspath(destino)
                })
                contador += 1

    if registros:
        exportar_datasets(registros)

    print("\n✨ Proceso completado. " +
          ("(Simulación: sin cambios realizados)" if dry_run else "Cambios aplicados y datasets exportados."))

def exportar_datasets(registros):
    """Exporta los metadatos a CSV y JSON."""
    if EXPORT_CSV:
        with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=registros[0].keys())
            writer.writeheader()
            writer.writerows(registros)
        print(f"\n🧾 CSV generado: {CSV_PATH}")

    if EXPORT_JSON:
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(registros, f, indent=2, ensure_ascii=False)
        print(f"📘 JSON generado: {JSON_PATH}")

# === EJECUCIÓN ===
if __name__ == "__main__":
    renombrar_afiches(ROOT_DIR, dry_run=DRY_RUN)
