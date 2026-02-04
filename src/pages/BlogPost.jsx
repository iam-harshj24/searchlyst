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
                            <div 
                                className="text-[var(--text-secondary)] leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: blog.content }}
                            />
                        </motion.div>

                        {/* FAQ Section */}
                        {blog.faq && blog.faq.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mt-16 border-t border-[var(--border)] pt-12"
                            >
                                <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
                                <div className="space-y-4">
                                    {blog.faq.map((faq, index) => (
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
                        )}

                        {/* About the Author */}
                        {(blog.author_name || blog.author_bio) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-16 border border-[var(--border)] rounded-lg p-8 bg-[var(--bg-secondary)]"
                            >
                                <h3 className="text-xl font-bold mb-6">About the Author</h3>
                                <div className="flex gap-6">
                                    <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                                        {blog.author_initials || blog.author_name?.substring(0, 2).toUpperCase() || 'RT'}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold mb-1">{blog.author_name || 'Research Team'}</h4>
                                        {blog.author_title && (
                                            <p className="text-sm text-red-500 mb-3">{blog.author_title}</p>
                                        )}
                                        <p className="text-[var(--text-secondary)] leading-relaxed">
                                            {blog.author_bio || 'Base 44\'s Research Team consists of investigative journalists dedicated to ethical consumerism.'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Related Posts */}
                        {relatedPosts.length > 0 && (
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
                                            href={`${createPageUrl('BlogPost')}?id=${post.id}`}
                                            className="border border-[var(--border)] rounded-lg p-6 hover:border-red-500 transition-all group bg-[var(--bg-secondary)]"
                                        >
                                            <Badge className="mb-3 bg-transparent border border-[var(--border)] text-[var(--text-secondary)]">
                                                {post.category}
                                            </Badge>
                                            <h4 className="font-bold text-lg mb-3 group-hover:text-red-500 transition-colors leading-tight">
                                                {post.title}
                                            </h4>
                                            <div className="text-sm text-[var(--text-secondary)] flex gap-2">
                                                <span>{new Date(post.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                <span>•</span>
                                                <span>{post.read_time || 5} min read</span>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </article>
                </div>
            </div>
        </div>
    );
}