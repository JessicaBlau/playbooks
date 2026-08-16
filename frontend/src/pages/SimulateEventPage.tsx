import { useState } from 'react';
import { simulateTrigger, type SimulationMatch } from '../api/simulate';
import { ApiError } from '../api/client';
import { TRIGGER_LABELS, type Trigger } from '../types/domain';
import { TriggerSelect } from '../components/TriggerSelect';
import { SimulationResultList } from '../components/SimulationResultList';
import { ErrorBanner } from '../components/ErrorBanner';

export function SimulateEventPage() {
  const [trigger, setTrigger] = useState<Trigger | ''>('');
  const [matches, setMatches] = useState<SimulationMatch[] | null>(null);
  // The trigger the current `matches` actually belong to (from the response,
  // not just `trigger`) — used both to label the results and to detect
  // staleness, since the two can otherwise drift apart in the moment between
  // changing the dropdown and the next simulate call resolving.
  const [resultsTrigger, setResultsTrigger] = useState<Trigger | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleTriggerChange(next: Trigger) {
    setTrigger(next);
    // Previous results are for a different trigger now — showing them under
    // the newly-selected dropdown value would misrepresent which playbooks
    // actually match it.
    setMatches(null);
    setResultsTrigger(null);
  }

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
      setResultsTrigger(result.trigger);
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
        <TriggerSelect id="simulate-trigger" value={trigger} onChange={handleTriggerChange} />
        <button type="button" onClick={handleSimulate} disabled={submitting}>
          {submitting ? 'Simulating…' : 'Simulate'}
        </button>
      </div>

      {matches !== null && resultsTrigger !== null && (
        <div>
          <h2>Playbooks matching {TRIGGER_LABELS[resultsTrigger]}</h2>
          <SimulationResultList matches={matches} />
        </div>
      )}
    </div>
  );
}
