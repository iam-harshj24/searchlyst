import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categories = ['Product', 'Tech', 'Team', 'AI', 'Data', 'Company', 'Guides'];

const keyTakeaways = [
    'Fast fashion brands exploit labor in developing countries, paying workers as little as $3/day',
    'The industry produces 92 million tons of textile waste annually, with only 1% being recycled',
    'Transparency scores show Brand X refuses to disclose supplier information or audit results',
    'Consumer boycotts have successfully pressured 23 major brands to reform practices since 2020',
    'Ethical alternatives exist at comparable price points with verified supply chain transparency'
];

const faqData = [
    {
        question: 'How do boycotts actually create change?',
        answer: 'Boycotts work through economic pressure and reputation damage. When enough consumers stop buying from a brand, it impacts their bottom line and forces them to address the issues. Historical data shows that organized boycotts have led to policy changes in 67% of cases when sustained for over 6 months.'
    },
    {
        question: 'What makes Brand X particularly problematic?',
        answer: 'Brand X has consistently refused third-party audits, been linked to multiple factory disasters, and actively lobbied against transparency legislation. Their supply chain opacity score is 2/100, making them one of the least transparent major retailers.'
    },
    {
        question: 'Are there affordable ethical alternatives?',
        answer: 'Yes. Our research shows that ethical brands like Patagonia, Everlane, and Reformation offer comparable pricing for basic items. Additionally, secondhand platforms like ThredUp and Poshmark provide sustainable options at lower costs.'
    },
    {
        question: 'How can I verify if a brand is truly ethical?',
        answer: 'Check certifications like Fair Trade, GOTS, and B Corp. Use tools like Good On You and our Base 44 Brand Tracker. Look for published supplier lists, third-party audit reports, and living wage commitments.'
    }
];

const relatedPosts = [
    {
        title: 'Tech Giants and Data Privacy: A Consumer Guide',
        category: 'Tech',
        date: 'Jan 28, 2026',
        readTime: '8 min read'
    },
    {
        title: 'The Nestle Water Crisis: Why Boycotts Matter',
        category: 'Product',
        date: 'Jan 15, 2026',
        readTime: '6 min read'
    },
    {
        title: 'AI-Powered Supply Chain Transparency Tools',
        category: 'AI',
        date: 'Jan 10, 2026',
        readTime: '5 min read'
    }
];

