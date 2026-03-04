import * as THREE from 'three'

export function addSphereMesh(){
    const sphereGeometry = new THREE.SphereGeometry(1,32,32)
    const sphereMaterial = new THREE.MeshBasicMaterial({color: 0xffff00})
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
return sphere
}