import { useState, type FormEvent } from 'react';
import { ALLOWED_ACTIONS, ACTION_LABELS, type Action, type Trigger } from '../types/domain';
import { TriggerSelect } from './TriggerSelect';
import { ErrorBanner } from './ErrorBanner';

interface PlaybookFormProps {
  // Returns whether the create succeeded, so the form can decide whether to
  // clear the user's input — it must NOT reset on failure (e.g. a 400 from
  // an over-length name), or the user loses everything they typed.
  onSubmit: (name: string, trigger: Trigger, actions: Action[]) => Promise<boolean>;
}

const MAX_NAME_LENGTH = 100;

const MAX_ACTIONS = 3;

export function PlaybookForm({ onSubmit }: PlaybookFormProps) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<Trigger | ''>('');
  const [actions, setActions] = useState<Action[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleAction(action: Action) {
    setActions((current) => {
      if (current.includes(action)) {
        return current.filter((a) => a !== action);
      }
      if (current.length >= MAX_ACTIONS) {
        return current;
      }
      return [...current, action];
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (name.trim().length === 0) {
      setValidationError('Name is required.');
      return;
    }
    if (!trigger) {
      setValidationError('Please select a trigger.');
      return;
    }
    if (actions.length === 0) {
      setValidationError('Select at least 1 action.');
      return;
    }

    setSubmitting(true);
    try {
      const succeeded = await onSubmit(name.trim(), trigger, actions);
      if (succeeded) {
        setName('');
        setTrigger('');
        setActions([]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="playbook-name">Name</label>
        <input
          id="playbook-name"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="trigger">Trigger</label>
        <TriggerSelect value={trigger} onChange={setTrigger} />
      </div>

      <fieldset>
        <legend>Actions (choose 1-3)</legend>
        {ALLOWED_ACTIONS.map((action) => {
          const checked = actions.includes(action);
          const disabled = !checked && actions.length >= MAX_ACTIONS;
          return (
            <label key={action}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleAction(action)}
              />
              {ACTION_LABELS[action]}
            </label>
          );
        })}
      </fieldset>

      <ErrorBanner message={validationError} />

      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create Playbook'}
      </button>
    </form>
  );
}
