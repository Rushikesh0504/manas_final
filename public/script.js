// ---------------------------------------------------------------------------
// script.js  (FULLY COMMENTED & CLEANED)
// ---------------------------------------------------------------------------

// -------------------------------------------------------
// 1) SCROLL REVEAL ANIMATION USING INTERSECTION OBSERVER
// -------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

  // Select all elements that must fade-in on scroll
  const fadeElements = document.querySelectorAll('.fade-scroll');

  // Create IntersectionObserver to detect scroll visibility
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Add 'show' class only when element comes in view
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
      }
    });
  }, { threshold: 0.20 }); 
  // threshold = 20% visibility before animation triggers

  // Observe each fade element
  fadeElements.forEach(el => observer.observe(el));

});

// -------------------------------------------------------
// 2) CONTACT FORM SUBMISSION USING FETCH API (POST)
// -------------------------------------------------------
const form = document.getElementById('contactForm');

if (form) {
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault(); // Prevent page refresh

    const status = document.getElementById('formStatus');
    status.textContent = 'Sending...';

    // Collect input values
    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      message: document.getElementById('message').value.trim()
    };

    try {
      // Send data to backend (Node.js / Express)
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.ok) {
        status.textContent = 'Message sent — we will contact you soon. Thank you!';
        form.reset(); // reset inputs after success
      } else {
        status.textContent = 'Error: ' + (result.error || 'Unable to send');
      }

    } catch (error) {
      console.error(error);
      status.textContent = 'Network error — try again later.';
    }

    // Clear status after 6 seconds
    setTimeout(() => { status.textContent = '' }, 6000);
  });

  // -------------------------------------------------------
  // 3) HERO SECTION BACKGROUND SLIDESHOW
  // -------------------------------------------------------

  const hero = document.querySelector('.hero');

  // List of background images to rotate
  const images = [
    './images/bg3.jpg',
    './images/bg2.jpg',
    './images/bg1.jpg'
  ];

  let index = 0;

  // Function to change hero background image
  function changeHeroBackground() {
    hero.style.backgroundImage = `url('.${images[index]}')`;
    index = (index + 1) % images.length;  
    // (%) ensures it loops back to the first image
  }

  // Set initial image
  changeHeroBackground();

  // Change image every 4 seconds
  setInterval(changeHeroBackground, 4000);

  // -------------------------------------------------------
  // 4) MOBILE HAMBURGER MENU (OPEN/CLOSE + AUTO CLOSE)
  // -------------------------------------------------------

  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("navMenu");

  // Toggle the menu when clicking the hamburger icon
  hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("show");
    hamburger.classList.toggle("active"); // animate hamburger (optional)
  });

  // Auto-close menu when any navigation link is clicked
  document.querySelectorAll("#navMenu a").forEach(link => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("show");
      hamburger.classList.remove("active"); // reset hamburger animation
    });
  });

}
