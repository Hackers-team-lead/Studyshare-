document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    // FAQ accordion functionality
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const icon = question.querySelector('i');
            
            // Toggle answer
            answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
            
            // Toggle icon
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
            
            // Toggle active class
            question.parentElement.classList.toggle('active');
        });
    });
    
    // Contact form submission
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
        
        // Here you would typically send the form data to a server
        // For this example, we'll just show a success message
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
        
        // In a real implementation, you might use Firebase or your backend:
        // db.collection('contacts').add(formData)
        //     .then(() => {
        //         alert('Thank you for your message! We will get back to you soon.');
        //         contactForm.reset();
        //     })
        //     .catch(error => {
        //         console.error('Error sending message:', error);
        //         alert('There was an error sending your message. Please try again.');
        //     });
    });
});