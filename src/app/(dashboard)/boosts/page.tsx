'use client';

import { useRef, useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { BoostPackageCard } from '@/components/boosts/BoostPackageCard';
import { BoostPackageForm } from '@/components/boosts/BoostPackageForm';
import { BoostRevenueChart } from '@/components/boosts/BoostRevenueChart';
import { useBoostPackages, type BoostPackageDTO } from '@/features/boosts/use-boosts';

export default function BoostsPage() {
  const { data: packages, isLoading, isError } = useBoostPackages();
  const [editing, setEditing] = useState<BoostPackageDTO | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const scrollToChart = () => chartRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="باقات التعزيز"
        sub="إدارة باقات Boost / Hot / Urgent — الأسعار والمدد والمزايا والإيرادات"
      />

      {isError ? (
        <div className="rounded-[var(--radius)] border border-border bg-surface p-8 text-center text-[13px] text-muted">
          تعذّر تحميل باقات التعزيز
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[360px] animate-pulse rounded-[var(--radius)] border border-border bg-surface" />
          ))}
        </div>
      ) : !packages || packages.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-border bg-surface p-8 text-center text-[13px] text-muted">
          لا توجد باقات تعزيز
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <BoostPackageCard
              key={pkg.package}
              pkg={pkg}
              onEdit={setEditing}
              onStats={scrollToChart}
            />
          ))}
        </div>
      )}

      <div ref={chartRef} className="mt-4 scroll-mt-6">
        <BoostRevenueChart />
      </div>

      {editing && <BoostPackageForm pkg={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
