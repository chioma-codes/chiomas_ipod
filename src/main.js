import './style.css'
import * as THREE from 'three' 
import {addDefaultMeshes, addStandardMeshes } from './addDefaultMeshes.js'
import { addLight } from '../addLight.js';
import Model from './model.js'
import { redirectToSpotify, getAccessToken, getCurrentlyPlaying, getProfile, getArtistGenres } from './spotify.js'

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
let spotifyGenres = null
let songScrollX = 0
let artistScrollX = 0

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

function setupPlayer(token) {
  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
      name: 'Chioma iPod',
      getOAuthToken: cb => cb(token),
      volume: 0.5,
      enableMediaSession: true
    })

    player.addListener('ready', ({ device_id }) => {
      console.log('Player ready with device ID', device_id)
      const freshToken = localStorage.getItem('token')
      transferPlayback(device_id, freshToken)
    })

    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device has gone offline', device_id)
    })

    player.connect()
  }
}

async function transferPlayback(device_id, token) {
  console.log('transferring with token:', token)
  const response = await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ device_ids: [device_id], play: true })
  })
  console.log('transfer response status:', response.status)
  const text = await response.text()
  console.log('transfer response body:', text)
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
  setupPlayer(localStorage.getItem('token'))
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

function updateInfoBox(profile, track, genres) {
  if (!track || !track.item) return

  const song = track.item.name
  const artist = track.item.artists[0].name
  const album = track.item.album.name
  const albumArt = track.item.album.images[0].url
  const genre = genres && genres.length > 0 ? genres[0] : 'Music Chi Likes'

  document.getElementById('info-song').textContent = song
  document.getElementById('info-artist').textContent = artist
  document.getElementById('info-album').textContent = album
  document.getElementById('info-genre').textContent = genre
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

  updateInfoBox(null, spotifyTrack, null)
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

  drawScreen(spotifyProfile, spotifyTrack)
  renderer.render(scene, camera)
}