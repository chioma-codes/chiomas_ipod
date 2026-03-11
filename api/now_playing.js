export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

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

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Spotify token failed', details: tokenData })
    }

    const accessToken = tokenData.access_token

    // Get currently playing track
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    let trackData = null

    if (response.status === 204) {
      // Spotify is paused, use recently played
      const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const recentData = await recentResponse.json()
      const lastTrack = recentData?.items?.[0]?.track

      if (lastTrack) {
        trackData = {
          isPlaying: false,
          song: lastTrack.name,
          artist: lastTrack.artists[0].name,
          album: lastTrack.album.name,
          albumArt: lastTrack.album.images[0].url
        }
        lastTrackCache = trackData // update cache
      } else if (lastTrackCache) {
        trackData = lastTrackCache // fallback to cache
      } else {
        trackData = {
          isPlaying: false,
          song: 'Nothing recently played',
          artist: '',
          album: '',
          albumArt: ''
        }
      }
    } else {
      const data = await response.json()
      trackData = {
        isPlaying: true,
        song: data.item.name,
        artist: data.item.artists[0].name,
        album: data.item.album.name,
        albumArt: data.item.album.images[0].url
      }
      lastTrackCache = trackData // update cache
    }

    return res.json(trackData)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}