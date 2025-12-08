import React from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeHero from '../components/home/HomeHero';
import HomeFeatures from '../components/home/HomeFeatures';
import HomePlans from '../components/home/HomePlans';
import HomeWhyChoose from '../components/home/HomeWhyChoose';
import HomeFaq from '../components/home/HomeFaq';
import HomeTestimonial from '../components/home/HomeTestimonial';
import HomeFooter from '../components/home/HomeFooter';
import { organizationSchema, softwareAppSchema, serviceSchema, faqSchema, breadcrumbSchema } from '../components/SEO/StructuredData';
import SEOHelmet from '../components/SEO/SEOHelmet';
import { seoConfig } from '../utils/seoConfig';
import HomeApps from '../components/home/HomeApps';

const Home = () => {
    return (
        <>
            <SEOHelmet
                title={seoConfig.home.title}
                description={seoConfig.home.description}
                keywords={seoConfig.home.keywords}
                canonical={seoConfig.home.canonical}
                ogImage={seoConfig.home.ogImage}
                ogType={seoConfig.home.ogType}
                jsonLd={[organizationSchema, softwareAppSchema, serviceSchema, faqSchema, breadcrumbSchema]}
            />
            <div className="min-h-screen">
                <HomeNavbar />
                <HomeHero />
                <HomeFeatures />
                <HomeApps /> 
                <HomeWhyChoose />
                <HomePlans />
                <HomeFaq />
                <HomeTestimonial />
                <HomeFooter />
            </div>
        </>
    );
};

export default Home;
