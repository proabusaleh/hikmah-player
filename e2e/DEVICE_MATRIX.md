# Device Test Matrix

Run E2E with: `npm run test:e2e` (requires an Android emulator + a local
debug build — see below). Unit/component/integration suites run anywhere
with `npm test`.

## Prerequisites for E2E
1. `npx expo prebuild` (generates `android/` — gitignored, CNG project)
2. Build + install the debug APK on the emulator
   (`android/app/build/outputs/apk/debug/app-debug.apk`)
3. Start emulator `Pixel_6_API_34`, then `npm run test:e2e`

## Android Phones
| Device | OS | Screen | Status |
|--------|-----|--------|--------|
| Pixel 6 | Android 14 | 1080x2400 | ⬜ |
| Samsung S23 | Android 14 | 1080x2340 | ⬜ |
| Redmi Note 12 | Android 13 | 1080x2400 | ⬜ |
| Pixel 4a | Android 12 | 1080x2340 | ⬜ |
| Samsung A14 | Android 13 | 720x1600 | ⬜ |

## Android Tablets
| Device | OS | Screen | Status |
|--------|-----|--------|--------|
| Pixel Tablet | Android 14 | 1600x2560 | ⬜ |
| Samsung Tab S9 | Android 14 | 1600x2560 | ⬜ |

## iPhones
| Device | OS | Screen | Status |
|--------|-----|--------|--------|
| iPhone 15 Pro | iOS 17 | 1179x2556 | ⬜ |
| iPhone 13 | iOS 17 | 1170x2532 | ⬜ |
| iPhone SE 3 | iOS 17 | 750x1334 | ⬜ |

## iPads
| Device | OS | Screen | Status |
|--------|-----|--------|--------|
| iPad Pro 12.9 | iPadOS 17 | 2048x2732 | ⬜ |
| iPad Air 5 | iPadOS 17 | 1640x2360 | ⬜ |

## Test Scenarios Per Device
- [ ] Splash → Onboarding → Home flow
- [ ] Audio playback (play/pause/seek/skip)
- [ ] Video playback (play/fullscreen/landscape)
- [ ] Mini player visibility & tap
- [ ] Download (start/progress/complete)
- [ ] Offline playback
- [ ] Search (type/filter/results)
- [ ] Playlist CRUD
- [ ] Settings changes persist
- [ ] Background audio (lock screen)
- [ ] Notification controls
- [ ] Orientation change (portrait ↔ landscape)
- [ ] RTL layout (Arabic/Urdu)
- [ ] TalkBack/VoiceOver navigation
- [ ] Memory usage (< 250MB)
- [ ] Battery drain (< 5%/hr)
