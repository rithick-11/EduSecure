export default function StatCard({ icon: Icon, value, label, color = 'teal' }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
