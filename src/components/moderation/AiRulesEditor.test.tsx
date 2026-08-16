import { describe, expect, it, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { AiRulesEditor } from './AiRulesEditor';
import { useAiRules } from '@/features/moderation/use-ai-rules';

const mockSaveMutateAsync = vi.fn();

const defaultRulesData = {
  thresholdReview: 60,
  thresholdReject: 85,
  textRules: [],
  imageRules: [],
  lastUpdatedBy: null,
  lastUpdatedAt: null,
};

vi.mock('@/features/moderation/use-ai-rules', () => ({
  useAiRules: vi.fn(),
  useSaveAiRules: () => ({ mutateAsync: mockSaveMutateAsync, isPending: false }),
}));

afterEach(() => {
  vi.mocked(useAiRules).mockImplementation(
    () => ({ data: defaultRulesData, isLoading: false } as unknown as ReturnType<typeof useAiRules>),
  );
});

// Seed the default implementation before each test runs
vi.mocked(useAiRules).mockImplementation(
  () => ({ data: defaultRulesData, isLoading: false } as unknown as ReturnType<typeof useAiRules>),
);

describe('AiRulesEditor', () => {
  it('renders the modal with header', () => {
    renderWithProviders(<AiRulesEditor onClose={vi.fn()} />);
    expect(screen.getByText('إعداد قواعد AI')).toBeTruthy();
  });

  it('hides form while data is loading', () => {
    vi.mocked(useAiRules).mockImplementation(
      () => ({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useAiRules>),
    );
    renderWithProviders(<AiRulesEditor onClose={vi.fn()} />);
    expect(screen.queryByText('حفظ الإعدادات')).toBeNull();
  });

  it('populates thresholds from API data', () => {
    renderWithProviders(<AiRulesEditor onClose={vi.fn()} />);
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    expect(inputs[0].value).toBe('60');
    expect(inputs[1].value).toBe('85');
  });

  it('save button is disabled when form is untouched', () => {
    renderWithProviders(<AiRulesEditor onClose={vi.fn()} />);
    const saveBtn = screen.getByText('حفظ الإعدادات');
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables save button after a valid threshold edit', async () => {
    renderWithProviders(<AiRulesEditor onClose={vi.fn()} />);
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '55', valueAsNumber: 55 } });
    await waitFor(() => {
      const saveBtn = screen.getByText('حفظ الإعدادات') as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(false);
    });
  });

  it('shows validation error when reject threshold ≤ review threshold', async () => {
    renderWithProviders(<AiRulesEditor onClose={vi.fn()} />);
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    fireEvent.change(inputs[1], { target: { value: '50', valueAsNumber: 50 } });
    await waitFor(() =>
      expect(screen.getByText('يجب أن يكون حد الرفض أعلى من حد المراجعة')).toBeTruthy(),
    );
  });

  it('calls save mutation with updated values on submit', async () => {
    mockSaveMutateAsync.mockResolvedValueOnce(defaultRulesData);
    const onClose = vi.fn();
    renderWithProviders(<AiRulesEditor onClose={onClose} />);
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: '55', valueAsNumber: 55 } });
    await waitFor(() => {
      const saveBtn = screen.getByText('حفظ الإعدادات') as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(false);
    });
    fireEvent.click(screen.getByText('حفظ الإعدادات'));
    await waitFor(() => expect(mockSaveMutateAsync).toHaveBeenCalled());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('adds a text rule via the add button', async () => {
    renderWithProviders(<AiRulesEditor onClose={vi.fn()} />);
    fireEvent.click(screen.getAllByText('إضافة قاعدة')[0]);
    await waitFor(() =>
      expect(screen.getByPlaceholderText('النمط (regex أو نص)')).toBeTruthy(),
    );
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(<AiRulesEditor onClose={onClose} />);
    fireEvent.click(screen.getByText('إلغاء'));
    expect(onClose).toHaveBeenCalled();
  });

  describe('built-in rule labels', () => {
    const withBuiltIns = {
      ...defaultRulesData,
      textRules: [
        {
          pattern: '(فودافون\\s*كاش|instapay)',
          action: 'FLAG' as const,
          reason: 'WALLET_TRANSFER_REQUEST',
        },
      ],
    };

    it('shows the readable label next to the raw regex', () => {
      vi.mocked(useAiRules).mockImplementation(
        () => ({ data: withBuiltIns, isLoading: false } as unknown as ReturnType<typeof useAiRules>),
      );
      renderWithProviders(<AiRulesEditor onClose={vi.fn()} />);
      // A moderator reads the label; the regex alone means nothing at a glance.
      expect(screen.getByText('WALLET_TRANSFER_REQUEST')).toBeTruthy();
    });

    it('preserves `reason` when saving — editing a threshold must not strip labels', async () => {
      // Set inside the test body, after the file-level afterEach has restored
      // the default mock, so this data is the one the component actually reads.
      vi.mocked(useAiRules).mockImplementation(
        () => ({ data: withBuiltIns, isLoading: false } as unknown as ReturnType<typeof useAiRules>),
      );
      mockSaveMutateAsync.mockReset();
      mockSaveMutateAsync.mockResolvedValueOnce(withBuiltIns);
      renderWithProviders(<AiRulesEditor onClose={vi.fn()} />);

      // Guard: if the fixture did not reach the form, the assertion below would
      // pass vacuously on an empty array.
      await waitFor(() => expect(screen.getByText('WALLET_TRANSFER_REQUEST')).toBeTruthy());

      const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
      fireEvent.change(inputs[0], { target: { value: '55', valueAsNumber: 55 } });
      await waitFor(() => {
        const saveBtn = screen.getByText('حفظ الإعدادات') as HTMLButtonElement;
        expect(saveBtn.disabled).toBe(false);
      });
      fireEvent.click(screen.getByText('حفظ الإعدادات'));

      await waitFor(() => expect(mockSaveMutateAsync).toHaveBeenCalled());
      // Zod strips unknown keys: without `reason` in the schema this comes back
      // undefined and every built-in rule loses its label on first save.
      const sent = mockSaveMutateAsync.mock.calls[0][0];
      expect(sent.textRules).toHaveLength(1);
      expect(sent.textRules[0].reason).toBe('WALLET_TRANSFER_REQUEST');
    });

    it('warns in red when there are no text rules at all', () => {
      renderWithProviders(<AiRulesEditor onClose={vi.fn()} />);
      // An empty list means nothing is inspecting ad text — not a neutral state.
      expect(screen.getByText(/لا يوجد فحص تلقائي للنصوص/)).toBeTruthy();
    });
  });
});
