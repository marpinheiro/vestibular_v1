import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/cadastro');
  };

  const handlePlanClick = () => {
    // Verificar se está logado
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard'); // Se logado, vai para dashboard
    } else {
      navigate('/login'); // Se não, pede para fazer login
    }
  };

  return (
    <div className="landing-page">
      {/* Header/Navbar */}
      <header className="header">
        <div className="container">
          <div className="navbar">
            <div className="logo">
              <h1>SempreAprender</h1>
            </div>
            <nav className="nav-menu">
              <a href="#recursos">Recursos</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#precos">Preços</a>
              <a href="#depoimentos">Depoimentos</a>
            </nav>
            <div className="nav-buttons">
              <button className="btn-login" onClick={handleLoginClick}>
                Entrar
              </button>
              <button className="btn-signup" onClick={handleSignupClick}>
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Seu plano de estudos personalizado com{' '}
              <span className="highlight">Inteligência Artificial</span>
            </h1>
            <p className="hero-subtitle">
              Conquiste sua vaga no vestibular com uma rotina de estudos criada
              especialmente para você
            </p>
            <button className="btn-cta" onClick={handleSignupClick}>
              Começar Agora - É Grátis
            </button>
            <p className="hero-note">
              ✓ Sem cartão de crédito • ✓ Plano personalizado em minutos
            </p>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="recursos">
        <div className="container">
          <h2 className="section-title">
            Tudo o que você precisa para ser aprovado
          </h2>
          <p className="section-subtitle">
            Uma plataforma completa que combina tecnologia e metodologia de
            estudo para maximizar suas chances de aprovação.
          </p>

          <div className="recursos-grid">
            <div className="recurso-card">
              <div className="recurso-icon">📅</div>
              <h3>Rotina Personalizada</h3>
              <p>
                Plano de estudos adaptado ao seu tempo, prova e nível de
                conhecimento. Ajustes automáticos baseados no seu desempenho.
              </p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">🎯</div>
              <h3>Foco na Sua Prova</h3>
              <p>
                Conteúdo alinhado ao edital do ENEM, IFs e universidades
                federais. Estude exatamente o que cai na sua prova.
              </p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">❓</div>
              <h3>Banco de Questões</h3>
              <p>
                Mais de 150 mil questões organizadas por ano, tema e
                dificuldade. Gabarito com explicação detalhada.
              </p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">✍️</div>
              <h3>Correção de Redação</h3>
              <p>
                Correção automática baseada nas 5 competências do ENEM. Nota
                simulada e sugestões de melhoria.
              </p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">📝</div>
              <h3>Simulados Completos</h3>
              <p>
                Simulados no formato da prova real. Relatório detalhado de
                desempenho e ajuste automático da rotina.
              </p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">📊</div>
              <h3>Acompanhamento de Progresso</h3>
              <p>
                Dashboard com seu progresso geral, pontos fortes e fracos. Veja
                sua evolução ao longo do tempo.
              </p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">🔄</div>
              <h3>Revisões Espaçadas</h3>
              <p>
                Sistema inteligente de revisão para fixar o conteúdo na memória
                de longo prazo.
              </p>
            </div>

            <div className="recurso-card">
              <div className="recurso-icon">🤖</div>
              <h3>IA Assistente</h3>
              <p>
                Tire dúvidas, peça explicações e receba orientações
                personalizadas com nossa IA.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="como-funciona">
        <div className="container">
          <h2 className="section-title">Como Funciona</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-icon">📝</div>
              <h3>Faça o cadastro</h3>
              <p>
                Responda algumas perguntas sobre sua prova, tempo disponível e
                dificuldades.
              </p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon">🤖</div>
              <h3>Receba seu plano</h3>
              <p>
                Nossa IA cria uma rotina de estudos personalizada para você
                atingir seus objetivos.
              </p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon">📚</div>
              <h3>Estude e pratique</h3>
              <p>
                Siga sua rotina, resolva questões e envie redações para
                correção.
              </p>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-icon">🎓</div>
              <h3>Seja aprovado!</h3>
              <p>
                Acompanhe seu progresso e ajuste sua rotina até conquistar sua
                vaga.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="precos" className="planos">
        <div className="container">
          <h2 className="section-title">Escolha seu plano</h2>
          <div className="planos-grid">
            <div className="plan-card">
              <h3 className="plan-name">Gratuito</h3>
              <div className="plan-price">
                <span className="price">R$ 0</span>
                <span className="period">/mês</span>
              </div>
              <ul className="plan-features">
                <li>✓ Plano de estudos básico</li>
                <li>✓ 50 questões por mês</li>
                <li>✓ 1 redação por mês</li>
                <li>✓ Acompanhamento básico</li>
              </ul>
              <button className="btn-plan" onClick={handlePlanClick}>
                Começar Grátis
              </button>
            </div>

            <div className="plan-card featured">
              <div className="badge">Mais Popular</div>
              <h3 className="plan-name">Premium</h3>
              <div className="plan-price">
                <span className="price">R$ 49,90</span>
                <span className="period">/mês</span>
              </div>
              <ul className="plan-features">
                <li>✓ Plano de estudos completo</li>
                <li>✓ Questões ilimitadas</li>
                <li>✓ 10 redações por mês</li>
                <li>✓ Simulados ilimitados</li>
                <li>✓ Análise detalhada</li>
                <li>✓ Suporte prioritário</li>
              </ul>
              <button className="btn-plan primary" onClick={handlePlanClick}>
                Assinar Agora
              </button>
            </div>

            <div className="plan-card">
              <h3 className="plan-name">Anual</h3>
              <div className="plan-price">
                <span className="price">R$ 399,90</span>
                <span className="period">/ano</span>
              </div>
              <p className="plan-save">Economize 33%</p>
              <ul className="plan-features">
                <li>✓ Tudo do Premium</li>
                <li>✓ Redações ilimitadas</li>
                <li>✓ Mentoria mensal</li>
                <li>✓ Material exclusivo</li>
                <li>✓ Garantia de 30 dias</li>
              </ul>
              <button className="btn-plan" onClick={handlePlanClick}>
                Assinar Anual
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="depoimentos">
        <div className="container">
          <h2 className="section-title">Histórias de aprovação</h2>
          <p className="section-subtitle">
            Veja o que nossos alunos aprovados têm a dizer sobre a plataforma.
          </p>

          <div className="depoimentos-grid">
            <div className="depoimento-card">
              <div className="depoimento-header">
                <div className="avatar">MC</div>
                <div className="aluno-info">
                  <h4>Maria Clara</h4>
                  <p>Medicina - UFMG</p>
                </div>
              </div>
              <p className="depoimento-texto">
                "A correção de redação foi fundamental! Saí de 600 para 920 em 6
                meses de estudo com o SempreAprender."
              </p>
            </div>

            <div className="depoimento-card">
              <div className="depoimento-header">
                <div className="avatar">JP</div>
                <div className="aluno-info">
                  <h4>João Pedro</h4>
                  <p>Engenharia - ITA</p>
                </div>
              </div>
              <p className="depoimento-texto">
                "A rotina personalizada me ajudou a organizar meus estudos e
                focar no que realmente importava. Passei de primeira!"
              </p>
            </div>

            <div className="depoimento-card">
              <div className="depoimento-header">
                <div className="avatar">AB</div>
                <div className="aluno-info">
                  <h4>Ana Beatriz</h4>
                  <p>Direito - USP</p>
                </div>
              </div>
              <p className="depoimento-texto">
                "O banco de questões é incrível! Questões organizadas por tema
                facilitam muito a preparação."
              </p>
            </div>

            <div className="depoimento-card">
              <div className="depoimento-header">
                <div className="avatar">LS</div>
                <div className="aluno-info">
                  <h4>Lucas Silva</h4>
                  <p>Ciência da Computação - UFPE</p>
                </div>
              </div>
              <p className="depoimento-texto">
                "Os simulados são muito realistas e o relatório de desempenho me
                mostrou exatamente onde melhorar."
              </p>
            </div>

            <div className="depoimento-card">
              <div className="depoimento-header">
                <div className="avatar">CS</div>
                <div className="aluno-info">
                  <h4>Camila Santos</h4>
                  <p>Enfermagem - UFRJ</p>
                </div>
              </div>
              <p className="depoimento-texto">
                "Estudei sozinha com o SempreAprender e consegui passar na
                federal que eu sonhava. Super recomendo!"
              </p>
            </div>

            <div className="depoimento-card">
              <div className="depoimento-header">
                <div className="avatar">RC</div>
                <div className="aluno-info">
                  <h4>Rafael Costa</h4>
                  <p>Administração - UFBA</p>
                </div>
              </div>
              <p className="depoimento-texto">
                "A IA assistente tira todas as dúvidas na hora. É como ter um
                professor particular 24 horas."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-final">
        <div className="container">
          <h2>Pronto para começar sua jornada?</h2>
          <p>
            Junte-se a milhares de estudantes que já estão se preparando com o
            SempreAprender
          </p>
          <button className="btn-cta" onClick={handleSignupClick}>
            Criar Conta Gratuita
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>SempreAprender</h3>
              <p>Sua aprovação começa aqui</p>
            </div>
            <div className="footer-section">
              <h4>Produto</h4>
              <a href="#recursos">Recursos</a>
              <a href="#como-funciona">Como Funciona</a>
              <a href="#precos">Preços</a>
            </div>
            <div className="footer-section">
              <h4>Suporte</h4>
              <a href="#contato">Contato</a>
              <a href="#faq">FAQ</a>
              <a href="#ajuda">Central de Ajuda</a>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <a href="#termos">Termos de Uso</a>
              <a href="#privacidade">Privacidade</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 SempreAprender. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
