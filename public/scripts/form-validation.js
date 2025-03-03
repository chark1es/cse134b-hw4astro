document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".contact-form");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const commentsInput = document.getElementById("comments");
    const errorOutput = document.querySelector(".error-message");
    const charCount = document.getElementById("char-count");
    const charCounter = document.querySelector(".char-counter");

    const MAX_COMMENTS_LENGTH = 500;
    const WARNING_THRESHOLD = 50;
    const MIN_COMMENTS_LENGTH = 10;

    let form_errors = [];

    // Hide all validation messages initially
    document.querySelectorAll(".validation-message").forEach((message) => {
        message.style.display = "none";
    });

    // Function to add error to form_errors array
    function addFormError(fieldName, errorType, invalidValue, message) {
        form_errors.push({
            field: fieldName,
            value: invalidValue,
            type: errorType,
            message: message,
        });
    }

    // Prevent non-alphanumeric characters in name field
    if (nameInput) {
        nameInput.addEventListener("input", function (e) {
            const input = e.target;
            const fieldLabel = input.previousElementSibling
                ? input.previousElementSibling.textContent
                : "Name";
            const originalValue = input.value;

            // Allow letters, spaces, hyphens, and apostrophes
            const sanitizedValue = originalValue.replace(/[^a-zA-Z\s\-']/g, "");

            if (originalValue !== sanitizedValue) {
                input.value = sanitizedValue;
                input.classList.add("flash-error");
                setTimeout(() => {
                    input.classList.remove("flash-error");
                }, 500);

                const errorMessage = `Invalid character entered in ${fieldLabel} field`;
                showErrorMessage(errorMessage);

                // Track the invalid character error
                addFormError(
                    "name",
                    "invalid_character",
                    originalValue,
                    errorMessage
                );
            }
        });
    }

    // Character counter for comments
    if (commentsInput && charCount) {
        commentsInput.addEventListener("input", function () {
            const remaining = MAX_COMMENTS_LENGTH - this.value.length;
            charCount.textContent = remaining;

            // Reset classes
            charCounter.classList.remove("warning", "error");
            textarea.classList.remove("warning", "error");

            // Apply appropriate class based on remaining characters
            if (remaining <= WARNING_THRESHOLD && remaining > 0) {
                charCounter.classList.add("warning");
            } else if (remaining <= 0) {
                charCounter.classList.add("error");
                textarea.classList.add("error");

                // Truncate text if over limit
                this.value = this.value.substring(0, MAX_COMMENTS_LENGTH);
                charCount.textContent = 0;

                showErrorMessage(
                    `Maximum ${MAX_COMMENTS_LENGTH} characters allowed`
                );

                addFormError(
                    "comments",
                    "max_length_exceeded",
                    this.value,
                    `Maximum ${MAX_COMMENTS_LENGTH} characters allowed`
                );
            }

            // Show validation message when typing
            const validationMsg = this.nextElementSibling;
            if (
                validationMsg &&
                validationMsg.classList.contains("validation-message")
            ) {
                if (this.value.length < MIN_COMMENTS_LENGTH) {
                    validationMsg.style.display = "block";
                    charCounter.classList.add("error");
                } else {
                    validationMsg.style.display = "none";
                }
            }
        });
    }

    function showErrorMessage(message) {
        errorOutput.textContent = message;
        errorOutput.style.opacity = "1";

        if (errorOutput.fadeTimeout) {
            clearTimeout(errorOutput.fadeTimeout);
        }

        errorOutput.fadeTimeout = setTimeout(() => {
            errorOutput.style.transition = "opacity 1s ease-out";
            errorOutput.style.opacity = "0";
        }, 3000);

        setTimeout(() => {
            errorOutput.textContent = "";
            errorOutput.style.transition = "";
        }, 4000);
    }

    // Form validation
    if (form) {
        // Create hidden input for form errors
        const formErrorsInput = document.createElement("input");
        formErrorsInput.type = "hidden";
        formErrorsInput.name = "form-errors";
        form.appendChild(formErrorsInput);

        form.addEventListener("submit", function (e) {
            let isValid = true;

            // Validate name (required)
            if (nameInput && nameInput.value.trim() === "") {
                isValid = false;
                nameInput.classList.add("invalid");

                const errorMessage = "Please enter your name";
                showErrorMessage(errorMessage);
                addFormError("name", "required", "", errorMessage);
            }

            // Validate email (required and format)
            if (emailInput) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailInput.value)) {
                    isValid = false;
                    emailInput.classList.add("invalid");

                    const errorMessage = "Please enter a valid email address";
                    showErrorMessage(errorMessage);
                    addFormError(
                        "email",
                        "invalid_format",
                        emailInput.value,
                        errorMessage
                    );
                }
            }

            // Validate comments (length)
            if (
                commentsInput &&
                (commentsInput.value.length < MIN_COMMENTS_LENGTH ||
                    commentsInput.value.length > MAX_COMMENTS_LENGTH)
            ) {
                isValid = false;
                commentsInput.classList.add("invalid");

                const errorMessage = `Please make your message between ${MIN_COMMENTS_LENGTH} and ${MAX_COMMENTS_LENGTH} characters`;
                showErrorMessage(errorMessage);
                addFormError(
                    "comments",
                    "invalid_length",
                    commentsInput.value,
                    errorMessage
                );
            }

            formErrorsInput.value = JSON.stringify(form_errors);

            if (!isValid) {
                e.preventDefault();
            }
        });

        // Reset validation on input
        form.addEventListener("reset", function () {
            // Reset form errors when form is reset
            document.querySelectorAll(".invalid").forEach((field) => {
                field.classList.remove("invalid");
            });
            form_errors = [];
            formErrorsInput.value = "[]";
        });

        form.querySelectorAll("input, textarea").forEach((field) => {
            field.addEventListener("input", function () {
                this.classList.remove("invalid");
            });
        });

        // Handle form submission via fetch API if JavaScript is enabled
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending...";

            // Collect form data
            const formData = new FormData(form);
            const formDataObj = {};
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });

            // Add timestamp
            formDataObj.timestamp = new Date().toISOString();

            // Convert to JSON
            const jsonData = JSON.stringify(formDataObj);

            // Simulate network request
            setTimeout(() => {
                // Create a response object similar to what a server would return
                const responseData = {
                    success: true,
                    message: "Form submitted successfully!",
                    data: formDataObj,
                };

                // Display the response
                displayFormResponse(responseData);

                // Reset form
                form.reset();

                // Reset button
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }, 1500);
        });
    }

    // Function to display form response
    function displayFormResponse(response) {
        // Create modal container
        const modal = document.createElement("div");
        modal.className = "response-modal";

        // Create modal content
        const modalContent = document.createElement("div");
        modalContent.className = "response-modal-content";

        // Add header
        const header = document.createElement("h3");
        header.textContent = response.success
            ? "Form Submitted Successfully!"
            : "Form Submission Error";
        modalContent.appendChild(header);

        // Add message
        const message = document.createElement("p");
        message.textContent = response.message;
        modalContent.appendChild(message);

        // Add data display
        const dataDisplay = document.createElement("pre");
        dataDisplay.className = "response-data";

        // Format the data nicely
        let formattedData;
        try {
            // Parse the data if it's a string
            const parsedData =
                typeof response.data === "string"
                    ? JSON.parse(response.data)
                    : response.data;

            // Handle form-errors specifically to ensure it's proper JSON
            if (parsedData && parsedData["form-errors"]) {
                try {
                    // If form-errors is a string that contains JSON
                    if (typeof parsedData["form-errors"] === "string") {
                        parsedData["form-errors"] = JSON.parse(
                            parsedData["form-errors"]
                        );
                    }
                } catch (e) {
                    console.error("Error parsing form-errors:", e);
                }
            }

            formattedData = JSON.stringify(parsedData, null, 2);
        } catch (error) {
            console.error("Error parsing form response:", error);
            formattedData = JSON.stringify(response.data, null, 2);
        }

        dataDisplay.textContent = formattedData;
        modalContent.appendChild(dataDisplay);

        // Add close button
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.className = "modal-close-btn";
        closeButton.addEventListener("click", () => {
            document.body.removeChild(modal);
        });
        modalContent.appendChild(closeButton);

        // Add modal to page
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add event listener to close when clicking outside
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
});
