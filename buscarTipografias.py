import os
import csv
import requests
from bs4 import BeautifulSoup
import tldextract
import urllib.parse

# =========================
# CONFIG
# =========================

PERIODOS = {
    "1930-1950": ["Futura", "Gill Sans", "Kabel", "Broadway", "Stencil",
                  "Brush Script", "Times New Roman", "Didot", "Bodoni"],
    "1950-1960": ["Palatino", "Trade Gothic", "Mistral", "Banco",
                  "Fairfield", "Egyptienne", "Optima", "Helvetica"],
    "1960-1973": ["Helvetica", "Univers", "Compacta", "Kabel Heavy",
                  "Avant Garde", "Bookman", "Cooper Black", "Arnold Böcklin"],
    "1973-1980": ["Helvetica", "Univers", "Times New Roman", "Zapf Chancery",
                  "Akzidenz Grotesk", "Franklin Gothic", "Stencil", "Courier"],
    "1980-1990": ["Helvetica", "Univers", "Arial", "Impact",
                  "ITC Franklin Gothic", "Souvenir", "Zapf Chancery", "OCR-A"],
    "1990-2000": ["Trajan", "Comic Sans", "Verdana", "Georgia",
                  "Century Gothic", "Template Gothic", "FF Blur",
                  "Emigre Matrix", "Times New Roman", "Arial"],
    "2000-2010": ["DIN", "Frutiger", "Gotham", "Museo",
                  "Akzidenz Grotesk", "Australis", "Miliciana",
                  "Pincoya Black", "Chasquilla"],
    "2010-2025": ["Montserrat", "Lato", "Open Sans", "Oswald",
                  "Roboto", "Bebas Neue", "Pacifico", "Libre Franklin",
                  "Sansita", "Zona Pro", "Propaganda Latinotype"]
}

# Google Fonts API (requiere tu API key)
GOOGLE_FONTS_LIST = "https://www.googleapis.com/webfonts/v1/webfonts?key=YOUR_API_KEY"

# Otros proveedores
FONT_LIBRARY_SEARCH = "https://fontlibrary.org/api/v1/font?query={}"
GITHUB_SEARCH = "https://api.github.com/search/repositories?q={}+font+OFL&per_page=2"

HEADERS = {"User-Agent": "Mozilla/5.0"}

# =========================
# CLASIFICACIÓN DE LICENCIAS
# =========================

LICENSE_BY_DOMAIN = {
    "fonts.google.com": "Open Source",
    "fontlibrary.org": "Open Source",
    "velvetyne.fr": "Open Source",
    "theleagueofmoveabletype.com": "Open Source",
    "fontshare.com": "Open Source",
    "github.com": "Open Source (según repo)",
    "fonts.adobe.com": "Comercial",
    "adobe.com": "Comercial",
    "myfonts.com": "Comercial",
    "linotype.com": "Comercial",
    "monotype.com": "Comercial",
    "fontspring.com": "Comercial",
    "typekit.com": "Comercial",
    "dafont.com": "Freeware/Mixto",
    "behance.net": "Desconocida"
}

PRIORIDAD = {
    "Open Source": 1,
    "Open Source (según repo)": 1,
    "Freeware/Mixto": 2,
    "Comercial": 3,
    "Posible Comercial/Open": 3,
    "Desconocida": 4
}

# =========================
# ALIASES / VARIANTES
# =========================

ALIASES = {
    "Futura": ["Futura PT", "Futura Std", "Futura Now", "URW Futura", "Futura Pro"],
    "Helvetica": ["Neue Helvetica", "Helvetica Now", "Helvetica LT Std", "Nimbus Sans"],
    "Gill Sans": ["Gill Sans MT", "Gill Sans Nova"],
    "DIN": ["DIN 1451", "FF DIN", "DIN Next", "DIN Pro"],
    "Akzidenz Grotesk": ["Berthold Akzidenz Grotesk", "Akzidenz-Grotesk"],
    "Times New Roman": ["Times", "Times Roman", "Times MT"],
    "Bookman": ["ITC Bookman", "Bookman Old Style"],
    "Avant Garde": ["ITC Avant Garde", "Avant Garde Gothic"],
    "Trade Gothic": ["Trade Gothic Next", "Trade Gothic LT Std"],
    "Bodoni": ["Bodoni MT", "Bodoni Std", "Bodoni 72"],
    "Didot": ["Didot LT Std"],
    "Frutiger": ["Frutiger Next", "Frutiger LT Std"],
    "Zapf Chancery": ["Zapf Chancery Std", "ITC Zapf Chancery"],
    "Courier": ["Courier New", "Courier Std"],
    "Stencil": ["Stardos Stencil", "Army Stencil"],
    "Compacta": ["Impact"],
    "Kabel": ["Kabel ITC", "URW Kabel"],
}

