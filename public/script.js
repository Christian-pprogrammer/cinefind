// Movie Discovery App - Main JavaScript
class MovieApp {
    constructor() {
        this.currentPage = 1;
        this.currentSearch = '';
        this.currentFilter = 'popular';
        this.watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        this.isLoading = false;
        this.showInitialLoader();
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.loadPopularMovies();
        this.updateWatchlistCount();
        this.generateYearFilters();
        
        setTimeout(() => this.hideInitialLoader(), 1000);

        console.log('🎬 CineFind initialized!');
    }

    showInitialLoader() {
        // Create a nice initial loading screen
        const loaderHTML = `
            <div class="initial-loader">
                <div class="loader-content">
                    <div class="loader-logo">
                        <i class="fas fa-film"></i>
                        <span>CineFind</span>
                    </div>
                    <div class="loader-spinner"></div>
                    <p>Loading awesome movies...</p>
                </div>
            </div>
        `;
        
        const loader = document.createElement('div');
        loader.innerHTML = loaderHTML;
        document.body.appendChild(loader);
        
        this.initialLoader = loader;
    }

    hideInitialLoader() {
        if (this.initialLoader) {
            this.initialLoader.style.opacity = '0';
            this.initialLoader.style.transform = 'scale(1.1)';
            setTimeout(() => {
                if (this.initialLoader.parentNode) {
                    this.initialLoader.remove();
                }
            }, 500);
        }
    }


