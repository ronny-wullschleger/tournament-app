export const Input = ({ value, onChange, placeholder, className = "", type = "text" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`
      bg-surfaceAlt border border-border rounded-lg px-3.5 py-2.5
      text-textPrimary font-sans text-sm outline-none w-full box-border
      focus:border-accent/50 transition-colors
      ${className}
    `}
  />
);
