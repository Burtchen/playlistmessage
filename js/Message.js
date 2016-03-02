var React = require('react');
var ReactDOM = require('react-dom');
var maxBy = require('lodash/maxBy');
var map = require('lodash/map');
var find = require('lodash/find');
var filter = require('lodash/filter');
var isEmpty = require('lodash/isEmpty');
var isUndefined = require('lodash/isUndefined');
var some = require('lodash/some');

import {Markets} from './Markets'
import {Share} from './Share'
import {Song} from './Song'

export class Message extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            accessToken: null,
            text: '',
            playlistTitle: 'A playlist message',
            playlistUrl: '',
            marketValue: 'all',
            searchTerms: [],
            songs: [],
            supportsCopy: null,
        };
    }

    addSongsToPlaylist(playlistId, accessToken) {
        var request = new XMLHttpRequest();
        var userId = this.state.userId;
        var uris = this.state.songs.map(value => value[uri]);
        request.open('POST', 'https://api.s potify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks', true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        request.send(JSON.stringify(uris));
        request.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status >= 200 && this.status < 400) {
                    var responseObject = JSON.parse(this.responseText);
                    console.log('playlist has been filled');
                } else {
                    console.log('yikes, an error adding stuff to the playlist');
                }
            }
        };
    }

    createPlaylist() {
        var that = this;
        var request = new XMLHttpRequest();
        var userId = this.state.userId;
        var data = {
            name: this.state.playlistTitle,
        };
        request.open('POST', 'https://api.spotify.com/v1/users/' + userId + '/playlists', true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('Authorization', 'Bearer ' + that.state.accessToken);
        request.send(JSON.stringify(data));
        request.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status >= 200 && this.status < 400) {
                    var responseObject = JSON.parse(this.responseText);
                    that.setState({
                        playlistUrl: responseObject.external_urls.spotify,
                    });

                    //TODO: Optimistic updating implementation
                    that.addSongsToPlaylist(responseObject.id, that.state.accessToken);
                } else {
                    console.log('There was an error creating the playlist.');
                }
            }
        };
    }

    splitInputTerm() {
        var searchKeywordGroups = this.state.text.split('('); //TODO: Check the number of parentheses
        var searchKeywords = [];
        searchKeywordGroups.forEach(function (group) {
            if (group.indexOf(')') === -1) {
                group.trim().split(' ').forEach(function (word) {
                    word = word.trim().replace(/\W/g, '');
                    if (word.length) {
                        searchKeywords.push(word);
                    }
                });
            } else {
                var searchKeywordSplit = group.split(')');
                searchKeywords.push(searchKeywordSplit[0].trim());
                searchKeywordSplit[1].trim().split(' ').forEach(function (word) {
                    word = word.trim().replace(/\W/g, '');
                    if (word.length) {
                        searchKeywords.push(word);
                    }
                });
            }
        });

        this.setState({searchTerms: searchKeywords}, this.getSongsForPlaylist);
    }

    getSongsForPlaylist() {
        // we're using the first user-initiated event to query for copy support
        if (this.state.supportsCopy === null) {
            this.setState({
                supportsCopy: !!document.queryCommandSupported('copy'),
            });
        }

        var that = this;
        var incomingSongs = [];
        var spotifySearchUrl = 'https://api.spotify.com/v1/search';
        this.state.searchTerms.forEach(function (keyword) {
            var request = new XMLHttpRequest();
            incomingSongs.push({
                title: keyword,
                status: 'pending',
            });
            var allMatches;
            var firstMatch;
            that.setState({songs: incomingSongs});
            request.open('GET', spotifySearchUrl + '?q=' + keyword + '&type=track', true);
            request.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status >= 200 && this.status < 400) {
                        let data = JSON.parse(this.responseText);
                        let songObject;

                        if (data.tracks && data.tracks.items) {
                            allMatches = filter(data.tracks.items, function (item) {
                                return !isEmpty(item.uri) && item.name.toLowerCase() === keyword.toLowerCase() &&
                                    (that.state.marketValue === 'all' || some(item.available_markets, that.state.marketValue));
                            });

                            if (!isEmpty(allMatches)) {
                                firstMatch = maxBy(allMatches, function (item) {
                                    return isUndefined(item.popularity) ? 0 : item.popularity;
                                });
                            }

                            songObject = find(incomingSongs, {title: keyword});
                            if (firstMatch) {
                                songObject.status = 'match';
                                songObject.id = firstMatch.id;
                                songObject.uri = firstMatch.uri;
                                songObject.title = firstMatch.name;
                                songObject.artist = firstMatch.artists[0].name;
                            } else {
                                songObject.status = 'unmatched';
                            }
                        }

                        that.setState({songs: incomingSongs});
                    } else {
                        that.setState({generalError: true});
                    }
                }
            };
        });
    }

    addSongsToPlaylist(playlistId, accessToken) {
        var request = new XMLHttpRequest();
        var userId = this.state.userId;
        var uris = map(this.state.songs, "uri");
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
    }

    createPlaylist() {
        var that = this;
        var request = new XMLHttpRequest();
        var userId = this.state.userId;
        var data = {
            name: this.state.playlistTitle
        };
        request.open('POST', 'https://api.spotify.com/v1/users/' + userId + '/playlists', true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader("Authorization", "Bearer " + that.state.accessToken);
        request.send(JSON.stringify(data));
        request.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status >= 200 && this.status < 400) {
                    var responseObject = JSON.parse(this.responseText);
					that.setState({
						playlistUrl: responseObject.external_urls.spotify
					});
					//TODO: Optimistic updating implementation
                    that.addSongsToPlaylist(responseObject.id, that.state.accessToken);
                } else {
                    console.log('There was an error creating the playlist.');
                }
            }
        };
    }

    splitInputTerm() {
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
		this.setState({searchTerms: searchKeywords}, this.getSongsForPlaylist);
    }

    getSongsForPlaylist() {
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
            var allMatches;
			var firstMatch;
            that.setState({songs: incomingSongs});
            request.open('GET', spotifySearchUrl + "?q=" + keyword + "&type=track", true);
            request.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status >= 200 && this.status < 400) {
                        let data = JSON.parse(this.responseText);
                        let songObject;
                        // TODO: Multiple matches
						if (data.tracks && data.tracks.items) {
                            allMatches = filter(data.tracks.items, function (item) {
                                return !isEmpty(item.uri) && item.name.toLowerCase() === keyword.toLowerCase() &&
                                    (that.state.marketValue === "all" || some(item.available_markets, that.state.marketValue));
								});
                            if (!isEmpty(allMatches)) {
                                firstMatch = maxBy(allMatches, function (item) {
                                    return isUndefined(item.popularity) ? 0 : item.popularity;
								});
							}
                            songObject = find(incomingSongs, {title: keyword});
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
    }

    eachSong(song) {
        return (
            <Song title={song.title} artist={song.artist} key={song.id} status={song.status}/>
        );
    }

    checkForShortcut(event) {
        if ((event.keyCode == 10 || event.keyCode == 13) && event.ctrlKey) {
            React.findDOMNode(this.refs.keywordsearch).blur();
            this.splitInputTerm();
        }
    }

    handleMessageTextChange(event) {
        this.setState({text: event.target.value});
    }

    handleMarketSelectorChange(e) {
        this.setState({marketValue: e.target.value});
    }

    handlePlaylistNameChange(event) {
        this.setState({playlistTitle: event.target.value});
    }

    getSpotifyApi() {
        if (this.state.accessToken && this.state.userId) {
            this.createPlaylist();
            return;
        }

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
            'playlist-modify-public',
        ]);

        var width = 450,
            height = 730,
            left = (screen.width / 2) - (width / 2),
            top = (screen.height / 2) - (height / 2);

        var messageCallback = function (event) {
            if (event.data === 'authentification failed') {
                that.setState({authError: true});
            } else {
                var hash = JSON.parse(event.data);
                if (hash.type == 'access_token') {
                    that.setState({
                        accessToken: hash.access_token,
                        authError: false,
                    });
                    that.getUserData();
        }
            }

            window.removeEventListener('message', messageCallback);
        };

        window.addEventListener('message', messageCallback.bind(this), false);

        var w = window.open(url,
            'Spotify',
            'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
        );

    }

    getUserData() {
        var request = new XMLHttpRequest();
        var that = this;
        request.open('GET', 'https://api.spotify.com/v1/me', true);
        request.setRequestHeader('Authorization', 'Bearer ' + that.state.accessToken);
        request.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    var resp = this.responseText;
                    that.setState({userId: JSON.parse(resp).id});
                    that.createPlaylist();
                } else {
                    console.log('yikes, an error getting the user data');
                    that.setState({generalError: true});
                }
            }
        };

        request.send();
        request = null;
    }

    render() {
        // TODO: Panel that hints at delimiters and keyboard shortcut
		var share = this.state.playlistUrl && !this.state.generalError ? <Share url={this.state.playlistUrl} supportsCopy={this.state.supportsCopy} /> : null;
        var marketSelector = <Markets handleChange={this.handleMarketSelectorChange}/>;

        var authErrorPanel = this.state.authError ? (
            <div className="alert alert-danger">Something went wrong with the app authorization, please try again.</div>
        ) :
            null;
        var generalErrorPanel = this.state.generalError ? (
            <div className="alert alert-danger">We're terribly sorry, but there seems to be a problem with the Spotify
                API. Please check back again later.</div>
        ) :
            null;
        var userActions = this.state.generalError ? null : (
            <div className="input-group">
              <input type="text" className="form-control" placeholder="Enter a playlist name" readOnly={this.state.text.length === 0} onChange={this.handlePlaylistNameChange} />
              <button className="btn btn-primary" type="button" onClick={this.getSpotifyApi} disabled={this.state.text.length === 0}>Create playlist</button>
            </div>
        );

        return (
            <div>
              <div className="site_header">
                <div className="sm_section">
                  <h1 className="title">Spotifymessage</h1>
                </div>
              </div>
              <div className="well clearfix content_wrap">
                <div className="sm_section arrow">
                  <textarea placeholder="Type your spotify message here (maximum 15 words)." className="form-control"
                            ref="keywordsearch"
                            onChange={this.handleMessageTextChange} onKeyDown={this.checkForShortcut}>
                  </textarea>
                  <p className="hint">
                    Tell your message in a playlist! Just type what you want to see and we'll find songs matching your
                    words. Use parentheses do search for whole groups of words. Then, save the playlist in your Spotify
                    account and share it!
                  </p>
                  <p className="hint">
                    Example: Heartbreaker (in the end) (nothing compares to you) stay searches for
                    Heartbreaker, "In the end", "nothing compares to you" and stay for a four-song playlist. Give it a try!
                  </p>
                  {marketSelector}
                  <button className="btn btn-primary pull-right"
                          onClick={this.splitInputTerm}
                          disabled={this.state.text.length === 0}>Get songs for playlist
                  </button>
                </div>
              </div>
              <div className="well clearfix">
                <div className="sm_section">
                  <ul id="react-suggested-songs" className="clearfix list-group">
                    {this.state.songs.map(this.eachSong)}
                  </ul>
                  {authErrorPanel}
                  {generalErrorPanel}
                  {userActions}
                </div>
              </div>
                {share}
                <footer className="site_footer">
                  <div className="sm_section">
                    <a href="#"><span>imprint</span></a>
                    <a href="#"><span>twitter</span></a>
                  </div>
                  <div className="sm_section copyright">
                    <span>&copy;Copyright 2016</span>
                  </div>
                </footer>
            </div>
        );
    }
}
