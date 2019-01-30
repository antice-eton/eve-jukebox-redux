# EVE Jukebox Redux v1.0.0-beta

EJR is a tool that can control an external music player based on where you are in New Eden. To use the tool, visit https://eve-jukebox-redux.tk/

This software is currently in beta. This means it is mostly feature complete and the focus is on polishing and bug fixing.

EJR is written and maintained by Antice Eton.

## Supported Music Players

1. Foobar2000 ( requires the [Beefweb Remote Control](http://www.foobar2000.org/components/view/foo_beefweb) plugin )
2. Spotify
3. MusicBee ( requires the [MusicBee Remote Control](https://getmusicbee.com/addons/plugins/75/musicbee-remote-plugin/) plugin )

## FAQ

### Can you support my favourite music player?

Possibly. EJR has been written so that adding support for new music players should be fairly simple. The music player of your choice has to be able to be controlled remotely over the internet. Please open an issue to request support for additional music players and I can see what can be done.

### Can I play a different playlist when I'm in battle?

Not at this time. To do that, EJR would need access to your game client log files. Since EJR is at present a webapp this is impossible.

### How can I set a playlist for my Upwell structure?

You can't at this time. EVE's web api has limits on who can get Upwell structure information and it's not entirely clear how it works. This is slated for a future version.

### I want a playlist for my sov space and I want to force everyone to listen to it

Eventually. I do want to add this in a future version.

### Can I build playlists using EVE Jukebox Redux?
### Can I see what my player is playing?
### Can I enable shuffle mode?
### Can I do everything my regular mp3 player does?

EJR is not really built to replace your own music player. It simply tells it what playlist to play. Maybe in the future I can add this kind of functionality but it's low priority.

### Why does this need to be a webapp?

It doesn't. I'd rather have a desktop app too. There are some complications with doing so though due to the way EJR authenticates against different services such as Spotify and EVE. Requires more investigation.

### I want a new feature!
### I found a bug!

Please feel free to open issues here on Github for all feature requests or reports of bugs.
