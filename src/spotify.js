
function generateCodeVerifier(length) {
  const array = new Uint8Array(length / 2)
  window.crypto.getRandomValues(array)
  return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('')
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const clientId = '0d5fc0bd21a24f78a0674c6c816804b3'//basically like a username for my app so spotify is like hey this is the app making
const redirectUri = 'http://127.0.0.1:5173/callback'

export async function redirectToSpotify() {
  const verifier = generateCodeVerifier(128)
  const challenge = await generateCodeChallenge(verifier)
  localStorage.setItem('verifier', verifier)

  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('response_type', 'code')
  params.append('redirect_uri', redirectUri)
  params.append('scope', 'user-read-private user-read-currently-playing user-read-playback-state')
  params.append('code_challenge_method', 'S256')
  params.append('code_challenge', challenge)

  window.location = `https://accounts.spotify.com/authorize?${params.toString()}`
}

export async function getAccessToken(code) {
  const verifier = localStorage.getItem('verifier')
    console.log('verifier:', verifier)
  console.log('code:', code)
  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('grant_type', 'authorization_code')
  params.append('code', code)
  params.append('redirect_uri', redirectUri)
  params.append('code_verifier', verifier)

  const result = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  const { access_token } = await result.json()
  return access_token
}

export async function getCurrentlyPlaying(token) {
  const result = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  })

  if (result.status === 204) return null
  return await result.json()
}

export async function getProfile(token) {
  const result = await fetch('https://api.spotify.com/v1/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  })
  return await result.json()
}