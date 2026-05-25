import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateJob } from "@/hooks/use-jobs";
import { useAuthStore } from "@/stores/auth-store";
import FormField from "@/components/ui/FormField";
import Alert from "@/components/ui/Alert";
import { Plus, X, Loader2 } from "lucide-react";
import { useState } from "react";

const postJobSchema = z
  .object({
    title:       z.string().min(3, "Title must be at least 3 characters.").max(100),
    description: z.string().min(50, "Description must be at least 50 characters.").max(5000),
    company:     z.string().min(1, "Company name is required."),
    location:    z.string().min(1, "Location is required."),
    type: z.enum(["full-time", "part-time", "contract", "internship", "remote"], "Please select a job type.",),
    salaryMin:  z.string().optional(),
    salaryMax:  z.string().optional(),
    currency:   z.string().default("CAD"),
    skills:     z.array(z.object({ value: z.string().min(1) })).max(20),
    deadline:   z.string().optional(),
    status:     z.enum(["open", "draft"]).default("open"),
  });

// Input type — what the form fields hold (used by useForm)
type PostJobFormInput  = z.input<typeof postJobSchema>;

// Output type — what onSubmit receives after Zod transforms (used by onSubmit)
type PostJobFormOutput = z.output<typeof postJobSchema>;

const JOB_TYPES = [
  { value: "full-time",  label: "Full-time" },
  { value: "part-time",  label: "Part-time" },
  { value: "contract",   label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "remote",     label: "Remote" },
];

export default function PostJobPage() {
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const createJob    = useCreateJob();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PostJobFormInput, unknown, PostJobFormOutput>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      company:  user?.company ?? "",
      currency: "CAD",
      skills:   [],
      status:   "open",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "skills",
  });

  const descriptionLength = watch("description")?.length ?? 0;

  const onSubmit = async (data: PostJobFormOutput) => {
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
            max:      data.salaryMax ? parseInt(data.salaryMax) : parseInt(data.salaryMin),
            currency: data.currency ?? "CAD",
          },
        }),
      };

      await createJob.mutateAsync(payload);
      navigate("/employer/dashboard");
    } catch (err: any) {
      setRootError(
        err?.response?.data?.message ?? "Failed to post job. Please try again."
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post a Job</h1>
        <p className="text-gray-500 mt-1">
          Fill in the details below to attract the right candidates.
        </p>
      </div>

      {rootError && (
        <Alert message={rootError} variant="error" className="mb-5" />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">

        {/* Basic info */}
        <div className="card p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>

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
              placeholder="Your company name"
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
                <label
                  key={t.value}
                  className="relative cursor-pointer"
                >
                  <input
                    type="radio"
                    value={t.value}
                    className="sr-only peer"
                    {...register("type")}
                  />
                  <span
                    className="block text-center px-3 py-2 rounded-lg border text-xs
                               font-medium transition-colors
                               border-gray-200 text-gray-600 bg-white
                               peer-checked:border-brand-500 peer-checked:bg-brand-50
                               peer-checked:text-brand-700 hover:border-gray-300"
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
              placeholder="Describe the role, responsibilities, requirements, and what makes this opportunity great…"
              className={`input resize-none ${errors.description ? "border-red-400 focus:ring-red-400" : ""}`}
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
              <span className={`text-xs ${descriptionLength < 50 ? "text-gray-400" : "text-green-600"}`}>
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
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {fields.length < 20 && (
              <button
                type="button"
                onClick={() => append({ value: "" })}
                className="flex items-center gap-1 px-3 py-1.5 border-2 border-dashed
                           border-gray-300 text-gray-500 rounded-lg text-sm
                           hover:border-brand-400 hover:text-brand-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
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
              <label htmlFor="status" className="label">Publish Status</label>
              <select id="status" className="input" {...register("status")}>
                <option value="open">Publish immediately</option>
                <option value="draft">Save as draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting…
              </>
            ) : (
              "Post Job"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}