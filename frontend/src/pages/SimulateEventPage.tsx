import { useState } from 'react';
import { simulateTrigger, type SimulationMatch } from '../api/simulate';
import { ApiError } from '../api/client';
import type { Trigger } from '../types/domain';
import { TriggerSelect } from '../components/TriggerSelect';
import { SimulationResultList } from '../components/SimulationResultList';
import { ErrorBanner } from '../components/ErrorBanner';

export function SimulateEventPage() {
  const [trigger, setTrigger] = useState<Trigger | ''>('');
  const [matches, setMatches] = useState<SimulationMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSimulate() {
    if (!trigger) {
      setError('Please select a trigger.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await simulateTrigger(trigger);
      setMatches(result.matches);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Simulation failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Simulate Event</h1>
      <ErrorBanner message={error} />

      <div>
        <label htmlFor="simulate-trigger">Trigger</label>
        <TriggerSelect id="simulate-trigger" value={trigger} onChange={setTrigger} />
        <button type="button" onClick={handleSimulate} disabled={submitting}>
          {submitting ? 'Simulating…' : 'Simulate'}
        </button>
      </div>

      {matches !== null && (
        <div>
          <h2>Results</h2>
          <SimulationResultList matches={matches} />
        </div>
      )}
    </div>
  );
}
