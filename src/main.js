import './style.css'
import * as THREE from 'three' 
import {addDefaultMeshes, addStandardMeshes } from './addDefaultMeshes.js'
import { addLight } from '../addLight.js';
import Model from './model.js'
import { redirectToSpotify, getAccessToken, getCurrentlyPlaying, getProfile } from './spotify.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
const renderer = new THREE.WebGLRenderer({antialias: true});

const meshes = {}
const lights = {}

let screenCanvas, screenCtx, screenTexture
let spotifyProfile = null
let spotifyTrack = null

// handle spotify auth
const params = new URLSearchParams(window.location.search)
const code = params.get('code')

if (!code) {
  redirectToSpotify()
} else {
  const token = await getAccessToken(code)
  console.log('token received:', token)  // check if token is coming through
  localStorage.setItem('token', token)
  init()
}

function init() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  camera.position.z = 5

  lights.default = addLight()
  scene.add(lights.default)

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  scene.add(ambientLight)

  instances()
  fetchSpotifyData()
  setInterval(fetchSpotifyData, 5000)
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

async function fetchSpotifyData() {
  const token = localStorage.getItem('token')
  console.log('fetching with token:', token)  // check token every fetch
  if (!token) return

  spotifyProfile = await getProfile(token)
  spotifyTrack = await getCurrentlyPlaying(token)
}

function drawScreen(profile, track) {
  if (!screenCtx) return

  screenCtx.fillStyle = 'white'
  screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height)

  screenCtx.fillStyle = 'black'
  screenCtx.font = 'bold 28px Arial'
  screenCtx.textAlign = 'center'
  screenCtx.fillText('Now Playing', screenCanvas.width / 2, 50)

  if (profile) {
    screenCtx.font = '22px Arial'
    screenCtx.fillText(profile.display_name, screenCanvas.width / 2, 90)
  }

  if (track && track.item) {
    const song = track.item.name
    const artist = track.item.artists[0].name

    screenCtx.font = 'bold 26px Arial'
    screenCtx.fillText(song, screenCanvas.width / 2, 380)

    screenCtx.font = '22px Arial'
    screenCtx.fillText(artist, screenCanvas.width / 2, 420)

    const albumArt = new Image()
    albumArt.src = track.item.album.images[0].url
    albumArt.onload = () => {
      screenCtx.drawImage(albumArt, 156, 130, 200, 200)
      screenTexture.needsUpdate = true
    }
  }

  screenTexture.needsUpdate = true
}

function animate(){
  requestAnimationFrame(animate)
  if (meshes.ipod) {
    meshes.ipod.rotation.y += 0.01
  }
  drawScreen(spotifyProfile, spotifyTrack)
  renderer.render(scene, camera)
}