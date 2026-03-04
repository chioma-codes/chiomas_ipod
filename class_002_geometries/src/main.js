import './style.css'
import * as THREE from 'three' 
import { addDefaultMeshes } from './addDefaultMeshes.js'
import { addSphereMesh } from './addSphereMesh.js'
import { addTorusMesh } from './addTorusMesh.js'

const scene = new THREE.Scene();
// (FOV, ASPECT, RATIO, NEAR, FAR)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/ window.innerHeight, 0.1,100)
const renderer = new THREE.WebGLRenderer({antialias: true});

const meshes = {}
let tick = 0 


init()
function init() {
  // this is where all set up stuff happens 
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
camera.position.z= 5

//where we populate mesh container "filling cabnet of objects"
meshes.default = addDefaultMeshes();
meshes.default.position.x = 2

meshes.default2 = addDefaultMeshes();
meshes.default2.position.x = -2

meshes.default3 = addDefaultMeshes();
meshes.default3.position.y = 2

meshes.sphere = addSphereMesh()
meshes.torus = addTorusMesh()


//adds meshes to our scene
scene.add(meshes.default);
scene.add(meshes.default2);
scene.add(meshes.default3);
scene.add(meshes.sphere)
scene.add(meshes.torus)


 console.log(meshes)
// console.log(meshes.test)

  animate()
}

//ROOOOOTATIONS
function animate(){
  requestAnimationFrame(animate);
  renderer.render(scene, camera)
  tick += 0.01
  meshes.default.rotation.x +=0.01
   meshes.default2.rotation.y -=0.1
   meshes.default3.rotation.z +=0.1
   meshes.torus.rotation.x += 0.01
   meshes.sphere.position.x = Math.sin(tick * 5) * 4
  meshes.sphere.position.y = Math.cos(tick * 5) * 4
}