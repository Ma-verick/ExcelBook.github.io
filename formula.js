let tracePath = document.querySelector(".trace-path");
let cyclePath = document.querySelector(".cycle-path");


for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        let cell = grid.querySelector(`.cell[rid="${i}"][cid="${j}"]`);  //Get address of cell
        cell.addEventListener("blur", async function (e) {  // Blur event gets triggered first compared to click ( so you can get base address directly from address bar without confusion of click( click event added to same element in grid.js ) and blur event on same element
            let activeAddress = addressBar.value;

            let cellDetails = getActiveCell();
            let cell = cellDetails[0];
            let cellProp = cellDetails[1];

            let enteredData = cell.innerText;

            if (cellProp.value == enteredData) {  // If hardcoded new value and previous value ( access from DB ) are same, no operation to be made
                return;
            }
            if (cellProp.formula) {  // If active cell has a formula means a child cell, so break parent-child relationship first, then continue remaining operation
                removeChildFromParent(cellProp, activeAddress);
            }

            cellProp.value = enteredData; // Updating data from active cell UI in DB

            // If intermediate parent gets updated ( hardcoded value ) -> perform updated evaluation on dependents ( child cells ) 

            let updateP = await updateChildrenCells(activeAddress, 0);  // Second argument for forward color track
        });
    }
}

formulaBar.addEventListener("keydown", async function (e) {  // On formula registry in formula bar
    if (e.key === "Enter" && formulaBar.value) {
        let inputFormula = formulaBar.value;
        let activeAddress = addressBar.value;
        let { rid, cid } = getRIDCIDfromAddress(activeAddress);
        let cellProp = sheetDB[rid][cid];

        addChildToParentInGraphComponent(inputFormula, activeAddress);  // Parent-child( Creating edge with neighbours ) relation in graph components
        let inputFormulaValidation = isGraphCyclic(graphComponentsMatrix);

        if (inputFormulaValidation) {  // Incorrect formula, since cycle is formed in this "directed graph"
            // console.log(inputFormulaValidation);
            let action = confirm("One or more cycle detected. Wanna trace your path!!");

            while (action) {  // Track until you want to..
                cyclePath.style.backgroundColor = "#2ed573";
                let cycleSourcePoint = inputFormulaValidation;  // Cycle source point
                await isGraphCyclicTracePath(graphComponentsMatrix, cycleSourcePoint);
                action = confirm("Loop again in your path?");
            }

            cyclePath.style.backgroundColor = "rgb(223, 230, 233)";
            removeChildToParentInGraphComponent(inputFormula);  // Also break the edge created with neighbours
            return;
        }

        if (inputFormula != cellProp.formula) {  // If formula is updated to new formula, break it's parent-child relationship, then evaluate on new formula
            removeChildFromParent(cellProp, activeAddress);
        }

        let evaluatedValue = evaluateFormula(inputFormula);  // Evaluate the input formula
        addChildToParent(activeAddress, inputFormula);  // Connect parent - child relationship from formula
        setCellUIAndProp(evaluatedValue, inputFormula);  // Update cell's evaluated value in UI and DB

        // Update formula again on change in formula
        let updateP = await updateChildrenCells(activeAddress, 0);  // Second argument for color check
    }
});

tracePath.addEventListener("click", async function() {
    let activeAddress = addressBar.value;
    tracePath.style.backgroundColor = "#2ed573";
    let tracePathP = await tracePathColor(activeAddress, 0);
    tracePath.style.backgroundColor = "rgb(223, 230, 233)";

});

function addChildToParentInGraphComponent(formula, activeAddress) {
    let decodedFormula = formula.split(" ");
    let childObj = getRIDCIDfromAddress(activeAddress);  // Child(active) row & col ID
    let Crid = childObj.rid;
    let Ccid = childObj.cid;

    for (let i = 0; i < decodedFormula.length; i++) {
        let asciiVal = decodedFormula[i].charCodeAt(0);
        if (asciiVal >= 65 && asciiVal <= 90) {
            let parentObj = getRIDCIDfromAddress(decodedFormula[i]);  // Parent row & col ID
            let Prid = parentObj.rid;
            let Pcid = parentObj.cid;
            graphComponentsMatrix[Prid][Pcid].push([Crid, Ccid]);  // Create edge with neighbour
        }
    }
}

