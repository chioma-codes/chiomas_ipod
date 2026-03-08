import './style.css'
import * as THREE from 'three' 
import {addDefaultMeshes, addStandardMeshes } from './addDefaultMeshes.js'
import { addLight } from '../addLight.js';
import Model from './model.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
const renderer = new THREE.WebGLRenderer({antialias: true});

const meshes = {}
const lights = {}

let screenCanvas, screenCtx, screenTexture

init()
function init() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  camera.position.z = 5

  lights.default = addLight()
  scene.add(lights.default)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  scene.add(ambientLight)

  instances()
  animate()
}

function instances(){
  const ipod = new Model({
    url: './ipod_classic.glb',
    scene: scene,
    meshes: meshes,
    scale: new THREE.Vector3(0.4, 0.4, 0.4),
    position: new THREE.Vector3(0, -0.2, 3),
    name: 'ipod',
    callback: (model) => {
      // create canvas once, connect to texture, apply to mesh
      screenCanvas = document.createElement('canvas')
      screenCanvas.width = 512
      screenCanvas.height = 512
      screenCtx = screenCanvas.getContext('2d')
      screenTexture = new THREE.CanvasTexture(screenCanvas)
      screenTexture.center.set(0.5, 0.5)
      screenTexture.rotation = Math.PI / 2

      model.traverse((child) => {
        if (child.isMesh && child.name === 'Object_7') {
          child.material = new THREE.MeshStandardMaterial({ map: screenTexture })
        }
      })
    }
  })
  ipod.init()
}

function drawScreen(text) {
  if (!screenCtx) return
  screenCtx.fillStyle = 'white'
  screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height)
  screenCtx.fillStyle = 'black'
  screenCtx.font = '40px Arial'
  screenCtx.fillText(text, 100, 100)
  screenTexture.needsUpdate = true
}

function animate(){
  requestAnimationFrame(animate)
  if (meshes.ipod) {
    meshes.ipod.rotation.y += 0.01
  }
  drawScreen('Hey Chioma iPod!')
  renderer.render(scene, camera)
}