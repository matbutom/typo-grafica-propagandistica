import tensorflow as tf
import os
import zipfile
import subprocess
import sys
import glob

# ============================================================
# 🚨 AJUSTES DE RUTA Y VARIABLES GLOBALES
# ============================================================
# 1. RUTA DE ENTRADA (Corregida)
INPUT_DIR = "/Users/matpoto/github/matbutom/maquina-de-contrapropaganda-clean/modelos_keras" 

# Directorios de salida
SAVED_MODEL_DIR_NAME = "saved_models_temp"
TFJS_DIR_NAME = "tfjs_models_final"
ZIP_FILE_NAME = "tfjs_models_for_github.zip"

# Variables de Arquitectura (Necesarias para re-crear los modelos)
IMG_SIZE = 64
LATENT_DIM = 64 
# ============================================================


# --- DEPENDENCIAS DE ARQUITECTURA (Funciones deben ser copiadas aquí) ---
# (Asegúrate de que estas definiciones sean idénticas a las de tu notebook)
def sampling(args):
    z_mean, z_log_var = args
    batch = tf.shape(z_mean)[0]
    dim = tf.shape(z_mean)[1]
    epsilon = tf.random.normal(shape=(batch, dim))
    return z_mean + tf.exp(0.5 * z_log_var) * epsilon

def make_encoder_model():
    encoder_inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 1))
    x = tf.keras.layers.Conv2D(32, 3, activation="relu", strides=2, padding="same")(encoder_inputs)
    x = tf.keras.layers.Conv2D(64, 3, activation="relu", strides=2, padding="same")(x)
    x = tf.keras.layers.Conv2D(64, 3, activation="relu", strides=2, padding="same")(x)
    x = tf.keras.layers.Flatten()(x)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    z_mean = tf.keras.layers.Dense(LATENT_DIM, name="z_mean")(x)
    z_log_var = tf.keras.layers.Dense(LATENT_DIM, name="z_log_var")(x)
    z = tf.keras.layers.Lambda(sampling, name="z")([z_mean, z_log_var])
    encoder = tf.keras.Model(encoder_inputs, [z_mean, z_log_var, z], name="encoder")
    return encoder

def make_decoder_model():
    latent_inputs = tf.keras.Input(shape=(LATENT_DIM,))
    x = tf.keras.layers.Dense(8 * 8 * 64, activation="relu")(latent_inputs)
    x = tf.keras.layers.Reshape((8, 8, 64))(x)
    x = tf.keras.layers.Conv2DTranspose(64, 3, activation="relu", strides=2, padding="same")(x)
    x = tf.keras.layers.Conv2DTranspose(32, 3, activation="relu", strides=2, padding="same")(x)
    x = tf.keras.layers.Conv2DTranspose(1, 3, activation="sigmoid", strides=2, padding="same")(x)
    decoder_outputs = x
    decoder = tf.keras.Model(latent_inputs, decoder_outputs, name="decoder")
    return decoder

class VAE(tf.keras.Model): # Necesaria para el diccionario
    def __init__(self, encoder, decoder, **kwargs):
        super().__init__(**kwargs)
        self.encoder = encoder
        self.decoder = decoder
# ----------------------------------------------------------------------------


# ============================================================
# FUNCIÓN PRINCIPAL DE CONVERSIÓN (ESTRATEGIA CORREGIDA)
# ============================================================

def convert_all_models_local():
    """
    Estrategia Corregida: 
    1. Re-crea la arquitectura del modelo en Python.
    2. Carga SOLO los pesos (.load_weights) desde el archivo .keras (evita la deserialización).
    3. Guarda en formato SavedModel.
    4. Convierte SavedModel a TFJS.
    """
    
    SAVED_MODEL_DIR = os.path.join(os.getcwd(), SAVED_MODEL_DIR_NAME)
    TFJS_DIR = os.path.join(os.getcwd(), TFJS_DIR_NAME)
    
    os.makedirs(SAVED_MODEL_DIR, exist_ok=True)
    os.makedirs(TFJS_DIR, exist_ok=True)
    
    keras_files = glob.glob(os.path.join(INPUT_DIR, "*.keras"))
    if not keras_files:
        print(f"❌ ERROR FATAL: No se encontraron archivos .keras en: {INPUT_DIR}")
        sys.exit(1)

    print(f"✅ {len(keras_files)} modelos .keras encontrados. Iniciando CONVERSIÓN CORREGIDA...")
    print("-" * 50)
    
    # --- 1. Keras (.keras) a SavedModel (MÉTODO SEGURO) ---
    saved_model_count = 0
    print(f"\n--- Paso 1: Re-creando modelos y guardando en SavedModel ---")

    for keras_path in keras_files:
        model_name = os.path.basename(keras_path).replace(".keras", "")
        saved_model_path = os.path.join(SAVED_MODEL_DIR, model_name)
        
        try:
            print(f"\nInstanciando modelo para: {model_name}")
            
            # 🚨 ESTRATEGIA NUEVA: Instanciar el modelo correcto (encoder o decoder)
            if "encoder" in model_name:
                model = make_encoder_model()
            elif "decoder" in model_name:
                model = make_decoder_model()
            else:
                print(f"Saltando archivo desconocido: {model_name}")
                continue

            # 🚨 Cargar SOLO los pesos (esto evita el error de deserialización de 'keras.src')
            model.load_weights(keras_path)
            print(f"Pesos cargados para {model_name}.")

            # Guardar en formato SavedModel (Esto ahora es seguro)
            tf.saved_model.save(model, saved_model_path)
            print(f"✅ SavedModel guardado para: {model_name}")
            saved_model_count += 1
            
        except Exception as e:
            print(f"❌ ERROR al re-crear o guardar SavedModel para {model_name}. Detalle: {e}")

    if saved_model_count == 0:
        print("❌ ERROR: Ningún modelo pudo ser guardado en SavedModel. Conversión abortada.")
        sys.exit(1)

    print("-" * 50)

    # --- 2. SavedModel a TensorFlow.js ---
    tfjs_converted_count = 0
    print(f"\n--- Paso 2: SavedModel a TFJS en {TFJS_DIR_NAME} ---")
    
    for item_name in os.listdir(SAVED_MODEL_DIR):
        saved_model_path = os.path.join(SAVED_MODEL_DIR, item_name)
        tfjs_output_path = os.path.join(TFJS_DIR, item_name)
        
        if os.path.isdir(saved_model_path):
            command = [
                "tensorflowjs_converter",
                "--input_format=tf_saved_model", 
                "--output_format=tfjs_graph_model", 
                saved_model_path,
                tfjs_output_path
            ]
            try:
                subprocess.run(command, check=True, capture_output=True, text=True)
                print(f"✅ Convertido a TFJS: {item_name}")
                tfjs_converted_count += 1
            except subprocess.CalledProcessError as e:
                print(f"❌ ERROR al convertir {item_name}:\n{e.stderr}")

    print("-" * 50)

    # --- 3. Comprimir ---
    if tfjs_converted_count > 0:
        import zipfile
        zip_file_path = os.path.join(os.getcwd(), ZIP_FILE_NAME)
        
        with zipfile.ZipFile(zip_file_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files_to_zip in os.walk(TFJS_DIR):
                for file in files_to_zip:
                    file_path = os.path.join(root, file)
                    zipf.write(file_path, os.path.relpath(file_path, TFJS_DIR))
        print(f"🎉 {tfjs_converted_count} modelos convertidos. Archivo ZIP creado: {ZIP_FILE_NAME}")

    print("\n--- Tarea Finalizada ---")


if __name__ == "__main__":
    convert_all_models_local()