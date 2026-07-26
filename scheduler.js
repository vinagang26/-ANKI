const scheduler = {
    /**
     * Calculate next review interval based on current card state and user rating.
     * 
     * First review (interval = 0):
     *   Again → 1 day
     *   Hard → 2 days
     *   Good → 3 days
     *   Easy → 7 days
     * 
     * Subsequent reviews (interval > 0):
     *   Again → interval × 0.5, minimum 1 day
     *   Hard → interval × 1.5
     *   Good → interval × 2
     *   Easy → interval × 3
     * 
     * @param {object} card - card object with interval field
     * @param {string} rating - one of "Again", "Hard", "Good", "Easy"
     * @returns {number} new interval in days (rounded to whole number)
     */
    getNextInterval(card, rating) {
        let nextInterval;

        if (card.interval === 0) {
            // First review
            switch (rating) {
                case 'Again':
                    nextInterval = 1;
                    break;
                case 'Hard':
                    nextInterval = 2;
                    break;
                case 'Good':
                    nextInterval = 3;
                    break;
                case 'Easy':
                    nextInterval = 7;
                    break;
                default:
                    throw new Error(`Unknown rating: ${rating}`);
            }
        } else {
            // Subsequent review
            switch (rating) {
                case 'Again':
                    nextInterval = Math.max(1, Math.round(card.interval * 0.5));
                    break;
                case 'Hard':
                    nextInterval = Math.round(card.interval * 1.5);
                    break;
                case 'Good':
                    nextInterval = Math.round(card.interval * 2);
                    break;
                case 'Easy':
                    nextInterval = Math.round(card.interval * 3);
                    break;
                default:
                    throw new Error(`Unknown rating: ${rating}`);
            }
        }

        return Math.round(nextInterval);
    },

    /**
     * Calculate the absolute timestamp for the next review date.
     * @param {number} intervalDays - interval in days
     * @returns {number} timestamp for review date at 00:00:00
     */
    getNextReviewDate(intervalDays) {
        return utils.addDaysToToday(intervalDays);
    }
};
