var Message = React.createClass({
    getInitialState: function() {
        return {
            text: "",
            songs: []
        };
    },
    createPlaylist: function () {
        var spotifyAuthUrl = "https://accounts.spotify.com/authorize";
        $.get(spotifyAuthUrl, {
                "client_id": "14ab7c0b9c0b4c7d982b50a0eb7f8e8a",
                "response_type": "token", //code
                "redirect_uri": "http://localhost:4321" //current location?
            }, function (data) {
        });
        // create a new empty playlist for the user
        // populate it with all the songs
        // TODO: explanation text, all the possible errors
    },
    getSongsForPlaylist: function() {
        var that = this;
        var incomingSongs = [];
        var spotifySearchUrl = "https://api.spotify.com/v1/search";
        var searchKeywords = this.state.text.split(" ");
        searchKeywords.forEach(function (keyword) {
            var request = new XMLHttpRequest();
            var firstMatch;
            request.open('GET', spotifySearchUrl + "?q=" + keyword + "&type=track", true);

            request.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status >= 200 && this.status < 400) {
                        var data = JSON.parse(this.responseText);
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
                            if (firstMatch) {
                                incomingSongs.push({
                                    id: firstMatch.id,
                                    title: firstMatch.name,
                                    artist: firstMatch.artists[0].name
                                });
                            } else {
                                incomingSongs.push({
                                    title: keyword,
                                    nomatch: true
                                });
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
            <Song title={song.title} artist={song.artist} key={song.id} nomatch={song.nomatch}/>
        );
    },
    handleChange: function(event) {
        this.setState({ text: event.target.value });
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
                            onClick={this.createPlaylist}
                            disabled={this.state.songs.length === 0}>Create playlist</button>
                </div>
            </div>
        );
    }
});