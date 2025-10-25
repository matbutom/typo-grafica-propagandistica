import os
import shutil

# === CONFIGURACIÓN ===
ROOT_DIR = os.path.join(os.path.dirname(__file__), "../recortes")
ROOT_DIR = os.path.abspath(ROOT_DIR)
ELIMINADOS_DIR = os.path.join(ROOT_DIR, "eliminados")

def restaurar_archivos():
    """Mueve todos los archivos desde /recortes/eliminados de vuelta a sus carpetas originales."""
    if not os.path.exists(ELIMINADOS_DIR):
        print("❌ No existe la carpeta /eliminados.")
        return

    total_restaurados = 0
    for carpeta in os.listdir(ELIMINADOS_DIR):
        carpeta_path = os.path.join(ELIMINADOS_DIR, carpeta)
        if not os.path.isdir(carpeta_path):
            continue

        destino_original = os.path.join(ROOT_DIR, carpeta)
        os.makedirs(destino_original, exist_ok=True)

        for archivo in os.listdir(carpeta_path):
            origen = os.path.join(carpeta_path, archivo)
            destino = os.path.join(destino_original, archivo)

            try:
                shutil.move(origen, destino)
                total_restaurados += 1
            except Exception as e:
                print(f"⚠️ Error moviendo {archivo}: {e}")

    print(f"\n✅ Restauración completada. Total de archivos devueltos: {total_restaurados}")
    print("Puedes ajustar el umbral en depurar_recortes.py y volver a ejecutar.")

if __name__ == "__main__":
    restaurar_archivos()