    bindEvents() {
        // Search functionality
        document.getElementById('search-btn').addEventListener('click', () => this.handleSearch());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target);
            });
        });

        // Filters
        document.getElementById('year-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('type-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('clear-filters').addEventListener('click', () => this.clearFilters());

        // Load more
        document.getElementById('load-more-btn').addEventListener('click', () => this.loadMore());

        // Modal
        document.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('movie-modal').addEventListener('click', (e) => {
            if (e.target.id === 'movie-modal') this.closeModal();
        });

        // Watchlist button
        document.getElementById('watchlist-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.showWatchlist();
        });
    }

    async handleSearch() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        this.currentSearch = query;
        this.currentFilter = 'search';
        this.currentPage = 1;
        
        this.showLoading();
        await this.searchMovies(query);
    }

    async searchMovies(query) {
        try {
            const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}&page=${this.currentPage}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Search failed');
            }

            if (data.Response === 'False') {
                this.showNoResults();
                return;
            }

            this.displayMovies(data.Search || []);
            this.toggleLoadMore(!!data.Search && data.Search.length > 0);

        } catch (error) {
            console.error('Search error:', error);
            this.showError(error.message);
        }
    }

    async loadPopularMovies() {
        this.currentFilter = 'popular';
        this.currentSearch = '';
        this.currentPage = 1;
        
        this.showLoading();
        
        try {
            const response = await fetch(`/api/movies/popular?page=${this.currentPage}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load movies');
            }

            if (data.Response === 'False' || !data.Search) {
                this.showNoResults();
                return;
            }

            this.displayMovies(data.Search);
            this.toggleLoadMore(data.Search.length > 0);

        } catch (error) {
            console.error('Error loading popular movies:', error);
            this.showError(error.message);
        }
    }

    async loadMore() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPage++;
        
        const loadMoreBtn = document.getElementById('load-more-btn');
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        loadMoreBtn.disabled = true;

        try {
            let data;
            if (this.currentFilter === 'search') {
                const response = await fetch(`/api/movies/search?q=${encodeURIComponent(this.currentSearch)}&page=${this.currentPage}`);
                data = await response.json();
            } else {
                const response = await fetch(`/api/movies/popular?page=${this.currentPage}`);
                data = await response.json();
            }

            if (data.Response === 'True' && data.Search) {
                this.displayMovies(data.Search, true);
                this.toggleLoadMore(data.Search.length > 0);
            } else {
                this.toggleLoadMore(false);
            }

        } catch (error) {
            console.error('Error loading more movies:', error);
            this.showError('Failed to load more movies');
        } finally {
            this.isLoading = false;
            loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More Movies';
            loadMoreBtn.disabled = false;
        }
    }

    displayMovies(movies, append = false) {
        const moviesGrid = document.getElementById('movies-grid');
        const skeleton = document.getElementById('loading-skeleton');
        
        // Hide skeleton and show grid
        skeleton.classList.add('hidden');
        moviesGrid.classList.remove('hidden');
        
        if (!append) {
            moviesGrid.innerHTML = '';
        }

        if (!movies || movies.length === 0) {
            this.showNoResults();
            return;
        }

        // Hide no results and error messages
        document.getElementById('no-results').classList.add('hidden');
        document.getElementById('error-message').classList.add('hidden');

        movies.forEach(movie => {
            const movieCard = this.createMovieCard(movie);
            moviesGrid.appendChild(movieCard);
        });

        // Add smooth entrance animation
        setTimeout(() => {
            const cards = moviesGrid.querySelectorAll('.movie-card');
            cards.forEach((card, index) => {
                if (append || index >= moviesGrid.children.length - movies.length) {
                    card.style.animation = `fadeInUp 0.6s ease ${index * 0.1}s both`;
                }
            });
        }, 50);
    }

    createMovieCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : ''}" 
                 alt="${movie.Title}" 
                 class="movie-poster"
                 onerror="this.src=''">
            <div class="movie-info">
                <h3 class="movie-title">${movie.Title}</h3>
                <p class="movie-year">${movie.Year}</p>
                <span class="movie-type">${movie.Type || 'movie'}</span>
                <div class="movie-actions">
                    <button class="watchlist-btn ${this.isInWatchlist(movie.imdbID) ? 'active' : ''}" 
                            data-movie-id="${movie.imdbID}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;

        // Add click event for movie details
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.watchlist-btn')) {
                this.showMovieDetails(movie.imdbID);
            }
        });

        // Watchlist button
        const watchlistBtn = card.querySelector('.watchlist-btn');
        watchlistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleWatchlist(movie);
        });

        return card;
    }

    async showMovieDetails(movieId) {
        try {
            const response = await fetch(`/api/movie/${movieId}`);
            const movie = await response.json();

            if (!response.ok) {
                throw new Error(movie.error || 'Failed to load movie details');
            }

            this.displayMovieModal(movie);

        } catch (error) {
            console.error('Error loading movie details:', error);
            this.showError('Failed to load movie details');
        }
    }

    displayMovieModal(movie) {
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
            <div class="modal-movie">
                <div class="modal-poster">
                    <img src="${movie.Poster !== 'N/A' ? movie.Poster : ''}" 
                         alt="${movie.Title}"
                         onerror="this.src=''">
                </div>
                <div class="modal-details">
                    <h2>${movie.Title}</h2>
                    <div class="modal-meta">
                        <span class="modal-year">${movie.Year}</span>
                        <span class="modal-runtime">${movie.Runtime || 'N/A'}</span>
                        <span class="modal-rating">
                            <i class="fas fa-star"></i> ${movie.imdbRating || 'N/A'}
                        </span>
                    </div>
                    <div class="modal-genre">
                        ${movie.Genre ? movie.Genre.split(', ').map(genre => 
                            `<span class="genre-tag">${genre}</span>`
                        ).join('') : ''}
                    </div>
                    <p class="modal-plot">${movie.Plot || 'No plot available.'}</p>
                    <div class="modal-cast">
                        <strong>Director:</strong> ${movie.Director || 'N/A'}<br>
                        <strong>Cast:</strong> ${movie.Actors || 'N/A'}
                    </div>
                    <div class="modal-actions">
                        <button class="modal-watchlist-btn ${this.isInWatchlist(movie.imdbID) ? 'active' : ''}" 
                                data-movie-id="${movie.imdbID}">
                            <i class="fas fa-heart"></i>
                            ${this.isInWatchlist(movie.imdbID) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add watchlist functionality to modal button
        const watchlistBtn = modalContent.querySelector('.modal-watchlist-btn');
        watchlistBtn.addEventListener('click', () => {
            this.toggleWatchlist(movie);
            watchlistBtn.classList.toggle('active');
            watchlistBtn.innerHTML = `
                <i class="fas fa-heart"></i>
                ${watchlistBtn.classList.contains('active') ? 'Remove from Watchlist' : 'Add to Watchlist'}
            `;
        });

        this.openModal();
    }

    toggleWatchlist(movie) {
        const isInWatchlist = this.isInWatchlist(movie.imdbID);
        
        if (isInWatchlist) {
            this.watchlist = this.watchlist.filter(m => m.imdbID !== movie.imdbID);
        } else {
            this.watchlist.push({
                imdbID: movie.imdbID,
                Title: movie.Title,
                Year: movie.Year,
                Poster: movie.Poster,
                Type: movie.Type
            });
        }

        // Update localStorage
        localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
        
        // Update UI
        this.updateWatchlistCount();
        this.updateWatchlistButtons(movie.imdbID);
        
        // Show notification
        this.showNotification(
            isInWatchlist ? 'Removed from watchlist' : 'Added to watchlist!',
            isInWatchlist ? 'warning' : 'success'
        );
    }

    isInWatchlist(movieId) {
        return this.watchlist.some(movie => movie.imdbID === movieId);
    }

    updateWatchlistButtons(movieId) {
        // Update all watchlist buttons for this movie
        const buttons = document.querySelectorAll(`[data-movie-id="${movieId}"]`);
        buttons.forEach(btn => {
            btn.classList.toggle('active', this.isInWatchlist(movieId));
        });
    }

    updateWatchlistCount() {
        const countElement = document.getElementById('watchlist-count');
        countElement.textContent = this.watchlist.length;
    }

    showWatchlist() {
        if (this.watchlist.length === 0) {
            this.showNotification('Your watchlist is empty!', 'info');
            return;
        }

        this.displayMovies(this.watchlist);
        this.showNotification(`Showing ${this.watchlist.length} movies in your watchlist`, 'info');
    }

    handleNavigation(clickedElement) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        clickedElement.classList.add('active');

        const filter = clickedElement.dataset.filter;
        
        if (filter === 'popular') {
            this.loadPopularMovies();
        } else if (filter === 'search') {
            document.getElementById('search-input').focus();
        }
    }

    applyFilters() {
        const year = document.getElementById('year-filter').value;
        const type = document.getElementById('type-filter').value;
        
        // For now, we'll reload with current filter
        // In a real app, we'd filter the existing data or make new API calls
        this.showNotification('Filters applied!', 'info');
    }

    clearFilters() {
        document.getElementById('year-filter').value = '';
        document.getElementById('type-filter').value = '';
        this.showNotification('Filters cleared!', 'info');
    }

    generateYearFilters() {
        const yearSelect = document.getElementById('year-filter');
        const currentYear = new Date().getFullYear();
        
        for (let year = currentYear; year >= 1950; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }

    showLoading() {
        const skeleton = document.getElementById('loading-skeleton');
        const moviesGrid = document.getElementById('movies-grid');
        
        // Generate skeleton cards
        skeleton.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'skeleton-card';
            skeletonCard.innerHTML = `
                <div class="skeleton-poster"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line" style="width: 40%"></div>
                </div>
            `;
            skeleton.appendChild(skeletonCard);
        }
        
        skeleton.classList.remove('hidden');
        moviesGrid.classList.add('hidden');
        document.getElementById('no-results').classList.add('hidden');
        document.getElementById('error-message').classList.add('hidden');
        document.getElementById('load-more-container').classList.add('hidden');
    }

    showNoResults() {
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('movies-grid').classList.add('hidden');
        document.getElementById('no-results').classList.remove('hidden');
        document.getElementById('error-message').classList.add('hidden');
        document.getElementById('load-more-container').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('loading-skeleton').classList.add('hidden');
        document.getElementById('movies-grid').classList.add('hidden');
        document.getElementById('no-results').classList.add('hidden');
        
        const errorElement = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        errorText.textContent = message;
        errorElement.classList.remove('hidden');
        document.getElementById('load-more-container').classList.add('hidden');
    }

    toggleLoadMore(show) {
        const loadMoreContainer = document.getElementById('load-more-container');
        if (show) {
            loadMoreContainer.classList.remove('hidden');
        } else {
            loadMoreContainer.classList.add('hidden');
        }
    }

    openModal() {
        document.getElementById('movie-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('movie-modal').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles for notification
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 2rem;
                background: var(--card-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--card-border);
                border-radius: 12px;
                padding: 1rem 1.5rem;
                color: var(--text-primary);
                z-index: 3000;
                animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s forwards;
                max-width: 300px;
            }
            .notification-success { border-left: 4px solid var(--success); }
            .notification-error { border-left: 4px solid var(--error); }
            .notification-warning { border-left: 4px solid var(--warning); }
            .notification-info { border-left: 4px solid var(--accent-blue); }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
            if (style.parentNode) {
                style.remove();
            }
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Add CSS animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .movie-card {
        opacity: 0;
        animation-fill-mode: both;
    }
`;
document.head.appendChild(animationStyles);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MovieApp();
});

// Add error handling for images
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('movie-poster')) {
        e.target.src = '';
    }
}, true);

// Service worker-like offline functionality (basic)
window.addEventListener('online', () => {
    const app = document.querySelector('.navbar')?.app;
    if (app) {
        app.showNotification('Connection restored!', 'success');
    }
});

window.addEventListener('offline', () => {
    const app = document.querySelector('.navbar')?.app;
    if (app) {
        app.showNotification('You are offline', 'warning');
    }
});

console.log('🚀 Movie Discovery App Loaded!');