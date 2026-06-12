# Firebase setup for MoMo Tracker

Create the Firebase project in the Google console, then copy the web app config values into `.env`.

## In Firebase Console
1. Go to https://console.firebase.google.com
2. Add project
3. Name it `momo-tracker`
4. Enable Authentication
5. Go to Authentication -> Sign-in method -> Email/Password -> Enable -> Save
6. Enable Firestore Database
7. Go to Firestore Database -> Create database -> Start in test mode -> Next -> Done

## Add the web app config
1. Open Project settings
2. Go to Your apps
3. Add App -> Web
4. Copy the `firebaseConfig` object
5. Paste the values into `mobile-money-tracker/.env`

## Example env keys
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

## After that
Run the app again with:

```bash
npm start
```

When the env values are present, the tracker will show Firebase as ready.
