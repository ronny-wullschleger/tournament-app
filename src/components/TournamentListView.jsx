import { Card } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { phaseLabel, phaseBadgeColor, PHASES } from "../utils/constants";

export const TournamentListView = ({ tournaments, onSelect, onCreateNew }) => {
  const sorted = [...tournaments].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="flex justify-between items-center mb-7">
        <h2 className="font-display text-textPrimary m-0 text-[26px]">
          All Tournaments
        </h2>
        <Button onClick={onCreateNew}>＋ New Tournament</Button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-[56px] mb-4">⚽</div>
          <h2 className="font-display text-textPrimary m-0 mb-2">No Tournament Yet</h2>
          <p className="text-textSecondary mb-6">Create your first tournament to get started</p>
          <Button onClick={onCreateNew}>＋ New Tournament</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((t) => (
            <Card key={t.id} className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-textPrimary font-bold text-base">{t.name}</span>
                  <Badge color={phaseBadgeColor(t.phase)}>{phaseLabel(t.phase)}</Badge>
                </div>
                <div className="text-textDim text-xs">
                  {new Date(t.createdAt).toLocaleDateString()}
                  {t.phase === PHASES.DONE && t.winner && (
                    <span className="ml-3 text-gold">🏆 {t.winner}</span>
                  )}
                </div>
              </div>
              <Button small variant="secondary" onClick={() => onSelect(t.id)}>
                View →
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
