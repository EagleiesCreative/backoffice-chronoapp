import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="w-full max-w-md">
                {/* Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">ChronoSnap</h1>
                    <p className="text-slate-400 mt-1">Developer Admin Backoffice</p>
                </div>

                {/* Clerk Sign In */}
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl",
                            headerTitle: "text-white",
                            headerSubtitle: "text-slate-400",
                            socialButtonsBlockButton: "bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600/50",
                            formFieldLabel: "text-slate-300",
                            formFieldInput: "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500",
                            footerActionLink: "text-violet-400 hover:text-violet-300",
                            formButtonPrimary: "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
                        }
                    }}
                />

                {/* Security Notice */}
                <div className="mt-6 text-center text-sm text-slate-500">
                    <p>🔒 Secure admin access only</p>
                    <p className="mt-1">Authorized personnel with @eagleies.com email</p>
                </div>
            </div>
        </div>
    );
}
