import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Bookmark, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BlogPost() {
    const [saved, setSaved] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);

    // Get blog ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id');

    // Fetch blog post
    const { data: blog, isLoading } = useQuery({
        queryKey: ['blog', blogId],
        queryFn: async () => {
            if (!blogId) return null;
            const blogs = await base44.entities.Blog.list();
            return blogs.find(b => b.id === blogId);
        },
        enabled: !!blogId,
    });

    // Fetch related posts
    const { data: relatedPosts = [] } = useQuery({
        queryKey: ['relatedBlogs', blog?.category],
        queryFn: async () => {
            if (!blog) return [];
            const blogs = await base44.entities.Blog.list('-created_date', 10);
            return blogs
                .filter(b => b.id !== blog.id && b.status === 'published')
                .slice(0, 3);
        },
        enabled: !!blog,
    });

    const handleShare = async () => {
        if (navigator.share) {
            await navigator.share({
                title: blog?.title || 'Base 44 Article',
                text: blog?.summary || '',
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <p className="text-[var(--text-secondary)]">Loading...</p>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[var(--text-secondary)] mb-4">Blog post not found</p>
                    <Link to={createPageUrl('Blogs')} className="text-red-500 hover:underline">
                        Back to Blogs
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            {/* Header */}
            <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link to={createPageUrl('Home')} className="text-2xl font-bold hover:text-red-500 transition-colors">
                            Base 44
                        </Link>
                        <nav className="hidden md:flex gap-6 text-sm">
                            <Link to={createPageUrl('Home')} className="hover:text-red-500 transition-colors">Home</Link>
                            <Link to={createPageUrl('Blogs')} className="hover:text-red-500 transition-colors">Blog</Link>
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
                        {blog.summary}
                    </p>
                    
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        {blog.title}
                    </h1>

                    <div className="flex flex-wrap gap-2 mb-6">
                        <Badge className="bg-red-600 text-white">
                            {blog.category}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-[var(--text-secondary)] text-sm mb-8">
                        <span>{new Date(blog.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{blog.read_time || 8} min read</span>
                        {blog.author_name && (
                            <>
                                <span>•</span>
                                <span>{blog.author_name}</span>
                            </>
                        )}
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
                                        <p className="font-semibold text-[var(--text-primary)] mb-1">Category</p>
                                        <Badge className="bg-red-600">{blog.category}</Badge>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)] mb-1">Published</p>
                                        <p>{new Date(blog.created_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)] mb-1">Read Time</p>
                                        <p>{blog.read_time || 8} minutes</p>
                                    </div>
                                    {blog.author_name && (
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)] mb-1">Author</p>
                                            <p>{blog.author_name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Article Content */}
                    <article className="max-w-3xl">
                        {/* Key Takeaways */}
                        {blog.key_takeaways && blog.key_takeaways.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="border-2 border-white rounded-lg p-8 mb-12 bg-[var(--bg-secondary)]"
                            >
                                <h2 className="text-2xl font-bold mb-6">Key Takeaways</h2>
                                <ul className="space-y-4">
                                    {blog.key_takeaways.map((takeaway, index) => (
                                        <li key={index} className="flex gap-3">
                                            <span className="text-red-500 font-bold mt-1">•</span>
                                            <span className="text-[var(--text-secondary)] leading-relaxed">{takeaway}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}

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