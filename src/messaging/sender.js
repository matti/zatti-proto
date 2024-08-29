import twilio from "twilio";
const accountSid = "TROLOL";
const authToken = "TROLOL";
const client = twilio(accountSid, authToken);

async function sendMessage({
  from = "+14155238886",
  to = "+358449750177",
  content = "hello world.",
}) {
  const message = await client.messages.create({
    body: content,
    from: `whatsapp:${from}`,
    to: `whatsapp:${to}`,
  });
}

export default sendMessage;
