document.addEventListener("DOMContentLoaded", () => {
    const wordboxes = document.querySelectorAll(".word-box");
    const textOutput = document.getElementById("text-output");

    wordboxes.forEach(button => {
        button.addEventListener("click", function () {
           // addWord(this.text)
           textOutput.value += this.textContent + " ";
        })
    })
})


