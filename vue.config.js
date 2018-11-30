const apiRoutes = require('./src/server/routes.js');

module.exports = {
    devServer: {
        proxy: {
            "/api": {
                target: "http://localhost:8888"
            }
        }
    },

    lintOnSave: false
}
