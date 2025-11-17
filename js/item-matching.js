// Item Matching System - Detects similar items and sends notifications
// This implements the matching algorithm mentioned in the demo

import { collection, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db } from './firebase-config.js';

class ItemMatchingService {
    constructor() {
        this.matchThreshold = 0.6; // 60% similarity threshold (can be adjusted)
        this.matchingEnabled = true; // Can be toggled on/off
    }

    /**
     * Check for similar items when a new item is submitted
     * @param {Object} newItem - The newly submitted item
     * @returns {Array} Array of similar items with match scores
     */
    async findSimilarItems(newItem) {
        if (!this.matchingEnabled) {
            console.log('🔕 Item matching is currently disabled');
            return [];
        }

        try {
            console.log('🔍 Checking for similar items...');
            
            // Only match FOUND items against LOST items (and vice versa)
            const oppositeType = newItem.mode === 'FOUND' ? 'LOST' : 'FOUND';
            
            // Query items of opposite type that are approved and visible
            const itemsCollection = collection(db, 'items');
            const q = query(
                itemsCollection,
                where('type', '==', oppositeType),
                where('status', '==', 'APPROVED'),
                orderBy('submittedAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const potentialMatches = [];
            
            querySnapshot.forEach((doc) => {
                const existingItem = { id: doc.id, ...doc.data() };
                const matchScore = this.calculateMatchScore(newItem, existingItem);
                
                if (matchScore >= this.matchThreshold) {
                    potentialMatches.push({
                        item: existingItem,
                        score: matchScore,
                        reasons: this.getMatchReasons(newItem, existingItem)
                    });
                }
            });
            
            // Sort by match score (highest first)
            potentialMatches.sort((a, b) => b.score - a.score);
            
            console.log(`✅ Found ${potentialMatches.length} potential matches`);
            return potentialMatches;
        } catch (error) {
            console.error('❌ Error finding similar items:', error);
            return [];
        }
    }

    /**
     * Calculate similarity score between two items (0.0 to 1.0)
     * Uses multiple factors:
     * - Category match (30%)
     * - Title/description keywords (25%)
     * - Brand/model match (20%)
     * - Color match (15%)
     * - Location proximity (10%)
     */
    calculateMatchScore(item1, item2) {
        let score = 0;
        let totalWeight = 0;

        // 1. Category match (30% weight)
        if (item1.category && item2.category) {
            const categoryWeight = 0.3;
            if (item1.category === item2.category) {
                score += categoryWeight;
            }
            totalWeight += categoryWeight;
        }

        // 2. Title and description keywords (25% weight)
        const keywordWeight = 0.25;
        const keywords1 = this.extractKeywords(item1);
        const keywords2 = this.extractKeywords(item2);
        const keywordMatch = this.calculateKeywordSimilarity(keywords1, keywords2);
        score += keywordMatch * keywordWeight;
        totalWeight += keywordWeight;

        // 3. Brand/model match (20% weight)
        if (item1.brand && item2.brand) {
            const brandWeight = 0.2;
            const brand1 = item1.brand.toLowerCase().trim();
            const brand2 = item2.brand.toLowerCase().trim();
            if (brand1 === brand2) {
                score += brandWeight;
            } else if (brand1.includes(brand2) || brand2.includes(brand1)) {
                score += brandWeight * 0.7; // Partial match
            }
            totalWeight += brandWeight;
        }

        // 4. Color match (15% weight)
        if (item1.colors && item2.colors && item1.colors.length > 0 && item2.colors.length > 0) {
            const colorWeight = 0.15;
            const colors1 = item1.colors.map(c => c.toLowerCase());
            const colors2 = item2.colors.map(c => c.toLowerCase());
            const commonColors = colors1.filter(c => colors2.includes(c));
            if (commonColors.length > 0) {
                score += colorWeight;
            }
            totalWeight += colorWeight;
        }

        // 5. Location proximity (10% weight)
        if (item1.location && item2.location) {
            const locationWeight = 0.1;
            if (item1.location === item2.location) {
                score += locationWeight;
            } else if (this.areLocationsNearby(item1.location, item2.location)) {
                score += locationWeight * 0.5; // Nearby locations
            }
            totalWeight += locationWeight;
        }

        // Normalize score to 0-1 range
        return totalWeight > 0 ? score / totalWeight : 0;
    }

    /**
     * Extract keywords from title and description
     */
    extractKeywords(item) {
        const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
        // Remove common words and extract meaningful keywords
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were'];
        const words = text.split(/\s+/).filter(word => 
            word.length > 3 && !commonWords.includes(word)
        );
        return [...new Set(words)]; // Remove duplicates
    }

    /**
     * Calculate similarity between two keyword sets
     */
    calculateKeywordSimilarity(keywords1, keywords2) {
        if (keywords1.length === 0 || keywords2.length === 0) return 0;
        
        const commonKeywords = keywords1.filter(k => keywords2.includes(k));
        const totalUniqueKeywords = new Set([...keywords1, ...keywords2]).size;
        
        return commonKeywords.length / totalUniqueKeywords;
    }

    /**
     * Check if two locations are nearby
     */
    areLocationsNearby(loc1, loc2) {
        // Simple proximity check - can be enhanced with actual coordinates
        const nearbyGroups = [
            ['library', 'student_center', 'cafeteria'],
            ['engineering_bldg', 'science_bldg', 'business_bldg'],
            ['parking_lot_a', 'parking_lot_b', 'parking_lot_c'],
            ['dorm_alpha', 'dorm_beta', 'dorm_gamma']
        ];
        
        for (const group of nearbyGroups) {
            if (group.includes(loc1) && group.includes(loc2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get reasons why items match (for user notification)
     */
    getMatchReasons(item1, item2) {
        const reasons = [];
        
        if (item1.category === item2.category) {
            reasons.push('Same category');
        }
        if (item1.brand && item2.brand && item1.brand.toLowerCase() === item2.brand.toLowerCase()) {
            reasons.push('Same brand/model');
        }
        if (item1.colors && item2.colors) {
            const commonColors = item1.colors.filter(c => item2.colors.includes(c));
            if (commonColors.length > 0) {
                reasons.push(`Same color: ${commonColors.join(', ')}`);
            }
        }
        if (item1.location === item2.location) {
            reasons.push('Same location');
        }
        
        return reasons.length > 0 ? reasons : ['Similar description'];
    }
}

// Export singleton instance
export const itemMatchingService = new ItemMatchingService();

