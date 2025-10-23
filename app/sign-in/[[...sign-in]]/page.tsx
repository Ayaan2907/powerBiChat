import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20"></div>
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md px-4 relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/advancelq-logo.svg" 
            alt="AdvancelQ.ai" 
            className="h-12 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Sign in to access your Power BI Analytics Dashboard
          </p>
        </div>
        
        {/* Sign In Card */}
        <div className="glass-card rounded-2xl p-1">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-primary hover:bg-primary/90 text-primary-foreground text-sm normal-case font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all glow-teal-hover",
                card: "shadow-none bg-transparent border-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: 
                  "border-border/40 hover:bg-secondary/50 text-foreground rounded-xl transition-all",
                formFieldInput: 
                  "rounded-xl border-border/40 bg-background/50 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all",
                footerActionLink: 
                  "text-primary hover:text-primary/80 font-semibold",
                identityPreviewText: "text-foreground",
                identityPreviewEditButton: "text-primary hover:text-primary/80",
                formHeaderTitle: "text-foreground",
                formHeaderSubtitle: "text-muted-foreground",
                dividerLine: "bg-border/40",
                dividerText: "text-muted-foreground",
                formFieldLabel: "text-foreground font-medium",
                otpCodeFieldInput: 
                  "border-border/40 focus:ring-2 focus:ring-primary/50 focus:border-primary",
              },
            }}
          />
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 AdvancelQ.ai, a Pinetail Capital LLC company
        </p>
      </div>
    </div>
  )
}