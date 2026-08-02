import "server-only";
import QRCode from "qrcode";

/**
 * Generate QR code sebagai string SVG mentah (bisa langsung ditaruh di
 * dangerouslySetInnerHTML). Dijalankan di server — nggak nambah bundle JS
 * ke client sama sekali, dan hasilnya konsisten bagus buat dicetak.
 */
export async function buatSvgQr(teks: string): Promise<string> {
  return QRCode.toString(teks, {
    type: "svg",
    margin: 0,
    color: { dark: "#1c2420", light: "#00000000" },
  });
}
