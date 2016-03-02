var React = require('react');
var ReactDOM = require('react-dom');

export class Share extends React.Component {
	handleSelectAndCopy() {
		var urlContainer = React.findDOMNode(this.refs.urlcontainer);
		urlContainer.focus();
		urlContainer.select();
		if (this.props.supportsCopy) {
			try {
				document.execCommand('copy');
				urlContainer.blur();
			} catch (error) {
				console.log('there was a problem with the clipboard operation.');
			}
		}
	}

	tweet() {

		// Based on https://github.com/omarish/tweetable/
		var originalStart = new Date();
		var lag = 1250;
		var text = 'I created a @playlistmessage, check it out: ' + this.props.url;

		var deeplinkUrl = 'twitter://post?message=' + encodeURIComponent(text);
		window.location.href = deeplinkUrl;

		setTimeout(function () {
			var timeSpentWaiting = ( new Date() - originalStart );
			if (!timeSpentWaiting > ( 2.0 * lag )) {

				// That was too fast so we can assume they don't have the app.
				let intentUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text);
				window.location.href = intentUrl;
			}
		}, lag);
	}

	render() {
	var clipboardButton = this.props.supportsCopy ?
		<button className="btn btn-secondary" type="button" onClick={this.handleSelectAndCopy}>Copy URL to Clipboard</button> :
		<button className="btn btn-secondary" type="button" onClick={this.handleSelectAndCopy}>
			<i className="fa fa-link social_icons"></i>
			<span className="hide-on-mobile">Select URL</span>
		</button>;
	var mailToLink = encodeURIComponent("mailto:?subject=I have a playlist message for you&body=Hi,\n\n I created a playlist message for you. Check it out: " + this.props.url);
		return (
			<div className="well clearfix">
				<div className="sm_section">
					<h2>Great, your playlist has been created</h2>
					<div className="btn-group" role="group" aria-label="Actions for the playlist message">
						<div className="input-group-btn">
							<button type="button" className="btn btn-secondary btn-success" href={mailToLink}>
								<i className="fa fa-envelope social_icons"></i>
								<span className="hide-on-mobile">Email</span>
							</button>
							<button type="button" className="btn btn-secondary btn-success">
								<i className="fa fa-whatsapp social_icons"></i>
								<span className="hide-on-mobile">Share via Whatsapp</span>
							</button>
						</div>
						<div className="input-group-btn">
							<button type="button" className="btn btn-secondary btn-success" onClick={this.tweet}>
								<i className="fa fa-twitter social_icons"></i>
								<span className="hide-on-mobile">Tweet</span>
							</button>
							<button type="button" className="btn btn-secondary btn-success">
								<i className="fa fa-facebook social_icons"></i>
								<span className="hide-on-mobile">Share on Facebook</span>
							</button>
						</div>
					</div>
					<div className="input-group">
						<label>URL to your new spotify playlist</label>
						<input type="text" className="form-control" readOnly defaultValue={this.props.url} ref="urlcontainer"/>
	          <span className="input-group-btn">
							{clipboardButton}
							<button className="btn btn-secondary" href={this.props.url}>
								<i className="fa fa-spotify social_icons"></i>
								<span className="hide-on-mobile">View on Spotify</span>
							</button>
	          </span>
	        </div>
				</div>

			</div>
		);
    }
}
