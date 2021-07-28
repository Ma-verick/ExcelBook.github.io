
$("#cut").click(function (e) {
    cutClicked = true;
    createClipboardContents();
})

$("#copy").click(function (e) {
    cutClicked = false;
    createClipboardContents();
})

$("#paste").click(function (e) {
    pasteIntoSheet();
})