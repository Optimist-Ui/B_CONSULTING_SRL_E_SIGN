import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Swiper as SwiperType } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, EffectCoverflow } from 'swiper/modules';
import { AppDispatch, IRootState } from '../../store'; // Adjust import path
import { fetchFeaturedReviews } from '../../store/thunk/reviewThunks'; // Adjust import path
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';
import { useNavigate } from 'react-router-dom';

// Enhanced Avatar component with gradient backgrounds and better styling
const Avatar = ({ name }: { name: string }) => {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    // Hash function for consistent colors
    const hashCode = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    };

    const gradients = [
        'bg-gradient-to-br from-blue-500 to-blue-700',
        'bg-gradient-to-br from-purple-500 to-purple-700',
        'bg-gradient-to-br from-green-500 to-green-700',
        'bg-gradient-to-br from-indigo-500 to-indigo-700',
        'bg-gradient-to-br from-pink-500 to-pink-700',
        'bg-gradient-to-br from-orange-500 to-orange-700',
        'bg-gradient-to-br from-teal-500 to-teal-700',
        'bg-gradient-to-br from-red-500 to-red-700',
    ];

    const gradientClass = gradients[Math.abs(hashCode(name)) % gradients.length];

    return (
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${gradientClass} ring-4 ring-white relative overflow-hidden group`}>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10">{initials}</span>
        </div>
    );
};

// Enhanced Star Rating component
const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="relative">
                    <svg className="w-5 h-5 text-gray-200" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {i < Math.floor(rating) && (
                        <svg className="w-5 h-5 text-amber-400 absolute top-0 left-0 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    )}
                </div>
            ))}
            <span className="ml-2 text-sm text-gray-500 font-medium">({rating.toFixed(1)})</span>
        </div>
    );
};

const HomeTestimonial = () => {
     const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { reviews, status } = useSelector((state: IRootState) => state.reviews.featuredReviews);
    const [isVisible, setIsVisible] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        dispatch(fetchFeaturedReviews());
        setIsVisible(true);
    }, [dispatch]);

    // Enhanced loading state
    if (status === 'loading' || status === 'idle') {
        return (
            <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg">
                            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                            <span className="text-gray-600 font-medium">Loading testimonials...</span>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Enhanced error/empty state
    if (status === 'failed' || reviews.length === 0) {
        return (
            <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No testimonials available</h3>
                        <p className="text-gray-500">Check back soon for customer reviews and feedback.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/20 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200/20 rounded-full filter blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Enhanced Section Header */}
                <div className={`text-center mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Customer Reviews
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Thousands</span>
                        <br />
                        <span className="text-2xl sm:text-3xl lg:text-4xl text-gray-600 font-normal">of professionals worldwide</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Join the growing community of businesses who trust our platform for their digital signing needs</p>
                </div>

                {/* Enhanced Testimonials Slider */}
                <div className={`transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <Swiper
                        modules={[Autoplay, Navigation, EffectCoverflow]}
                        spaceBetween={30}
                        slidesPerView={1}
                        centeredSlides={true}
                        effect="coverflow"
                        coverflowEffect={{
                            rotate: 0,
                            stretch: 0,
                            depth: 100,
                            modifier: 2,
                            slideShadows: true,
                        }}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        navigation={{
                            nextEl: '.swiper-button-next-custom',
                            prevEl: '.swiper-button-prev-custom',
                        }}
                        onSlideChange={(swiper: SwiperType) => setActiveSlide(swiper.activeIndex)}
                        loop={reviews.length > 2}
                        breakpoints={{
                            640: { slidesPerView: 1.2, spaceBetween: 20 },
                            768: { slidesPerView: 1.5, spaceBetween: 30 },
                            1024: { slidesPerView: 2.2, spaceBetween: 40 },
                            1280: { slidesPerView: 2.5, spaceBetween: 50 },
                        }}
                        className="testimonials-swiper pb-16"
                    >
                        {reviews.map((review, index) => (
                            <SwiperSlide key={review._id}>
                                <div
                                    className={`bg-white rounded-2xl border-2 p-8 h-full transition-all duration-500 relative overflow-hidden group ${
                                        index === activeSlide ? 'border-blue-200 shadow-2xl shadow-blue-100/50 scale-105' : 'border-gray-100 shadow-lg hover:shadow-xl hover:border-blue-100'
                                    }`}
                                >
                                    {/* Background gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    {/* Quote icon */}
                                    <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                                        <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                        </svg>
                                    </div>

                                    <div className="relative z-10 flex flex-col h-full">
                                        {/* Enhanced Stars */}
                                        <StarRating rating={review.averageRating} />

                                        {/* Testimonial Text */}
                                        <blockquote className="text-gray-700 mb-8 leading-relaxed text-lg flex-grow relative">
                                            <span className="text-2xl text-blue-300 absolute -top-2 -left-2">"</span>
                                            <span className="relative z-10">{review.comment}</span>
                                            <span className="text-2xl text-blue-300 absolute -bottom-4 -right-2">"</span>
                                        </blockquote>

                                        {/* Enhanced Author section */}
                                        <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-100">
                                            <Avatar name={review.reviewerName} />
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900 text-lg">{review.reviewerName}</div>
                                                <div className="text-blue-600 font-semibold text-sm bg-blue-50 px-3 py-1 rounded-full inline-block">{review.reviewerRole}</div>
                                            </div>
                                            {/* Verified badge */}
                                            <div className="text-green-500">
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Enhanced Navigation Buttons */}
                    {reviews.length > 1 && (
                        <div className="flex justify-center gap-6 mt-12">
                            <button className="swiper-button-prev-custom group w-14 h-14 rounded-full bg-white border-2 border-gray-200 shadow-lg flex items-center justify-center hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:scale-110">
                                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button className="swiper-button-next-custom group w-14 h-14 rounded-full bg-white border-2 border-gray-200 shadow-lg flex items-center justify-center hover:border-blue-500 hover:shadow-xl transition-all duration-300 hover:scale-110">
                                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Enhanced Stats Section */}
                <div className={`mt-20 transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/40 shadow-2xl p-8 lg:p-12">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                            {[
                                { number: '10,000+', label: 'Happy Customers', icon: '👥', color: 'from-blue-500 to-blue-600' },
                                { number: '1M+', label: 'Documents Signed', icon: '📝', color: 'from-green-500 to-green-600' },
                                { number: '99.9%', label: 'Uptime Guarantee', icon: '⚡', color: 'from-purple-500 to-purple-600' },
                                { number: '24/7', label: 'Expert Support', icon: '🚀', color: 'from-orange-500 to-orange-600' },
                            ].map((stat, index) => (
                                <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
                                    <div
                                        className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center text-white text-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                                    >
                                        {stat.icon}
                                    </div>
                                    <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">{stat.number}</div>
                                    <div className="text-sm lg:text-base text-gray-600 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className={`text-center mt-16 transition-all duration-1000 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative z-10">
                            <h3 className="text-2xl lg:text-3xl font-bold mb-4">Ready to join our satisfied customers?</h3>
                            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">Start your free trial today and experience why thousands of professionals choose our platform</p>
                            <button onClick={() => navigate('/subscriptions')} className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg">
                                Start Free Trial
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeTestimonial;
