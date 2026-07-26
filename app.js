const app = {
    // State
    cards: [],
    currentScreen: 'home',
    currentReviewCard: null,
    reviewCardRevealed: false,
    autoFillTimeout: null,

    /**
     * Initialize app on page load.
     * Load cards from storage and render home screen.
     */
    init() {
        this.cards = storage.getCards();
        this.showScreen('home');
    },

    /**
     * Switch to a screen and render it.
     * @param {string} screenName - one of "home", "library", "form", "review"
     */
    showScreen(screenName) {
        this.currentScreen = screenName;
        this.reviewCardRevealed = false;

        switch (screenName) {
            case 'home':
                ui.showScreen('home');
                this.renderHome();
                break;
            case 'library':
                ui.showScreen('library');
                ui.renderLibrary(this.cards);
                break;
            case 'form':
                ui.showScreen('form');
                ui.renderForm(null);
                break;
            case 'review':
                ui.showScreen('review');
                this.startReview();
                break;
            default:
                console.error(`Unknown screen: ${screenName}`);
        }
    },

    /**
     * Render home screen with card counts.
     */
    renderHome() {
        const totalCards = this.cards.length;
        const dueCards = this.getDueCards().length;
        ui.renderHome(totalCards, dueCards);
    },

    /**
     * Get array of cards that are due for review (nextReviewAt <= today).
     */
    getDueCards() {
        const today = utils.todayTimestamp();
        return this.cards.filter(card => card.nextReviewAt <= today);
    },

    /**
     * Create a new card from form data.
     * @param {object} formData - { hanzi, pinyin, meaning, exampleSentence }
     */
    createCard(formData) {
        const validation = utils.validateCard(formData);
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'));
            return;
        }

        const newCard = {
            id: utils.generateId(),
            hanzi: formData.hanzi,
            pinyin: formData.pinyin,
            meaning: formData.meaning,
            exampleSentence: formData.exampleSentence || null,
            createdAt: Date.now(),
            lastReviewedAt: null,
            nextReviewAt: utils.todayTimestamp(), // Due immediately
            interval: 0,
            reviewCount: 0
        };

        storage.saveCard(newCard);
        this.cards.push(newCard);
        this.showScreen('home');
    },

    /**
     * Start editing a card.
     * Show form pre-populated with card data.
     */
    editCardStart(cardId) {
        const card = utils.findCardById(this.cards, cardId);
        if (!card) {
            console.error(`Card ${cardId} not found`);
            return;
        }

        this.currentEditCardId = cardId;
        ui.showScreen('form');
        ui.renderForm(card);
    },

    /**
     * Save an edited card.
     * @param {object} formData - { hanzi, pinyin, meaning, exampleSentence }
     * @param {string} cardId - card id (null for new card)
     */
    saveCard(formData, cardId) {
        const validation = utils.validateCard(formData);
        if (!validation.valid) {
            alert('Validation errors:\n' + validation.errors.join('\n'));
            return;
        }

        if (cardId) {
            // Update existing card
            const card = utils.findCardById(this.cards, cardId);
            if (!card) {
                console.error(`Card ${cardId} not found`);
                return;
            }

            card.hanzi = formData.hanzi;
            card.pinyin = formData.pinyin;
            card.meaning = formData.meaning;
            card.exampleSentence = formData.exampleSentence || null;

            storage.updateCard(card);
        } else {
            // Create new card
            this.createCard(formData);
            return;
        }

        this.showScreen('home');
    },

    /**
     * Delete a card by id.
     */
    deleteCard(cardId) {
        const card = utils.findCardById(this.cards, cardId);
        if (!card) {
            console.error(`Card ${cardId} not found`);
            return;
        }

        if (confirm(`Delete "${card.hanzi}"?`)) {
            storage.deleteCard(cardId);
            this.cards = this.cards.filter(c => c.id !== cardId);
            ui.renderLibrary(this.cards);
        }
    },

    /**
     * Auto-fill Pinyin, Meaning, and Example from Hanzi using Claude API.
     * Called when user finishes typing Hanzi (with debounce).
     * @param {string} hanzi - Chinese text to analyze
     */
    async autoFillFromHanzi(hanzi) {
        const query = hanzi ? hanzi.trim() : '';
        if (!query) {
            ui.showAutoFillLoading(false);
            return;
        }

        // Show loading state
        ui.showAutoFillLoading(true);

        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&dt=rm&q=${encodeURIComponent(query)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }

            const data = await response.json();

            let meaning = '';
            let pinyin = '';

            if (data && data[0]) {
                // Meaning is in data[0][0][0]
                if (data[0][0] && data[0][0][0]) {
                    meaning = data[0][0][0];
                }
                // Pinyin is in data[0][1][3] or data[0][0][3]
                if (data[0][1] && data[0][1][3]) {
                    pinyin = data[0][1][3];
                } else if (data[0][0] && data[0][0][3]) {
                    pinyin = data[0][0][3];
                }
            }

            // Update form input fields if found
            const pinyinInput = document.getElementById('input-pinyin');
            const meaningInput = document.getElementById('input-meaning');

            if (pinyinInput && pinyin) {
                pinyinInput.value = pinyin;
            }
            if (meaningInput && meaning) {
                meaningInput.value = meaning;
            }

            ui.showAutoFillLoading(false);
        } catch (error) {
            console.error('Auto-fill error:', error);
            ui.showAutoFillLoading(false);
        }
    },

    /**
     * Debounced auto-fill trigger (called on Hanzi input change).
     * @param {string} hanzi - Chinese text
     */
    triggerAutoFill(hanzi) {
        // Clear previous timeout
        clearTimeout(this.autoFillTimeout);

        // Set new timeout (wait 400ms after user stops typing)
        this.autoFillTimeout = setTimeout(() => {
            this.autoFillFromHanzi(hanzi);
        }, 400);
    },

    /**
     * Start a review session.
     * Load the first due card and show the review screen.
     */
    startReview() {
        const dueCards = this.getDueCards();

        if (dueCards.length === 0) {
            ui.renderReview([], null, false);
            return;
        }

        this.currentReviewCard = dueCards[0];
        this.reviewCardRevealed = false;
        ui.renderReview(dueCards, this.currentReviewCard, false);
    },

    /**
     * Reveal the back of the current card.
     */
    revealCard() {
        if (!this.currentReviewCard) return;
        this.reviewCardRevealed = true;

        const dueCards = this.getDueCards();
        ui.renderReview(dueCards, this.currentReviewCard, true);
    },

    /**
     * Submit a rating for the current card.
     * Calculate next review date, save, and move to next card.
     * @param {string} cardId - card id
     * @param {string} rating - one of "Again", "Hard", "Good", "Easy"
     */
    submitRating(cardId, rating) {
        const card = utils.findCardById(this.cards, cardId);
        if (!card) {
            console.error(`Card ${cardId} not found`);
            return;
        }

        // Calculate new interval and next review date
        const nextInterval = scheduler.getNextInterval(card, rating);
        const nextReviewAt = scheduler.getNextReviewDate(nextInterval);

        // Update card
        card.lastReviewedAt = Date.now();
        card.nextReviewAt = nextReviewAt;
        card.interval = nextInterval;
        card.reviewCount += 1;

        // Persist
        storage.updateCard(card);

        // Move to next due card
        const dueCards = this.getDueCards();
        const currentIndex = dueCards.indexOf(this.currentReviewCard);
        const nextIndex = currentIndex + 1;

        if (nextIndex < dueCards.length) {
            this.currentReviewCard = dueCards[nextIndex];
            this.reviewCardRevealed = false;
            ui.renderReview(dueCards, this.currentReviewCard, false);
        } else {
            // No more cards due
            this.currentReviewCard = null;
            ui.renderReview(dueCards, null, false);

            // Add button to return home
            setTimeout(() => {
                const reviewContent = document.getElementById('review-content');
                reviewContent.innerHTML += '<button id="btn-review-done" class="btn">Back to Home</button>';
                document.getElementById('btn-review-done').addEventListener('click', () => {
                    this.showScreen('home');
                });
            }, 0);
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});