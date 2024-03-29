const Movie = require("./models/Movie");
const Shelf = require("./models/Shelf");
const empty = require("is-empty");
const keys = require("./config/keys");
const tmdb = require("moviedb")(keys.tmdbApiKey);
const defaults = require("./config/defaults");

var base_url;
var poster_size;

// Get config
const getConfig = function() {
  return new Promise((resolve, reject) => {
    if (base_url && poster_size) {
      return resolve({ base_url, poster_size });
    }
    tmdb.configuration((err, res) => {
      if (!err) {
        base_url = res.images.base_url;
        const poster_sizes = res.images.poster_sizes;
        poster_size = poster_sizes[poster_sizes.length - 1];
        return resolve({ base_url, poster_size });
      }
      console.log(err);
      return reject(err);
    });
  });
};

const parseCredits = function(movieCredits) {
  const movieCast = [];
  const directors = [];

  const { cast, crew } = movieCredits;
  cast.forEach(person => {
    castMember = {
      id: person.id,
      name: person.name
    };
    movieCast.push(castMember);
  });
  crew.forEach(person => {
    crewMember = {
      id: person.id,
      name: person.name
    };
    if (!empty(person.job) && person.job === "Director") {
      directors.push(crewMember);
    }
  });
  return { cast: movieCast, directors: directors };
};

const createMovie = function(movieInfo, movieCredits) {
  const { cast, directors } = parseCredits(movieCredits);
  const movie = new Movie();
  movie._id = movieInfo.id;
  movie.id = movieInfo.id;
  movie.title = movieInfo.title;
  movie.imdb_id = movieInfo.imdb_id;
  movie.release_date = new Date(movieInfo.release_date);
  movie.plot_summary = movieInfo.overview;
  movie.avg_rating = movieInfo.vote_average;
  movie.ratings_count = movieInfo.vote_count;
  movie.duration = movieInfo.runtime;
  movie.language = movieInfo.original_language;
  movie.adult = movieInfo.adult;
  movie.genres = movieInfo.genres;
  movie.cast = cast;
  movie.directors = directors;

  return movie;
};

const getMovie = async function(id) {
  return new Promise((resolve, reject) => {
    tmdb.movieInfo({ id }, (movieErr, movieInfo) => {
      const errors = {};
      if (movieErr) {
        return reject(movieErr);
      }
      if (empty(movieInfo)) {
        errors.error = "Empty Movie Response";
        return reject(errors);
      }
      console.log(movieInfo.title);
      tmdb.movieCredits({ id }, (credErr, movieCredits) => {
        if (credErr) {
          return reject(credErr);
        }
        if (empty(movieCredits)) {
          errors.error = "Empty Credits Response";
        }

        movie = createMovie(movieInfo, movieCredits);
        if (movieInfo.poster_path) {
          getConfig()
            .then(data => {
              const { base_url, poster_size } = data;
              movie.poster_path =
                base_url + poster_size + movieInfo.poster_path;
              return resolve(movie);
            })
            .catch(err => {
              return reject(err);
            });
        } else {
          return resolve(movie);
        }
      });
    });
  });
};
module.exports.getMovie = getMovie;

module.exports.updateRating = function(ratings, movieId, newRating) {
  var updated = false;
  for (var i = 0; i < ratings.length; i++) {
    if (ratings[i].movieId === movieId) {
      updated = true;
      ratings[i].rating = newRating;
    }
  }
  if (!updated) {
    ratings.push({ movieId, rating: newRating });
  }

  return ratings;
};

const updateShelf = function(shelfId, newShelf) {
  return new Promise((resolve, reject) => {
    Shelf.findByIdAndUpdate(shelfId, newShelf).then(shelf => {
      if (empty(shelf)) {
        console.log("Shelf " + shelfId + " not found");
        errors.error = "Shelf not found";
        return reject(errors);
      } else {
        return resolve({
          success: true
        });
      }
    });
  });
};
module.exports.updateShelf = updateShelf;

const promiseSerial = funcs =>
  funcs.reduce(
    (promise, func) =>
      promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );

