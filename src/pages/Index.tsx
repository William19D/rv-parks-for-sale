import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ListingCard } from "@/components/listings/ListingCard";
import { mockListings } from "@/data/mockListings";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

const Index = () => {
  // Get featured listings
  const featuredListings = mockListings.filter(listing => listing.featured);
  const [scrolled, setScrolled] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };
  
  // Array of FAQ items for easier management
  const faqItems = [
    {
      question: "How much does it cost to list my property?",
      answer: "Listing your RV park on RoverPass is completely free. We don't charge any upfront fees or commissions."
    },
    {
      question: "Who can see my listing?",
      answer: "Your listing will be visible to thousands of qualified investors and buyers specifically looking for RV park opportunities."
    },
    {
      question: "How long will my listing be active?",
      answer: "Listings remain active for 6 months and can be renewed or updated at any time through your broker dashboard."
    },
    {
      question: "Can I edit my listing after publishing?",
      answer: "Yes, you can update your listings at any time through your broker dashboard. Changes will be published immediately."
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section - Enhanced with animation */}
      <section className="relative bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src="/placeholder.svg" 
            alt="RV Park Background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Moving background pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-overlay blur-xl animate-float-slow"></div>
          <div className="absolute top-20 right-20 w-60 h-60 bg-white rounded-full mix-blend-overlay blur-xl animate-float"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-md">
              Find Your Perfect RV Park Investment
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8">
              Browse exclusive listings of RV parks and campgrounds for sale across the United States.
            </p>
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
                <Link to="/listings" className="flex items-center gap-2">
                  Browse All Listings
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
                <Link to="/broker/dashboard">List Your Property</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <ChevronDown className="h-6 w-6 text-white animate-bounce" />
        </motion.div>
      </section>
      
      {/* Featured Listings Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold relative">
              Featured Properties
              <span className="absolute -bottom-2 left-0 h-1 w-20 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <Button asChild variant="outline" className="border-[#f74f4f] text-[#f74f4f] hover:bg-[#f74f4f]/5 group">
              <Link to="/listings" className="flex items-center gap-1">
                View All
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {featuredListings.map((listing, index) => (
              <motion.div key={listing.id} variants={itemVariants}>
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Info Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 relative inline-block">
              Why List With RoverPass?
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              Join hundreds of brokers who trust RoverPass to connect with qualified RV park buyers.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#f74f4f]/20 transition-colors">
                <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#f74f4f] transition-colors">Maximum Exposure</h3>
              <p className="text-muted-foreground">
                Your listings are seen by thousands of qualified investors actively looking for RV park opportunities.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#f74f4f]/20 transition-colors">
                <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#f74f4f] transition-colors">Free Listings</h3>
              <p className="text-muted-foreground">
                No upfront fees or commissions. List your properties completely free of charge.
              </p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 bg-[#f74f4f]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#f74f4f]/20 transition-colors">
                <svg className="w-6 h-6 text-[#f74f4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#f74f4f] transition-colors">Powerful Tools</h3>
              <p className="text-muted-foreground">
                Easy listing management, detailed analytics, and real-time notifications for buyer inquiries.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#f74f4f] to-[#ff7a45] relative overflow-hidden">
        {/* Moving background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-xl"></div>
        
        <motion.div 
          className="container mx-auto px-4 text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to List Your RV Park?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join our network of professional brokers and reach thousands of qualified buyers.
          </p>
          <Button asChild size="lg" className="bg-white text-[#f74f4f] hover:bg-gray-100 hover:shadow-lg transition-all group">
            <Link to="/broker/dashboard" className="flex items-center gap-2">
              Get Started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </section>
      
      {/* FAQ Section - Enhanced with interactive accordion */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center relative inline-block">
              Frequently Asked Questions
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
          </motion.div>
          
          <motion.div 
            className="max-w-3xl mx-auto space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {faqItems.map((faq, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  className={`w-full flex justify-between items-center p-6 text-left transition-colors ${
                    expandedFaq === index ? 'bg-[#f74f4f]/5' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => toggleFaq(index)}
                >
                  <h3 className={`text-xl font-semibold ${expandedFaq === index ? 'text-[#f74f4f]' : ''}`}>
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      expandedFaq === index ? "transform rotate-180 text-[#f74f4f]" : "text-gray-500"
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedFaq === index ? "max-h-40" : "max-h-0"
                  }`}
                >
                  <p className="p-6 text-muted-foreground">{faq.answer}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Call to action within FAQ */}
          <motion.div 
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p className="text-lg mb-4">Still have questions?</p>
            <Button asChild variant="outline" className="border-[#f74f4f] text-[#f74f4f] hover:bg-[#f74f4f]/5">
              <Link to="/contact">Contact Our Support Team</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - New section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4 relative inline-block">
              What Our Clients Say
              <span className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-[#f74f4f] rounded-full"></span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
              Discover what brokers and property owners are saying about their experience with RoverPass.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-t-4 border-[#f74f4f]">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-4">
                  <span className="text-[#f74f4f] font-bold">JD</span>
                </div>
                <div>
                  <h3 className="font-semibold">John Davis</h3>
                  <p className="text-sm text-gray-500">RV Park Owner</p>
                </div>
              </div>
              <p className="italic text-gray-600">"I sold my RV park in just 3 months thanks to RoverPass. The platform connected me with serious buyers and the process was seamless."</p>
              <div className="flex text-[#ff9f45] mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-t-4 border-[#f74f4f]">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-4">
                  <span className="text-[#f74f4f] font-bold">SM</span>
                </div>
                <div>
                  <h3 className="font-semibold">Sarah Miller</h3>
                  <p className="text-sm text-gray-500">Property Broker</p>
                </div>
              </div>
              <p className="italic text-gray-600">"The analytics dashboard helps me understand which listings are performing best. My clients are consistently impressed with the quality of leads."</p>
              <div className="flex text-[#ff9f45] mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all border-t-4 border-[#f74f4f]">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#f74f4f]/10 flex items-center justify-center mr-4">
                  <span className="text-[#f74f4f] font-bold">RJ</span>
                </div>
                <div>
                  <h3 className="font-semibold">Robert Johnson</h3>
                  <p className="text-sm text-gray-500">Investor</p>
                </div>
              </div>
              <p className="italic text-gray-600">"I've acquired three properties through RoverPass. The detailed listings and financial information made my investment decisions much easier."</p>
              <div className="flex text-[#ff9f45] mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Newsletter Section - New addition */}
      <section className="py-16 bg-[#2d3748]">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-xl mb-8 text-white/80">
              Get the latest RV park listings and industry insights delivered to your inbox.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none"
              />
              <Button className="bg-[#f74f4f] hover:bg-[#e43c3c] text-white px-6 py-3">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;