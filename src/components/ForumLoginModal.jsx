// src/components/ForumLoginModal.jsx
import React from 'react';

// t - объект перевода, onLogin - функция для входа через кошелек, 
// onAnonymous - функция для анонимного перехода, onClose - закрыть окно.
export default function ForumLoginModal({ t, onLogin, onAnonymous, onClose, isAuthLoading }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">{t.forum_modal_title || 'Forum Access'}</h2>
                <p className="modal-description">{t.forum_modal_description || 'How would you like to proceed?'}</p>
                
                <div className="modal-actions">
                    <button 
                        className="button button--primary" 
                        onClick={onLogin} 
                        disabled={isAuthLoading}
                    >
                        {isAuthLoading ? t.loading_text : (t.forum_login_button || 'Login with Wallet')}
                    </button>
                    <button 
                        className="button" 
                        onClick={onAnonymous}
                        disabled={isAuthLoading}
                    >
                        {t.forum_anonymous_button || 'Continue Anonymously'}
                    </button>
                </div>

                <button className="modal-close-button" onClick={onClose}>&times;</button>
            </div>
        </div>
    );
}