# =========================
# FUNCIONES
# =========================

def get_license(url):
    try:
        ext = tldextract.extract(url)
        domain = f"{ext.domain}.{ext.suffix}"
        return LICENSE_BY_DOMAIN.get(domain, "Desconocida")
    except:
        return "Desconocida"

def limpiar_duckduckgo(url):
    """
    Si la URL viene de DuckDuckGo (redirect con uddg=...), extrae y decodifica la URL real.
    También limpia comas o espacios sobrantes.
    """
    if url and "duckduckgo.com" in url and "uddg=" in url:
        parsed = urllib.parse.urlparse(url)
        qs = urllib.parse.parse_qs(parsed.query)
        if "uddg" in qs:
            return urllib.parse.unquote(qs["uddg"][0]).strip().strip(",")
    return url.strip().strip(",")

def cargar_google_fonts():
    try:
        r = requests.get(GOOGLE_FONTS_LIST, timeout=6)
        if r.status_code == 200:
            data = r.json()
            return [item["family"].lower() for item in data["items"]]
    except:
        pass
    return []

def buscar_fontlibrary(nombre):
    try:
        r = requests.get(FONT_LIBRARY_SEARCH.format(nombre), timeout=6)
        if r.status_code == 200:
            data = r.json()
            if data.get("results"):
                return "https://fontlibrary.org/en/search?query=" + nombre
    except:
        pass
    return None

def buscar_github(nombre):
    try:
        r = requests.get(GITHUB_SEARCH.format(nombre), timeout=6, headers=HEADERS)
        if r.status_code == 200:
            data = r.json()
            if data.get("items"):
                return data["items"][0]["html_url"]
    except:
        pass
    return None

def buscar_duckduckgo(nombre):
    url = "https://duckduckgo.com/html/"
    try:
        r = requests.get(url, params={"q": f"{nombre} font"}, headers=HEADERS, timeout=6)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            result = soup.select_one(".result__a")
            if result and result.get("href"):
                return result["href"]
    except:
        pass
    return None

def elegir_mejor_resultado(lista):
    if not lista:
        return None
    lista_ordenada = sorted(lista, key=lambda x: PRIORIDAD.get(x["licencia"], 5))
    return lista_ordenada[0]

def procesar_periodo(periodo, tipografias, google_fonts):
    print(f"\n📂 Procesando {periodo}...")
    carpeta = os.path.join("tipografias-archivos", periodo)
    os.makedirs(carpeta, exist_ok=True)

    resultados = []
    for font in tipografias:
        print(f"   🔎 {font}...")
        candidatos = []
        variantes = [font] + ALIASES.get(font, [])

        for variante in variantes:
            # Google Fonts
            if variante.lower() in google_fonts:
                url = f"https://fonts.google.com/specimen/{variante.replace(' ', '+')}"
                candidatos.append({"font": font, "proveedor": "Google Fonts", "url": url, "licencia": "Open Source"})
                continue

            # Font Library
            fl = buscar_fontlibrary(variante)
            if fl:
                candidatos.append({"font": font, "proveedor": "FontLibrary", "url": fl, "licencia": "Open Source"})
                continue

            # GitHub
            gh = buscar_github(variante)
            if gh:
                candidatos.append({"font": font, "proveedor": "GitHub", "url": gh, "licencia": "Open Source (según repo)"})
                continue

            # DuckDuckGo
            ddg = buscar_duckduckgo(variante)
            if ddg:
                candidatos.append({"font": font, "proveedor": "DuckDuckGo", "url": ddg, "licencia": get_license(ddg)})

        mejor = elegir_mejor_resultado(candidatos)
        if mejor:
            url_limpia = limpiar_duckduckgo(mejor["url"])
            resultados.append([mejor["font"], mejor["proveedor"], url_limpia, mejor["licencia"]])
        else:
            resultados.append([font, "—", "—", "No encontrado"])

    # Guardar CSV con comillas en cada celda
    output_file = os.path.join(carpeta, f"tipografias_{periodo}.csv")
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow(["Tipografía", "Proveedor", "URL", "Licencia"])
        writer.writerows(resultados)

    print(f"   ✅ Guardado en {output_file}")

# =========================
# MAIN
# =========================

def main():
    google_fonts = cargar_google_fonts()
    for periodo, lista in PERIODOS.items():
        procesar_periodo(periodo, lista, google_fonts)

if __name__ == "__main__":
    main()
