import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useJob } from "@/hooks/use-jobs";
import { useUpdateJob } from "@/hooks/use-jobs";
import { useAuthStore } from "@/stores/auth-store";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Plus, X, Loader2, ArrowLeft, AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

// Schema (mirrors PostJobPage exactly)
const editJobSchema = z.object({
  title:       z.string().min(3, "Title must be at least 3 characters.").max(100),
  description: z.string().min(50, "Description must be at least 50 characters.").max(5000),
  company:     z.string().min(1, "Company name is required."),
  location:    z.string().min(1, "Location is required."),
  type: z.enum(
    ["full-time", "part-time", "contract", "internship", "remote"],
    "Please select a job type."
  ),
  salaryMin:  z.string().optional(),
  salaryMax:  z.string().optional(),
  currency:   z.string().optional().transform((v) => v ?? "CAD"),
  skills:     z.array(z.object({ value: z.string().min(1) })).max(20),
  deadline:   z.string().optional(),
  status:     z.enum(["open", "draft", "closed"])
               .optional()
               .transform((v) => v ?? ("open" as const)),
});

type EditJobInput  = z.input<typeof editJobSchema>;
type EditJobOutput = z.output<typeof editJobSchema>;

const JOB_TYPES = [
  { value: "full-time",  label: "Full-time"  },
  { value: "part-time",  label: "Part-time"  },
  { value: "contract",   label: "Contract"   },
  { value: "internship", label: "Internship" },
  { value: "remote",     label: "Remote"     },
];

