import "./globals.css";

export const metadata = {
  title: "Sierra Nevada Rentacar — Demo",
  description: "Panel de control de flota y conversaciones (base Airtable de demostración)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
