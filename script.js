document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. PARAMETER NAMA TAMU / GUEST NAME URL PARSER
       ========================================================================== */
    const urlParams = new URLSearchParams(window.location.search);
    const guestParam = urlParams.get('to') || urlParams.get('n') || urlParams.get('nama');
    const guestNameElement = document.getElementById('guest-name');
    
    if (guestParam && guestNameElement) {
        guestNameElement.textContent = decodeURIComponent(guestParam);
    }

    /* ==========================================================================
       2. COVER MODAL & BUKA UNDANGAN (AUDIO UNLOCK TRIGGER)
       ========================================================================== */
    const coverModal = document.getElementById('cover-modal');
    const btnOpenInvitation = document.getElementById('btn-open-invitation');
    const weddingAudio = document.getElementById('wedding-audio');
    const audioControl = document.getElementById('audio-control');
    const heroVideo = document.getElementById('hero-video');

    // Force play background video
    if (heroVideo) {
        heroVideo.muted = true;
        heroVideo.setAttribute('muted', '');
        heroVideo.play().catch(e => console.log("Video play error:", e));
    }

    window.openInvitation = function() {
        if (coverModal) coverModal.classList.add('hidden');
        playAudio();
        if (heroVideo) {
            heroVideo.muted = true;
            heroVideo.play().catch(e => console.log(e));
        }
        initScrollObserver();
    };

    if (btnOpenInvitation) {
        btnOpenInvitation.addEventListener('click', window.openInvitation);
    }

    /* ==========================================================================
       3. AUDIO PLAYER CONTROLLER (VINYL SPIN & TOGGLE)
       ========================================================================== */
    window.playAudio = function() {
        const audio = document.getElementById('wedding-audio') || weddingAudio;
        const ctrl = document.getElementById('audio-control') || audioControl;
        if (audio) {
            audio.muted = false;
            audio.volume = 1.0;
            if (!audio.src || audio.src.indexOf('mp3.mp3') === -1) {
                audio.src = 'assets/mp3.mp3';
            }
            audio.load();
            const promise = audio.play();
            if (promise !== undefined) {
                promise.then(() => {
                    if (ctrl) ctrl.classList.add('playing');
                }).catch((error) => {
                    console.log("Autoplay audio error:", error);
                });
            }
        }
    };

    function pauseAudio() {
        const audio = document.getElementById('wedding-audio') || weddingAudio;
        const ctrl = document.getElementById('audio-control') || audioControl;
        if (audio) {
            audio.pause();
            if (ctrl) ctrl.classList.remove('playing');
        }
    }

    if (audioControl) {
        audioControl.addEventListener('click', () => {
            if (weddingAudio.paused) {
                window.playAudio();
                showToast("Musik Diputar");
            } else {
                pauseAudio();
                showToast("Musik Dihentikan");
            }
        });
    }

    /* ==========================================================================
       4. LIVE COUNTDOWN TIMER
       ========================================================================== */
    const targetDate = new Date("January 1, 2029 09:00:00").getTime();

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            if (daysEl) daysEl.textContent = days < 10 ? '0' + days : days;
            if (hoursEl) hoursEl.textContent = hours < 10 ? '0' + hours : hours;
            if (minutesEl) minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
            if (secondsEl) secondsEl.textContent = seconds < 10 ? '0' + seconds : seconds;
        } else {
            if (daysEl) daysEl.textContent = "00";
            if (hoursEl) hoursEl.textContent = "00";
            if (minutesEl) minutesEl.textContent = "00";
            if (secondsEl) secondsEl.textContent = "00";
        }
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();

    /* ==========================================================================
       5. RSVP & GUESTBOOK (LOCAL STORAGE)
       ========================================================================== */
    const rsvpForm = document.getElementById('rsvp-form');
    const wishesList = document.getElementById('wishes-list');
    const wishCountEl = document.getElementById('wish-count');

    // Initial Default Sample Wishes (Empty for Real Guests)
    const defaultWishes = [];

    function getStoredWishes() {
        const stored = localStorage.getItem('wedding_wishes');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {}
        }
        return defaultWishes;
    }

    function renderWishes() {
        const wishes = getStoredWishes();
        if (wishCountEl) wishCountEl.textContent = wishes.length;

        if (wishesList) {
            if (wishes.length === 0) {
                wishesList.innerHTML = `
                    <div class="text-center" style="padding: 40px 10px; color: var(--text-muted); font-style: italic;">
                        <i class="far fa-comments" style="font-size: 2.2rem; margin-bottom: 12px; display: block; opacity: 0.5; color: var(--primary);"></i>
                        Belum ada ucapan. Jadilah yang pertama memberikan doa restu!
                    </div>
                `;
                return;
            }

            wishesList.innerHTML = wishes.map(wish => {
                let badgeClass = "badge-hadir";
                if (wish.attendance === "Tidak Hadir") badgeClass = "badge-tidak";
                if (wish.attendance === "Ragu-ragu") badgeClass = "badge-ragu";

                return `
                    <div class="wish-item">
                        <div class="wish-header">
                            <span class="wish-name">${escapeHtml(wish.name)}</span>
                            <span class="wish-badge ${badgeClass}">${escapeHtml(wish.attendance)}</span>
                        </div>
                        <p class="wish-text">"${escapeHtml(wish.message)}"</p>
                    </div>
                `;
            }).join('');
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('name').value.trim();
            const attendanceInput = document.getElementById('attendance').value;
            const messageInput = document.getElementById('message').value.trim();

            if (!nameInput || !attendanceInput || !messageInput) {
                showToast("Mohon lengkapi semua kolom formulir!");
                return;
            }

            const newWish = {
                name: nameInput,
                attendance: attendanceInput,
                message: messageInput,
                time: "Baru saja"
            };

            const currentWishes = getStoredWishes();
            currentWishes.unshift(newWish);
            localStorage.setItem('wedding_wishes', JSON.stringify(currentWishes));

            renderWishes();
            rsvpForm.reset();
            showToast("Terima kasih! Konfirmasi dan doa Anda berhasil terkirim.");
        });
    }

    renderWishes();

    /* ==========================================================================
       6. LIGHTBOX FOR GALLERY
       ========================================================================== */
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('.gallery-img');
            if (img && lightbox && lightboxImg) {
                lightboxImg.src = img.src;
                lightbox.classList.add('active');
            }
        });
    });

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });
    }

    /* ==========================================================================
       7. SCROLL ANIMATION OBSERVER
       ========================================================================== */
    function initScrollObserver() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const animatedElements = document.querySelectorAll('.fade-in, .reveal-left, .reveal-right');
        animatedElements.forEach(el => observer.observe(el));
    }

    initScrollObserver();

    /* ==========================================================================
       8. HERO SLIDER CAROUSEL (AUTOMATIC & INTERACTIVE SLIDESHOW)
       ========================================================================== */
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    const dotsContainer = document.getElementById('slider-dots');
    let currentSlide = 0;

    if (slides.length > 0) {
        // Create indicator dots
        if (dotsContainer) dotsContainer.innerHTML = '';
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            if (dotsContainer) dotsContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.dot');

        function updateSlideUI() {
            slides.forEach((slide, idx) => {
                if (idx === currentSlide) {
                    slide.classList.add('active');
                    const v = slide.querySelector('video');
                    if (v) { v.muted = true; v.play().catch(e => console.log(e)); }
                } else {
                    slide.classList.remove('active');
                }
            });
            if (dots.length > 0) {
                dots.forEach((dot, idx) => {
                    if (idx === currentSlide) dot.classList.add('active');
                    else dot.classList.remove('active');
                });
            }
        }

        function goToSlide(index) {
            currentSlide = (index + slides.length) % slides.length;
            updateSlideUI();
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            updateSlideUI();
        }

        function prevSlide() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            updateSlideUI();
        }

        let autoSlideTimer = setInterval(nextSlide, 3500);

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                clearInterval(autoSlideTimer);
                nextSlide();
                autoSlideTimer = setInterval(nextSlide, 3500);
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                clearInterval(autoSlideTimer);
                prevSlide();
                autoSlideTimer = setInterval(nextSlide, 3500);
            });
        }
    }
});

/* ==========================================================================
   GLOBAL COPY TO CLIPBOARD HELPER
   ========================================================================== */
function copyToClipboard(text, label) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`${label} berhasil disalin!`);
        }).catch(() => {
            fallbackCopy(text, label);
        });
    } else {
        fallbackCopy(text, label);
    }
}

function fallbackCopy(text, label) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast(`${label} berhasil disalin!`);
    } catch (err) {
        showToast(`Gagal menyalin ${label}`);
    }
    document.body.removeChild(textArea);
}

/* ==========================================================================
   GLOBAL TOAST NOTIFICATION HELPER
   ========================================================================== */
function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}
