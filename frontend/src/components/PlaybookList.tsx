import type { Playbook } from '../types/domain';
import { PlaybookListItem } from './PlaybookListItem';

interface PlaybookListProps {
  playbooks: Playbook[];
  onDelete: (id: string) => void;
}

export function PlaybookList({ playbooks, onDelete }: PlaybookListProps) {
  if (playbooks.length === 0) {
    return <p>No playbooks yet. Create one above.</p>;
  }

  return (
    <ul>
      {playbooks.map((playbook) => (
        <PlaybookListItem key={playbook.id} playbook={playbook} onDelete={onDelete} />
      ))}
    </ul>
  );
}
