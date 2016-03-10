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
            return (
                <li className="list-group-item list-group-item-success">
                    <strong>{this.props.title}</strong> <small>by {this.props.artist}</small>
                </li>
            );
        }
    }
}