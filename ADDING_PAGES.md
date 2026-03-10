# Adding Pages

## Getting Started

Pages are defined in `data/pages.json` with the following format:

```js
{

    // The path where the page will be accessed
    "/blahblah": {

        // A unique identifier for this page
        "namespace": "blahblah",

        // Any additional stylesheets to load
        "styles": ["blahblah.css"],

        // Any additional scripts to load
        "scripts": ["blahblah.js"],

        // Reusable HTML templates belonging to this page
        // (only relevant if using namespace function)
        "fragments": [],

        // If true, match subpages of the defined path
        // (also only relevant if using namespace function)
        "lenient": false

    }

}
```

After defining a page, you will need to create the following files *at minimum*:

- `templates/<namespace>.html` (your page's HTML template)
- `locales/en-US/<namespace>.json` (your page's translation file)

The HTML template is a barebones representation of the page's content. Instead of storing text strings inside the HTML template, they are stored inside the translation file and then referenced within the template using their unique identifier.

For example, you can define a translation string like this:

```js
{
    "Blahblah_Para1": "Yappity yap!"
}
```

And reference it in the HTML template using `@{Blahblah_Para1}`. When the page is loaded, the variable will be displayed as "Yappity yap!"

One translation string you'll probably always want to define is `Title`, which is used for the page's title.

## Variable Parameters

Translation strings also have templating capabilities. Consider the following:

```js
{
    "Blahblah_Para2": "I have $1 $2 cats. $3{Yippee!}",
    "Blahblah_Funny": "funny"
}
```

We can supply parameters to `Blahblah_Para2` in our HTML template variable like this:

```
@{Blahblah_Para2,"64",Blahblah_Funny,<b>}
```

The parameters are separated by commas. In the translation string, they are referenced using a dollar sign followed by its index.

Parameters come in the following types:

- Text constants, which are surrounded by double quotes. `"64"` is a text constant at index 1, so it is referenced using `$1`.
- HTML elements, which are defined by their opening tag. `<b>` is an HTML element at index 3, so it is referenced using `$3` optionally followed by curly brackets surrounding a portion of text, which causes the element to wrap around that text.
- Other translation strings. `Blahblah_Funny` is a translation string at index 2, so it is referenced using `$2`.
- Text definitions generated from namespace functions. We will talk about these in the next section.

So when the page is rendered, the variable we described will turn into this:

> I have 64 funny cats. **Yippee!**

## Namespace Functions (ADVANCED)

Namespace functions allow you to use JavaScript to add or override a page's text definitions right before it is rendered and served to the user. When used in conjunction with template fragments, they can greatly extend the functionality of a page.

Suppose you want to have a table of dynamically-generated data. The HTML template would look like this:

```html
<table>
    <tr>
        <th>Something</th>
        <th>Number</th>
    </tr>
    @{tableValues}
</table>
```

`tableValues` does not exist in the translation file, but if we use a namespace function, we can add it to the list of text definitions passed to the HTML template during page load.

First, we will need to create a fragment representing a table row. If our namespace is `blahblah`, and the fragment is named `row`, then we need to create a file named `blahblah_row.html` in the `templates` directory. Let's give it the following contents:

```html
<tr>
    <td>@{something}</td>
    <td>@{number}</td>
</tr>
```

We also need to update the page's `fragments` array in `pages.json` as follows:

```js
{
    "/blahblah": {
        "namespace": "blahblah",
        "styles": ["blahblah.css"],
        "scripts": ["blahblah.js"],
        "fragments": [
            "row" // New
        ],
        "lenient": false
    }
}
```

Now, open `nsfuncs.js` and add a function property named after the page's namespace to the `namespaceFunctions` object:

```js
export const namespaceFunctions = {
    'blahblah': (url, lang, defs) => {
        return {};
    }
}
```

The function is passed three arguments: the accessed URL, the active language, and an object containing the unaltered translation strings. The return value should be an object containing new or altered text definitions, which will be applied to the list of translation strings.

So to populate our table, we can do this:

```js
export const namespaceFunctions = {
    'blahblah': (url, lang, defs) => {
        const rows = [];
        for (let i = 0; i < 5; i++)
            rows.push(utils.buildHtml(templates['blahblah'].row, {
                something: 'Anything?',
                number: i.toString(),
            }));
        
        return { tableValues: rows.join('\n') };
    }
}
```

What this code is doing is building the row fragment 5 times, each time supplying it with a custom set of definitions, and combining them into a single string which is assigned to `tableValues`.

Now when the page is accessed, you should see a table similar to the one below:

| Something | Number |
| --- | --- |
| Anything? | 0 |
| Anything? | 1 |
| Anything? | 2 |
| Anything? | 3 |
| Anything? | 4 |

Refer to `utils.js` for some helpful methods you can use in namespace functions. Good luck!