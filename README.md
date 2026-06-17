# Flashpoint Website

This is the GitHub repository for the Flashpoint Archive website, located at https://flashpointarchive.org/.

## Setup Instructions

Install [Deno](https://deno.com/), clone the repository and run `deno run -A main.js`.

The server will start at `http://localhost:80/` and the search database will be built automatically.

## Configuration

Copy `config_template.json` from the `data` folder into the root of the repository and rename it `config.json`. Modify it as you wish.

## Command-line Flags

- `--update` - Update the database and exit
- `--config <path>` - Use a different config file