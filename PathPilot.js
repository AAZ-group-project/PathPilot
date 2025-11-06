const main = document.getElementById("section");
const signIn = document.getElementsByClassName("signin")[0];
const logo = document.getElementsByClassName("logo")[0];
const register = document.getElementsByClassName("register")[0];
const panel = document.getElementById('panel');
const map2 = document.getElementById('map');
const dashboardBtn = document.getElementsByClassName("dashboard")[0]; // or use getElementById if you have an id
let map = null;
let layerGroup = null;

Register();



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

function showPopup(message) {
    const popup = document.getElementById("popup");
    const popupMessage = document.getElementById("popup-message");
    popupMessage.textContent = message;
    popup.classList.remove("hidden");
}

function hidePopup() {
    const popup = document.getElementById("popup");
    popup.classList.add("hidden");
}

async function submitRegister(payload) {
    try {
        const resp = await fetch(`/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const ct = resp.headers.get('content-type') || '';
        if (!resp.ok) {
            if (ct.includes('application/json')) {
                const errJson = await resp.json();
                const msg = (errJson.errors || [{ msg: errJson.error }]).map(e => e.msg).join('\n');
                throw new Error(msg || 'Registration failed');
            } else {
                const text = await resp.text();
                console.error('Non-JSON error response from server:', text);
                throw new Error('Registration failed (server error)');
            }
        }

        // success
        if (ct.includes('application/json')) {
            const data = await resp.json();
            if (data.redirect) window.location.href = data.redirect;
            else window.location.href = '/signin';
        } else {
            window.location.href = '/signin';
        }
    } catch (err) {
        console.error('Registration request failed', err);
        showPopup(err.message || 'Registration failed');
    }
}


async function submitSignIn({ email, password }) {
    try{
        const resp = await fetch(`/signin`, {
            method: 'POST',
            credentials: 'include', // important to receive session cookie
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const ct = resp.headers.get('content-type') || '';
        if (!resp.ok) {
            if (ct.includes('application/json')) {
                const errJson = await resp.json();
                throw new Error((errJson.errors && errJson.errors.map(e => e.msg).join('\n')) || errJson.error || 'Sign in failed');
            } else {
                const text = await resp.text();
                console.error('Non-JSON error response from server:', text);
                throw new Error('Sign in failed (server error)');
            }
        }

        const data = ct.includes('application/json') ? await resp.json() : null;
        if (data && data.redirect) {
            window.location.href = data.redirect;
        } else {
            window.location.href = '/dashboard';
        }
    } catch (err) {
        console.error('Sign in request failed', err);
        showPopup(err.message || 'Sign in failed');
    }
}

function mainPage(){
    map2.style.display = 'block';
    panel.innerHTML = '';

    const form = document.createElement("form");
    form.className = "entries";

    const formGroup = document.createElement("div");
    formGroup.className = "form-group";

    const locationLabel = document.createElement("label");
    locationLabel.innerText = "First Location:";
    locationLabel.className = "prompt-label";

    const locationInput = document.createElement("input");
    locationInput.type = "search";
    locationInput.className = "input-field";
    locationInput.name = "location";
    locationInput.placeholder = "Enter start location...";
    locationInput.required = true;

    const destinationLabel = document.createElement("label");
    destinationLabel.innerText = "Final Destination:";
    destinationLabel.className = "prompt-label";

    const destinationInput = document.createElement("input");
    destinationInput.type = "search";
    destinationInput.className = "input-field";
    destinationInput.name = "destination";
    destinationInput.placeholder = "Enter final destination...";
    destinationInput.required = true;

    const locationListLabel = document.createElement("label");
    locationListLabel.innerText = "All Locations:";
    locationListLabel.className = "prompt-label";

    const locationListInput = document.createElement("textarea");
    locationListInput.className ="input-field";
    locationListInput.name = "locations";
    locationListInput.placeholder = "Example:\nLondon\nManchester\nLiverpool";
    locationListInput.rows = 10;
    locationListInput.required = true;

    const submitMainButton = document.createElement("button");
    submitMainButton.innerText = "Submit";
    submitMainButton.className = "submit";
    submitMainButton.type = "submit";

    const clearButton = document.createElement("button");
    clearButton.innerText = "Clear Map";
    clearButton.className = "submit";
    clearButton.type = "button";
    clearButton.addEventListener("click", () => {
        if (layerGroup) layerGroup.clearLayers();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const places = [
            locationInput.value.trim(),
            ...locationListInput.value.split("\n")
                .map(p => p.trim())
                .filter(p => p.length > 0),
            destinationInput.value.trim()
        ].filter(p => p.length > 0);

        if (places.length < 1){
            showPopup("Enter at least 1 location")
            return;
        }
        const coordsList = [];
        for (const place of places) {
            const coords = await getCoordinates(place);
            if (coords) coordsList.push(coords);
            else console.warn(`Could not find: ${place}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // API rate limit
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

        if (window.routingControl) {
            map.removeControl(window.routingControl);
        }

        try {
            // Builds a query string of all coordinates (lon,lat pairs)
            const query = coordsList.map(c => `${c.lon},${c.lat}`).join(';');
            // Constructs the OSRM Trip API URL with start and end fixed, roundtrip disabled
            const tripUrl = `https://router.project-osrm.org/trip/v1/driving/${query}?source=first&destination=last&roundtrip=false`;
            // Send a request to OSRM Trip API
            const tripResp = await fetch(tripUrl);
            const tripData = await tripResp.json();
            // If OSRM returns a valid optimized trip
            if (tripData.code === 'Ok' && tripData.trips && tripData.trips.length > 0) {
                // Sort waypoints based on optimized order (waypoint_index)
                const reordered = tripData.waypoints
                    .sort((a, b) => a.waypoint_index - b.waypoint_index)
                    // Convert each waypoint to {lat, lon, display_name} format
                    .map(wp => ({
                        lat: wp.location[1],
                        lon: wp.location[0],
                        display_name: wp.name || ''
                    }));
                coordsList.length = 0;
                coordsList.push(...reordered);
            } else {
                console.warn('Trip optimization failed, using entered order:', tripData);
            }
        } catch (err) {
            console.error('Trip optimization error:', err);
        }

        window.routingControl = L.Routing.control({
            waypoints: coordsList.map(c => L.latLng(c.lat, c.lon)),
            lineOptions: {
                styles: [{ color: 'blue', opacity: 0.6, weight: 4 }]
            },
            routeWhileDragging: false,
            createMarker: function(i, wp){
                return L.marker(wp.latLng).bindPopup(`${i + 1}. ${coordsList[i].display_name}`);
            }
        }).addTo(map);

        setTimeout(() => map.invalidateSize(), 0);
        layerGroup.clearLayers();

        coordsList.forEach((c, i) => {
            L.marker([c.lat, c.lon])
            .bindPopup(`${i + 1}. ${c.display_name}`)
            .addTo(layerGroup);
        });
        // Fit map bounds
        map.fitBounds(layerGroup.getBounds(), { padding: [30, 30] });
    });
    formGroup.append(locationLabel, locationInput, locationListLabel, locationListInput ,destinationLabel, destinationInput,submitMainButton, clearButton);
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

        // show server flash message if present
    if (window.flashMessage) {
        const flashDiv = document.createElement('div');
        flashDiv.className = 'flash-message';
        flashDiv.innerText = window.flashMessage;
        // clear global so it doesn't persist on navigation
        window.flashMessage = '';
        signBox.appendChild(flashDiv);
    }

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

    // sign-in handler
    submitButton.addEventListener('click', async () => {
        const payload = {
            email: emailPrompt.value,
            password: passwordPrompt.value
        };

        try {
            const resp = await submitSignIn(payload);
            const data = await resp.json();

            if (!resp.ok) {
                const msgs = (data.errors || []).map(e => `• ${e.msg}`).join('\n') || data.error || 'Sign in failed';
                passwordPrompt.value = '';
                showPopup(msgs);
                return;
            }

            // successful sign-in: redirect to dashboard
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                // fallback: reload root
                window.location.href = '/';
            }
        } catch (err) {
            console.error('Sign in failed', err);
            showPopup('Sign in failed');
        }
    });

    signBox.appendChild(heading);
    signBox.appendChild(emailPrompt);
    signBox.appendChild(passwordPrompt);
    signBox.appendChild(submitButton);
    panel.appendChild(signBox);
}

// register function //
function Register() {
    main.classList.add("auth-mode");
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
            const resp = await submitRegister(payload);
            const data = await resp.json();

            if (!resp.ok) {
                const msgs = (data.errors || []).map(e => `• ${e.msg}`).join('\n');
                // clear password inputs after failure to register
                passwordPrompt.value = '';
                confirmPasswordPrompt.value = '';
                //This is where you can show the error messages to the user (can you make it so it displays on the actual website instead of an alert)
                showPopup(msgs || 'Registration error');
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
            if (data.redirect) window.location.href = 'signin'; //redirects to the signin page (its meant to do that but for some reason it gets redirected to the dashboard page)
        } catch (err) {
            console.error('Registration failed', err);
            showPopup('Registration Failed!')
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

dashboardBtn.addEventListener("click", (e) => {
    e.preventDefault();
    main.classList.remove("auth-mode");
    mainPage();
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("popup-close").addEventListener("click", hidePopup);
});
