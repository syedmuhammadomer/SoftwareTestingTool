import React from 'react'
import { Check, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '@/components/Button'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function Pricing() {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const card = {
    hidden: { y: 50, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  }

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever',
      description: 'Perfect for individuals and small teams getting started',
      features: [
        'Up to 50 test cases per month',
        'Basic AI test generation',
        'Email support',
        'API documentation access',
        'Community forum access'
      ],
      limitations: [
        'Limited to 2 projects',
        'Basic reporting only'
      ],
      buttonText: 'Get Started Free',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      name: 'Professional',
      price: '$29',
      period: 'per month',
      description: 'Ideal for growing teams and professional QA engineers',
      features: [
        'Unlimited test cases',
        'Advanced AI test generation',
        'Priority email support',
        'Advanced reporting & analytics',
        'API access with higher limits',
        'Custom test templates',
        'Integration with CI/CD tools',
        'Team collaboration features'
      ],
      limitations: [],
      buttonText: 'Start Free Trial',
      buttonVariant: 'primary' as const,
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For large organizations with advanced testing needs',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Phone & priority support',
        'Custom AI model training',
        'Advanced security features',
        'SSO integration',
        'Custom integrations',
        'On-premise deployment option',
        'Compliance reporting'
      ],
      limitations: [],
      buttonText: 'Contact Sales',
      buttonVariant: 'secondary' as const,
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="py-24 px-6 lg:px-12 relative overflow-hidden">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-block mb-6 px-6 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full">
              <span className="text-cyan-400 text-sm font-semibold flex items-center gap-2">
                <Star size={16} />
                Choose Your Plan
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Simple, Transparent</span>
              <br />
              Pricing for Everyone
            </h1>

            <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-12">
              Choose the perfect plan for your testing needs. All plans include our core AI-powered test generation technology.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-6 lg:px-12">
        <div className="container mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={card}
                className={`relative group ${
                  plan.popular
                    ? 'md:scale-105 lg:scale-110'
                    : 'hover:scale-105'
                } transition-all duration-300`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Card */}
                <div className={`relative h-full p-8 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-cyan-500/50 shadow-2xl shadow-cyan-500/20'
                    : 'bg-slate-900/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                }`}>

                  {/* Glow Effect for Popular */}
                  {plan.popular && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-50"></div>
                  )}

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

                      <div className="mb-6">
                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                        <span className="text-slate-400 ml-2">/{plan.period}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <Check size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-300 text-sm">{feature}</span>
                        </div>
                      ))}

                      {plan.limitations.map((limitation, limitIndex) => (
                        <div key={limitIndex} className="flex items-start gap-3 opacity-60">
                          <div className="w-4 h-4 rounded-full bg-slate-600 mt-0.5 flex-shrink-0"></div>
                          <span className="text-slate-400 text-sm">{limitation}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      variant={plan.buttonVariant}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold'
                          : ''
                      }`}
                      size="lg"
                    >
                      {plan.buttonText}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 lg:px-12 bg-slate-900/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Got questions? We&apos;ve got answers. Can&apos;t find what you&apos;re looking for? Contact our support team.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                question: "Can I change my plan at any time?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges."
              },
              {
                question: "Is there a free trial?",
                answer: "Absolutely! All paid plans come with a 14-day free trial. No credit card required to start."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise customers."
              },
              {
                question: "Do you offer discounts for non-profits?",
                answer: "Yes! We offer special pricing for educational institutions, non-profits, and open-source projects. Contact us for details."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
              >
                <h3 className="text-white font-semibold mb-2">{faq.question}</h3>
                <p className="text-slate-400">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-12">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Testing?
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              Join thousands of QA engineers who are saving hours every week with AI-powered test generation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-4"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-slate-600 hover:bg-slate-800 text-white px-8 py-4"
              >
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}