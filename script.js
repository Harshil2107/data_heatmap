function loadFiles() {
    const textFileInput = document.getElementById('textFileInput');
    const jsonFileInput = document.getElementById('jsonFileInput');

    if (textFileInput.files.length > 0 && jsonFileInput.files.length > 0) {
        const textFile = textFileInput.files[0];
        const jsonFile = jsonFileInput.files[0];

        readAndPopulateRegionDropdown(textFile, jsonFile);
    } else {
        console.log('Please select both a text file and a JSON file.');
    }
}

async function readAndPopulateRegionDropdown(textFile, jsonFile) {
    const jsonData = await readFile(jsonFile, true);
    window.textData = await readFile(textFile);
    populateRegionDropdown(jsonData["regional_info"]);
    // Store textData in a global variable for later use
}

function populateRegionDropdown(regionalInfo) {
    const regionSelect = document.getElementById('regionSelect');
    regionSelect.innerHTML = ''; // Clear previous options
    Object.keys(regionalInfo).forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = `Region ${region}`;
        if (region === '0') {
            option.selected = true; // Select the first region by default
        }
        regionSelect.appendChild(option);
    });
    regionSelect.style.display = 'inline'; // Make the dropdown visible

    // Remove existing onchange event listeners to avoid duplicates
    regionSelect.onchange = null;
    // Attach a new onchange event listener
    regionSelect.onchange = () => {
        const jsonFile = document.getElementById('jsonFileInput').files[0];
        readFile(jsonFile, true).then(jsonData => {
            displayAndHighlightInstructions(window.textData, jsonData);
        });
    };
    regionSelect.onchange(); // Trigger the event listener immediately
}


// async function readAndProcessFiles(textFile, jsonFile) {
//     const textData = await readFile(textFile);
//     const jsonData = await readFile(jsonFile, true);

//     displayAndHighlightInstructions(textData, jsonData);
// }

function readFile(file, isJson = false) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target.result;
            if (isJson) {
                try {
                    const data = JSON.parse(result);
                    resolve(data);
                } catch (error) {
                    reject('Failed to parse JSON');
                }
            } else {
                resolve(result);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

function displayAndHighlightInstructions(text, jsonData) {
    const selectedRegion = document.getElementById('regionSelect').value;
    const container = document.getElementById('instructionContainer');
    container.innerHTML = ''; // Clear previous instructions
    
    const regionInfo = jsonData["regional_info"][selectedRegion];
    if (!regionInfo) {
        console.log(`No data for selected region: ${selectedRegion}`);
        return;
    }
    const block_instruction_count = jsonData["basic_block_instrution_count"];
    const block_frequency = regionInfo["basic_block_encountered_frequency"];
    const frequencies = Object.values(block_frequency);
    const domainMin = Math.max(1, Math.min(...frequencies));
    const domainMax = Math.max(...frequencies);
    const logColorScale = updateLogColorScale(domainMin, domainMax);
    const fontColorScale = createFontColorScale(domainMin, domainMax);
    const lines = text.split('\n');
    let encountered_addresses = new Set();
    lines.forEach((line, index) => {
        const lineElement = document.createElement('div');
        lineElement.textContent = line;
        lineElement.className = 'instruction';
        


        // Simple logic to determine highlighting based on JSON data
        // Adjust according to your JSON structure and data
        const addressMatch = line.match(/^[\s]*([0-9a-f]{4,}):/);
        if (addressMatch) {
            
            const address = `0x${addressMatch[1].toLowerCase()}` // Assuming JSON keys are lowercase
            encountered_addresses.add(address)
            if (block_frequency.hasOwnProperty(address)) {
                const instruction_count = block_instruction_count[address]
                const frequency = block_frequency[address]

                console.log(`frequency of ${address} `,frequency)
                console.log(`instruction count of ${address} `,instruction_count)
                const start_index = Math.max(0, index - instruction_count+1)
                lineElement.style.backgroundColor = logColorScale(Math.log(frequency));
                lineElement.className += ' highlight';
                lineElement.style.paddingBottom = "3px";
                // Add a solid line (bottom border) after each line
                lineElement.style.borderBottom = "1px solid #000"; // Solid black line

                const frequencyElement = document.createElement('div');
                frequencyElement.textContent = `Frequency: ${frequency.toLocaleString()}`;
                frequencyElement.style.color = fontColorScale(Math.log(frequency));
                lineElement.appendChild(frequencyElement);
                
                for (let i = start_index; i < index; i++) {
                    
                    const lineElement = container.children[i];
                    if (i == start_index) {
                        lineElement.style.marginTop = "3px";
                        lineElement.style.borderTop = "1px solid #000"; // Solid black line
                    }
                    lineElement.style.backgroundColor = logColorScale(Math.log(frequency));
                    lineElement.className += ' highlight';
                }
            }
        } 
         container.appendChild(lineElement);
    });
    displayMissingAddressesWithFrequency(logColorScale ,block_frequency, block_instruction_count, encountered_addresses, container);
}

function updateLogColorScale(domainMin, domainMax) {
    // Adjust domainMin if it's 0 or less, as log scale cannot handle values <= 0
    domainMin = Math.max(domainMin, 1);

    return d3.scaleSequential(d3.interpolatePlasma)
        .domain([Math.log(domainMin), Math.log(domainMax)])
        // .interpolator(d3.interpolateCividis); // You can choose other interpolators
        .interpolator(d3.interpolateYlOrRd); // Currently using YlOrRd
}

function createFontColorScale(domainMin, domainMax) {
    domainMin = Math.max(domainMin, 1);
    return d3.scaleSequential(d3.interpolatePlasma)
        .domain([Math.log(domainMin), Math.log(domainMax)])
        .interpolator(d3.interpolateCividis); // Using RdBu for font color
}

function displayMissingAddressesWithFrequency(logColorScale, blockFrequency, blockInstructionCount, encounteredAddresses, container) {
    Object.keys(blockFrequency).forEach(address => {
        if (!encounteredAddresses.has(address)) {
            // Address was not found in the text file but has a frequency in JSON
            const frequency = blockFrequency[address];
            const instructionCount = blockInstructionCount[address] || 1; // Default to 1 if not specified

            for (let i = 0; i < instructionCount; i++) {
                const missingElement = document.createElement('div');
                if (i == 0) {
                    missingElement.style.marginTop = "3px";
                    missingElement.style.borderTop = "1px solid #000"; // Solid black line
                }
                if (i == instructionCount - 1) {
                    missingElement.style.paddingBottom = "3px";
                    missingElement.style.borderBottom = "1px solid #000"; // Solid black line
                }
                missingElement.textContent = `${address} (Frequency: ${frequency.toLocaleString()}, Not in text file)`;
                missingElement.style.backgroundColor = logColorScale(Math.log(frequency)); // Heat map color coding
                missingElement.className = 'instruction highlight';
                container.appendChild(missingElement);
            }
        }
    });
}