import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';

function LoginPage({ onLogin, goToRegister }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Check localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      // User data exists, call onLogin to skip login form
      onLogin(JSON.parse(storedUser));
    }
  }, [onLogin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      alert('Uzuza nimero na password.');
      return;
    }

    const userRef = ref(db, 'users/' + phone);
    try {
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.password === password) {
          alert('Winjiye neza!');
          // Save user data in localStorage
          localStorage.setItem('userData', JSON.stringify(userData));
          onLogin(userData); // Send user data to parent
        } else {
          alert('Ijambobanga si ryo.');
        }
      } else {
        alert('Nimero ya telefone ntibaho.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Habaye ikibazo. Ongera ugerageze.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Injira</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="tel"
          placeholder="Nimero ya telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Ijambobanga"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Injira
        </button>
      </form>
      <p style={styles.registerText}>
        Nta konti?{' '}
        <button onClick={goToRegister} style={styles.registerButton}>
          Iyandikishe
        </button>
      </p>
    </div>
  );
}

const styles = {
  container: {
    boxShadow: '4px 2px 4px 2px skyBlue',
    width: '300px',
    margin: '40% auto',
    background: '#A9D7E1',
    padding: '40px',
    border: '1px solid #ccc',
    borderRadius: '12px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    padding: '10px',
  },
  input: {
    marginTop: '15px',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '6px',
    border: '1px solid #aaa',
  },
  button: {
    padding: '10px',
    backgroundColor: '#28a745',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  },
  registerText: {
    marginTop: '15px',
  },
  registerButton: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
};

export default LoginPage;
