var Song = React.createClass({
    render: function() {
        return (
            <li className="list-group-item">
                {this.props.title}, {this.props.artist}
            </li>
        );
    }

});