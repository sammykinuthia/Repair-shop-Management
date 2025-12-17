interface Props {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string; // e.g., "bg-red-50 text-red-600"
}

export function StatsCard({ title, value, icon, colorClass = "bg-white text-gray-900" }: Props) {
  return (
    <div className={`p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 ${colorClass}`}>
      <div className="p-3 rounded-full bg-white/50 backdrop-blur-sm shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-sm opacity-80 font-medium">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
    </div>
  );
}