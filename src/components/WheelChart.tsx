import React from 'react';

interface WheelChartProps {
  bodyScore: number;
  mindScore: number;
  heartScore: number;
  soulScore: number;
  centerValue: string | number;
  centerLabel: string;
}

const MAX = { body: 40, mind: 20, heart: 10, soul: 10 };

export const WheelChart: React.FC<WheelChartProps> = ({
  bodyScore,
  mindScore,
  heartScore,
  soulScore,
  centerValue,
  centerLabel,
}) => {
  const p = [
    Math.max(0, Math.min(1, bodyScore / MAX.body)),
    Math.max(0, Math.min(1, mindScore / MAX.mind)),
    Math.max(0, Math.min(1, heartScore / MAX.heart)),
    Math.max(0, Math.min(1, soulScore / MAX.soul)),
  ];

  const gradient = `conic-gradient(
    var(--body) 0 ${p[0] * 25}%, var(--track) ${p[0] * 25}% 25%,
    var(--mind) 25% ${25 + p[1] * 25}%, var(--track) ${25 + p[1] * 25}% 50%,
    var(--heart) 50% ${50 + p[2] * 25}%, var(--track) ${50 + p[2] * 25}% 75%,
    var(--soul) 75% ${75 + p[3] * 25}%, var(--track) ${75 + p[3] * 25}% 100%
  )`;

  return (
    <div className="wheel" style={{ background: gradient }}>
      <div className="wheel-center">
        <b>{centerValue}</b>
        <small>{centerLabel}</small>
      </div>
    </div>
  );
};
