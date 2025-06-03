
# Smart Route Monitoring 🚦📍

A React Native-based mobile application that enhances **travel safety** by monitoring a user’s journey using **time-bound checkpoints** and **automatic SOS alerts**. Supports both **Automatic** and **Manual** navigation modes, integrated with Google Maps, Directions API, and native Android SMS services.

---

## 📌 Features

- **Dual Navigation Modes:**
  - **Automatic Mode:** Auto-generates checkpoints based on route geometry.
  - **Manual Mode:** Allows users to set their own checkpoints by tapping on the route.
  
- **Checkpoint-Based Monitoring:**
  - Each checkpoint is assigned an expected arrival time.
  - If the user fails to reach a checkpoint on time, an SOS modal is triggered.

- **Emergency SOS System:**
  - If user doesn’t confirm safety, the app sends an SMS to configured emergency contacts with live location.

- **Settings Management:**
  - Add/Delete SOS contacts
  - Contacts are stored using `AsyncStorage` for offline access

- **Offline-Safe:** SOS can be triggered without internet using native Android SMS integration.

---

## 🛠 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Neeraj-Koshyari/Smart-Route-Monitoring-App.git
cd smart-route-monitoring
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Link Native Modules

```bash
npx pod-install
```

### 4. Add Google API Key

In `android/app/src/main/AndroidManifest.xml`, add:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
```

For `.env` based usage:

```env
GOOGLE_MAPS_API_KEY=your_key_here
```

---

## 📱 Required Permissions

**Android:**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.SEND_SMS" />
```

**iOS:**
> Not fully supported — Native SMS dispatch not implemented.

---

## 🧩 Native Module Setup

**Location:** `android/app/src/main/java/com/routing/`

- `SmsModule.java` → Native Android module to send SMS.
- `SmsPackage.java` → Register module with React Native.
- Register in `MainApplication.kt`.

---

## 🚀 Run the App

### Android Emulator / Device
```bash
npx react-native run-android
```

---

## 📂 Project Structure

```plaintext
src/
├── Screens/           # Home, Automatic, Manual, Settings
├── module/            # PathSimulator, SosModule
├── context/           # SosContext, LocationContext
├── permissions/       # Permission checks
├── navigation/        # Stack Navigation config
```

---

## 🧪 Testing

Manual testing across:
- Automatic Mode → Checkpoint timeout → SOS triggered
- Manual Mode → Custom checkpoints with expected time
- Settings → Contact management via AsyncStorage

---

## ⚠️ Known Issues

- Simulator state not persisted after app restart
- iOS version lacks native SMS fallback
- Location permission conflicts on fast screen switching (under review)

---

## 🧠 Future Enhancements

- iOS Push Notification fallback
- Real GPS tracking mode (not just simulation)
- Firebase backend for contact sync
- Voice-based SOS activation

---

## 📜 License

This project is part of a final year engineering submission. Source code is open for learning purposes. Commercial use is not permitted without permission.

---

## 👨‍🎓 Author

Developed by Navraj Devali and Neeraj Koshyari<br> 
Final Year B.Tech – Graphic Era Hill University, Bhimtal<br>
Project Title: **Smart Route Monitoring and Alert System**  
Submission: 2 June 2025
