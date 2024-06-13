import { CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";

const $ = (el) => document.querySelector(el);

// pongo delante de la variable un símbolo de $
// para indicar que es un elemento del DOM
const $form = $("form");
const $input = $("input");
const $template = $("#message-template");
const $messages = $("ul");
const $container = $("main");
const $button = $("button");
const $info = $("small");
const $loading = $(".loading");

let messages = [];

const SELECTED_MODEL = "Llama-3-8B-Instruct-q4f32_1-MLC-1k";

const engine = await CreateWebWorkerMLCEngine(
  new Worker("./worker.js", { type: "module" }),
  SELECTED_MODEL,
  {
    initProgressCallback: (info) => {
      $info.textContent = `${info.text}%`;
      if (info.progress === 1) {
        $loading.parentNode.removeChild($loading);
        $button.removeAttribute("disabled");
        addMessage(
          "¡Hola! Soy un ChatGPT que se ejecuta completamente en tu navegador. ¿En qué puedo ayudarte hoy?",
          "bot"
        );
        $input.focus();
      }
    },
  }
);

$form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const messageText = $input.value.trim();

  if (messageText !== "") {
    // añadimos el mensaje en el DOM
    $input.value = "";
  }

  addMessage(messageText, "user");
  $button.setAttribute("disabled", "");

  const userMessage = {
    role: "user",
    content: messageText,
  };

  messages.push(userMessage);

  const chunks = await engine.chat.completions.create({
    messages,
    stream: true,
  });

  let reply = "";

  const $botMessage = addMessage("", "bot");

  for await (const chunk of chunks) {
    const choice = chunk.choices[0];
    const content = choice?.delta?.content ?? "";
    reply += content;
    $botMessage.textContent = reply;
  }

  $button.removeAttribute("disabled");
  messages.push({
    role: "assistant",
    content: reply,
  });
  $container.scrollTop = $container.scrollHeight;
});

function addMessage(text, sender) {
  // clonar el template
  const clonedTemplate = $template.content.cloneNode(true);
  const $newMessage = clonedTemplate.querySelector(".message");

  const $who = $newMessage.querySelector("span");
  const $text = $newMessage.querySelector("p");

  $text.textContent = text;
  $who.textContent = sender === "bot" ? "Denil" : "Tú";
  $newMessage.classList.add(sender);

  $messages.appendChild($newMessage);

  $container.scrollTop = $container.scrollHeight;

  return $text;
}
