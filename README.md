# Complete Guide to Node Authentication with MySQL  Express.js- Login -Signup -ResetPassword
# Update dari: https://github.com/nax3t/yelp-camp-refactored
# Update dari: https://github.com/manjeshpv/node-express-passport-mysql
# digabungkan supaya di Mysql bisa juga Reset Password

## Instructions


1. Install packages: `npm install`
2. Edit the database configuration: `config/database.js`
3. Create the database schema: `node create_database.js`
4. Padad folder routes-->index.js. Update pada app.post("/forgot")di "nodemailer.createTransport" Ubah user dan pass email anda
5. Launch: `node app.js`
6. Visit in your browser at: `http://localhost:8080`
