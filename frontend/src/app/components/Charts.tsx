"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// 3 tingkat kelulusan (0 = Rendah, 1 = Sedang, 2 = Tinggi)
const TIERS: Record<number, { short: string; color: string }> = {
  0: { short: "Rendah", color: "#ef4444" }, // merah
  1: { short: "Sedang", color: "#eab308" }, // kuning
  2: { short: "Tinggi", color: "#22c55e" }, // hijau
};

const FALLBACK = "#6366f1";

// ─── Gauge Setengah Lingkaran ───
export function IpkGauge({ value, max = 2 }: { value: number; max?: number }) {
  const radius = 80;
  const cx = 100;
  const cy = 95;
  const startAngle = Math.PI;
  const endAngle = 0;
  const fraction = max === 0 ? 0 : Math.min(value / max, 1);

  // Arc background
  const bgD = describeArc(cx, cy, radius, startAngle, endAngle);
  // Arc filled
  const fillEnd = startAngle - fraction * Math.PI;
  const fillD = describeArc(cx, cy, radius, startAngle, fillEnd);

  const tier = TIERS[value];
  const color = tier?.color ?? FALLBACK;

  return (
    <svg width="200" height="120" viewBox="0 0 200 120">
      {/* background arc */}
      <path d={bgD} fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
      {/* filled arc */}
      <path d={fillD} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
      {/* label tingkat */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="700" fill={color} fontFamily="Poppins, sans-serif">
        {tier?.short ?? value}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="Poppins, sans-serif">
        Tingkat Kelulusan
      </text>
    </svg>
  );
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy - r * Math.sin(endAngle);
  const largeArc = Math.abs(startAngle - endAngle) > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// ─── Bar Chart Probabilitas ───
export function ProbabilityBarChart({
  probabilities,
}: {
  probabilities: Record<string, number>;
}) {
  const data = Object.entries(probabilities).map(([key, val]) => {
    const idx = parseInt(key.replace("Grade ", ""));
    return {
      name: TIERS[idx]?.short ?? key,
      persen: parseFloat((val * 100).toFixed(1)),
      idx,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fontFamily: "Poppins" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fontFamily: "Poppins" }}
          axisLine={false}
          tickLine={false}
          unit="%"
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "Poppins",
            border: "1px solid #e2e8f0",
          }}
          formatter={(v) => [`${v}%`, "Probabilitas"]}
        />
        <Bar dataKey="persen" radius={[4, 4, 0, 0]} animationDuration={600}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={TIERS[entry.idx]?.color ?? FALLBACK} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
