// src/components/CollapsibleCard.jsx
import React from 'react';

export default function CollapsibleCard({ title, children }) {
  if (!children) {
    return null;
  }

  return (
    <section className="sidebar-card">
      <details className="collapsible-section">
        <summary className="collapsible-summary">
          {title}
        </summary>
        <div className="collapsible-content">
          {children}
        </div>
      </details>
    </section>
  );
}