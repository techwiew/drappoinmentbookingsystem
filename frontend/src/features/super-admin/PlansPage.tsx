import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Package, Check, Sparkles } from 'lucide-react';

export const PlansPage: React.FC = () => {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['super-admin-plans'],
    queryFn: async () => {
      const res = await apiClient.get('/super-admin/plans');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-600" />
          Subscription Plans & Tiers
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configured monetization tiers, quotas, and feature allocations for tenant clinics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan: any) => {
          const isPopular = plan.code === 'PROFESSIONAL';
          const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col justify-between ${
                isPopular ? 'border-2 border-indigo-600 shadow-lg' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" /> Most Popular Tier
                </div>
              )}

              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">{plan.name}</h3>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {plan.code}
                    </span>
                  </div>
                  <Badge variant="purple">{plan.billingCycle}</Badge>
                </div>

                <div className="my-6">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{Number(plan.price).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-medium ml-1">/ month</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Up to {plan.maxDoctors} Active Doctors</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Up to {plan.maxReceptionists} Receptionists</span>
                  </div>

                  {features?.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 text-center">
                <span className="text-[11px] text-slate-400">
                  Assigned automatically during clinic tenant onboarding
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
