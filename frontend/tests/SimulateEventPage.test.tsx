import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimulateEventPage } from '../src/pages/SimulateEventPage';
import * as simulateApi from '../src/api/simulate';

vi.mock('../src/api/simulate');

const simulateTriggerMock = vi.mocked(simulateApi.simulateTrigger);

describe('SimulateEventPage', () => {
  beforeEach(() => {
    simulateTriggerMock.mockReset();
  });

  it('renders "No playbooks match this trigger" when the backend returns an empty match list', async () => {
    const user = userEvent.setup();
    simulateTriggerMock.mockResolvedValue({ trigger: 'MALWARE_DETECTED', matches: [] });

    render(<SimulateEventPage />);

    await user.selectOptions(screen.getByLabelText('Trigger'), 'MALWARE_DETECTED');
    await user.click(screen.getByRole('button', { name: /simulate/i }));

    expect(await screen.findByText('No playbooks match this trigger.')).toBeInTheDocument();
  });

  it('labels the results heading with the backend-returned trigger, not a generic heading', async () => {
    const user = userEvent.setup();
    simulateTriggerMock.mockResolvedValue({
      trigger: 'MALWARE_DETECTED',
      matches: [{ id: 'p1', name: 'Contain malware', actions: ['ISOLATE_HOST'] }],
    });

    render(<SimulateEventPage />);

    await user.selectOptions(screen.getByLabelText('Trigger'), 'MALWARE_DETECTED');
    await user.click(screen.getByRole('button', { name: /simulate/i }));

    expect(
      await screen.findByRole('heading', { name: 'Playbooks matching Malware Detected' })
    ).toBeInTheDocument();
    expect(screen.getByText('Contain malware')).toBeInTheDocument();
  });

  it('clears previous results when the trigger dropdown changes, instead of leaving stale matches rendered', async () => {
    const user = userEvent.setup();
    simulateTriggerMock.mockResolvedValue({
      trigger: 'MALWARE_DETECTED',
      matches: [{ id: 'p1', name: 'Contain malware', actions: ['ISOLATE_HOST'] }],
    });

    render(<SimulateEventPage />);

    await user.selectOptions(screen.getByLabelText('Trigger'), 'MALWARE_DETECTED');
    await user.click(screen.getByRole('button', { name: /simulate/i }));

    expect(await screen.findByText('Contain malware')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Playbooks matching Malware Detected' })
    ).toBeInTheDocument();

    // Changing the trigger before re-simulating must clear the stale
    // MALWARE_DETECTED results — they don't belong to the newly-selected
    // trigger.
    await user.selectOptions(screen.getByLabelText('Trigger'), 'LOGIN_ATTEMPT');

    expect(screen.queryByText('Contain malware')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Playbooks matching Malware Detected' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /playbooks matching/i })).not.toBeInTheDocument();
  });
});
