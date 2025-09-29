import os
import csv

BASE_DIR = "tipografias-archivos"

def generar_links():
    google_familias = set()
    adobe_familias = set()
    fontshare_links = set()
    velvetyne_links = set()
    fontlibrary_links = set()
    github_blocks = []
    otros = []

    for root, _, files in os.walk(BASE_DIR):
        for file in files:
            if file.endswith(".csv"):
                path = os.path.join(root, file)
                with open(path, newline="", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        url = row["URL"]

                        # Google Fonts
                        if "fonts.google.com/specimen/" in url:
                            familia = url.split("/specimen/")[-1]
                            google_familias.add(familia)

                        # Adobe Fonts
                        elif "fonts.adobe.com/fonts/" in url:
                            familia = url.split("/fonts/")[-1]
                            adobe_familias.add(familia)

                        # Fontshare
                        elif "fontshare.com" in url:
                            fontshare_links.add(url)

                        # Velvetyne
                        elif "velvetyne.fr" in url:
                            velvetyne_links.add(url)

                        # Fontlibrary
                        elif "fontlibrary.org" in url:
                            fontlibrary_links.add(url)

                        # GitHub
                        elif "github.com" in url:
                            # Creamos un bloque básico de @font-face
                            github_blocks.append(f"""
@font-face {{
    font-family: '{row['Tipografía']}';
    src: url('{url}/raw/master/{row['Tipografía'].replace(" ", "")}-Regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
}}
""")

                        # Otros proveedores
                        else:
                            if url and url != "—":
                                otros.append(f"{row['Tipografía']} → {url}")

    # Construir bloques
    google_link = ""
    if google_familias:
        familias_str = "&family=".join(sorted(google_familias))
        google_link = f'<link href="https://fonts.googleapis.com/css2?family={familias_str}&display=swap" rel="stylesheet">'

    adobe_listado = "\n".join(sorted(adobe_familias)) if adobe_familias else ""

    # Guardar archivo
    output_file = os.path.join(BASE_DIR, "links_tipografias.txt")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("=== Google Fonts ===\n")
        f.write(google_link + "\n\n")

        f.write("=== Adobe Fonts ===\n")
        f.write(adobe_listado + "\n\n")

        f.write("=== Fontshare ===\n")
        f.write("\n".join(fontshare_links) + "\n\n")

        f.write("=== Velvetyne ===\n")
        f.write("\n".join(velvetyne_links) + "\n\n")

        f.write("=== Fontlibrary ===\n")
        f.write("\n".join(fontlibrary_links) + "\n\n")

        f.write("=== GitHub (bloques @font-face) ===\n")
        f.write("\n".join(github_blocks) + "\n\n")

        f.write("=== Otros (manual) ===\n")
        f.write("\n".join(otros) + "\n\n")

    print(f"\n✅ Archivo generado en: {output_file}")

if __name__ == "__main__":
    generar_links()
