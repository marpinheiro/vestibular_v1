import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar email
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (validateForm()) {
      setLoading(true);

      try {
        const result = await login(formData.email, formData.password);

        if (result.success) {
          navigate('/dashboard');
        } else {
          setApiError(result.message || 'Email ou senha incorretos');
        }
      } catch (error) {
        setApiError('Erro ao fazer login. Tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {/* Lado Esquerdo - Imagem/Info */}
        <div className="auth-left">
          <div className="auth-brand">
            <h1>SempreAprender</h1>
            <p>Sua aprovação começa aqui</p>
          </div>
          <div className="auth-illustration">
            <div className="illustration-content">
              <h2>Bem-vindo de volta!</h2>
              <p>
                Continue sua jornada rumo à aprovação. Acesse sua conta e retome
                seus estudos.
              </p>
              <ul className="benefits-list">
                <li>✓ Acesse seu plano de estudos personalizado</li>
                <li>✓ Continue de onde parou</li>
                <li>✓ Acompanhe seu progresso</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="auth-right">
          <div className="auth-form-container">
            <div className="auth-header">
              <h2>Entrar na sua conta</h2>
              <p>
                Não tem uma conta?{' '}
                <Link to="/cadastro">Cadastre-se grátis</Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {apiError && <div className="alert alert-error">{apiError}</div>}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Senha</label>
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={errors.password ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">{errors.password}</span>
                )}
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Lembrar de mim</span>
                </label>
                <Link to="/esqueci-senha" className="forgot-password">
                  Esqueceu a senha?
                </Link>
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>

              <div className="divider">
                <span>ou continue com</span>
              </div>

              <div className="social-login">
                <button type="button" className="btn-social google full-width">
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <path
                      fill="#4285F4"
                      d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"
                    />
                    <path
                      fill="#34A853"
                      d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"
                    />
                    <path
                      fill="#EA4335"
                      d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"
                    />
                  </svg>
                  Continuar com Google
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
