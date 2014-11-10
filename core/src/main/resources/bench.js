var clients = 2
var sends = 100

function bench(n) {
    var button = document.getElementById("btn");
    if (n > 0)
        return function() {
            button.click()
            setTimeout(bench(n-1), 100)
        }
}

function update() {
    if (parseInt(label.innerHTML) >= clients * ) {
        // log time
        var req = new XMLHttpRequest();
        req.open("GET", "logtime");
        req.send();
    }
}

window.onload = function() {
    label = document.getElementById("label");
    MTFRP.ontick = update;
    
    setTimeout(bench(sends), 1000);
}
