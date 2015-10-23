var Song = React.createClass({
    render: function() {
        if (this.props.status === "pending") {
            return (
                <li className="list-group-item list-group-item-info">
                    We are looking for potential matches for &quot;{this.props.title}&quot;.
                </li>
            );
        }
        if (this.props.status === "unmatched") {
            return (
                <li className="list-group-item list-group-item-warning">
                    We could not find any matches for &quot;{this.props.title}&quot;.
                </li>
            );
        } else {
            return (
                <li className="list-group-item list-group-item-success">
                    <strong>{this.props.title}</strong> <small>by {this.props.artist}</small>
                </li>
            );
        }
    }

});