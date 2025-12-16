## Jelly Video App

A lightweight & elegant video client for Jellyfin, designed to eliminate server transcoding through direct playback powered by the mpv backend via libmpv. Built with Tauri and libmpv for high-performance video playback with a clean, intuitive interface. Using the Jellyfin API, it provides seamless access to your personal video library.

**Looking for a music player?** Check out [Jelly Music App](https://github.com/Stannnnn/jelly-app/) - the music-focused web app version for your Jellyfin library!

<div>
  <img src="https://i.imgur.com/jxzyx6J.png" alt="Light variant" width="49%">
  <img src="https://i.imgur.com/UqstzHa.png" alt="Dark variant" width="49%">
</div>
<details>
  <summary>Additional screenshots</summary>
</details>

### Features

-   **Native Performance:** Built with Tauri for a lightweight, native desktop experience with minimal resource usage.
-   **Direct Playback:** Powered by libmpv for reliable, hardware-accelerated video playback.
-   **Seamless Jellyfin Integration:** Connect directly to your Jellyfin server to access your personal video library.
-   **Simple Design:** A clean, modern interface focused on smooth content discovery and playback.

### Installation

Jelly Video App is available as a native desktop application. Pre-built binaries will be available on our [GitHub release page](https://github.com/Stannnnn/jelly-video-app/releases) once we reach a stable release.
> [!NOTE]
> Windows is currently the only supported platform for video playback, as linux & macos have issues with the mpv backend.
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

