var clients = 2
var sends = 100

function bench(n) {
	var button = document.getElementById("btn");
	// if (n > 0)
	return function() {
		button.click()
		setTimeout(bench(n - 1), 50)
	}
}

function update() {

}

window.onload = function() {
	MTFRP.ontick = update;
	setTimeout(bench(sends), 1000);
}