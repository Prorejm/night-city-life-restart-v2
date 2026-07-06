export default function Vignette() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 9997,
        background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.7) 100%)',
      }}
      aria-hidden="true"
    />
  );
}
