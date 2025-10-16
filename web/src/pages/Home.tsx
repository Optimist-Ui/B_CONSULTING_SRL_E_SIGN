import React from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeHero from '../components/home/HomeHero';
import HomeFeatures from '../components/home/HomeFeatures';
import HomePlans from '../components/home/HomePlans';
import HomeWhyChoose from '../components/home/HomeWhyChoose';
import HomeFaq from '../components/home/HomeFaq';
import HomeTestimonial from '../components/home/HomeTestimonial';
import HomeFooter from '../components/home/HomeFooter';

const Home = () => {
  return (
    <div className="min-h-screen">
      <HomeNavbar />
      <HomeHero />
      <HomeFeatures />
      <HomeWhyChoose />
      <HomePlans />
      <HomeFaq />
      <HomeTestimonial />
      <HomeFooter />
    </div>
  );
};

export default Home;