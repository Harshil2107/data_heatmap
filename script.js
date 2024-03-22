function loadFiles() {
    const textFileInput = document.getElementById('textFileInput');
    const jsonFileInput = document.getElementById('jsonFileInput');

    if (textFileInput.files.length > 0 && jsonFileInput.files.length > 0) {
        const textFile = textFileInput.files[0];
        const jsonFile = jsonFileInput.files[0];

        readAndProcessFiles(textFile, jsonFile);
    } else {
        console.log('Please select both a text file and a JSON file.');
    }
}

async function readAndProcessFiles(textFile, jsonFile) {
    const textData = await readFile(textFile);
    const jsonData = await readFile(jsonFile, true);

    displayAndHighlightInstructions(textData, jsonData);
}

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
    const lines = text.split('\n');
    const container = document.getElementById('instructionContainer');

    const block_instruction_count = jsonData["basic_block_instrution_count"];
    console.log(block_instruction_count)
    const region_0_block_frequency = jsonData["regional_info"]["0"]["basic_block_encountered_frequency"];
    lines.forEach((line, index) => {
        const lineElement = document.createElement('div');
        lineElement.textContent = line;
        lineElement.className = 'instruction';

        // Simple logic to determine highlighting based on JSON data
        // Adjust according to your JSON structure and data
        const addressMatch = line.match(/^[\s]*([0-9a-f]{4,}):/);
        if (addressMatch) {

            const address = `0x${addressMatch[1].toLowerCase()}` // Assuming JSON keys are lowercase
            // console.log(address)
            if (region_0_block_frequency.hasOwnProperty(address)) {
                console.log(block_instruction_count)
                const instruction_count = block_instruction_count[address]
                const frequency = region_0_block_frequency[address]
                console.log(`frequency of ${address} `,frequency)
                console.log(`instruction count of ${address} `,instruction_count)
                const intensity = Math.min(frequency * 0.1, 1); // Example calculation, adjust as needed
                const start_index = Math.max(0, index - instruction_count+1)
                lineElement.style.backgroundColor = `rgba(255, 0, 0, ${intensity})`;
                lineElement.className += ' highlight';

                for (let i = start_index; i < index; i++) {
                    const lineElement = container.children[i];
                    lineElement.style.backgroundColor = `rgba(255, 0, 0,${intensity})`;
                    lineElement.className += ' highlight';
                }
            }
        } 
         container.appendChild(lineElement);
        

        
    });
}