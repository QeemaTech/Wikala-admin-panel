'use client';

import { Switch } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { SettingsSection } from './SettingsSection';
import {
  useOtpStatus,
  type OtpChannelStatus,
  type SystemSettingsDTO,
} from '@/features/settings/use-system-settings';

/** OTP channel codes surfaced as toggles, matching the prototype's 3 rows. */
const CHANNELS: { code: string; title: string; desc: string }[] = [
  { code: 'WHATSAPP', title: 'WhatsApp', desc: 'تفعيل إرسال رموز التحقق عبر واتساب' },
  { code: 'EMAIL', title: 'البريد الإلكتروني', desc: 'للتسجيل عبر البريد' },
  { code: 'CALL', title: 'مكالمة هاتفية', desc: 'لاسترجاع كلمة المرور' },
];

/** What the client has to supply before a channel can actually deliver. */
const MISSING_CREDENTIALS: Record<string, string> = {
  WHATSAPP: 'WABA_TOKEN و WABA_PHONE_ID',
  SMS: 'بيانات Twilio (TWILIO_ACCOUNT_SID، TWILIO_AUTH_TOKEN، TWILIO_FROM_NUMBER)',
  EMAIL: 'إعدادات SMTP',
  CALL: 'بيانات Twilio Voice',
};

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  SMS: 'رسائل SMS',
  EMAIL: 'البريد الإلكتروني',
  CALL: 'مكالمة هاتفية',
};

interface OtpChannelsPanelProps {
  settings: SystemSettingsDTO;
  onChange: (patch: Partial<SystemSettingsDTO>) => void;
}

/**
 * OTP channel toggles (TASK-F-15.8). Backed by the flat `otpChannels` array on
 * system settings — toggling a row adds/removes its channel code.
 *
 * The toggles alone are misleading, so the real provider status is shown
 * underneath: a channel can be switched on and still deliver nothing because
 * no credentials were ever supplied. That is exactly what was happening with
 * SMS — the adapter logged "sent" and dropped the code on the floor.
 */
export function OtpChannelsPanel({ settings, onChange }: OtpChannelsPanelProps) {
  const enabled = new Set(settings.otpChannels);

  const toggle = (code: string, on: boolean) => {
    const next = new Set(enabled);
    if (on) next.add(code);
    else next.delete(code);
    onChange({ otpChannels: [...next] });
  };

  return (
    <>
      <SettingsSection
        title="قنوات OTP"
        rows={CHANNELS.map((ch) => ({
          title: ch.title,
          desc: ch.desc,
          control: <Switch checked={enabled.has(ch.code)} onChange={(on) => toggle(ch.code, on)} />,
        }))}
      />
      <OtpProviderStatus enabledCodes={enabled} />
    </>
  );
}

function OtpProviderStatus({ enabledCodes }: { enabledCodes: Set<string> }) {
  const { data: channels, isLoading, isError } = useOtpStatus();

  if (isLoading || isError || !channels) return null;

  // The dangerous combination: switched on in settings, but no real provider.
  const silentlyBroken = channels.filter(
    (c) => enabledCodes.has(c.channel) && c.mode !== 'LIVE',
  );

  return (
    <div className="mt-3 rounded-[12px] border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="shield-alert" size={15} className="text-muted" />
        <h4 className="text-[13.5px] font-semibold text-ink">حالة مزوّدي الخدمة الفعلية</h4>
      </div>

      <p className="mb-3 text-[12px] leading-5 text-muted">
        تفعيل القناة بالأعلى يعني أننا مستعدون لاستخدامها فقط. الإرسال الحقيقي يحتاج بيانات
        اعتماد المزوّد — بدونها لن يصل الرمز للمستخدم إطلاقاً.
      </p>

      <ul className="space-y-1.5">
        {channels.map((c) => (
          <ChannelStatusRow key={c.channel} status={c} isEnabled={enabledCodes.has(c.channel)} />
        ))}
      </ul>

      {silentlyBroken.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-amber/25 bg-amber-50 px-3 py-2.5 text-[12px] leading-5 text-amber-900">
          <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0" />
          <span>
            <strong>
              {silentlyBroken.map((c) => CHANNEL_LABELS[c.channel] ?? c.channel).join('، ')}
            </strong>{' '}
            مفعّلة لكن غير موصولة بمزوّد حقيقي. المستخدم سينتظر رمزاً لن يصل. المطلوب:{' '}
            {silentlyBroken.map((c) => MISSING_CREDENTIALS[c.channel]).join('، ')}.
          </span>
        </div>
      )}
    </div>
  );
}

function ChannelStatusRow({
  status,
  isEnabled,
}: {
  status: OtpChannelStatus;
  isEnabled: boolean;
}) {
  const live = status.mode === 'LIVE';
  return (
    <li className="flex items-center justify-between gap-3 rounded-[8px] px-2 py-1.5 odd:bg-surface-2/50">
      <span className="text-[12.5px] text-ink">
        {CHANNEL_LABELS[status.channel] ?? status.channel}
        {!isEnabled && <span className="ms-1.5 text-[11px] text-muted">(غير مفعّلة)</span>}
      </span>
      <span
        className={
          live
            ? 'flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11.5px] font-medium text-green'
            : 'flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] font-medium text-muted'
        }
      >
        <Icon name={live ? 'check' : 'minus'} size={11} />
        {live ? status.provider : 'وضع تجريبي — لا يُرسل'}
      </span>
    </li>
  );
}
