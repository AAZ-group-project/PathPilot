const main = document.getElementById("section");
const signIn = document.getElementsByClassName("signin")[0];
const logo = document.getElementsByClassName("logo")[0];
const register = document.getElementsByClassName("register")[0];
const section = document.getElementById('section');
const panel = document.getElementById('panel');
const map2 = document.getElementById('map');
const dashboardBtn = document.getElementsByClassName("dashboard")[0]; // or use getElementById if you have an id
let map = null;
let layerGroup = null;

mainPage();

async function getCoordinates(place){
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=gb&limit=1&q=${encodeURIComponent(place)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.length){
        return null;
    }
    return {
        lat: data[0].lat, lon: data[0].lon, display_name: data[0].display_name
    };
}



function mainPage(){
    map2.style.display = 'block';
    panel.innerHTML = '';

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

    const submitMainButton = document.createElement("button");
    submitMainButton.innerText = "Submit";
    submitMainButton.className = "submit";
    submitMainButton.type = "submit";

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const startCoords = await getCoordinates(locationInput.value);
        const endCoords = await getCoordinates(destinationInput.value);
        if (!startCoords || !endCoords){
            alert('One of the locations could not be found.');
            return;
        }
        const mapContainer = document.getElementById('map');
        mapContainer.style.display = 'block';
        if (!map) {
            map = L.map('map');
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            layerGroup = L.layerGroup().addTo(map);
        }
        setTimeout(() => map.invalidateSize(), 0);
        layerGroup.clearLayers();
        const m1 = L.marker([startCoords.lat, startCoords.lon]).bindPopup(`Start: ${startCoords.display_name}`).openPopup();
        const m2 = L.marker([endCoords.lat, endCoords.lon]).bindPopup(`Destination: ${endCoords.display_name}`).openPopup();
        layerGroup.addLayer(m1).addLayer(m2);
        const bounds = L.latLngBounds(
            [startCoords.lat, startCoords.lon],
            [endCoords.lat, endCoords.lon]
        );
        map.fitBounds(bounds, {padding: [30, 30]});
    });
    formGroup.append(locationLabel, locationInput, destinationLabel, destinationInput, submitMainButton);
    form.appendChild(formGroup);
    panel.appendChild(form);
}

// UI for sign in menu
function signInMenu(){
    panel.innerHTML = '';
    map2.style.display = 'none';
    
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
    panel.appendChild(signBox);
}

// register function //
function Register() {
    main.innerHTML = '';
    panel.innerHTML = '';
    map2.style.display = 'none';

    const heading = document.createElement('h2');
    heading.innerText = "Register";
    heading.setAttribute('id', 'heading');

    const signBox = document.createElement('div');
    signBox.setAttribute('class', 'box');

    const fnamePrompt = document.createElement('input');
    fnamePrompt.type = "text";
    fnamePrompt.placeholder = "Enter your First name...";
    fnamePrompt.className = "input-field";

    const snamePrompt = document.createElement('input');
    snamePrompt.type = "text";
    snamePrompt.placeholder = "Enter your Surname...";
    snamePrompt.className = "input-field";

    const emailPrompt = document.createElement('input');
    emailPrompt.type = "email";
    emailPrompt.placeholder = "Enter your email...";
    emailPrompt.className = "input-field";

    const passwordPrompt = document.createElement('input');
    passwordPrompt.type = "password";
    passwordPrompt.placeholder = "Enter your password...";
    passwordPrompt.className = "input-field";

    const confirmPasswordPrompt = document.createElement('input'); // added
    confirmPasswordPrompt.type = "password";
    confirmPasswordPrompt.placeholder = "Re-enter your password...";
    confirmPasswordPrompt.className = "input-field";

    const submitButton = document.createElement('button');
    submitButton.innerText = "Register";
    submitButton.className = "submit";
    submitButton.type = "button";

    // send data to backend when clicking Register
    submitButton.addEventListener('click', async () => {
        const payload = {
            fname: fnamePrompt.value,
            sname: snamePrompt.value,
            email: emailPrompt.value,
            password: passwordPrompt.value,
            confirmPassword: confirmPasswordPrompt.value
        };

        try {
            const resp = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();


            if (!resp.ok) {
                const msgs = (data.errors || []).map(e => e.msg).join('\n');
                // clear inputs after failure to register
                fnamePrompt.value = '';
                snamePrompt.value = '';
                emailPrompt.value = '';
                passwordPrompt.value = '';
                confirmPasswordPrompt.value = '';
                //This is where you can show the error messages to the user (can you make it so it displays on the actual website instead of an alert)
                alert(msgs || 'Registration error'); //AAYYANN DO THISSSSS
                console.log('Registration errors from server:', data.errors);
                return;
            }

            // clears input fields upon successful registration
            fnamePrompt.value = '';
            snamePrompt.value = '';
            emailPrompt.value = '';
            passwordPrompt.value = '';
            confirmPasswordPrompt.value = '';
            console.log('Server response:', data);
            alert('Registration sent');
        } catch (err) {
            console.error('Registration failed', err);
            alert('Registration failed');
        }
    });

    signBox.appendChild(heading);
    signBox.appendChild(fnamePrompt);
    signBox.appendChild(snamePrompt);
    signBox.appendChild(emailPrompt);
    signBox.appendChild(passwordPrompt);
    signBox.appendChild(confirmPasswordPrompt);
    signBox.appendChild(submitButton);

    main.appendChild(signBox);
}

register.addEventListener("click", function(e) {
    e.preventDefault();
    section.classList.add("auth-mode");
    Register();
});

signIn.addEventListener("click", (e) => {
    e.preventDefault();
    section.classList.add("auth-mode");
    signInMenu();
});

dashboardBtn.addEventListener("click", (e) => {
    e.preventDefault();
    section.classList.remove("auth-mode");
    mainPage();
});
