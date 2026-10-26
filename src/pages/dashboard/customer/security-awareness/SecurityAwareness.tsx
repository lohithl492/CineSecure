import { useState } from 'react';
import './SecurityAwareness.css';

const slides = [
  {
    eyebrow: 'SECURITY AWARENESS',
    title: 'A Safer Way to Enjoy Movies',
    description:
      'CineSecure makes movie ticket booking simple. Security helps protect your account, payments, bookings, and personal information.',
    items: [
      { icon: '♙', title: 'Your Account', text: 'Keep your account protected.' },
      { icon: '▣', title: 'Your Payments', text: 'Use trusted payment methods.' },
      { icon: '▤', title: 'Your Bookings', text: 'Keep your ticket details safe.' },
      { icon: '⬟', title: 'Your Privacy', text: 'Protect personal information.' },
    ],
  },
  {
    eyebrow: 'THE BOOKING JOURNEY',
    title: 'How It Works',
    description:
      'Every movie booking passes through several steps. Each step needs to handle information securely.',
    items: [
      { icon: '⌕', title: '1. Browse', text: 'Choose a movie and showtime.' },
      { icon: '▦', title: '2. Select Seats', text: 'Choose your preferred seats.' },
      { icon: '₹', title: '3. Pay', text: 'Complete payment securely.' },
      { icon: '▤', title: '4. Get Ticket', text: 'Receive your booking confirmation.' },
    ],
  },
  {
    eyebrow: 'UNDERSTANDING THE RISKS',
    title: 'What Can Go Wrong?',
    description:
      'If security is not handled correctly, a movie booking application may expose users to these risks.',
    items: [
      {
        icon: '♙',
        title: 'Unauthorized Access',
        text: 'Someone accesses an account or action without permission.',
      },
      {
        icon: '▦',
        title: 'Duplicate Booking',
        text: 'Two customers may attempt to reserve the same seat.',
      },
      {
        icon: '₹',
        title: 'Payment Manipulation',
        text: 'An unverified payment result may be wrongly trusted.',
      },
      {
        icon: '▤',
        title: 'Data Exposure',
        text: 'Private booking information may be exposed.',
      },
    ],
  },
  {
    eyebrow: 'SECURITY IN PRACTICE',
    title: 'How Security Protects You',
    description:
      'Well-designed security controls help reduce risks throughout the booking process.',
    items: [
      {
        icon: '⬟',
        title: 'Authentication',
        text: 'Verify who is signing in.',
      },
      {
        icon: '♙',
        title: 'Access Control',
        text: 'Restrict actions according to user roles.',
      },
      {
        icon: '▣',
        title: 'Payment Verification',
        text: 'Verify payment results on the server.',
      },
      {
        icon: '≡',
        title: 'Audit Logging',
        text: 'Record important events for investigation.',
      },
    ],
  },
  {
    eyebrow: 'REMEMBER THESE',
    title: 'Key Takeaways',
    description:
      'A safer booking experience depends on secure systems and informed users.',
    items: [
      {
        icon: '♙',
        title: 'Protect Your Account',
        text: 'Use a strong password and never share it.',
      },
      {
        icon: '▣',
        title: 'Pay Carefully',
        text: 'Check payment status and use trusted methods.',
      },
      {
        icon: '▤',
        title: 'Check Your Booking',
        text: 'Review your show, seats, and ticket details.',
      },
      {
        icon: '⬟',
        title: 'Protect Your Data',
        text: 'Be careful with suspicious links and requests.',
      },
    ],
  },
];

export function SecurityAwareness() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide];

  const previousSlide = () => {
    setCurrentSlide((current) => Math.max(0, current - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((current) =>
      Math.min(slides.length - 1, current + 1),
    );
  };

  const finishSlides = () => {
    setCurrentSlide(0);
  };

  return (
    <main className="security-awareness">
      <div className="sa-progress-header">
        <span className="sa-slide-count">
          <span>{String(currentSlide + 1).padStart(2, '0')}</span>
          {' / '}
          {String(slides.length).padStart(2, '0')}
        </span>

        <div
          className="sa-progress-track"
          role="progressbar"
          aria-label="Presentation progress"
          aria-valuemin={1}
          aria-valuemax={slides.length}
          aria-valuenow={currentSlide + 1}
        >
          <div
            className="sa-progress-fill"
            style={{
              width: `${((currentSlide + 1) / slides.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <section className="sa-slide" key={currentSlide}>
        <p className="sa-eyebrow">{slide.eyebrow}</p>

        <h1 className="sa-title">
          {currentSlide === 0 && (
            <>
              A Safer Way to <span>Enjoy Movies</span>
            </>
          )}

          {currentSlide === 1 && (
            <>
              How It <span>Works</span>
            </>
          )}

          {currentSlide === 2 && (
            <>
              What Can Go <span>Wrong?</span>
            </>
          )}

          {currentSlide === 3 && (
            <>
              How Security <span>Protects You</span>
            </>
          )}

          {currentSlide === 4 && (
            <>
              Key <span>Takeaways</span>
            </>
          )}
        </h1>

        <p className="sa-description">{slide.description}</p>

        <div className="sa-cards">
          {slide.items.map((item, index) => (
            <article
              className="sa-card"
              key={`${currentSlide}-${item.title}`}
            >
              <div
                className={`sa-icon sa-icon-${index + 1}`}
                aria-hidden="true"
              >
                {item.icon}
              </div>

              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="sa-controls">
        <button
          type="button"
          className="sa-button sa-previous"
          onClick={previousSlide}
          disabled={currentSlide === 0}
        >
          <span aria-hidden="true">←</span> Previous
        </button>

        <div className="sa-dots" aria-label="Choose a slide">
          {slides.map((item, index) => (
            <button
              type="button"
              key={item.title}
              className={`sa-dot ${
                index === currentSlide ? 'active' : ''
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}: ${item.title}`}
              aria-current={
                index === currentSlide ? 'step' : undefined
              }
            />
          ))}
        </div>

        {currentSlide < slides.length - 1 ? (
          <button
            type="button"
            className="sa-button sa-next"
            onClick={nextSlide}
          >
            Next <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button
            type="button"
            className="sa-button sa-next"
            onClick={finishSlides}
          >
            Finish <span aria-hidden="true">↻</span>
          </button>
        )}
      </footer>
    </main>
  );
}

