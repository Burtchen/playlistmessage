var Message = React.createClass({
    getInitialState: function() {
        return {
            text: "",
            playlistTitle: "A playlist message",
			playlistUrl: "",
			searchTerms: [],
            songs: [],
			supportsCopy: null
        };
    },
    addSongsToPlaylist: function (playlistId, accessToken) {
        var request = new XMLHttpRequest();
        var userId = this.state.userId;
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
        var userId = this.state.userId;
        var data = {
            name: this.state.playlistTitle
        };
        request.open('POST', 'https://api.spotify.com/v1/users/' + userId + '/playlists', true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader("Authorization", "Bearer " + accessToken);
        request.send(JSON.stringify(data));
        request.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status >= 200 && this.status < 400) {
                    var responseObject = JSON.parse(this.responseText);
					that.setState({
						playlistUrl: responseObject.external_urls.spotify
					});
					//TODO: Optimistic updating implementation
                    that.addSongsToPlaylist(responseObject.id, accessToken);
                } else {
                    console.log('There was an error creating the playlist.');
                }
            }
        };
    },
	splitInputTerm: function () {
		var searchKeywordGroups = this.state.text.split("("); //TODO: Check the number of parentheses
		var searchKeywords = [];
		searchKeywordGroups.forEach(function (group) {
			if (group.indexOf(")") === -1) {
				group.trim().split(" ").forEach(function (word) {
					word = word.trim().replace(/\W/g, '');
					if (word.length) {
						searchKeywords.push(word);
					}
				});
			} else {
				var searchKeywordSplit = group.split(")");
				searchKeywords.push(searchKeywordSplit[0].trim());
				searchKeywordSplit[1].trim().split(" ").forEach(function (word) {
					word = word.trim().replace(/\W/g, '');
					if (word.length) {
						searchKeywords.push(word);
					}
				});
			}
		});
		this.setState({searchTerms: searchKeywords});
	},
    getSongsForPlaylist: function() {
        // we're using the first user-initiated event to query for copy support
		if (this.state.supportsCopy === null) {
			this.setState({
				supportsCopy: !!document.queryCommandSupported('copy')
			});
		}
		var that = this;
        var incomingSongs = [];
        var spotifySearchUrl = "https://api.spotify.com/v1/search";
		this.state.searchTerms.forEach(function (keyword) {
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
                                songObject.uri = firstMatch.uri;
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
	checkForShortcut: function (event) {
		if ((event.keyCode == 10 || event.keyCode == 13) && event.ctrlKey) {
			React.findDOMNode(this.refs.keywordsearch).blur();
			this.getSongsForPlaylist();
		}
	},
    handleMessageTextChange: function(event) {
		this.setState({ text: event.target.value });
		this.splitInputTerm();
    },
    handlePlaylistNameChange: function(event) {
        this.setState({ playlistTitle: event.target.value });
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
                that.getUserData(hash.access_token);
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
        var that = this;
        request.open('GET', 'https://api.spotify.com/v1/me', true);
        request.setRequestHeader("Authorization", "Bearer " + accessToken);
        request.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    var resp = this.responseText;
                    that.setState({userId: JSON.parse(resp).id});
                    that.createPlaylist(accessToken);
                } else {
                    console.log("yikes, an error getting the user data");
                    // TODO: Specify user permission error
                    that.setState({generalError: true});
                }
            }
        };

        request.send();
        request = null;
    },
    render: function() {
		// TODO: Panel that hints at delimiters and keyboard shortcut
        var wordCount = this.state.searchTerms.length;
		if (wordCount > 0) {
			if (wordCount > 1) {
				wordCount = wordCount + " search terms";
			} else {
				wordCount = wordCount + " search term";
			}
		} else {
			wordCount = null;
		}
			
		var share = this.state.playlistUrl && !this.state.generalError ? <Share url={this.state.playlistUrl} supportsCopy={this.state.supportsCopy} /> : null;

        //TODO: Specific errors
        var errorPanel = this.state.generalError ? (
            <div className="alert alert-danger">We're terribly sorry, but there seems to be a problem with the Spotify API. Please check back again later.</div>
            ) :
            null;
        var userActions = this.state.generalError ? null : (
            <div className="input-group">
                <input type="text" className="form-control" placeholder="Enter a playlist name" readOnly={this.state.songs.length === 0} onChange={this.handlePlaylistNameChange} />
                        <span className="input-group-btn">
                            <button className="btn btn-primary" type="button" onClick={this.getSpotifyApi} disabled={this.state.songs.length === 0}>Create playlist</button>
                        </span>
            </div>
            );
        return (
            <div>
                <div className="well clearfix">
                    <textarea placeholder="Type your spotify message here (maximum 15 words)." className="form-control"
                              ref="keywordsearch"
                              onChange={this.handleMessageTextChange} onKeyDown={this.checkForShortcut}>
                    </textarea>
                    <br/>
                    <span>{wordCount}</span>
                    <button className="btn btn-primary pull-right"
                            onClick={this.getSongsForPlaylist}
                            disabled={this.state.text.length === 0}>Get songs for playlist</button>
                </div>
                <div className="well clearfix">
                    <ul id="react-suggested-songs" className="clearfix list-group">
                        {this.state.songs.map(this.eachSong)}
                    </ul>
                    {errorPanel}
                    {userActions}
                </div>
                {share}
            </div>
        );
    }
});