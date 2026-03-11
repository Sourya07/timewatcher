// ─── Base URL ──────────────────────────────────────────────────────────────────
// Switch PROD_URL to your Render deployment.
// When __DEV__ is true (running via Expo Go / simulator), LOCAL_URL is used.
// ⚠️  Run `ipconfig getifaddr en0` in your terminal and paste the result below.
//     Your phone and Mac must be on the SAME Wi-Fi network.
const LOCAL_IP = '192.168.29.237'; // <-- Replace with YOUR Mac's LAN IP
const LOCAL_URL = `http://${LOCAL_IP}:3000`;
const PROD_URL  = 'https://timewatcher.onrender.com';

// export const BASE_URL = __DEV__ ? LOCAL_URL : PROD_URL;
export const BASE_URL = PROD_URL;
console.log(PROD_URL)