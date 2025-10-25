# Tipográfica Propagandística

**Tipográfica Propagandística** es un proyecto de investigación, archivo y exhibición digital desarrollado por Mateo Arce.  

Explora la historia de las letras y tipografías en la propaganda política y cultural de Chile y América Latina desde 1930 hasta la actualidad.  

El proyecto combina curaduría visual, análisis tipográfico y herramientas digitales para construir una lectura crítica del diseño como lenguaje político.

---

## Estructura del proyecto

```
/
├── assets/
│   ├── images/              # Imágenes de afiches y material de archivo
│   ├── catalogo/            # Imágenes del catálogo web
│   └── …
├── index.html               # Página principal con galería dinámica
├── catalogo.html            # Catálogo de impresiones / piezas editoriales
├── style.css                # Estilos globales y animaciones
├── script.js                # Lógica del menú hamburguesa y UI
├── poster_scraper_ddgs.py   # Descarga masiva de afiches desde la web
├── update_gallery.py        # Actualiza la galería del index.html
└── README.md
```

---

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/matbutom/typo-grafica-propagandistica.git
cd typo-grafica-propagandistica
```

### 2. Activar entorno virtual
```bash
python3 -m venv env
source env/bin/activate
```

### 3. Instalar dependencias
```bash
pip3 install ddgs requests beautifulsoup4 tqdm watchdog
```

## Módulos interactivos del proyecto

El proyecto **Typográfica Propagandística** se compone de tres experiencias digitales interconectadas.  
Cada módulo aborda la memoria tipográfica y política desde una perspectiva distinta: archivo, generación y resonancia.

| Módulo | Descripción conceptual | Objetivo de interacción | Tecnologías principales |
|---------|------------------------|--------------------------|--------------------------|
| **Archivo Viscoso** | Archivo vivo de letras históricas que flotan en un entorno líquido digital. Cada carácter reacciona al movimiento del usuario, se agrupa por afinidades históricas (década o país) y revela el afiche donde fue usado. | Explorar visualmente la trazabilidad tipográfica a lo largo del tiempo y observar cómo las formas tipográficas se degradan o transforman con la interacción. | **Three.js**, **OrbitControls**, **TWEEN.js**, **dat.GUI**, **GLSL shaders** para efectos de distorsión y degradación. |
| **Máquina de Contrapropaganda** | Sistema generativo que reconstruye tipografías desaparecidas a partir de descripciones textuales ingresadas por el público (por ejemplo, “letra de unidad” o “letra del miedo”). Las letras se generan temporalmente y luego se disuelven, como una metáfora de censura y memoria. | Invitar a los usuarios a crear nuevas formas tipográficas políticas mediante IA generativa, resaltando el rol del lenguaje visual como herramienta ideológica. | **ML5.js / TensorFlow.js**, **p5.js** para la interfaz generativa, **TWEEN.js** para animaciones y **Three.js** o **Canvas 2D** para renderizado. |
| **Ecos del Archivo** | Línea temporal interactiva que conecta afiches y tipografías desde 1930 hasta la actualidad. Cada punto representa un evento o estilo tipográfico; al interactuar, se despliegan capas visuales y sonoras de contexto histórico. | Permitir al usuario recorrer la evolución política y estética de la tipografía a lo largo de distintos períodos históricos. | **D3.js** o **Three.js (modo 2D)**, **TWEEN.js**, **AudioContext API** para capas sonoras y **JSON datasets** para los metadatos históricos. |

---

### Notas técnicas

- Cada módulo vive en su propio archivo dentro de `/modulos/`, con dependencias específicas:  
  - `/modulos/modulo1.html` → **Archivo Viscoso**  
  - `/modulos/modulo2.html` → **Máquina de Contrapropaganda**  
  - `/modulos/modulo3.html` → **Ecos del Archivo**  
- Los datasets generados en `/datasets/` (como `poster_dataset_list.json`) sirven como base de contenido compartido entre los tres módulos.  
- Los scripts de soporte en `/python/` se utilizan exclusivamente para tareas de scraping, renombrado y generación de metadatos previos al desarrollo interactivo.  

---

## Tecnologías principales del proyecto

| Categoría | Bibliotecas / Herramientas | Uso principal |
|------------|-----------------------------|----------------|
| **Visualización e Interacción** | Three.js, OrbitControls, TWEEN.js, dat.GUI | Renderizado 3D, animaciones suaves, control de cámara e interfaz de depuración. |
| **Generación tipográfica y ML** | ML5.js / TensorFlow.js, p5.js | Creación de formas tipográficas a partir de texto e integración de modelos ligeros de IA. |
| **Procesamiento visual** | GLSL Shaders, WebGL postprocessing | Efectos de distorsión, degradación y disolución de letras. |
| **Análisis temporal y de datos** | D3.js, JSON datasets | Visualización cronológica e interacción con metadatos históricos. |
| **Preprocesamiento de recursos** | Python (requests, BeautifulSoup, tqdm, os, json, csv) | Scraping, renombrado masivo, extracción de metadatos y construcción de dataset

---

### Notas adicionales

- Los scripts Python no forman parte del frontend; su función es preparar y estructurar los datos visuales (afiches, letras y metadatos) que luego se consumen desde los módulos del sitio web.
- Los datasets exportados (`poster_dataset_list.json`, `poster_dataset_list.csv`) se almacenan en la carpeta `/datasets/` y son cargados dinámicamente por los módulos interactivos.
- En la versión Alpha del proyecto, se prioriza el uso de **Three.js**, **TWEEN.js** y **dat.GUI**, mientras que las bibliotecas de OCR y Machine Learning se reservan para etapas Beta o finales.
- Las letras recortadas (en formato `.png` con fondo transparente) se cargarán como texturas sobre planos 2D dentro de Three.js, complementando las geometrías tipográficas vectoriales.
- El código del frontend está estructurado modularmente dentro de la carpeta `/modulos/`, permitiendo aislar cada experiencia interactiva (Archivo Viscoso, Descomposición de la Propaganda, etc.) con sus dependencias y scripts propios.

---


### Diagramas de Flujo

### Créditos

Proyecto desarrollado por Mateo Arce.

Parte del proyecto de título de Diseño Gráfico UDP.

Inspirado por:

* Vicente Larrea y la gráfica de la Unidad Popular

* Brigada Ramona Parra y la tipografía Mazúrquica

* Tipografía y propaganda como memoria cultural
