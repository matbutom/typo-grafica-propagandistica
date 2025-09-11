import os

# Carpeta base donde están las tipografías
base_path = "assets/tipografias"

# Subcarpetas con sus etiquetas
carpetas = {
    "serif": "serif",
    "sansserif": "sansserif",
    "display": "display",
    "rotulos": "rotulos"
}

# Generar arrays
for key, folder in carpetas.items():
    path = os.path.join(base_path, folder)
    if not os.path.exists(path):
        print(f"⚠️ Carpeta no encontrada: {path}")
        continue
    
    archivos = [f for f in os.listdir(path) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    archivos.sort()
    
    # Imprimir en formato JS
    print(f"const {key}Imgs = {archivos};")
