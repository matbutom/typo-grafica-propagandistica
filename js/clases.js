// Clase base
class Tipografia {
  constructor(nombre, carpeta, archivos = []) {
    this.nombre = nombre;
    this.carpeta = carpeta;
    this.archivos = archivos;
  }

  listarImagenes() {
    return this.archivos.map(img => `${this.carpeta}/${img}`);
  }

  renderGaleria() {
    return this.listarImagenes().map(src => {
      return `<img src="${src}" alt="${this.nombre}" class="afiche" />`;
    }).join("\n");
  }
}

// Subclases
class TipografiaSerif extends Tipografia {
  constructor(archivos) {
    super("Serif", "assets/tipografias/serif", archivos);
  }
}

class TipografiaSansSerif extends Tipografia {
  constructor(archivos) {
    super("Sans Serif", "assets/tipografias/sansserif", archivos);
  }
}

class TipografiaDisplay extends Tipografia {
  constructor(archivos) {
    super("Display", "assets/tipografias/display", archivos);
  }
}

class TipografiaRotulos extends Tipografia {
  constructor(archivos) {
    super("Rótulos", "assets/tipografias/rotulos", archivos);
  }
}


// Gestor
class GestorDeImagenes {
  constructor() {
    this.categorias = [];
  }

  agregarCategoria(categoria) {
    this.categorias.push(categoria);
  }

  renderTodas() {
    return this.categorias.map(cat => {
      return `
        <section>
          <h2>${cat.nombre}</h2>
          <div class="galeria">${cat.renderGaleria()}</div>
        </section>
      `;
    }).join("\n");
  }
}

// Exportar si quieres usar módulos
export { TipografiaSerif, TipografiaSansSerif, TipografiaDisplay, TipografiaRotulos, GestorDeImagenes };
