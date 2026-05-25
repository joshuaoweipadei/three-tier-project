import { Toaster } from "react-hot-toast";

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      containerStyle={{ top: 72 }} // below the navbar
      toastOptions={{
        duration: 4000,
        style: {
          background:    "#fff",
          color:         "#111827",
          fontSize:      "0.875rem",
          fontFamily:    "inherit",
          border:        "1px solid #e5e7eb",
          borderRadius:  "0.75rem",
          boxShadow:     "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          padding:       "12px 16px",
          maxWidth:      "380px",
        },
        success: {
          iconTheme: { primary: "#16a34a", secondary: "#fff" },
          style: { borderLeft: "4px solid #16a34a" },
        },
        error: {
          iconTheme: { primary: "#dc2626", secondary: "#fff" },
          style: { borderLeft: "4px solid #dc2626" },
          duration: 6000,
        },
      }}
    />
  );
}