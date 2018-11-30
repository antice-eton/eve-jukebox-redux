const spotify_client_id = '';
const spotify_scopes = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'app-remote-control',
    'user-read-playback-state',
    'user-modify-playback-state'
];

module.exports = {
    "listenHost": "0.0.0.0",
    "listenPort": "8888",

    "spotify": {
        "clientId": "",
        "clientSecret": "",
        "scopes": [
            'playlist-read-private',
            'playlist-read-collaborative',
            'app-remote-control',
            'user-read-playback-state',
            'user-modify-playback-state'
        ],
        "apiUrl": "https://api.spotify.com",
        "tokenUrl": "https://accounts.spotify.com/api/token",
        "authUrl": "https://accounts.spotify.com/authorize"
    },

    "eve": {
        "clientId": "",
        "clientSecret": "",
        "scopes": [
            'publicData',
            'esi-location.read_location.v1',
            'esi-location.read_online.v1'
        ],
        "apiUrl": "https://esi.evetech.net",
        "tokenUrl": "https://login.eveonline.com/v2/oauth/token",
        "authUrl": "https://login.eveonline.com/v2/oauth/authorize"
    },

    "spotifyClientId": "",
    "spotifyClientSecret": "",
    "spotifyScopes": [
        'playlist-read-private',
        'playlist-read-collaborative',
        'app-remote-control',
        'user-read-playback-state',
        'user-modify-playback-state'
    ],
    "spotifyApiUrl": 'https://api.spotify.com',
    "spotifyTokenUrl": 'https://accounts.spotify.com/api/token',

    "eveClientId": "",
    "eveClientSecret": "",
    "eveScopes": [
        'publicData',
        'esi-location.read_location.v1',
        'esi-location.read_online.v1'
    ],
    "eveTokenUrl": "https://login.eveonline.com/v2/oauth/token",
    "eveApiUrl": "https://esi.evetech.net"
}
