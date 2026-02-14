import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { ThemeProvider } from '@/components/landing/ThemeToggle';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function Blogs() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const categories = ["Product", "Tech", "Team", "AI", "Data", "Company", "Guides"];

    // Mock blogs data - can be replaced with API call later
    const blogs = [];
    const isLoading = false;

    const filteredBlogs = selectedCategory
        ? blogs.filter(blog => blog.category === selectedCategory)
        : blogs;

    const featuredBlog = filteredBlogs[0];
    const remainingBlogs = filteredBlogs.slice(1);

    // If no blog is selected, show the list view
    if (!selectedBlog) {

        return (
            <ThemeProvider>
                <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
                    <Navbar />

                    {/* Hero */}
                    <section className="border-b border-[var(--border)] bg-[var(--bg-secondary)] pt-20">
                        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">Newsroom</h1>
                            <p className="text-[var(--text-secondary)] text-lg max-w-2xl">
                                Learn how to dominate AI search engines. Strategies, insights, and tactics to get your brand discovered on ChatGPT, Perplexity, and beyond.
                            </p>
                        </div>
                    </section>

            {/* Category Filter */}
            <section className="border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-full text-sm transition-all ${
                                selectedCategory === null
                                    ? 'bg-red-600 text-white'
                                    : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-red-500'
                            }`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm transition-all ${
                                    selectedCategory === cat
                                        ? 'bg-red-600 text-white'
                                        : 'border border-[var(--border)] text-[var(--text-secondary)] hover:border-red-500'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Blog */}
            {featuredBlog && (
                <section className="border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        <button
                            onClick={() => setSelectedBlog(featuredBlog)}
                            className="grid md:grid-cols-3 gap-8 hover:opacity-80 transition-opacity group cursor-pointer text-left w-full"
                        >
                            {featuredBlog.featured_image && (
                                <div className="md:col-span-2 aspect-video rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                                    <img
                                        src={featuredBlog.featured_image}
                                        alt={featuredBlog.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            <div className="md:col-span-1 flex flex-col justify-start">
                                <Badge className="w-fit mb-3 bg-red-600 text-white">{featuredBlog.category}</Badge>
                                <h2 className="text-2xl font-bold mb-3 leading-tight group-hover:text-red-500 transition-colors">
                                    {featuredBlog.title}
                                </h2>
                                <p className="text-[var(--text-secondary)] mb-4 flex-grow">
                                    {featuredBlog.summary}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <span>{featuredBlog.read_time || 8} min read</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </button>
                    </div>
                </section>
            )}

            {/* Blog Grid */}
            <section>
                <div className="max-w-7xl mx-auto px-6 py-12">
                    {isLoading ? (
                        <div className="text-center text-[var(--text-secondary)]">Loading blogs...</div>
                    ) : remainingBlogs.length === 0 ? (
                        <div className="text-center text-[var(--text-secondary)]">No blogs found in this category.</div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-6">
                            {remainingBlogs.map((blog) => (
                                <button
                                    key={blog.id}
                                    onClick={() => setSelectedBlog(blog)}
                                    className="border border-[var(--border)] rounded-lg overflow-hidden hover:border-red-500 transition-all group bg-[var(--bg-secondary)] cursor-pointer text-left w-full"
                                >
                                    {blog.featured_image && (
                                        <div className="aspect-video overflow-hidden bg-[var(--bg-primary)]">
                                            <img
                                                src={blog.featured_image}
                                                alt={blog.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <Badge className="mb-3 bg-transparent border border-[var(--border)] text-[var(--text-secondary)]">
                                            {blog.category}
                                        </Badge>
                                        <h3 className="font-bold text-lg mb-3 leading-tight group-hover:text-red-500 transition-colors">
                                            {blog.title}
                                        </h3>
                                        <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-2">
                                            {blog.summary}
                                        </p>
                                        <div className="text-sm text-[var(--text-secondary)]">
                                            {blog.read_time || 5} min read
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

                    <Footer />
                </div>
            </ThemeProvider>
        );
    }

    // Single blog view
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <Navbar />

                {/* Article Header */}
                <article className="max-w-4xl mx-auto px-6 py-12">
                    <div className="mb-8">
                        <button
                            onClick={() => setSelectedBlog(null)}
                            className="text-red-500 hover:text-red-400 mb-6 flex items-center gap-2"
                        >
                            ← Back to Blog
                        </button>
                        <Badge className="mb-4 bg-red-600 text-white">{selectedBlog.category}</Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{selectedBlog.title}</h1>
                        <p className="text-xl text-[var(--text-secondary)] mb-6">{selectedBlog.summary}</p>
                        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                            <span>{selectedBlog.read_time || 8} min read</span>
                            <span>•</span>
                            <span>{new Date(selectedBlog.created_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>

                    {/* Featured Image */}
                    {selectedBlog.featured_image && (
                        <div className="mb-12 rounded-lg overflow-hidden">
                            <img
                                src={selectedBlog.featured_image}
                                alt={selectedBlog.title}
                                className="w-full h-auto"
                            />
                        </div>
                    )}

                    {/* Key Takeaways */}
                    {selectedBlog.key_takeaways && selectedBlog.key_takeaways.length > 0 && (
                        <div className="border-2 border-white rounded-lg p-8 mb-12 bg-[var(--bg-secondary)]">
                            <h2 className="text-2xl font-bold mb-6">Key Takeaways</h2>
                            <ul className="space-y-4">
                                {selectedBlog.key_takeaways.map((takeaway, index) => (
                                    <li key={index} className="flex gap-3">
                                        <span className="text-red-500 font-bold mt-1">•</span>
                                        <span className="text-[var(--text-secondary)] leading-relaxed">{takeaway}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Article Body */}
                    <div className="prose prose-invert prose-lg max-w-none mb-12">
                        <div
                            className="text-[var(--text-secondary)] leading-relaxed [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mt-12 [&>h2]:mb-4 [&>h2]:text-[var(--text-primary)] [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-[var(--text-primary)] [&>p]:mb-6 [&>p]:leading-relaxed [&>strong]:text-[var(--text-primary)] [&>strong]:font-semibold"
                            dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                        />
                    </div>

                    {/* FAQ Section */}
                    {selectedBlog.faq && selectedBlog.faq.length > 0 && (
                        <div className="mt-16 border-t border-[var(--border)] pt-12">
                            <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
                            <div className="space-y-4">
                                {selectedBlog.faq.map((faq, index) => (
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
                        </div>
                    )}

                    {/* About the Author */}
                    {(selectedBlog.author_name || selectedBlog.author_bio) && (
                        <div className="mt-16 border border-[var(--border)] rounded-lg p-8 bg-[var(--bg-secondary)]">
                            <h3 className="text-xl font-bold mb-6">About the Author</h3>
                            <div className="flex gap-6">
                                <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                                    {selectedBlog.author_initials || selectedBlog.author_name?.substring(0, 2).toUpperCase() || 'B44'}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold mb-1">{selectedBlog.author_name || 'Base 44 Team'}</h4>
                                    {selectedBlog.author_title && (
                                        <p className="text-sm text-red-500 mb-3">{selectedBlog.author_title}</p>
                                    )}
                                    <p className="text-[var(--text-secondary)] leading-relaxed">
                                        {selectedBlog.author_bio || 'Expert insights on AI search optimization.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Back to Blog Button */}
                    <div className="mt-12 text-center">
                        <button
                            onClick={() => setSelectedBlog(null)}
                            className="text-red-500 hover:text-red-400 font-semibold"
                        >
                            ← Back to All Articles
                        </button>
                    </div>
                </article>

                <Footer />
            </div>
        </ThemeProvider>
    );
}