import { ChatGPTAPI } from "chatgpt";

const apiKey = "sk-TROLOLOLOLOLO";
function GPT4o({ apiKey, temperature = 0.2, top_p = 0.1, debug = false }) {
  return new ChatGPTAPI({
    apiKey: apiKey,
    completionParams: {
      model: "gpt-4o",
      temperature: temperature,
      top_p: top_p,
    },
    debug: debug,
  });
}

async function promptGPT({ systemPrompt, userPrompt }) {
  const api = GPT4o({
    apiKey: apiKey,
    debug: false,
  });

  const response = await api.sendMessage(userPrompt, {
    systemMessage: systemPrompt,
  });

  return response.text;
}

export default promptGPT;
