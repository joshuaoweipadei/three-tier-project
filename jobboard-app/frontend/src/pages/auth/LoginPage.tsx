import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";

// Zod schema

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required."),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Component

export default function LoginPage() {
  const { login, extractErrors } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setRootError(null);
    try {
      await login(data);
    } catch (err) {
      const extracted = extractErrors(err);
      // Map server field errors back to form fields
      Object.entries(extracted).forEach(([field, message]) => {
        if (field === "root") {
          setRootError(message);
        } else {
          setError(field as keyof LoginFormData, { message });
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">JobBoard</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Welcome back
          </h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-5 mb-4"
          >
            {/* Email */}
            <FormField
              label="Email address"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="label"
              >
                Password
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className={`input pr-10 ${
                    errors.password ? "border-red-400 focus:ring-red-400" : ""
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  role="alert"
                  className="text-xs text-red-600 flex items-center gap-1"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end -mt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-brand-600 hover:text-brand-700
                           hover:underline transition-colors"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Root / API error */}
          {rootError && (
            <Alert message={rootError} variant="error" className="mb-5" />
          )}

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-brand-600 hover:text-brand-700
                         font-medium hover:underline transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}