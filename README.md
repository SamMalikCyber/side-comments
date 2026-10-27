# Side Comments for YouTube

On your phone, you can watch a video and read the comments at the same time. On PC, you have to scroll down from the video to read them, so you can't do both. This extension moves the comments into the right-hand column next to the video, so you can. A switch at the top flips that column between Comments and the original Recommended section, and it remembers which one you picked last.

## What it does

- Moves YouTube's actual comments section into the side column, so liking, replying, sorting, and posting all still work.
- The comments scroll on their own, so the video stays put.
- Alt+C flips the switch. You can also change the shortcut at `chrome://extensions/shortcuts`.
- Turns itself off in theater mode, full screen, small windows, and on livestreams. Those layouts either don't have room on the side or already use it for chat.
- Built to be minimal and blend in with YouTube. The switch and panel match its buttons and its light and dark themes.

## Privacy

The extension only saves one thing: whether you last had Comments or Recommended open. That's what the `storage` permission is for, and the setting never leaves your browser.

This extension is only for youtube.com. No data collection, tracking, or network requests.

## How it works

- `content.js` moves the comments into a panel in the side column, and back when you switch. YouTube doesn't reload the page between videos, so it watches for that and reapplies.
- `background.js` handles the keyboard shortcut.
- `styles.css` matches YouTube's light and dark themes.

## Try it

1. Download or clone this repo.
2. Go to `chrome://extensions` and turn on Developer mode.
3. Click Load unpacked and pick the folder.

## License

MIT. See [LICENSE](LICENSE).
