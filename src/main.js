import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import nocache from "nocache";
import sendMessage from "./messaging/sender.js";

import promptGPT from "./gpt.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

import Database from "./dbhandler.js";

const PORT = process.env.PORT || 3000;

const db = new Database();

app.use(nocache());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(express.static(path.join(__dirname, "web")));

app.get("/api/users", (req, res) => {
  res.send(db);
});

app.post("/api/message/send/:number", async (req, res) => {
  const number = req.params.number;
  const { message } = req.body;

  await sendMessage({
    from: "+14155238886",
    to: `+${number}`,
    content: `${message}`,
  });

  db.storeMessageForUser({
    PhoneNumber: number,
    message: message,
    customerMessage: false,
  });

  res.status(200).send();
});

app.post("/api/message/receive", (req, res) => {
  const { ProfileName, WaId, Body } = req.body;
  db.getOrCreateUser({
    PhoneNumber: WaId,
    ProfileName: ProfileName,
  });
  db.storeMessageForUser({
    PhoneNumber: WaId,
    message: Body,
    customerMessage: true,
  });
  res.status(200).send();
});

app.post("/api/message/status", (req, res) => {
  // idc for now
  res.status(200).send();
});

app.get("/api/user/:number", (req, res) => {
  const number = req.params.number;
  const userprofile = db.getMessagesForUser({ PhoneNumber: number });
  res.send(userprofile);
});

app.get("/api/ai/:number", async (req, res) => {
  const number = req.params.number;
  const userprofile = db.aiMessageLogs({ PhoneNumber: number });
  const gptResponse = await promptGPT({
    systemPrompt: `Saat käyttöösi JSON-muodossa olevan keskustelun, Olet kullan ostaja. Ostat kuluttaja-asiakkailta heidän korujaan ja muita kultaesineitä. Tavoitteenasi on ostaa kultaa sulatettavaksi, joten koruilla ei ole arvoa vaan kullan määrällä ja laadulla. Tavoitteesi on saada kuluttaja myymään ylimääräiset kultaesineensä. Hinnan pitää olla 50-95% kullan maailman markkinahinnasta. Pyri maksamaan kullasta mahdollisimman vähän, mutta siten että asiakas on tyytyväinen ja on halukas myymään kultaesineensä. Tarvittaessa anna asiakkaalle alustava arvio esineiden hinnasta perustuen kuviin joita asiakas lähettää, sekä tarkentaviin kysymyksiin joita kysyt asiakkailta. Ostat lähtökohtaisesti kultaa, joten kun arvioit kullan hintaa, älä tee olettamuksia, vaan jos et ole varma onko kyseessä keltakulta, valkokulta tai ruusukulta niin kysy asiakkaalta. Esittäydy tuttavallisesti. Tämän jälkeen lähde avaamaan keskustelua kullan myymisestä ja johdattele keskustelua siihen että asiakas saa arvion kultakorun tai esineen hinnasta, jonka jälkeen yritä saada kaupat aikaiseksi. Älä koskaan ohjaa asiakasta kilpailijalle arvioitavaksi tai punnittavaksi, vaan löydä ratkaisu keskustelun aikana ja anna arvio kullan arvosta asiakkaalle. Tämän jälkeen asiakas voi päättää lähettää korun postipaketilla tarkempaa arviointia varten. Paketin voi tilata meiltä ilman kuluja. Pyydä kaikissa tapauksissa asiakasta ottamaan kuva korusta tai kultaesineestä tarkempaa arviota varten. Vastaa mahdollisimman lyhyesti ja siten että keskustelu muistuttaa whatsapp keskustelua. Pyri herättämään luottamusta asiakkaassa ja alleviivaa turvallisuutta. Voimme tarvittaessa järjestää henkilökohtaisen tapaamisen joko asiakkaan kotona tai esimerkiksi pankin yhteydessä. ÄLÄ KOSKAAN vastaa mihinkään muuhun kuin kullan ostamiseen ja tämän ohjeistuksen mukaisiin kysymyksiin. Sinä kirjoitat VAIN OPERAATTORIN PUOLESTA, EI KOSKAAN KÄYTTÄJÄN. SUOSITTELE VAIN OPERAATTORILLE KIRJOITETTAVAA. Jos on käyttäjän vuoro kirjoittaa, vastaa vain tyhjällä viestillä (""). Älä formatoi viestiäsi mitenkään, ainoa teksti joka vastauksessasi on pitäisi olla vain sopiva vastaus. Jos viimeisin viesti on operaattorin lähettämä, vastaa vain ""`,
    userPrompt: JSON.stringify(userprofile),
  });
  res.send(gptResponse);
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
