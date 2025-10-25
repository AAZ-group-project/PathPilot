const main = document.getElementById("section");
const panel = document.getElementById('panel');
const map2 = document.getElementById('map');

const signIn = document.getElementsByClassName("signin")[0];
const register = document.getElementsByClassName("register")[0];
const dashboardButton = document.querySelector(".dashboard");

let map = null;
let layerGroup = null;

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

function resetMap() {
    if (map){
        map.remove();
        map = null;
    }
    map2.style.display = 'none';
}

function mainPage(){
    main.classList.remove("auth-mode");
    panel.innerHTML = ""; 
    resetMap();
    map2.style.display = "block";

    const form = document.createElement("form");
    form.className = "entries";
    form.innerHTML=`
        <label class="prompt-label">Location:</label>
        <input type="text" class="input-field" id="start">
        <label class="prompt-label">Destination:</label>
        <input type="text" class="input-field" id="end">
        <button class="submit">Show Route</button>
    `;
    panel.appendChild(form);


    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const startValue = document.getElementById("start").value;
        const endValue = document.getElementById("end").value;

        const startCoords = await getCoordinates(startValue);
        const endCoords = await getCoordinates(endValue);

        if (!startCoords || !endCoords){
            alert('One of the locations could not be found.');
            return;
        }

        map2.style.display = "block";
        if (!map) {
            map = L.map('map').setView([54.8, -4.6], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            layerGroup = L.layerGroup().addTo(map);
        }
        setTimeout(() => map.invalidateSize(), 200);
        layerGroup.clearLayers();

        L.marker([startCoords.lat, startCoords.lon]).addTo(layerGroup).bindPopup(`Start: ${startCoords.display_name}`).openPopup();
        L.marker([endCoords.lat, endCoords.lon]).addTo(layerGroup).bindPopup(`Destination: ${endCoords.display_name}`);

        map.fitBounds([[startCoords.lat, startCoords.lon], [endCoords.lat, endCoords.lon]], { padding: [50, 50] });
    });
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
    panel.innerHTML = '';
    map2.style.display = 'none';
    main.classList.add("auth-mode");

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

    panel.appendChild(signBox);
}

dashboardButton.addEventListener("click", function(e) {
    e.preventDefault();
    main.classList.remove("auth-mode");
    mainPage();
});

register.addEventListener("click", function(e) {
    e.preventDefault();
    main.classList.add("auth-mode");
    Register();
});

signIn.addEventListener("click", (e) => {
    e.preventDefault();
    main.classList.add("auth-mode");
    signInMenu();
});

mainPage();