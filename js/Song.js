var React = require('react');
var ReactDOM = require('react-dom');

export class Song extends React.Component {

    render() {
        if (this.props.status === "pending") {
            return (
                <li className="list-group-item list-group-item-info">
                    We are looking for potential matches for &quot;{this.props.title}&quot;.
                </li>
            );
        }
        if (this.props.status === "unmatched") {
            if (this.props.suggestedTitle) {
                return (
                    <li className="list-group-item list-group-item-warning">
                        We could not find any exact song titles matching &quot;{this.props.title}&quot;.<br />
                        Suggestion from the search results: &quot;{this.props.suggestedTitle}&quot;.
                    </li>
                )
            } else {
                return (
                    <li className="list-group-item list-group-item-warning">
                        We could not find any song titles matching &quot;{this.props.title}&quot;.
                    </li>
                );
            }
        } else {
            let artist = this.props.artist;
            if (this.props.alternativeArtists) {
                const alternativeArtists = this.props.alternativeArtists.map((alternativeSong) => {
                    return <option value={alternativeSong.uri}>{alternativeSong.artists[0].name}</option>;
                });
                artist = (
                    <select className="playlist-message-select-artist" onChange={this.props.changeArtist.bind(this, this.props.reactKey)}>
                        <option value={this.props.uri}>{this.props.artist}</option>
                        {alternativeArtists}
                    </select>);
            }
            return (
                <li className="list-group-item list-group-item-success">
                    <strong>{this.props.title}</strong> <small>by {artist}</small>
                </li>
            );
        }
    }
}