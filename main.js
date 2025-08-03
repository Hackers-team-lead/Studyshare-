// DOM Elements
const themeSwitch = document.querySelector('.theme-switch input');
const toggleIcon = document.getElementById('toggle-icon');
const mobileMenu = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-links');
const pageTransition = document.createElement('div');
pageTransition.className = 'page-transition';
document.body.appendChild(pageTransition);

// Dark/Light Mode Toggle
function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        toggleIcon.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        toggleIcon.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Check for saved theme preference
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
        themeSwitch.checked = true;
        toggleIcon.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Event Listeners
themeSwitch.addEventListener('change', switchTheme);
mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a nav link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Page Transition
document.querySelectorAll('a').forEach(link => {
    if (link.href && !link.href.includes('javascript') && !link.href.includes('mailto') && !link.href.includes('tel')) {
        link.addEventListener('click', (e) => {
            if (link.target === '_blank' || link.href.includes('#')) return;
            
            e.preventDefault();
            pageTransition.classList.add('active');
            
            setTimeout(() => {
                window.location.href = link.href;
            }, 500);
        });
    }
});

// Check if page was loaded with transition
window.addEventListener('load', () => {
    setTimeout(() => {
        pageTransition.classList.remove('active');
    }, 500);
});

// Intersection Observer for scroll animations
const animateElements = document.querySelectorAll('[data-animate]');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1
});

animateElements.forEach(element => {
    observer.observe(element);
});

// GSAP Animations
document.addEventListener('DOMContentLoaded', () => {
    // Hero section animation
    gsap.from('.hero-content', {
        duration: 1,
        opacity: 0,
        x: -50,
        ease: 'power3.out'
    });
    
    gsap.from('.hero-image', {
        duration: 1,
        opacity: 0,
        x: 50,
        ease: 'power3.out',
        delay: 0.2
    });
    
    // Features animation
    gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 80%'
            },
            duration: 0.8,
            opacity: 0,
            y: 50,
            ease: 'back.out',
            delay: i * 0.1
        });
    });
    
    // Material cards animation
    gsap.utils.toArray('.material-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 85%'
            },
            duration: 0.6,
            opacity: 0,
            y: 30,
            ease: 'power2.out',
            delay: i * 0.1
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                gsap.to(window, {
                    duration: 1,
                    scrollTo: {
                        y: targetElement,
                        offsetY: 80
                    },
                    ease: 'power2.inOut'
                });
            }
        });
    });
});