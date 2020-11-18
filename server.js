require("dotenv").config();
const express = require("express");
const db = require("./db");
const app = express();
var path = require('path');
var bodyParser = require('body-parser');

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));

// Get all posts
app.get("/", async (req, res) => {
    try {
      const posts = await db.query(
        "select * from posts order by time_posted desc;"
      );

      res.render("index", {
        feed: "Recent Posts",
        posts: posts.rows
      });

    } catch (err) {
      console.log(err);
    }
});

// Get feed from search
app.post("/posts", async (req, res) => {
    console.log(req.body.name);

    try {
      const posts = await db.query(
        "select * from posts where author = $1 order by time_posted desc;", 
        [req.body.name]
      );
    
      res.render("index", {
        feed: "Posts by " + req.body.name,
        posts: posts.rows
      });

    } catch (err) {
      console.log(err);
    }
});

// Get post
app.get("/posts/:id", async (req, res) => {    
    try {
      const post = await db.query(
        "select * from posts where pid = $1;", 
        [req.params.id]
      );

      const comments = await db.query(
        "select * from comments where pid = $1 order by time_posted asc;", 
        [req.params.id]
      );

      res.render("post", {
        post: post.rows[0],
        comments: comments.rows
      });
    } catch (err) {
      console.log(err);
    }
});

// New post form
app.get("/addPost", (req, res) => {
  res.sendFile(path.join(__dirname, 'views/new_post.html'));
});

// Create post
app.post("/addPost", async (req, res) => {
    console.log(req.body);

    try {
      const results = await db.query(
        "insert into posts (author, content, time_posted) values ($1, $2, now()) returning *;",
        [req.body.author, req.body.content]
      );

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

      console.log(new_comment);

      res.redirect("/posts/" + req.params.id);
    } catch (err) {
      console.log(err);
    }
  });

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`server is up and listening on port ${port}`);
});

