import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Briefcase, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";
import { clsx } from "clsx";

// Zod schema

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters.")
      .max(50, "Name cannot exceed 50 characters."),
    email: z
      .string()
      .min(1, "Email is required.")
      .email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Must contain at least one number.")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    role: z.enum(["candidate", "employer"]),
    company: z.string().max(100).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine(
    (data) =>
      data.role !== "employer" || (data.company && data.company.trim().length > 0),
    {
      message: "Company name is required for employer accounts.",
      path: ["company"],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

// Role selector card

interface RoleCardProps {
  role: "candidate" | "employer";
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function RoleCard({
  selected,
  onSelect,
  icon,
  title,
  description,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2",
        "transition-all duration-150 text-center focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        selected
          ? "border-brand-500 bg-brand-50 text-brand-700"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
      )}
      aria-pressed={selected}
    >
      <span className={clsx("p-2 rounded-lg", selected ? "bg-brand-100" : "bg-gray-100")}>
        {icon}
      </span>
      <span className="font-medium text-sm">{title}</span>
      <span className="text-xs text-gray-500 leading-snug">{description}</span>
    </button>
  );
}

// Password strength indicator

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters",        pass: password.length >= 8 },
    { label: "Uppercase letter",      pass: /[A-Z]/.test(password) },
    { label: "Number",                pass: /[0-9]/.test(password) },
    { label: "Special character",     pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const strength = ["", "Weak", "Fair", "Good", "Strong"][passed];
  const colors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

  if (!password) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {/* Progress bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={clsx(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= passed ? colors[passed] : "bg-gray-200"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Strength:{" "}
        <span
          className={clsx(
            "font-medium",
            passed === 4 ? "text-green-600" :
            passed === 3 ? "text-blue-600" :
            passed === 2 ? "text-yellow-600" : "text-red-600"
          )}
        >
          {strength}
        </span>
      </p>
      {/* Checklist */}
      <ul className="grid grid-cols-2 gap-1">
        {checks.map((check) => (
          <li
            key={check.label}
            className={clsx(
              "text-xs flex items-center gap-1",
              check.pass ? "text-green-600" : "text-gray-400"
            )}
          >
            <span aria-hidden="true">{check.pass ? "✓" : "○"}</span>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component

export default function RegisterPage() {
  const { register: registerUser, extractErrors } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "candidate" },
  });

  const selectedRole = watch("role");
  const passwordValue = watch("password") ?? "";

  const onSubmit = async (data: RegisterFormData) => {
    setRootError(null);
    try {
      const { confirmPassword: _, ...credentials } = data;
      await registerUser(credentials);
    } catch (err) {
      const extracted = extractErrors(err);
      Object.entries(extracted).forEach(([field, message]) => {
        if (field === "root") {
          setRootError(message);
        } else {
          setError(field as keyof RegisterFormData, { message });
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">JobBoard</h1>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        <div className="card p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Get started
          </h2>

          {rootError && (
            <Alert message={rootError} variant="error" className="mb-5" />
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* Role selector */}
            <div>
              <p className="label mb-2">I am a</p>
              <div className="flex gap-3">
                <RoleCard
                  role="candidate"
                  selected={selectedRole === "candidate"}
                  onSelect={() => setValue("role", "candidate")}
                  icon={<User className="w-5 h-5" />}
                  title="Candidate"
                  description="Looking for a job"
                />
                <RoleCard
                  role="employer"
                  selected={selectedRole === "employer"}
                  onSelect={() => setValue("role", "employer")}
                  icon={<Briefcase className="w-5 h-5" />}
                  title="Employer"
                  description="Hiring talent"
                />
              </div>
            </div>

            {/* Name */}
            <FormField
              label="Full name"
              type="text"
              autoComplete="name"
              required
              error={errors.name?.message}
              {...register("name")}
            />

            {/* Email */}
            <FormField
              label="Email address"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Company — only shown for employers */}
            {selectedRole === "employer" && (
              <FormField
                label="Company name"
                type="text"
                autoComplete="organization"
                required
                error={errors.company?.message}
                {...register("company")}
              />
            )}

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="label">
                Password
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
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
                <p role="alert" className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
              <PasswordStrength password={passwordValue} />
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="confirmPassword" className="label">
                Confirm password
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  className={`input pr-10 ${
                    errors.confirmPassword
                      ? "border-red-400 focus:ring-red-400"
                      : ""
                  }`}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p role="alert" className="text-xs text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500 leading-relaxed">
              By creating an account you agree to our{" "}
              <Link to="/terms" className="text-brand-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-brand-600 hover:underline">
                Privacy Policy
              </Link>.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-600 hover:text-brand-700
                         font-medium hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}