# Hikmah Player

An offline-first Islamic media player for Android, iOS and web, built with Expo (SDK 57) and Expo Router.

Hikmah Player plays the audio and video **already on the user's device** — recitations, lectures, nasheeds and sermons. It imports media through the system picker (or a full library scan), keeps a searchable local library, downloads files for offline playback, and tracks progress so you can resume where you stopped. There is no account, no server and no streaming backend.

**Current version:** `1.1.0` · **Android applicationId / iOS bundleId:** `com.hikmah.media`

## Features

- **Local library** — import via the system document/media picker or scan device folders, with favorites, playlists and continue-watching.
- **Modern audio player** — blurred artwork backdrop, glass control card, queue support, sleep timer, swipe artwork to skip tracks.
- **Modern video player** — right-half swipe for volume, left-half swipe for brightness, tap-to-seek with a seek readout, Picture-in-Picture, background playback.
- **Home with media tabs** — Audio / Video / Recent, per-tab counts, a Recent Files rail with real thumbnails, and a branded splash screen.
- **Downloads** — resumable queue with progress notifications, offline playback of downloaded items.
- **Search** — fuzzy local search over titles, reciters and tags.
- **Background playback & notifications** — lock-screen and media controls via `expo-audio` + `expo-notifications`.
- **OTA updates** — release builds silently fetch over-the-air updates, with a manual check in Settings.
- **Platform aware** — native features are guarded so the app runs on web (downloads fall back to browser save).

## Tech stack

| Area | Choice |
|---|---|
| Framework | Expo SDK 57, React Native 0.86, React 19.2 |
| Routing | Expo Router (file-based, typed routes) |
| State | Zustand (player, library, downloads, settings, search, continue-watching) |
| Lists | `@shopify/flash-list` |
| Audio / Video | `expo-audio`, `expo-video` (+ `expo-video`-free web engine) |
| Storage | `expo-file-system`, `expo-media-library`, AsyncStorage |
| Styling | `StyleSheet` + `lucide-react-native` icons, `expo-blur` / `expo-glass-effect` |
| i18n | `i18next` + `react-i18next` |
| Tests | Jest (`jest-expo`), Detox E2E |

## Project structure

```
src/app/            # Routes (every file is a screen)
  (tabs)/           # Tab navigator: home, library, downloads, favorites, settings
  player/           # Audio and video player screens
  library/          # Playlist detail
  _layout.tsx       # Root stack, startup gate, deferred OTA update check
src/components/     # cards/, common/, player/, video/, search/, ui/, permissions/
src/constants/      # theme (colors, spacing, typography), storage keys
src/hooks/          # theme and platform hooks
src/types/          # shared types
components/         # feature components (search, ui helpers)
hooks/              # playback hooks (useAudioPlayback, useVideoEngine, useSleepTimer, …)
services/           # audio, video, playback, storage, downloads, search, notifications,
                    # cache, i18n, performance, updates
store/              # Zustand stores
utils/              # formatters, accessibility, error handler
__tests__/          # unit, component and integration tests
e2e/                # Detox end-to-end tests
```

Path alias `@/*` resolves to `./src/*` then `./*` (see `tsconfig.json` and the `moduleNameMapper` in `jest.config.js`), so `@/components/...` and `@/services/...` both work.

## Getting started

Requires Node 20+ and npm (or Bun).

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go for a quick UI check, or press `a` / `i` for the Android/iOS targets.

> **Expo Go cannot load this app fully** — it uses native modules (`expo-audio`, `expo-video`, `expo-media-library`, `expo-notifications`, `expo-updates`). For real development you need a development build:
>
> ```bash
> npx expo run:android      # or: npx expo run:ios
> eas build --profile development --platform android
> ```

