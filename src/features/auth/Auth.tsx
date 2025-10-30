import ThemeToggle from '@/layouts/ThemeToggle'
import AnimatedBackground from './components/AnimatedBackground'
import LoginForm from './components/LoginForm'

function Auth() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left side - Branding & Description */}
            <div className="text-center lg:text-left space-y-8 animate-fade-in">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold text-gradient leading-tight">
                  Bidhora
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-light">
                  Professional Digital Solution Platform
                </p>
              </div>
              
              <div className="space-y-6">
                <p className="text-lg text-foreground/80 leading-relaxed max-w-lg">
                  Transform your documents with precision Digital Solution. 
                  Connect with expert typesetters and bring your projects to life.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <div className="flex items-center space-x-2 text-primary">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Professional Quality</span>
                  </div>
                  <div className="flex items-center space-x-2 text-primary">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <span className="text-sm font-medium">Fast Delivery</span>
                  </div>
                  <div className="flex items-center space-x-2 text-primary">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <span className="text-sm font-medium">Secure Platform</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Login Form */}
            <div className="flex justify-center lg:justify-end">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
    </div>
  )
}

export default Auth