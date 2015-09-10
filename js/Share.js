var Share = React.createClass({
	handleSelectAndCopy: function() {
		var urlContainer = React.findDOMNode(this.refs.urlcontainer);
		urlContainer.focus();
		urlContainer.select();
		if (this.props.supportsCopy) {
			try  {
				document.execCommand('copy');
				urlContainer.blur();
			} catch(error) {
				console.log('there was a problem with the clipboard operation');
			}
		}
	},
	render: function() {
	var clipboardButton = this.props.supportsCopy ?
		<button className="btn btn-default" type="button" onClick={this.handleSelectAndCopy}>Copy URL to clipboard</button> :
		<button className="btn btn-default" type="button" onClick={this.handleSelectAndCopy}>Select URL</button>;
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
                    <input type="text" className="form-control" readOnly defaultValue={this.props.url} ref="urlcontainer"/>
                    <span className="input-group-btn">
						{clipboardButton}
						<a className="btn btn-primary" href={this.props.url}>View on Spotify</a>
                    </span>
                </div>
			</div>
		);
    }

});