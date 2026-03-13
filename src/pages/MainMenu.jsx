import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Music, BookOpen } from 'lucide-react';

export default function MainMenu() {
    const navigate = useNavigate();
    const setActiveTab = useStore(state => state.setActiveTab);

    const handleSelect = (tab) => {
        setActiveTab(tab);
        navigate('/operator');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: 'radial-gradient(circle at top center, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
            color: 'var(--text-primary)',
            padding: '2rem'
        }}>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '4rem',
                animation: 'fadeInDown 0.8s ease-out'
            }}>
                <img
                    src="/logo.png"
                    alt="Pacto y Bendición Logo"
                    style={{
                        height: '140px',
                        marginBottom: '1.5rem',
                        borderRadius: '20px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(56, 189, 248, 0.2)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                />
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    margin: 0
                }}>PACTO Y BENDICIÓN</h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    letterSpacing: '4px',
                    textTransform: 'uppercase',
                    marginTop: '0.5rem'
                }}>S T U D I O</p>
            </div>

            <div style={{
                display: 'flex',
                gap: '2rem',
                animation: 'fadeInUp 0.8s ease-out 0.2s',
                animationFillMode: 'both'
            }}>
                <button
                    onClick={() => handleSelect('songs')}
                    className="menu-button"
                >
                    <div className="icon-wrapper">
                        <Music size={40} />
                    </div>
                    <h2>Alabanzas</h2>
                    <p>Gestión de setlists y letras interactiva</p>
                </button>

                <button
                    onClick={() => handleSelect('bible')}
                    className="menu-button bible-btn"
                >
                    <div className="icon-wrapper">
                        <BookOpen size={40} />
                    </div>
                    <h2>Biblia</h2>
                    <p>Proyección de versículos y citas en vivo</p>
                </button>
            </div>

            <style>
                {`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .menu-button {
                    background: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    backdrop-filter: blur(10px);
                    border-radius: 24px !important;
                    padding: 2.5rem 2rem !important;
                    display: flex;
                    flex-direction: column;
                    alignItems: center;
                    justify-content: center;
                    width: 280px;
                    height: 300px;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }

                .menu-button::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(circle at top left, var(--accent-transparent) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.4s;
                }

                .menu-button:hover {
                    transform: translateY(-10px) !important;
                    border-color: var(--accent) !important;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 30px var(--accent-transparent) !important;
                }

                .menu-button:hover::before {
                    opacity: 1;
                }

                .menu-button .icon-wrapper {
                    background: rgba(255,255,255,0.05);
                    padding: 1.5rem;
                    border-radius: 50%;
                    margin-bottom: 1.5rem;
                    color: var(--accent);
                    transition: all 0.3s;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .menu-button:hover .icon-wrapper {
                    background: var(--accent);
                    color: #fff;
                    transform: scale(1.1);
                    box-shadow: 0 10px 20px rgba(56, 189, 248, 0.3);
                }

                .menu-button h2 {
                    font-size: 1.5rem;
                    margin-bottom: 0.8rem;
                    color: #fff;
                    position: relative;
                    z-index: 2;
                }

                .menu-button p {
                    font-size: 0.95rem;
                    color: var(--text-secondary);
                    line-height: 1.4;
                    position: relative;
                    z-index: 2;
                }
                `}
            </style>
        </div>
    );
}
