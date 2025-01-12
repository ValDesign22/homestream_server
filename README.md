# HomeStream Server

HomeStream Server is the backend for the [HomeStream](https://github.com/ValDesign22/homestream_client) project.

It lets you stream your media files seamlessly across devices on your local network (or even remotely).

HomeStream is built with [Nuxum](https://github.com/nuxum/nuxum), a simple and lightweight express server framework. Both projects are open-source and free to use.

## Features

- Stream media files to any device
- Easy to set up and configure
- Supports automatic media library updates

## Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v18 or newer)
- [FFmpeg](https://ffmpeg.org/download.html) (required for video tracks and subtitles)

## Installation

### From source

To install and run the server from source:

1. Clone the repository

```bash
git clone https://github.com/ValDesign22/homestream_server.git
cd homestream_server
```

2. Install the dependencies

```bash
npm install
```

3. Build the project

```bash
npm run build
```

4. Start the server

```bash
npm start
```

### From release

To install and run the server from a pre-built release:

1. Download the latest release from the [releases page](https://github.com/ValDesign22/homestream_server/releases)
2. Extract the files and navigate to the extracted folder
3. Install the dependencies

```bash
npm install
```

4. Start the server

```bash
npm start
```

## Configuration

You can configure the server using environment variables. Create a `.env` file in the root of the project and add the following variables:

```env
APP_STORAGE_PATH=SERVER_STORAGE # Where the server will store the files
FILES_FOLDER=SERVER_FILES # Where the server will look for the files
PORT=PORT # The port the server will listen on
TMDB_API_KEY=YOUR_TMDB_API_KEY # You can get one from https://www.themoviedb.org/documentation/api
WATCH_DIR=SERVER_WATCH_DIR # The directory the server will watch for new files
```

## Usage

1. Start the server
2. Open the [client](https://github.com/ValDesign22/homestream_client)
3. Connect to the server
4. Enjoy your media

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](#LICENSE)
