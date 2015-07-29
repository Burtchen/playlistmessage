var Song = React.createClass({
    render: function() {
        if (this.props.nomatch) {
            return (
                <li className="list-group-item list-group-item-warning">
                    We could not find any matches for {this.props.title}.
                </li>
            );
        } else {
            return (
                <li className="list-group-item">
                    {this.props.title}, {this.props.artist}
                </li>
            );
        }
    }

});