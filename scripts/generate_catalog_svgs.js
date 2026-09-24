import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Map of 50 apps with their authentic brand SVG markup
const appIcons = [
  {
    file: 'whatsapp.svg',
    color: '#25D366',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#25D366"/>
  <path fill="#ffffff" d="M34.5 28.2c-.5-.3-3.1-1.5-3.6-1.7-.5-.2-.8-.3-1.2.3-.3.5-1.3 1.7-1.6 2-.3.3-.6.4-1.2.1-.5-.3-2.3-.8-4.3-2.6-1.6-1.4-2.7-3.2-3-3.7-.3-.5 0-.8.2-1.1.2-.2.5-.6.8-.9.2-.3.3-.5.5-.9.1-.3 0-.7-.1-.9-.2-.3-1.2-2.9-1.6-3.9-.4-1-.8-.9-1.2-.9h-1c-.3 0-.9.1-1.4.6-.5.6-1.9 1.9-1.9 4.6s2 5.3 2.2 5.6c.3.4 3.8 5.8 9.3 8.2 1.3.6 2.3.9 3.1 1.2 1.3.4 2.5.4 3.5.2 1.1-.2 3.1-1.3 3.6-2.5.4-1.2.4-2.3.3-2.5-.2-.2-.5-.4-1.1-.7z"/>
</svg>`
  },
  {
    file: 'instagram.svg',
    color: '#E1306C',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <defs>
    <radialGradient id="igG" cx="20%" cy="100%" r="120%">
      <stop offset="0%" stop-color="#fdf497"/>
      <stop offset="20%" stop-color="#fdf497"/>
      <stop offset="40%" stop-color="#fd5949"/>
      <stop offset="60%" stop-color="#d6249f"/>
      <stop offset="100%" stop-color="#285AEB"/>
    </radialGradient>
  </defs>
  <rect width="44" height="44" x="2" y="2" rx="12" fill="url(#igG)"/>
  <rect width="28" height="28" x="10" y="10" rx="8" fill="none" stroke="#fff" stroke-width="3"/>
  <circle cx="24" cy="24" r="7" fill="none" stroke="#fff" stroke-width="3"/>
  <circle cx="31.5" cy="16.5" r="2" fill="#fff"/>
</svg>`
  },
  {
    file: 'youtube.svg',
    color: '#FF0000',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="32" x="2" y="8" rx="8" fill="#FF0000"/>
  <polygon points="20,16 32,24 20,32" fill="#FFFFFF"/>
</svg>`
  },
  {
    file: 'phonepe.svg',
    color: '#5F259F',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#5F259F"/>
  <path fill="#ffffff" d="M19 14h6c4 0 7 2.5 7 6.5s-3 6.5-7 6.5h-2v7h-4V14zm4 9h2c1.8 0 3-1 3-2.5s-1.2-2.5-3-2.5h-2v5z"/>
  <circle cx="32" cy="18" r="3" fill="#00D2B4"/>
</svg>`
  },
  {
    file: 'google-pay.svg',
    color: '#1A73E8',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#FFFFFF"/>
  <path fill="#4285F4" d="M22 24c0-.7-.1-1.3-.2-2H13v3.8h5.1c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7.1z"/>
  <path fill="#34A853" d="M13 33c2.7 0 5-.9 6.6-2.4l-3.1-2.4c-.9.6-2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H4v2.5C5.7 30.8 9.1 33 13 33z"/>
  <path fill="#FBBC05" d="M7.2 24.9c-.2-.6-.3-1.3-.3-1.9s.1-1.3.3-1.9V18.6H4c-.7 1.4-1.1 3-1.1 4.7s.4 3.3 1.1 4.7l3.2-2.5z"/>
  <path fill="#EA4335" d="M13 17.2c1.5 0 2.8.5 3.8 1.5l2.8-2.8C18 14.3 15.7 13.5 13 13.5 9.1 13.5 5.7 15.7 4 18.6l3.2 2.5c.8-2.5 3.1-4.3 5.8-4.3z"/>
  <text x="24" y="29" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#5F6368">Pay</text>
</svg>`
  },
  {
    file: 'facebook.svg',
    color: '#1877F2',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#1877F2"/>
  <path fill="#ffffff" d="M29.5 24h-4v14h-6V24h-3v-5h3v-3.5C19.5 12.5 21.8 10 26 10h4v5h-2.5c-1.2 0-1.5.6-1.5 1.5V19h4.5l-.5 5z"/>
</svg>`
  },
  {
    file: 'flipkart.svg',
    color: '#2874F0',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#2874F0"/>
  <path fill="#FFE500" d="M16 14h16l-3 18H19z"/>
  <path fill="#FFFFFF" d="M21 21h6v3h-6z M21 27h4v3h-4z"/>
  <circle cx="20" cy="36" r="2" fill="#FFE500"/>
  <circle cx="28" cy="36" r="2" fill="#FFE500"/>
</svg>`
  },
  {
    file: 'amazon.svg',
    color: '#FF9900',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#232F3E"/>
  <text x="14" y="27" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">a</text>
  <path fill="#FF9900" d="M12 33c8 5 18 3 24-2 .4-.3 0-.7-.4-.5-5.5 3-15 3.5-23 .5-.4-.2-.8.1-.6.5z"/>
</svg>`
  },
  {
    file: 'truecaller.svg',
    color: '#0087FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#0087FF"/>
  <path fill="#ffffff" d="M30 32c-6 3-14-5-17-11 2-2 4-2 5 0 1 2 2 3 1 4-1 1-1 2 0 3 2 2 4 4 6 5 1 1 2 1 3 0 1-1 2 0 4 1 2 1 2 3 0 5-.6.6-1.2 1.3-2 1.5z"/>
</svg>`
  },
  {
    file: 'google-maps.svg',
    color: '#34A853',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#FFFFFF"/>
  <path fill="#EA4335" d="M24 8c-6.6 0-12 5.4-12 12 0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
</svg>`
  },
  {
    file: 'snapchat.svg',
    color: '#FFFC00',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#FFFC00"/>
  <path fill="#ffffff" stroke="#000" stroke-width="1.5" d="M24 12c-5 0-8 3.5-8 7.5 0 2 .5 4 1 5-.5.5-2 1-3 1.5-.5.2-.5 1 0 1.2 2 .5 3 2 3.5 3 .5 1-1 2-2.5 2.5-.5.2-.5 1 0 1.2 2 .5 5 .5 9 .5s7 0 9-.5c.5-.2.5-1 0-1.2-1.5-.5-3-1.5-2.5-2.5.5-1 1.5-2.5 3.5-3 .5-.2.5-1 0-1.2-1-.5-2.5-1-3-1.5.5-1 1-3 1-5 0-4-3-7.5-8-7.5z"/>
</svg>`
  },
  {
    file: 'paytm.svg',
    color: '#00B9F5',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#FFFFFF"/>
  <text x="8" y="29" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#002E6E">Pay</text>
  <text x="28" y="29" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#00B9F5">tm</text>
</svg>`
  },
  {
    file: 'zomato.svg',
    color: '#CB202D',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#CB202D"/>
  <text x="24" y="31" font-family="'Brush Script MT', cursive, sans-serif" font-size="24" font-weight="bold" fill="#FFFFFF" text-anchor="middle">zomato</text>
</svg>`
  },
  {
    file: 'swiggy.svg',
    color: '#FC8019',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#FC8019"/>
  <path fill="#ffffff" d="M24 10c-5.5 0-9 4-9 9 0 6.5 9 19 9 19s9-12.5 9-19c0-5-3.5-9-9-9zm-1 5c1 0 2 .8 2 2 0 1.2-1 2-2 2s-2-.8-2-2c0-1.2 1-2 2-2z"/>
</svg>`
  },
  {
    file: 'blinkit.svg',
    color: '#F8CB46',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#F8CB46"/>
  <text x="24" y="30" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#0C831F" text-anchor="middle">blinkit</text>
</svg>`
  },
  {
    file: 'jiocinema.svg',
    color: '#D9006C',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#D9006C"/>
  <polygon points="18,14 34,24 18,34" fill="#FFFFFF"/>
</svg>`
  },
  {
    file: 'spotify.svg',
    color: '#1DB954',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#1DB954"/>
  <path fill="#000" d="M33 21c-4-2.5-11-2.7-15-1.5-.7.2-1.4-.2-1.6-.8-.2-.7.2-1.4.8-1.6 4.8-1.5 12.5-1.2 17.2 1.6.6.4.8 1.2.4 1.8-.4.6-1.2.9-1.8.5zm-.5 5.5c-.5.7-1.3 1-2 .5-3.6-2.2-9-2.8-13.3-1.6-.8.2-1.6-.3-1.8-1-.2-.8.3-1.6 1-1.8 4.8-1.4 10.8-.7 15 1.9.7.4 1 1.3.5 2zm-1.8 5.4c-.4.6-1.1.8-1.7.4-3-1.8-6.9-2.3-11.4-1.3-.7.2-1.3-.3-1.5-.9-.2-.7.3-1.3.9-1.5 5-1.1 9.3-.6 12.7 1.5.6.4.8 1.2.4 1.8z"/>
</svg>`
  },
  {
    file: 'telegram.svg',
    color: '#26A5E4',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#26A5E4"/>
  <path fill="#ffffff" d="M12 23.5l22-8.5c1-.4 2 .3 1.7 1.3l-3.8 18c-.3 1.2-1.5 1.5-2.4.9l-6.5-4.8-3.1 3c-.3.4-.7.6-1.2.6l.5-6.5 11.8-10.7c.5-.4-.1-.7-.7-.3L19.8 26l-6.3-2c-1.4-.4-1.4-1.4.3-2z"/>
</svg>`
  },
  {
    file: 'meesho.svg',
    color: '#F43397',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#F43397"/>
  <text x="24" y="31" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">m</text>
</svg>`
  },
  {
    file: 'disney-hotstar.svg',
    color: '#1259C3',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#0c111b"/>
  <polygon points="24,10 27,19 36,20 29,26 31,35 24,30 17,35 19,26 12,20 21,19" fill="#1259C3"/>
  <circle cx="24" cy="24" r="3" fill="#FFFFFF"/>
</svg>`
  },
  {
    file: 'digilocker.svg',
    color: '#0C4DA2',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#0C4DA2"/>
  <path fill="#ffffff" d="M16 20v-4c0-4.4 3.6-8 8-8s8 3.6 8 8v4h2v18H14V20h2zm4-4c0-2.2 1.8-4 4-4s4 1.8 4 4v4h-8v-4zm4 11c1.7 0 3 1.3 3 3 0 1.2-.7 2.3-1.8 2.8L26 35h-4l.8-2.2c-1.1-.5-1.8-1.6-1.8-2.8 0-1.7 1.3-3 3-3z"/>
</svg>`
  },
  {
    file: 'irctc-rail-connect.svg',
    color: '#F26522',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#F26522"/>
  <rect width="20" height="24" x="14" y="10" rx="4" fill="#FFFFFF"/>
  <rect width="14" height="10" x="17" y="13" rx="2" fill="#0D2C6C"/>
  <circle cx="18" cy="28" r="2" fill="#0D2C6C"/>
  <circle cx="30" cy="28" r="2" fill="#0D2C6C"/>
  <line x1="12" y1="36" x2="36" y2="36" stroke="#FFFFFF" stroke-width="2"/>
</svg>`
  },
  {
    file: 'uber.svg',
    color: '#000000',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#000000"/>
  <text x="24" y="29" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Uber</text>
</svg>`
  },
  {
    file: 'ola.svg',
    color: '#9ACD32',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#222222"/>
  <circle cx="24" cy="24" r="16" fill="#9ACD32"/>
  <circle cx="24" cy="24" r="9" fill="#222222"/>
</svg>`
  },
  {
    file: 'rapido.svg',
    color: '#F9A825',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#F9A825"/>
  <text x="24" y="30" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#222222" text-anchor="middle">Rapido</text>
</svg>`
  },
  {
    file: 'zepto.svg',
    color: '#5200FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#5200FF"/>
  <polygon points="26,10 16,25 24,25 20,38 32,22 24,22" fill="#FFC700"/>
</svg>`
  },
  {
    file: 'myntra.svg',
    color: '#FF3F6C',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#FFFFFF"/>
  <path fill="#FF3F6C" d="M12 30l6-16 4 10 4-10 6 16h-4l-4-10-3 8-3-8-4 10z"/>
</svg>`
  },
  {
    file: 'x-twitter.svg',
    color: '#000000',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#000000"/>
  <path fill="#ffffff" d="M14 12l8.2 11.2L13.5 34h2.5l7-9.4 6 9.4H35L26.3 22 34 12h-2.5l-6.4 8.5L19.5 12H14zm3.6 2h2.7l13 18h-2.7l-13-18z"/>
</svg>`
  },
  {
    file: 'linkedin.svg',
    color: '#0A66C2',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#0A66C2"/>
  <text x="14" y="26" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">in</text>
</svg>`
  },
  {
    file: 'jiosaavn.svg',
    color: '#2BC5B4',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#2BC5B4"/>
  <circle cx="24" cy="24" r="10" fill="#0A1E24"/>
  <circle cx="24" cy="24" r="4" fill="#2BC5B4"/>
</svg>`
  },
  {
    file: 'wynk-music.svg',
    color: '#E60000',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#E60000"/>
  <path fill="#ffffff" d="M14 16h5v12a4 4 0 1 1-4-4v-8zm11 0h5v12a4 4 0 1 1-4-4v-8z"/>
</svg>`
  },
  {
    file: 'youtube-music.svg',
    color: '#FF0000',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#FF0000"/>
  <circle cx="24" cy="24" r="14" fill="#000000"/>
  <polygon points="21,17 30,24 21,31" fill="#FFFFFF"/>
</svg>`
  },
  {
    file: 'netflix.svg',
    color: '#E50914',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#000000"/>
  <path fill="#E50914" d="M16 10h5v28h-5z M27 10h5v28h-5z"/>
  <polygon points="16,10 21,10 32,38 27,38" fill="#B20710"/>
</svg>`
  },
  {
    file: 'amazon-prime-video.svg',
    color: '#00A8E1',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#00A8E1"/>
  <polygon points="20,16 32,24 20,32" fill="#FFFFFF"/>
</svg>`
  },
  {
    file: 'inshot.svg',
    color: '#FF4D67',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#FF4D67"/>
  <rect width="24" height="24" x="12" y="12" rx="6" fill="#FFFFFF"/>
  <circle cx="24" cy="24" r="6" fill="#FF4D67"/>
</svg>`
  },
  {
    file: 'capcut.svg',
    color: '#000000',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#000000"/>
  <polygon points="14,14 24,24 14,34" fill="#FFFFFF"/>
  <polygon points="34,14 24,24 34,34" fill="#FFFFFF"/>
</svg>`
  },
  {
    file: 'canva.svg',
    color: '#00C4CC',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#00C4CC"/>
  <text x="24" y="32" font-family="'Brush Script MT', cursive, sans-serif" font-size="28" font-weight="bold" fill="#FFFFFF" text-anchor="middle">C</text>
</svg>`
  },
  {
    file: 'chatgpt.svg',
    color: '#10A37F',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#10A37F"/>
  <circle cx="24" cy="24" r="10" fill="none" stroke="#FFFFFF" stroke-width="3"/>
  <circle cx="24" cy="24" r="4" fill="#FFFFFF"/>
</svg>`
  },
  {
    file: 'adobe-scan.svg',
    color: '#FA0F00',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#FA0F00"/>
  <polygon points="14,34 24,14 34,34 28,34 24,24 20,34" fill="#FFFFFF"/>
</svg>`
  },
  {
    file: 'pinterest.svg',
    color: '#E60023',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#E60023"/>
  <text x="24" y="33" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#FFFFFF" text-anchor="middle">P</text>
</svg>`
  },
  {
    file: 'messenger.svg',
    color: '#0084FF',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#0084FF"/>
  <polygon points="14,26 21,18 26,24 33,18 26,28 21,22" fill="#FFFFFF"/>
</svg>`
  },
  {
    file: 'maadhaar.svg',
    color: '#005A9C',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#005A9C"/>
  <circle cx="24" cy="24" r="12" fill="#F37021"/>
  <circle cx="24" cy="24" r="6" fill="#005A9C"/>
</svg>`
  },
  {
    file: 'makemytrip.svg',
    color: '#EA2327',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#EA2327"/>
  <text x="24" y="29" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF" text-anchor="middle">MMT</text>
</svg>`
  },
  {
    file: 'bookmyshow.svg',
    color: '#E51837',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#E51837"/>
  <text x="24" y="29" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">BMS</text>
</svg>`
  },
  {
    file: 'nykaa.svg',
    color: '#FC2779',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#FC2779"/>
  <text x="24" y="30" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#FFFFFF" text-anchor="middle">NYKAA</text>
</svg>`
  },
  {
    file: 'ajio.svg',
    color: '#2C4152',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#2C4152"/>
  <text x="24" y="30" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle">AJIO</text>
</svg>`
  },
  {
    file: 'lenskart.svg',
    color: '#000042',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#000042"/>
  <circle cx="17" cy="24" r="6" fill="none" stroke="#00BA9D" stroke-width="3"/>
  <circle cx="31" cy="24" r="6" fill="none" stroke="#00BA9D" stroke-width="3"/>
  <line x1="23" y1="24" x2="25" y2="24" stroke="#00BA9D" stroke-width="3"/>
</svg>`
  },
  {
    file: 'bigbasket.svg',
    color: '#84C225',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#84C225"/>
  <text x="24" y="30" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#E2231A" text-anchor="middle">bb</text>
</svg>`
  },
  {
    file: 'google-drive.svg',
    color: '#1FA463',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#FFFFFF"/>
  <polygon points="18,12 30,12 39,28 27,28" fill="#FFBA00"/>
  <polygon points="9,28 18,12 24,22 15,38" fill="#2684FC"/>
  <polygon points="15,38 33,38 39,28 21,28" fill="#00AC47"/>
</svg>`
  },
  {
    file: 'yono-sbi.svg',
    color: '#280071',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#280071"/>
  <circle cx="24" cy="24" r="14" fill="#00A5DF"/>
  <circle cx="24" cy="20" r="4" fill="#280071"/>
  <rect width="4" height="12" x="22" y="20" fill="#280071"/>
</svg>`
  },
  {
    file: 'chrome.svg',
    color: '#3B82F6',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#EA4335"/>
  <circle cx="24" cy="24" r="14" fill="#FBBC05"/>
  <circle cx="24" cy="24" r="8" fill="#34A853"/>
  <circle cx="24" cy="24" r="6" fill="#4285F4"/>
</svg>`
  },
  {
    file: 'camera.svg',
    color: '#10B981',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#10B981"/>
  <path fill="#ffffff" d="M16 16h3l2-3h6l2 3h3c2.2 0 4 1.8 4 4v12c0 2.2-1.8 4-4 4H16c-2.2 0-4-1.8-4-4V20c0-2.2 1.8-4 4-4zm8 17c3.9 0 7-3.1 7-7s-3.1-7-7-7-7 3.1-7 7 3.1 7 7 7zm0-3c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
</svg>`
  },
  {
    file: 'calculator.svg',
    color: '#F59E0B',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#F59E0B"/>
  <rect width="28" height="8" x="10" y="10" rx="2" fill="#FFFFFF"/>
  <circle cx="15" cy="26" r="2" fill="#FFFFFF"/>
  <circle cx="24" cy="26" r="2" fill="#FFFFFF"/>
  <circle cx="33" cy="26" r="2" fill="#FFFFFF"/>
  <circle cx="15" cy="34" r="2" fill="#FFFFFF"/>
  <circle cx="24" cy="34" r="2" fill="#FFFFFF"/>
  <circle cx="33" cy="34" r="2" fill="#FFFFFF"/>
</svg>`
  },
  {
    file: 'settings.svg',
    color: '#64748B',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="44" height="44" x="2" y="2" rx="12" fill="#334155"/>
  <circle cx="24" cy="24" r="6" fill="#FFFFFF"/>
  <circle cx="24" cy="24" r="3" fill="#334155"/>
</svg>`
  },
  {
    file: 'clock.svg',
    color: '#0284C7',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="22" fill="#0284C7"/>
  <circle cx="24" cy="24" r="16" fill="#FFFFFF"/>
  <line x1="24" y1="24" x2="24" y2="14" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="24" y1="24" x2="31" y2="24" stroke="#0284C7" stroke-width="2" stroke-linecap="round"/>
</svg>`
  }
];

let created = 0;
for (const icon of appIcons) {
  const filePath = path.join(outDir, icon.file);
  fs.writeFileSync(filePath, icon.svg.trim() + '\n', 'utf8');
  created++;
}

console.log(`Successfully generated ${created} SVG catalog icon assets in ${outDir}`);
