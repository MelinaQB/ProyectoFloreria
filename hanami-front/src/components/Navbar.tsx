import React from 'react';
import { useNavigate } from 'react-router-dom';

// Le decimos a TypeScript que esta Navbar recibe una función para cambiar de sección
export const Navbar = ({ setSeccion }: { setSeccion: (s: string) => void }) => {
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo} onClick={() => setSeccion('inicio')}>🌸 Hanami</h2>
      <ul style={styles.menu}>
        <li style={styles.menuItem} onClick={() => setSeccion('inicio')}>Catálogo</li>
        <li style={styles.menuItem} onClick={() => setSeccion('nosotros')}>Sobre Nosotros</li>
      </ul>
      <button onClick={() => navigate('/login')} style={styles.loginBtn}>
        Iniciar Sesión
      </button>
    </nav>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 50px', backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  logo: { color: '#d63384', margin: 0, cursor: 'pointer' },
  menu: { display: 'flex', listStyle: 'none', gap: '20px' },
  menuItem: { cursor: 'pointer', fontWeight: '500', color: '#333' },
  loginBtn: { backgroundColor: '#d63384', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }
};