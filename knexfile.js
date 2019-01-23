module.exports = {
    client: 'mysql2',
    connection : 'mysql://root:mysql@localhost/eve-jukebox-redux',
    migrations: {
        directory: ['migrations/eve','migrations/app']
    }
};
