import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePlaybookPage } from '../src/pages/CreatePlaybookPage';
import * as playbooksApi from '../src/api/playbooks';

vi.mock('../src/api/playbooks');

const listPlaybooksMock = vi.mocked(playbooksApi.listPlaybooks);
const deletePlaybookMock = vi.mocked(playbooksApi.deletePlaybook);

const samplePlaybook = {
  id: 'pb-1',
  name: 'Contain malware',
  trigger: 'MALWARE_DETECTED' as const,
  actions: ['ISOLATE_HOST' as const],
  createdAt: new Date().toISOString(),
};

describe('CreatePlaybookPage — delete double-submit guard', () => {
  beforeEach(() => {
    listPlaybooksMock.mockReset();
    deletePlaybookMock.mockReset();
    listPlaybooksMock.mockResolvedValue({ playbooks: [samplePlaybook] });
  });

  it('disables the Delete button while a delete is in flight, and clicking it again does not fire a second DELETE request', async () => {
    const user = userEvent.setup();
    let resolveDelete: () => void = () => {};
    deletePlaybookMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        })
    );

    render(<CreatePlaybookPage />);

    const deleteButton = await screen.findByRole('button', { name: /^delete$/i });

    await user.click(deleteButton);

    // Guard #1: the button disables and relabels while the delete is in
    // flight, per the earlier fix in PlaybookListItem/CreatePlaybookPage.
    const deletingButton = await screen.findByRole('button', { name: /deleting/i });
    expect(deletingButton).toBeDisabled();

    // A disabled button doesn't dispatch click events, but the underlying
    // handleDelete() guard (`if (deletingIds.has(id)) return;`) is the real
    // protection this test locks in — clicking again while in flight must
    // not result in a second call either way.
    await user.click(deletingButton);
    expect(deletePlaybookMock).toHaveBeenCalledTimes(1);

    resolveDelete();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /deleting/i })).not.toBeInTheDocument();
    });
    // Only one request total, and the playbook is removed from the list.
    expect(deletePlaybookMock).toHaveBeenCalledTimes(1);
    expect(deletePlaybookMock).toHaveBeenCalledWith('pb-1');
    expect(screen.queryByText('Contain malware')).not.toBeInTheDocument();
  });
});
