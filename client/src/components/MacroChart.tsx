import { PieChart, Pie, Cell } from "recharts";
import { DollarSign } from "lucide-react";

const MACRO_COLORS = {
  Protein: "#3b82f6",
  Carbs: "#22c55e",
  Fat: "#f97316",
};

export interface MacroChartProps {
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  pricePerServing?: number | null;
}

export function MacroChart({ calories, protein, carbs, fat, pricePerServing }: MacroChartProps) {
  const hasData = calories != null || protein != null || carbs != null || fat != null;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center py-4 mb-6" data-testid="macro-chart-unavailable">
        <p className="text-sm text-muted-foreground italic">Nutrition data unavailable for this recipe.</p>
      </div>
    );
  }

  const macros = [
    { name: "Protein", value: Math.round(protein ?? 0), color: MACRO_COLORS.Protein },
    { name: "Carbs", value: Math.round(carbs ?? 0), color: MACRO_COLORS.Carbs },
    { name: "Fat", value: Math.round(fat ?? 0), color: MACRO_COLORS.Fat },
  ].filter(m => m.value > 0);

  const totalGrams = macros.reduce((sum, m) => sum + m.value, 0);
  const chartSize = 180;

  return (
    <div className="mb-6" data-testid="macro-chart">
      <h2 className="text-lg font-serif font-bold text-foreground mb-3">Nutrition</h2>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: chartSize, height: chartSize }}>
          <PieChart width={chartSize} height={chartSize}>
            <Pie
              data={macros}
              cx={chartSize / 2}
              cy={chartSize / 2}
              innerRadius={52}
              outerRadius={80}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              animationBegin={0}
              animationDuration={900}
              strokeWidth={2}
              stroke="hsl(var(--card))"
            >
              {macros.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            data-testid="macro-chart-calories"
          >
            <span className="text-xl font-bold text-foreground leading-none">
              {calories != null ? Math.round(calories) : "—"}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">
              kcal
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          {macros.map((macro) => {
            const pct = totalGrams > 0 ? Math.round((macro.value / totalGrams) * 100) : 0;
            return (
              <div key={macro.name} className="flex items-center gap-2" data-testid={`macro-${macro.name.toLowerCase()}`}>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: macro.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-foreground">{macro.name}</span>
                    <span className="text-xs text-muted-foreground">{macro.value}g</span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: macro.color }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground shrink-0 w-8 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}

          {pricePerServing != null && (
            <div
              className="flex items-center gap-2 mt-1 pt-2 border-t border-border"
              data-testid="macro-chart-price"
            >
              <DollarSign size={13} className="text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground">
                ${(pricePerServing / 100).toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">/ serving</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
