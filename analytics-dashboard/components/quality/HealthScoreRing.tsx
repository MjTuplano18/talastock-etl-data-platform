'use client'

interface HealthScoreRingProps {
  score: number   // 0–100
  size?: number
}

export function HealthScoreRing({ score, size = 96 }: HealthScoreRingProps) {
  const r      = (size / 2) - 8
  const circ   = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  const color = score >= 90 ? '#4ADE80'
    : score >= 70 ? '#FBBF24'
    : '#F87171'

  const glow = score >= 90 ? '0 0 12px #4ADE8066'
    : score >= 70 ? '0 0 12px #FBBF2466'
    : '0 0 12px #F8717166'

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={6}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease',
            filter: `drop-shadow(${glow})`,
          }}
        />
      </svg>
      {/* Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
          / 100
        </span>
      </div>
    </div>
  )
}
