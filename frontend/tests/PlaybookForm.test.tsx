import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaybookForm } from '../src/components/PlaybookForm';
import type * as DomainModule from '../src/types/domain';

// The real domain only defines 3 actions (ISOLATE_HOST, NOTIFY_ADMIN,
// BLOCK_IP), so there is no genuine "4th checkbox" to click in the actual
// app — the MAX_ACTIONS=3 cap in PlaybookForm can never be observed
// disabling a real, still-unchecked action. To exercise that guard for
// real (and have this test fail if the `disabled` check in
// PlaybookForm.toggleAction were ever removed), we mock the domain module
// to add one extra synthetic action so a 4th, always-unchecked checkbox
// exists to assert against. All other exports pass through unchanged.
vi.mock('../src/types/domain', async (importOriginal) => {
  const actual = await importOriginal<typeof DomainModule>();
  return {
    ...actual,
    ALLOWED_ACTIONS: [...actual.ALLOWED_ACTIONS, 'QUARANTINE_FILE'] as unknown as typeof actual.ALLOWED_ACTIONS,
    ACTION_LABELS: {
      ...actual.ACTION_LABELS,
      QUARANTINE_FILE: 'Quarantine File',
    } as unknown as typeof actual.ACTION_LABELS,
  };
});

describe('PlaybookForm', () => {
  it('disables a 4th action checkbox once 3 actions are already selected', async () => {
    const user = userEvent.setup();
    render(<PlaybookForm onSubmit={vi.fn().mockResolvedValue(undefined)} />);

    await user.click(screen.getByLabelText('Isolate Host'));
    await user.click(screen.getByLabelText('Notify Admin'));
    await user.click(screen.getByLabelText('Block IP'));

    const fourth = screen.getByLabelText('Quarantine File') as HTMLInputElement;
    expect(fourth).toBeDisabled();
    expect(fourth.checked).toBe(false);

    // Clicking a disabled checkbox must not check it.
    await user.click(fourth);
    expect(fourth.checked).toBe(false);
  });

  it('shows a validation message and does not call onSubmit when submitted with 0 actions', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PlaybookForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'My playbook');
    await user.selectOptions(screen.getByLabelText('Trigger'), 'MALWARE_DETECTED');
    // No actions checked.
    await user.click(screen.getByRole('button', { name: /create playbook/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/select at least 1 action/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the entered values on a valid submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PlaybookForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Name'), 'Contain malware');
    await user.selectOptions(screen.getByLabelText('Trigger'), 'MALWARE_DETECTED');
    await user.click(screen.getByLabelText('Isolate Host'));
    await user.click(screen.getByRole('button', { name: /create playbook/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('Contain malware', 'MALWARE_DETECTED', ['ISOLATE_HOST']);
  });
});
