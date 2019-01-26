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

    "images_dir": "image_store",

    "database": {
        "client": "sqlite3",

        "uri": {
            filename: './ejr.db'
        }

        //"uri": "mysql://root:mysql@localhost:3306/eve-jukebox-redux"
    },

    "spotify": {
        "client_id": "",
        "client_secret": "",
        "scopes": [
            'playlist-read-private',
            'playlist-read-collaborative',
            'app-remote-control',
            'user-read-playback-state',
            'user-modify-playback-state'
        ],
        "api_url": "https://api.spotify.com",
        "token_url": "https://accounts.spotify.com/api/token",
        "auth_url": "https://accounts.spotify.com/authorize",
        "callback_url": "http://localhost:8080/api/mp/spotify/verify"
    },

    "eve": {
        "client_id": "",
        "client_secret": "",
        "scopes": [
            'publicData',
            'esi-location.read_location.v1',
            'esi-location.read_online.v1'
        ],
        "api_url": "https://esi.evetech.net/latest",
        "token_url": "https://login.eveonline.com/v2/oauth/token",
        "auth_url": "https://login.eveonline.com/v2/oauth/authorize",
        "callback_url": "http://localhost:8080/api/eve/verify"
    }
}
