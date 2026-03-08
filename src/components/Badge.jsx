import { COLORS } from "../constants.js";
import styles from "./Badge.module.css";

const Badge = ({ children, color = COLORS.accent }) => (
  <span className={styles.badge} style={{ "--badge-color": color }}>
    {children}
  </span>
);

export default Badge;
