#!/usr/bin/env python3
"""
poster_scraper_ddgs.py
Descarga masiva de imágenes desde DuckDuckGo (ddgs).
Usado para recopilar afiches políticos, culturales y tipográficos (1930–2025).
"""

from ddgs import DDGS
import requests
from pathlib import Path
from tqdm import tqdm
import hashlib
import time

# === CONFIGURACIÓN ===
OUT_DIR = "poster_dataset"
IMAGES_PER_QUERY = 100        # máximo recomendado por consulta
SLEEP_BETWEEN_QUERIES = 3.0   # segundos de espera entre consultas
SLEEP_BETWEEN_IMAGES = 0.4    # segundos de espera entre descargas
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; PosterScraper/1.0)"}


# === FUNCIONES ===
def md5_bytes(b):
    """Hash MD5 de bytes (para evitar duplicados)."""
    return hashlib.md5(b).hexdigest()


def make_dir(path):
    """Crea directorios si no existen."""
    Path(path).mkdir(parents=True, exist_ok=True)


def download_image(url, dest_folder):
    """Descarga una imagen y la guarda en disco."""
    try:
        r = requests.get(url, headers=HEADERS, timeout=12)
        if r.status_code != 200 or not r.content:
            return None
        h = md5_bytes(r.content)
        dest = Path(dest_folder) / f"{h}.jpg"
        if dest.exists():
            return None  # ya existe
        with open(dest, "wb") as f:
            f.write(r.content)
        return str(dest)
    except Exception:
        return None


def fetch_image_urls(query, max_results=50):
    """Obtiene URLs de imágenes desde DuckDuckGo (usando ddgs actual)."""
    urls = []
    with DDGS() as ddgs:
        for r in ddgs.images(query, max_results=max_results, safesearch="off"):
            if "image" in r:
                urls.append(r["image"])
            time.sleep(0.3)  # evita rate-limit interno
    return urls


def scrape_query(query, out_dir=OUT_DIR, limit=IMAGES_PER_QUERY):
    """Descarga todas las imágenes para una consulta."""
    folder = Path(out_dir) / "_".join(query.lower().split())
    make_dir(folder)
    urls = fetch_image_urls(query, max_results=limit)
    print(f"\n{query}: {len(urls)} imágenes encontradas")

    for url in tqdm(urls, desc=f"Descargando {query}", unit="img"):
        download_image(url, folder)
        time.sleep(SLEEP_BETWEEN_IMAGES)

    count = len(list(folder.glob("*.jpg")))
    print(f"→ {count} guardadas en {folder}\n")


def main():
    queries = [
        "afiches Unidad Popular Chile",
        "afiches Brigada Ramona Parra",
        "afiches Evelyn Matthei",
        "afiches dictadura Chile 1980",
        "carteles chicha Perú",
        "political posters Latin America",
        "Ben Shahn poster typography",
        "Nueva Canción Chilena posters",
        "propaganda política latinoamericana",
        "carteles tipográficos revolucionarios"
    ]

    for q in queries:
        scrape_query(q, out_dir=OUT_DIR, limit=IMAGES_PER_QUERY)
        time.sleep(SLEEP_BETWEEN_QUERIES)


if __name__ == "__main__":
    main()
