const appConfig = require('./config.js');
const bootstrap = require('./bootstrap.js');
const http      = require('http');
const get_logger = require('./utils.js').get_logger;

bootstrap()
.then(() => {
    get_logger().info('Bootstrap complete');
    const app = require('./utils.js').get_app();
    app.listen(appConfig.listenPort, () => get_logger().info('Server listening on http://' + appConfig.listenHost + ':' + appConfig.listenPort));
})
.catch((err) => {
    get_logger().error('---- BOOTSTRAP ERROR !!');
    console.error(err);
});
