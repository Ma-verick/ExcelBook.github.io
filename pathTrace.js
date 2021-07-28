// Function with color tracking -> on data updation
// Second argument for forward color track
async function tracePathColor(parentAddress, pathCount) {  // Update every children value ( on parent value change by evaluating ) from root -> recursively
    let parentDetails = getRIDCIDfromAddress(parentAddress);
    let Prid = parentDetails.rid;
    let Pcid = parentDetails.cid;
    let parentCell = grid.querySelector(`.cell[rid="${Prid}"][cid="${Pcid}"]`);
    let parentProp = sheetDB[Prid][Pcid];
    let children = parentProp.children;

    console.log(parentAddress);

    // if (children.length > 0 || pathCount > 0) 
    parentCell.style.backgroundColor = "lightblue";
    let colorForwardP = await colorTrackPromise();  // Returns a promise for slow tracking, with setTimeout usage
         

    // If len > 0 -> then valid recursion change going on, else just a regular update
    for (let i = 0; i < children.length; i++) {
        let childAddress = children[i];
        await tracePathColor(childAddress, pathCount + 1);
    }

    parentCell.style.backgroundColor = "lightgreen";
    let colorReverseP = await colorTrackPromise();   // Returns a promise for slow tracking, with setTimeout usage
    parentCell.style.backgroundColor = "transparent";
    return colorReverseP;
}


async function isGraphCyclicTracePath(graphComponentsMatrix, traceSrcPoint) {  // Cycle detection in Directed graph algorithm
    if (!traceSrcPoint) {
        return;
    }

    let {srcr, srcc} = traceSrcPoint;

    let graphVisited = [];  // Keep track of visited vertex( node )
    let dfsVisited = [];  // Keep track of visited vertex( node ) in dfs call

    for (let i = 0;i < rows;i++) {
        let graphRow = [];
        let dfsRow = [];
        for (let j = 0;j < cols;j++) {
            graphRow.push(false);
            dfsRow.push(false);
        }
        graphVisited.push(graphRow);
        dfsVisited.push(dfsRow);
    }

    let isCyclic = await cyclicDFSTracePath(graphComponentsMatrix, srcr, srcc, graphVisited, dfsVisited);
    if (isCyclic == true) {
        return new Promise((resolve, reject) => resolve(true));
    }

    return new Promise((resolve, reject) => resolve(false));
}

async function cyclicDFSTracePath(graphComponentsMatrix, srcr, srcc, graphVisited, dfsVisited) {
    graphVisited[srcr][srcc] = true;
    dfsVisited[srcr][srcc] = true;

    console.log(`${String.fromCharCode(65 + srcc)}${srcr+1}`);

    let cell = grid.querySelector(`.cell[rid="${srcr}"][cid="${srcc}"]`);
    cell.style.backgroundColor = "lightblue";
    let colorForwardP = await colorTrackPromise();

    for (let i = 0;i < graphComponentsMatrix[srcr][srcc].length;i++) {
        let neighbour = graphComponentsMatrix[srcr][srcc][i];
        let nbrr = neighbour[0];
        let nbrc = neighbour[1];

        if (graphVisited[nbrr][nbrc] == false) {
            let isCyclic = await cyclicDFSTracePath(graphComponentsMatrix, nbrr, nbrc, graphVisited, dfsVisited);
            if (isCyclic == true) {
                cell.style.backgroundColor = "lightgreen";
                let colorReverseP = await colorTrackPromise();   // Returns a promise for slow tracking, with setTimeout usage
                cell.style.backgroundColor = "transparent";
                return new Promise((resolve, reject) => resolve(true));
            }
        }
        else if (dfsVisited[nbrr][nbrc] == true) {  // If visited in both dfs call path and in graph vertex visited, then cycle exists
            let Cycliccell = grid.querySelector(`.cell[rid="${nbrr}"][cid="${nbrc}"]`);
            Cycliccell.style.backgroundColor = "lightsalmon";    // To highlight the position where cycle formed
            let colorInterP = await colorTrackPromise();   // Returns a promise for slow tracking, with setTimeout usage
            Cycliccell.style.backgroundColor = "lightblue";

            cell.style.backgroundColor = "lightgreen";
            let colorReverseP = await colorTrackPromise();   // Returns a promise for slow tracking, with setTimeout usage
            cell.style.backgroundColor = "transparent";

            return new Promise((resolve, reject) => resolve(true));
        }
    }

    dfsVisited[srcr][srcc] = false;  // Backtrack by unvisiting dfs path
    return new Promise((resolve, reject) => resolve(false));
}