import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.notexia.app',
  appName: 'Notexia',
  webDir: 'out',
  server: {
    url: 'https://notexia.in',
    cleartext: false,
  },
};

export default config;