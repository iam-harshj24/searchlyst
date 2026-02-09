import React from 'react';
import CompetitiveSankey from './charts/CompetitiveSankey';
import AttributeNetwork from './charts/AttributeNetwork';
import CompetitiveRadar from './charts/CompetitiveRadar';
import HallucinationTimeline from './charts/HallucinationTimeline';

export default function AIVisibilityPage() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Competitive Sankey */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">Citation Flow Analysis</h3>
                    <CompetitiveSankey />
                </div>

                {/* Competitive Radar */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">Competitive Comparison</h3>
                    <CompetitiveRadar />
                </div>
            </div>

            {/* Attribute Network */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Brand Attribute Network</h3>
                <AttributeNetwork />
            </div>

            {/* Hallucination Timeline */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Hallucination Tracking</h3>
                <HallucinationTimeline />
            </div>
        </div>
    );
}