import { ALLOWED_TRIGGERS, TRIGGER_LABELS, type Trigger } from '../types/domain';

interface TriggerSelectProps {
  value: Trigger | '';
  onChange: (trigger: Trigger) => void;
  id?: string;
}

export function TriggerSelect({ value, onChange, id = 'trigger' }: TriggerSelectProps) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as Trigger)}>
      <option value="" disabled>
        Select a trigger
      </option>
      {ALLOWED_TRIGGERS.map((trigger) => (
        <option key={trigger} value={trigger}>
          {TRIGGER_LABELS[trigger]}
        </option>
      ))}
    </select>
  );
}
