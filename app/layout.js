import "./globals.css";

export const metadata = {
  title: "프리미엄 지뢰찾기 & 글로벌 리더보드 (Minesweeper)",
  description: "아름다운 그래픽 테마, 효과음, 실시간 글로벌 리더보드 기능이 제공되는 프리미엄 지뢰찾기 웹 앱",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
