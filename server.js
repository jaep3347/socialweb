require("dotenv").config();
const express = require("express");
const db = require("./db");
const app = express();
var path = require('path');
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { request } = require("http");
const { response } = require("express");
const passport = require('passport');
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')


const initializePassport = require('./passport-config');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)
const users = [];
let numComments = 0;
let numPosts = 0;


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.urlencoded({extended: false}));
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))


// Get all posts (Home Page)
app.get("/", checkAuthenticated, async (req, res) => {
    try {
      const posts = await db.query(
        "select * from posts order by time_posted desc;"
      );

      res.render("pages/index", {
        feed: "Recent Posts",
        posts: posts.rows,
        name: req.user.name,
        numComments: numComments,
        numPosts: numPosts
      });

    } catch (err) {
      console.log(err);
    }
});

// Guest Page
app.get("/guest", checkNotAuthenticated, async (req, res) => {
  try {
    const posts = await db.query(
      "select * from posts order by time_posted desc;"
    );

    res.render("pages/guest", {
      feed: "Recent Posts",
      posts: posts.rows
    });
  } catch (err) {
    console.log(err);
  }
})

// Log In Page
app.get("/login", checkNotAuthenticated, async (req, res) => {
  try {
    res.render("pages/login")
  } catch (err) {
    console.log(err);
  }
})

// Log In Page POST
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))


// Sign Up Page
app.get("/register", checkNotAuthenticated, async (req, res) => {
  try {
    res.render("pages/register")
  } catch (err) {
    console.log(err);
  }
})

// Sign Up Page POST
app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch (err) {
    res.redirect('/register')
    console.log(err);
  }
  console.log(users);
})

// Get feed from search
app.post("/posts", async (req, res) => {
    console.log(req.body.terms);

    const exclude = ["and", "of", "is", "are", "how", "where", "what", "when", "who"];
    var lowercase = req.body.terms.toLowerCase().split(" ");
    var keywords = lowercase.filter(word => !exclude.includes(word));
    console.log(keywords);

    try {

      const posts = await db.query(
        "select * from posts where content ilike '%" + keywords.join("%' or content ilike '%") + "%';"
      )

      if (req.isAuthenticated()) {
        res.render("pages/index", {
          feed: "Posts for " + req.body.terms,
          posts: posts.rows,
          name: req.user.name,
          numComments: numComments,
          numPosts: numPosts
        });
      } else {
        res.render("pages/guest", {
          feed: "Posts for " + req.body.terms,
          posts: posts.rows
        })
      }

    } catch (err) {
      console.log(err);
    }
});

// Get post
app.get("/posts/:id", async (req, res) => {    
    try {
      const post = await db.query(
        "select * from posts where pid = " + req.params.id
      );

      const comments = await db.query(
        "select * from comments where pid = " + req.params.id
      );

      if (req.isAuthenticated()) {
        username = req.user.name
      } else {
        username = null
      }

      res.render("pages/post", {
        post: post.rows[0],
        comments: comments.rows,
        name: username
      });

    } catch (err) {
      console.log(err);
    }
});

// New post form
app.get("/new_post.html", (req, res) => {
    res.sendFile(path.join(__dirname, 'new_post.html'));
});

// Create post
app.post("/posts/new", async (req, res) => {
    console.log(req.body);

    try {
      const results = await db.query(
        "insert into posts (author, content, time_posted) values ($1, $2, now()) returning *;",
        [req.body.author, req.body.content]
      );
      numPosts += 1;
      console.log(numPosts);
      console.log(results);

      res.redirect("/posts/" + results.rows[0].pid);
    } catch (err) {
      console.log(err);
    }
});

// Add comment to post
app.post("/posts/:id/addComment", async (req, res) => {
    console.log(req.params.id)

    try {
      const new_comment = await db.query(
        "insert into comments (pid, author, content, time_posted) values ($1, $2, $3, now()) returning *;",
        [req.params.id, req.body.author, req.body.content]
      );
      numComments += 1;
      console.log(numComments);
      console.log(new_comment);

      res.redirect("/posts/" + req.params.id);
    } catch (err) {
      console.log(err);
    }
  });


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/guest')
}
  
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()
}

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/')
})

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`server is up and listening on port ${port}`);
});

