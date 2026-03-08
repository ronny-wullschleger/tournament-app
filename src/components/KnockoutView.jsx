import { MatchCard } from "./MatchCard";

export const KnockoutView = ({ matches, teams, isAdmin, onSave, label }) => (
  <div>
    <h3 className="font-display text-textPrimary text-xl mb-4">
      {label}
    </h3>
    <div className="flex flex-col gap-2.5">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} teams={teams} isAdmin={isAdmin} onSave={onSave} />
      ))}
    </div>
  </div>
);
