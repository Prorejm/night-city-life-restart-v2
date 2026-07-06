export default function ScanLines() {
  return (
    <>
      {/* Horizontal scan line overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9998 }}
        aria-hidden="true"
      >
        <div
          className="w-full h-full"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.08) 2px,
              rgba(0, 0, 0, 0.08) 4px
            )`,
          }}
        />
      </div>

      {/* Animated scanning beam */}
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 9998,
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 247, 0.04), transparent)',
          animation: 'scanline 8s linear infinite',
        }}
        aria-hidden="true"
      />

      {/* Subtle flicker animation */}
      <style>{`
        @keyframes crt-flicker {
          0% { opacity: 1; }
          50% { opacity: 0.998; }
          100% { opacity: 1; }
        }
        .crt-flicker {
          animation: crt-flicker 0.15s infinite;
        }
      `}</style>
    </>
  );
}
