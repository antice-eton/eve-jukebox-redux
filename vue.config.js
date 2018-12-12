const appConfig = require('./src/server/config.js');

const express = require('express');

module.exports = {
    devServer: {
        before: function(app) {
            app.use('/portraits', express.static('./image_store/portraits'));
        },
        proxy: {
            "/api": {
                target: "http://localhost:8888"
            }
        }
    },

    lintOnSave: false
}
