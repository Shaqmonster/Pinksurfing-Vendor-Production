import { toast } from "react-toastify";

const handleError = (err: any) => {
        console.error("Error occurred", err);
        toast.error(err, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
}
const handleSuccess = (msg : string) => {

        console.log("success", msg);
        toast.success(msg, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
}


export { handleError, handleSuccess };