import type { Playbook } from '../types/domain';
import { PlaybookListItem } from './PlaybookListItem';

interface PlaybookListProps {
  playbooks: Playbook[];
  onDelete: (id: string) => void;
  deletingIds: Set<string>;
}

export function PlaybookList({ playbooks, onDelete, deletingIds }: PlaybookListProps) {
  if (playbooks.length === 0) {
    return <p>No playbooks yet. Create one above.</p>;
  }

  return (
    <ul>
      {playbooks.map((playbook) => (
        <PlaybookListItem
          key={playbook.id}
          playbook={playbook}
          onDelete={onDelete}
          deleting={deletingIds.has(playbook.id)}
        />
      ))}
    </ul>
  );
}
