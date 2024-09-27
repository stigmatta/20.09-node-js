const express = require('express');
const path = require('path');
const mssql = require('mssql');
const adminApp = require('./admin'); // Nested admin application
const userApp = require('./user'); // Nested user application

const app = express();
const port = 8080;

const config = {
    user: 'test',
    password: '12345',
    server: 'ANDREYPC',
    database: 'authorization',
    port: 1433,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Pages'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Connect to MSSQL
const poolPromise = new mssql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Pages', 'mainPage.html'));
});

// Use nested applications
app.use('/admin', adminApp(poolPromise));
app.use('/user', userApp(poolPromise));

// Start the server
app.listen(port, () => {
    console.log('App listening on port ' + port);
});
