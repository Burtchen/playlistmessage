var React = require('react');
var ReactDOM = require('react-dom');
var maxBy = require('lodash/maxBy');
var map = require('lodash/map');
var find = require('lodash/find');
var filter = require('lodash/filter');
var isEmpty = require('lodash/isEmpty');
var isUndefined = require('lodash/isUndefined');
var some = require('lodash/some');
var sample = require('lodash/sample');

import {Markets} from './Markets'
import {Share} from './Share'
import {Song} from './Song'

export class Message extends React.Component {

    constructor(props) {
        super(props);

        this.setGeneralError = this.setGeneralError.bind(this);
        this.splitInputTerm = this.splitInputTerm.bind(this);
        this.getSpotifyApi = this.getSpotifyApi.bind(this);
        this.checkForShortcut = this.checkForShortcut.bind(this);
        this.handleMessageTextChange = this.handleMessageTextChange.bind(this);
        this.handleMarketSelectorChange = this.handleMarketSelectorChange.bind(this);
        this.handlePlaylistNameChange = this.handlePlaylistNameChange.bind(this);
        this.createPlaylist = this.createPlaylist.bind(this);
        this.getSongsForPlaylist = this.getSongsForPlaylist.bind(this);

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

    setGeneralError() {
        this.setState({generalError: true});
    }

    addSongsToPlaylist(playlistId, accessToken) {
        const request = new XMLHttpRequest();
        const userId = this.state.userId;
        const that = this;
        const uris = that.state.songs.map(value => value['uri']);
        request.open('POST', 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId + '/tracks', true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        request.send(JSON.stringify(uris));
        request.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status >= 200 && this.status < 400) {
                    var responseObject = JSON.parse(this.responseText);
                } else {
                    that.setGeneralError();
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
        request.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status >= 200 && this.status < 400) {
                    var responseObject = JSON.parse(this.responseText);
                    that.setState({
                        playlistUrl: responseObject.external_urls.spotify
                    });
                    that.addSongsToPlaylist(responseObject.id, that.state.accessToken);
                } else {
                    that.setGeneralError();
                }
            }
        };
    }

    splitInputTerm() {
        this.setState({playlistUrl: ''}); // clear playlist on new submission
        const searchKeywordGroups = this.state.text.split("("); //TODO: Check the number of parentheses
        let searchKeywords = [];
        searchKeywordGroups.forEach(function (group) {
            if (group.indexOf(")") === -1) {
                group.trim().split(" ").forEach(function (word) {
                    word = word.trim().replace(/\W/g, '');
                    if (word.length) {
                        searchKeywords.push(word);
                    }
                });
            } else {
                let searchKeywordSplit = group.split(")");
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
            let request = new XMLHttpRequest();
            incomingSongs.push({
                title: keyword,
                status: "pending"
            });
            that.setState({songs: incomingSongs});
            request.open('GET', spotifySearchUrl + "?q=" + keyword + "&type=track", true);
            request.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status >= 200 && this.status < 400) {
                        let data = JSON.parse(this.responseText);
                        let songObject = {};
                        // TODO: Multiple matches
                        if (data.tracks && data.tracks.items) {
                            let allExactMatches = filter(data.tracks.items, function (item) {
                                return !isEmpty(item.uri) && item.name.toLowerCase() === keyword.toLowerCase() &&
                                    (that.state.marketValue === "all" || some(item.available_markets, that.state.marketValue));
                            });
                            let firstMatch, songsFromDifferentArtists;
                            if (!isEmpty(allExactMatches)) {
                                if (allExactMatches.length > 1) {
                                    firstMatch = maxBy(allExactMatches, function (item) {
                                        return isUndefined(item.popularity) ? 0 : item.popularity;
                                    });
                                    songsFromDifferentArtists = allExactMatches.filter(function (match) {
                                        return match.id !== firstMatch.id;
                                    });
                                    songsFromDifferentArtists.forEach(function(song) {
                                        //console.log(song.artists[0].name);
                                    });
                                } else {
                                    firstMatch = allExactMatches[0];
                                }
                            }
                            songObject = find(incomingSongs, {title: keyword});
                            if (firstMatch) {
                                songObject.status = "match";
                                songObject.id = firstMatch.id;
                                songObject.uri = firstMatch.uri;
                                songObject.title = firstMatch.name;
                                songObject.artist = firstMatch.artists[0].name;
                            } else {
                                // if we do not have a single match, suggest a random search result
                                songObject.status = "unmatched";
                                const possibleSuggestions = filter(data.tracks.items, (item) => {
                                    const containsTitle = item.name.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
                                    const hasNoHyphenOrParenthesis = item.name.toLowerCase().indexOf('-') === -1 && item.name.toLowerCase().indexOf('(') === -1;
                                    return containsTitle && hasNoHyphenOrParenthesis;
                                });
                                if (possibleSuggestions.length) {
                                    songObject.suggestedTitle = sample(possibleSuggestions)['name'];
                                }

                            }
                        } else {
                            songObject.status = "unmatched";
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

    eachSong(song, index) {
        const key = song.id ? song.id + index : index;
        return (
            <Song {...song} key={key}/>
        );
    }

    checkForShortcut(event) {
        if (event.keyCode == 13 && (event.ctrlKey || event.metaKey)) {
            ReactDOM.findDOMNode(this.refs.keywordsearch).blur();
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
        var REDIRECT_URI = 'https://playlistmessage.com/proxy/';

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
        let request = new XMLHttpRequest();
        const that = this;
        request.open('GET', 'https://api.spotify.com/v1/me', true);
        request.setRequestHeader('Authorization', 'Bearer ' + that.state.accessToken);
        request.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    const resp = this.responseText;
                    that.setState({userId: JSON.parse(resp).id});
                    that.createPlaylist();
                } else {
                    that.setGeneralError();
                }
            }
        };

        request.send();
        request = null;
    }

    render() {
        var share = this.state.playlistUrl && !this.state.generalError ?
            <Share url={this.state.playlistUrl} supportsCopy={this.state.supportsCopy}/> : null;
        var marketSelector = <Markets handleChange={this.handleMarketSelectorChange}/>;

        var authErrorPanel = this.state.authError ? (
            <div className="alert">Something went wrong with the app authorization, please try again.</div>
        ) :
            null;
        var generalErrorPanel = this.state.generalError ? (
            <div className="alert">We're terribly sorry, but there seems to be a problem with the Spotify
                API. Please check back again later.</div>
        ) :
            null;
        const hasUnmatchedSongs = some(this.state.songs, {'status': 'unmatched'});
        const hasPendingSongs = some(this.state.songs, {'status': 'pending'});
        const submissionDisabled = hasUnmatchedSongs || hasPendingSongs || this.state.text.length === 0;
        var userActions = this.state.generalError ? null : (
            <div className="input-group">
                <input type="text" className="form-control" placeholder="Enter a playlist name"
                       readOnly={submissionDisabled} onChange={this.handlePlaylistNameChange}/>
                <button className="btn btn-primary" type="button" onClick={this.getSpotifyApi}
                        disabled={submissionDisabled}>Create playlist
                </button>
            </div>
        );

        return (
            <div>
                <div className="well clearfix content_wrap">
                    <div className="sm_section arrow">
                        <p className="hint">
                            Tell your message in a playlist! Just type and we'll find songs matching your
                            input. Then, save the playlist in your Spotify account and share it!
                        </p>
                    <textarea placeholder="Type your playlist message here" className="form-control"
                              ref="keywordsearch"
                              onChange={this.handleMessageTextChange} onKeyDown={this.checkForShortcut}>
                  </textarea>
                        <p className="hint">
                            Use parentheses to search for groups of words. Example: Heartbreaker (nothing compares to
                            you) stay searches for
                            "Heartbreaker", "nothing compares to you" and "stay" for a three-song playlist message.
                        </p>
                        {marketSelector}
                        <p className="hint">Restricting a market just affects whether songs can be played,
                            not whether they can be added to a playlist message.</p>
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
            </div>
        );
    }
}
