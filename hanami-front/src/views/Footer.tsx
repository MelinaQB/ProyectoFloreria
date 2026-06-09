import React from 'react';

export const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.section}>
        <h3 style={{ color: '#d63384' }}>Hanami Eternal</h3>
        <p>Flores que nunca se marchitan, hechas 100% a mano con limpiapipas.</p>
      </div>
      <div style={styles.section}>
        <h4>Síguenos</h4>
        <p style={{ cursor: 'pointer' }}>🎵 TikTok: @hanami_bolivia</p>
        <p style={{ cursor: 'pointer' }}>📸 Instagram: @hanami.eternal</p>
      </div>
    </footer>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  footer: { display: 'flex', justifyContent: 'space-around', padding: '40px', backgroundColor: '#ffeef4', marginTop: '50px' },
  section: { maxWidth: '300px' }
};