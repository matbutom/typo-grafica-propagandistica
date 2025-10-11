#!/usr/bin/env python3
"""
poster_scraper_ddgs_filtros.py
Descarga masiva de imágenes desde DuckDuckGo (ddgs) con filtros de tamaño y país.
Usado para recopilar afiches y propaganda política chilena.
"""

from ddgs import DDGS
import requests
from pathlib import Path
from tqdm import tqdm
import hashlib
import time

# === CONFIGURACIÓN ===
OUT_DIR = "poster_dataset"
IMAGES_PER_QUERY = 120        # hasta 150 imágenes por consulta
SLEEP_BETWEEN_QUERIES = 3.0   # segundos entre consultas
SLEEP_BETWEEN_IMAGES = 0.4
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; PosterScraper/1.0)"}


# === FUNCIONES ===
def md5_bytes(b):
    return hashlib.md5(b).hexdigest()

def make_dir(path):
    Path(path).mkdir(parents=True, exist_ok=True)

def download_image(url, dest_folder):
    try:
        r = requests.get(url, headers=HEADERS, timeout=12)
        if r.status_code != 200 or not r.content:
            return None
        h = md5_bytes(r.content)
        dest = Path(dest_folder) / f"{h}.jpg"
        if dest.exists():
            return None
        with open(dest, "wb") as f:
            f.write(r.content)
        return str(dest)
    except Exception:
        return None

def fetch_image_urls(query, max_results=50):
    """Obtiene URLs filtradas de imágenes desde DuckDuckGo."""
    urls = []
    with DDGS() as ddgs:
        # filtro por tamaño grande (filtro g=1)
        for r in ddgs.images(
            query,
            max_results=max_results,
            safesearch="off",
            region="cl-es",        # preferencia por Chile
            size="large"           # evita miniaturas
        ):
            if "image" in r:
                urls.append(r["image"])
            time.sleep(0.3)
    return urls

def scrape_query(query, out_dir=OUT_DIR, limit=IMAGES_PER_QUERY):
    folder = Path(out_dir) / "_".join(query.lower().split())
    make_dir(folder)
    urls = fetch_image_urls(query, max_results=limit)
    print(f"\n{query}: {len(urls)} imágenes encontradas")

    for url in tqdm(urls, desc=f"Descargando {query}", unit="img"):
        download_image(url, folder)
        time.sleep(SLEEP_BETWEEN_IMAGES)

    count = len(list(folder.glob('*.jpg')))
    print(f"→ {count} guardadas en {folder}\n")

def main():
    # NUEVAS BÚSQUEDAS CON FOCO POLÍTICO CHILENO
    queries = [
        "afiches políticos Chile",
        "propaganda electoral Chile",
        "propaganda política Chile",
        "carteles de campaña presidencial Chile",
        "afiches partidos políticos chilenos",
        "propaganda dictadura Pinochet",
        "carteles plebiscito Chile 1988",
        "afiches elecciones Chile 2021",
        "propaganda comunista Chile",
        "afiches socialistas Chile",
    ]

    for q in queries:
        scrape_query(q, out_dir=OUT_DIR, limit=IMAGES_PER_QUERY)
        time.sleep(SLEEP_BETWEEN_QUERIES)


if __name__ == "__main__":
    main()
