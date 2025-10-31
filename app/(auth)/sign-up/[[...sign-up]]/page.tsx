import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-10 px-4">
      <div className="w-full max-w-5xl flex items-center justify-center gap-8">
        {/* Left side - Welcome content (hidden on mobile) */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center space-y-6 p-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Join <span className="text-emerald-600">EkoTaka.ai</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-md">
              Start earning by collecting plastic waste. Get verified instantly and receive automatic payouts.
            </p>
            <div className="mt-6 space-y-3 text-left max-w-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">AI-powered verification for instant approval</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Automatic payouts via bKash & Nagad</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Track your earnings and environmental impact</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign Up Form */}
        <div className="w-full md:w-auto flex items-center justify-center">
          <div className="w-full max-w-md">
            <SignUp 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-xl rounded-2xl",
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}