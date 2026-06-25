# Flashpoint Website

This is the GitHub repository for the Flashpoint Archive website, located at https://flashpointarchive.org/.

## Setup Instructions

1. Install [Deno](https://deno.com/)
2. Clone the repository
3. Run `deno install`
4. Run `deno task start`

The server will start at `http://localhost:80/` and the search database will be built automatically.

## Configuration

Copy `config_template.json` from the `data` folder into the root of the repository and rename it `config.json`. Modify it as you wish.

## Tasks

- `deno task start` - Start the server
- `deno task update` - Update the search database and exit

## Command-line Flags

- `--config <path>` - Use a different config file