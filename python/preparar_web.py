import json
import os
import shutil
import random

# --- CONFIGURACIÓN ---
LIMITE_POR_LETRA = 40  # Cantidad de imágenes por letra que se quedarán en la web

# Rutas relativas desde la raíz del proyecto
CARPETA_ORIGINAL_RECORTES = "recortes_letras"
JSON_ORIGINAL = "recortes_letras_index.json"

CARPETA_DESTINO = "assets/recortes_web"
JSON_DESTINO = "assets/recortes_web_index.json"

def main():
    print(f"📍 Directorio actual de ejecución: {os.getcwd()}")
    print(f"📖 Buscando archivo índice: {JSON_ORIGINAL}...")

    # 1. Cargar el JSON original
    try:
        with open(JSON_ORIGINAL, 'r', encoding='utf-8') as f:
            data_cruda = json.load(f)
    except FileNotFoundError:
        print(f"\n❌ ERROR CRÍTICO: No encuentro '{JSON_ORIGINAL}'.")
        print("Asegúrate de ejecutar este script desde la raíz del proyecto, así:")
        print("   python3 python/preparar_web.py")
        return

    # 2. Agrupar las rutas por Letra
    print("🔄 Analizando lista de archivos...")
    grupos = {}
    
    # data_cruda es una lista: ["recortes_letras/A/img1.png", "recortes_letras/B/img2.png"...]
    for ruta in data_cruda:
        # Normalizamos la ruta para evitar problemas de barras / o \
        ruta_clean = ruta.replace('\\', '/')
        partes = ruta_clean.split('/')
        
        # Estructura esperada: ["recortes_letras", "A", "archivo.png"]
        # La letra debería estar en la posición 1
        if len(partes) > 2 and partes[0] == CARPETA_ORIGINAL_RECORTES:
            letra = partes[1] # Aquí extraemos "A", "B", etc.
            
            if letra not in grupos:
                grupos[letra] = []
            grupos[letra].append(ruta)
        elif len(partes) > 1: 
            # Caso fallback por si la ruta es distinta pero tiene subcarpeta
            letra = partes[0] if partes[0] != CARPETA_ORIGINAL_RECORTES else partes[1]
            if letra not in grupos:
                grupos[letra] = []
            grupos[letra].append(ruta)

    # 3. Preparar carpeta de destino
    if os.path.exists(CARPETA_DESTINO):
        shutil.rmtree(CARPETA_DESTINO)
    os.makedirs(CARPETA_DESTINO)

    nuevo_indice_lista = [] 
    total_copiados = 0

    # 4. Copiar archivos seleccionados
    print(f"⚡ Encontré {len(grupos)} categorías (letras). Iniciando copia...")

    for letra, lista_rutas in grupos.items():
        # Crear carpeta para la letra (ej: assets/recortes_web/A)
        ruta_letra_destino = os.path.join(CARPETA_DESTINO, str(letra))
        os.makedirs(ruta_letra_destino, exist_ok=True)

        # Barajar y cortar (random sampling)
        seleccion = lista_rutas[:] 
        random.shuffle(seleccion)
        seleccion = seleccion[:LIMITE_POR_LETRA] 

        for ruta_vieja in seleccion:
            # Verificar si el archivo existe físicamente antes de copiar
            if os.path.exists(ruta_vieja):
                nombre_archivo = os.path.basename(ruta_vieja)
                
                # Destino físico en disco
                destino_final = os.path.join(ruta_letra_destino, nombre_archivo)
                shutil.copy2(ruta_vieja, destino_final)
                
                # Guardar la ruta web para el JSON (usando siempre /)
                # Formato: assets/recortes_web/A/archivo.png
                nueva_ruta_web = f"{CARPETA_DESTINO}/{letra}/{nombre_archivo}"
                nuevo_indice_lista.append(nueva_ruta_web)
                total_copiados += 1
            else:
                # Si no encuentra el archivo, lo ignora silenciosamente o avisa
                # print(f"⚠️ Archivo no encontrado: {ruta_vieja}")
                pass

    # 5. Guardar el nuevo JSON
    with open(JSON_DESTINO, 'w', encoding='utf-8') as f:
        json.dump(nuevo_indice_lista, f, indent=2)

    print("-" * 30)
    print(f"✅ ÉXITO. Se copiaron {total_copiados} imágenes.")
    print(f"📂 Carpeta creada: {CARPETA_DESTINO}")
    print(f"📄 Nuevo JSON generado: {JSON_DESTINO}")
    print("👉 Recuerda subir estos nuevos archivos a GitHub.")

if __name__ == "__main__":
    main()