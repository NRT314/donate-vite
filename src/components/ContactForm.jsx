import React, { useState } from 'react';

export default function ContactForm({ t }) {
  const [status, setStatus] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(t.contact_status_sending);
    const form = event.target;
    const data = new FormData(form);
    
    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        setStatus(t.contact_status_success);
        form.reset();
      } else {
        setStatus(t.contact_status_error);
      }
    } catch (error) {
      setStatus(t.contact_status_error);
    }
  };

  return (
    <section className="sidebar-card">
      <h2 className="sidebar-card__title">{t.contact_title}</h2>
      <form
        action="https://formspree.io/f/xrblykve"
        method="POST"
        onSubmit={handleSubmit}
        className="contact-form"
      >
        <input type="email" name="_replyto" placeholder="Email" className="form-input" />
        <textarea name="message" rows="3" placeholder="Message" className="form-textarea" required></textarea>
        <button type="submit" className="form-button">Send</button>
        {status && <p className="form-status">{status}</p>}
      </form>
    </section>
  );
}