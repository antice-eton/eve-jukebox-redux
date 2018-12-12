const appConfig = require('./config.js');
const bootstrap = require('./bootstrap.js');

bootstrap()
.then(() => {
    const app = require('./utils.js').get_app();
    app.listen(appConfig.listenPort, () => console.log('Server listening on http://' + appConfig.listenHost + ':' + appConfig.listenPort));
})