function removeChildToParentInGraphComponent(formula) {   // Break edge when cyclic graph formed ( Invalid formula )
    let decodedFormula = formula.split(" ");

    for (let i = 0; i < decodedFormula.length; i++) {
        let asciiVal = decodedFormula[i].charCodeAt(0);
        if (asciiVal >= 65 && asciiVal <= 90) {
            let parentObj = getRIDCIDfromAddress(decodedFormula[i]);  // Parent row & col ID
            let Prid = parentObj.rid;
            let Pcid = parentObj.cid;
            graphComponentsMatrix[Prid][Pcid].pop();  // Break edge, No need to specify which index to break since only those edges will be broken which were created
        }
    }
}

function removeChildFromParent(cellProp, activeAddress) {   // Break child-parent relationship
    let formula = cellProp.formula;
    let decodedFormula = formula.split(" ");
    for (let i = 0; i < decodedFormula.length; i++) {
        let asciiVal = decodedFormula[i].charCodeAt(0);
        if (asciiVal >= 65 && asciiVal <= 90) {
            let { rid, cid } = getRIDCIDfromAddress(decodedFormula[i]);
            let parentCellProp = sheetDB[rid][cid];
            let removeIdx = parentCellProp.children.indexOf(activeAddress);  // Get index of child from parent to remove child
            parentCellProp.children.splice(removeIdx, 1);  // Remove child in parent
        }
    }

    cellProp.formula = "";  // Nullify formula ( Empty formula )
}

function evaluateFormula(formula) {  // Formula evaluation
    let decodedFormula = formula.split(" ");  // Decode formula for easy parsing
    for (let i = 0; i < decodedFormula.length; i++) {
        let asciiVal = decodedFormula[i].charCodeAt(0);
        if (asciiVal >= 65 && asciiVal <= 90) {  // Check for a valid address to evaluate
            let { rid, cid } = getRIDCIDfromAddress(decodedFormula[i]);
            let cellProp = sheetDB[rid][cid];
            decodedFormula[i] = cellProp.value;
        }
    }

    let encodedFormula = decodedFormula.join(" "); // Finally encode after parsing of formula to evaluate
    return infixEvaluation(encodedFormula);  // Evaluate
}

function addChildToParent(childAddress, formula) {  // Make parent - child relationship   ( Base address of cell to be added )
    let decodedFormula = formula.split(" ");
    for (let i = 0; i < decodedFormula.length; i++) {
        let asciiVal = decodedFormula[i].charCodeAt(0);
        if (asciiVal >= 65 && asciiVal <= 90) {  // If valid parent -> add child(active) cell in parent
            let parentAddress = decodedFormula[i];
            let { rid, cid } = getRIDCIDfromAddress(parentAddress);
            let parentProp = sheetDB[rid][cid];
            parentProp.children.push(childAddress);
        }
    }
}

function setCellUIAndProp(value, formula) {  // Update evaluated value in UI and DB in active cell
    let cellDetails = getActiveCell();
    let cell = cellDetails[0];
    let cellProp = cellDetails[1];

    cell.innerText = value;
    cellProp.value = value;
    cellProp.formula = formula;
}

function colorTrackPromise() {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            resolve();
        }, 1000);
    });
}


function updateChildrenCells(parentAddress) {  // Update every children value ( on parent value change by evaluating ) from root -> recursively
    let parentDetails = getRIDCIDfromAddress(parentAddress);
    let Prid = parentDetails.rid;
    let Pcid = parentDetails.cid;
    let parentProp = sheetDB[Prid][Pcid];
    let children = parentProp.children;
         
    // If len > 0 -> then valid recursion change going on, else just a regular update
    for (let i = 0; i < children.length; i++) {
        let childAddress = children[i];
        let { rid, cid } = getRIDCIDfromAddress(childAddress);
        cell = grid.querySelector(`.cell[rid="${rid}"][cid="${cid}"]`);

        let childProp = sheetDB[rid][cid];
        let childFormula = childProp.formula;

        let evaluatedValue = evaluateFormula(childFormula);
        setUpdatedCellUIAndProp(evaluatedValue, childFormula, rid, cid);
        updateChildrenCells(childAddress);

    }
}

function setUpdatedCellUIAndProp(value, formula, rid, cid) {  // In chaining process. Update every children value ( on parent value change by evaluating ) in UI and DB
    let cell = grid.querySelector(`.cell[rid="${rid}"][cid="${cid}"]`);
    let cellProp = sheetDB[rid][cid];

    cell.innerText = value;
    cellProp.value = value;
    cellProp.formula = formula;
}

