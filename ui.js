const ui = {
    /**
     * Show a screen by ID, hide all others.
     * @param {string} screenName - one of "home", "library", "form", "review"
     */
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Show the requested screen
        const screenId = `screen-${screenName}`;
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
        } else {
            console.error(`Screen ${screenId} not found`);
        }
    },

    /**
     * Render home screen.
     * Shows card count and action buttons.
     * @param {number} totalCards - total number of cards
     * @param {number} dueCards - number of cards due for review
     */
    renderHome(totalCards, dueCards) {
        const homeContent = document.getElementById('home-content');
        homeContent.innerHTML = `
            <div class="home-stats">
                <p>Total cards: <strong>${totalCards}</strong></p>
                <p>Due for review: <strong>${dueCards}</strong></p>
            </div>
            <div class="button-group">
                <button id="btn-new-card" class="btn">New Card</button>
                <button id="btn-library" class="btn">Library</button>
                <button id="btn-review" class="btn ${dueCards === 0 ? 'disabled' : ''}">
                    Start Review
                </button>
            </div>
        `;

        // Attach event listeners (app.js will handle routing)
        document.getElementById('btn-new-card').addEventListener('click', () => {
            app.showScreen('form');
        });

        document.getElementById('btn-library').addEventListener('click', () => {
            app.showScreen('library');
        });

        if (dueCards > 0) {
            document.getElementById('btn-review').addEventListener('click', () => {
                app.showScreen('review');
            });
        }
    },

    /**
     * Render library screen.
     * Shows list of all cards with edit/delete options.
     * @param {array} cards - array of card objects
     */
    renderLibrary(cards) {
        const libraryContent = document.getElementById('library-content');

        if (cards.length === 0) {
            libraryContent.innerHTML = '<p>No cards yet. Create one to get started.</p>';
        } else {
            let html = '<ul class="card-list">';
            cards.forEach(card => {
                const nextReview = utils.formatDate(card.nextReviewAt);
                html += `
                    <li class="card-item">
                        <div class="card-info">
                            <strong>${card.hanzi}</strong> (${card.pinyin})
                            <p class="card-meaning">${card.meaning}</p>
                            <p class="card-next-review">Next review: ${nextReview}</p>
                        </div>
                        <div class="card-actions">
                            <button class="btn-small edit" data-id="${card.id}">Edit</button>
                            <button class="btn-small delete" data-id="${card.id}">Delete</button>
                        </div>
                    </li>
                `;
            });
            html += '</ul>';
            libraryContent.innerHTML = html;

            // Attach event listeners (app.js will handle actions)
            document.querySelectorAll('.card-item .edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cardId = e.target.dataset.id;
                    app.editCardStart(cardId);
                });
            });

            document.querySelectorAll('.card-item .delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cardId = e.target.dataset.id;
                    app.deleteCard(cardId);
                });
            });
        }

        // Add back button
        libraryContent.innerHTML += '<button id="btn-back-home" class="btn">Back</button>';
        document.getElementById('btn-back-home').addEventListener('click', () => {
            app.showScreen('home');
        });
    },

    /**
     * Render card form (create or edit).
     * @param {object|null} card - card object to edit, or null for new card
     */
    renderForm(card = null) {
        const formTitle = document.getElementById('form-title');
        const cardForm = document.getElementById('card-form');

        formTitle.textContent = card ? 'Edit Card' : 'New Card';

        cardForm.innerHTML = `
            <div class="form-group">
                <label for="input-hanzi">Hanzi *</label>
                <input type="text" id="input-hanzi" placeholder="e.g., 学习" value="${card ? card.hanzi : ''}" required>
            </div>
            <div class="form-group">
                <label for="input-pinyin">Pinyin *</label>
                <input type="text" id="input-pinyin" placeholder="e.g., xuéxí" value="${card ? card.pinyin : ''}" required>
            </div>
            <div class="form-group">
                <label for="input-meaning">Meaning *</label>
                <input type="text" id="input-meaning" placeholder="e.g., to study" value="${card ? card.meaning : ''}" required>
            </div>
            <div class="form-group">
                <label for="input-example">Example Sentence</label>
                <input type="text" id="input-example" placeholder="(optional)" value="${card ? card.exampleSentence : ''}">
            </div>
            <div class="button-group">
                <button type="button" id="btn-form-save" class="btn">Save</button>
                <button type="button" id="btn-form-cancel" class="btn">Cancel</button>
            </div>
        `;

        // Attach event listeners (app.js will handle save/cancel)
        document.getElementById('btn-form-save').addEventListener('click', () => {
            const formData = {
                hanzi: document.getElementById('input-hanzi').value.trim(),
                pinyin: document.getElementById('input-pinyin').value.trim(),
                meaning: document.getElementById('input-meaning').value.trim(),
                exampleSentence: document.getElementById('input-example').value.trim()
            };
            app.saveCard(formData, card ? card.id : null);
        });

        document.getElementById('btn-form-cancel').addEventListener('click', () => {
            app.showScreen('home');
        });
    },

    /**
     * Render review screen.
     * @param {array} dueCards - array of cards due for review
     * @param {object|null} currentCard - currently displayed card, or null if none
     * @param {boolean} revealed - whether the back of card is shown
     */
    renderReview(dueCards, currentCard = null, revealed = false) {
        const reviewContent = document.getElementById('review-content');

        if (!currentCard) {
            reviewContent.innerHTML = '<p>No cards due for review today!</p>';
            reviewContent.innerHTML += '<button id="btn-review-done" class="btn">Back to Home</button>';
            document.getElementById('btn-review-done').addEventListener('click', () => {
                app.showScreen('home');
            });
            return;
        }

        if (!revealed) {
            // Show front (hanzi only)
            reviewContent.innerHTML = `
                <div class="card-display">
                    <div class="card-front">
                        <div class="card-hanzi">${currentCard.hanzi}</div>
                    </div>
                    <button id="btn-reveal" class="btn">Reveal</button>
                </div>
                <p class="card-progress">${dueCards.indexOf(currentCard) + 1} of ${dueCards.length}</p>
            `;

            document.getElementById('btn-reveal').addEventListener('click', () => {
                app.revealCard();
            });
        } else {
            // Show back (pinyin, meaning, example)
            let exampleHtml = '';
            if (currentCard.exampleSentence) {
                exampleHtml = `<p class="card-example"><strong>Example:</strong> ${currentCard.exampleSentence}</p>`;
            }

            reviewContent.innerHTML = `
                <div class="card-display">
                    <div class="card-back">
                        <div class="card-hanzi">${currentCard.hanzi}</div>
                        <p class="card-pinyin">${currentCard.pinyin}</p>
                        <p class="card-meaning">${currentCard.meaning}</p>
                        ${exampleHtml}
                    </div>
                    <div class="rating-buttons">
                        <button class="btn rating-btn again" data-rating="Again">Again</button>
                        <button class="btn rating-btn hard" data-rating="Hard">Hard</button>
                        <button class="btn rating-btn good" data-rating="Good">Good</button>
                        <button class="btn rating-btn easy" data-rating="Easy">Easy</button>
                    </div>
                </div>
                <p class="card-progress">${dueCards.indexOf(currentCard) + 1} of ${dueCards.length}</p>
            `;

            document.querySelectorAll('.rating-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const rating = e.target.dataset.rating;
                    app.submitRating(currentCard.id, rating);
                });
            });
        }
    }
};
