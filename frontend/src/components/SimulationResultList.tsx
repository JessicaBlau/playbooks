import { ACTION_LABELS } from '../types/domain';
import type { SimulationMatch } from '../api/simulate';

export function SimulationResultList({ matches }: { matches: SimulationMatch[] }) {
  if (matches.length === 0) {
    return <p>No playbooks match this trigger.</p>;
  }

  return (
    <ul>
      {matches.map((match) => (
        <li key={match.id}>
          <strong>{match.name}</strong>
          <ul>
            {match.actions.map((action) => (
              <li key={action}>{ACTION_LABELS[action]}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
