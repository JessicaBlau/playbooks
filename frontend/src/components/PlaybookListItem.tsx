import { ACTION_LABELS, TRIGGER_LABELS, type Playbook } from '../types/domain';

interface PlaybookListItemProps {
  playbook: Playbook;
  onDelete: (id: string) => void;
}

export function PlaybookListItem({ playbook, onDelete }: PlaybookListItemProps) {
  return (
    <li>
      <strong>{playbook.name}</strong> — {TRIGGER_LABELS[playbook.trigger]}
      <ul>
        {playbook.actions.map((action) => (
          <li key={action}>{ACTION_LABELS[action]}</li>
        ))}
      </ul>
      <button onClick={() => onDelete(playbook.id)}>Delete</button>
    </li>
  );
}
