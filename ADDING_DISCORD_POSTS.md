# Adding Discord Posts

The process for adding Discord announcements to the online archive can be partially automated using the following steps:

1. Install the [Vencord](https://vencord.dev/) client mod for Discord.
2. Go to `Settings > Vencord Settings > Plugins` and enable the "ViewRaw" plugin.
3. Hover over the message you want to add and click the `<>` button. This will display a modal containing the raw message contents.
4. Click the "Copy Message JSON" button.
5. In the Flashpoint website repository under `utilities`, create a file named `discord_message.json`.
6. Paste your clipboard contents into the file and save.
7. Open the terminal under `utilities` and run `deno run -A import_discord_message.js`. This will automatically extract the message's contents, download any attachments and add an entry to `discord.json`.
8. Repeat steps 3-7 for any other messages.

## Considerations

- Discord's implementation of Markdown is more lenient than most Markdown parsers. You may need to make some changes to the message's Markdown in order for it to render properly.
- You will need to update channel names, custom emojis, and pinged users/roles to use their actual names instead of their raw IDs.
- The name of the message's author should reflect the name they are most commonly known by. If the author's name needs to be changed, update the respective message's `author` field in `discord.json`.
  - Exceptions should only be made if the username is directly correlated to the message's contents, which is typically only the case for April Fools' jokes.
- In order for custom emojis to be displayed, you will need to download them and add them to the Markdown parser's list of custom emojis. Follow these instructions:
  1. Go to `https://cdn.discordapp.com/emojis/<id>.png`, with `<id>` representing the emoji's raw ID.
  2. Download the image to `/static/images/news/discord/emojis`, with its filename being the emoji's name.
  3. Open `nsfuncs.js`, and under `markedEmoji`, add the emoji to the `emojis` property. The field should be the emoji's name, while the value should be its filename.