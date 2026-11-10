import { toast } from "react-toastify";

const toastDefaults = {
  position: "top-right" as const,
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
  theme: "dark" as const,
};

const handleError = (err: unknown) => {
  const message =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : "Something went wrong";
  console.error("Error occurred", err);
  toast.error(message, toastDefaults);
};

const handleSuccess = (msg: string) => {
  console.log("success", msg);
  toast.success(msg, toastDefaults);
};

export { handleError, handleSuccess };
