import { useEffect, useState } from 'react';
import { createPlaybook, deletePlaybook, listPlaybooks } from '../api/playbooks';
import { ApiError } from '../api/client';
import type { Action, Playbook, Trigger } from '../types/domain';
import { PlaybookForm } from '../components/PlaybookForm';
import { PlaybookList } from '../components/PlaybookList';
import { ErrorBanner } from '../components/ErrorBanner';

export function CreatePlaybookPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadPlaybooks();
  }, []);

  async function loadPlaybooks() {
    setLoading(true);
    try {
      const { playbooks: fetched } = await listPlaybooks();
      setPlaybooks(fetched);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load playbooks.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(name: string, trigger: Trigger, actions: Action[]) {
    setError(null);
    try {
      const { playbook } = await createPlaybook(name, trigger, actions);
      setPlaybooks((current) => [playbook, ...current]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create playbook.');
    }
  }

  async function handleDelete(id: string) {
    if (deletingIds.has(id)) return;

    setError(null);
    setDeletingIds((current) => new Set(current).add(id));
    try {
      await deletePlaybook(id);
      setPlaybooks((current) => current.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete playbook.');
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div>
      <h1>Create Playbook</h1>
      <ErrorBanner message={error} />
      <PlaybookForm onSubmit={handleCreate} />

      <h2>Your Playbooks</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <PlaybookList playbooks={playbooks} onDelete={handleDelete} deletingIds={deletingIds} />
      )}
    </div>
  );
}
