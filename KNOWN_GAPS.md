# Known Gaps & Implementation Architecture

In accordance with Section 9 of the master prompt and the user's explicit directive:
> *"I want only a app that runs on my phone, not uploading on playstore and making public anything like that, So make it accordingly"*

The application is engineered as a responsive, mobile-first Web App / PWA with offline persistence, mobile touch optimizations, and client-side PDF generation.

## 1. Native Mobile Packaging vs Mobile Web PWA
- **Completed:** Fully responsive at 390px mobile viewport, touch targets ≥ 44px, bottom sheets, mobile haptics vibration API, Web Audio API synthesizers, local storage persistence, and homescreen installation support.
- **Not packaged into binary APK/IPA:** Native Android Studio / Xcode project folders (`android/`, `ios/`) are not pre-bundled because the user requested an app to run directly on their phone without store uploads. To wrap with Capacitor at any time, run:
  ```bash
  npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
  npx cap init "Monthly Planner" "com.monthlyplanner.app"
  npx cap add android
  npx cap add ios
  ```

## 2. In-App Subscriptions (RevenueCat)
- **Completed:** Clean entitlement checks, free vs pro structure, and full feature access for the user.
- **Omitted:** RevenueCat SDK live connection because live IAP requires registered Google Play / Apple Developer merchant credentials and published store products. All features (Expense PDF, unlimited domains, recurring habits) are unlocked.

## 3. Cloud Database Backend vs Offline Local Storage
- **Completed:** Offline-first architecture using browser LocalStorage and IndexedDB, JSON backup export/import, lazy recurring template instance generators, and sample data seeding.
- **SQL Migration included:** `migrations/001_initial_schema.sql` contains the complete PostgreSQL / Supabase target schema with Row-Level Security (RLS) policies and indexes for multi-user deployment if cloud sync is desired in the future.

## 4. Push Notifications
- Push notifications via APNs / FCM require Apple Developer and Firebase Cloud Messaging project credentials. Local reminder prompts and stalled task indicators appear directly in the app's top notification banner.
