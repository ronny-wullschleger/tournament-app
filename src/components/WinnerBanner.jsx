import styles from "./WinnerBanner.module.css";

const WinnerBanner = ({ name }) => (
  <div className={styles.banner}>
    <div className={styles.trophy}>🏆</div>
    <p className={styles.label}>Champion</p>
    <h2 className={styles.name}>{name}</h2>
  </div>
);

export default WinnerBanner;
