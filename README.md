# EVE Jukebox Redux

EVE Jukebox Redux is a tool that allows you to play music from different music sources, based on various in game criteria.

This software is in ALPHA. Use at your own risk.

## Supported Music Players

1. Foobar2000
2. Spotify

## Installation

There is no official build yet. Nor are there install instructions.

## FAQ

### Can you support my favourite music player?

While I don't plan to personally support every music player out there, the code is written in such a manner that adding new music players shouldn't be that difficult. Are you a programmer and want to contribute, please reach out. I am still figuring out a proper plugin spi.

### Can I play a different playlist when I'm in battle?

Not really. The only way to know if you're in a battle or not, is by monitoring the EVE client log files which can tell me when you're taking on damage. I can't tell when a battle is over though.

In theory, one could start a battle playlist and assume that after some time of not receiving damage, switch back to a regular playlist.

### I want a playlist for my sov space and I want to force everyone to listen to it

This feature is planned for v2.0.0. Keep in mind though that playlists are tied to specific sources. Thus, if you setup a glorious sound track for your sov space in Spotify, and someone else using this tool is using Foobar, they won't hear your amazing musical tastes.

### Can I build playlists using EVE Jukebox Redux?

No. Build up playlists using your music player, then tell EVE Jukebox Redux which playlists to use.

### I want a new feature!

Feel free to open an issue describing the feature you want. Please keep in mind though that EVE Jukebox Redux is not a music player itself. It's really meant to be started and left in the background. 
