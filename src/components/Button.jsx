export const Button = ({ children, onClick, variant = "primary", disabled, small, className = "" }) => {
  const baseClass = `
    rounded-lg border-none cursor-pointer font-bold font-sans tracking-wide transition-all
    ${small ? 'px-3.5 py-1.5 text-xs' : 'px-5.5 py-2.5 text-sm'}
    ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}
  `;

  const variants = {
    primary: "bg-accent text-bg",
    secondary: "bg-surfaceAlt text-textPrimary border border-border",
    danger: "bg-red/15 text-red border border-red/20",
    gold: "bg-gold text-bg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
