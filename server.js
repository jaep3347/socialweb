require("dotenv").config();
const express = require("express");
const db = require("./db");
const app = express();
var path = require('path');
var bodyParser = require('body-parser');
const session = require('express-session')

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

// Get all posts (Home Page)
app.get("/", async (req, res) => {
  
  try {
    const posts = await db.query(
      "select * from posts order by time_posted desc;"
    );

    const favorites = await db.query(
      "select p.content from posts as p join favorites as f on p.pid = f.pid where f.uid = $1;",
      [req.session.uid]
    );

    console.log(favorites.rows);

    if (req.session.loggedin) {
      res.render("pages/index", {
        loggedin: true,  
        feed: "Recent Posts",
        posts: posts.rows,
        name: req.session.name,
        favorites: favorites.rows,
        numComments: req.session.numComments,
        numPosts: req.session.numPosts
      });
    } else {
      res.render("pages/index", {
        loggedin: false,  
        feed: "Recent Posts",
        posts: posts.rows,
      });
    }
  } catch (err) {
    console.log(err);
  }
});


// Log In Page
app.get("/login", async (req, res) => {
  try {
    res.render("pages/login")
  } catch (err) {
    console.log(err);
  }
})

// Log In Page POST
app.post('/login', async (req, res) => {
	if (req.body.password && req.body.password) {
    const result = await db.query(
      "select * from users where username = $1 AND password = $2", 
      [req.body.username, req.body.password]
    );

    if (result.rows[0]) {
      req.session.loggedin = true;
      req.session.name = result.rows[0].name;
      req.session.uid = result.rows[0].uid;
      req.session.numPosts = result.rows[0].posts;
      req.session.numComments = result.rows[0].comments;
      res.redirect('/');
    } else {
      res.send('Incorrect Username and/or Password!');
    }
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

// Sign Up Page
app.get("/register", async (req, res) => {
  try {
    res.render("pages/register")
  } catch (err) {
    console.log(err);
  }
})

// Sign Up Page POST
app.post("/register", async (req, res) => {
  try {
    await db.query(
      "insert into users (name, username, password, comments, posts) values ($1, $2, $3, 0, 0);",
      [req.body.name, req.body.username, req.body.password]
    );
    console.log("done");
    res.redirect('/login')
  } catch (err) {
    console.log(err);
    res.redirect('/register');
  }
});

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

      if (req.session.loggedin) {
        res.render("pages/index", {
          feed: "Posts for " + req.body.terms,
          posts: posts.rows,
          name: req.session.name,
          numComments: req.session.numComments,
          numPosts: req.session.numPosts
        });
      } else {
        res.render("pages/index", {
          feed: "Posts for " + req.body.terms,
          posts: posts.rows,
        });
      }
    } catch (err) {
      console.log(err);
    }
});

// Get post
app.get("/posts/:id", async (req, res) => {    
  try {
    const post = await db.query(
      "select p.content, u.name from posts as p join users as u on p.uid = u.uid where p.pid = $1;",
      [req.params.id]
    );

    const comments = await db.query(
      "select c.content, u.name from comments as c join users as u on c.uid = u.uid where c.pid = $1;",
      [req.params.id]
    );

    var favorite = await db.query(
      "select * from favorites where pid = $1 and uid = $2;",
      [req.params.id, req.session.uid]
    )

    if (favorite.rows[0]) {
      favorite = true;
    } 

    if (req.session.loggedin) {
      res.render("pages/post", {
        post: post.rows[0],
        comments: comments.rows,
        loggedin: true,
        favorite: favorite
      });
    } else {
      res.render("pages/post", {
        post: post.rows[0],
        comments: comments.rows,
        loggedin: false,
        favorite: false
      });
    }

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
      "insert into posts (uid, content, time_posted) values ($1, $2, now()) returning *;",
      [req.session.uid, req.body.content]
    );

    req.session.numPosts += 1;

    res.redirect("/posts/" + results.rows[0].pid);
  } catch (err) {
    console.log(err);
  }
});

// Favorite post
app.post("/posts/:id/addFavorite", async (req, res) => {
  try {
    await db.query(
      "insert into favorites (pid, uid) values ($1, $2);",
      [req.params.id, req.session.uid]
    );
    res.redirect("/posts/" + req.params.id);
  } catch (err) {
    console.log(err);
  }
});

// Add comment to post
app.post("/posts/:id/addComment", async (req, res) => {
  console.log(req.params.id)

  try {
    await db.query(
      "insert into comments (pid, uid, content, time_posted) values ($1, $2, $3, now()) returning *;",
      [req.params.id, req.session.uid, req.body.content]
    );

    req.session.numComments += 1;
    await db.query(
      "update users set comments = $1 where uid = $2;",
      [req.session.numComments + 1, req.session.uid]
    );

    res.redirect("/posts/" + req.params.id);
  } catch (err) {
    console.log(err);
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`server is up and listening on port ${port}`);
});

