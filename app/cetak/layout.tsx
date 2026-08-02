export default function CetakLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper p-6 print:bg-white print:p-0">
      {children}
    </div>
  );
}
