# Adding News Entries

News entries are defined in `news.json` with the following format:

```js
[

    {

        // The entry's title
        "title": "Flashpoint is Blowing Up!",

        // The entry's author
        "author": "Blutius Maximus"

        // An ISO 8601 extended date string representing when the entry was posted
        "date": "2038-01-19",

        // The name of the original source of the entry, if applicable
        "source": null,

        // A link to the entry at its original source, if applicable
        "link": null,

        // The entry's type
        "namespace": "article"

        // A unique identifier for the entry, formatted as YYYYMMDD##
        "id": "2038011900"

    }

]
```

The news entry's type determines how it rendered. There are three types:

- `article` - The entry is rendered as enhanced Markdown using the contents of `news/<id>.txt`.
- `video` - The entry is rendered as a video player depending on the values of the `source` and `link` fields.
- `changelog` - The entry is rendered as plaintext using the contents of `news/<id>.txt`.

## Articles

While the Markdown format used to write articles is mostly the standard flair, there are several differences in how it is interpreted and displayed:

- Images are always centered, and the square brackets are used to define captions instead of placeholder text.
- Image links have the following special behavior:
  - If the link is a YouTube video, then an embed of the specified video will be displayed.
  - If the link is a Twitter tweet, then an embed of the specified tweet will be displayed.
  - If the link consists solely of the name of an image file, then the respective image under `/static/images/news` will be displayed.
  - If the link consists solely of the name of a video file, then the respective video under `/static/videos/news` will be displayed.
  - Otherwise, the link is expected to consist solely of the name of a file located under `/static/images/news/`.
- Images can be displayed next to each other with the same caption by separating their filenames with`|`.
- Multi-line code blocks ignore language declarations and instead display them as regular text.

## Videos

Video entries do not require any of their own files in the `news` directory. Instead, you use the `link` field to define the location of the video.

If `link` is a YouTube video, then `source` needs to be set to "YouTube" in order to enable the YouTube video embed. Otherwise, `link` is assumed to be the location of a valid MP4/WEBP video file and will be loaded inside a standard HTML video player.