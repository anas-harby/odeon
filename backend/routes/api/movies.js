const decode = require("jwt-decode");

const express = require("express");
const router = express.Router();
const passport = require("passport");

// User functions
const users = require("../../user");
// Movies functions
const moviesUtil = require("../../moviesUtil");

keys = require("../../config/keys");

router.get("/:id", (req, res) => {
  const id = req.params.id;
  moviesUtil
    .getMovie(id)
    .then(data => {
      // console.log(data);
      res.json(data);
    })
    .catch(err => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.put(
  "/rate/:id",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    const info = decode(req.headers.authorization);
    const movieId = req.params.id;
    const newRating = req.body.rating;
    console.log("New Rating:");
    console.log(newRating);
    console.log("token info:");
    console.log(info);
    const user = users.getUser(info.id);
    user.ratings = moviesUtil.updateRating(user.ratings, movieId, newRating);
    errors = {};
    users
      .editUser(info.id, user)
      .then(data => {
        console.log(data);
        res.json(data);
      })
      .catch(err => {
        console.log(err);
        res.status(400).json(err);
      });
  }
);

router.put(
  "/add-to-shelf",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    const info = decode(req.headers.authorization);
    const movieId = req.body.movieId;
    const shelfId = req.body.shelfId;
    console.log("AddMovie(ShelfId=" + shelfId + ", MovieId=" + movieId + ")");
    console.log("token info:");
    console.log(info);
    errors = {};
    const user = users.getUser(info.id);
    if (!user.shelves.includes(shelfId)) {
      errors.shelf = "Requested shelf id does not belong to user";
      res.status(400).json(errors);
    } else {
      moviesUtil
        .addToShelf(shelfId, movieId)
        .then(data => {
          console.log(data);
          res.json(data);
        })
        .catch(err => {
          console.log(err);
          res.status(400).json(err);
        });
    }
  }
);

router.put(
  "/remove-from-shelf",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    const info = decode(req.headers.authorization);
    const movieId = req.body.movieId;
    const shelfId = req.body.shelfId;
    console.log(
      "RemoveMovie(ShelfId=" + shelfId + ", MovieId=" + movieId + ")"
    );
    console.log("token info:");
    console.log(info);
    errors = {};
    const user = users.getUser(info.id);
    if (!user.shelves.includes(shelfId)) {
      errors.shelf = "Requested shelf id does not belong to user";
      res.status(400).json(errors);
    } else {
      moviesUtil
        .removeFromShelf(shelfId, movieId)
        .then(data => {
          console.log(data);
          res.json(data);
        })
        .catch(err => {
          console.log(err);
          res.status(400).json(err);
        });
    }
  }
);

router.get("/collection/:name", (req, res) => {
  const collectionName = req.params.name;
  const page = req.params.page || 1;
  moviesUtil
    .getMovieCollection(collectionName, page)
    .then(data => {
      console.log(data);
      res.json(data);
    })
    .catch(err => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.get("/search", (req, res) => {
  const query = req.params.query;
  const page = req.params.page || 1;
  moviesUtil
    .searchMovies(query, page)
    .then(data => {
      console.log(data);
      res.json(data);
    })
    .catch(err => {
      console.log(err);
      res.status(400).json(err);
    });
});

module.exports = router;
