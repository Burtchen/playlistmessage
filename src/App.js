import React, { Component } from "react";
import "./normalize.css";
import "./App.css";

import Header from "./components/Header";
import { Message } from "./components/Message";
import { getUserData } from "./services/spotify";
import Footer from "./components/Footer";

const CLIENT_ID = "14ab7c0b9c0b4c7d982b50a0eb7f8e8a";

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = { accessToken: null, userId: null };
  }
  getHashParams() {
    const hashParams = {};
    let e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    while ((e = r.exec(q))) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  getSpotifyApi() {
    const redirect_uri = window.location.protocol + "//" + window.location.host;
    const state = new Uint32Array(16);
    // todo: check for support?
    window.crypto.getRandomValues(state);

    const scope = "playlist-modify-public playlist-modify-private";

    let url = "https://accounts.spotify.com/authorize";
    url += "?response_type=token";
    url += "&client_id=" + encodeURIComponent(CLIENT_ID);
    url += "&scope=" + encodeURIComponent(scope);
    url += "&redirect_uri=" + encodeURIComponent(redirect_uri);
    url += "&state=" + encodeURIComponent(state);
    window.location = url;
  }

  componentDidMount() {
    if (!this.state.accessToken) {
      const params = this.getHashParams();
      if (params?.access_token) {
        this.setState({ accessToken: params.access_token }, this.setUserId);
      }
    }
  }

  setupForSessionRefresh() {
    this.setState({ accessToken: null });
    window.location = window.location.href;
  }

  setUserId = async () => {
    const responseJson = await getUserData(
      this.state.accessToken
    ).then((response) => response.json());
    this.setState({ userId: responseJson.id });
  };

  render() {
    const hasPreviousAuth = this.state.userId !== null;
    const hasDenied = window.location.search?.includes("access_denied");
    return (
      <div>
        <Header />
        {this.state.accessToken ? (
          <Message
            refreshSession={this.setupForSessionRefresh}
            accessToken={this.state.accessToken}
            userId={this.state.userId}
          />
        ) : (
          <div className="sm_section">
            <div className="example-image-container">
              <img
                alt="Example PlaylistMessage"
                src={`${process.env.PUBLIC_URL}/${
                  hasPreviousAuth ? "example2" : "example"
                }.png`}
              />
            </div>
            {hasDenied && (
              <p className="hint alert">
                Once more, with feeling! You need to authorize Spotify,
                otherwise we can't play(list message).
              </p>
            )}
            {hasPreviousAuth ? (
              <p className="hint" style={{ marginTop: "1rem" }}>
                Your Spotify connection expired, click below to write another
                playlist message.
              </p>
            ) : (
              <p className="hint">
                Say it with a playlist! Just type and we'll find songs matching
                your input. Then, save the playlist in your Spotify account and
                share it!
              </p>
            )}
            <button
              className="btn btn-primary"
              type="button"
              onClick={this.getSpotifyApi}
            >
              {hasPreviousAuth ? "Start again" : "Authorize Spotify to Start"}
            </button>
            {!hasPreviousAuth && (
              <p className="hint" style={{ marginTop: "1rem" }}>
                We need your permission to use your Spotify account to search
                for songs and create public playlists. We cannot your email
                address or any other information you do not grant access to.
              </p>
            )}
          </div>
        )}
        <Footer />
      </div>
    );
  }
}

export default App;
