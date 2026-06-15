import Swal from "sweetalert2";

// Success Alert
export const showSuccessAlert = (message) => {
  Swal.fire({
    title: "Success!",
    text: message,
    icon: "success",
    confirmButtonColor: "#28a745",
  });
};

// Warning Alert
export const showWarningAlert = (message) => {
  Swal.fire({
    title: "Warning!",
    text: message,
    icon: "warning",
    confirmButtonColor: "#f0ad4e",
  });
};

// Error Alert
export const showErrorAlert = (message) => {
  Swal.fire({
    title: "Error!",
    text: message,
    icon: "error",
    confirmButtonColor: "#dc3545",
  });
};
