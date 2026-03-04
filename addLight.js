import * as THREE from 'three'

export function addLight() {
    const light = new THREE.DirectionalLight(0xffffff, 3.5) //bumped up light to 3.5 to make sure there is more light in the scene
    light.position.set(1, 1, 1)
    return light
}