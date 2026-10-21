import { STAT_LABELS } from "../utils/pokemon.js";
export default function Stats({ stats, compact = false }) {
  return (
    <dl className={compact ? "stats compact" : "stats"}>
      {Object.entries(STAT_LABELS).map(([key, label]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>
            <span className="stat-value">{stats[key]}</span>
            {!compact && (
              <span className="stat-track" aria-hidden="true">
                <span
                  style={{
                    width: `${Math.min((stats[key] / 255) * 100, 100)}%`,
                  }}
                />
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
