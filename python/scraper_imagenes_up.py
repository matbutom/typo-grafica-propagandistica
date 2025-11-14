#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scraper_google_abecedario_popular.py
Descarga imágenes desde Google Imágenes usando SerpAPI para la query dada.
Por defecto: "unidad popular afiches", máximo 100 resultados.

Requisitos:
  pip install google-search-results requests pillow tqdm

Variables de entorno recomendadas:
  export SERPAPI_KEY="TU_API_KEY"

Notas:
- SerpAPI usa el parámetro 'ijn' para paginar Google Imágenes.
- Este script deduplica por hash MD5 e impone tamaño mínimo (ancho x alto).
"""

import os, io, sys, time, hashlib, argparse
from pathlib import Path
from typing import List, Dict
from PIL import Image
import requests
from tqdm import tqdm
from serpapi import GoogleSearch

DEFAULT_QUERY = "unidad popular afiches"
DEFAULT_OUT = "poster_dataset_popular/google_afiches_up"
DEFAULT_MAX = 100
DEFAULT_MIN_W = 400
DEFAULT_MIN_H = 400
UA = {"User-Agent": "Mozilla/5.0 (compatible; AbecedarioPopular/1.0)"}

def md5_bytes(b: bytes) -> str:
    return hashlib.md5(b).hexdigest()

def ensure_dir(p: Path) -> None:
    p.mkdir(parents=True, exist_ok=True)

def fetch_google_images_serpapi(api_key: str, query: str, max_images: int) -> List[str]:
    """Obtiene URLs de imágenes desde Google Imágenes vía SerpAPI, con paginado por 'ijn'."""
    urls = []
    ijn = 0
    per_page_cap = 100  # SerpAPI suele devolver hasta ~100 imágenes por 'ijn'
    while len(urls) < max_images:
        params = {
            "engine": "google",
            "q": query,
            "tbm": "isch",
            "ijn": str(ijn),
            "api_key": api_key
        }
        search = GoogleSearch(params)
        data = search.get_dict()
        results = data.get("images_results", []) or []
        # extrae "original" si existe; fallback a "thumbnail" si no
        extracted = []
        for item in results:
            if "original" in item and item["original"]:
                extracted.append(item["original"])
            elif "thumbnail" in item and item["thumbnail"]:
                extracted.append(item["thumbnail"])
        if not extracted:
            break  # no hay más páginas
        urls.extend(extracted)
        if len(results) < per_page_cap:  # página corta, probablemente fin
            break
        ijn += 1
        time.sleep(0.8)  # cortesía para no saturar
    return urls[:max_images]

def image_min_dims_ok(img_bytes: bytes, min_w: int, min_h: int) -> bool:
    """Valida que la imagen cumpla tamaño mínimo."""
    try:
        with Image.open(io.BytesIO(img_bytes)) as im:
            w, h = im.size
            return w >= min_w and h >= min_h
    except Exception:
        return False

def download_images(urls: List[str], out_dir: Path, min_w: int, min_h: int) -> int:
    """Descarga URLs, deduplica por MD5 y aplica filtro de tamaño mínimo."""
    ensure_dir(out_dir)
    saved = 0
    seen_hashes = set(h.stem for h in out_dir.glob("*.jpg"))  # hashes ya guardados

    for url in tqdm(urls, desc="Descargando", unit="img"):
        try:
            r = requests.get(url, headers=UA, timeout=12)
            if not r.ok or not r.content:
                continue
            if not image_min_dims_ok(r.content, min_w, min_h):
                continue
            h = md5_bytes(r.content)
            if h in seen_hashes:
                continue
            path = out_dir / f"{h}.jpg"
            with open(path, "wb") as f:
                f.write(r.content)
            seen_hashes.add(h)
            saved += 1
        except Exception:
            continue
        time.sleep(0.15)  # ritmo razonable
    return saved

def main():
    parser = argparse.ArgumentParser(description="Scraper Google Imágenes (SerpAPI) — Abecedario Popular")
    parser.add_argument("--api-key", type=str, default=os.getenv("SERPAPI_KEY", ""),
                        help="API key de SerpAPI (o variable SERPAPI_KEY).")
    parser.add_argument("--query", type=str, default=DEFAULT_QUERY, help="Consulta de búsqueda.")
    parser.add_argument("--out-dir", type=str, default=DEFAULT_OUT, help="Carpeta de salida.")
    parser.add_argument("--max", type=int, default=DEFAULT_MAX, help="Cantidad máxima de imágenes.")
    parser.add_argument("--min-width", type=int, default=DEFAULT_MIN_W, help="Ancho mínimo en px.")
    parser.add_argument("--min-height", type=int, default=DEFAULT_MIN_H, help="Alto mínimo en px.")
    args = parser.parse_args()

    if not args.api_key:
        print("Error: necesitas una API key de SerpAPI (argumento --api-key o variable SERPAPI_KEY).", file=sys.stderr)
        sys.exit(1)

    out_dir = Path(args.out_dir)
    ensure_dir(out_dir)

    print(f"Buscando en Google Imágenes: '{args.query}' (máx {args.max})")
    urls = fetch_google_images_serpapi(api_key=args.api_key, query=args.query, max_images=args.max)
    print(f"URLs obtenidas: {len(urls)}")

    saved = download_images(urls, out_dir, args.min_width, args.min_height)
    print(f"Descargas guardadas: {saved} en {out_dir}")

if __name__ == "__main__":
    main()
