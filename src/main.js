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
let cachedAlbumArt = null
let cachedAlbumUrl = null
let cachedProfilePic = null
let cachedProfileUrl = null

// handle spotify auth
const params = new URLSearchParams(window.location.search)
const code = params.get('code')

if (!code) {
  const existingToken = localStorage.getItem('token')
  if (!existingToken || existingToken === 'undefined') {
    redirectToSpotify()
  } else {
    init()
  }
} else {
  const existingToken = localStorage.getItem('token')
  if (!existingToken || existingToken === 'undefined') {
    const newToken = await getAccessToken(code)
    console.log('token received:', newToken)
    localStorage.setItem('token', newToken)
  }
  window.history.replaceState({}, document.title, '/')
  init()
}

function init() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)
  camera.position.z = 5

  lights.default = addLight()
  scene.add(lights.default)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
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
      screenCanvas.width = 1024
      screenCanvas.height = 1024
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
  if (!token || token === 'undefined') {
    localStorage.clear()
    redirectToSpotify()
    return
  }

  const profile = await getProfile(token)

  if (profile.error && profile.error.status === 401) {
    localStorage.clear()
    redirectToSpotify()
    return
  }

  spotifyProfile = profile
  spotifyTrack = await getCurrentlyPlaying(token)
}

function drawScreen(profile, track) {
  if (!screenCtx) return

  screenCtx.fillStyle = 'white'
  screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height)

  screenCtx.fillStyle = 'black'
  screenCtx.font = 'bold 52px Arial'
  screenCtx.textAlign = 'center'
  screenCtx.fillText('Now Playing', screenCanvas.width / 2, 100)

  if (profile && profile.images && profile.images[0]) {
    const profileUrl = profile.images[0].url
    if (cachedProfilePic) {
      screenCtx.save()
      screenCtx.beginPath()
      screenCtx.arc(120, 120, 80, 0, Math.PI * 2)
      screenCtx.closePath()
      screenCtx.clip()
      screenCtx.drawImage(cachedProfilePic, 40, 40, 160, 160)
      screenCtx.restore()
    }
    if (profileUrl !== cachedProfileUrl) {
      cachedProfileUrl = profileUrl
      cachedProfilePic = null
      const profileImg = new Image()
      profileImg.crossOrigin = 'anonymous'
      profileImg.src = profileUrl
      profileImg.onload = () => { cachedProfilePic = profileImg }
    }
  }

  if (profile) {
    screenCtx.font = '40px Arial'
    screenCtx.textAlign = 'center'
    screenCtx.fillText(profile.display_name, screenCanvas.width / 2, 180)
  }

  if (track && track.item) {
    const song = track.item.name
    const artist = track.item.artists[0].name
    const albumUrl = track.item.album.images[0].url

    if (cachedAlbumArt) {
      screenCtx.drawImage(cachedAlbumArt, 312, 220, 400, 400)
    }

    if (albumUrl !== cachedAlbumUrl) {
      cachedAlbumUrl = albumUrl
      cachedAlbumArt = null
      const albumArt = new Image()
      albumArt.crossOrigin = 'anonymous'
      albumArt.src = albumUrl
      albumArt.onload = () => { cachedAlbumArt = albumArt }
    }

    screenCtx.fillStyle = 'black'
    screenCtx.font = 'bold 48px Arial'
    screenCtx.textAlign = 'center'
    screenCtx.fillText(song, screenCanvas.width / 2, 700)

    screenCtx.font = '40px Arial'
    screenCtx.fillText(artist, screenCanvas.width / 2, 760)
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