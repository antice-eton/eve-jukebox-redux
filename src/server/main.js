const express = require('express');
const config = require('./config.js');

const spotifyApiRoutes = require('./routes/spotify_api.js');
const eveApiRoutes     = require('./routes/eve_api.js');

const apiRoutes        = require('./routes/oauth_api.js');

const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());



//app.use('/api/spotify', spotifyApiRoutes);
//app.use('/api/eve', eveApiRoutes);
app.use(apiRoutes);


app.listen(config.listenPort, () => console.log('Server listening on http://' + config.listenHost + ':' + config.listenPort));
