import React, { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";
import { apiClient } from "../../api/client.js";
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { LANDING_COPY, LANDING_NAV_LINKS } from "../../constants/landing.js";

const REMEMBERED_EMAIL_KEY = "MediNovel_remembered_email";

export const LoginPage: React.FC<{ adminOnly?: boolean }> = ({ adminOnly = false }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }, []);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });
      const { accessToken, refreshToken, user } = response.data.data;
      login(accessToken, refreshToken, user);

      if (user.role === "SUPER_ADMIN") navigate("/super-admin");
      else if (user.role === "DOCTOR") navigate("/doctor-dashboard");
      else if (user.role === "RECEPTIONIST") navigate("/reception-desk");
      else navigate("/patients");
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-950">
      <header className="sticky top-0 z-30 border-b border-[#bcc9c6]/50 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href="/"
            className="flex items-center gap-3"
            aria-label="MediNovel home"
          >
            <img src="/Medinovel_logo.png" alt="MediNovel" className="brand-logo h-11 w-11 rounded-xl object-contain" />
            <span className="flex shrink-0 flex-col">
              <span className="flex items-center gap-2 whitespace-nowrap text-base font-extrabold tracking-tight text-[#00685f] sm:text-lg">
                {LANDING_COPY.brand.name}
              </span>
              <span className="hidden text-[11px] leading-none text-[#3d4947] md:block">
                {LANDING_COPY.brand.tagline}
              </span>
            </span>
          </a>

          <nav
            className="hidden items-center gap-5 lg:flex xl:gap-7"
            aria-label="Public navigation"
          >
            {LANDING_NAV_LINKS.map(([label, id]) => (
              <a
                key={id}
                href={`/#${id}`}
                className="text-sm font-semibold text-[#3d4947] transition-colors hover:text-[#00685f]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <a
              href="/#demo"
              className="whitespace-nowrap rounded-lg border border-[#bcc9c6] bg-white px-3 py-2 text-sm font-semibold text-[#171d1c] transition-colors hover:border-[#00685f] hover:bg-[#f0f5f2] lg:px-4"
            >
              {LANDING_COPY.navigation.demo}
            </a>
                      </div>

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={isMenuOpen}
            className="rounded-lg p-2 text-[#3d4947] hover:bg-[#f0f5f2] sm:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
        {isMenuOpen && (
          <div className="border-t border-[#bcc9c6]/40 bg-white px-4 py-4 sm:hidden">
            <nav
              className="flex flex-col gap-1"
              aria-label="Mobile public navigation"
            >
              {LANDING_NAV_LINKS.map(([label, id]) => (
                <a
                  key={id}
                  href={`/#${id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#3d4947] hover:bg-[#f0f5f2]"
                >
                  {label}
                </a>
              ))}
              <a
                href="/#demo"
                onClick={() => setIsMenuOpen(false)}
                className="mt-2 rounded-lg border border-[#bcc9c6] px-3 py-2.5 text-sm font-semibold text-[#171d1c] hover:bg-[#f0f5f2]"
              >
                {LANDING_COPY.navigation.demo}
              </a>
            </nav>
          </div>
        )}
      </header>

      <section className="custom-scroll flex min-h-[calc(100vh-76px)] items-center justify-center overflow-y-auto bg-white px-6 py-10 sm:px-10 lg:px-12">
        <div className="w-full max-w-[672px] py-4">
          <header className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {adminOnly ? "Super Admin Sign In" : "Sign In to Your Workspace"}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
              {adminOnly
                ? "Enter your platform administrator credentials."
                : "Enter your hospital credentials."}
            </p>
          </header>
          {error && (
            <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} autoComplete="off" className="mb-7 space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
              Email Address <span className="text-rose-500">*</span>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="off"
                  required
                  placeholder="Enter email address"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm font-normal normal-case tracking-normal text-slate-800 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:py-3"
                />
              </div>
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
              <span className="flex items-center">
                Password <span className="ml-1 text-rose-500">*</span>
                <a
                  href="/forgot-password"
                  className="ml-auto normal-case tracking-normal text-teal-700 hover:underline"
                >
                  Forgot password?
                </a>
              </span>
              <div className="relative mt-1.5">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Enter password"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-normal normal-case tracking-normal text-slate-800 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:py-3"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-0 top-0 flex h-full items-center px-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-wait disabled:opacity-70 sm:text-base"
            >
              {isLoading ? "Signing in..." : "Sign In to MediNovel"}{" "}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <footer className="mt-8 border-t border-slate-100 pt-4 text-center text-[11px] font-medium text-slate-400">
            <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> Secure
              256-bit encrypted clinical portal <span>•</span> ABDM &amp; HIPAA
              compliant
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
};
