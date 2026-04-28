document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mountIntroOverlay = () => {
    document.body.classList.add("intro-lock");

    const overlay = document.createElement("div");
    overlay.className = "intro-overlay";
    overlay.innerHTML = `
      <div class="intro-core">
        <span class="intro-ring r1"></span>
        <span class="intro-ring r2"></span>
        <span class="intro-ring r3"></span>
        <div class="intro-brand">
          <h1>zylense.ai</h1>
          <p>AI Webinar Experience</p>
          <div class="intro-progress"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    if (prefersReducedMotion) {
      overlay.querySelectorAll(".intro-ring").forEach((ring) => {
        ring.style.animation = "none";
      });
    }

    const done = () => {
      overlay.classList.add("hide");
      window.setTimeout(() => {
        overlay.remove();
        document.body.classList.remove("intro-lock");
      }, 620);
    };

    window.setTimeout(done, 1950);
  };

  mountIntroOverlay();

  const revealTargets = document.querySelectorAll(".section, .panel, .stat, .course-card");
  revealTargets.forEach((node) => node.classList.add("will-reveal"));

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach((node) => observer.observe(node));
  } else {
    revealTargets.forEach((node) => node.classList.add("revealed"));
  }

  if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);

    let mx = -999;
    let my = -999;
    let gx = -999;
    let gy = -999;

    document.addEventListener("mousemove", (event) => {
      mx = event.clientX - 110;
      my = event.clientY - 110;
      glow.style.opacity = "1";
    });

    document.addEventListener("mouseleave", () => {
      glow.style.opacity = "0";
    });

    const tick = () => {
      gx += (mx - gx) * 0.16;
      gy += (my - gy) * 0.16;
      glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
      requestAnimationFrame(tick);
    };
    tick();

    const tiltTargets = document.querySelectorAll(".course-card, .panel, .stat, .hero-media img");
    tiltTargets.forEach((target) => {
      target.classList.add("interactive");

      target.addEventListener("mousemove", (event) => {
        const rect = target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const px = (x / rect.width - 0.5) * 2;
        const py = (y / rect.height - 0.5) * 2;
        const rotateY = px * 5;
        const rotateX = -py * 5;
        target.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
      });

      target.addEventListener("mouseleave", () => {
        target.style.transform = "";
      });
    });
  }
});
