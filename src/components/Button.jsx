import styles from "./Button.module.css";

const Button = ({ children, onClick, variant = "primary", disabled, small, style: extra }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${styles.btn} ${styles[variant] ?? ""} ${small ? styles.small : ""}`}
    style={extra}
  >
    {children}
  </button>
);

export default Button;
