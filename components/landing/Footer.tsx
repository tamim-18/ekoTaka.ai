'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Leaf className="w-7 h-7 text-white" />
              </motion.div>
              <span className="text-2xl font-black text-white">EkoTaka.ai</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              AI-powered platform revolutionizing Bangladesh's plastic waste value chain through intelligent technology.
            </p>
          </motion.div>

          {[
            {
              title: "Product",
              links: ["Features", "How It Works", "Impact", "Pricing"]
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Partners"]
            },
            {
              title: "Support",
              links: ["Help Center", "Contact", "Privacy", "Terms"]
            }
          ].map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <h4 className="font-bold text-white mb-4 text-lg">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <Link href="#" className="hover:text-emerald-400 transition-colors text-gray-400">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between"
        >
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} EkoTaka.ai. All rights reserved.
          </p>
          <div className="flex items-center gap-6 mt-4 sm:mt-0">
            {['Twitter', 'LinkedIn', 'GitHub'].map((social, i) => (
              <motion.a
                key={i}
                href="#"
                className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-emerald-600 transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="sr-only">{social}</span>
                <div className="w-5 h-5 bg-gray-400 rounded"></div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

