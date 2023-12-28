let faqWindow;

function questionsAndAnswers() {
  faqWindow = document.querySelector("#faq-window");

  fetch("faq.json")
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById("faq-window");

      data.forEach((item) => {
        const card = document.createElement("div");
        card.classList.add("card");

        const questionElement = document.createElement("h3");
        questionElement.textContent = item.question;

        const answerElement = document.createElement("p");

        const answerText = item.answer.replace(/\n/g, "<br>");
        answerElement.innerHTML = answerText;

        card.appendChild(questionElement);
        card.appendChild(answerElement);

        container.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
  0;
}
