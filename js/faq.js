let faqWindow;

function questionsAndAnswers() {
  let questionMark = document.querySelector(".fa-circle-question");
  faqWindow = document.querySelector("#faq-window");

  questionMark.addEventListener("click", function () {
    faqWindow.classList = "visible";
    document.querySelector("#main-content").style = "filter: blur(2px);";
  });

  fetch("faq.json")
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById("faq-window");

      // Loop through the JSON data and create cards
      data.forEach((item) => {
        // Create a card div
        const card = document.createElement("div");
        card.classList.add("card");

        // Create elements for the question and answer
        const questionElement = document.createElement("h3");
        questionElement.textContent = item.question;

        // Create a paragraph element for the answer
        const answerElement = document.createElement("p");

        // Replace "\n" with <br> tags for newline
        const answerText = item.answer.replace(/\n/g, "<br>");
        answerElement.innerHTML = answerText;

        // Append elements to the card
        card.appendChild(questionElement);
        card.appendChild(answerElement);

        // Append the card to the container
        container.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
  0;
}
