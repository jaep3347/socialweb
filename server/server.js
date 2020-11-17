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
          // our own sql query here
        "select * from restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating),1) as average_rating from reviews group by restaurant_id) reviews on restaurants.id = reviews.restaurant_id;"
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
app.get("/api/v1/posts/:id", async (req, res) => {
    console.log(req.params.id);
  
    try {
      const restaurant = await db.query(
          // our own sql query here
        "select * from restaurants left join (select restaurant_id, COUNT(*), TRUNC(AVG(rating),1) as average_rating from reviews group by restaurant_id) reviews on restaurants.id = reviews.restaurant_id where id = $1",
        [req.params.id]
      );
      // select * from restaurants wehre id = req.params.id
  
      const reviews = await db.query(
        "select * from reviews where restaurant_id = $1",
        [req.params.id]
      );
      console.log(reviews);
  
      res.status(200).json({
        status: "succes",
        data: {
          restaurant: restaurant.rows[0],
          reviews: reviews.rows,
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
          // our own sql query here
        "INSERT INTO restaurants (name, location, price_range) values ($1, $2, $3) returning *",
        [req.body.name, req.body.location, req.body.price_range]
      );
      console.log(results);
      res.status(201).json({
        status: "succes",
        data: {
          restaurant: results.rows[0],
        },
      });
    } catch (err) {
      console.log(err);
    }
  });

  app.post("/api/v1/posts/:id/addComment", async (req, res) => {
    try {
      const newComment = await db.query(
          // our own sql query here
        "INSERT INTO reviews (restaurant_id, name, review, rating) values ($1, $2, $3, $4) returning *;",
        [req.params.id, req.body.name, req.body.review, req.body.rating]
      );
      console.log(newComment);
      res.status(201).json({
        status: "success",
        data: {
          review: newComment.rows[0],
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

