// MOCK DATA for Categories
const complaintCategories = {
    electricity: [
        "No Supply / Frequent Tripping", "High Bill Amount", "Incorrect Meter Reading",
        "Meter Not Working", "Street Light Complaint", "Power Theft (Anonymous)"
    ],
    water: [
        "Low Water Pressure", "No Water Supply", "Dirty Water Supply",
        "Sewer Overflow", "Pipeline Leakage"
    ],
    gas: [
        "Gas Leakage (Emergency)", "Low Pressure", "Meter Not Working",
        "Incorrect Bill", "New Connection Delay"
    ]
};

const serviceOptions = {
    elec: [
        "New Connection", "Load Enhancement", "Name Change", "Meter Replacement", "Disconnection Request"
    ],
    water: [
        "New Water Connection", "Tanker Request (DJB)", "Borewell Permission", "Rainwater Harvesting"
    ],
    gas: [
        "New PNG Connection", "Safety Inspection", "Name Transfer", "Meter Relocation"
    ]
};

// TOGGLE MODE (Complaint vs Service)
function toggleServiceMode(mode) {
    // Update Tab UI
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[onclick="toggleServiceMode('${mode}')"]`).classList.add('active');

    // Show/Hide Sections
    if (mode === 'complaint') {
        document.getElementById('complaint-section').style.display = 'block';
        document.getElementById('service-section').style.display = 'none';
    } else {
        document.getElementById('complaint-section').style.display = 'none';
        document.getElementById('service-section').style.display = 'block';
        // Load default services
        filterServices('elec');
    }
}

// UPDATE CATEGORIES BASED ON UTILITY
function updateCategories() {
    const utility = document.getElementById('utilitySelect').value;
    const catSelect = document.getElementById('categorySelect');
    const questions = document.getElementById('contextQuestions');
    const sla = document.getElementById('slaPreview');
    const identifierGroup = document.querySelector('.identifier-group');
    const ideLabel = document.getElementById('identifierLabel');

    // Reset
    catSelect.innerHTML = '<option>-- Select Category --</option>';
    catSelect.disabled = true;
    questions.style.display = 'none';
    sla.style.display = 'none';
    identifierGroup.style.display = 'none';

    if (utility && complaintCategories[utility]) {
        // Populate Categories
        complaintCategories[utility].forEach(cat => {
            const option = document.createElement('option');
            option.text = cat;
            catSelect.add(option);
        });
        catSelect.disabled = false;

        // Show Identifier Field
        identifierGroup.style.display = 'block';
        if (utility === 'electricity') ideLabel.innerText = "CA Number / KNO";
        else if (utility === 'water') ideLabel.innerText = "Consumer ID (K No)";
        else if (utility === 'gas') ideLabel.innerText = "BP Number";
    }
}

// SHOW QUESTIONS & SLA ON CATEGORY CHANGE
document.getElementById('categorySelect').addEventListener('change', function () {
    if (this.value !== '-- Select Category --') {
        document.getElementById('contextQuestions').style.display = 'block';

        // Mock SLA logic
        const slaTime = document.getElementById('slaTime');
        const val = this.value.toLowerCase();

        document.getElementById('slaPreview').style.display = 'flex';

        if (val.includes('theft') || val.includes('leak') || val.includes('supply')) {
            slaTime.innerText = "4 - 24 Hours (Urgent)";
            slaTime.style.color = "#C53030";
        } else if (val.includes('bill')) {
            slaTime.innerText = "7 Working Days";
            slaTime.style.color = "#2B6CB0";
        } else {
            slaTime.innerText = "3 - 5 Working Days";
            slaTime.style.color = "#2B6CB0";
        }
    }
});

// SERVICE FILTER LOGIC
function filterServices(type) {
    // Update Buttons
    document.querySelectorAll('.svc-type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[onclick="filterServices('${type}')"]`).classList.add('active');

    const container = document.getElementById('serviceOptions');
    container.innerHTML = '';

    if (serviceOptions[type]) {
        serviceOptions[type].forEach(svc => {
            container.innerHTML += `
                <div class="svc-card">
                    <h4>${svc}</h4>
                    <button class="btn-small-primary">Apply Now</button>
                </div>
            `;
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Auto-select first tab
    toggleServiceMode('complaint');
});
