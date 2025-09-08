import React from 'react';
import HomeNavbar from '../components/home/HomeNavbar';
import HomeHero from '../components/home/HomeHero';
import HomeFeatures from '../components/home/HomeFeatures';
import HomePlans from '../components/home/HomePlans';
import HomeWhyChoose from '../components/home/HomeWhyChoose';
import HomeFaq from '../components/home/HomeFaq';
import HomeTestimonial from '../components/home/HomeTestimonial';
import HomeFooter from '../components/home/HomeFooter';


const PricingSection = () => (
  <section id="pricing" className="py-20 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Choose the plan that's right for your business needs
        </p>
      </div>
      
      {/* Pricing cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { name: 'Starter', price: '$9', features: ['5 documents/month', 'Basic templates', 'Email support'] },
          { name: 'Professional', price: '$29', features: ['50 documents/month', 'Advanced templates', 'Priority support', 'API access'] },
          { name: 'Enterprise', price: '$99', features: ['Unlimited documents', 'Custom templates', '24/7 support', 'Full API access', 'Custom integrations'] }
        ].map((plan, index) => (
          <div key={index} className={`bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 ${index === 1 ? 'border-2 border-blue-500 relative' : ''}`}>
            {index === 1 && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            )}
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
            <div className="text-4xl font-bold text-slate-900 mb-6">
              {plan.price}<span className="text-lg text-slate-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center text-slate-600">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
              index === 1 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
            }`}>
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FAQSection = () => (
  <section id="faq" className="py-20 bg-slate-50">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-xl text-slate-600">
          Everything you need to know about our e-signature platform
        </p>
      </div>
      
      <div className="space-y-6">
        {[
          {
            question: 'Are electronic signatures legally binding?',
            answer: 'Yes, electronic signatures created through our platform are legally binding in most countries, including the US, EU, and many others, under laws like ESIGN and eIDAS.'
          },
          {
            question: 'How secure are my documents?',
            answer: 'We use bank-level security with 256-bit SSL encryption, secure data centers, and comply with SOC 2 Type II standards to ensure your documents are always protected.'
          },
          {
            question: 'Can I use this on mobile devices?',
            answer: 'Absolutely! Our platform is fully responsive and works seamlessly on smartphones, tablets, and desktop computers.'
          },
          {
            question: 'Do you offer API access?',
            answer: 'Yes, we provide comprehensive REST API access with our Professional and Enterprise plans, allowing you to integrate e-signatures into your existing workflows.'
          },
          {
            question: 'What file formats are supported?',
            answer: 'We support PDF, Word documents, images (JPG, PNG), and many other common file formats for document signing.'
          }
        ].map((faq, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{faq.question}</h3>
              <p className="text-slate-600">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-slate-900 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
              <path d="M10 9H8"/>
            </svg>
          </div>
          <span className="text-xl font-bold">
            E<span className="text-blue-400">Sign</span>
          </span>
        </div>
        <p className="text-gray-400">
          © 2025 ESign. All rights reserved. | Made with ❤️ for businesses worldwide
        </p>
      </div>
    </div>
  </footer>
);

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