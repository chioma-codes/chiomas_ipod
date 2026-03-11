// api/now_playing.js
import fetch from 'node-fetch'

// Simple in-memory cache
let lastTrackCache = null
let lastTrackTime = null

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

    // get access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // get currently playing
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (response.status === 204) {
      // If nothing is playing, check lastTrackCache
      if (!lastTrackCache) {
        // fallback to most recent track
        const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const recentData = await recentResponse.json()
        if (recentData.items && recentData.items.length > 0) {
          const lastTrack = recentData.items[0].track
          lastTrackCache = lastTrack
          lastTrackTime = Date.now()
        } else {
          return res.json({
            isPlaying: false,
            song: 'Nothing recently played',
            artist: '',
            album: '',
            albumArt: '',
            playedAgo: 0
          })
        }
      }

      // calculate minutes since last played
      const minutesAgo = lastTrackTime ? Math.floor((Date.now() - lastTrackTime) / 60000) : 0

      return res.json({
        isPlaying: false,
        song: lastTrackCache.name,
        artist: lastTrackCache.artists[0].name,
        album: lastTrackCache.album.name,
        albumArt: lastTrackCache.album.images[0].url,
        playedAgo: minutesAgo
      })
    }

    const data = await response.json()
    // update cache
    lastTrackCache = data.item
    lastTrackTime = Date.now()

    return res.json({
      isPlaying: true,
      song: data.item.name,
      artist: data.item.artists[0].name,
      album: data.item.album.name,
      albumArt: data.item.album.images[0].url,
      playedAgo: 0
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}