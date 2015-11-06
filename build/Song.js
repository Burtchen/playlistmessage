var Song = React.createClass({displayName: "Song",
    render: function() {
        if (this.props.status === "pending") {
            return (
                React.createElement("li", {className: "list-group-item list-group-item-info"}, 
                    "We are looking for potential matches for \"", this.props.title, "\"."
                )
            );
        }
        if (this.props.status === "unmatched") {
            return (
                React.createElement("li", {className: "list-group-item list-group-item-warning"}, 
                    "We could not find any matches for \"", this.props.title, "\"."
                )
            );
        } else {
            return (
                React.createElement("li", {className: "list-group-item list-group-item-success"}, 
                    React.createElement("strong", null, this.props.title), " ", React.createElement("small", null, "by ", this.props.artist)
                )
            );
        }
    }

});