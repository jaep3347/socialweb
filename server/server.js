require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const db = require("./db");
const app = express();

app.use(morgan("dev"));

// Get all Posts
app.get("/api/v1/posts", async (req, res) => {
    try {
      const posts = await db.query(
        "select * from posts order by time_posted asc;"
      );
  
      res.status(200).json({
        status: "success",
        results: posts.rows.length,
        data: {
            posts: posts.rows,
        },
      });
    } catch (err) {
      console.log(err);
    }
});

// Get Feed from Search
app.get("/api/v1/posts/:name", async (req, res) => {
    console.log(req.params.name);

    try {
      const posts = await db.query(
        'select * from posts where author = ' + req.params.name.replace(/"/g, '\'')
      );
    
      const comments = await db.query(
        'select * from comments where author = ' + req.params.name.replace(/"/g, '\'')
      );
  
      res.status(200).json({
        status: "succes",
        data: {
          posts: posts.rows,
          comments: comments.rows,
        },
      });
    } catch (err) {
      console.log(err);
    }
  });

// Create Post
app.post("/api/v1/posts", async (req, res) => {
    console.log(req.body);

    try {
      const results = await db.query(
        "insert into posts (author, content, time_posted) values ($1, $2, now()) returning *;",
        [test.author, test.content]
      );
      console.log(results);
      res.status(201).json({
        status: "succes",
        data: {
          post: results.rows[0],
        },
      });
    } catch (err) {
      console.log(err);
    }
  });

// Add Comment to Post
app.post("/api/v1/posts/:id/addComment", async (req, res) => {
    try {
      const newComment = await db.query(
        "insert into comments (pid, author, content, time_posted) values ($1, $2, $3, now()) returning *;",
        [req.params.id, req.body.author, req.body.content]
      );
      console.log(newComment);
      res.status(201).json({
        status: "success",
        data: {
          comment: newComment.rows[0],
        },
      });
    } catch (err) {
      console.log(err);
    }
  });


const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`server is up and listening on port ${port}`);
});

