import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-10 px-4">
      <div className="w-full max-w-5xl flex items-center justify-center gap-8">
        {/* Left side - Welcome content (hidden on mobile) */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center space-y-6 p-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome to <span className="text-emerald-600">EkoTaka.ai</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-md">
              AI-powered waste management platform connecting collectors, recyclers, and brands
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-6">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <span>Join thousands of collectors making an impact</span>
            </div>
          </div>
        </div>

        {/* Right side - Sign In Form */}
        <div className="w-full md:w-auto flex items-center justify-center">
          <div className="w-full max-w-md">
            <SignIn 
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
