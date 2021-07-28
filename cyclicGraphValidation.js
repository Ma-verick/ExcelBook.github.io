let graphComponentsMatrix = [];

for (let i = 0;i < rows;i++) {
    let row = [];
    for (let j = 0;j < cols;j++) {
        row.push([]);
    }
    graphComponentsMatrix.push(row);
}

function isGraphCyclic(graphComponentsMatrix) {  // Cycle detection in Directed graph algorithm
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

    for (let i = 0;i < rows;i++) {
        for (let j = 0;j < cols;j++) {
            if (graphVisited[i][j] == false) {
                if (cyclicDFS(graphComponentsMatrix, i, j, graphVisited, dfsVisited) == true) {
                    return {
                        srcr: i,
                        srcc: j
                    }  // Returns cycle path src point for color tracking
                }
            }
        }
    }

    return null;
}

function cyclicDFS(graphComponentsMatrix, srcr, srcc, graphVisited, dfsVisited) {
    graphVisited[srcr][srcc] = true;
    dfsVisited[srcr][srcc] = true;

    for (let i = 0;i < graphComponentsMatrix[srcr][srcc].length;i++) {
        let neighbour = graphComponentsMatrix[srcr][srcc][i];
        let nbrr = neighbour[0];
        let nbrc = neighbour[1];

        if (graphVisited[nbrr][nbrc] == false) {
            if (cyclicDFS(graphComponentsMatrix, nbrr, nbrc, graphVisited, dfsVisited) == true) {
                return true;
            }
        }
        else if (dfsVisited[nbrr][nbrc] == true) {  // If visited in both dfs call path and in graph vertex visited, then cycle exists
            return true;
        }
    }

    dfsVisited[srcr][srcc] = false;  // Backtrack by unvisiting dfs path
    return false;
}