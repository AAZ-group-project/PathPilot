const main = document.getElementById("section");
const signIn = document.getElementsByClassName("signin")[0];
const logo = document.getElementsByClassName("logo")[0];

mainPage();

function mainPage(){
    main.innerHTML = '';
    const form = document.createElement("form");
    form.className = "entries";

    const formGroup = document.createElement("div");
    formGroup.className = "form-group";

    const locationLabel = document.createElement("label");
    locationLabel.innerText = "Location:";
    locationLabel.className = "prompt-label";

    const locationInput = document.createElement("input");
    locationInput.type = "search";
    locationInput.className = "input-field";
    locationInput.name = "location";
    locationInput.placeholder = "Enter location...";
    locationInput.required = true;

    const destinationLabel = document.createElement("label");
    destinationLabel.innerText = "Destination:";
    destinationLabel.className = "prompt-label";

    const destinationInput = document.createElement("input");
    destinationInput.type = "search";
    destinationInput.className = "input-field";
    destinationInput.name = "destination";
    destinationInput.placeholder = "Enter destination...";
    destinationInput.required = true;

    const submitMainButton = document.createElement("a");
    submitMainButton.innerText = "Submit";
    submitMainButton.className = "submit";
    submitMainButton.href = "#";

    formGroup.appendChild(locationLabel);
    formGroup.appendChild(locationInput);
    formGroup.appendChild(destinationLabel);
    formGroup.appendChild(destinationInput);
    formGroup.appendChild(submitMainButton);
    form.appendChild(formGroup);
    main.appendChild(form);
}

// UI for sign in menu
function signInMenu(){
    main.innerHTML = '';
    const heading = document.createElement('h2');
    heading.innerText = "Sign In";
    heading.setAttribute('id', 'heading');

    const signBox = document.createElement('div');
    signBox.setAttribute('class','box');

    const emailPrompt = document.createElement('input');
    emailPrompt.type = "email";
    emailPrompt.placeholder = "Enter your email...";
    emailPrompt.className = "input-field";

    const passwordPrompt = document.createElement('input');
    passwordPrompt.type = "password";
    passwordPrompt.placeholder = "Enter your password...";
    passwordPrompt.className = "input-field";

    const submitButton = document.createElement('button');
    submitButton.innerText = "Sign In";
    submitButton.className = "submit";

    signBox.appendChild(heading);
    signBox.appendChild(emailPrompt);
    signBox.appendChild(passwordPrompt);
    signBox.appendChild(submitButton);
    main.appendChild(signBox);
}

signIn.addEventListener("click", (e) => {
    e.preventDefault();
    signInMenu();
});

logo.addEventListener("click", (e) => {
    e.preventDefault();
    mainPage();
});