const getShelfMovies = function(shelfId) {
  return new Promise((resolve, reject) => {
    Shelf.findById(shelfId).then(shelf => {
      if (empty(shelf)) {
        console.log("Shelf " + shelfId + " not found");
        errors.error = "Shelf not found";
        return reject(errors);
      } else {
        const funcs = shelf.movies.map(movieId => () => getMovie(movieId));
        promiseSerial(funcs).then(result => {
          return resolve(result);
        });
      }
    });
  });
};
module.exports.getShelfMovies = getShelfMovies;

module.exports.addToShelf = function(shelfId, movieId) {
  return new Promise((resolve, reject) => {
    Shelf.findById(shelfId).then(shelf => {
      if (empty(shelf)) {
        console.log("Shelf " + shelfId + " not found");
        errors.error = "Shelf not found";
        return reject(errors);
      } else {
        console.log(shelf.movies);

        if (!shelf.movies.includes(movieId)) {
          shelf.movies.push(movieId);
          updateShelf(shelfId, shelf).then(success => {
            return resolve({ success });
          });
        } else {
          errors.error = "Shelf already contains movieId = " + movieId;
          console.log(errors.error);
          return reject(errors);
        }
      }
    });
  });
};

module.exports.removeFromShelf = function(shelfId, movieId) {
  return new Promise((resolve, reject) => {
    Shelf.findById(shelfId).then(shelf => {
      if (empty(shelf)) {
        console.log("Shelf " + shelfId + " not found");
        errors.error = "Shelf not found";
        return reject(errors);
      } else {
        var index = shelf.movies.indexOf(movieId);
        if (index > -1) {
          shelf.movies.splice(index, 1);
          updateShelf(shelfId, shelf).then(success => {
            return resolve({ success });
          });
        } else {
          errors.error = "Shelf does not contain movieId = " + movieId;
          console.log(errors.error);
          return reject(errors);
        }
      }
    });
  });
};

module.exports.getMovieCollection = function(collectionName, page) {
  const promise = new Promise((resolve, reject) => {
    const callBack = function(err, res) {
      if (!err) {
        return resolve(res);
      }
      console.log(err);
      return reject(err);
    };
    const params = { page };

    switch (collectionName) {
      case "top_rated":
        tmdb.miscTopRatedMovies(params, callBack);
        break;
      case "popular":
        tmdb.miscPopularMovies(params, callBack);
        break;
      case "latest":
        tmdb.miscLatestMovies(params, callBack);
        break;
      case "upcoming":
        tmdb.miscUpcomingMovies(params, callBack);
        break;
      case "now_playing":
        tmdb.miscNowPlayingMovies(params, callBack);
        break;
      default:
        errors = { error: collectionName + " is not a valid collection name" };
        console.log(errors);
        return reject(errors);
    }
  });
  return new Promise((resolve, reject) => {
    promise
      .then(collection => {
        getConfig()
          .then(data => {
            const { base_url, poster_size } = data;
            collection.results.forEach(movie => {
              if (movie.poster_path) {
                movie.poster_path = base_url + poster_size + movie.poster_path;
              } else {
                movie.poster_path = defaults.poster_path;
              }
            });
            return resolve(collection);
          })
          .catch(err => {
            return reject(err);
          });
      })
      .catch(err => {
        return reject(err);
      });
  });
};

module.exports.searchMovies = function(query, page) {
  const promise = new Promise((resolve, reject) => {
    const params = { query, page };
    console.log("Searching with params " + JSON.stringify(params));
    tmdb.searchMovie(params, (err, res) => {
      if (!err) {
        return resolve(res);
      }
      console.log(err);
      return reject(err);
    });
  });
  return new Promise((resolve, reject) => {
    promise
      .then(collection => {
        getConfig()
          .then(data => {
            const { base_url, poster_size } = data;
            collection.results.forEach(movie => {
              if (movie.poster_path) {
                movie.poster_path = base_url + poster_size + movie.poster_path;
              } else {
                movie.poster_path = defaults.poster_path;
              }
            });
            return resolve(collection);
          })
          .catch(err => {
            return reject(err);
          });
      })
      .catch(err => {
        return reject(err);
      });
  });
};
