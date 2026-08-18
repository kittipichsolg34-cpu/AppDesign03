// ====================
// Get HTML Elements
// ====================

const SUPABASE_URL = "https://flapybolwvcrcqmpdakp.supabase.co/";
const SUPABASE_KEY = "sb_publishable_x3_FQqHiPd6ogYaanFf_4w_i387gZAs";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const incomeInput = document.getElementById("income");
const targetInput = document.getElementById("target");
const monthsInput = document.getElementById("months");

const calculateBtn = document.getElementById("calculateBtn");
const saveBtn = document.getElementById("saveBtn");

const resultBox = document.getElementById("result");
const resultText = document.getElementById("resultText");

const savedStatus = document.getElementById("savedStatus");
const savedList = document.getElementById("savedList");

const calculatorTab = document.getElementById("calculatorTab");
const savedTab = document.getElementById("savedTab");

const calculatorSection = document.getElementById("calculatorSection");
const savedSection = document.getElementById("savedSection");

const clearAllBtn = document.getElementById("clearAllBtn");



// ====================
// Get Saved Data
// ====================

function getSavedData() {

    const data = localStorage.getItem("financialData");

    if (!data) {
        return [];
    }

    try {

        const parsedData = JSON.parse(data);

        // Make sure saved data is an array
        if (Array.isArray(parsedData)) {
            return parsedData;
        }

        // Convert old single saved object into an array
        return [parsedData];

    } catch (error) {

        console.log("Error reading saved data:", error);

        return [];

    }
}


// ====================
// Calculate Savings
// ====================

function calculateSavings() {

    const income = Number(incomeInput.value);
    const target = Number(targetInput.value);
    const months = Number(monthsInput.value);


    // Check input
    if (income <= 0 || target <= 0) {

        resultText.textContent =
            "Please enter valid information.";

        resultBox.className = "result-box";

        return;
    }


    // Calculate savings
    const monthlySaving = target / months;
    const dailySaving = monthlySaving / 30;

    const savingPercentage =
        (monthlySaving / income) * 100;


    let message = "";


    // Check difficulty
    if (savingPercentage <= 10) {

        resultBox.className = "result-box easy";

        message =
            "Easy goal! You should be able to reach this goal comfortably.";

    } else if (savingPercentage <= 30) {

        resultBox.className = "result-box medium";

        message =
            "Moderate goal. You need to manage your expenses carefully.";

    } else {

        resultBox.className = "result-box hard";

        message =
            "Difficult goal. Consider reducing your expenses or increasing your income to make this goal more achievable.";

    }


    // Show result
    resultText.innerHTML = `

        Monthly Income:
        <strong>$${income.toFixed(2)}</strong>
        <br>

        Savings Target:
        <strong>$${target.toFixed(2)}</strong>
        <br>

        Target Period:
        <strong>${months} month(s)</strong>

        <br><br>

        You need to save:
        <strong>$${monthlySaving.toFixed(2)} per month</strong>

        <br>

        Or approximately:
        <strong>$${dailySaving.toFixed(2)} per day</strong>

        <br><br>

        <strong>${message}</strong>

    `;
}


// ====================
// Save Data
// ====================

async function saveData() {

    const income = Number(incomeInput.value);
    const target = Number(targetInput.value);
    const months = Number(monthsInput.value);

    if (income <= 0 || target <= 0) {

        savedStatus.textContent =
            "Please enter valid data before saving.";

        return;
    }

    const newData = {
        income: income,
        target: target,
        months: months,
    };

    const { error } = await supabaseClient
        .from("finance_logs")
        .insert([newData]);

    if (error) {

        console.error("Save error:", error);

        savedStatus.textContent =
            "Failed to save data to cloud.";

        return;
    }

    savedStatus.textContent =
        "Data saved to cloud successfully.";

    displaySavedData();
}


// ====================
// Display Saved Data
// ====================

async function displaySavedData() {

    const { data, error } = await supabaseClient
        .from("finance_logs")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Load error:", error);

        savedList.innerHTML = `
            <p class="no-data">
                Unable to load saved data.
            </p>
        `;

        return;
    }

    savedList.innerHTML = "";

    if (!data || data.length === 0) {

        savedList.innerHTML = `
            <p class="no-data">
                No saved data yet.
            </p>
        `;

        return;
    }

    data.forEach((item, index) => {

        const savedItem =
            document.createElement("div");

        savedItem.className = "saved-item";

        const savedDate =
            new Date(item.created_at).toLocaleString();

        savedItem.innerHTML = `

            <h3>
                Savings Plan #${index + 1}
            </h3>

            <p>

                <strong>Monthly Income:</strong>
                $${Number(item.income).toFixed(2)}

                <br>

                <strong>Savings Target:</strong>
                $${Number(item.target).toFixed(2)}

                <br>

                <strong>Target Period:</strong>
                ${item.months} month(s)

                <br>

                <strong>Saved Date:</strong>
                ${savedDate}

            </p>

            <button
                class="load-btn"
                onclick="loadData(${item.id})">
                Load
            </button>

            <button
                class="clear-btn"
                onclick="clearData(${item.id})">
                Clear
            </button>

        `;

        savedList.appendChild(savedItem);

    });
}


// ====================
// Load Saved Data
// ====================

async function loadData(id) {

    const { data, error } = await supabaseClient
        .from("finance_logs")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {

        console.error("Load error:", error);

        savedStatus.textContent =
            "Failed to load data.";

        return;
    }

    incomeInput.value = data.income;
    targetInput.value = data.target;
    monthsInput.value = data.months;

    // Switch to calculator
    calculatorSection.classList.remove("hidden");
    savedSection.classList.add("hidden");

    calculatorTab.classList.add("active");
    savedTab.classList.remove("active");

    // Calculate loaded data
    calculateSavings();

    savedStatus.textContent =
        "Saved data loaded successfully.";
}


// ====================
// Clear One Data
// ====================

async function clearData(id) {

    const { error } = await supabaseClient
        .from("finance_logs")
        .delete()
        .eq("id", id);

    if (error) {

        console.error("Delete error:", error);

        savedStatus.textContent =
            "Failed to delete data.";

        return;
    }

    displaySavedData();

    savedStatus.textContent =
        "Saved data has been cleared.";
}


// ====================
// Clear All Data
// ====================

async function clearAllData() {

    const { error } = await supabaseClient
        .from("finance_logs")
        .delete()
        .neq("id", 0);

    if (error) {

        console.error("Delete error:", error);

        savedStatus.textContent =
            "Failed to clear data.";

        return;
    }

    displaySavedData();

    savedStatus.textContent =
        "All saved data has been cleared.";
}


// ====================
// Calculator Tab
// ====================

calculatorTab.addEventListener(
    "click",
    function() {

        calculatorSection.classList.remove(
            "hidden"
        );

        savedSection.classList.add(
            "hidden"
        );


        calculatorTab.classList.add(
            "active"
        );

        savedTab.classList.remove(
            "active"
        );

    }
);


// ====================
// Saved Data Tab
// ====================

savedTab.addEventListener(
    "click",
    function() {

        calculatorSection.classList.add(
            "hidden"
        );

        savedSection.classList.remove(
            "hidden"
        );


        calculatorTab.classList.remove(
            "active"
        );

        savedTab.classList.add(
            "active"
        );


        displaySavedData();

    }
);


// ====================
// Button Events
// ====================

calculateBtn.addEventListener(
    "click",
    calculateSavings
);

saveBtn.addEventListener(
    "click",
    saveData
);

clearAllBtn.addEventListener(
    "click",
    clearAllData
);


// ====================
// Load Saved Data
// ====================

displaySavedData();