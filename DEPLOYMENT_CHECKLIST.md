# 🚀 Hikmah Player — Play Store Deployment Checklist

## Pre-Build Checks
- [ ] All TypeScript errors resolved (`npx tsc --noEmit`)
- [ ] `npx expo-doctor` config check passes
- [ ] All `console.*` calls are `__DEV__`-guarded (perf monitor, lifecycle logs)
- [ ] `EXPO_PUBLIC_ENV` set via `eas.json` production profile
- [ ] App icon `./assets/images/icon.png` (512×512 PNG, no rounded corners)
- [ ] Adaptive icon foreground + monochrome + `#0F172A` background
- [ ] Splash `./assets/images/splash-icon.png` configured via `expo-splash-screen` plugin
- [ ] Notification icon `./assets/images/notification-icon.png` — replace copy with a
      white-on-transparent 24dp silhouette before release (Android tints it)

## EAS Setup (one time)
- [ ] `npm install -g eas-cli` + `eas login`
- [ ] `eas init` (replaces `your-eas-project-id` in `app.json`)
- [ ] `google-play-service-account.json` in place for `eas submit`
- [ ] `eas build --platform android --profile development` installs on test device
- [ ] `eas build --platform android --profile preview` for internal testing
- [ ] `eas build --platform android --profile production` produces the AAB

## Store Listing
- [ ] App Name: "Hikmah Player"
- [ ] Short Description (80 chars): "Islamic media player with offline support"
- [ ] Full Description (4000 chars)
- [ ] Screenshots (Phone: 1080×1920, min 2, max 8)
- [ ] Feature Graphic (1024×500)
- [ ] App Category: Music & Audio
- [ ] Content Rating: IARC questionnaire completed
- [ ] Privacy Policy URL (required — app reads device media)
- [ ] Target Audience: 13+

## Technical Requirements
- [ ] `versionCode` increments per release (`autoIncrement: true` in `eas.json`)
- [ ] App Bundle (AAB) size < 150MB
- [ ] 64-bit ABIs included (EAS default: `arm64-v8a`, `armeabi-v7a`, `x86_64`)
- [ ] Hermes engine (Expo SDK 57 default)

## Permissions Justification (declared in `app.json`)
| Permission | Justification for Play Console |
|---|---|
| INTERNET | Stream audio/video content |
| ACCESS_NETWORK_STATE | Network-aware adaptive quality |
| READ_EXTERNAL_STORAGE (≤ Android 12) | Import phone videos/audio into the library |
| READ_MEDIA_AUDIO + READ_MEDIA_VIDEO (13+) | Granular phone-media import (no photo access) |
| WRITE_EXTERNAL_STORAGE (≤ Android 9) | Save downloaded media |
| FOREGROUND_SERVICE + FOREGROUND_SERVICE_MEDIA_PLAYBACK | Background audio playback |
| WAKE_LOCK | Prevent sleep during playback |
| POST_NOTIFICATIONS | Download progress + content alerts |
| Media-library full access | Declare in Play Console: core feature is playing the user's own Islamic media |

## Testing
- [ ] Tested on Android 7.0–8.0 (legacy storage permissions path)
- [ ] Tested on Android 13+ (granular media permissions path)
- [ ] Tested on Android 14+ (target; partial photo/video access behavior)
- [ ] Tested offline mode (downloads + cached library)
- [ ] Tested background audio (screen off, 30+ min)
- [ ] Tested notifications (download complete, playback controls)
- [ ] Tested RTL layout (Arabic, Urdu) + restart flow
- [ ] Tested accessibility (TalkBack traversal of Library + Player)
- [ ] Tested permission-denied flows (media import, notifications → Settings redirect)
- [ ] Memory check: library with 500+ items scrolls at ~60fps (FlashList)
- [ ] Battery usage check (< 5% per hour audio playback)

## Post-Launch
- [ ] Crash reporting connected (Sentry/Crashlytics hooks are stubbed in `ErrorBoundary` + `errorHandler`)
- [ ] Performance monitoring enabled (dev `perfMonitor` report → promote to analytics)
- [ ] User feedback channel set up
- [ ] Version 1.0.1 roadmap planned
