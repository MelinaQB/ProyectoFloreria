import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';

export const AuthScreen = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState(''); 
  const [showPassword, setShowPassword] = useState(false);

  // 🤖 ESTADOS PARA EL CONTROL DEL CAPTCHA MATEMÁTICO
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [captchaRespuestaUsuario, setCaptchaRespuestaUsuario] = useState('');

  // Función para regenerar números aleatorios del CAPTCHA
  const generarCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1); // Números del 1 al 10
    setNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaRespuestaUsuario(''); // Limpia la respuesta anterior
  };

  // Generar un nuevo captcha cada vez que el usuario cambia entre Login y Registro
  useEffect(() => {
    generarCaptcha();
  }, [isLogin]);

  const getStrength = (pass: string) => {
    if (pass.length === 0) return { label: '', color: 'transparent', width: '0%' };
    if (pass.length < 6) return { label: 'Débil', color: '#ff4d4d', width: '33%' };
    const hasNumbers = /\d/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasSpecial = /[!@#$%^&*]/.test(pass);
    if (pass.length >= 8 && hasNumbers && hasUpper && hasSpecial) return { label: 'Fuerte', color: '#6fb3a8', width: '100%' };
    return { label: 'Intermedia', color: '#f1c40f', width: '66%' };
  };

  const strength = getStrength(password);

  const handleAuth = async () => {
    if (!email || !password) {
      alert("⚠️ Por favor, llena el correo y la contraseña.");
      return;
    }
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexCorreo.test(email)) {
      alert("📧 Error: Por favor, introduce un correo electrónico válido (Ejemplo: usuario@dominio.com).");
      return;
    }

    // 🤖 VALIDACIÓN ESTRICTA DEL CAPTCHA MATEMÁTICO (Para ambos modos)
    const solucionCorrecta = num1 + num2;
    if (parseInt(captchaRespuestaUsuario) !== solucionCorrecta) {
      alert("🤖 CAPTCHA Incorrecto: Comprueba que eres un humano resolviendo la suma correctamente.");
      generarCaptcha(); // Cambia los números para mayor seguridad
      return;
    }

    // --- 🔑 MODO INICIAR SESIÓN (CONEXIÓN ESTRICTA A NESTJS) ---
    if (isLogin) {
      try {
        const response = await fetch('http://localhost:3000/usuarios/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            contrasena: password
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Credenciales incorrectas');
        }

        localStorage.setItem('hanami_user', data.email);
        localStorage.setItem('hanami_role', data.rol); 
        localStorage.setItem('hanami_celular', data.celular || ''); 
        localStorage.setItem('hanami_uid', data.id);

        if (data.role === 'Admin' || data.rol === 'Admin') {
          alert(`👑 ¡Bienvenida, Administradora ${data.nombre}!`);
          navigate('/admin'); 
        } else {
          alert(`🌸 ¡Hola ${data.nombre}! Sesión iniciada correctamente.`);
          navigate('/'); 
        }

      } catch (error: any) {
        alert(`❌ Error de Ingreso: ${error.message}`);
        generarCaptcha(); // Si falla el login, cambia la suma por seguridad
      }
      return; 
    }

    // --- 📝 MODO REGISTRO (Mantiene tu conexión real impecable) ---
    if (telefono.length < 8) {
      alert("📱 Por favor ingresa un número de celular válido de Bolivia.");
      return;
    }

    if (strength.label === 'Débil') {
      alert("🔒 Tu contraseña es muy débil. Añade mayúsculas, números o símbolos.");
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: email.split('@')[0],
          email: email,
          celular: telefono,
          contrasena: password,
          rol: 'Cliente'
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al registrar usuario');

      alert("🌸 ¡Registro exitoso en Hanami! Tu cuenta ha sido guardada y encriptada de forma segura.");
      setIsLogin(true); 

    } catch (error: any) {
      alert(`❌ Error en el servidor: ${error.message}`);
      generarCaptcha();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? '🔑 Iniciar Sesión' : '📝 Registro Hanami'}
        </h2>

        <div className="auth-input-group">
          <label className="auth-label">Correo Electrónico:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@correo.com" className="auth-input" />
        </div>

        {!isLogin && (
          <div className="auth-input-group">
            <label className="auth-label">Nro. de Celular (WhatsApp):</label>
            <input type="number" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 71234567" className="auth-input" />
          </div>
        )}

        <div className="auth-input-group">
          <label className="auth-label">Contraseña:</label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-eye-btn">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {!isLogin && password && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#1f2f2e' }}>
              <span>Seguridad: <b style={{ color: strength.color }}>{strength.label}</b></span>
            </div>
            <div className="auth-strength-track">
              <div style={{ height: '100%', borderRadius: '3px', transition: 'width 0.3s', width: strength.width, backgroundColor: strength.color }} />
            </div>
          </div>
        )}

        {/* 🤖 SECCIÓN DEL CAPTCHA MATEMÁTICO REAL PARA ENTRAR AL SISTEMA */}
        <div style={{
          backgroundColor: '#f5f6fa',
          padding: '12px 15px',
          borderRadius: '8px',
          border: '1px solid #dcdde1',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <label className="auth-label" style={{ marginBottom: '8px', display: 'block', color: '#2f3640' }}>
            Verificación de Seguridad (CAPTCHA):
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: '#e1b12c',
              color: 'white',
              fontWeight: 'bold',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '1.05rem',
              letterSpacing: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              userSelect: 'none' 
            }}>
              <span>{num1} + {num2} = ?</span>
            </div>
            
            <button 
              type="button" 
              onClick={generarCaptcha} 
              style={{ background: 'none', border: 'none', color: '#7f8c8d', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Cambiar operación"
            >
              <RefreshCw size={16} />
            </button>

            <input 
              type="number" 
              placeholder="Resultado" 
              value={captchaRespuestaUsuario}
              onChange={(e) => setCaptchaRespuestaUsuario(e.target.value)}
              className="auth-input" 
              style={{ margin: 0, height: '36px', flex: 1, textAlign: 'center', fontWeight: 'bold' }}
            />
          </div>
        </div>

        <button onClick={handleAuth} className="auth-submit-btn">
          {isLogin ? 'Ingresar' : 'Crear Cuenta'}
        </button>

        <p className="auth-switch-text">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <span onClick={() => setIsLogin(!isLogin)} className="auth-switch-link">
            {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
          </span>
        </p>
      </div>
    </div>
  );
};