import './globals.css';

export const metadata = {
  title: 'IV/HV Options Screener',
  description:
    'Find cheap option volatility: implied vs realized (IV/HV), Greeks, and breakeven for US stocks.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
