var express = require('express');
var path = require('path');
var app = express();
var mssql = require('mssql');

var port = 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 


async function adminExists(login, password) {
    const pool = await poolPromise; 
    const request = pool.request();

    let adminResult = await request
        .input('login', mssql.VarChar, login)
        .input('password', mssql.VarChar, password)
        .query('SELECT COUNT(*) AS count FROM admins WHERE login = @login AND password = @password');

    return adminResult.recordset[0].count > 0;
}


async function userExists(login, password) {
    const pool = await poolPromise; 
    const request = pool.request();

    let userResult = await request
        .input('login', mssql.VarChar, login)
        .input('password', mssql.VarChar, password)
        .query('SELECT COUNT(*) AS count FROM users WHERE login = @login AND password = @password');

    return userResult.recordset[0].count > 0;
}

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

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); 


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
    app.get('/', async (req, res) => {
        try {
            res.sendFile(path.join(__dirname, 'Pages', 'mainPage.html'));
        } catch (err) {
            console.error('Error sending file', err);
            res.status(500).send('Error retrieving page');
        }
    });

    app.get('/authorization.html', async (req, res) => {
        try {
            res.sendFile(path.join(__dirname, 'Pages', 'authorization.html'));
        } catch (err) {
            console.error('Error sending file', err);
            res.status(500).send('Error retrieving page');
        }
    });

    app.post('/authorization.html', async (req, res) => {
        try {
            const login = req.body.login;
            const password = req.body.password;
    
            const adminExistsBool = await adminExists(login, password);
            const userExistsBool = await userExists(login, password);
    
            const pool = await poolPromise; 
            const request = pool.request();
    
            if (adminExistsBool) {
                const adminResult = await request.query('SELECT login FROM Admins');
                const userResult = await request.query('SELECT login FROM Users');
    
                res.render('adminTable', {
                    admins: adminResult.recordset,
                    users: userResult.recordset
                });
            } else if (userExistsBool) {
                res.render('done', { login: login });
            } else {
                res.send('Invalid login or password');
            }
    
        } catch (err) {
            console.error('Error during login:', err);
            res.status(500).send('Error during login');
        }
    });
    

    app.get('/registration.html', async (req, res) => {
        try {
            res.sendFile(path.join(__dirname, 'Pages', 'registration.html'));
        } catch (err) {
            console.error('Error sending file', err);
            res.status(500).send('Error retrieving page');
        }
    });

    app.post('/registration.html',async(req,res) =>{
        try {
            const login = req.body.login;
            const password = req.body.password;
            const name = req.body.name;
    
            const pool = await poolPromise; 
            const request = pool.request();

            const adminExistsBool = await adminExists(login, password);
            const userExistsBool = await userExists(login, password);
    
            if (adminExistsBool || userExistsBool) {
                res.render('registration',{login:login})
            }
            else{
                let regResult = await request
                .input('login', mssql.VarChar, login)
                .input('password', mssql.VarChar, password)
                .input('name',mssql.VarChar,name)
                .query("INSERT INTO Users (name, login, password) VALUES (@name , @login, @password)");
                res.render('regComplete',{name:name})
            }
        } catch (err) {
            console.error('Error during login:', err);
            res.status(500).send('Error during login');
        }
    })
    
    

    app.listen(port, () => {
        console.log('App listening on port ' + port);
    });