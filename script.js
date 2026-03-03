const memory = new Uint8Array(256);
const stack = new Uint8Array(64);
let running = false;

const memoryDiv = document.getElementById("memory");
const fileInput = document.getElementById('uploadedFile');

for (let i = 0; i < 256; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.textContent = "00";
    memoryDiv.appendChild(cell);
}


function renderMemory() {
    const cells = document.querySelectorAll(".cell");

    for (let i = 0; i < 256; i++) {
        cells[i].textContent = memory[i].toString(16).padStart(2, "0").toUpperCase();
    }
}

function renderRegisters(registers, rsp, pc) {
    document.getElementById("r0").textContent = registers[0];
    document.getElementById("r1").textContent = registers[1];
    document.getElementById("r2").textContent = registers[2];
    document.getElementById("r3").textContent = registers[3];
    document.getElementById("rsp").textContent = rsp;
    document.getElementById("pc").textContent = pc;
}

fileInput.addEventListener('change', () => {

    const fr = new FileReader();

    fr.onload = () => {
        const buffer = fr.result;
        const fileBytes = new Uint8Array(buffer);

        for (let i = 0; i < fileBytes.length && i < 256; i++) {
            memory[i] = fileBytes[i];
        }
        renderMemory();
        

    }

    fr.readAsArrayBuffer(fileInput.files[0]);

})

let delay = 1.5;

async function emulate() {
    
    const inputElement = document.getElementById('delay');
    delay = convert(inputElement.value);

    let pc = 0;
    const registers = new Uint8Array(4);
    
    let rsp = 64;
    let zeroflag = false;

    renderPC(0,0);
    
    while (running) {
        await sleep(delay)
        let nextPC = pc+1;

        if (pc >= 256) {
            running = false;
            break;
        }

        const byte = memory[pc];
        const opcode = byte >> 4;
        const src = (byte >> 2) & 0b0011;
        const dest = byte & 0b0011;

        switch (opcode) {
            case 0:
                registers[dest] = registers[src];
                break;
            
            case 1:
                registers[dest] += registers[src];
                break;
            
            case 2:
                registers[dest] &= registers[src];
                break;
            
            case 3:

                switch (src) {

                    case 0:
                        registers[dest] = -1 * registers[dest];
                        break;
                    case 1:
                        registers[dest] = ~registers[dest];
                        break;
                    case 2:
                        registers[dest] = !registers[dest];
                        break;
                    case 3:
                        registers[dest] = 0;
                        break;
                }
                break;
            
            case 4:
                nextPC = memory[pc+1];
                break;
            
            case 5:
                const imm = memory[pc+1];

                switch (src) {
                    case 0:
                        registers[dest] = imm;
                        break;
                    case 1:
                        registers[dest] += imm;
                        break;
                    case 2:
                        registers[dest] &= imm;
                        break;
                    case 3:
                        registers[dest] -= imm;
                        break;
                }
                nextPC = pc +2;
                break;
            
            case 6:
                memory[registers[dest]] = registers[src];
                break;
            
            case 7:
                registers[dest] = memory[registers[src]];
                break;
            
            case 8:
                switch (src) {
                    case 0:
                        if (rsp == 0) {
                            console.log("Stack Overflow");
                            return;
                        }

                        rsp--;
                        stack[rsp] = registers[dest];
                        break;
                    case 1:
                        if (rsp == 64) {
                            console.log("Stack Underflow");
                            return;
                        }

                        registers[dest] = stack[rsp];
                        rsp++;
                        break;
                }
                break;
            
            case 9:
                if (rsp == 0) {
                    console.log("Stack Overflow");
                    return;
                }

                rsp--;
                stack[rsp] = pc+2;
                nextPC = memory[pc+1];
                break;
            
            case 10:

                switch (dest) {
                    case 0:
                        if (rsp == 64) {
                            console.log("Stack Underflow");
                            return;
                        }

                        nextPC = stack[rsp];
                        rsp++;
                        break;
                    case 1:
                        running = false;
                        nextPC = pc;
                        break;
                }
                break;
                
            
            case 11:
                registers[dest] -= registers[src];
                break;

            case 12:
                const val = registers[dest] - registers[src];
                zeroflag = (val == 0);
                break;
            case 13:
                const target = memory[pc+1];
                switch (dest) {
                    case 0:
                        nextPC = (zeroflag) ? target : pc + 2;
                        break;
                    case 1:
                        nextPC = (!zeroflag) ? target : pc + 2;
                        break;
                }
                break;
            case 14:
                registers[dest] ^= registers[src];
                break;
            case 15:
                registers[dest] |= registers[src];
                break;
        }

        renderPC(pc, nextPC);
        renderRegisters(registers, rsp, nextPC);
        renderMemory();
        pc = nextPC;
    }
    
    

}

function run() {
    if (running) return;

    running = true;
    emulate();
}

function renderPC(prevPC, newPC) {
    const cells = document.querySelectorAll(".cell");

    cells[prevPC].classList.remove("pc");
    cells[newPC].classList.add("pc");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function convert(s) {
    return s * 1000;
}