export default function BlogPost() {
    const [selectedCategories, setSelectedCategories] = useState(['Product', 'Data']);
    const [saved, setSaved] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);

    const toggleCategory = (category) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: 'The Hidden Cost of Fast Fashion',
                text: 'Why We Boycott Brand X',
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">Base 44</div>
                        <nav className="hidden md:flex gap-6 text-sm">
                            <a href="/" className="hover:text-red-500 transition-colors">Home</a>
                            <a href="#" className="hover:text-red-500 transition-colors">Boycotts</a>
                            <a href="#" className="hover:text-red-500 transition-colors">Research</a>
                            <a href="#" className="hover:text-red-500 transition-colors">About</a>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Article Header */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl"
                >
                    <p className="text-red-500 uppercase text-sm font-semibold mb-4 tracking-wide">
                        Investigation Summary
                    </p>
                    
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        The Hidden Cost of Fast Fashion: Why We Boycott Brand X
                    </h1>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {categories.map(cat => (
                            <Badge
                                key={cat}
                                onClick={() => toggleCategory(cat)}
                                className={`cursor-pointer transition-all ${
                                    selectedCategories.includes(cat)
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-red-500'
                                }`}
                            >
                                {cat}
                            </Badge>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 text-[var(--text-secondary)] text-sm mb-8">
                        <span>Feb 4, 2026</span>
                        <span>•</span>
                        <span>12 min read</span>
                        <span>•</span>
                        <span>Research Team</span>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={() => setSaved(!saved)}
                            variant="outline"
                            className="gap-2"
                        >
                            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                            {saved ? 'Saved' : 'Save'}
                        </Button>
                        <Button
                            onClick={handleShare}
                            variant="outline"
                            className="gap-2"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                <div className="grid lg:grid-cols-[250px_1fr] gap-12">
                    {/* Sticky Context Sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-8 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold mb-3 text-red-500">CONTEXT</h3>
                                <div className="space-y-4 text-sm text-[var(--text-secondary)]">
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)] mb-1">Timeline</p>
                                        <p>Investigation: 6 months</p>
                                        <p>Sources: 47</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)] mb-1">Impact</p>
                                        <p>Workers affected: 15,000+</p>
                                        <p>Factories: 23</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)] mb-1">Transparency Score</p>
                                        <p className="text-2xl font-bold text-red-500">2/100</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)] mb-1">Status</p>
                                        <Badge className="bg-red-600">Active Boycott</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Article Content */}
                    <article className="max-w-3xl">
                        {/* Key Takeaways */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="border-2 border-white rounded-lg p-8 mb-12 bg-[var(--bg-secondary)]"
                        >
                            <h2 className="text-2xl font-bold mb-6">Key Takeaways</h2>
                            <ul className="space-y-4">
                                {keyTakeaways.map((takeaway, index) => (
                                    <li key={index} className="flex gap-3">
                                        <span className="text-red-500 font-bold mt-1">•</span>
                                        <span className="text-[var(--text-secondary)] leading-relaxed">{takeaway}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Article Body */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="prose prose-invert prose-lg max-w-none"
                        >
                            <p className="text-xl leading-relaxed mb-6 text-[var(--text-secondary)]">
                                In the gleaming storefronts of Brand X, trendy garments are displayed at prices that seem too good to be true. And they are. Behind the $9.99 price tags lies a supply chain built on exploitation, environmental destruction, and deliberate opacity that shields the brand from accountability.
                            </p>

                            <h2 className="text-3xl font-bold mt-12 mb-4 text-[var(--text-primary)]">The Price of "Affordable" Fashion</h2>
                            
                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                Our six-month investigation uncovered that Brand X sources from 23 factories across Bangladesh, Vietnam, and Cambodia where workers earn an average of $3 per day—far below the living wage threshold of $8-12 in these regions. These workers, predominantly women between ages 18-35, work 12-14 hour shifts in conditions that violate basic safety standards.
                            </p>

                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                When we approached Brand X for comment, they provided a generic statement about their "commitment to ethical sourcing" but refused to share supplier lists, audit reports, or specific wage data. This pattern of deflection is consistent with their transparency score of 2 out of 100—one of the lowest ratings in the industry.
                            </p>

                            <h2 className="text-3xl font-bold mt-12 mb-4 text-[var(--text-primary)]">Environmental Impact</h2>
                            
                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                Fast fashion's environmental toll is staggering. The industry produces 92 million tons of textile waste annually, with less than 1% being recycled. Brand X alone introduces 500+ new styles weekly, perpetuating a consumption cycle where garments are worn an average of 7 times before disposal.
                            </p>

                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                Textile dyeing from these facilities contaminates local water sources with heavy metals and toxic chemicals. In regions where Brand X operates, we documented three cases of waterways turning unnatural colors corresponding with production cycles. Local communities report increased health issues, but Brand X has never conducted or published environmental impact assessments.
                            </p>

                            <h2 className="text-3xl font-bold mt-12 mb-4 text-[var(--text-primary)]">Why Transparency Matters</h2>
                            
                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                Transparency isn't just about disclosure—it's about accountability. Brands that publish supplier lists, conduct third-party audits, and commit to living wages create systems where exploitation becomes difficult to hide. Brand X's refusal to engage with these basic standards isn't accidental; it's a business model that requires opacity to function.
                            </p>

                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                Compare this to industry leaders like Patagonia, which publishes detailed supply chain maps, pays living wages, and achieves Fair Trade certification for 85% of its products. The price difference? Minimal when accounting for quality and longevity. A Patagonia t-shirt at $35 will outlast three Brand X shirts at $9.99 each.
                            </p>

                            <h2 className="text-3xl font-bold mt-12 mb-4 text-[var(--text-primary)]">The Power of Consumer Action</h2>
                            
                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                History shows that organized boycotts work. In the past five years, consumer pressure has forced 23 major fashion brands to reform practices, increase wages, and improve transparency. When H&M faced sustained boycotts in 2022, they committed to a living wage roadmap and published their full supplier list within 90 days.
                            </p>

                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                Brand X has so far resisted these pressures, but momentum is building. Over 500,000 consumers have joined the boycott, and major retailers are reconsidering their partnerships with the brand. Social media campaigns using #BoycottBrandX have reached 50 million impressions, and universities across North America are removing Brand X from campus stores.
                            </p>

                            <h2 className="text-3xl font-bold mt-12 mb-4 text-[var(--text-primary)]">What You Can Do</h2>
                            
                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                Individual choices aggregate into systemic change. Stop purchasing from Brand X and similar companies that refuse transparency. Support brands with verified ethical practices—use tools like Good On You, Fashion Revolution's Transparency Index, and our Base 44 Brand Tracker to make informed decisions.
                            </p>

                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                Share this investigation. Talk to friends about the real cost of fast fashion. Contact Brand X directly through their social channels and demand change. Every voice matters, and every dollar spent is a vote for the kind of economy we want to build.
                            </p>

                            <p className="leading-relaxed mb-6 text-[var(--text-secondary)]">
                                The hidden costs of fast fashion are no longer hidden. We know what's happening, and we have the power to change it. The question isn't whether we can afford to boycott brands like Brand X—it's whether we can afford not to.
                            </p>
                        </motion.div>

                        {/* FAQ Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mt-16 border-t border-[var(--border)] pt-12"
                        >
                            <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
                            <div className="space-y-4">
                                {faqData.map((faq, index) => (
                                    <div
                                        key={index}
                                        className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-secondary)]"
                                    >
                                        <button
                                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--bg-primary)] transition-colors"
                                        >
                                            <span className="font-semibold text-[var(--text-primary)]">{faq.question}</span>
                                            {expandedFaq === index ? (
                                                <ChevronUp className="w-5 h-5 text-red-500 flex-shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
                                            )}
                                        </button>
                                        {expandedFaq === index && (
                                            <div className="px-6 pb-4 text-[var(--text-secondary)] leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* About the Author */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-16 border border-[var(--border)] rounded-lg p-8 bg-[var(--bg-secondary)]"
                        >
                            <h3 className="text-xl font-bold mb-6">About the Author</h3>
                            <div className="flex gap-6">
                                <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                                    RT
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold mb-1">Research Team</h4>
                                    <p className="text-sm text-red-500 mb-3">Lead Investigators</p>
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        Base 44's Research Team consists of investigative journalists, supply chain analysts, and human rights advocates dedicated to exposing corporate practices that harm workers and the environment. Our investigations have led to policy changes at 15 major corporations and helped mobilize over 2 million consumers toward ethical purchasing decisions.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Related Posts */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="mt-16"
                        >
                            <h3 className="text-2xl font-bold mb-8">Related Articles</h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                {relatedPosts.map((post, index) => (
                                    <a
                                        key={index}
                                        href="#"
                                        className="border border-[var(--border)] rounded-lg p-6 hover:border-red-500 transition-all group bg-[var(--bg-secondary)]"
                                    >
                                        <Badge className="mb-3 bg-transparent border border-[var(--border)] text-[var(--text-secondary)]">
                                            {post.category}
                                        </Badge>
                                        <h4 className="font-bold text-lg mb-3 group-hover:text-red-500 transition-colors leading-tight">
                                            {post.title}
                                        </h4>
                                        <div className="text-sm text-[var(--text-secondary)] flex gap-2">
                                            <span>{post.date}</span>
                                            <span>•</span>
                                            <span>{post.readTime}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    </article>
                </div>
            </div>
        </div>
    );
}