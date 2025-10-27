import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHelmetProps {
    title: string;
    description: string;
    keywords: string;
    canonical: string;
    ogImage: string;
    ogType?: string;
    jsonLd?: object | object[];
}

const SEOHelmet: React.FC<SEOHelmetProps> = ({ title, description, keywords, canonical, ogImage, ogType = 'website', jsonLd }) => {
    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={canonical} />

            {/* Open Graph */}
            <meta property="og:type" content={ogType} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={canonical} />
            <meta property="og:site_name" content="i-Sign" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Structured Data (JSON-LD) */}
            {jsonLd && <script type="application/ld+json">{JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd])}</script>}
        </Helmet>
    );
};

export default SEOHelmet;
