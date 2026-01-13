# Mobile Remote Debugging Guide

This guide will help you debug your web app on mobile devices.

## Option 1: Chrome DevTools (Android - Recommended)

### Prerequisites:
- Android device with Chrome browser
- Windows/Mac/Linux computer with Chrome browser
- USB cable to connect your device
- USB debugging enabled on Android

### Steps:

1. **Enable USB Debugging on Android:**
   - Go to **Settings** > **About phone**
   - Tap **Build number** 7 times to enable Developer options
   - Go back to **Settings** > **Developer options**
   - Enable **USB debugging**
   - Connect your Android device to your computer via USB
   - On your Android device, accept the USB debugging prompt

2. **Open Chrome DevTools:**
   - Open Chrome on your computer
   - Navigate to `chrome://inspect` or `chrome://inspect/#devices`
   - You should see your device listed under "Remote Target"

3. **Debug Your App:**
   - Open your app in Chrome on your Android device: `http://192.168.1.6:8080`
   - In Chrome DevTools on your computer, click **Inspect** next to your device
   - A new DevTools window will open showing the mobile view
   - You can now:
     - View console logs
     - Inspect elements
     - Debug JavaScript
     - Test network requests
     - View performance metrics

4. **Live Reload:**
   - The DevTools connection stays active
   - Changes in your code will reload on the mobile device
   - You can see errors and logs in real-time

## Option 2: Safari Web Inspector (iOS)

### Prerequisites:
- iPhone or iPad with Safari
- Mac computer with Safari
- Lightning/USB-C cable
- Web Inspector enabled on iOS

### Steps:

1. **Enable Web Inspector on iOS:**
   - Go to **Settings** > **Safari** > **Advanced**
   - Enable **Web Inspector**

2. **Connect iOS Device:**
   - Connect your iPhone/iPad to your Mac via USB
   - Unlock your device and trust the computer if prompted

3. **Open Safari on Mac:**
   - Open Safari on your Mac
   - Go to **Safari** > **Settings** > **Advanced**
   - Check **Show features for web developers**
   - Go to **Develop** menu in Safari
   - You should see your iOS device listed

4. **Debug Your App:**
   - Open your app in Safari on your iOS device: `http://192.168.1.6:8080`
   - On your Mac, go to **Develop** > **[Your Device Name]** > **[Your Website]**
   - Safari Web Inspector will open showing the mobile view
   - You can now debug just like in Chrome DevTools

## Option 3: Eruda (Browser Console for Mobile)

If you can't use remote debugging, you can use Eruda - an in-browser console.

### Steps:

1. **Add Eruda to your app temporarily:**
   - Add this script to `index.html` before the closing `</body>` tag:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
   <script>eruda.init();</script>
   ```

2. **Access Console:**
   - The console will appear as a floating button on your mobile screen
   - Tap it to open the console
   - You can view logs, errors, and interact with elements

3. **Remove after debugging:**
   - Don't forget to remove Eruda before deploying to production

## Option 4: Remote Debugging with Edge (Windows)

If you're using Windows and Edge browser:

1. **Enable USB Debugging** (same as Chrome)
2. Open Edge and go to `edge://inspect`
3. Follow the same steps as Chrome DevTools

## Quick Tips:

- **Network Issues:** Make sure your mobile device and computer are on the same WiFi network
- **Firewall:** Windows Firewall might block connections - allow Node.js through firewall
- **HTTPS:** Some features require HTTPS (local development might have limitations)
- **Console Logging:** Use `console.log()`, `console.error()`, etc. - they'll appear in remote DevTools
- **Breakpoints:** You can set breakpoints in DevTools to pause execution
- **Network Tab:** Check if requests are failing or slow
- **Elements Tab:** Inspect CSS and see why elements might not be visible

## Common Issues:

1. **"No devices found"** - Check USB connection and USB debugging settings
2. **"Site can't be reached"** - Verify IP address and port, check firewall
3. **"Connection refused"** - Make sure Vite dev server is running with `host: "0.0.0.0"`
4. **Console not showing logs** - Make sure you're looking at the right tab in DevTools
