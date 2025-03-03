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
            timestamp: new Date().toISOString(),
            field: fieldName,
            type: errorType,
            value: invalidValue,
            message: message,
        });
    }

    const patterns = {
        name: /^[A-Za-z\s\-']+$/,
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        emailChar: /[a-zA-Z0-9.@_%+\-]/,
    };

    function handleInput(event) {
        const input = event.target;
        const fieldName = input.id;

        if (fieldName === "comments") {
            handleCommentsInput(input);
            return;
        }

        const lastChar = input.value.slice(-1);
        const validationPattern =
            fieldName === "email" ? patterns.emailChar : patterns[fieldName];

        if (lastChar && !validationPattern.test(lastChar)) {
            input.value = input.value.slice(0, -1);
            input.classList.add("flash-error");
            setTimeout(() => {
                input.classList.remove("flash-error");
            }, 500);

            const fieldLabel =
                fieldName === "email"
                    ? "email (only letters, numbers, and . @ _ % + - are allowed)"
                    : fieldName;
            const errorMessage = `Invalid character entered in ${fieldLabel} field`;
            showErrorMessage(errorMessage);

            // Track the invalid character error
            addFormError(
                fieldName,
                "invalid_character",
                lastChar,
                errorMessage
            );
        }
    }

    function handleCommentsInput(textarea) {
        const currentLength = textarea.value.length;
        const validationMessage =
            textarea.nextElementSibling.nextElementSibling;

        // Update character count
        charCount.textContent = currentLength;

        // Reset classes
        charCounter.classList.remove("warning", "error");
        textarea.classList.remove("warning", "error");

        validationMessage.style.display = "none";

        // Check if over max length
        if (currentLength > MAX_COMMENTS_LENGTH) {
            textarea.value = textarea.value.slice(0, MAX_COMMENTS_LENGTH);

            charCount.textContent = MAX_COMMENTS_LENGTH;

            charCounter.classList.add("error");
            textarea.classList.add("error");

            validationMessage.style.display = "block";

            showErrorMessage(
                `Character limit exceeded. Maximum ${MAX_COMMENTS_LENGTH} characters allowed.`
            );

            addFormError(
                "comments",
                "max_length_exceeded",
                currentLength,
                `Character limit exceeded. Maximum ${MAX_COMMENTS_LENGTH} characters allowed.`
            );

            return;
        }

        if (currentLength >= MAX_COMMENTS_LENGTH - WARNING_THRESHOLD) {
            charCounter.classList.add("warning");
            textarea.classList.add("warning");
        }

        if (currentLength > 0 && currentLength < MIN_COMMENTS_LENGTH) {
            charCounter.classList.add("error");
            validationMessage.style.display = "block";
        }
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

            setTimeout(() => {
                errorOutput.textContent = "";
                errorOutput.style.transition = "";
            }, 1000);
        }, 3000);
    }

    handleCommentsInput(commentsInput);

    nameInput.addEventListener("input", handleInput);
    emailInput.addEventListener("input", handleInput);
    commentsInput.addEventListener("input", handleInput);

    // Create hidden input for form errors
    const formErrorsInput = document.createElement("input");
    formErrorsInput.type = "hidden";
    formErrorsInput.name = "form-errors";
    form.appendChild(formErrorsInput);

    form.addEventListener("submit", (event) => {
        let isValid = true;

        // Name validation
        if (
            !nameInput.value ||
            !patterns.name.test(nameInput.value) ||
            nameInput.value.length < 2 ||
            nameInput.value.length > 50
        ) {
            isValid = false;
            const errorMessage =
                "Please enter a valid name (2-50 characters, letters, spaces, hyphens, and apostrophes only)";
            showErrorMessage(errorMessage);
            addFormError(
                "name",
                "invalid_format",
                nameInput.value,
                errorMessage
            );
        }

        // Email validation
        if (!emailInput.value || !patterns.email.test(emailInput.value)) {
            isValid = false;
            const errorMessage = "Please enter a valid email address";
            showErrorMessage(errorMessage);
            addFormError(
                "email",
                "invalid_format",
                emailInput.value,
                errorMessage
            );
        }

        // Comments validation
        const commentsLength = commentsInput.value.length;
        if (
            !commentsInput.value ||
            commentsLength < MIN_COMMENTS_LENGTH ||
            commentsLength > MAX_COMMENTS_LENGTH
        ) {
            isValid = false;
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
            event.preventDefault();
        }
    });

    // Reset form errors when form is reset
    form.addEventListener("reset", () => {
        form_errors = [];
        formErrorsInput.value = "[]";
    });

    function parseFormResponse(responseString) {
        try {
            const parsedData = {};

            const lines = responseString.split("\n");

            let currentKey = "";
            let currentValue = "";
            let isCollectingValue = false;

            for (let line of lines) {
                line = line.trim();

                if (!line) continue;

                if (line.includes(":") && !isCollectingValue) {
                    const parts = line.split(":");
                    currentKey = parts[0].trim();

                    currentValue = parts.slice(1).join(":").trim();
                    isCollectingValue = true;

                    if (
                        !currentValue.startsWith('"[') &&
                        !currentValue.startsWith("{")
                    ) {
                        parsedData[currentKey] = currentValue.replace(
                            /^"(.*)"$/,
                            "$1"
                        );
                        isCollectingValue = false;
                    }
                } else if (isCollectingValue) {
                    currentValue += " " + line;

                    if (line.endsWith('"') || line.endsWith("}")) {
                        try {
                            if (
                                (currentValue.startsWith('"[') &&
                                    currentValue.endsWith(']"')) ||
                                (currentValue.startsWith("{") &&
                                    currentValue.endsWith("}"))
                            ) {
                                if (
                                    currentValue.startsWith('"') &&
                                    currentValue.endsWith('"')
                                ) {
                                    currentValue = currentValue.substring(
                                        1,
                                        currentValue.length - 1
                                    );
                                }
                                currentValue = currentValue.replace(
                                    /\\"/g,
                                    '"'
                                );

                                parsedData[currentKey] =
                                    JSON.parse(currentValue);
                            } else {
                                parsedData[currentKey] = currentValue.replace(
                                    /^"(.*)"$/,
                                    "$1"
                                );
                            }
                        } catch (e) {
                            parsedData[currentKey] = currentValue;
                        }

                        isCollectingValue = false;
                    }
                }
            }

            return parsedData;
        } catch (error) {
            console.error("Error parsing form response:", error);
            return null;
        }
    }

    // Function to convert form response to JSON
    function convertFormResponseToJSON(responseString) {
        const parsedData = parseFormResponse(responseString);

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

        return parsedData;
    }
});
