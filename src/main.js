import './style.css'
import * as THREE from 'three' 
import { addLight } from '../addLight.js';
import Model from './model.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
const renderer = new THREE.WebGLRenderer({antialias: true});

const meshes = {}
const lights = {}

let screenCanvas, screenCtx, screenTexture
let spotifyTrack = null
let cachedAlbumArt = null
let cachedAlbumUrl = null
let songScrollX = 0
let artistScrollX = 0

init()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

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

function updateInfoBox(track) {
  if (!track || !track.item) return

  const song = track.item.name
  const artist = track.item.artists[0].name
  const album = track.item.album.name
  const albumArt = track.item.album.images[0].url

  document.getElementById('info-song').textContent = song
  document.getElementById('info-artist').textContent = artist
  document.getElementById('info-album').textContent = album
  document.getElementById('info-genre').textContent = 'Music Chi Likes'
  document.getElementById('info-album-art').src = albumArt
}

async function fetchSpotifyData() {
  const response = await fetch('/.netlify/functions/now-playing')
  const data = await response.json()

  spotifyTrack = {
    item: {
      name: data.song,
      artists: [{ name: data.artist }],
      album: {
        name: data.album,
        images: [{ url: data.albumArt }]
      }
    }
  }

  updateInfoBox(spotifyTrack)
}

function drawScrollingText(text, y, scrollX, maxWidth) {
  screenCtx.save()
  screenCtx.beginPath()
  screenCtx.rect(0, y - 60, screenCanvas.width, 70)
  screenCtx.clip()
  
  const textWidth = screenCtx.measureText(text).width
  if (textWidth > maxWidth) {
    screenCtx.fillText(text, screenCanvas.width / 2 - scrollX, y)
  } else {
    screenCtx.fillText(text, screenCanvas.width / 2, y)
  }
  screenCtx.restore()
}

function drawScreen(track) {
  if (!screenCtx) return

  screenCtx.fillStyle = 'white'
  screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height)

  screenCtx.fillStyle = 'black'
  screenCtx.font = 'bold 52px Arial'
  screenCtx.textAlign = 'center'
  screenCtx.fillText('Now Playing', screenCanvas.width / 2, 100)

  if (track && track.item) {
    const song = track.item.name
    const artist = track.item.artists[0].name
    const albumUrl = track.item.album.images[0].url

    if (cachedAlbumArt) {
      screenCtx.drawImage(cachedAlbumArt, 270, 220, 490, 490)
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
    screenCtx.font = 'bold 60px Arial'
    drawScrollingText(song, 840, songScrollX, 900)

    screenCtx.font = '50px Arial'
    drawScrollingText(artist, 930, artistScrollX, 900)
  }

  screenTexture.needsUpdate = true
}

function animate(){
  requestAnimationFrame(animate)
  if (meshes.ipod) {
    meshes.ipod.rotation.y += 0.005
  }

  songScrollX += 1
  if (songScrollX > 600) songScrollX = 0

  artistScrollX += 1
  if (artistScrollX > 600) artistScrollX = 0

  drawScreen(spotifyTrack)
  renderer.render(scene, camera)
}