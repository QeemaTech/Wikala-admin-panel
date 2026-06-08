'use client';

import { useRef, useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { PlanCard } from '@/components/plans/PlanCard';
import { PlanForm } from '@/components/plans/PlanForm';
import { RecentSubscribersTable } from '@/components/plans/RecentSubscribersTable';
import { useAdminPlans, type AdminPlanDTO } from '@/features/plans/use-plans';

export default function PlansPage() {
  const { data: plans, isLoading, isError } = useAdminPlans();
  const [editing, setEditing] = useState<AdminPlanDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [subscribersPlan, setSubscribersPlan] = useState<string | undefined>(undefined);
  const subsRef = useRef<HTMLDivElement>(null);

  const viewSubscribers = (plan: AdminPlanDTO) => {
    setSubscribersPlan(plan.plan);
    subsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="خطط الاشتراك"
        sub="باقات الاشتراك الشهرية للبائعين والمتاجر"
        actions={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90"
          >
            <Icon name="plus" size={14} /> إضافة خطة
          </button>
        }
      />

      {isError ? (
        <div className="rounded-[var(--radius)] border border-border bg-surface p-8 text-center text-[13px] text-muted">
          تعذّر تحميل خطط الاشتراك
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-[420px] animate-pulse rounded-[var(--radius)] border border-border bg-surface" />
          ))}
        </div>
      ) : !plans || plans.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-border bg-surface p-8 text-center text-[13px] text-muted">
          لا توجد خطط اشتراك
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.plan}
              plan={plan}
              onEdit={setEditing}
              onViewSubscribers={viewSubscribers}
            />
          ))}
        </div>
      )}

      <div ref={subsRef} className="mt-4 scroll-mt-6">
        <RecentSubscribersTable
          plan={subscribersPlan}
          onClearPlan={() => setSubscribersPlan(undefined)}
        />
      </div>

      {editing && <PlanForm plan={editing} onClose={() => setEditing(null)} />}
      {creating && <PlanForm onClose={() => setCreating(false)} />}
    </div>
  );
}
