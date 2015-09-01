var Message = React.createClass({
    getInitialState: function() {
        return {
            text: "",
            songs: []
        };
    },
    addSongsToPlaylist: function (playlistId, accessToken) {
        var request = new XMLHttpRequest();
        var userId = 'burtchen'; //TODO: Get from user request
        var uris = _.pluck(this.state.songs, "uri"); //TODO: No undefineds.
        request.open('POST', 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks', true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader("Authorization", "Bearer " + accessToken);
        request.send(JSON.stringify(uris));
        request.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status >= 200 && this.status < 400) {
                    var responseObject = JSON.parse(this.responseText);
                    console.log('playlist has been filled');
                } else {
                    console.log('yikes, an error adding stuff to the playlist');
                }
            }
        };
    },
    createPlaylist: function (accessToken) {
        var that = this;
        var request = new XMLHttpRequest();
        var userId = 'burtchen'; //TODO: Get from user request
        var data = {
            name: "messageForYou" // TODO: Make playlist name customizable
        };
        request.open('POST', 'https://api.spotify.com/v1/users/' + userId + '/playlists', true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader("Authorization", "Bearer " + accessToken);
        request.send(JSON.stringify(data));
        request.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status >= 200 && this.status < 400) {
                    var responseObject = JSON.parse(this.responseText);
                    that.addSongsToPlaylist(responseObject.id, accessToken);
                } else {
                    console.log('There was an error creating the playlist.');
                }
            }
        };
    },
    getSongsForPlaylist: function() {
        var that = this;
        var incomingSongs = [];
        var spotifySearchUrl = "https://api.spotify.com/v1/search";
        var searchKeywords = this.state.text.split(" "); //TODO: Custom delimiters, eliminate spaces.
        searchKeywords.forEach(function (keyword) {
            var request = new XMLHttpRequest();
            incomingSongs.push({
                title: keyword,
                status: "pending"
            });
            var firstMatch;
            that.setState({songs: incomingSongs});
            request.open('GET', spotifySearchUrl + "?q=" + keyword + "&type=track", true);
            request.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status >= 200 && this.status < 400) {
                        var data = JSON.parse(this.responseText);
                        var songObject; //TODO: let;
                        // TODO: Filter by market
                        // TODO: Multiple matches
                        if (data.tracks && data.tracks.items) {
                            _.each(data.tracks.items, function (item) {
                                firstMatch = null;
                                if (item.name.toLowerCase() === keyword.toLowerCase()) {
                                    firstMatch = item;
                                    return false;
                                }
                            });
                            songObject = _.findWhere(incomingSongs, {title: keyword});
                            if (firstMatch) {
                                songObject.status = "match";
                                songObject.id = firstMatch.id;
                                songObject.url = firstMatch.uri;
                                songObject.title = firstMatch.name;
                                songObject.artist = firstMatch.artists[0].name;
                            } else {
                                songObject.status = "unmatched";
                            }
                        }
                        that.setState({songs: incomingSongs});
                    } else {
                        that.setState({generalError: true});
                    }
                }
            };

            request.send();
            request = null;
        });
    },
    eachSong: function(song) {
        return (
            <Song title={song.title} artist={song.artist} key={song.id} status={song.status}/>
        );
    },
    handleChange: function(event) {
        this.setState({ text: event.target.value });
    },

    getSpotifyApi: function() { //TODO: If still logged in, we should directly go to the playlist creation
        var that = this;
        var CLIENT_ID = '14ab7c0b9c0b4c7d982b50a0eb7f8e8a';
        var REDIRECT_URI = 'https://www.der-burtchen.de/playlistmessage/proxy/';
        function getLoginURL(scopes) {
            return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
                '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
                '&scope=' + encodeURIComponent(scopes.join(' ')) +
                '&response_type=token';
        }

        var url = getLoginURL([
            'playlist-modify-public' //TODO: check whether private is better/worse
        ]);

        var width = 450,
            height = 730,
            left = (screen.width / 2) - (width / 2),
            top = (screen.height / 2) - (height / 2);

        var messageCallback =  function(event) {
            var hash = JSON.parse(event.data);
            if (hash.type == 'access_token') {
                that.getUserData(hash.access_token); //TODO: Maybe still display user data
                that.createPlaylist(hash.access_token);
            }
            window.removeEventListener("message", messageCallback);
        };

        window.addEventListener("message", messageCallback.bind(this), false);

        var w = window.open(url,
            'Spotify',
            'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
        );

    },

    getUserData: function(accessToken) {
        var request = new XMLHttpRequest();
        request.open('GET', 'https://api.spotify.com/v1/me', true);
        request.setRequestHeader("Authorization", "Bearer " + accessToken);
        request.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    var resp = this.responseText;
                    console.log(resp);
                } else {
                    console.log("yikes, an error");
                }
            }
        };

        request.send();
        request = null;
    },
    render: function() {
        return (
            <div>
                <div className="well clearfix">
        <textarea placeholder="Type your spotify message here (maximum 15 words)." className="form-control"
                  onChange={this.handleChange}>
        </textarea>
                    <br/>
                    <span>{this.state.text.split(" ").length - 1} words ({this.state.text.length} characters)</span>
                    <button className="btn btn-primary pull-right"
                            onClick={this.getSongsForPlaylist}
                            disabled={this.state.text.length === 0}>Get songs for playlist</button>
                </div>
                <div className="well clearfix">
                    <ul id="react-suggested-songs" className="clearfix list-group">
                        {this.state.songs.map(this.eachSong)}
                    </ul>
                    <button className="btn btn-primary pull-right"
                            onClick={this.getSpotifyApi}
                            disabled={this.state.songs.length === 0}>Create playlist</button>
                </div>
            </div>
        );
    }
});