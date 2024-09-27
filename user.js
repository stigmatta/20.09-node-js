const express = require('express');
const mssql = require('mssql');

module.exports = (poolPromise) => {
    const userApp = express();

    userApp.get('/registration', (req, res) => {
        res.sendFile(path.join(__dirname, 'Pages', 'registration.html'));
    });

    userApp.post('/registration', async (req, res) => {
        try {
            const { login, password, name } = req.body;
            const pool = await poolPromise;
            const request = pool.request();

            const adminExistsBool = await adminExists(login, password);
            const userExistsBool = await userExists(login, password);

            if (adminExistsBool || userExistsBool) {
                res.render('registration', { login });
            } else {
                await request
                    .input('login', mssql.VarChar, login)
                    .input('password', mssql.VarChar, password)
                    .input('name', mssql.VarChar, name)
                    .query("INSERT INTO Users (name, login, password) VALUES (@name, @login, @password)");

                res.render('regComplete', { name });
            }
        } catch (err) {
            console.error('Error during registration:', err);
            res.status(500).send('Error during registration');
        }
    });

    return userApp;
};
