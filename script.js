document.addEventListener("DOMContentLoaded", () => {
    const wordboxes = document.querySelectorAll(".word-box");
    const textOutput = document.getElementById("text-output");
    const resetButton = document.querySelector(".reset-btn");

    wordboxes.forEach(button => {
        button.addEventListener("click", function () {
           // addWord(this.text)
           textOutput.value += this.textContent + " ";
        });
    });

    resetButton.addEventListener("click", () => {
        textOutput.value = "";
    })

});


