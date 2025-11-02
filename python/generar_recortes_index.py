import os, json

ROOT = "recortes_letras"
salida = []

for carpeta, _, archivos in os.walk(ROOT):
    for f in archivos:
        if f.lower().endswith((".png",".jpg",".jpeg",".webp")):
            ruta_rel = os.path.join(carpeta, f)
            salida.append(ruta_rel)

with open("recortes_letras_index.json", "w") as out:
    json.dump(salida, out, indent=2)

print(f"✅ generado recortes_letras_index.json con {len(salida)} archivos")
