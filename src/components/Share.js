import React, { useRef, useEffect, useState } from "react";

export function Share({ url, isPrivate, providerName, providerIcon }) {
  const shareContainer = useRef(null);
  const urlInput = useRef(null);
  const [copyError, setCopyError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    shareContainer.current?.scrollIntoView();
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyError(false);
      setCopied(true);
    } catch {
      // Clipboard API unavailable or user denied permission —
      // fall back to selecting the URL so they can press Cmd/Ctrl+C.
      setCopyError(true);
      setCopied(false);
      urlInput.current?.focus();
      urlInput.current?.select();
    }
  }

  const shareText = "I created a playlistmessage for you. Check it out: " + url;
  const whatsAppText = encodeURIComponent(shareText);
  const blueskyLink =
    "https://bsky.app/intent/compose?text=" + encodeURIComponent(shareText);
  const threadsLink =
    "https://www.threads.net/intent/post?text=" + encodeURIComponent(shareText);
  // Mastodon has no single share endpoint (federated) — toot.kytta.dev is a
  // well-known instance picker that forwards the toot to the user's server.
  const mastodonLink =
    "https://toot.kytta.dev/?text=" + encodeURIComponent(shareText);
  const mailToLink =
    "mailto:?subject=" +
    encodeURIComponent("I have a playlist message for you") +
    "&body=" +
    encodeURIComponent(
      "Hi,\n\n I created a playlist message for you. Check it out: " + url,
    );

  return (
    <div className="well clearfix" ref={shareContainer}>
      <div className="sm_section">
        <h2>Great, your playlist has been created!</h2>
        {!isPrivate && (
          <div
            className="share-grid"
            role="group"
            aria-label="Actions for the playlist message"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <a
              type="button"
              className="btn btn-secondary btn-success"
              href={mailToLink}
            >
              <i className="fa fa-envelope social_icons" />
              <span className="hide-on-mobile">Email</span>
            </a>
            <a
              className="btn btn-secondary btn-success"
              target="_blank"
              rel="noopener noreferrer"
              href={"whatsapp://send?text=" + whatsAppText}
            >
              <i className="fa fa-whatsapp social_icons" />
              <span className="hide-on-mobile">WhatsApp</span>
            </a>
            <a
              className="btn btn-secondary btn-success"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}
            >
              <i className="fa fa-facebook social_icons" />
              <span className="hide-on-mobile">Facebook</span>
            </a>
            <a
              className="btn btn-secondary btn-success"
              target="_blank"
              rel="noopener noreferrer"
              href={blueskyLink}
            >
              <i className="fa fa-cloud social_icons" />
              <span className="hide-on-mobile">Bluesky</span>
            </a>
            <a
              className="btn btn-secondary btn-success"
              target="_blank"
              rel="noopener noreferrer"
              href={threadsLink}
            >
              <i className="fa fa-at social_icons" />
              <span className="hide-on-mobile">Threads</span>
            </a>
            <a
              className="btn btn-secondary btn-success"
              target="_blank"
              rel="noopener noreferrer"
              href={mastodonLink}
            >
              <i className="fa fa-paper-plane social_icons" />
              <span className="hide-on-mobile">Mastodon</span>
            </a>
          </div>
        )}
        <div className="input-group">
          <label>URL to your new playlist:</label>
          <input
            type="text"
            className="form-control"
            readOnly
            value={url}
            ref={urlInput}
          />
          <span className="input-group-btn">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy URL to Clipboard"}
            </button>
            <a
              className="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              href={url}
            >
              <i className={`fa ${providerIcon ?? "fa-music"} social_icons`} />
              <span className="hide-on-mobile">View on {providerName}</span>
            </a>
          </span>
        </div>
        {copyError && (
          <div className="alert">
            We couldn't copy for you — the URL is selected above, press
            Cmd/Ctrl+C to copy it manually.
          </div>
        )}
      </div>
    </div>
  );
}
