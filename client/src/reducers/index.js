import { combineReducers } from "redux";
import userReducer from "./userReducer";
import profileReducer from "./profileReducer";
import movieReducer from "./movieReducer";

export default combineReducers({
  user: userReducer,
  profile: profileReducer,
  movie: movieReducer
});
