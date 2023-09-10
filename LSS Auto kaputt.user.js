// ==UserScript==
// @name         LSS Auto kaputt
// @namespace    www.leitstellenspiel.de
// @version      1.4
// @description  Simuliert den Ausfall von Fahrzeugen aus technischen Gründen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Funktion, um eine zufällige Zahl zwischen min und max zu generieren
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Funktion, um ein Fahrzeug außer Dienst zu setzen
    function setVehicleOutOfService(vehicleId) {
        fetch(`https://www.leitstellenspiel.de/vehicles/${vehicleId}/set_fms/6`, {
            method: 'GET'
        }).then(response => {
            if (response.ok) {
                console.log(`Das Fahrzeug ${vehicleId} ist außer Dienst.`);
            } else {
                console.error(`Fehler beim Setzen des Fahrzeugs ${vehicleId} außer Dienst.`);
            }
        });
    }

    // Funktion, um ein Fahrzeug wieder einsatzbereit zu setzen
    function setVehicleInService(vehicleId, caption) {
        fetch(`https://www.leitstellenspiel.de/vehicles/${vehicleId}/set_fms/2`, {
            method: 'GET'
        }).then(response => {
            if (response.ok) {
                console.log(`Das Fahrzeug ${vehicleId} ist wieder einsatzbereit.`);
            } else {
                console.error(`Fehler beim Setzen des Fahrzeugs ${vehicleId} wieder einsatzbereit.`);
            }
        });
    }

    // Funktion zum Ausblenden der Meldung nach 5 Sekunden
    function hideAlert() {
        const alertElement = document.querySelector('.alert-dismissible');
        if (alertElement) {
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 5000);
        }
    }

function calculateInterval(vehicleCount) {
    const minTime = Math.pow(1.666649e-07 * vehicleCount, -0.307978);
    const maxTime = minTime + (minTime * 0.5);
    // Umrechnung von Millisekunden in Minuten
    return getRandomInt(minTime, maxTime) / 0.001 * 60;
}

    // Hauptfunktion, um den Prozess zu steuern
    function simulateVehicleFailure() {
        // Fahrzeuganzahl aus der API abrufen
        fetch('https://www.leitstellenspiel.de/api/vehicles')
            .then(response => response.json())
            .then(data => {
                const vehicleCount = data.length;

                // Berechnen Sie das Intervall basierend auf der Fahrzeuganzahl
                const interval = calculateInterval(vehicleCount);

                // Prüfen, ob bereits ein Fahrzeug außer Dienst ist
                const storedVehicle = localStorage.getItem('outOfServiceVehicle');
                if (storedVehicle) {
                    const { vehicleId, timestamp, caption } = JSON.parse(storedVehicle);
                    const currentTime = new Date().getTime();
                    if (currentTime - timestamp >= 600000) { // 10 Minuten Reparaturzeit
                        // Fahrzeug ist seit mindestens 10 Minuten außer Dienst, wieder einsatzbereit setzen
                        setVehicleInService(vehicleId, caption);
                        localStorage.removeItem('outOfServiceVehicle');
                    }
                } else {
                    // Fahrzeug auswählen und außer Dienst setzen
                    const vehiclesWithFMS2 = data.filter(vehicle => vehicle.fms_real === 2);
                    if (vehiclesWithFMS2.length > 0) {
                        const randomIndex = getRandomInt(0, vehiclesWithFMS2.length - 1);
                        const selectedVehicle = vehiclesWithFMS2[randomIndex];
                        const { id, caption } = selectedVehicle;
                        setVehicleOutOfService(id);
                        localStorage.setItem('outOfServiceVehicle', JSON.stringify({ vehicleId: id, timestamp: new Date().getTime(), caption }));
                        // Meldung anzeigen und dann ausblenden
                        const alertText = `Das Fahrzeug "${caption}" ist wegen Reparaturarbeiten außer Dienst.`;
                        alert(alertText);
                        hideAlert();
                    }
                }

                // Simulation in festgelegtem Intervall ausführen
    setTimeout(simulateVehicleFailure, calculateInterval(vehicleCount));
            });
    }

    // Skript starten
    simulateVehicleFailure();
})();
