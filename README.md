# Ludo Arena (Online + Admin + Android)
Virtual coins only. Koi real paisa nahi.

## 1. Server chalao (PC par test)
    node server.js          # http://localhost:3000
- Game: http://localhost:3000   Admin: http://localhost:3000/admin.html
- Admin password badlo:  ADMIN_PASS=meraPassword node server.js   (default admin123, zaroor badlo)

## 2. Internet par daalo (free hosting: Render / Railway)
1. Ye folder GitHub par daalo.  2. Render mein "New Web Service" -> Build: (khali) -> Start: `node server.js`.
3. Environment variable: ADMIN_PASS = apna password.  4. Mile hue https URL ko yaad rakho.
Note: free plan par data.json kabhi reset ho sakta hai; sthayi data ke liye Render "Disk" jodo aur DATA_DIR us path par set karo.

## 3. APK banao
1. android-app/capacitor.config.json mein "url" ko apne server ke https URL se badlo.
2. Terminal: cd android-app && npm install && npx cap add android && npx cap sync
3. Android Studio mein kholo: npx cap open android -> Build > Build APK(s).  (Ya GitHub Actions / Codemagic se cloud build.)
Play Store ke liye signed release build aur privacy policy chahiye.
