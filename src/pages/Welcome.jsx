import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SignIn } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import Logo from '@/components/shared/Logo';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        .swipe-gradient {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
        }
        .swipe-gradient-text {
          background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .floating {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-200 rounded-full opacity-20 blur-3xl floating" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200 rounded-full opacity-20 blur-3xl floating" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", type: "spring" }}
            className="flex justify-center mb-6"
          >
            <Logo size="xl" />
          </motion.div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-gray-600 text-lg"
          >
            Welcome! Sign in to find your next opportunity.
          </motion.p>
        </div>

        {/* Clerk Sign In Component */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <SignIn 
            routing="path"
            path="/welcome"
            signUpUrl="/onboarding"
            afterSignInUrl={createPageUrl('OnboardingWizard')}
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20"
              }
            }}
          />
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to SwipeHire's Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}