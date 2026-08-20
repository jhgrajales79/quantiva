import clsx from "clsx";

// Partículas dispuestas con el ángulo dorado (137.508°) en vez de al azar:
// da una distribución dispersa y pareja como la de la imagen de referencia
// (logo.png, un paquete de energía/partícula rodeado de un halo de puntos),
// pero es 100% determinista — necesario para que el render del servidor y
// el del cliente coincidan exactamente (Math.random() en cada render
// rompería la hidratación).
const GOLDEN_ANGLE = 137.508;
const PARTICLE_COUNT = 22;
// Redondeado a 2 decimales: Math.cos/Math.sin dan floats con muchos
// decimales que a veces serializan a un string ligerísimamente distinto
// entre el render del servidor y el del cliente (mismo valor, última cifra
// distinta), lo que React reporta como un mismatch de hidratación. La
// diferencia visual de redondear a centésimas es nula.
const round2 = (n: number) => Math.round(n * 100) / 100;
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i * GOLDEN_ANGLE * Math.PI) / 180;
  const radius = 15 + (i % 5) * 5.2;
  return {
    x: round2(50 + radius * Math.cos(angle)),
    y: round2(50 + radius * Math.sin(angle)),
    r: round2(0.7 + (i % 3) * 0.45),
    o: round2(0.35 + (i % 4) * 0.16),
    delay: round2((i % 6) * 0.35),
  };
});

/**
 * Logo animado de Quantiva: una partícula/paquete de energía localizado
 * (basado en logo.png en la raíz del repo) — un núcleo brillante rodeado de
 * un halo de partículas en verde de marca, con movimiento sutil constante
 * (pulso del núcleo, rotación lenta del halo, centelleo de partículas) para
 * transmitir la idea de energía activa, no una imagen estática.
 */
export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx("quantiva-logo relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <radialGradient id="quantiva-logo-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f0fff8" />
            <stop offset="40%" stopColor="var(--color-positive)" />
            <stop offset="100%" stopColor="var(--color-brand)" />
          </radialGradient>
          <filter id="quantiva-logo-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>

        {/* Trayectorias tenues, como rastros de una colisión de partículas. */}
        <g stroke="var(--color-brand)" strokeOpacity="0.4" strokeWidth="1.4" strokeDasharray="2.2 3.4">
          <line x1="50" y1="50" x2="96" y2="14" />
          <line x1="50" y1="50" x2="98" y2="50" />
        </g>

        {/* Resplandor exterior difuso, pulsante. */}
        <circle
          className="quantiva-logo-halo"
          cx="50"
          cy="50"
          r="26"
          fill="var(--color-brand)"
          opacity="0.22"
          filter="url(#quantiva-logo-blur)"
        />

        {/* Halo de partículas, rotando lentamente y centelleando. */}
        <g className="quantiva-logo-particles">
          {PARTICLES.map((p, i) => (
            <circle
              key={i}
              className="quantiva-logo-dot"
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="var(--color-brand)"
              style={
                {
                  "--dot-o": p.o,
                  opacity: p.o,
                  animationDelay: `${p.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </g>

        {/* Núcleo brillante — el "paquete de energía" localizado. */}
        <circle className="quantiva-logo-core" cx="50" cy="50" r="15" fill="url(#quantiva-logo-core)" />
      </svg>
    </span>
  );
}
