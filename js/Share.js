var Share = React.createClass({
	getInitialState: function() {
        return {
			supportsCopy:  !!document.queryCommandSupported('copy') // TODO: Won't work without user-initiation
        };
    },
	render: function() {
	var clipboardButton = this.state.supportsCopy ?
		<button className="btn btn-default" type="button">Copy URL to clipboard</button> :
		<button className="btn btn-default" type="button">Select URL</button>;
		return (
			<div className="well clearfix">
				<h3>Great, your playlist has been created</h3>
				<div className="btn-group" role="group" aria-label="Actions for the playlist message">
					<button type="button" className="btn btn-success">Share via Whatsapp</button>
					<button type="button" className="btn btn-success">Tweet</button>
					<button type="button" className="btn btn-success">Email</button>
					<button type="button" className="btn btn-success">Share on Facebook</button>
				</div>
				<div className="input-group" style={{marginTop: "5px"}} >
                    <input type="text" className="form-control" readOnly defaultValue={this.props.url}/>
                    <span className="input-group-btn">
						{clipboardButton}
						<button type="button" className="btn btn-primary">View on Spotify</button>
                    </span>
                </div>
			</div>
		);
    }

});