There is no checked-in `android/` or `ios/` directory — native projects are generated with Continuous Native Generation and native behavior is configured in `app.json` and config plugins. Never edit generated native folders by hand.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the dev server |
| `npm run android` / `npm run ios` | Build and run a native development build |
| `npm run web` | Run on web |
| `npm run lint` | ESLint (`expo lint`) |
| `npx tsc --noEmit` | Type check |
| `npm test` | Full Jest suite |
| `npm run test:unit` | `services` / `store` / `utils` / `hooks` tests only |
| `npm run test:ui` | Component tests |
| `npm run test:integration` | Integration tests |
| `npm run test:coverage` | Coverage report |
| `npm run test:ci` | CI mode with coverage and limited workers |
| `npm run test:e2e` | Detox on an Android emulator |

Run `npx expo-doctor` when diagnosing dependency or config issues and `npx expo install <pkg>` to add packages (never `npm install` a native Expo package directly).

## Permissions

Declared in `app.json`; a runtime permission gate runs on first launch and can redirect to system settings when a permission is permanently denied.

| Permission | Why |
|---|---|
| `INTERNET`, `ACCESS_NETWORK_STATE` | Media playback and network-aware behavior |
| `READ_MEDIA_AUDIO`, `READ_MEDIA_VIDEO`, `READ_MEDIA_VISUAL_USER_SELECTED` | Import audio/video from the device (Android 13+) |
| `READ_EXTERNAL_STORAGE` | Same, on Android 12 and below |
| | `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Background audio playback |
| `WAKE_LOCK` | Keep playback alive with the screen off |
| `MODIFY_AUDIO_SETTINGS` | Audio focus handling |
| `POST_NOTIFICATIONS` | Download progress and playback notifications |

## Building and versioning

`eas.json` defines three build profiles:

| Profile | Output | Channel | Notes |
|---|---|---|---|
| `development` | Debug APK | — | `developmentClient`, internal distribution |
| `preview` | APK | `preview` | Internal testing / sideloading |
| `production` | AAB | `production` | `autoIncrement: true`, `EXPO_PUBLIC_ENV=production` |
| `production-apk` | APK | `production` | Extends `production`; same env and channel, sideloadable release APK |

```bash
npx eas-cli build --platform android --profile production-apk   # release APK
npx eas-cli build --platform android --profile production       # Play Store AAB
```

Version numbers:

- `version` in `app.json` is the only number you edit by hand. It is the user-facing version **and** the runtime version (`runtimeVersion.policy: "appVersion"`).
- `versionCode` (Android) and `buildNumber` (iOS) live on the EAS server (`cli.appVersionSource: "remote"`) and increment automatically on `production`/`production-apk` builds. The values in `app.json` are ignored.
- `package.json` mirrors the version for npm tooling; keep it in sync.

Bump `version` only when you ship native changes. JS-only changes go out as an OTA update.

## Over-the-air updates

```bash
npx eas-cli update --channel preview   --message "Fix playback resume"
npx eas-cli update --channel production --message "v1.1.1 hotfix"
```

- Channels: `preview` and `production` (created automatically on first build).
- An update only reaches installs whose **runtime version** matches the update's, so a `1.1.1` update never reaches a `1.0.1` install.
- In release builds the app checks for updates ~8s after launch and downloads in the background; the new bundle is applied on the next restart. Settings has an auto-update toggle plus a manual "Check for updates" action that can download and restart.
- Emulators and dev-client debug builds do not apply OTA updates; test them on a real device.

## Testing

```bash
npm test                 # all suites
npm run test:unit        # fast, no UI rendering
npm run test:ci          # what CI runs
```

Tests live in `__tests__/` and are split into `services`, `store`, `utils`, `hooks`, `components`, and `integration`. Detox E2E specs live in `e2e/` (see `e2e/DEVICE_MATRIX.md` for the supported device matrix).

## Releases

- Tag a release and attach the sideloadable APK, e.g. `v1.1.0` built with the `production-apk` profile.
- Store submission (AAB) uses `eas submit --profile production` with `google-play-service-account.json` at the repo root. See `DEPLOYMENT_CHECKLIST.md` for the full Play Store checklist.

## License

Private project. All rights reserved.
