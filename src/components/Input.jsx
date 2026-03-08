import styles from "./Input.module.css";

const Input = ({ value, onChange, placeholder, style: extra, type = "text" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={styles.input}
    style={extra}
  />
);

export default Input;
