const {onObjectFinalized} = require("firebase-functions/v2/storage");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");
const {initializeApp} = require("firebase-admin/app");
const {defineSecret} = require("firebase-functions/params");
const {OpenAI} = require("openai");
const crypto = require("crypto");

// Inizializzazione Firebase Admin
initializeApp();
const db = getFirestore();
const storage = getStorage();

// Definiamo il Secret
const openAiApiKey = defineSecret("OPENAI_API_KEY");

/**
 * Funzione per l'analisi automatica della locandina caricata.
 */
exports.analizzaLocandina = onObjectFinalized({
  bucket: "espedienti-napoli.firebasestorage.app",
  region: "us-east1",
  cpu: 1,
  memory: "256MiB",
  secrets: [openAiApiKey],
}, async (event) => {
  const fileBucket = event.data.bucket;
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  // Filtro per cartella e tipo file
  if (!filePath.startsWith("eventi_uploads/") ||
      !contentType.startsWith("image/")) {
    return;
  }

  try {
    const bucket = storage.bucket(fileBucket);
    const file = bucket.file(filePath);

    // 1. Generiamo un token di download univoco per Firebase
    const downloadToken = crypto.randomUUID();

    // 2. Impostiamo il token nei metadati del file
    // Questo permette l'accesso tramite il dominio firebasestorage
    await file.setMetadata({
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    });

    // 3. Costruiamo l'URL di download pubblico "stile Firebase"
    // Questo URL è leggibile da qualsiasi browser/app React
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${fileBucket}/o/${encodeURIComponent(filePath)}?alt=media&token=${downloadToken}`;

    // Scarichiamo il file in memoria per l'analisi AI (Base64)
    const [fileBuffer] = await file.download();
    const base64Image = fileBuffer.toString("base64");

    const openai = new OpenAI({
      apiKey: openAiApiKey.value(),
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Sei un estrattore di eventi. Se una locandina ha più " +
                   "date o più eventi, crea un oggetto separato per " +
                   "ciascuno. Rispondi in JSON con la chiave 'eventi'.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Estrai tutti gli eventi presenti. Per ogni data o " +
                    "evento diverso, crea un oggetto con: {titolo, data, " +
                    "ora, luogo, prezzo, descrizione_breve}.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${contentType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: {type: "json_object"},
    });

    const rawResult = JSON.parse(response.choices[0].message.content);
    const listaEventi = rawResult.eventi || [];

    // Salviamo ogni evento usando il nuovo publicUrl accessibile
    const promiseSalvataggi = listaEventi.map((infoEvento) => {
      const docData = {
        ...infoEvento,
        imageUrl: publicUrl,
        status: "pending",
        createdAt: new Date().toISOString(),
        sourceFile: filePath.split("/").pop(),
      };
      return db.collection("eventi_raw").add(docData);
    });

    await Promise.all(promiseSalvataggi);
    console.log(`Salvati ${listaEventi.length} eventi con URL pubblico.`);
  } catch (error) {
    console.error("Errore durante l'elaborazione:", error);
    await db.collection("eventi_errors").add({
      filePath,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
