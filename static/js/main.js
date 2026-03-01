document.addEventListener('DOMContentLoaded', () => {
    console.log('Delhi Civic Utilities Portal Loaded');

    // Accessibility Toggle (Simple Font Resize for prototype)
    const accessBtn = document.querySelector('button[aria-label="Accessibility Settings"]');
    if (accessBtn) {
        accessBtn.addEventListener('click', () => {
            document.body.classList.toggle('high-contrast');
            if (document.body.style.fontSize === '120%') {
                document.body.style.fontSize = '';
            } else {
                document.body.style.fontSize = '120%';
            }
        });
    }

    // Language Dropdown - Multilingual support for all Indian languages
    const langDropdownBtn = document.getElementById('langDropdownBtn');
    const langDropdownMenu = document.getElementById('langDropdownMenu');
    const langOptions = document.querySelectorAll('.lang-option');

    if (langDropdownBtn && langDropdownMenu) {
        // Toggle dropdown on button click
        langDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdownMenu.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            langDropdownMenu.classList.remove('show');
        });

        // Prevent dropdown from closing when clicking inside
        langDropdownMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Handle language selection
        langOptions.forEach(option => {
            option.addEventListener('click', async (e) => {
                e.preventDefault();
                const newLang = option.getAttribute('data-lang');
                
                try {
                    const response = await fetch(`/set_language/${newLang}`);
                    const data = await response.json();
                    
                    if (data.status === 'success') {
                        // Reload page to apply new language
                        window.location.reload();
                    }
                } catch (error) {
                    console.error('Error changing language:', error);
                }
            });
        });
    }

    // Notification Stub
    const notifBtn = document.querySelector('button[aria-label="Notifications"]');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            openPolicyModal('general');
        });
    }

    // Auto-open Welcome/Update Modal on first load (Simulated)
    if (!sessionStorage.getItem('seenWelcome')) {
        setTimeout(() => {
            openPolicyModal('general');
            sessionStorage.setItem('seenWelcome', 'true');
        }, 1500);
    }
});

// --- MODAL LOGIC ---
const policies = {
    solar: {
        icon: '☀️',
        title: 'Delhi Solar Policy 2026',
        body: 'Install rooftop solar panels and get **zero electricity bills**! The new policy offers a generation-based incentive (GBI) of ₹3 per unit for residential consumers. </br><br> <a href="#">Check Eligibility & Apply</a>'
    },
    water: {
        icon: '💧',
        title: 'Water Bill Waiver Scheme',
        body: 'Did you know? Domestic consumers with functioning meters consuming up to **20,000 liters (20 KL)** per month get a 100% subsidy on water charges. <br><br> Ensure your meter is functional to avail this benefit.'
    },
    gas: {
        icon: '🔥',
        title: 'Mandatory Safety Check',
        body: 'IGL advises a mandatory safety inspection of your PNG installation every 5 years. <br><br> Ensure your rubber tubes are replaced with verified Suraksha hoses. <a href="#">Schedule Inspection</a>'
    },
    general: {
        icon: '📢',
        title: 'Recent Civic Updates',
        body: '<ul><li>• <strong>Electricity:</strong> Winter subsidy applications are now open.</li><li>• <strong>Water:</strong> New pipeline work in South Delhi creates temporary pressure drops.</li><li>• <strong>Services:</strong> "Virtual Customer Care" is now live for all disputes.</li></ul>'
    },
    // VENDOR DETAILS
    brpl: {
        icon: '⚡',
        title: 'About BRPL (BSES Rajdhani)',
        body: '<strong>BSES Rajdhani Power Limited</strong> is a joint venture between Reliance Infrastructure Limited and the Govt of NCT of Delhi. <br><br>Serving over 2.4 million customers in South and West Delhi since 2002. <br><br><strong>Helpline:</strong> 19123'
    },
    igl: {
        icon: '🔥',
        title: 'About IGL (Indraprastha Gas)',
        body: '<strong>Indraprastha Gas Limited</strong> is a joint venture of GAIL (India) Ltd., BPCL, and the Govt of NCT of Delhi. <br><br>IGL supplies PNG to over 20 lakh households and CNG to over 12 lakh vehicles in the region. <br><br><strong>Emergency:</strong> 19122'
    },
    djb: {
        icon: '💧',
        title: 'About Delhi Jal Board',
        body: '<strong>Delhi Jal Board</strong> is responsible for the production and distribution of potable water in the National Capital Territory of Delhi, as well as treatment and disposal of wastewater. <br><br><strong>Complaint Center:</strong> 1916'
    }
};

function openPolicyModal(type) {
    const modal = document.getElementById('policyModal');
    const content = policies[type];
    const bodyContainer = document.getElementById('modalBody');

    if (content) {
        bodyContainer.innerHTML = `
            <div class="modal-header">
                <div class="modal-icon">${content.icon}</div>
                <h2 class="modal-title">${content.title}</h2>
            </div>
            <div class="modal-body">
                <p>${content.body}</p>
            </div>
            <div class="modal-action">
                <button class="btn-primary" onclick="closePolicyModal()">Close</button>
            </div>
        `;
        modal.style.display = 'flex';
    }
}

// Re-use same logic for Vendors for now
function openVendorModal(type) {
    openPolicyModal(type);
}

function closePolicyModal() {
    document.getElementById('policyModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('policyModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
