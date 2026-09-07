import os from 'os';
import QRCode from 'qrcode';

export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Ignorar direcciones internas (127.0.0.1) y no-IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

export async function generateQrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#2D2926',
      light: '#FFFFFF'
    },
    width: 320
  });
}
