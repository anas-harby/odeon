import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import { login } from "../../actions/userActions";
import "./auth.scss";

class Login extends Component {
  constructor(props) {
    super(props);
    console.log(this.props);

    this.state = {
      email: "",
      password: ""
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    // Redirecting to home if user is already logged in
    if (this.props.userReducer.isAuthenticated) {
      this.props.history.push("/");
    }
  }

  // This lifecycle method is invoked before a mounted component receives new props
  componentWillReceiveProps(nextProps) {
    if (nextProps.userReducer.isAuthenticated) {
      this.props.history.push("/");
    }
  }

  handleChange(e) {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  handleSubmit(e) {
    e.preventDefault();

    const { email, password } = this.state;
    const { dispatch } = this.props;

    if (email && password) {
      this.props.login(email, password);
    }
  }
  render() {
    const { email, password } = this.state;
    return (
      <div className="container">
        <div className="form-background">
          <h1>Login</h1>
          <form onSubmit={this.handleSubmit}>
            <input
              type="email"
              name="email"
              value={email}
              onChange={this.handleChange}
              placeholder="Email"
            />
            <br />
            <input
              type="password"
              name="password"
              value={password}
              onChange={this.handleChange}
              placeholder="Password"
            />
            <br />
            <br />
            <input type="submit" defaultValue="Sign Up" />
          </form>
        </div>
        <div className="login">
          <p>Don't have an account?<Link to='/signup'>Sign Up</Link></p>
        </div>
      </div>
    );
  }
}

Login.propTypes = {
  userReducer: PropTypes.object.isRequired,
  login: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  userReducer: state.userReducer
});

export default connect(
  mapStateToProps,
  { login }
)(Login);
