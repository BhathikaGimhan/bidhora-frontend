const AnimatedBackground = () => {
  return (
    <div className="fixed  inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient background - Green & Black Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      {/* Floating green orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/15 rounded-full blur-3xl animate-float" />
      <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-bounce-gentle" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-3/4 w-48 h-48 bg-primary/12 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Dark accent orbs */}
      <div className="absolute top-2/3 left-1/3 w-32 h-32 bg-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-bounce-gentle" style={{ animationDelay: '1.5s' }} />
      
      {/* Animated dots pattern */}
      <div className="absolute inset-0 bg-dots opacity-20" />
      
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/60" />
    </div>
  );
};

export default AnimatedBackground;