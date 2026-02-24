import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "How is this different from traditional SEO?",
        answer: "Traditional SEO focuses on optimizing for search engine algorithms like Google. AI Search Optimization (AEO) focuses on getting your brand recommended by AI platforms like ChatGPT, Perplexity, Gemini, and Claude. These AI systems use different ranking signals and require specific optimization strategies."
    },
    {
        question: "Which AI platforms do you track?",
        answer: "We track all major AI search platforms including ChatGPT, Google Gemini, Perplexity, and Claude. Our platform monitors how often your brand is mentioned, the sentiment of mentions, and your visibility compared to competitors across all these platforms."
    },
    {
        question: "How quickly will I see results?",
        answer: "Most clients see their first AI citation within 18 days. Full optimization typically shows significant improvement within 90 days, with an average growth of 180% in AI visibility scores during this period."
    },
    {
        question: "Do I need technical knowledge?",
        answer: "No technical skills are required. Our platform provides automated recommendations, content generation, and technical optimizations that can be implemented with a single click. Setup takes just 5 minutes."
    },
    {
        question: "Can you guarantee I'll rank in AI results?",
        answer: "While we can't guarantee specific rankings (no one can), our proven methodology has helped hundreds of brands increase their AI visibility. We provide data-driven strategies and continuous optimization to maximize your chances of being recommended."
    },
    {
        question: "What if I'm not in the results yet?",
        answer: "That's exactly why you need Searchlyst. Our platform identifies the gaps in your AI presence and provides actionable steps to get your brand discovered. Many of our most successful clients started from zero AI visibility."
    },
    {
        question: "Do you work with agencies?",
        answer: "Yes! Our Scale plan is specifically designed for agencies with white-label reporting, unlimited brands, and dedicated account management. We also offer custom enterprise solutions for larger agencies."
    },
    {
        question: "What's your refund policy?",
        answer: "We offer a 7-day free trial on all plans. If you're not satisfied within the first 30 days of your paid subscription, we'll provide a full refund - no questions asked."
    },
];

export default function AboutFAQSection() {
    return (
        <section className="relative bg-[var(--bg-primary)] py-24 overflow-hidden">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            
            <div className="relative max-w-3xl mx-auto px-6">
                {/* Badge */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
                        <HelpCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-400 text-sm font-medium">FAQ</span>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-6"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-[var(--text-primary)]">Common Questions About </span>
                        <span className="text-red-500">AI<br />Search Optimization</span>
                    </h2>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-secondary)] text-center mb-12"
                >
                    Everything you need to know about getting your brand discovered in AI search.
                </motion.p>

                {/* Accordion */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                >
                    <Accordion type="single" collapsible className="space-y-3">
                        {faqs.map((faq, index) => (
                            <AccordionItem 
                                key={index} 
                                value={`item-${index}`}
                                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-6 data-[state=open]:border-red-500/30 transition-all duration-300 hover:scale-[1.01]"
                            >
                                <AccordionTrigger className="text-[var(--text-primary)] hover:no-underline text-left py-5">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-[var(--text-secondary)] pb-5">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>

                {/* Contact CTA */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-12"
                >
                    <p className="text-[var(--text-secondary)] mb-4">Still have questions?</p>
                    <Button className="bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-transform duration-300 hover:scale-105">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with our team
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}