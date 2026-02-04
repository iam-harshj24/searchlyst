import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from 'lucide-react';

export default function Blogs() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const categories = ["Product", "Tech", "Team", "AI", "Data", "Company", "Guides"];

    const { data: blogs = [], isLoading } = useQuery({
        queryKey: ['blogs'],
        queryFn: async () => {
            const allBlogs = await base44.entities.Blog.list('-created_date', 100);
            return allBlogs.filter(blog => blog.status === 'published');
        },
    });

    const filteredBlogs = selectedCategory
        ? blogs.filter(blog => blog.category === selectedCategory)
        : blogs;

    const featuredBlog = filteredBlogs[0];
    const remainingBlogs = filteredBlogs.slice(1);

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
                            <Link to={createPageUrl('Blogs')} className="text-red-500">Blog</Link>
                            <a href="#" className="hover:text-red-500 transition-colors">About</a>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Journal</h1>
                        <p className="text-[var(--text-secondary)] text-lg max-w-2xl">
                            In-depth investigations, data-driven insights, and stories about ethical consumerism. Stay informed about the brands that matter.
                        </p>
                    </motion.div>
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
                        <motion.a
                            href={`${createPageUrl('BlogPost')}?id=${featuredBlog.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid md:grid-cols-3 gap-8 hover:opacity-80 transition-opacity group"
                        >
                            {featuredBlog.featured_image && (
                                <div className="md:col-span-2 aspect-video rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                                    <img
                                        src={featuredBlog.featured_image}
                                        alt={featuredBlog.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        </motion.a>
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
                            {remainingBlogs.map((blog, index) => (
                                <motion.a
                                    key={blog.id}
                                    href={`${createPageUrl('BlogPost')}?id=${blog.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="border border-[var(--border)] rounded-lg overflow-hidden hover:border-red-500 transition-all group bg-[var(--bg-secondary)]"
                                >
                                    {blog.featured_image && (
                                        <div className="aspect-video overflow-hidden bg-[var(--bg-primary)]">
                                            <img
                                                src={blog.featured_image}
                                                alt={blog.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                                </motion.a>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] py-8">
                <div className="max-w-7xl mx-auto px-6 text-center text-[var(--text-secondary)] text-sm">
                    <p>&copy; 2026 Base 44. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}