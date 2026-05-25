document.addEventListener('DOMContentLoaded', function() {
    // Initialize maze preview
    initMazePreview();
    
    // Add click event to launch button
    const startButton = document.getElementById('start-visualizer');
    startButton.addEventListener('click', launchVisualizer);
    
    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
    
    // Animate stats on scroll
    animateStatsOnScroll();
    
    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});

function initMazePreview() {
    const mazeGrid = document.querySelector('.maze-grid');
    const gridSize = 10;
    
    // Clear existing cells
    mazeGrid.innerHTML = '';
    
    // Create maze cells
    for(let i = 0; i < gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.className = 'maze-cell';
        
        // Add start and end points
        if(i === 0) cell.classList.add('start');
        if(i === gridSize * gridSize - 1) cell.classList.add('end');
        
        // Add some path and visited cells for demonstration
        if(i === 1 || i === 2 || i === 3 || i === 13 || i === 23 || i === 33 || i === 43 || i === 53) {
            cell.classList.add('path');
        }
        
        if(i === 4 || i === 5 || i === 6 || i === 7 || i === 8 || i === 9 || i === 14 || i === 24 || i === 34) {
            cell.classList.add('visited');
        }
        
        mazeGrid.appendChild(cell);
    }
    
    // Animate the pathfinding demonstration
    animateMazePreview();
}

function animateMazePreview() {
    const pathCells = document.querySelectorAll('.maze-cell.path');
    const visitedCells = document.querySelectorAll('.maze-cell.visited');
    
    // Reset all cells to default state
    document.querySelectorAll('.maze-cell').forEach(cell => {
        cell.style.opacity = '1';
    });
    
    // Animate path cells
    pathCells.forEach((cell, index) => {
        setTimeout(() => {
            cell.style.opacity = '0.3';
            setTimeout(() => {
                cell.style.opacity = '1';
            }, 500);
        }, index * 200);
    });
    
    // Animate visited cells after path animation
    setTimeout(() => {
        visitedCells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.opacity = '0.3';
                setTimeout(() => {
                    cell.style.opacity = '1';
                }, 300);
            }, index * 100);
        });
    }, pathCells.length * 200);
    
    // Repeat animation
    setTimeout(animateMazePreview, 5000);
}

function launchVisualizer() {
    const button = document.getElementById('start-visualizer');
    
    // Add loading state
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading Visualizer...</span>';
    button.disabled = true;
    
    // Remove pulse animation
    const pulse = document.querySelector('.btn-pulse');
    if (pulse) pulse.style.display = 'none';
    
    // Redirect to maze page
    setTimeout(() => {
        // Use the correct URL based on your backend
        // For Flask: /maze
        // For direct file: maze.html
        window.location.href = '/maze';  // or 'maze.html' if no backend
    }, 500);
}
function animateStatsOnScroll() {
    const statsSection = document.querySelector('.hero');
    const stats = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                stats.forEach(stat => {
                    const finalValue = stat.textContent;
                    
                    if(!isNaN(parseInt(finalValue))) {
                        // Animate numeric stats
                        let startValue = 0;
                        const endValue = parseInt(finalValue);
                        const duration = 2000;
                        const increment = endValue / (duration / 16);
                        
                        const timer = setInterval(() => {
                            startValue += increment;
                            if(startValue >= endValue) {
                                startValue = endValue;
                                clearInterval(timer);
                            }
                            stat.textContent = Math.floor(startValue) + '+';
                        }, 16);
                    } else {
                        // For non-numeric stats, just add a fade-in effect
                        stat.style.opacity = '0';
                        stat.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            stat.style.transition = 'all 0.5s ease';
                            stat.style.opacity = '1';
                            stat.style.transform = 'translateY(0)';
                        }, 500);
                    }
                });
                
                // Stop observing after animation
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    if(statsSection) {
        observer.observe(statsSection);
    }
}

// Add interactive particle effect on mouse move
document.addEventListener('mousemove', function(e) {
    const particles = document.querySelector('.particles');
    if(!particles) {
        particles = document.createElement('div');
        particles.className = 'particles';
        document.querySelector('.bg-animation').appendChild(particles);
    }
    
    // Create particle
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = '4px';
    particle.style.height = '4px';
    particle.style.backgroundColor = 'rgba(0, 212, 255, 0.5)';
    particle.style.borderRadius = '50%';
    particle.style.left = e.pageX + 'px';
    particle.style.top = e.pageY + 'px';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '1';
    
    particles.appendChild(particle);
    
    // Animate particle
    let opacity = 0.5;
    let size = 4;
    const animation = setInterval(() => {
        opacity -= 0.02;
        size += 0.5;
        
        particle.style.opacity = opacity;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.transform = `translate(-50%, -50%) scale(${size/4})`;
        
        if(opacity <= 0) {
            clearInterval(animation);
            particle.remove();
        }
    }, 30);
});

// Add scroll effect to header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if(window.scrollY > 50) {
        header.style.backgroundColor = 'rgba(10, 14, 23, 0.9)';
        header.style.backdropFilter = 'blur(10px)';
        header.style.padding = '15px 0';
        header.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
    } else {
        header.style.backgroundColor = 'transparent';
        header.style.backdropFilter = 'none';
        header.style.padding = '30px 0';
        header.style.boxShadow = 'none';
    }
});