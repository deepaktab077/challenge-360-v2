import React from 'react';

interface ChoiceOption {
  label: string;
  value: number;
}

interface ChoiceGroupProps {
  options: ChoiceOption[];
  value: number;
  onChange: (value: number) => void;
}

export const ChoiceGroup: React.FC<ChoiceGroupProps> = ({ options, value, onChange }) => (
  <div className="choices">
    {options.map((opt) => (
      <button
        key={opt.label}
        type="button"
        className={`choice ${value === opt.value ? 'on' : ''}`}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

interface ToggleLineProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ToggleLine: React.FC<ToggleLineProps> = ({ label, checked, onChange }) => (
  <div className="toggleline">
    <span>{label}</span>
    <div className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} />
  </div>
);

interface ProgressRowProps {
  label: string;
  value: number;
  max: number;
  color: string; // css var, e.g. 'var(--body)'
}

export const ProgressRow: React.FC<ProgressRowProps> = ({ label, value, max, color }) => (
  <div className="prow">
    <b>{label}</b>
    <div className="bar">
      <i style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
    <span>
      {value}/{max}
    </span>
  </div>
);
