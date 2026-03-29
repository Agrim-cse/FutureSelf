import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Navbar from './Navbar';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // New state for eye toggle
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // For confirm password toggle
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          localStorage.setItem('finquest_user', JSON.stringify(userData));
          const dbKey = userData.profile.status === 'earning' ? `db_${userData.profile.name}` : `db_student_${userData.profile.name}`;
          localStorage.setItem(dbKey, JSON.stringify(userData.dashboardData));
          if (userData.profile.status === 'earning') navigate('/pro-dashboard');
          else navigate('/student-dashboard');
        } else {
          navigate('/onboarding'); 
        }
      } else {
        // Validate password match on signup
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please try again.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.message.replace('Firebase:', '').trim());
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active{
            -webkit-box-shadow: 0 0 0 30px #030712 inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      
      <div style={{ minHeight: '90vh', backgroundColor: '#030712', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '1rem' }}>
        <div style={{ maxWidth: '400px', width: '100%', backgroundColor: '#111827', padding: '2.5rem', borderRadius: '1rem', border: '1px solid #374151', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f3f4f6', marginBottom: '0.5rem' }}>
            Fin<span style={{ color: '#10b981' }}>Quest</span>
          </h1>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>{isLogin ? 'Welcome back, Commander.' : 'Create your secure account.'}</p>

          {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="email" placeholder="Email Address" required 
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', outline: 'none' }} 
            />
            
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password (min 6 chars)" required 
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '1rem', paddingRight: '3rem', borderRadius: '0.5rem', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', outline: 'none' }} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>

            {!isLogin && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm Password" required={!isLogin}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '1rem', paddingRight: '3rem', borderRadius: '0.5rem', backgroundColor: '#030712', border: '1px solid #374151', color: '#fff', outline: 'none' }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  {showConfirmPassword ? '👁️' : '🙈'}
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} style={{ padding: '1rem', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', transition: '0.2s' }}>
              {loading ? 'Processing...' : (isLogin ? 'Access Dashboard' : 'Initialize Account')}
            </button>
          </form>

          <p style={{ color: '#9ca3af', marginTop: '1.5rem', fontSize: '0.9rem' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#10b981', cursor: 'pointer', fontWeight: 'bold' }}>
              {isLogin ? 'Sign Up' : 'Log In'}
            </span>
          </p>
        </div>
      </div>
    </>
  );
};

export default AuthPage;