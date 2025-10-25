import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { letrasDataset } from './letrasDataset.js';

let scene, camera, renderer, raycaster, mouse, letras = [], font;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 40;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  new OrbitControls(camera, renderer.domElement);

  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(10, 10, 10);
  scene.add(light);

  const loader = new FontLoader();
  loader.load('../assets/fonts/Pincoya_Regular.json', (loadedFont) => {
    font = loadedFont;
    crearLetras();
  });

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onClick);
}

function crearLetras() {
  letrasDataset.forEach((data) => {
    const geometry = new TextGeometry(data.char, { font, size: 1.5, height: 0.1 });
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(Math.random() * 40 - 20, Math.random() * 25 - 12, Math.random() * 15 - 7);
    mesh.userData = data;
    scene.add(mesh);
    letras.push(mesh);
  });
}

function animate() {
  requestAnimationFrame(animate);
  letras.forEach((l, i) => {
    l.rotation.y += 0.002;
    l.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;
  });
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(letras);

  if (intersects.length > 0) {
    const letra = intersects[0].object;
    mostrarAfiche(letra.userData);
  }
}

function mostrarAfiche(data) {
  const overlay = document.getElementById('overlay');
  const img = document.getElementById('afiche');
  overlay.style.display = 'flex';
  img.src = data.afiche;

  // eliminar letras previas
  letras.forEach((l) => l.material.color.set(0xffffff));

  // mostrar letras similares (resaltar)
  data.similares.forEach((id) => {
    const letraSimilar = letras.find((l) => l.userData.id === id);
    if (letraSimilar) letraSimilar.material.color.set(0xff4081);
  });
}
