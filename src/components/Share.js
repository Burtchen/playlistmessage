var React = require("react");

export class Share extends React.Component {
  constructor(props) {
    super(props);

    this.urlContainer = React.createRef();
    this.shareContainer = React.createRef();

    this.state = {
      copyError: null,
    };
  }

  componentDidMount() {
    this.shareContainer.current.scrollIntoView();
  }

  handleSelectAndCopy() {
    this.urlContainer.current.select();
    if (this.props.supportsCopy) {
      try {
        document.execCommand("copy");
        this.urlContainer.current.blur();
        this.setState({ copyError: false });
      } catch (error) {
        this.setState({ copyError: true });
      }
    }
  }

  get twitterButton() {
    const text = `I created a @playlistmessage, check it out: ${this.props.url}`;

    return (
      <a
        className="btn btn-secondary btn-success"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`}
      >
        <i className="fa fa-twitter social_icons" />
        <span className="hide-on-mobile">Tweet</span>
      </a>
    );
  }

  get whatsAppButton() {
    const text =
      "I created a playlistmessage for you. Check it out: " + this.props.url;

    return (
      <a
        className="btn btn-secondary btn-success"
        target="_blank"
        rel="noopener noreferrer"
        href={"whatsapp://send?text=" + encodeURIComponent(text)}
      >
        <i className="fa fa-whatsapp social_icons" />
        <span className="hide-on-mobile">Share via Whatsapp</span>
      </a>
    );
  }

  get facebookButton() {
    return (
      <a
        className="btn btn-secondary btn-success"
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.facebook.com/sharer/sharer.php?u=${this.props.url}`}
      >
        <i className="fa fa-facebook social_icons" />
        <span className="hide-on-mobile">Share on Facebook</span>
      </a>
    );
  }

  render() {
    const clipboardButton = (
      <button
        className="btn btn-secondary"
        type="button"
        onClick={() => this.handleSelectAndCopy()}
      >
        {this.props.supportsCopy ? (
          "Copy URL to Clipboard"
        ) : (
          <>
            <i className="fa fa-link social_icons" />
            <span className="hide-on-mobile">Select URL</span>
          </>
        )}
      </button>
    );
    const errorPanel = this.state.copyError ? (
      <div className="alert">
        Sorry, copying to the clipboard did not work, select the URL and copy
        manually!
      </div>
    ) : null;
    const mailToLink =
      "mailto:?subject=" +
      encodeURIComponent("I have a playlist message for you") +
      "&body=" +
      encodeURIComponent(
        "Hi,\n\n I created a playlist message for you. Check it out: " +
          this.props.url
      );
    return (
      <div className="well clearfix" ref={this.shareContainer}>
        <div className="sm_section">
          <h2>Great, your playlist has been created!</h2>
          {!this.props.isPrivate && (
            <div
              className="btn-group"
              role="group"
              aria-label="Actions for the playlist message"
            >
              <div className="input-group-btn">
                <a
                  type="button"
                  className="btn btn-secondary btn-success"
                  href={mailToLink}
                >
                  <i className="fa fa-envelope social_icons" />
                  <span className="hide-on-mobile">Email</span>
                </a>
                {this.whatsAppButton}
              </div>
              <div className="input-group-btn">
                {this.twitterButton}
                {this.facebookButton}
              </div>
            </div>
          )}
          <div className="input-group">
            <label>URL to your new Spotify playlist:</label>
            <input
              type="text"
              className="form-control"
              readOnly
              defaultValue={this.props.url}
              ref={this.urlContainer}
            />
            <span className="input-group-btn">
              {clipboardButton}
              <a
                className="btn btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
                href={this.props.url}
              >
                <i className="fa fa-spotify social_icons" />
                <span className="hide-on-mobile">View on Spotify</span>
              </a>
            </span>
          </div>
          {errorPanel}
        </div>
      </div>
    );
  }
}
