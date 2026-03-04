import './style.css'
import * as THREE from 'three' 
import {addDefaultMeshes, addStandardMeshes } from './addDefaultMeshes.js'
import { addLight } from '../addLight.js';
import Model from './model.js'
import { postprocessing } from './postprocessing.js';

const scene = new THREE.Scene();
// (FOV, ASPECT, RATIO, NEAR, FAR)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/ window.innerHeight, 0.1,100)
const renderer = new THREE.WebGLRenderer({antialias: true});

const meshes = {}
const lights = {}

let composer

init()
function init() {
  // this is where all set up stuff happens 
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
camera.position.z= 5
composer = postprocessing(scene, camera, renderer)

lights.default = addLight()
scene.add(lights.default)

//where we populate mesh container "filling cabnet of objects"
meshes.default = addDefaultMeshes();
meshes.default.position.x = 2

meshes.standard = addStandardMeshes()
meshes.standard.position.x = -2

//adds meshes to our scene
// scene.add(meshes.default);
// scene.add(meshes.standard);




//  console.log(meshes)
// console.log(meshes.test)
instances()
resize()
  animate()
}
function resize (){

}

function instances(){
  const ipod = new Model({
    url: './ipod_classic.glb',
    scene: scene,
    meshes: meshes,
    scale: new THREE.Vector3(0.4,0.4, 0.4),
    position: new THREE.Vector3(0,-0.2,3),
    // replace: true, // was true now making false to remove the matcap of the galaxy 
    name: 'ipod'
callback: (model) => {
      model.traverse((child) => {
        if (child.isMesh) {
          console.log(child.name)  // this will log every mesh name

 }
      })
    }
  })
  ipod.init()

}


//ROOOOOTATIONS
function animate(){
  requestAnimationFrame(animate)
  if (meshes.ipod) {
    meshes.ipod.rotation.y += 0.01
  }
  renderer.render(scene, camera) //added because removed the composer

// renderer.render(scene, camera)
// composer.render() // removed this so the pixelpass doesnt come through

}