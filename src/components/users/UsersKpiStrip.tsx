import { KpiCard } from '@/components/ui/KpiCard';
import { Icon } from '@/components/ui/Icon';
import { useUserKpis } from '@/features/users/use-users';

export function UsersKpiStrip() {
  const { kpis, isLoading } = useUserKpis();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[104px] rounded-[var(--radius)] bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
      <KpiCard
        label="إجمالي المستخدمين"
        value={kpis.total}
        icon={<Icon name="users" size={18} />}
        tintColor="#226199"
        unit="مستخدم"
      />
      <KpiCard
        label="موثقون"
        value={kpis.verified}
        icon={<Icon name="badge-check" size={18} />}
        tintColor="#1f9c63"
        unit="مستخدم"
      />
      <KpiCard
        label="بريميوم (متاجر)"
        value={kpis.premium}
        icon={<Icon name="crown" size={18} />}
        tintColor="#7a4cc4"
        unit="مستخدم"
      />
      <KpiCard
        label="محظورون أو مراقبون"
        value={kpis.bannedOrMonitored}
        icon={<Icon name="shield-alert" size={18} />}
        tintColor="#d44030"
        unit="مستخدم"
      />
    </div>
  );
}
