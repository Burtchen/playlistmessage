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
	tweet: function () {
	// Based on https://github.com/omarish/tweetable/
		var original_start = new Date();
		var lag = 1250;
		var text = "I created a @playlistmessage, check it out: " + this.props.url;

		var deeplink_url = "twitter://post?message=" + encodeURIComponent(text);
		window.location.href = deeplink_url;

		setTimeout(function() {
		  var time_spent_waiting = (new Date() - original_start);
		  if (time_spent_waiting > (2.0 * lag)) {
			// We can assume they have the app, so do nothing.
		  } else {
			// That was too fast so we can assume they don't have the app.
			var intent_url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
			window.location.href = intent_url;
		  }
		}, lag);
	},
	render: function() {
	var clipboardButton = this.props.supportsCopy ?
		<button className="btn btn-secondary" type="button" onClick={this.handleSelectAndCopy}>Copy URL to Clipboard</button> :
		<button className="btn btn-secondary" type="button" onClick={this.handleSelectAndCopy}>Select URL</button>;
	var mailToLink = encodeURIComponent("mailto:?subject=I have a playlist message for you&body=Hi,\n\n I created a playlist message for you. Check it out: " + this.props.url);
		return (
			<div className="well clearfix">
				<div className="sm_container">
					<div className="sm_section">
						<h2>Great, your playlist has been created</h2>
						<div className="btn-group" role="group" aria-label="Actions for the playlist message">
							<div className="input-group-btn">
								<button type="button" className="btn btn-secondary btn-success" href={mailToLink}>Email</button>
								<button type="button" className="btn btn-secondary btn-success">Share via Whatsapp</button>
							</div>
							<div className="input-group-btn">
								<button type="button" className="btn btn-secondary btn-success" onClick={this.tweet}>Tweet</button>
								<button type="button" className="btn btn-secondary btn-success">Share on Facebook</button>
							</div>
						</div>
						<div className="input-group">
							<label>URL to your new spotify playlist</label>
							<input type="text" className="form-control" readOnly defaultValue={this.props.url} ref="urlcontainer"/>
		          <span className="input-group-btn">
								{clipboardButton}
								<button className="btn btn-secondary" href={this.props.url}>View on Spotify</button>
		          </span>
		        </div>
					</div>
				</div>

			</div>
		);
    }

});
