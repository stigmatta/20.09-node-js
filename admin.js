const express = require('express');
const mssql = require('mssql');

module.exports = (poolPromise) => {
    const adminApp = express();

    async function adminExists(login, password) {
        const pool = await poolPromise;
        const request = pool.request();
        const result = await request
            .input('login', mssql.VarChar, login)
            .input('password', mssql.VarChar, password)
            .query('SELECT COUNT(*) AS count FROM admins WHERE login = @login AND password = @password');

        return result.recordset[0].count > 0;
    }

    adminApp.get('/authorization', (req, res) => {
        res.sendFile(path.join(__dirname, 'Pages', 'authorization.html'));
    });

    adminApp.post('/authorization', async (req, res) => {
        try {
            const { login, password } = req.body;

            if (await adminExists(login, password)) {
                const pool = await poolPromise;
                const request = pool.request();
                const adminResult = await request.query('SELECT login FROM Admins');
                const userResult = await request.query('SELECT login FROM Users');

                res.render('adminTable', {
                    admins: adminResult.recordset,
                    users: userResult.recordset
                });
            } else {
                res.send('Invalid admin login or password');
            }
        } catch (err) {
            console.error('Error during admin login:', err);
            res.status(500).send('Error during admin login');
        }
    });

    return adminApp;
};
