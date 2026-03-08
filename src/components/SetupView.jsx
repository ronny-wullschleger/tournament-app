import { useState } from "react";
import { Card } from "./Card";
import { Input } from "./Input";
import { Button } from "./Button";
import { shuffle, uid } from "../utils/tournament";

export const SetupView = ({ onStart, onCancel }) => {
  const [teams, setTeams] = useState(["", "", "", ""]);
  const [name, setName] = useState("Tournament");

  const addTeam = () => {
    if (teams.length < 12) setTeams([...teams, ""]);
  };

  const removeTeam = (i) => {
    if (teams.length > 4) setTeams(teams.filter((_, idx) => idx !== i));
  };

  const updateTeam = (i, v) => {
    const t = [...teams];
    t[i] = v;
    setTeams(t);
  };

  const canStart = teams.every((t) => t.trim().length > 0) &&
    new Set(teams.map((t) => t.trim().toLowerCase())).size === teams.length;

  return (
    <div className="max-w-[540px] mx-auto">
      {onCancel && (
        <div className="mb-5">
          <button
            onClick={onCancel}
            className="bg-transparent border-none text-textSecondary cursor-pointer text-xs font-sans p-0 flex items-center gap-1 hover:text-textPrimary transition-colors"
          >
            ← Back to list
          </button>
        </div>
      )}

      <div className="text-center mb-10">
        <div className="text-5xl mb-2">⚽</div>
        <h1 className="font-display text-[32px] text-textPrimary m-0">
          Tournament Setup
        </h1>
        <p className="text-textSecondary my-2 text-sm">
          Round Robin · Semifinals · Final
        </p>
      </div>

      <Card className="mb-5">
        <label className="text-textSecondary text-xs font-semibold tracking-wider uppercase block mb-2">
          Tournament Name
        </label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Tournament" />
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <label className="text-textSecondary text-xs font-semibold tracking-wider uppercase">
            Teams ({teams.length}/12)
          </label>
          <Button small onClick={addTeam} disabled={teams.length >= 12}>
            + Add Team
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {teams.map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-textDim font-bold text-xs w-6 text-right">{i + 1}</span>
              <Input value={t} onChange={(e) => updateTeam(i, e.target.value)} placeholder={`Team ${i + 1}`} />
              {teams.length > 4 && (
                <button
                  onClick={() => removeTeam(i)}
                  className="bg-transparent border-none text-red cursor-pointer text-lg px-1 leading-none hover:opacity-70"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="text-center mt-7">
        <Button
          onClick={() =>
            onStart(
              name.trim() || "Tournament",
              shuffle(teams.map((t) => ({ id: uid(), name: t.trim() })))
            )
          }
          disabled={!canStart}
          className="!px-12 !py-3.5 !text-base"
        >
          Generate Draw & Start →
        </Button>
        {!canStart && (
          <p className="text-red text-xs mt-2">
            All team names must be unique and non-empty
          </p>
        )}
      </div>
    </div>
  );
};
