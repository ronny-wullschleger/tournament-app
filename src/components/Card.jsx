import styles from "./Card.module.css";

const Card = ({ children, style: extra, glow }) => (
  <div
    className={`${styles.card} ${glow ? styles.glow : ""}`}
    style={extra}
  >
    {children}
  </div>
);

export default Card;
