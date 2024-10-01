import "dotenv/config";
import {
  createBot,
  createProvider,
  createFlow,
} from "@builderbot/bot";
import { MemoryDB } from "@builderbot/bot";
import { BaileysProvider } from "@builderbot/provider-baileys";


/** Puerto en el que se ejecutará el servidor */
const PORT = process.env.PORT ?? 3008;
const CURRENT_API_KEY = process.env.CURRENT_API_KEY ?? ''
/**
 * Middleware para verificar la API Key en cada solicitud
 */
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Bad Request: Missing API Key' }));
    }

    if (apiKey !== CURRENT_API_KEY) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Forbidden: Invalid API Key' }));
    }

    next();
};

/**
 * Función principal que configura y inicia el bot
 * @async
 * @returns {Promise<void>}
 */
const main = async () => {
  /**
   * Flujo del bot
   * @type {import('@builderbot/bot').Flow<BaileysProvider, MemoryDB>}
   */
  const adapterFlow = createFlow([]);

  /**
   * Proveedor de servicios de mensajería
   * @type {BaileysProvider}
   */
  const adapterProvider = createProvider(BaileysProvider, {
    groupsIgnore: true,
    readStatus: false,
  });

  /**
   * Base de datos en memoria para el bot
   * @type {MemoryDB}
   */
  const adapterDB = new MemoryDB();

  /**
   * Configuración y creación del bot
   * @type {import('@builderbot/bot').Bot<BaileysProvider, MemoryDB>}
   */
  const { handleCtx, httpServer } = await createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

 
  httpServer(+PORT);
  adapterProvider.server.use('/v1', apiKeyMiddleware);
  adapterProvider.server.post(
    "/v1/messages",
    handleCtx(async (bot, req, res) => {
      const { number, message } = req.body;
      await bot.sendMessage(number, message, {});
      return res.end("send");
    })
  );
};

main();
