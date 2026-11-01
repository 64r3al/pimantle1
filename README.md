# Pimantle

A community-maintained fork of [Pimantle](https://github.com/jsettlem/pimantle), the semantic word-guessing game inspired by Semantle.

This repository contains the application's source code. The project uses React and TypeScript, with the existing puzzle engine and multiplayer integration retained alongside a refreshed interface and reliability improvements.

## Features

- Semantic word-guessing gameplay and puzzle archive.
- Responsive interface for desktop, tablet, and mobile screens.
- Local progress storage with IndexedDB and migration from legacy localStorage saves.
- Multiplayer connection status and the existing Socket.IO client integration.
- Guess statistics, hints, and result sharing.
- Automated tests and a GitHub Actions production-build check.

## Run locally

### Requirements

- Git
- Node.js 20 (the version used by the repository's CI workflow)
- npm

### Install

```bash
git clone https://github.com/64r3al/pimantle1.git
cd pimantle1
npm ci
```

### Start the development server

```bash
npm start
```

The Create React App development server will print the local address in the terminal. Open that address in your browser.

### Run tests

```bash
npm test -- --watchAll=false
```

### Create a production build

```bash
npm run build
```

The optimized static site is written to the `build/` directory.

## Multiplayer configuration

The frontend retains the existing Socket.IO integration. To point it at a multiplayer server, define the server address in a local environment file:

```dotenv
REACT_APP_SOCKET_URL=https://your-socket-server.example
```

Replace the example value with the URL of a compatible Socket.IO backend. The frontend repository does not itself provide or host that backend, so multiplayer functionality requires an available compatible service. Do not commit private credentials or secrets in environment files.

## Puzzle archive data

The bundled archive is limited to puzzle data included in this repository snapshot:

- Pimantle: puzzle indexes 0–232
- Semantle: puzzle indexes 0–99

The availability manifest prevents the interface from offering archive entries for files that are not present. A separately verified source or generation process is needed to supply future daily puzzle data.

## Deployment

This is a Create React App project. A static deployment can be built with `npm run build`; configure the hosting provider to serve the generated `build/` directory. The GitHub Actions workflow also runs the test suite and production build on pull requests targeting `master` and pushes to `master`.

## Credits and project origin

This project is a fork of [jsettlem/pimantle](https://github.com/jsettlem/pimantle). The original project and its author retain credit for the upstream work. This repository contains subsequent maintenance, reliability, and interface changes.

## License and reuse

No license file is currently included in this repository or the upstream repository. Public visibility on GitHub allows people to view and clone the repository, but it does not by itself grant permission to redistribute, modify, or commercially reuse code. Check with the upstream rights holder and obtain the appropriate licensing permission before treating the project as an openly licensed work.
