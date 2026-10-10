// Advanced Language & Pronoun Detection Module dengan NLP Basic
class DetectionManager {
    constructor() {
        // Indonesian informal words (casual, colloquial)
        this.informalWords = new Set([
            'gw', 'gua', 'aku', 'elu', 'lu', 'loe', 'elo', 'kamu', 'kalo',
            'gini', 'gitu', 'gimana', 'apa', 'yuk', 'yaudah', 'sih', 'lah',
            'dong', 'nih', 'nah', 'sih', 'kan', 'tuh', 'tuh', 'deh', 'dunk',
            'bro', 'brah', 'bang', 'kak', 'adek', 'sobat', 'cuy', 'gan',
            'wkwk', 'haha', 'hehe', 'lol', 'btw', 'dll', 'dsb', 'dst',
            'orang', 'teman', 'ketua', 'boss', 'pak', 'bu', 'ibu', 'bapak'
        ]);

        // Indonesian formal words
        this.formalWords = new Set([
            'saya', 'kami', 'kita', 'anda', 'beliau', 'mereka', 'bapak',
            'ibu', 'saudara', 'pun', 'lagi', 'akan', 'telah', 'sudah',
            'perlu', 'harus', 'dapat', 'boleh', 'mengenai', 'dalam hal ini',
            'oleh karena itu', 'dengan demikian', 'sebagaimana', 'sesuai dengan',
            'berdasarkan', 'mengingat', 'memperhatikan', 'selanjutnya', 'lebih lanjut',
            'terkait', 'adapun', 'namun', 'begitu pun', 'meskipun'
        ]);

        // Slang/Internet slang words
        this.slangWords = new Set([
            'ngab', 'bro', 'wkwk', 'haha', 'wkwkwk', 'xD', 'anjay', 'asli',
            'literally', 'literally', 'literally', 'literally', 'literally',
            'sadeg', 'sadis', 'gokil', 'parah', 'sengaja', 'sableng',
            'bahaya', 'kampungan', 'boros', 'nggak', 'tdk', 'yg', 'pd',
            'kyk', 'dr', 'mksd', 'krn', 'spt', 'thd', 'dg', 'dk'
        ]);

        // Common English words (comprehensive)
        this.englishWords = new Set([
            // Articles
            'the', 'a', 'an',
            // Pronouns
            'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours',
            'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their',
            // Verbs (most common)
            'is', 'are', 'am', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
            'do', 'does', 'did', 'doing', 'will', 'would', 'shall', 'should',
            'can', 'could', 'may', 'might', 'must', 'ought', 'to',
            'go', 'get', 'make', 'take', 'see', 'come', 'know', 'think', 'want',
            'use', 'find', 'give', 'tell', 'work', 'call', 'try', 'ask', 'need', 'feel',
            // Nouns
            'time', 'person', 'year', 'way', 'day', 'world', 'life', 'hand', 'part',
            'place', 'case', 'week', 'number', 'group', 'problem', 'fact', 'water',
            // Adjectives
            'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other',
            'old', 'right', 'big', 'small', 'high', 'different', 'black', 'white',
            // Adverbs
            'up', 'down', 'out', 'just', 'now', 'only', 'very', 'also', 'back', 'more', 'than',
            // Prepositions
            'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'about',
            'into', 'through', 'during', 'before', 'after', 'above', 'below', 'under',
            // Conjunctions
            'and', 'or', 'but', 'because', 'if', 'when', 'where', 'while', 'until',
            // Common words
            'what', 'which', 'who', 'whom', 'whose', 'how', 'why', 'this', 'that',
            'these', 'those', 'all', 'each', 'every', 'both', 'some', 'any', 'no', 'not',
            // More verbs
            'like', 'help', 'turn', 'show', 'hear', 'let', 'watch', 'follow', 'stop',
            'create', 'speak', 'read', 'write', 'learn', 'teach', 'understand', 'speak',
            // Tech words
            'computer', 'program', 'code', 'data', 'app', 'software', 'hardware',
            'website', 'browser', 'internet', 'online', 'digital', 'tech', 'tech'
        ]);

        // Bahasa Malaysia/Brunei words (similar to Indonesian)
        this.malayWords = new Set([
            'saya', 'dia', 'mereka', 'kami', 'kita', 'awak', 'diri', 'orang',
            'apa', 'mana', 'siapa', 'berapa', 'bila', 'mahu', 'boleh', 'perlu'
        ]);

        // Regex patterns untuk deteksi lebih advanced
        this.patterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
            url: /https?:\/\/[^\s]+/,
            hashtag: /#\w+/g,
            mention: /@\w+/g,
            code: /`[^`]+`|```[\s\S]*?```/,
            emoji: /[\u{1F300}-\u{1F9FF}]/gu,
            number: /\d+/,
            capitalWord: /[A-Z][a-z]+/
        };
    }

    // Tokenize text
    tokenize(text) {
        return text.toLowerCase().match(/\b[\w']+\b/g) || [];
    }

    // Count language score
    countLanguageScore(tokens) {
        let informalScore = 0;
        let formalScore = 0;
        let englishScore = 0;
        let slangScore = 0;
        let malayScore = 0;

        for (let token of tokens) {
            const cleanToken = token.replace(/[^\w]/g, '');
            
            if (this.informalWords.has(cleanToken)) informalScore++;
            if (this.formalWords.has(cleanToken)) formalScore++;
            if (this.englishWords.has(cleanToken)) englishScore++;
            if (this.slangWords.has(cleanToken)) slangScore++;
            if (this.malayWords.has(cleanToken)) malayScore++;
        }

        return {
            informal: informalScore,
            formal: formalScore,
            english: englishScore,
            slang: slangScore,
            malay: malayScore,
            total: tokens.length
        };
    }

    // Detect if text contains multiple languages (Advanced)
    detectMultipleLanguages(text) {
        if (!text || text.length < 5) {
            return {
                detected: false,
                languages: [],
                message: 'Catatan terlalu singkat untuk deteksi',
                confidence: 0
            };
        }

        const tokens = this.tokenize(text);
        const scores = this.countLanguageScore(tokens);
        const minThreshold = Math.max(1, Math.floor(tokens.length * 0.05)); // 5% threshold

        const detectedLanguages = [];
        const confidenceScores = {};

        // Calculate confidence percentage
        if (scores.informal > minThreshold) {
            const confidence = Math.min(100, (scores.informal / tokens.length) * 100);
            detectedLanguages.push('Informal Indonesian');
            confidenceScores['Informal Indonesian'] = Math.round(confidence);
        }

        if (scores.formal > minThreshold) {
            const confidence = Math.min(100, (scores.formal / tokens.length) * 100);
            detectedLanguages.push('Formal Indonesian');
            confidenceScores['Formal Indonesian'] = Math.round(confidence);
        }

        if (scores.english > minThreshold) {
            const confidence = Math.min(100, (scores.english / tokens.length) * 100);
            detectedLanguages.push('English');
            confidenceScores['English'] = Math.round(confidence);
        }

        if (scores.slang > minThreshold) {
            const confidence = Math.min(100, (scores.slang / tokens.length) * 100);
            detectedLanguages.push('Internet Slang');
            confidenceScores['Internet Slang'] = Math.round(confidence);
        }

        if (scores.malay > minThreshold) {
            const confidence = Math.min(100, (scores.malay / tokens.length) * 100);
            detectedLanguages.push('Bahasa Malay');
            confidenceScores['Bahasa Malay'] = Math.round(confidence);
        }

        // Detect code blocks
        if (this.patterns.code.test(text)) {
            detectedLanguages.push('Code');
            confidenceScores['Code'] = 100;
        }

        // Remove duplicates
        const uniqueLanguages = [...new Set(detectedLanguages)];

        const detected = uniqueLanguages.length > 1;
        const message = detected 
            ? `Catatan menggunakan ${uniqueLanguages.length} bahasa: ${uniqueLanguages.join(', ')}`
            : `Catatan dalam satu bahasa`;

        return {
            detected,
            languages: uniqueLanguages,
            confidenceScores,
            message,
            confidence: Math.max(...Object.values(confidenceScores)),
            scores
        };
    }

    // Detect specific pronouns dan track penggunaan
    detectPronouns(text) {
        if (!text) return [];

        const lowerText = text.toLowerCase();
        const foundPronouns = [];

        // Extended pronoun map dengan kategori
        const pronounMap = {
            // Indonesian Informal
            'gw': { label: 'Orang Pertama Informal (gw)', category: 'informal' },
            'aku': { label: 'Orang Pertama Informal (aku)', category: 'informal' },
            'elu': { label: 'Orang Kedua Informal (elu)', category: 'informal' },
            'lu': { label: 'Orang Kedua Informal (lu)', category: 'informal' },
            'loe': { label: 'Orang Kedua Informal (loe)', category: 'informal' },
            'elo': { label: 'Orang Kedua Informal (elo)', category: 'informal' },
            'kamu': { label: 'Orang Kedua (kamu)', category: 'casual' },

            // Indonesian Formal
            'saya': { label: 'Orang Pertama Formal (saya)', category: 'formal' },
            'kami': { label: 'Orang Pertama Jamak (kami)', category: 'formal' },
            'kita': { label: 'Orang Pertama Jamak Inklusif (kita)', category: 'formal' },
            'anda': { label: 'Orang Kedua Formal (Anda)', category: 'formal' },
            'beliau': { label: 'Orang Ketiga Hormat (beliau)', category: 'formal' },
            'mereka': { label: 'Orang Ketiga Jamak (mereka)', category: 'formal' },

            // Relative pronouns
            'yang': { label: 'Pronoun Relatif (yang)', category: 'common' },
            'mana': { label: 'Pronoun Tanya (mana)', category: 'common' },
            'siapa': { label: 'Pronoun Tanya (siapa)', category: 'common' },
            'apa': { label: 'Pronoun Tanya (apa)', category: 'common' },

            // English pronouns
            'i': { label: 'English First Person (i)', category: 'english' },
            'me': { label: 'English First Person (me)', category: 'english' },
            'you': { label: 'English Second Person (you)', category: 'english' },
            'he': { label: 'English Third Person (he)', category: 'english' },
            'she': { label: 'English Third Person (she)', category: 'english' },
            'it': { label: 'English Third Person (it)', category: 'english' },
            'we': { label: 'English First Person Plural (we)', category: 'english' },
            'they': { label: 'English Third Person Plural (they)', category: 'english' }
        };

        for (let [word, data] of Object.entries(pronounMap)) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) {
                foundPronouns.push({
                    word: word,
                    label: data.label,
                    category: data.category,
                    count: matches.length
                });
            }
        }

        return foundPronouns;
    }

    // Detect sentiment/tone
    detectTone(text) {
        const lowerText = text.toLowerCase();
        
        const positiveWords = ['bagus', 'baik', 'senang', 'cinta', 'keren', 'awesome', 'great', 'love', 'amazing', 'wonderful'];
        const negativeWords = ['buruk', 'jelek', 'sedih', 'benci', 'dosa', 'terrible', 'hate', 'bad', 'awful', 'horrible'];
        const exclamationMarks = (lowerText.match(/!/g) || []).length;
        const questionMarks = (lowerText.match(/\?/g) || []).length;

        let positiveCount = 0;
        let negativeCount = 0;

        positiveWords.forEach(word => {
            if (lowerText.includes(word)) positiveCount++;
        });

        negativeWords.forEach(word => {
            if (lowerText.includes(word)) negativeCount++;
        });

        let tone = 'neutral';
        if (positiveCount > negativeCount) tone = 'positive';
        if (negativeCount > positiveCount) tone = 'negative';
        if (exclamationMarks > 3) tone = 'excited';
        if (questionMarks > 3) tone = 'questioning';

        return {
            tone,
            positiveCount,
            negativeCount,
            exclamations: exclamationMarks,
            questions: questionMarks
        };
    }

    // Get comprehensive detection summary
    getSummary(text) {
        try {
            const languageDetection = this.detectMultipleLanguages(text);
            const pronounDetection = this.detectPronouns(text);
            const toneDetection = this.detectTone(text);

            return {
                multipleLanguages: languageDetection.detected,
                languages: languageDetection.languages,
                detectionMessage: languageDetection.message,
                confidenceScores: languageDetection.confidenceScores,
                confidence: languageDetection.confidence,
                pronouns: pronounDetection,
                tone: toneDetection,
                requiresLayer2: languageDetection.detected,
                tokenCount: languageDetection.scores.total
            };
        } catch (e) {
            console.error('Detection error:', e);
            return {
                multipleLanguages: false,
                languages: [],
                detectionMessage: 'Error dalam deteksi',
                confidenceScores: {},
                confidence: 0,
                pronouns: [],
                tone: { tone: 'unknown' },
                requiresLayer2: false,
                tokenCount: 0
            };
        }
    }
}

// Global detection manager
const detectionManager = new DetectionManager();