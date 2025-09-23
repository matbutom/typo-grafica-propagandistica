import os

# Carpeta base
base_dir = "assets/tipografias"

# Subcarpetas (exactamente como están en tu proyecto)
categorias = ["serif", "sansserif", "display", "rotulos"]

# Archivo de salida
output_file = "js/listas.js"

def generar_listas():
    output = []

    for categoria in categorias:
        folder_path = os.path.join(base_dir, categoria)
        if not os.path.exists(folder_path):
            print(f"⚠️ No existe la carpeta: {folder_path}")
            continue

        # Filtrar solo imágenes
        archivos = [f for f in os.listdir(folder_path) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
        archivos.sort()

        arr_name = f"{categoria}Imgs"
        lista = ", ".join([f'"{f}"' for f in archivos])
        output.append(f"export const {arr_name} = [{lista}];\n")

    # Guardar en listas.js
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("// Archivo generado automáticamente por generar_listas.py\n\n")
        f.writelines(output)

    print(f"✅ Listas generadas en {output_file}")

if __name__ == "__main__":
    generar_listas()
