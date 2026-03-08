export const Card = ({ children, className = "", glow = false }) => (
  <div className={`
    bg-surface rounded-2xl p-5
    ${glow
      ? 'border border-accent/30 shadow-[0_0_30px_rgba(34,211,238,0.07)]'
      : 'border border-border shadow-[0_2px_12px_rgba(0,0,0,0.27)]'
    }
    ${className}
  `}>
    {children}
  </div>
);
