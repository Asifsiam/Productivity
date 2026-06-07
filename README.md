# Productivity App

Offline personal productivity app for Android built with React Native and Expo.

## Features

- **Supplements** — Track medications/supplements with schedules, streaks, history, and reminder notifications
- **Routine** — Build per-weekday time-block routines with a visual timeline
- **To-Do** — Simple flat task list with complete/skip actions
- **Hours** — Log work hours and calculate earnings in BDT (৳)

All data is stored locally with AsyncStorage. Dark mode only.

## Development

```powershell
cd C:\Users\Siam\Projects\productivity-app
npm start
```

Press `a` to open on Android emulator/device via Expo Go, or scan the QR code.

> Supplement notifications require a **development or preview build** on Android SDK 53+ (not Expo Go).

## Build APK with EAS

1. Install EAS CLI and log in:
   ```powershell
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. Build APK:
   ```powershell
   eas build -p android --profile preview
   ```

3. Download the APK from the EAS dashboard link and sideload on your device.

## Project structure

```
src/
  app/           # Expo Router screens
  components/    # UI components (one per file)
  constants/     # Theme, storage keys
  lib/           # Business logic + AsyncStorage helpers
  types/         # TypeScript interfaces
```
