import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useJob } from "@/hooks/use-jobs";
import { useApplyToJob } from "@/hooks/use-applications";
import { useAuthStore } from "@/stores/auth-store";
import Alert from "@/components/ui/Alert";
import FileUpload from "@/components/ui/FileUpload";
import {
  MapPin, DollarSign, Users, Clock,
  Calendar, ArrowLeft, Loader2, CheckCircle,
} from "lucide-react";
import { clsx } from "clsx";

const applySchema = z.object({
  coverLetter: z
    .string()
    .min(100, "Cover letter must be at least 100 characters.")
    .max(2000, "Cover letter cannot exceed 2000 characters."),
  resume: z.string().optional(),
});

type ApplyFormData = z.infer<typeof applySchema>;

const JOB_TYPE_STYLES: Record<string, string> = {
  "full-time":  "bg-green-100 text-green-800",
  "part-time":  "bg-blue-100  text-blue-800",
  "contract":   "bg-purple-100 text-purple-800",
  "internship": "bg-orange-100 text-orange-800",
  "remote":     "bg-teal-100  text-teal-800",
};

export default function JobDetailPage() {
  const { id = "" }      = useParams<{ id: string }>();
  const navigate         = useNavigate();
  const { user }         = useAuthStore();
  const { data, isLoading, isError } = useJob(id);
  const applyMutation    = useApplyToJob(id);

  const [showForm,   setShowForm]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted,  setSubmitted]  = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApplyFormData>({ resolver: zodResolver(applySchema) });

  const coverLetterLength = watch("coverLetter")?.length ?? 0;

  const onSubmit = async (formData: ApplyFormData) => {
    setSubmitError(null);
    try {
      await applyMutation.mutateAsync({ coverLetter: formData.coverLetter });
      setSubmitted(true);
      setShowForm(false);
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message ?? "Failed to submit application."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto mt-10">
        <p className="text-gray-700 font-medium mb-3">Job not found.</p>
        <Link to="/jobs" className="btn-secondary">Back to jobs</Link>
      </div>
    );
  }

  const { job, hasApplied } = data;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500
                   hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {job.title}
                </h1>
                <p className="text-gray-600 font-medium">{job.company}</p>
              </div>
              <span className={clsx("badge flex-shrink-0", JOB_TYPE_STYLES[job.type])}>
                {job.type}
              </span>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {job.applicationCount} applicants
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
              {job.deadline && (
                <span className="flex items-center gap-1.5 text-red-500">
                  <Calendar className="w-4 h-4" />
                  Deadline: {new Date(job.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Description card */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Job Description
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Skills card */}
          {job.skills.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700
                               rounded-lg text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Application form */}
          {showForm && user?.role === "candidate" && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Application
              </h2>

              {submitError && (
                <Alert message={submitError} variant="error" className="mb-4" />
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="coverLetter" className="label">
                    Cover Letter
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    id="coverLetter"
                    rows={8}
                    placeholder="Tell the employer why you're a great fit for this role…"
                    className={clsx(
                      "input resize-none",
                      errors.coverLetter && "border-red-400 focus:ring-red-400"
                    )}
                    {...register("coverLetter")}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.coverLetter ? (
                      <p role="alert" className="text-xs text-red-600">
                        {errors.coverLetter.message}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span
                      className={clsx(
                        "text-xs",
                        coverLetterLength < 100 ? "text-gray-400" : "text-green-600"
                      )}
                    >
                      {coverLetterLength} / 2000
                    </span>
                  </div>
                </div>

                <FileUpload
                  type="resume"
                  label="Resume (optional — uses your profile resume if not uploaded)"
                  onUpload={(url) => setValue("resume", url)}
                  currentUrl={null}
                />

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">

          {/* Apply card */}
          <div className="card p-5">
            {submitted || hasApplied ? (
              <div className="text-center py-2">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Application Submitted</p>
                <p className="text-sm text-gray-500 mt-1">
                  Good luck! You'll be notified of any updates.
                </p>
                <Link
                  to="/candidate/dashboard"
                  className="btn-secondary w-full mt-4 text-sm"
                >
                  Track Application
                </Link>
              </div>
            ) : user?.role === "candidate" ? (
              <>
                <button
                  onClick={() => setShowForm(true)}
                  disabled={job.status !== "open"}
                  className="btn-primary w-full"
                >
                  {job.status === "open" ? "Apply Now" : "Position Closed"}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Takes about 5 minutes
                </p>
              </>
            ) : user?.role === "employer" ? (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">
                  You're viewing this as an employer.
                </p>
              </div>
            ) : (
              <>
                <Link to="/register" className="btn-primary w-full">
                  Sign up to Apply
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary w-full mt-2 text-sm"
                >
                  Already have an account?
                </Link>
              </>
            )}
          </div>

          {/* Salary card */}
          {job.salary && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Salary Range
              </h3>
              <p className="text-xl font-bold text-gray-900">
                {job.salary.currency}{" "}
                {job.salary.min.toLocaleString()}
                {job.salary.max
                  ? ` – ${job.salary.max.toLocaleString()}`
                  : "+"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per year</p>
            </div>
          )}

          {/* Job details card */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Job Details
            </h3>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div>
                <dt className="text-gray-500">Job type</dt>
                <dd className="font-medium text-gray-900 capitalize">{job.type}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Location</dt>
                <dd className="font-medium text-gray-900">{job.location}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Posted</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(job.createdAt).toLocaleDateString("en-CA", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </dd>
              </div>
              {job.deadline && (
                <div>
                  <dt className="text-gray-500">Deadline</dt>
                  <dd className="font-medium text-red-600">
                    {new Date(job.deadline).toLocaleDateString("en-CA", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}