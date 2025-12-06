## Jelly Video App

A lightweight & elegant video interface for Jellyfin. Built with Tauri and libmpv for high-performance video playback with a clean, intuitive interface.

> **⚠️ Note:** This application is currently in active development and serves as a demo. Features and functionality are subject to change as we continue to improve the experience.

### Features

-   **Native Performance:** Built with Tauri for a lightweight, native desktop experience with minimal resource usage.
-   **High-Quality Playback:** Powered by libmpv for reliable, hardware-accelerated video playback.
-   **Seamless Jellyfin Integration:** Connect directly to your Jellyfin server to access your personal video library.
-   **Clean Interface:** A modern, clutter-free design that puts your content front and center.

### Installation

Jelly Video App is available as a native desktop application. Pre-built binaries will be available on our [GitHub release page](https://github.com/Stannnnn/jelly-video-app/releases) once we reach a stable release.
<br/>
<br/>

[Yarn](https://classic.yarnpkg.com/lang/en/docs/install) (`npm i -g yarn`) is required if you wish to build the project or run the development server yourself.

#### Prerequisites

Before building or running Jelly Video App, you need to install the required dependencies:

1. **Tauri Prerequisites:** Follow the [Tauri Prerequisites Guide](https://v2.tauri.app/start/prerequisites/) for your platform.

2. **libmpv Plugin:** Install the tauri-plugin-libmpv dependencies by following the [official installation guide](https://docs.rs/crate/tauri-plugin-libmpv/latest).

#### Build from Source

1. Clone the repository:
    ```bash
    git clone https://github.com/Stannnnn/jelly-video-app.git
    ```
2. Install dependencies:
    ```bash
    yarn
    ```
3. Run the development server:
    ```bash
    yarn tauri:dev
    ```
4. Build the production application:
    ```bash
    yarn tauri:build
    ```

The built application will be available in `src-tauri/target/release/bundle/`.

### Development

-   `yarn dev` - Start the Vite development server
-   `yarn tauri:dev` - Start the Tauri development app with hot-reload
-   `yarn build` - Build the web frontend
-   `yarn tauri:build` - Build the complete Tauri application
-   `yarn lint` - Run ESLint to check code quality

### Contributing

We're open to pull requests, please merge them to the `develop` branch. If you have any suggestions or improvements, feel free to open an issue or submit a pull request. Your contributions are welcome and appreciated!

### License

See the LICENSE file for more details.
