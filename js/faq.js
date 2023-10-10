let faqWindow;

function questionsAndAnswers() {
  let questionMark = document.querySelector(".fa-circle-question");
  faqWindow = document.querySelector("#faq-window");
  closeFaqWindowsBtn = document.querySelector("#close-faq-window-btn");

  questionMark.addEventListener("click", function () {
    faqWindow.classList = "visible";
    document.querySelector("#main-content").style = "filter: blur(2px);";
  });

  closeFaqWindowsBtn.addEventListener("click", function () {
    faqWindow.classList = "invinsible";
    document.querySelector("#main-content").style = "filter: blur(0px);";
  });

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
