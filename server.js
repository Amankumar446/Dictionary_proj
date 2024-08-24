const express = require(`express`);
const mysql = require(`mysql2`);
const bcrypt = require(`bcryptjs`);
const bodyParser = require(`body-parser`);
const session = require(`express-session`);
const path = require(`path`)

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: `qwert`, resave: true, saveUninitialized: true }))

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'dictionary',
})
db.connect((err) => {
    if (err) throw err
    console.log("Database connected ......")
})
// signup route
app.post(`/signup`, (req, res) => {
    const { first_name, last_name, username, password, email, dob } = req.body
    const hashedPassword = bcrypt.hashSync(password, 10)
    const query = `insert into users (first_name,last_name,username,password,email,dob) values (?,?,?,?,?,?) `;
    db.query(query, [first_name, last_name, username, hashedPassword, email, dob], (err) => {
        if (err) throw err;
        res.redirect(path.join('login.html'));
    })
})
//login route
app.post(`/login`, (req, res) => {
    const { username, password } = req.body
    const query = `select * from users where username = ?`
    db.query(query, [username], (err, result) => {
        if (err) {
            console.log('Database query error', err)
            res.status(500).send(`Internal serverr error`)
        }
        if (result.length > 0) {
            const user = result[0]

            if (bcrypt.compareSync(password, user.password)) {
                req.session.user = user
                res.redirect(path.join(`admin.html`))
            }
        }
    })
})
//admin panel
app.post(`/admin/submit`, (req, res) => {
    const { word, meaning_english, meaning_hindi } = req.body
    const query = `insert into words(word,meaning_english,meaning_hindi) values (?,?,?)`;
    db.query(query, [word, meaning_english, meaning_hindi], (err) => {
        if (err) {
            console.log(`Database Error`, err)
            res.status(500).send(`An error occurred while adding the word`)
        }
        res.status(200).send(`Word added successfully`)
    })
})
//search panel
app.get(`/search`, (req, res) => {
    const { word, language } = req.query
    let column;
    if (language === `english`) {
        column = `meaning_english`
    }
    else if (language === `hindi`) {
        column = `meaning_hindi`
    }
    else {
        return res.status(500).json({ error: `Invalid language, supported languages is 'english' or 'hindi'` })
    }
    const query = `select ${column} as meaning from words where word = ?`
    db.query(query, [word], (err, result) => {
        //callback function to handle query result
        if (err) {
            console.log(`Database query error`, err)
            return res.status(500).json({ error: `An error occure while searching for the word.` })
        }

        if (result.length > 0) {
            res.json({ meaning: result[0].meaning })
        }
        else {
            res.json({ meaning: `word not found` })
        }
    })
})
app.listen(3000, () => {
    console.log(`Server is running on port 3000`)
})