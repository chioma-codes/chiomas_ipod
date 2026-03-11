export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

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

    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (response.status === 204) {
      const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      const recentData = await recentResponse.json()
      const lastTrack = recentData.items?.[0]?.track

      if (!lastTrack) {
        return res.json({ isPlaying: false })
      }

      return res.json({
        isPlaying: false,
        song: lastTrack.name,
        artist: lastTrack.artists[0].name,
        album: lastTrack.album.name,
        albumArt: lastTrack.album.images[0].url
      })
    }

    const data = await response.json()

    return res.json({
      isPlaying: true,
      song: data.item.name,
      artist: data.item.artists[0].name,
      album: data.item.album.name,
      albumArt: data.item.album.images[0].url
    })

  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}