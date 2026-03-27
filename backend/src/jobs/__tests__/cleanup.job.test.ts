const sendCompleteRegistrationReminderEmail = jest.fn().mockResolvedValue(undefined);

jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../../services/cleanup.service', () => ({
  CleanupService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../services/subscription.service', () => ({
  SubscriptionService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../services/notification.service', () => ({
  notificationService: {
    sendCompleteRegistrationReminderEmail,
  },
}));

const mockFrom = jest.fn();
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

import { processPendingRegistrationReminders } from '../cleanup.job';

function createSelectBuilder(data: any, error: any = null) {
  const builder: any = {
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    lte: jest.fn().mockResolvedValue({ data, error }),
  };
  return builder;
}

function createUpdateBuilder(error: any = null) {
  const builder: any = {
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockResolvedValue({ error }),
  };
  return builder;
}

describe('processPendingRegistrationReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends one delayed reminder and marks the reference as reminded', async () => {
    const selectBuilder = createSelectBuilder([
      {
        email: 'buyer@example.com',
        reference: 'PAYPAL-visitor_123-M1-PBASIC-123',
        plan: 'BASIC',
        amount: 180000,
        status: 'paid',
        created_at: '2026-03-25T00:00:00.000Z',
        reminder_sent_at: null,
      },
    ]);
    const updateBuilder = createUpdateBuilder();

    mockFrom
      .mockReturnValueOnce({ select: jest.fn().mockReturnValue(selectBuilder) })
      .mockReturnValueOnce({ update: jest.fn().mockReturnValue(updateBuilder) });

    const now = new Date('2026-03-26T12:00:00.000Z');
    await processPendingRegistrationReminders(now);

    expect(sendCompleteRegistrationReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'buyer@example.com',
        reference: 'PAYPAL-visitor_123-M1-PBASIC-123',
      })
    );
  });

  it('does nothing when there are no eligible pending registrations', async () => {
    mockFrom.mockReturnValueOnce({ select: jest.fn().mockReturnValue(createSelectBuilder([])) });

    await processPendingRegistrationReminders(new Date('2026-03-26T12:00:00.000Z'));

    expect(sendCompleteRegistrationReminderEmail).not.toHaveBeenCalled();
  });
});
