import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const errorMessage = resolvedParams.error as string | undefined;
  const successMessage = resolvedParams.message as string | undefined;

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent"></span>
        Sign In
      </h1>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-4 text-foreground bg-panel border border-border p-6 rounded-xl shadow-sm">
        <div className="flex pl-3 border-l-2 border-accent mb-2">
          <p className="font-medium text-sm text-foreground/70">Sign in to your account.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-md font-medium text-foreground/80" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-md px-4 py-2 bg-background border border-border text-foreground focus:outline-none focus:border-accent"
            name="email"
            placeholder="you@example.com"
            type="email"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-md flex justify-between font-medium text-foreground/80" htmlFor="password">
            <span>Password</span>
            <span className="text-foreground/50 text-xs self-end">Min 6 chars</span>
          </label>
          <input
            className="rounded-md px-4 py-2 bg-background border border-border text-foreground focus:outline-none focus:border-accent"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>

        {errorMessage && (
          <p className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-md text-sm">
            {successMessage}
          </p>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <button
            formAction={login}
            className="w-full bg-foreground text-background font-medium rounded-md py-2 px-4 text-sm hover:brightness-110 transition-all border border-foreground"
          >
            Sign In
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-foreground/40 text-xs">Or</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <button
            formAction={signup}
            className="w-full bg-accent text-accent-foreground font-medium rounded-md py-2 px-4 text-sm hover:bg-accent/90 transition-all"
          >
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
}
