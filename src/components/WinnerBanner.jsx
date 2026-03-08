export const WinnerBanner = ({ name }) => (
  <div className="
    text-center py-10 px-5
    bg-gradient-to-br from-gold/8 to-accent/6
    rounded-2xl border-2 border-gold/30 mb-6
  ">
    <div className="text-[56px] mb-1">🏆</div>
    <p className="text-gold text-xs font-bold tracking-[2px] uppercase m-0 mb-2">Champion</p>
    <h2 className="font-display text-textPrimary text-4xl m-0">{name}</h2>
  </div>
);