// Form skeleton while job data loads
function EditFormSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-6 flex flex-col gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EditJobPage() {
  const { id = "" }  = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const updateJob    = useUpdateJob(id);
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    data:      jobData,
    isLoading: jobLoading,
    isError:   jobError,
  } = useJob(id);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditJobInput, unknown, EditJobOutput>({
    resolver: zodResolver(editJobSchema),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "skills" });
  const descriptionLength = watch("description")?.length ?? 0;

  // Populate form once job data arrives
  useEffect(() => {
    if (!jobData?.job) return;
    const job = jobData.job;

    reset({
      title:       job.title,
      description: job.description,
      company:     job.company,
      location:    job.location,
      type:        job.type,
      currency:    job.salary?.currency ?? "CAD",
      salaryMin:   job.salary?.min  ? String(job.salary.min)  : "",
      salaryMax:   job.salary?.max  ? String(job.salary.max)  : "",
      skills:      job.skills.map((s) => ({ value: s })),
      deadline:    job.deadline
        ? new Date(job.deadline).toISOString().split("T")[0]
        : "",
      status: job.status as any,
    });
  }, [jobData, reset]);

  // Guard: only the job's employer can edit it
  const job = jobData?.job;
  const isOwner = job
    ? (typeof job.employer === "string"
        ? job.employer
        : (job.employer as any)?._id?.toString()) === user?._id
    : null;

  const onSubmit = async (data: EditJobOutput) => {
    setRootError(null);
    try {
      const payload = {
        title:       data.title,
        description: data.description,
        company:     data.company,
        location:    data.location,
        type:        data.type,
        status:      data.status,
        skills:      data.skills.map((s) => s.value).filter(Boolean),
        deadline:    data.deadline || undefined,
        ...(data.salaryMin && {
          salary: {
            min:      parseInt(data.salaryMin),
            max:      data.salaryMax
              ? parseInt(data.salaryMax)
              : parseInt(data.salaryMin),
            currency: data.currency,
          },
        }),
      };

      await updateJob.mutateAsync(payload);
      toast.success("Job updated successfully.");
      navigate("/employer/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to update job.";
      setRootError(msg);
      toast.error(msg);
    }
  };

  // Loading
  if (jobLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-7 w-48" />
        </div>
        <EditFormSkeleton />
      </div>
    );
  }

  // Error / not found
  if (jobError || !job) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="card p-10 text-center">
          <AlertTriangle
            className="w-10 h-10 text-red-500 mx-auto mb-3"
            aria-hidden="true"
          />
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Job not found
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            This job doesn't exist or you don't have permission to edit it.
          </p>
          <button
            onClick={() => navigate("/employer/dashboard")}
            className="btn-secondary"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  // Ownership check
  if (isOwner === false) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="card p-10 text-center">
          <AlertTriangle
            className="w-10 h-10 text-orange-500 mx-auto mb-3"
            aria-hidden="true"
          />
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Access denied
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            You can only edit your own job postings.
          </p>
          <button
            onClick={() => navigate("/employer/dashboard")}
            className="btn-secondary"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100
                     hover:text-gray-700 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
          <p className="text-gray-500 text-sm mt-0.5">{job.title}</p>
        </div>
      </div>

      {/* Unsaved changes warning */}
      {isDirty && (
        <Alert
          variant="warning"
          message="You have unsaved changes."
          className="mb-5"
        />
      )}

      {rootError && (
        <Alert variant="error" message={rootError} className="mb-5" />
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-6"
      >
        {/* Basic info */}
        <div className="card p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-900">
            Basic Information
          </h2>

          <FormField
            label="Job Title"
            required
            placeholder="e.g. Senior React Developer"
            error={errors.title?.message}
            {...register("title")}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Company"
              required
              error={errors.company?.message}
              {...register("company")}
            />
            <FormField
              label="Location"
              required
              placeholder="e.g. Toronto, ON or Remote"
              error={errors.location?.message}
              {...register("location")}
            />
          </div>

          {/* Job type */}
          <div>
            <p className="label mb-2">
              Job Type <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {JOB_TYPES.map((t) => (
                <label key={t.value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    value={t.value}
                    className="sr-only peer"
                    {...register("type")}
                  />
                  <span
                    className="block text-center px-3 py-2 rounded-lg border
                               text-xs font-medium transition-colors
                               border-gray-200 text-gray-600 bg-white
                               peer-checked:border-brand-500
                               peer-checked:bg-brand-50
                               peer-checked:text-brand-700
                               hover:border-gray-300"
                  >
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
            {errors.type && (
              <p role="alert" className="text-xs text-red-600 mt-1">
                {errors.type.message}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Job Description
          </h2>
          <div>
            <label htmlFor="description" className="label">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={12}
              className={clsx(
                "input resize-none",
                errors.description && "border-red-400 focus:ring-red-400"
              )}
              {...register("description")}
            />
            <div className="flex justify-between mt-1">
              {errors.description ? (
                <p role="alert" className="text-xs text-red-600">
                  {errors.description.message}
                </p>
              ) : (
                <span />
              )}
              <span
                className={clsx(
                  "text-xs",
                  descriptionLength < 50 ? "text-gray-400" : "text-green-600"
                )}
              >
                {descriptionLength} / 5000
              </span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Required Skills
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {fields.map((field, index) => (
              <span
                key={field.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-100
                           text-brand-700 rounded-lg text-sm font-medium"
              >
                <input
                  {...register(`skills.${index}.value`)}
                  className="bg-transparent outline-none min-w-0 w-20"
                  placeholder="Skill"
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove skill"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
            {fields.length < 20 && (
              <button
                type="button"
                onClick={() => append({ value: "" })}
                className="flex items-center gap-1 px-3 py-1.5 border-2
                           border-dashed border-gray-300 text-gray-500
                           rounded-lg text-sm hover:border-brand-400
                           hover:text-brand-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Add skill
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Add up to 20 skills (e.g. React, TypeScript, Node.js)
          </p>
        </div>

        {/* Salary */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Salary (optional)
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="currency" className="label">Currency</label>
              <select
                id="currency"
                className="input"
                {...register("currency")}
              >
                <option value="CAD">CAD</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <FormField
              label="Minimum"
              type="number"
              placeholder="60000"
              error={errors.salaryMin?.message}
              {...register("salaryMin")}
            />
            <FormField
              label="Maximum"
              type="number"
              placeholder="90000"
              error={errors.salaryMax?.message}
              {...register("salaryMax")}
            />
          </div>
        </div>

        {/* Settings */}
        <div className="card p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-900">Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Application Deadline"
              type="date"
              error={errors.deadline?.message}
              min={new Date().toISOString().split("T")[0]}
              {...register("deadline")}
            />
            <div>
              <label htmlFor="status" className="label">Status</label>
              <select
                id="status"
                className="input"
                {...register("status")}
              >
                <option value="open">Open — accepting applications</option>
                <option value="draft">Draft — hidden from candidates</option>
                <option value="closed">Closed — no longer accepting</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-between pb-6">
          <button
            type="button"
            onClick={() => navigate("/employer/dashboard")}
            className="btn-secondary"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {!isDirty && (
              <p className="text-xs text-gray-400">No changes to save</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="btn-primary px-8 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}