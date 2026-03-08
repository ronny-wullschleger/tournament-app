export const Badge = ({ children, color = "accent" }) => (
  <span className={`
    inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase
    bg-${color}/10 text-${color} border border-${color}/20
  `}>
    {children}
  </span>
);
