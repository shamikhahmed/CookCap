'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/components/app/AppStore';
import { getShopping } from '@/lib/db/store';
import { estCostPkr, formatCost, COST_ESTIMATE_HINT } from '@/lib/cost/ingredient-cost';

/** Weekly grocery budget vs estimated shopping-list cost. */
export function BudgetPanel() {
  const { weeklyBudgetPkr, setWeeklyBudgetPkr, currency, recipeMap } =
    useApp();
  const [shopCost, setShopCost] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getShopping()
      .then((rows) => {
        if (cancelled) return;
        const seen = new Set<string>();
        let total = 0;
        let any = false;
        for (const row of rows) {
          if (row.checked) continue;
          const id = row.recipeId;
          if (id && !seen.has(id) && recipeMap[id]) {
            seen.add(id);
            total += estCostPkr(recipeMap[id]!);
            any = true;
          }
        }
        setShopCost(any ? total : null);
      })
      .catch(() => {
        if (!cancelled) setShopCost(null);
      });
    return () => {
      cancelled = true;
    };
  }, [recipeMap, weeklyBudgetPkr]);

  const remaining = useMemo(() => {
    if (shopCost == null) return null;
    return weeklyBudgetPkr - shopCost;
  }, [weeklyBudgetPkr, shopCost]);

  return (
    <section className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper-sunk)]/60 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
        Weekly budget
      </h3>
      <label className="block text-xs text-[color:var(--color-ink-faint)]">
        Cap ({currency})
        <input
          type="number"
          min={0}
          step={100}
          value={weeklyBudgetPkr || ''}
          onChange={(e) => setWeeklyBudgetPkr(Math.max(0, Number(e.target.value) || 0))}
          className="mt-1 w-full rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper-raised)] px-3 py-2 text-sm text-[color:var(--color-ink)] tabular-nums"
        />
      </label>
      <div className="mt-2 space-y-1 text-sm text-[color:var(--color-ink-soft)]">
        {shopCost != null ? (
          <>
            <p>
              Shopping est.{' '}
              <span className="font-medium text-[color:var(--color-ink)]">
                {formatCost(shopCost, currency)}
              </span>
              <span className="text-xs text-[color:var(--color-ink-faint)]"> · {COST_ESTIMATE_HINT}</span>
            </p>
            <p>
              {remaining != null && remaining >= 0 ? 'Left' : 'Over'}{' '}
              <span
                className={`font-medium ${
                  remaining != null && remaining < 0
                    ? 'text-[color:var(--color-danger)]'
                    : 'text-[color:var(--color-ink)]'
                }`}
              >
                {formatCost(Math.abs(remaining ?? 0), currency)}
              </span>
            </p>
          </>
        ) : (
          <p className="text-xs text-[color:var(--color-ink-faint)]">
            {weeklyBudgetPkr > 0
              ? `${formatCost(weeklyBudgetPkr, currency)} set — add recipe items to shopping for a running estimate. ${COST_ESTIMATE_HINT}`
              : `Set a weekly cap to track grocery spend. ${COST_ESTIMATE_HINT}`}
          </p>
        )}
      </div>
    </section>
  );
}
