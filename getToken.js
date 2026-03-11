import express from 'express'
import fetch from 'node-fetch'

const app = express()

const clientId = '0d5fc0bd21a24f78a0674c6c816804b3'
const clientSecret = '9b316b7cbb604a27a21b2b58a542ec78'

app.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
   redirect_uri: 'http://127.0.0.1:4000/callback',
    scope: 'user-read-currently-playing user-read-recently-played'
  })
  res.redirect(`https://accounts.spotify.com/authorize?${params}`)
})

app.get('/callback', async (req, res) => {
  const code = req.query.code
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://127.0.0.1:4000/callback',
    })
  })
  const data = await response.json()
  console.log('REFRESH TOKEN:', data.refresh_token)
  res.send('Got it! Check your terminal for the refresh token.')
})

app.listen(4000, () => console.log('Go to http://localhost:4000/login'))