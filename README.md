****Code Motive*****
Create an app using react native for road safety in this their will be google map in which their will be 2 windows automatic and manual.
In automatic the user will enter its destination location and the current location will be source location. so when the user will enter the destination then the most optimal path will be generated from the source to destination and  checkpoints will be generated in the path automatically and in those checkpoint a time will be given means when user start moving to the destination then the user should reach that checkpoint at that time if he does not reach that checkpoint at that time then an SOS pop up will displayed which will confirm whether the user is safe or not.

and in manual when the user enter destination location then the best route will be selected and then the user will click on the root  and checkpoint will be placed where the user click. after creation of checkpoint in those checkpoint a time will be given means when user start moving to the destination then the user should reach that checkpoint at that time if he does not reach that checkpoint at that time then an SOS pop up will displayed which will confirm whether the user is safe or not.


Make react native project
    -> npx react-native init MyMapApp
    -> npm install @react-native-community/cli


Setup for react-native and android studio:
Youtube: https://youtu.be/8l691BQ-RGc?si=TRlFOUT-kgUX80dc


All about google maps : 
Youtube: https://www.youtube.com/playlist?list=PLeIJUF3PiXDfOoCWgD4uibjkGQMT7a78v


Map API's
    github: https://github.com/react-native-maps/react-native-maps


1. Installation Commands for API:
   Install React Native Maps:           npm install react-native-maps
   Install MapView Directions:          npm install react-native-maps-directions
   Install Google Places Autocomplete:  npm install react-native-google-places-autocomplete
   Install GetLocation for Geolocation: npm install react-native-get-location
   Install Get Random Values (Polyfill):npm install react-native-get-random-values

   //For drop down box
   Install element DropDown:            npm install react-native-element-dropdown
   Install dropdown Picker:             npm install react-native-dropdown-picker

   //For navigation between the Screens
   npm install @react-navigation/native 
   npm install @react-navigation/native-stack 
   npm install react-native-screens 
   npm install react-native-safe-area-context 
   npm install react-native-gesture-handler 
   npm install react-native-reanimated 
   npm install react-native-get-random-values


2. Additional Setup
    Android-Specific Setup:
        Add the required Google Maps API key for both Places and Directions in the android/app/src/main/AndroidManifest.xml file:
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="YOUR_GOOGLE_MAPS_API_KEY" 
        />
    iOS-Specific Setup:
        If you're running this code on iOS, you need to install CocoaPods dependencies.
        cd ios
        pod install
        cd ..

3. Permissions Needed
    Android:
        Add the following permissions in android/app/src/main/AndroidManifest.xml:
        <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
        <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
        <uses-permission android:name="android.permission.SEND_SMS" />
    
    iOS:
        Add these entries in your Info.plist file:
        <key>NSLocationWhenInUseUsageDescription</key>
        <string>Your app requires access to your location.</string>
        <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
        <string>Your app requires access to your location.</string>
        // SMS permission not implemented yet


API requires:
    -> Use Map
        website: https://www.npmjs.com/package/react-native-maps
        Youtube: https://www.youtube.com/watch?v=jgi_I7nk3kE&list=PLeIJUF3PiXDfOoCWgD4uibjkGQMT7a78v&index=1

    -> For marker
        github: https://github.com/react-native-maps/react-native-maps?tab=readme-ov-file#rendering-a-list-of-markers-on-a-map
        Youtube: https://www.youtube.com/watch?v=-TlpJyB4CyI&list=PLeIJUF3PiXDfOoCWgD4uibjkGQMT7a78v&index=2

    -> For Search Bar
        website: https://www.npmjs.com/package/react-native-google-places-autocomplete
        Youtube: https://www.youtube.com/watch?v=-ilENWc2kNA&list=PLeIJUF3PiXDfOoCWgD4uibjkGQMT7a78v&index=5

    -> For current location
        website: https://www.npmjs.com/package/react-native-get-location
        Youtube: https://www.youtube.com/watch?v=UOAr5iUO4l0&list=PLeIJUF3PiXDfOoCWgD4uibjkGQMT7a78v&index=8


Zoom Feature

    1. Focus on the Visible Center of the Screen:
        The getCamera method retrieves the current camera position and zoom level, ensuring any changes apply to the screen's center.

    2. Zoom Levels:
        The zoom property is adjusted by incrementing or decrementing it for zoom-in and zoom-out actions, respectively.
        
        Limits:
            -> Zoom-in max: 20 (very close to the ground).
            -> Zoom-out min: 2 (shows a wider area).
        
    3. Smooth Transitions:
        animateCamera creates a smooth zoom effect with the specified duration.


Errors while building:
1. Render Error (resolved)
    crypto.getRandomValues() not supported
    
    -> The error message comes due to the fact that crypto.getRandomValues() isn't natively supported in React Native. The GooglePlacesAutocomplete component internally uses the uuid package, which depends on crypto.getRandomValues().

    Solution: 
    -> To fix this, Explicitly add 'react-native-get-random-values' to your project and ensure it loads at the very beginning.
    1.  Install the Required Packages:
        -> npm install react-native-get-random-values
        -> npm install uuid

    2.  Import 'react-native-get-random-values' at the Top of Your Main File
        -> import 'react-native-get-random-values';

2. Current Location request get denied when moving from automatic to manual screen or vice-versa because of non     centrallized location request (Not-resolved)
3. Removal of all data when app cleared from background or move back to home screen (Not-resolved)


(Created on 28 FEB 2025, Source: https://www.npmjs.com/package/react-native-mobile-sms , https://reactnative.dev/docs/legacy/native-modules-intro)
Fully Automatic SMS send feature (used Native Module work only for android)
    For sending fully automatic SMS we have to make 2 files and changes in MainApplication.kt file:
    File Location : android/app/src/main/java/com/routing

    1. SmsModule.java: (it holds the logic to send an SMS automatically from Android.)
        Purpose: This file contains the actual implementation of the functionality (sending an SMS).
        How It Works:
            -> It uses Android’s native SmsManager API to send an SMS.
            -> It exposes one or more methods (e.g., sendSMS) to JavaScript by using the @ReactMethod annotation.
            -> This module is a subclass of ReactContextBaseJavaModule and provides a name (e.g., "SmsModule") that JavaScript code can use to reference it via NativeModules.

    2. SmsPackage.java: (it wraps SmsModule so that React Native knows about it and can link it to JavaScript code.)
        Purpose: This file serves as a bridge between your custom native module and React Native’s module system.
        How It Works:
            -> It implements the ReactPackage interface.
            -> Inside its createNativeModules() method, it instantiates your SmsModule and adds it to a list of native modules.
            -> By registering this package (usually in your MainApplication.kt), React Native will include your custom module as part of the app’s available native modules.


(Created on 2 MAR 2025, Source: https://www.npmjs.com/package/@react-native-async-storage/async-storage, https://github.com/react-native-async-storage/async-storage)
Created Setting Button on Home Screen:
    1. Stored Phone Number using Async Storage (Download Command: npm i @react-native-async-storage/async-storage)