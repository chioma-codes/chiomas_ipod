import fetch from 'node-fetch'

// Module-level cache
let lastTrackCache = {
  isPlaying: false,
  song: "Nothing recently played",
  artist: "",
  album: "",
  albumArt: "/fallback.png",
  playedAgo: null
}
let lastFetchTime = 0
const CACHE_DURATION = 7000 // 7 seconds

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Serve cached response if fresh
  if (Date.now() - lastFetchTime < CACHE_DURATION) {
    return res.json(lastTrackCache)
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

    // Get Spotify access token
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

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text()
      return res.status(tokenResponse.status).json({ error: text })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get currently playing track
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    let trackData = null

    if (response.ok && response.status === 200) {
      const data = await response.json()
      if (data?.item) {
        trackData = {
          isPlaying: true,
          song: data.item.name,
          artist: data.item.artists[0].name,
          album: data.item.album.name,
          albumArt: data.item.album.images[0].url,
          playedAgo: 0
        }
      }
    }

    // If nothing is playing or Spotify paused, get last played
    if (!trackData) {
      const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (recentResponse.ok) {
        const recentData = await recentResponse.json()
        const lastTrack = recentData?.items?.[0]?.track
        const playedAt = recentData?.items?.[0]?.played_at

        if (lastTrack) {
          const playedAgo = Math.floor((Date.now() - new Date(playedAt).getTime()) / 60000)
          trackData = {
            isPlaying: false,
            song: lastTrack.name,
            artist: lastTrack.artists[0].name,
            album: lastTrack.album.name,
            albumArt: lastTrack.album.images[0].url,
            playedAgo
          }
        }
      }
    }

    // Fallback to cache if nothing
    if (!trackData) {
      trackData = lastTrackCache
    }

    // Update cache
    lastTrackCache = trackData
    lastFetchTime = Date.now()

    return res.json(trackData)

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}