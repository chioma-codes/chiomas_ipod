import * as THREE from 'three'
export function addTorusMesh(){
    const torusKnotGeometry = new THREE.TorusKnotGeometry(1.3, 0.1,100,100)
    const torusKnotMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff})
    const torusMesh = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial)
return torusMesh
}