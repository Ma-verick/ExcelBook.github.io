function infixEvaluation(exp) {  // Formula evaluation algorithm
    let operandStack = [];  // CustomStack
    let operatorStack = []; // CustomStack
    exp = exp.split(" ");

    for (let i = 0;i < exp.length;i++) {
        let char = exp[i];
        let asciiVal = char.charCodeAt(0);

        if (char == "(") {
            operatorStack.push(char);

        }
        else if (asciiVal >= 48 && asciiVal <= 57) {
            operandStack.push(Number(char));

        }
        else if (char == ")") {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length-1] != "(") {
                let operand2 = operandStack.pop();
                let operand1 = operandStack.pop();
                let operator = operatorStack.pop();
                let ans = calculate(operand1, operand2, operator);
                operandStack.push(ans);
            }
            operatorStack.pop();


        }
        else if (char == "+" || char == "-" || char == "*" || char == "/") {
            while (operatorStack.length > 0 && precedence(operatorStack[operatorStack.length-1]) >= precedence(char)) {
                let operand2 = operandStack.pop();
                let operand1 = operandStack.pop();
                let operator = operatorStack.pop();
                let ans = calculate(operand1, operand2, operator);
                operandStack.push(ans);
            }
            operatorStack.push(char);

        }
        else {
            // Do nothing because space doesn't contribute for solution
        }
    }

    while (operatorStack.length > 0) {
        let operand2 = operandStack.pop();
        let operand1 = operandStack.pop();
        let operator = operatorStack.pop();
        let ans = calculate(operand1, operand2, operator);
        operandStack.push(ans);
    }

    function calculate(operand1, operand2, operator) {
        if (operator === "+") {
            return operand1 + operand2;
        }
        else if (operator === "-") {
            return operand1 - operand2;
        }
        else if (operator === "*") {
            return operand1 * operand2;
        }
        else if (operator === "/") {
            return operand1 / operand2;
        }
    }

    function precedence(operator) {
        if (operator === "+" || operator === "-") {
            return 1;
        } 
        else if (operator === "*" || operator === "/") {
            return 2;
        }
        else {
            return 0;
        }
    }


    return operandStack[0];
}