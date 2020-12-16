# PlaylistMessage
PlaylistMessage allows you to send short messages in the form of Spotify playlists.

Give it a try: [Playlistmessage.com](https://playlistmessage.com).

Idea and Programming: Christian Burtchen (@burtchen). Original Design: Katharina Mehner.

Licensed under MIT.

## How this works
Start by typing your message and use normal parentheses `()` a delimiters. If you do not use any delimiters, playlistmessage will use every single word as a search string, so for specific phrases such as "in the end" or "let it be", those are required.

When you are happy with the selection, you can create a message on your spotify account. You can share finished playlists through social media. The app does not preload any smart social widgets that might track you, the buttons are just links. But obviously, once you click on any icon and go the site, their terms and conditions apply. Again, there is no tracking here, and you can obviously remove the playlistmessage mention from Twitter as well if you wish.

Have fun and enjoy writing playlist messages!

## Frequently asked questions

**Why do I need to authorize Spotify to just search for songs?**

Yeah, I know that's annoying - Spotify changed the API requirements in 2016 so that even the search calls require authorization. Nothing I can do about that, other than tell you there is nothing I can and would do with the authorization.

**What information or access rights to you receive, and what do you do with them?**
Notice there was no cookie banner to tap on? That's because there are no cookies, playlistmessage does not store anything locally or remotely about you. All that happens is that the web application gets the rights to write playlists when you tell it to. Additionally, the web application receives basic user information such as the country code and user id - needed for creating the playlist. **Your email is never shared with PlaylistMessage.** Also, no information besides the user id is ever used in the application.

**Some of the songs on the playlist are greyed out and can't be played, what's up with that?**

Spotify does not have the rights to all songs in all its markets. Whether a particular song can be played depends on the market of the user that views the playlist. So it might be that you, based in the US, create a playlist message for someone in Brazil and they can't play it - **but they will still be able to read the songs titles and thus the message**. I used to have a "restrict by market" feature, but because it's a bit complicated given the markets for senders and recipients involved, I've deactivated it. Give me a shout and I'll bring it back.

**I am done with my playlist message, can I un-authorize your application?**

Sure! Revoking access will not delete any playlists, so you keep all your generated messages! You can obviously delete them too if you want. 

**I have another question that's not on here.**

Shout it to me on twitter.

**I prefer dark chocolate over the lighter kinds. Am I wrong?**

Yes.

**What is the best hour of television out there?**

The West Wing Season 1, Celestial Navigation.